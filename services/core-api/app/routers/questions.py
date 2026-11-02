import os
import re
import json
import base64
import hashlib
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from openai import OpenAI

from sqlalchemy import or_, and_, cast, String
from ..database import get_db
from ..models import Question, User
from ..services.quota_service import (
    require_authenticated_user,
    get_current_user_optional,
    consume_ai_quota,
    require_role,
    require_teacher_or_admin,
    require_admin,
)
from ..schemas import (
    QuestionResponse,
    PaginatedQuestionsResponse,
    QuestionVerifyToggle,
    QuestionUpdatePayload,
    QuestionDifficultyUpdate,
    SolutionOCRResponse
)

router = APIRouter(prefix="/api/questions", tags=["Questions Bank"])

@router.get("/availability-stats")
def get_questions_availability_stats(
    grade: int = Query(9),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Trả về thống kê số lượng câu hỏi sẵn sàng theo từng (main_topic, difficulty) 
    để hỗ trợ Auditor thời gian thực trong Matrix Blueprint Builder.
    """
    from sqlalchemy import func
    query = db.query(
        Question.main_topic,
        Question.difficulty,
        func.count(Question.id).label("count")
    ).filter(
        Question.is_verified == True,
        Question.grade == grade
    )

    if not current_user:
        query = query.filter(Question.is_public == True)

    results = query.group_by(Question.main_topic, Question.difficulty).all()

    stats = {}
    for topic, diff, cnt in results:
        key = f"{topic}:{diff}"
        stats[key] = cnt

    return {"grade": grade, "stats": stats}


@router.get("", response_model=PaginatedQuestionsResponse)
def list_questions(
    search: Optional[str] = Query(None),
    grade: Optional[int] = Query(None),
    section_type: Optional[str] = Query(None),
    main_topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    is_verified: Optional[bool] = Query(None),
    scope: str = Query("ALL"),  # ALL, MINE, TENANT, SYSTEM
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Question)

        # Tìm kiếm theo từ khóa nội dung đề, lời giải hoặc chủ đề
        if search and search.strip():
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Question.content_latex.ilike(search_term),
                    Question.solution_latex.ilike(search_term),
                    cast(Question.main_topic, String).ilike(search_term)
                )
            )

        # Lọc theo Scope (Cá nhân, Đơn vị, Mẫu chuẩn Vinh Phát)
        if not current_user:
            # Khách vãng lai chỉ xem được câu hỏi Mẫu chuẩn công khai
            query = query.filter(Question.is_public == True)
        else:
            scope_upper = scope.upper()
            if scope_upper == "MINE":
                # Chỉ câu hỏi do chính tài khoản này tạo / số hóa
                query = query.filter(Question.user_id == current_user.id)
            elif scope_upper == "TENANT":
                # Câu hỏi thuộc đơn vị / trường học của giáo viên
                query = query.filter(
                    Question.tenant_id == current_user.tenant_id,
                    Question.scope.in_(["TENANT", "PUBLIC"])
                )
            elif scope_upper == "SYSTEM":
                # Kho chuẩn Vinh Phát
                query = query.filter(Question.is_public == True, Question.user_id.is_(None))
            else: # "ALL"
                # Kết hợp: Của tôi + Của đơn vị + Kho chuẩn hệ thống
                query = query.filter(
                    or_(
                        Question.user_id == current_user.id,
                        and_(Question.tenant_id == current_user.tenant_id, Question.scope == "TENANT"),
                        Question.is_public == True
                    )
                )

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
    except Exception as e:
        import logging, traceback
        logging.error(f"Error in list_questions: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"ERR: {type(e).__name__}: {str(e)}")

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
    current_user: User = Depends(require_teacher_or_admin),
    db: Session = Depends(get_db)
):
    """
    Kiểm duyệt / Xác thực câu hỏi.
    - Cấp độ Vận dụng cao (VDC - Level 4): Yêu cầu vai trò ADMIN hoặc TEACHER thâm niên / tổ trưởng.
    - Các cấp độ khác (NB, TH, VD): Mở cho toàn thể TEACHER, PRO, ADMIN.
    """
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    # Kiểm tra phân quyền chuyên môn sâu: Câu hỏi VDC (difficulty == 4 hoặc contains 'VDC')
    is_vdc = q.difficulty == 4 or (q.topic and "VDC" in q.topic.upper())
    if is_vdc and current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Câu hỏi Vận dụng cao (VDC) yêu cầu Quản trị viên hoặc Giáo viên chuyên môn thẩm định"
        )

    q.is_verified = payload.is_verified
    db.commit()
    db.refresh(q)
    return q

@router.post("/{question_id}/clone-to-vault", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def clone_question_to_my_vault(
    question_id: UUID,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    """Sao chép một câu hỏi từ kho chung hoặc kho đơn vị về kho cá nhân của giáo viên."""
    original = db.query(Question).filter(Question.id == question_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi gốc")

    cloned = Question(
        id=uuid.uuid4(),
        source_exam_id=original.source_exam_id,
        original_question_number=original.original_question_number,
        section_type=original.section_type,
        structure_type=original.structure_type,
        default_points=original.default_points,
        content_latex=original.content_latex,
        normalized_hash=f"{original.normalized_hash[:32]}_{uuid.uuid4().hex[:8]}",
        sub_questions=original.sub_questions,
        solution_latex=original.solution_latex,
        final_answer=original.final_answer,
        has_figure=original.has_figure,
        figures_meta=original.figures_meta,
        grade=original.grade,
        main_topic=original.main_topic,
        sub_topics=original.sub_topics,
        solution_methods=original.solution_methods,
        difficulty=original.difficulty,
        user_difficulty=original.user_difficulty,
        custom_tags=list(original.custom_tags or []) + ["bản_sao_cá_nhân"],
        original_content_latex=original.content_latex,
        semantic_summary=original.semantic_summary,
        embedding=original.embedding,
        is_verified=True,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        scope="PRIVATE",
        is_public=False
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned

@router.delete("/{question_id}")
def delete_question(
    question_id: UUID,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Xóa vĩnh viễn câu hỏi khỏi hệ thống.
    Chỉ tác giả sở hữu hoặc Quản trị viên/Giáo viên mới có quyền thực hiện.
    """
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if current_user.role not in ["ADMIN", "TEACHER"] and q.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this question")
        
    db.delete(q)
    db.commit()
    return {"status": "success", "message": f"Question {question_id} deleted successfully"}


@router.post("/batch-import", status_code=status.HTTP_201_CREATED)
def bulk_import_questions(
    payload: dict,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Nhập danh sách câu hỏi hàng loạt vào Ngân hàng Khảo thí.
    Ràng buộc phân quyền: Chỉ ADMIN hoặc TEACHER của đơn vị mới có quyền nạp dữ liệu hàng loạt.
    """
    if current_user.role not in ["ADMIN", "TEACHER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Giáo viên (TEACHER) hoặc Quản trị viên (ADMIN) mới có quyền nhập câu hỏi hàng loạt"
        )

    questions_data = payload.get("questions", [])
    if not isinstance(questions_data, list) or len(questions_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Danh sách câu hỏi 'questions' không được để trống"
        )

    imported_ids = []
    for item in questions_data:
        content_latex = item.get("content_latex", "").strip()
        if not content_latex:
            continue
        new_q = Question(
            id=uuid.uuid4(),
            user_id=current_user.id,
            tenant_id=current_user.tenant_id,
            topic=item.get("topic", "TOAN_THPT"),
            difficulty=item.get("difficulty", 2),
            content_latex=content_latex,
            solution_latex=item.get("solution_latex"),
            options=item.get("options"),
            correct_answer=item.get("correct_answer"),
            is_verified=(current_user.role == "ADMIN"),
            created_at=datetime.now(timezone.utc)
        )
        db.add(new_q)
        imported_ids.append(str(new_q.id))

    db.commit()
    return {
        "status": "success",
        "imported_count": len(imported_ids),
        "question_ids": imported_ids,
        "message": f"Đã nhập thành công {len(imported_ids)} câu hỏi vào ngân hàng khảo thí"
    }
