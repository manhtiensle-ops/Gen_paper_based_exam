# LLM INGESTION, MATH OCR & TAGGING PIPELINE

**Module:** `services/ingestion-worker`  
**Vision Engine:** Gemini 2.5 Pro Vision API via official `google-genai` SDK  
**Output Guarantee:** Constrained JSON Decoding via Pydantic Schema + Python Normalization

---

## 1. INGESTION WORKFLOW OVERVIEW

```text
[DOCX / PDF Upload]
        │
        ▼ (LibreOffice Headless + Poppler @ 300 DPI)
[High-Res Page Images (.PNG)]
        │
        ▼ (Multi-page image stream passed to Gemini 2.5 Pro)
[Constrained JSON Schema Output (Pydantic)]
        │
        ├─► [Pillow Image Cropper] ──► Crop Figure by box_2d ──► MinIO Upload
        ├─► [LaTeX Syntax Check] ──► Verify balanced $, {}, \begin{cases}
        ├─► [Independent Splitter] ─► Separate independent parts into atomic records
        └─► [Text Embedding] ──────► Embed semantic_summary ──► PostgreSQL Transaction
```

---

## 2. PYDANTIC OUTPUT SCHEMA (vision_schema.py)

```python
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
```

---

## 3. MULTI-PAGE VISION CALL IMPLEMENTATION (vision_ocr.py)

```python
import os
from PIL import Image
from google import genai
from google.genai import types
from .vision_schema import LLMExamExtractionOutput

SYSTEM_INSTRUCTION = """
You are a lead Vietnamese Mathematics Olympiad digitizer and LaTeX typesetting specialist.
Your mission is to read all provided exam page images and extract every problem, solution, and geometric diagram into strict JSON.

CRITICAL VIETNAMESE MATH RULES:
1. STRICT LATEX ENCLOSURE:
  - Every single mathematical expression, variable ($x, y, n, p$), metric ($14\\text{ cm}$), equation, and system MUST be enclosed in `$ ... $` (inline) or `$$ ... $$` (display).
  - Use `\\begin{cases} ... \\end{cases}` for systems. Use `\\left[ \\begin{array}{l} ... \\end{array} \\right.` for multi-case brackets.
  - Fix OCR artifacts from Word documents: Convert `Sin 75^0` to `$\\sin 75^\\circ$`. If sets show broken box characters like `n \\in []`, reconstruct them based on context to `$n \\in \\mathbb{N}$`.
  - Never embed prefixes like "Câu 1:", "Giải:" inside `content_latex` or `solution_latex`.

2. MULTI-PAGE STITCHING:
- When a problem or solution spans across page boundaries, automatically merge them into a single continuous question record.

3. STRUCTURE DISCRIMINATION:
- Mark as `SINGLE` if it is a standalone question.
  - Mark as `INDEPENDENT_PARTS` if items a) and b) are completely unrelated problems bundled under one number (e.g., a) Solve equation, b) Solve system).
  - Mark as `SHARED_STEM` if a common premise precedes sub-questions a) and b) (e.g., Geometry proof on parallelogram ABCD).

4. BOUNDING BOX LOCALIZATION:
- For all geometric or technical diagrams, record `box_2d` as `[ymin, xmin, ymax, xmax]` normalized on a 0-1000 scale enclosing the entire drawing and vertex labels ($A, B, C, H, G, 60^\\circ$).
"""

def extract_exam_from_images(image_paths: list[str]) -> LLMExamExtractionOutput:
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    
    contents = []
    for idx, img_path in enumerate(image_paths, start=1):
        img = Image.open(img_path)
        contents.append(f"--- TRANG ẢNH SỐ {idx} ---")
        contents.append(img)
        
    contents.append("Hãy trích xuất toàn bộ câu hỏi và lời giải từ các trang ảnh trên theo đúng JSON Schema đã quy định.")

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.1,
            response_mime_type="application/json",
            response_schema=LLMExamExtractionOutput,
        ),
    )
    
    return response.parsed
```

---

## 4. IMAGE CROPPING & DETERMINISTIC POST-PROCESSING

### 4.1. Pillow Bounding Box Cropper (image_cropper.py)

```python
from PIL import Image

def crop_figure_box(page_image_path: str, box_2d: list[int], padding_px: int = 15) -> Image.Image:
    img = Image.open(page_image_path)
    width, height = img.size
    ymin, xmin, ymax, xmax = box_2d
    
    left = max(0, int((xmin / 1000.0) * width) - padding_px)
    top = max(0, int((ymin / 1000.0) * height) - padding_px)
    right = min(width, int((xmax / 1000.0) * width) + padding_px)
    bottom = min(height, int((ymax / 1000.0) * height) + padding_px)
    
    return img.crop((left, top, right, bottom))
```

### 4.2. Deduplication Hashing & Syntax Validation (normalizer.py)

```python
import re
import hashlib

def normalize_math_text(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\\\((.*?)\\\)", r"$\1$", text, flags=re.DOTALL)
    text = re.sub(r"\\\[(.*?)\\\]", r"$$\1$$", text, flags=re.DOTALL)
    return re.sub(r"[ \t]+", " ", text).strip()

def compute_deduplication_hash(content_latex: str, sub_questions_latex: list[str]) -> str:
    combined = content_latex + "".join(sub_questions_latex)
    # Strip whitespace to detect identical problems across different schools
    cleaned = re.sub(r"\s+", "", combined).lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def validate_latex_integrity(text: str) -> tuple[bool, str]:
    if not text:
        return True, "Valid"
    stripped = text.replace(r"\$", "")
    no_double = stripped.replace("$$", "")
    if no_double.count("$") % 2 != 0:
        return False, "Unbalanced inline math delimiter '$'"
    if stripped.count("{") != stripped.count("}"):
        return False, "Mismatched curly braces '{' and '}'"
    return True, "Valid"
```
