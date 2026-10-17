from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Question
from ..schemas import QuestionResponse, QuestionVerifyToggle

router = APIRouter(prefix="/api/questions", tags=["Questions Bank"])

@router.get("", response_model=List[QuestionResponse])
def list_questions(
    grade: Optional[int] = Query(None),
    section_type: Optional[str] = Query(None),
    main_topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    is_verified: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    query = db.query(Question)
    if grade is not None:
        query = query.filter(Question.grade == grade)
    if section_type:
        query = query.filter(Question.section_type == section_type)
    if main_topic:
        query = query.filter(Question.main_topic == main_topic)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if is_verified is not None:
        query = query.filter(Question.is_verified == is_verified)

    return query.order_by(Question.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: UUID, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q

@router.patch("/{question_id}/verify", response_model=QuestionResponse)
def toggle_verify_question(
    question_id: UUID,
    payload: QuestionVerifyToggle,
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.is_verified = payload.is_verified
    db.commit()
    db.refresh(q)
    return q

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: UUID, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return None
