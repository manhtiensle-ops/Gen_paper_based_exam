import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from celery import Celery

from ..database import get_db
from ..models import SourceExam
from ..schemas import SourceExamResponse
from ..services.minio_client import upload_file_bytes

router = APIRouter(prefix="/api/exams", tags=["Source Exams"])

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis-broker:6379/0")
celery_client = Celery("hsg_worker", broker=broker_url)

@router.post("/upload", response_model=SourceExamResponse, status_code=status.HTTP_201_CREATED)
async def upload_source_exam(
    title: str = Form(...),
    exam_level: str = Form("HSG_TINH"),
    grade: int = Form(9),
    school_or_province: str = Form(None),
    academic_year: str = Form(None),
    duration_minutes: int = Form(120),
    file: UploadFile = File(...),
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
        processing_logs=[{"timestamp": "created", "message": "Document uploaded successfully"}]
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

@router.post("/batch-upload", status_code=status.HTTP_201_CREATED)
async def batch_upload_source_exams(
    files: List[UploadFile] = File(...),
    grade: int = Form(9),
    exam_level: str = Form("HSG_TINH"),
    academic_year: str = Form(None),
    school_or_province: str = Form(None),
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
            status="UPLOADED",
            processing_logs=[{"timestamp": "created", "message": f"Tệp {filename} đã tải lên thành công qua Batch Pipeline"}]
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
def list_source_exams(db: Session = Depends(get_db)):
    return db.query(SourceExam).order_by(SourceExam.created_at.desc()).all()

@router.get("/{exam_id}", response_model=SourceExamResponse)
def get_source_exam(exam_id: uuid.UUID, db: Session = Depends(get_db)):
    exam = db.query(SourceExam).filter(SourceExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Source exam not found")
    return exam
