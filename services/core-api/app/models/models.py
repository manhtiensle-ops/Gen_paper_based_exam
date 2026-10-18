import uuid
from sqlalchemy import (
    Column, String, Integer, Numeric, Boolean, Text,
    ForeignKey, DateTime, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from ..database import Base

class SourceExam(Base):
    __tablename__ = "source_exams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    exam_level = Column(String(100), default="HSG_TINH")
    grade = Column(Integer, nullable=False, default=9)
    school_or_province = Column(String(255), nullable=True)
    academic_year = Column(String(20), nullable=True)
    duration_minutes = Column(Integer, default=120)
    original_file_key = Column(Text, nullable=False)
    page_image_keys = Column(JSONB, default=list)
    status = Column(String(50), default="UPLOADED")
    processing_logs = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_exam_id = Column(UUID(as_uuid=True), ForeignKey("source_exams.id", ondelete="SET NULL"), nullable=True)
    original_question_number = Column(Integer, nullable=False)
    
    section_type = Column(String(50), nullable=False)
    structure_type = Column(String(50), nullable=False, default="SINGLE")
    default_points = Column(Numeric(4, 2), nullable=False, default=1.0)
    
    content_latex = Column(Text, nullable=False)
    normalized_hash = Column(String(64), nullable=False)
    sub_questions = Column(JSONB, default=list)
    solution_latex = Column(Text, nullable=True)
    final_answer = Column(Text, nullable=True)
    
    has_figure = Column(Boolean, default=False)
    figures_meta = Column(JSONB, default=list)
    
    grade = Column(Integer, nullable=False, default=9)
    main_topic = Column(String(50), nullable=False)
    sub_topics = Column(JSONB, nullable=False, default=list)
    solution_methods = Column(JSONB, nullable=False, default=list)
    difficulty = Column(String(50), nullable=False, default="MEDIUM")
    user_difficulty = Column(String(50), nullable=True)
    custom_tags = Column(JSONB, nullable=False, default=list)
    original_content_latex = Column(Text, nullable=True)
    last_edited_at = Column(DateTime(timezone=True), nullable=True)
    
    semantic_summary = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)
    usage_count = Column(Integer, default=0)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ExamBlueprint(Base):
    __tablename__ = "exam_blueprints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    grade = Column(Integer, nullable=False, default=9)
    source_exam_id = Column(UUID(as_uuid=True), ForeignKey("source_exams.id", ondelete="SET NULL"), nullable=True)
    sections_config = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GeneratedExam(Base):
    __tablename__ = "generated_exams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    blueprint_id = Column(UUID(as_uuid=True), ForeignKey("exam_blueprints.id", ondelete="SET NULL"), nullable=True)
    slots_state = Column(JSONB, nullable=False)
    header_config = Column(JSONB, nullable=False, default=dict)
    health_check_report = Column(JSONB, nullable=True)
    total_target_score = Column(Numeric(4, 2), default=20.00)
    exported_docx_key = Column(Text, nullable=True)
    exported_pdf_key = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("ExamItem", back_populates="exam", cascade="all, delete-orphan", order_by="ExamItem.order_index")


class ExamItem(Base):
    __tablename__ = "exam_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("generated_exams.id", ondelete="CASCADE"), nullable=False)
    source_question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="SET NULL"), nullable=True)
    order_index = Column(Integer, nullable=False)
    display_label = Column(String(50), nullable=False)
    max_points = Column(Numeric(4, 2), default=3.00)
    problem_snapshot = Column(JSONB, nullable=False)
    rubric_data = Column(JSONB, nullable=False)
    is_ai_variant = Column(Boolean, default=False)
    variant_metadata = Column(JSONB, nullable=True)
    technique_embedding = Column(Vector(768), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    exam = relationship("GeneratedExam", back_populates="items")

