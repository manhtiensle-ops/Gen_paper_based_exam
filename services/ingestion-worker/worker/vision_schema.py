from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class SectionTypeEnum(str, Enum):
    SHORT_ANSWER = "SHORT_ANSWER"
    ESSAY = "ESSAY"

class StructureTypeEnum(str, Enum):
    SINGLE = "SINGLE"
    INDEPENDENT_PARTS = "INDEPENDENT_PARTS"
    SHARED_STEM = "SHARED_STEM"

class DifficultyEnum(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    OLYMPIAD = "OLYMPIAD"

class MainTopicEnum(str, Enum):
    ALGEBRA = "ALGEBRA"
    NUMBER_THEORY = "NUMBER_THEORY"
    PLANE_GEOMETRY = "PLANE_GEOMETRY"
    SOLID_GEOMETRY = "SOLID_GEOMETRY"
    INEQUALITY_EXTREMA = "INEQUALITY_EXTREMA"
    COMBINATORICS_PROBABILITY = "COMBINATORICS_PROBABILITY"
    REAL_WORLD_MATH = "REAL_WORLD_MATH"

class SubTopicEnum(str, Enum):
    ALG_RADICAL_SIMPLIFY = "ALG_RADICAL_SIMPLIFY"
    ALG_CONDITIONAL_EXPR = "ALG_CONDITIONAL_EXPR"
    ALG_POLYNOMIAL_DIV = "ALG_POLYNOMIAL_DIV"
    ALG_QUADRATIC_VIETA = "ALG_QUADRATIC_VIETA"
    ALG_IRRATIONAL_EQ = "ALG_IRRATIONAL_EQ"
    ALG_SYSTEM_OF_EQ = "ALG_SYSTEM_OF_EQ"
    NUM_DIOPHANTINE_EQ = "NUM_DIOPHANTINE_EQ"
    NUM_PRIME_DIVISIBILITY = "NUM_PRIME_DIVISIBILITY"
    NUM_PERFECT_SQUARE = "NUM_PERFECT_SQUARE"
    GEO_TRIANGLE_METRIC = "GEO_TRIANGLE_METRIC"
    GEO_TRIGONOMETRY = "GEO_TRIGONOMETRY"
    GEO_CIRCLE_INSCRIBED = "GEO_CIRCLE_INSCRIBED"
    GEO_SIMILARITY_COLLINEAR = "GEO_SIMILARITY_COLLINEAR"
    SOLID_PRISM_BOX = "SOLID_PRISM_BOX"
    SOLID_PYRAMID_CYLINDER = "SOLID_PYRAMID_CYLINDER"
    INEQ_ALGEBRAIC = "INEQ_ALGEBRAIC"
    INEQ_GEOMETRIC = "INEQ_GEOMETRIC"
    COMB_PROBABILITY = "COMB_PROBABILITY"
    COMB_DIRICHLET_INVARIANT = "COMB_DIRICHLET_INVARIANT"
    REAL_MOTION_WORK = "REAL_MOTION_WORK"
    REAL_OPTIMIZATION = "REAL_OPTIMIZATION"

class FigurePlacementEnum(str, Enum):
    STEM = "STEM"
    SOLUTION = "SOLUTION"

class FigurePositionEnum(str, Enum):
    RIGHT_FLOAT = "RIGHT_FLOAT"
    CENTER_BLOCK = "CENTER_BLOCK"

class LLMFigureBox(BaseModel):
    page_number: int = Field(description="1-based page index where the figure is located")
    box_2d: List[int] = Field(description="Normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000 enclosing figure and labels")
    placement_target: FigurePlacementEnum
    position: FigurePositionEnum
    caption: str = Field(description="Brief Vietnamese description of the figure")

class LLMSubQuestion(BaseModel):
    part_id: str = Field(description="Sub-part key: 'a', 'b', 'c'")
    label: str = Field(description="Display label: 'a)', 'b)'")
    points: Optional[float] = None
    content_latex: str = Field(description="Question body for this sub-part, with math enclosed in $...$")
    solution_latex: Optional[str] = Field(default=None, description="Step-by-step solution for this sub-part")
    final_answer: Optional[str] = None
    main_topic: MainTopicEnum
    sub_topics: List[SubTopicEnum]
    solution_methods: List[str]
    difficulty: DifficultyEnum
    semantic_summary: str = Field(description="Mathematical explanation in Vietnamese for vector embedding")

class LLMExtractedQuestion(BaseModel):
    question_number: int
    section_type: SectionTypeEnum
    structure_type: StructureTypeEnum
    points: float = 1.0
    content_latex: str = Field(description="Primary stem or shared premise. Formulas must be enclosed in $...$ or $$...$$")
    sub_questions: List[LLMSubQuestion] = Field(default_factory=list)
    solution_latex: Optional[str] = None
    final_answer: Optional[str] = None
    figures: List[LLMFigureBox] = Field(default_factory=list)
    main_topic: MainTopicEnum
    sub_topics: List[SubTopicEnum]
    solution_methods: List[str]
    difficulty: DifficultyEnum
    semantic_summary: str = Field(description="Detailed 3-4 sentence Vietnamese summary of the mathematical technique and structure for vector embedding")

class LLMExamExtractionOutput(BaseModel):
    exam_title: str
    school_or_province: Optional[str] = None
    academic_year: Optional[str] = None
    duration_minutes: int = 120
    questions: List[LLMExtractedQuestion]
