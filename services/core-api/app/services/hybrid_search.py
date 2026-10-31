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
    limit: int = 10
) -> List[Question]:
    """
    Hybrid Search:
    - Filters deterministically by SQL attributes (is_verified = TRUE, grade, section_type, main_topic, difficulty)
    - If reference_embedding is provided, ranks results by Cosine Distance using pgvector (<=> operator).
    - Otherwise sorts by usage_count ASC to favor under-used questions.
    """
    query = db.query(Question).filter(Question.is_verified == True, Question.grade == grade)

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

    # THUẬT TOÁN FALLBACK THÔNG MINH CHO SHORT_ANSWER:
    # Nếu slot yêu cầu SHORT_ANSWER mà ngân hàng chưa có, tự động tìm câu ESSAY có đáp số ngắn (final_answer) để lấp slot
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

    return results
