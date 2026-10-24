import os
import re
import json
import base64
import hashlib
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from openai import OpenAI

from ..database import get_db
from ..models import Question, User
from ..services.quota_service import require_authenticated_user, consume_ai_quota
from ..schemas import (
    QuestionResponse,
    PaginatedQuestionsResponse,
    QuestionVerifyToggle,
    QuestionUpdatePayload,
    QuestionDifficultyUpdate,
    SolutionOCRResponse
)

router = APIRouter(prefix="/api/questions", tags=["Questions Bank"])

@router.get("", response_model=PaginatedQuestionsResponse)
def list_questions(
    grade: Optional[int] = Query(None),
    section_type: Optional[str] = Query(None),
    main_topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    is_verified: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
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

    total = query.count()
    offset = (page - 1) * page_size
    items = query.order_by(Question.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: UUID, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q

@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(
    question_id: UUID,
    payload: QuestionUpdatePayload,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if payload.content_latex is not None:
        if q.original_content_latex is None:
            q.original_content_latex = q.content_latex
        q.content_latex = payload.content_latex.strip()
        
    if payload.sub_questions is not None:
        q.sub_questions = payload.sub_questions
    if payload.solution_latex is not None:
        q.solution_latex = payload.solution_latex
    if payload.final_answer is not None:
        q.final_answer = payload.final_answer
    if payload.main_topic is not None:
        q.main_topic = payload.main_topic
    if payload.sub_topics is not None:
        q.sub_topics = payload.sub_topics
    if payload.difficulty is not None:
        q.difficulty = payload.difficulty
    if payload.user_difficulty is not None:
        q.user_difficulty = payload.user_difficulty
    if payload.custom_tags is not None:
        q.custom_tags = payload.custom_tags
    if payload.default_points is not None:
        q.default_points = payload.default_points

    # Recalculate deduplication hash
    sub_texts = [sq.get("content_latex", "") for sq in (q.sub_questions or []) if isinstance(sq, dict)]
    combined = (q.content_latex or "") + "".join(sub_texts)
    cleaned = re.sub(r"\s+", "", combined).lower()
    q.normalized_hash = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

    q.last_edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(q)
    return q

@router.patch("/{question_id}/difficulty", response_model=QuestionResponse)
def update_question_difficulty(
    question_id: UUID,
    payload: QuestionDifficultyUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if payload.difficulty:
        q.difficulty = payload.difficulty
    if payload.user_difficulty is not None:
        q.user_difficulty = payload.user_difficulty

    q.last_edited_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(q)
    return q

@router.post("/{question_id}/solution/ocr", response_model=SolutionOCRResponse)
async def ocr_solution_for_question(
    question_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    consume_ai_quota(current_user, cost=1)
    """
    Upload an image/PDF containing a solution.
    Invokes OmniRoute Flash (antigravity/gemini-3.8-flash-tiered) to OCR into LaTeX and attaches it to the question.
    """
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    file_bytes = await file.read()
    b64_data = base64.b64encode(file_bytes).decode("utf-8")

    omniroute_key = (os.getenv("OMNIROUTE_API_KEY") or "").strip(' "\'')
    omniroute_base_url = (os.getenv("OMNIROUTE_BASE_URL") or "http://192.168.1.117:20128/v1").strip(' "\'')
    model_name = (os.getenv("OMNIROUTE_VISION_MODEL") or "antigravity/gemini-3.8-flash-tiered").strip(' "\'')

    if not omniroute_key:
        raise HTTPException(status_code=500, detail="OmniRoute API Key not configured")

    client = OpenAI(api_key=omniroute_key, base_url=omniroute_base_url)

    prompt = f"""
Bạn là chuyên gia số hóa đáp án & lời giải Toán THCS Việt Nam.
Đề bài tương ứng của câu hỏi này là:
\"\"\"{q.content_latex}\"\"\"

Hãy đọc tài liệu / hình ảnh lời giải được cung cấp và chuyển đổi thành lời giải chi tiết chuẩn LaTeX:
1. Mọi công thức, phương trình, biến số PHẢI đặt trong $...$ hoặc $$...$$.
2. Hệ phương trình dùng \\begin{{cases}} ... \\end{{cases}}. Ký hiệu góc dùng \\widehat{{ABC}}, độ dùng ^\\circ.
3. Trích xuất đáp số cuối cùng (nếu có) vào trường "final_answer".
4. Viết lời giải chi tiết từng bước lập luận rõ ràng vào trường "solution_latex".

Trả về JSON nghiêm ngặt:
{{
  "solution_latex": "Nội dung lời giải LaTeX...",
  "final_answer": "Đáp số cuối cùng..."
}}
"""

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                    ]
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content or "{}"
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(?:json)?\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json)
            
        data = json.loads(clean_json)
        sol_latex = data.get("solution_latex", "")
        final_ans = data.get("final_answer", "")

        # Update question record
        if sol_latex:
            q.solution_latex = sol_latex
        if final_ans:
            q.final_answer = final_ans
            
        q.last_edited_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(q)

        return SolutionOCRResponse(
            solution_latex=sol_latex,
            final_answer=final_ans,
            notes="Đã bóc tách và tự động lưu vào câu hỏi thành công."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Solution failed: {str(e)}")

@router.post("/{question_id}/revert", response_model=QuestionResponse)
def revert_question_content(question_id: UUID, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if q.original_content_latex:
        q.content_latex = q.original_content_latex
        q.last_edited_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(q)
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
def delete_question(
    question_id: UUID,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return None
