from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models import Question

def search_candidate_questions(
    db: Session,
    grade: int = 9,
    section_type: Optional[str] = None,
    main_topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    structure_type: Optional[str] = None,
    reference_embedding: Optional[List[float]] = None,
    exclude_ids: Optional[List[UUID]] = None,
    tenant_id: Optional[str] = None,
    user_id: Optional[UUID] = None,
    limit: int = 10
) -> List[Question]:
    """
    Hybrid Search:
    - Filters deterministically by SQL attributes (is_verified = TRUE, grade, section_type, main_topic, difficulty)
    - Enforces Multi-Tenancy isolation: only matches PUBLIC questions or questions owned by current tenant/user
    - If reference_embedding is provided, ranks results by Cosine Distance using pgvector (<=> operator).
    - Otherwise sorts by usage_count ASC to favor under-used questions.
    """
    query = db.query(Question).filter(Question.is_verified == True, Question.grade == grade)

    # Multi-tenancy isolation filter
    if user_id or tenant_id:
        conditions = [Question.scope == "PUBLIC"]
        if user_id:
            conditions.append(Question.user_id == user_id)
        if tenant_id:
            conditions.append(Question.tenant_id == tenant_id)
        from sqlalchemy import or_
        query = query.filter(or_(*conditions))
    else:
        query = query.filter(Question.scope == "PUBLIC")

    if section_type:
        query = query.filter(Question.section_type == section_type)
    if main_topic:
        query = query.filter(Question.main_topic == main_topic)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if structure_type:
        # Chuẩn hóa nếu blueprint truyền MULTI_PART
        valid_structs = {"SINGLE", "INDEPENDENT_PARTS", "SHARED_STEM"}
        if structure_type in valid_structs:
            query = query.filter(Question.structure_type == structure_type)
        elif structure_type == "MULTI_PART":
            query = query.filter(Question.structure_type.in_(["INDEPENDENT_PARTS", "SHARED_STEM"]))
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))

    if reference_embedding is not None and len(reference_embedding) == 768:
        # Rank by vector cosine similarity
        embedding_str = str(reference_embedding)
        query = query.order_by(
            Question.embedding.cosine_distance(embedding_str)
        )
    else:
        query = query.order_by(Question.usage_count.asc(), Question.created_at.desc())

    results = query.limit(limit).all()

    # THUẬT TOÁN TIERED FALLBACK THÔNG MINH:
    # 1. Nếu slot yêu cầu SHORT_ANSWER mà ngân hàng chưa có, tìm câu ESSAY có đáp số ngắn (final_answer)
    if not results and section_type == "SHORT_ANSWER":
        fallback_query = db.query(Question).filter(
            Question.is_verified == True,
            Question.grade == grade,
            Question.final_answer.isnot(None)
        )
        if main_topic:
            fallback_query = fallback_query.filter(Question.main_topic == main_topic)
        if difficulty:
            fallback_query = fallback_query.filter(Question.difficulty == difficulty)
        if exclude_ids:
            fallback_query = fallback_query.filter(~Question.id.in_(exclude_ids))
        fallback_query = fallback_query.order_by(Question.usage_count.asc(), Question.created_at.desc())
        results = fallback_query.limit(limit).all()

    # 2. Nếu vẫn trống (ví dụ do ràng buộc structure_type quá ngặt), nới lỏng structure_type
    if not results and structure_type:
        fb_query2 = db.query(Question).filter(
            Question.is_verified == True,
            Question.grade == grade
        )
        if section_type:
            fb_query2 = fb_query2.filter(Question.section_type == section_type)
        if main_topic:
            fb_query2 = fb_query2.filter(Question.main_topic == main_topic)
        if difficulty:
            fb_query2 = fb_query2.filter(Question.difficulty == difficulty)
        if exclude_ids:
            fb_query2 = fb_query2.filter(~Question.id.in_(exclude_ids))
        fb_query2 = fb_query2.order_by(Question.usage_count.asc(), Question.created_at.desc())
        results = fb_query2.limit(limit).all()

    # 3. Nếu vẫn trống, nới lỏng tiếp difficulty (giữ nguyên chuyên đề & loại phần)
    if not results and main_topic:
        fb_query3 = db.query(Question).filter(
            Question.is_verified == True,
            Question.grade == grade
        )
        if section_type:
            fb_query3 = fb_query3.filter(Question.section_type == section_type)
        fb_query3 = fb_query3.filter(Question.main_topic == main_topic)
        if exclude_ids:
            fb_query3 = fb_query3.filter(~Question.id.in_(exclude_ids))
        fb_query3 = fb_query3.order_by(Question.usage_count.asc(), Question.created_at.desc())
        results = fb_query3.limit(limit).all()

    # 4. Fallback cuối cùng: Lấy câu hỏi bất kỳ cùng khối lớp và loại phần để giáo viên không bị trắng bảng
    if not results:
        fb_query4 = db.query(Question).filter(
            Question.is_verified == True,
            Question.grade == grade
        )
        if section_type:
            fb_query4 = fb_query4.filter(Question.section_type == section_type)
        if exclude_ids:
            fb_query4 = fb_query4.filter(~Question.id.in_(exclude_ids))
        fb_query4 = fb_query4.order_by(Question.usage_count.asc(), Question.created_at.desc())
        results = fb_query4.limit(limit).all()

    return results
