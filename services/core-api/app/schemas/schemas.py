from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class SourceExamBase(BaseModel):
    title: str
    exam_level: Optional[str] = "HSG_TINH"
    grade: int = 9
    school_or_province: Optional[str] = None
    academic_year: Optional[str] = None
    duration_minutes: int = 120

class SourceExamCreate(SourceExamBase):
    pass

class SourceExamResponse(SourceExamBase):
    id: UUID
    original_file_key: str
    page_image_keys: List[str] = Field(default_factory=list)
    status: str
    processing_logs: List[Any] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionBase(BaseModel):
    original_question_number: int
    section_type: str
    structure_type: str = "SINGLE"
    default_points: float = 1.0
    content_latex: str
    sub_questions: List[Dict[str, Any]] = Field(default_factory=list)
    solution_latex: Optional[str] = None
    final_answer: Optional[str] = None
    has_figure: bool = False
    figures_meta: List[Dict[str, Any]] = Field(default_factory=list)
    grade: int = 9
    main_topic: str
    sub_topics: List[str] = Field(default_factory=list)
    solution_methods: List[str] = Field(default_factory=list)
    difficulty: str = "MEDIUM"
    semantic_summary: str

class QuestionResponse(QuestionBase):
    id: UUID
    source_exam_id: Optional[UUID] = None
    normalized_hash: str
    usage_count: int = 0
    is_verified: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionVerifyToggle(BaseModel):
    is_verified: bool

class BlueprintSlot(BaseModel):
    slot_index: int
    section_type: str
    main_topic: str
    sub_topic: Optional[str] = None
    difficulty: str
    structure_type: Optional[str] = None
    points: float = 1.0
    reference_question_id: Optional[UUID] = None

class ExamBlueprintCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grade: int = 9
    source_exam_id: Optional[UUID] = None
    sections_config: List[Dict[str, Any]]

class ExamBlueprintResponse(ExamBlueprintCreate):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class GenerateExamRequest(BaseModel):
    title: str
    blueprint_id: UUID
    similarity_threshold: float = 0.65
    exclude_question_ids: List[UUID] = Field(default_factory=list)

class SwapQuestionRequest(BaseModel):
    current_question_id: UUID
    main_topic: Optional[str] = None
    difficulty: Optional[str] = None
    exclude_question_ids: List[UUID] = Field(default_factory=list)

class GeneratedExamResponse(BaseModel):
    id: UUID
    title: str
    blueprint_id: Optional[UUID] = None
    slots_state: List[Dict[str, Any]]
    exported_docx_key: Optional[str] = None
    exported_pdf_key: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
