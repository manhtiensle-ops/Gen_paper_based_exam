import os
import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from celery import Celery

from ..database import get_db
from ..models import SourceExam, User
from ..schemas import SourceExamResponse
from ..services.minio_client import upload_file_bytes
from ..services.quota_service import require_authenticated_user, get_current_user_optional, consume_ai_quota
from sqlalchemy import or_, and_

router = APIRouter(prefix="/api/exams", tags=["Source Exams"])

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis-broker:6379/0")
celery_client = Celery("hsg_worker", broker=broker_url)

@router.post("/upload", response_model=SourceExamResponse, status_code=status.HTTP_201_CREATED)
async def upload_source_exam(
    file: UploadFile = File(...),
    title: str = Form(...),
    exam_level: str = Form("HSG_TINH"),
    grade: int = Form(9),
    school_or_province: str = Form(None),
    academic_year: str = Form(None),
    duration_minutes: int = Form(120),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    exam_id = uuid.uuid4()
    filename = file.filename or "exam_document.pdf"
    file_bytes = await file.read()
    
    # Store original document into MinIO bucket
    file_key = f"exams/{exam_id}/original/{filename}"
    upload_file_bytes(file_bytes, file_key, content_type=file.content_type or "application/octet-stream")

    exam_record = SourceExam(
        id=exam_id,
        title=title,
        exam_level=exam_level,
        grade=grade,
        school_or_province=school_or_province,
        academic_year=academic_year,
        duration_minutes=duration_minutes,
        original_file_key=file_key,
        status="UPLOADED",
        user_id=current_user.id if current_user else None,
        scope="PRIVATE" if current_user else "PUBLIC",
        is_public=False if current_user else True,
        processing_logs=[{"step": "UPLOAD", "status": "COMPLETED", "message": f"Saved file to {file_key}"}]
    )
    db.add(exam_record)
    db.commit()
    db.refresh(exam_record)

    # Dispatch ingestion worker Celery task
    try:
        celery_client.send_task(
            "worker.tasks.process_exam_document",
            args=[str(exam_id), file_key]
        )
    except Exception as exc:
        print(f"[Celery Dispatch Error] {exc}")

    return exam_record

@router.post("/stage-single", status_code=status.HTTP_201_CREATED)
async def stage_single_source_exam(
    file: UploadFile = File(...),
    grade: int = Form(9),
    exam_level: str = Form("HSG_TINH"),
    academic_year: str = Form(None),
    school_or_province: str = Form(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Giai đoạn 1: Lưu trữ nhanh 1 file đề thi thô vào MinIO và tạo bản ghi STAGED trong DB.
    Không gọi LLM/OCR ngay để tránh nghẽn mạng và timeout khi tải hàng loạt.
    """
    filename = file.filename or "exam_document.pdf"
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="File nội dung rỗng")
        
    exam_id = uuid.uuid4()
    
    clean_title = filename
    for ext in [".docx", ".pdf", ".DOCX", ".PDF"]:
        if clean_title.endswith(ext):
            clean_title = clean_title[:-len(ext)]
            break
    clean_title = clean_title.replace("_", " ").replace("-", " ").strip()
    
    file_key = f"exams/{exam_id}/original/{filename}"
    upload_file_bytes(
        file_bytes, 
        file_key, 
        content_type=file.content_type or "application/octet-stream"
    )

    exam_record = SourceExam(
        id=exam_id,
        title=clean_title,
        exam_level=exam_level,
        grade=grade,
        school_or_province=school_or_province,
        academic_year=academic_year,
        duration_minutes=120,
        original_file_key=file_key,
        user_id=current_user.id if current_user else None,
        scope="PRIVATE" if current_user else "PUBLIC",
        is_public=False if current_user else True,
        status="UPLOADED",
        processing_logs=[{"step": "STAGE_UPLOAD", "status": "COMPLETED", "message": f"Saved file to {file_key}"}]
    )
    db.add(exam_record)
    db.commit()
    db.refresh(exam_record)

    return {
        "status": "STAGED",
        "exam_id": str(exam_record.id),
        "title": exam_record.title,
        "file_key": exam_record.original_file_key
    }


class TriggerBatchOcrRequest(BaseModel):
    exam_ids: List[str]


@router.post("/trigger-batch-ocr")
def trigger_batch_ocr(
    payload: TriggerBatchOcrRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Giai đoạn 2: Tiếp nhận danh sách các exam_id đã stage thành công và nạp vào Celery Worker để chạy OCR đồng loạt.
    """
    if not payload.exam_ids:
        return {"status": "SUCCESS", "dispatched_count": 0}

    valid_exams = db.query(SourceExam).filter(SourceExam.id.in_(payload.exam_ids)).all()
    dispatched = []

    for exam in valid_exams:
        try:
            celery_client.send_task(
                "worker.tasks.process_exam_document",
                args=[str(exam.id), exam.original_file_key]
            )
            exam.status = "QUEUED_OCR"
            dispatched.append(str(exam.id))
        except Exception as exc:
            print(f"[Celery Batch Trigger Error for {exam.id}]: {exc}")

    db.commit()

    return {
        "status": "SUCCESS",
        "dispatched_count": len(dispatched),
        "dispatched_ids": dispatched
    }


@router.post("/batch-upload", status_code=status.HTTP_201_CREATED)
async def batch_upload_source_exams(
    files: List[UploadFile] = File(...),
    grade: int = Form(9),
    exam_level: str = Form("HSG_TINH"),
    academic_year: str = Form(None),
    school_or_province: str = Form(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Tiếp nhận nhiều tệp đề thi (.docx / .pdf), lưu trữ MinIO và dispatch Celery tasks ngầm."""
    created_records = []
    
    for file in files:
        filename = file.filename or "exam_document.pdf"
        file_bytes = await file.read()
        if not file_bytes:
            continue
            
        exam_id = uuid.uuid4()
        
        # Tự động trích xuất tiêu đề sạch từ tên file
        clean_title = filename
        for ext in [".docx", ".pdf", ".DOCX", ".PDF"]:
            if clean_title.endswith(ext):
                clean_title = clean_title[:-len(ext)]
                break
        clean_title = clean_title.replace("_", " ").replace("-", " ").strip()
        
        # Lưu file gốc vào MinIO
        file_key = f"exams/{exam_id}/original/{filename}"
        upload_file_bytes(
            file_bytes, 
            file_key, 
            content_type=file.content_type or "application/octet-stream"
        )

        exam_record = SourceExam(
            id=exam_id,
            title=clean_title,
            exam_level=exam_level,
            grade=grade,
            school_or_province=school_or_province,
            academic_year=academic_year,
            duration_minutes=120,
            original_file_key=file_key,
            user_id=current_user.id if current_user else None,
            scope="PRIVATE" if current_user else "PUBLIC",
            is_public=False if current_user else True,
            status="UPLOADED",
            processing_logs=[{"step": "BATCH_UPLOAD", "status": "COMPLETED", "message": f"Saved file to {file_key}"}]
        )
        db.add(exam_record)
        created_records.append(exam_record)

    db.commit()

    # Kích hoạt worker Celery xử lý từng đề
    for record in created_records:
        try:
            celery_client.send_task(
                "worker.tasks.process_exam_document",
                args=[str(record.id), record.original_file_key]
            )
        except Exception as exc:
            print(f"[Celery Batch Dispatch Error] {exc}")

    return {
        "status": "SUCCESS",
        "total_uploaded": len(created_records),
        "exams": [{"id": str(r.id), "title": r.title, "file_key": r.original_file_key} for r in created_records]
    }


@router.get("", response_model=List[SourceExamResponse])
def list_source_exams(
    scope: str = "ALL",
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(SourceExam)
    if not current_user:
        # GUEST chỉ xem đề thi mẫu công khai (nếu có)
        query = query.filter(SourceExam.is_public == True)
    else:
        scope_upper = scope.upper()
        if scope_upper == "MINE":
            query = query.filter(SourceExam.user_id == current_user.id)
        elif scope_upper == "SYSTEM":
            query = query.filter(SourceExam.is_public == True)
        else: # "ALL"
            query = query.filter(
                or_(
                    SourceExam.user_id == current_user.id,
                    SourceExam.is_public == True
                )
            )

    return query.order_by(SourceExam.created_at.desc()).all()

@router.get("/{exam_id}", response_model=SourceExamResponse)
def get_source_exam(exam_id: uuid.UUID, db: Session = Depends(get_db)):
    exam = db.query(SourceExam).filter(SourceExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Source exam not found")
    return exam
