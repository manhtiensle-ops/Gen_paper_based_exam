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
    user_difficulty: Optional[str] = None
    custom_tags: List[str] = Field(default_factory=list)
    semantic_summary: str
    original_content_latex: Optional[str] = None
    last_edited_at: Optional[datetime] = None

class QuestionResponse(QuestionBase):
    id: UUID
    source_exam_id: Optional[UUID] = None
    normalized_hash: str
    usage_count: int = 0
    is_verified: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class QuestionUpdatePayload(BaseModel):
    content_latex: Optional[str] = None
    sub_questions: Optional[List[Dict[str, Any]]] = None
    solution_latex: Optional[str] = None
    final_answer: Optional[str] = None
    main_topic: Optional[str] = None
    sub_topics: Optional[List[str]] = None
    difficulty: Optional[str] = None
    user_difficulty: Optional[str] = None
    custom_tags: Optional[List[str]] = None
    default_points: Optional[float] = None

class QuestionDifficultyUpdate(BaseModel):
    difficulty: Optional[str] = None
    user_difficulty: Optional[str] = None

class SolutionOCRResponse(BaseModel):
    solution_latex: str
    final_answer: Optional[str] = None
    notes: Optional[str] = None

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
    header_config: Optional[Dict[str, Any]] = None
    health_check_report: Optional[Dict[str, Any]] = None
    total_target_score: Optional[float] = 20.00
    exported_docx_key: Optional[str] = None
    exported_pdf_key: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== EXAM STUDIO SCHEMAS ====================

class RubricStepSchema(BaseModel):
    step_order: int
    milestone_tag: str
    latex_content: str
    allocated_quanta: int = Field(ge=1, le=12, description="1 quantum = 0.25 điểm")
    points: float = Field(default=0.25)
    is_locked: bool = False


class RubricSubPartSchema(BaseModel):
    part_id: str
    part_label: str
    part_title: Optional[str] = None
    sub_max_points: float = 1.0
    steps: List[RubricStepSchema] = Field(default_factory=list)


class ExamItemRubricData(BaseModel):
    target_total_quanta: int
    pedagogical_analysis: Optional[str] = None
    sub_parts: List[RubricSubPartSchema] = Field(default_factory=list)
    steps: List[RubricStepSchema] = Field(default_factory=list)


class ExamItemResponse(BaseModel):
    id: UUID
    exam_id: UUID
    source_question_id: Optional[UUID] = None
    order_index: int
    display_label: str
    max_points: float
    problem_snapshot: Dict[str, Any]
    rubric_data: Dict[str, Any]
    is_ai_variant: bool = False
    variant_metadata: Optional[Dict[str, Any]] = None
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UpdateExamHeaderRequest(BaseModel):
    header_config: Dict[str, Any]


class ReorderExamItemsRequest(BaseModel):
    item_orders: List[Dict[str, Any]] # [{"item_id": UUID, "order_index": int}]


class AutoSplitRubricRequest(BaseModel):
    max_points: Optional[float] = None
    force_recalculate: bool = False


class GenerateVariantRequest(BaseModel):
    instructions: Optional[str] = "Giữ nguyên phương pháp, đổi số liệu nghiệm nguyên đẹp"

