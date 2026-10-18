import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

raw_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@postgres-db:5432/hsg_math")
if raw_url.startswith("postgresql://"):
    DATABASE_URL = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    DATABASE_URL = raw_url

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_exam_status(exam_id: str, status: str, page_images: list[str] = None, log_entry: str = None):
    with engine.begin() as conn:
        if page_images is not None:
            conn.execute(
                text("""
                    UPDATE source_exams 
                    SET status = :status, page_image_keys = CAST(:page_images AS jsonb), updated_at = CURRENT_TIMESTAMP
                    WHERE id = :exam_id
                """),
                {"status": status, "page_images": str(page_images).replace("'", '"'), "exam_id": exam_id}
            )
        else:
            conn.execute(
                text("""
                    UPDATE source_exams 
                    SET status = :status, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :exam_id
                """),
                {"status": status, "exam_id": exam_id}
            )
            
        if log_entry:
            conn.execute(
                text("""
                    UPDATE source_exams 
                    SET processing_logs = processing_logs || CAST(:log AS jsonb)
                    WHERE id = :exam_id
                """),
                {"log": f'["{log_entry}"]', "exam_id": exam_id}
            )

def insert_extracted_question(
    source_exam_id: str,
    original_question_number: int,
    section_type: str,
    structure_type: str,
    default_points: float,
    content_latex: str,
    normalized_hash: str,
    sub_questions: list,
    solution_latex: str,
    final_answer: str,
    has_figure: bool,
    figures_meta: list,
    grade: int,
    main_topic: str,
    sub_topics: list,
    solution_methods: list,
    difficulty: str,
    semantic_summary: str,
    embedding: list
):
    import json
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO questions (
                    source_exam_id, original_question_number, section_type, structure_type,
                    default_points, content_latex, normalized_hash, sub_questions,
                    solution_latex, final_answer, has_figure, figures_meta, grade,
                    main_topic, sub_topics, solution_methods, difficulty,
                    semantic_summary, embedding, is_verified
                ) VALUES (
                    :source_exam_id, :original_question_number, :section_type, :structure_type,
                    :default_points, :content_latex, :normalized_hash, CAST(:sub_questions AS jsonb),
                    :solution_latex, :final_answer, :has_figure, CAST(:figures_meta AS jsonb), :grade,
                    :main_topic, CAST(:sub_topics AS jsonb), CAST(:solution_methods AS jsonb), :difficulty,
                    :semantic_summary, CAST(:embedding AS vector), TRUE
                )
            """),
            {
                "source_exam_id": source_exam_id,
                "original_question_number": original_question_number,
                "section_type": section_type,
                "structure_type": structure_type,
                "default_points": default_points,
                "content_latex": content_latex,
                "normalized_hash": normalized_hash,
                "sub_questions": json.dumps(sub_questions),
                "solution_latex": solution_latex,
                "final_answer": final_answer,
                "has_figure": has_figure,
                "figures_meta": json.dumps(figures_meta),
                "grade": grade,
                "main_topic": main_topic,
                "sub_topics": json.dumps(sub_topics),
                "solution_methods": json.dumps(solution_methods),
                "difficulty": difficulty,
                "semantic_summary": semantic_summary,
                "embedding": str(embedding)
            }
        )
