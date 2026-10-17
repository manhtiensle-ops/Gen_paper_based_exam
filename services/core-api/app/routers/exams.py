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

@router.get("", response_model=List[SourceExamResponse])
def list_source_exams(db: Session = Depends(get_db)):
    return db.query(SourceExam).order_by(SourceExam.created_at.desc()).all()

@router.get("/{exam_id}", response_model=SourceExamResponse)
def get_source_exam(exam_id: uuid.UUID, db: Session = Depends(get_db)):
    exam = db.query(SourceExam).filter(SourceExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Source exam not found")
    return exam
