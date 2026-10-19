# BẢN THIẾT KẾ: Fixed-Layout Exam Template Engine
## Hệ thống sinh đề thi & hướng dẫn chấm theo khung mẫu chuẩn Bộ/Sở GD&ĐT

**Ngày soạn:** 19/10/2026
**Trạng thái:** CHỜ DUYỆT — CHƯA CODE
**Tài liệu tham khảo:** `thiet_ke_khung_de_thi_va_prompt_coding_agent.md` (bản phân tích gốc của Argon 4)

---

## 1. Bối Cảnh & Vấn Đề Cần Giải Quyết

### 1.1. Thực trạng hiện tại của hệ thống

Hiện tại hệ thống HSG Math Exam Studio đã có:
- **Ngân hàng câu hỏi** (bảng `questions`): 44+ câu hỏi đã được số hóa từ đề thi mẫu, mỗi câu có `content_latex`, `solution_latex`, `main_topic`, `difficulty`, `sub_questions`.
- **Tổ hợp đề thi** (bảng `generated_exams`): Cho phép chọn câu hỏi theo ma trận (Blueprint) và sinh đề.
- **Exam Studio** (bảng `exam_items`): Workspace chế bản Overleaf-style với Live PDF Canvas, cho phép gõ sửa LaTeX trực tiếp (`Ctrl+S`), kéo thả thanh chia đôi, AI Co-pilot dán ảnh.
- **Export Engine**: TeX Live biên dịch PDF native (<0.3s) + Word OMML native (`docx_math_builder.py`).

### 1.2. Những gì còn thiếu (Gap Analysis so với file mẫu thực tế)

Phân tích file `ĐỀ THI CHỌN V Chiến gửi Lê Hữu Vinh.docx` cho thấy một đề thi HSG thực tế tuân theo **khung chuẩn 2 phần** hoàn toàn khác với cách hệ thống hiện tại đang render:

| Yếu tố | Hệ thống hiện tại | Yêu cầu thực tế (file mẫu) |
| :--- | :--- | :--- |
| **Cấu trúc đề** | Liệt kê tuần tự tất cả câu hỏi | **Phần I: Ghi kết quả** (trắc nghiệm/điền khuyết, 0.5đ/câu) + **Phần II: Tự luận** (đề bài tường minh) |
| **Bảng đáp án trắc nghiệm** | Không có | Bảng lưới 6 cột × N hàng (Câu 1–6 / Câu 7–12), mỗi ô chứa đáp số ngắn |
| **Hướng dẫn giải trắc nghiệm** | Không có | Mỗi câu từ Phần I có `HD:` (hướng dẫn giải ngắn gọn) |
| **Bảng Hướng dẫn chấm tự luận** | Render TeX tự do (không có cột điểm) | Bảng 3 cột cố định `Câu │ Nội dung │ Điểm` với sub-row per step, điểm căn ngang tuyệt đối |
| **Cột Điểm lệch dòng** | N/A | File Word mẫu bị lệch vì nhồi tất cả bước vào 1 ô rồi Enter thủ công. **Cần kỹ thuật Sub-Row + Rowspan** |
| **Hình vẽ hình học** | Chưa tích hợp vào bảng chấm | Cần layout 2 cột trong ô Nội dung (70% chữ – 30% hình) |

### 1.3. Mục tiêu thiết kế

> **Tách biệt triệt để: AI chỉ sinh JSON cấu trúc — Template Engine dựng khung bảng.**
> AI không bao giờ tự sinh HTML table, LaTeX tabular hay Word XML. Mọi bố cục khung, đường kẻ, gộp ô đều do Template Engine kiểm soát 100%.

---

## 2. Kiến Trúc 3 Tầng

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TẦNG 1: AI CONTENT GENERATOR                          │
│                                                                           │
│  Input:  Câu hỏi từ ngân hàng (questions DB) + chỉ thị của giáo viên     │
│  Output: ExamDocumentJSON (tuân thủ ExamDocumentSchema)                    │
│  Model:  antigravity/gemini-3.8-flash-tiered qua OmniRoute                │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ {                                                                    │  │
│  │   "metadata": { exam_title, grade_and_year, subject, duration },     │  │
│  │   "part1_short_answer": {                                            │  │
│  │     "questions": [                                                   │  │
│  │       { number, prompt_latex, short_answer_latex, solution_hint }     │  │
│  │     ]                                                                │  │
│  │   },                                                                 │  │
│  │   "part2_essay": {                                                   │  │
│  │     "questions": [                                                   │  │
│  │       {                                                              │  │
│  │         sub_label: "Câu 14a\n(2,0 điểm)",                           │  │
│  │         total_points: 2.0,                                           │  │
│  │         prompt_latex: "Giải phương trình $\\sqrt{15x-10}+...$",      │  │
│  │         grading_steps: [                                             │  │
│  │           { step_id, latex_content, points: 0.25, tikz_code? }       │  │
│  │         ]                                                            │  │
│  │       }                                                              │  │
│  │     ]                                                                │  │
│  │   }                                                                  │  │
│  │ }                                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Validator: sum(step.points) == question.total_points (sai số < 1e-6)     │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ JSON hợp lệ
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                TẦNG 2: FIXED-LAYOUT TEMPLATE ENGINE                       │
│                                                                           │
│  Kỹ thuật cốt lõi: "Sub-Row + Vertical Merge + Hidden Internal Borders"  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ BẢNG HƯỚNG DẪN CHẤM (3 cột: 12% │ 78% │ 10%)                     │    │
│  │                                                                    │    │
│  │ ┌────────┬───────────────────────────────────────────┬─────┐       │    │
│  │ │  Câu   │              Nội dung                     │Điểm │       │    │
│  │ ├════════╪═══════════════════════════════════════════╪═════╤  ──── │    │
│  │ │        │ Đề bài: Giải phương trình $\sqrt{...}$    │     │ Hàng 0│    │
│  │ │ Câu 14a│─ ─ ─ ─ ─ ─ ─ ─ ─(ẩn border)─ ─ ─ ─ ─ ─│─ ─ ─│       │    │
│  │ │(2,0 đ) │ ĐKXĐ: $x \ge \frac{2}{3}$               │ 0,25│ Hàng 1│    │
│  │ │ (gộp   │─ ─ ─ ─ ─ ─ ─ ─ ─(ẩn border)─ ─ ─ ─ ─ ─│─ ─ ─│       │    │
│  │ │rowspan)│ Rút $\sqrt{5}$, đặt $a, b$...            │ 0,75│ Hàng 2│    │
│  │ │        │─ ─ ─ ─ ─ ─ ─ ─ ─(ẩn border)─ ─ ─ ─ ─ ─│─ ─ ─│       │    │
│  │ │        │ TH1: $a=2b$ → vô nghiệm                  │ 0,25│ Hàng 3│    │
│  │ │        │─ ─ ─ ─ ─ ─ ─ ─ ─(ẩn border)─ ─ ─ ─ ─ ─│─ ─ ─│       │    │
│  │ │        │ TH2: $b=2a$ → $x = 6 \pm \sqrt{26}$      │ 0,75│ Hàng 4│    │
│  │ ├════════╪═══════════════════════════════════════════╪═════╡ ──── │    │
│  │ │ Câu 14b│ Đề bài: Giải hệ phương trình...          │     │       │    │
│  │ │(2,0 đ) │ ...                                       │ ... │       │    │
│  │ └────────┴───────────────────────────────────────────┴─────┘       │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Bề ngoài: Giống y hệt file Word mẫu (1 ô lớn liền mạch cho mỗi câu)    │
│  Kỹ thuật: Mỗi bước giải là 1 hàng riêng → điểm LUÔN căn ngang tuyệt đối│
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────────────────────┐
│ TẦNG 3A: WEB PREVIEW & PDF  │  │ TẦNG 3B: WORD DOCX (.docx)          │
│                              │  │                                      │
│ HTML5 + CSS @page A4 + KaTeX │  │ python-docx + lxml                   │
│ - KaTeX server-side render   │  │ - LaTeX → MathML (latex2mathml)      │
│ - thead auto-repeat khi sang │  │ - MathML → OMML (<m:oMath>)         │
│   trang mới                  │  │ - w:vMerge gộp ô dọc                │
│ - page-break-inside: avoid   │  │ - cantSplit chống cắt trang          │
│ - Playwright → PDF in ấn     │  │ - tblHeader lặp tiêu đề             │
│                              │  │ - border nil giữa step cùng câu     │
│ ~50ms render, pixel-perfect  │  │ Giáo viên mở Word sửa trực tiếp     │
└──────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 3. Data Contract: `ExamDocumentSchema` (Pydantic)

### 3.1. Schema cho AI Output

```python
# Đặt tại: services/core-api/app/schemas/exam_template_schemas.py

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class GradingStep(BaseModel):
    """Một bước chấm nguyên tử trong bảng hướng dẫn chấm"""
    step_id: str = Field(description="Mã bước, VD: '14a-1', '14a-2'")
    latex_content: str = Field(description="Nội dung bước giải. Công thức bọc $..$ hoặc $$..$$")
    points: Optional[float] = Field(
        default=None,
        description="Điểm bước này (0.25, 0.5, 0.75, 1.0) hoặc null nếu bước chuyển tiếp"
    )
    tikz_code: Optional[str] = Field(
        default=None,
        description="Mã TikZ nếu bước này kèm hình vẽ hình học (đặt bên phải)"
    )

class EssayQuestion(BaseModel):
    """Một câu/ý tự luận trong bảng hướng dẫn chấm"""
    sub_label: str = Field(description="Nhãn cột 1, VD: 'Câu 14a\\n(2,0 điểm)'")
    total_points: float = Field(description="Tổng điểm câu/ý này")
    prompt_latex: str = Field(description="Đề bài (LaTeX)")
    grading_steps: List[GradingStep] = Field(min_length=1)

    @field_validator("grading_steps")
    @classmethod
    def validate_points_sum(cls, steps, info):
        total = info.data.get("total_points", 0)
        actual = sum(s.points or 0 for s in steps)
        if abs(actual - total) > 1e-6:
            raise ValueError(
                f"Tổng điểm các bước ({actual}) ≠ total_points ({total}). "
                f"Hãy phân bổ lại điểm cho các grading_steps."
            )
        return steps

class ShortAnswerQuestion(BaseModel):
    """Một câu trắc nghiệm/điền khuyết trong Phần I"""
    number: int
    prompt_latex: str = Field(description="Đề bài câu ghi kết quả")
    short_answer_latex: str = Field(description="Đáp số ngắn gọn, VD: '$P = 2025$'")
    solution_hint_latex: Optional[str] = Field(
        default=None, description="HD: hướng dẫn giải tóm tắt"
    )

class ExamMetadata(BaseModel):
    exam_title: str = "KỲ THI THỬ HỌC SINH GIỎI TỈNH"
    grade_and_year: str = "LỚP 9 NĂM HỌC 2026 - 2027"
    subject: str = "TOÁN"
    duration_minutes: int = 120
    exam_code: Optional[str] = None
    governing_body: str = "SỞ GIÁO DỤC VÀ ĐÀO TẠO"
    department_or_school: str = ""

class ExamDocument(BaseModel):
    """Schema đầy đủ cho toàn bộ đề thi + hướng dẫn chấm"""
    metadata: ExamMetadata
    part1_short_answer: Optional["Part1Config"] = None
    part2_essay: "Part2Config"

class Part1Config(BaseModel):
    section_title: str = "I. PHẦN GHI KẾT QUẢ (6,0 điểm)"
    section_note: str = "(Thí sinh chỉ cần ghi kết quả vào tờ giấy thi)"
    points_per_question: float = 0.5
    questions: List[ShortAnswerQuestion]

class Part2Config(BaseModel):
    section_title: str = "II. PHẦN TỰ LUẬN (14,0 điểm)"
    section_note: str = "(Thí sinh trình bày lời giải vào tờ giấy thi)"
    questions: List[EssayQuestion]
```

### 3.2. Quan hệ với Database hiện tại

```
                    ┌───────────────────────────┐
                    │      ExamDocument          │
                    │      (JSON Schema)         │
                    │                            │
                    │  Được lưu vào cột mới:     │
                    │  generated_exams           │
                    │    .template_document      │
                    │    (JSONB)                  │
                    └──────────┬────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
   questions DB         exam_items DB         Export Engine
   (nguồn gốc)        (snapshot hiện tại)    (PDF/DOCX/HTML)
   
   Khi giáo viên bấm   exam_items + rubric   Template Engine
   "Xuất theo khung     được chuyển đổi       dựng bảng từ
   mẫu chuẩn" →        thành ExamDocument     ExamDocument
   hệ thống gom dữ     JSON hợp lệ           JSON
   liệu từ exam_items
```

**Thay đổi Database cần thiết:**

```sql
-- Thêm cột template_document vào bảng generated_exams
ALTER TABLE generated_exams
  ADD COLUMN template_document JSONB DEFAULT NULL;

-- Cột này lưu ExamDocument JSON đã validate
-- NULL = chưa sinh theo khung mẫu (dùng chế độ tự do như hiện tại)
-- NOT NULL = đã có khung mẫu, dùng Template Engine để render
```

---

## 4. Luồng Xử Lý Chính (User Flow)

### 4.1. Luồng 1: Giáo viên tạo đề từ đầu theo khung mẫu

```
Bước 1: Giáo viên chọn tab "Tạo Đề Theo Khung Mẫu" trên Dashboard
        ↓
Bước 2: Chọn khung mẫu (Exam Template):
        ┌─────────────────────────────────────────────────────┐
        │  ○ HSG Tỉnh Lớp 9 (10 TN + 6 TL = 20đ)            │
        │  ○ HSG Huyện Lớp 8 (12 TN + 5 TL = 20đ)            │
        │  ○ Thi vào 10 Chuyên (Chỉ tự luận = 10đ)            │
        │  ○ Tùy chỉnh (Custom)...                             │
        └─────────────────────────────────────────────────────┘
        ↓
Bước 3: Hệ thống hiển thị "Khung xương" (Skeleton) của đề thi:
        - Phần I: N ô trống cho câu trắc nghiệm
        - Phần II: M ô trống cho câu tự luận
        - Mỗi ô có nhãn chủ đề + mức điểm mặc định
        ↓
Bước 4: Giáo viên điền câu hỏi bằng 3 cách:
        a) Kéo thả từ Ngân hàng câu hỏi (có trên thanh bên)
        b) Gõ trực tiếp LaTeX vào ô
        c) Bấm "AI Gợi ý" → AI đề xuất câu hỏi phù hợp chủ đề & độ khó
        ↓
Bước 5: Hệ thống tự động:
        - Đánh số lại câu (Câu 1, 2, ... liên tục)
        - Tính tổng điểm
        - Nếu là câu tự luận: Gọi AI sinh grading_steps (barem 0.25đ)
        ↓
Bước 6: Giáo viên duyệt & sửa trên Exam Studio (Light Academic Theme):
        - Nửa trái: Xem/sửa ExamDocument JSON dạng form thân thiện
        - Nửa phải: Live Preview bảng chấm điểm đúng khung chuẩn
        ↓
Bước 7: Xuất file:
        - [PDF In ấn] → Cả đề thi + bảng hướng dẫn chấm riêng biệt
        - [Word .docx] → Giáo viên tải về chỉnh sửa thêm
```

### 4.2. Luồng 2: Giáo viên import đề có sẵn (DOCX/PDF) rồi chuẩn hóa

```
Bước 1: Upload file DOCX/PDF (dùng Ingestion Worker hiện tại)
        ↓
Bước 2: OCR + AI nhận diện cấu trúc đề → phân loại:
        - Câu nào thuộc Phần I (ghi kết quả)?
        - Câu nào thuộc Phần II (tự luận)?
        - Đâu là đề bài, đâu là lời giải, đâu là barem?
        ↓
Bước 3: Sinh ExamDocument JSON từ kết quả phân tích
        ↓
Bước 4: Giáo viên duyệt & chỉnh sửa trên Exam Studio
        ↓
Bước 5: Xuất lại theo khung chuẩn (PDF/DOCX)
```

---

## 5. Thiết Kế API Endpoints Mới

### 5.1. Template Management

```
GET    /api/exam-templates
       → Danh sách các khung mẫu có sẵn (HSG Tỉnh 9, HSG Huyện 8, Chuyên 10...)

POST   /api/exam-templates
       → Tạo khung mẫu tùy chỉnh (custom template)
       Body: {
         name: "HSG Tỉnh Lớp 9",
         part1: { num_questions: 10, points_each: 0.5, total: 5.0 },
         part2: { slots: [
           { label: "Câu 11", topic: "ĐẠI SỐ", points: 2.0, sub_parts: [] },
           { label: "Câu 12a", topic: "PHƯƠNG TRÌNH", points: 2.0, sub_parts: [] },
           ...
         ], total: 14.0 },
         total_exam_points: 20.0
       }
```

### 5.2. ExamDocument Generation

```
POST   /api/studio/exams/{exam_id}/generate-template-document
       → Gom exam_items + rubric_data hiện tại → sinh ExamDocument JSON
       → Gọi AI phân bổ grading_steps cho những câu chưa có barem chi tiết
       → Validate tổng điểm từng câu
       → Lưu vào generated_exams.template_document
       Response: ExamDocument JSON

PUT    /api/studio/exams/{exam_id}/template-document
       → Cập nhật ExamDocument JSON (sau khi giáo viên chỉnh sửa)
       Body: ExamDocument JSON (đã validate)

POST   /api/studio/exams/{exam_id}/ai-generate-grading-steps
       → Cho 1 câu tự luận cụ thể, gọi AI sinh grading_steps chi tiết
       Body: { question_index: 2, prompt_latex: "...", total_points: 2.0 }
       Response: { grading_steps: [...] }
```

### 5.3. Template Rendering (Tầng 3)

```
POST   /api/studio/exams/{exam_id}/render-template
       → Render ExamDocument → HTML + CSS A4 + KaTeX
       → Trả về { page_keys: ["studio/{id}/template/page-1.png", ...] }
       Query: ?output=de_thi | huong_dan_cham | ca_hai
       (Cho phép render riêng đề thi hoặc riêng bảng chấm hoặc cả hai)

GET    /api/studio/exams/{exam_id}/download-template
       Query: ?format=pdf|docx&part=exam|rubric|both
       → Tải file PDF hoặc DOCX đã render theo khung mẫu
```

---

## 6. Thiết Kế Giao Diện (UI Components)

### 6.1. Tab mới trên Dashboard: "Tạo Đề Theo Khung Mẫu"

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard Tabs:                                                      │
│  [Ngân hàng câu hỏi] [Tổ hợp đề thi] [Exam Studio] [📋 Khung Mẫu] │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2. Giao diện chọn khung mẫu (Template Picker)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Chọn Khung Đề Thi Chuẩn                                              │
│                                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │ 📐 HSG Tỉnh Lớp 9   │  │ 📐 HSG Huyện Lớp 8  │  │ ✏️ Tùy chỉnh   │ │
│  │                     │  │                     │  │               │ │
│  │ Phần I: 10 câu (5đ) │  │ Phần I: 12 câu (6đ) │  │ Tự thiết kế   │ │
│  │ Phần II: 6 câu (15đ)│  │ Phần II: 5 câu (14đ)│  │ khung riêng   │ │
│  │ Tổng: 20 điểm      │  │ Tổng: 20 điểm      │  │               │ │
│  │ 120 phút            │  │ 120 phút            │  │               │ │
│  │                     │  │                     │  │               │ │
│  │  [Chọn khung này]   │  │  [Chọn khung này]   │  │  [Tạo mới]    │ │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.3. Exam Studio mở rộng: Tab "Khung Bảng Chấm"

Thêm **1 tab mới** vào thanh tab bên trái của Exam Studio (bên cạnh "Mã Nguồn LaTeX", "Biên Tập Câu Hỏi", "Bố Cục Sliders"):

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Tabs bên trái:                                                          │
│  [📝 Mã Nguồn LaTeX] [📊 Khung Barem] [📋 Biên Tập Câu Hỏi] [⚙️ Sliders] │
└─────────────────────────────────────────────────────────────────────────┘
```

**Tab "Khung Barem"** hiển thị form chỉnh sửa thân thiện (không phải JSON thô):

```
┌────────────────────────────────────────────────────────────────────┐
│ 📊 Khung Bảng Hướng Dẫn Chấm                                      │
│                                                                    │
│ ═══════════════════════════════════════════════════════════════════ │
│ PHẦN I: GHI KẾT QUẢ (6,0 điểm)                                    │
│ ─────────────────────────────────────────────────────────────────── │
│ Câu 1: [Cho $x = \sqrt[3]{2026}$... Tính P =  ]  Đáp số: [$2025$] │
│ Câu 2: [Cho đa thức $f(x) = ...$              ]  Đáp số: [       ] │
│ ...                                                                │
│ Câu 10: [Chọn ngẫu nhiên hai số...            ]  Đáp số: [$2/27$] │
│                                                                    │
│ ═══════════════════════════════════════════════════════════════════ │
│ PHẦN II: TỰ LUẬN (14,0 điểm)                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Câu 13 (2,0 điểm) — Tối ưu chi phí bể nước                  │   │
│ │                                                              │   │
│ │ Bước 1: Đặt ẩn $x$, tính $h = 18/x^2$          [0.50 điểm] │   │
│ │ Bước 2: Tính $S_{xq}$, $S_đ$, lập $T(x)$       [0.50 điểm] │   │
│ │ Bước 3: Áp dụng BĐT Cauchy tìm min             [0.50 điểm] │   │
│ │ Bước 4: Kết luận $T_{min} = 16.200.000$ đồng    [0.50 điểm] │   │
│ │                                        Tổng:     2.00 điểm  │   │
│ │                                                              │   │
│ │ [+ Thêm bước]  [🤖 AI Sinh barem]  [🔄 Chia lại 0.25đ]      │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Câu 14a (2,0 điểm) — Giải phương trình vô tỷ               │   │
│ │ ...                                                          │   │
│ └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### 6.4. Live Preview bên phải: Render đúng khung bảng chấm

Nửa phải của Exam Studio hiển thị Live Preview bảng hướng dẫn chấm **đúng chuẩn 3 cột**, với:
- Tiêu đề bảng `Câu | Nội dung | Điểm` tự động lặp khi sang trang
- Mỗi bước giải có điểm căn ngang tuyệt đối
- Hình vẽ hình học hiển thị 2 cột (70% chữ — 30% hình) bên trong ô Nội dung

**Chế độ xem kép:**
- `[📄 Đề Thi Thí Sinh]` → Render tờ đề phát cho học sinh (có Quốc hiệu, SBD, đề bài)
- `[⚖️ Hướng Dẫn Chấm]` → Render bảng 3 cột hướng dẫn chấm chuẩn Bộ/Sở

---

## 7. Thiết Kế CSS Cho Bảng Hướng Dẫn Chấm (Web Preview)

### 7.1. Nguyên tắc "Sub-Row + Rowspan + Hidden Borders"

```
Nhìn bề ngoài (giáo viên thấy):         Cấu trúc kỹ thuật bên trong:
┌────────┬──────────────────┬─────┐      ┌────────┬──────────────────┬─────┐
│        │ Đề bài câu 14a   │     │      │ CELL   │ ROW 0 (đề bài)  │     │
│ Câu 14a│                  │     │      │ rowspan│──────────────────│     │
│(2,0 đ) │ ĐKXĐ: x ≥ 2/3   │ 0,25│      │ = 5    │ ROW 1 (step 1)  │0,25 │
│        │                  │     │      │        │──────────────────│     │
│        │ Đặt a, b, biến   │ 0,75│      │        │ ROW 2 (step 2)  │0,75 │
│        │ đổi...           │     │      │        │──────────────────│     │
│        │ TH1: vô nghiệm   │ 0,25│      │        │ ROW 3 (step 3)  │0,25 │
│        │                  │     │      │        │──────────────────│     │
│        │ TH2: x = 6±√26   │ 0,75│      │        │ ROW 4 (step 4)  │0,75 │
├────────┼──────────────────┼─────┤      ├════════╪══════════════════╪═════╡
│ Câu 14b│ ...              │     │      │ CELL   │ ROW 0            │     │
│        │                  │     │      │ rowspan│                  │     │
└────────┴──────────────────┴─────┘      └────────┴──────────────────┴─────┘

Đường kẻ giữa ROW 1-2-3-4: HIDDEN (border: none)
Đường kẻ giữa Câu 14a và Câu 14b: VISIBLE (border: 1px solid #000)
```

### 7.2. CSS Print cho khổ A4

```css
@page {
  size: A4 portrait;
  margin: 15mm 15mm 15mm 20mm;
}

.rubric-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1.5px solid #000;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.35;
}

.rubric-table thead { display: table-header-group; }

.rubric-table col.col-cau     { width: 12%; }
.rubric-table col.col-noidung { width: 78%; }
.rubric-table col.col-diem    { width: 10%; }

/* Ô gộp dọc cột Câu */
.cell-cau {
  border: 1px solid #000;
  text-align: center;
  vertical-align: middle;
  font-weight: bold;
  white-space: pre-line;
}

/* Hàng đề bài */
.row-prompt td {
  border: 1px solid #000;
  padding: 6px 8px;
  font-weight: bold;
}

/* Hàng bước giải — ẩn border ngang nội bộ */
.row-step td.cell-content {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: none;
  border-bottom: none;
  padding: 4px 8px;
  vertical-align: top;
}

.row-step td.cell-points {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: none;
  border-bottom: none;
  text-align: center;
  vertical-align: middle;
  font-weight: bold;
}

/* Bước cuối cùng của câu → đóng border đáy */
.row-step.last-step td {
  border-bottom: 1px solid #000;
}

/* Chống cắt trang giữa 1 bước */
.row-step { page-break-inside: avoid; }

/* Layout 2 cột cho câu hình học */
.step-with-figure {
  display: flex;
  gap: 12px;
}
.step-with-figure .text-col { flex: 1; }
.step-with-figure .figure-col {
  width: 180px;
  flex-shrink: 0;
  text-align: center;
}
```

---

## 8. System Prompt Cho AI Sinh ExamDocument

```text
Bạn là Chuyên gia Ra đề và Xây dựng Hướng dẫn chấm môn Toán THCS Việt Nam.

NHIỆM VỤ: Sinh đề thi và đáp án chi tiết dưới dạng JSON tuân thủ ExamDocumentSchema.

QUY TẮC TUYỆT ĐỐI:
1. KHÔNG sinh HTML, KHÔNG sinh LaTeX table, KHÔNG sinh Word XML. Chỉ trả về JSON.
2. Mọi biểu thức toán: $...$ (inline) hoặc $$...$$ (display).
   - Hệ phương trình: $\begin{cases} ... \end{cases}$
   - Góc: $\widehat{ABC}$, Tam giác: $\triangle ABC$
3. Mỗi ý tự luận (Câu 14a, Câu 14b, Câu 16a, Câu 16b...) là 1 phần tử riêng trong
   mảng part2_essay.questions — KHÔNG gộp chung ý a, b vào 1 câu.
4. Chia lời giải thành các grading_steps, mỗi bước ứng mốc 0.25đ hoặc bội 0.25đ.
5. SUM(step.points) của một câu/ý PHẢI = total_points của câu/ý đó. Lệch = lỗi.
6. Câu hình học: bước đầu tiên ghi tikz_code cho hình minh họa.
7. Phần I (ghi kết quả): mỗi câu ghi short_answer_latex (đáp số) + solution_hint_latex
   (hướng dẫn giải tóm tắt).
```

---

## 9. Thiết Kế Xuất Word DOCX (Mở Rộng `docx_math_builder.py`)

### 9.1. Mở rộng module hiện tại

File `services/export-service/app/docx_math_builder.py` hiện đã hỗ trợ:
- Chuyển LaTeX → MathML → OMML (`<m:oMath>`)
- Chống cắt trang (`<w:cantSplit/>`)
- Lặp tiêu đề bảng (`<w:tblHeader/>`)

**Cần bổ sung:**

```python
def build_rubric_table_docx(exam_document: dict) -> Document:
    """
    Dựng bảng 3 cột Hướng dẫn chấm theo kỹ thuật vMerge.
    
    Với mỗi câu tự luận:
    1. Tạo hàng đề bài: ô Câu đặt vMerge=RESTART, rowspan = 1 + len(steps)
    2. Tạo N hàng step: ô Câu đặt vMerge=CONTINUE (ô rỗng, gộp dọc)
    3. Ẩn border ngang giữa các step cùng câu (w:val="nil")
    4. Bật border ngang ở step cuối cùng (w:val="single")
    5. Ô Điểm: căn giữa ngang + giữa dọc, in đậm
    """
    pass
```

### 9.2. Xử lý hình vẽ trong Word

```
Phương án A (Khuyên dùng): Render TikZ → PNG bằng TeX Live → chèn ảnh vào ô Word
Phương án B (Dự phòng): Dùng python-docx vẽ shape cơ bản (line, circle, arc)
```

---

## 10. Kế Hoạch Triển Khai Theo Pha

### Pha 1: Foundation (Ưu tiên cao nhất)
- [ ] Tạo `exam_template_schemas.py` (Pydantic model + validator)
- [ ] Thêm cột `template_document JSONB` vào bảng `generated_exams`
- [ ] API `POST /generate-template-document` (gom exam_items → ExamDocument JSON)
- [ ] API `POST /ai-generate-grading-steps` (AI sinh barem cho 1 câu)

### Pha 2: Web Preview (Render bảng chấm trên trình duyệt)
- [ ] Component React `RubricTablePreview.tsx` (HTML table + KaTeX)
- [ ] Kỹ thuật Sub-Row + Rowspan + Hidden Borders
- [ ] Tab "Khung Barem" trên Exam Studio (form chỉnh sửa barem)
- [ ] Live Preview bảng chấm 3 cột bên nửa phải

### Pha 3: Export hoàn chỉnh
- [ ] Mở rộng `docx_math_builder.py` hỗ trợ bảng vMerge 3 cột
- [ ] Export PDF bảng chấm qua TeX Live (dùng `longtblr` hoặc HTML→PDF)
- [ ] Nút xuất riêng: "Tải Đề Thi" vs "Tải Hướng Dẫn Chấm" vs "Tải Cả Hai"

### Pha 4: Template Library & Import
- [ ] CRUD khung mẫu (HSG Tỉnh, HSG Huyện, Chuyên...)
- [ ] Import đề có sẵn (DOCX/PDF) → AI phân tích → ExamDocument JSON
- [ ] Phần I: Bảng đáp án trắc nghiệm lưới 6 cột + HD giải tóm tắt

---

## 11. Tổng Kết So Sánh Trước/Sau

| Tiêu chí | Trước | Sau khi triển khai |
| :--- | :--- | :--- |
| Bố cục đề thi | Liệt kê tuần tự | Khung 2 phần chuẩn Bộ/Sở (TN + TL) |
| Bảng chấm điểm | Không có bảng 3 cột | Bảng `Câu │ Nội dung │ Điểm` chuẩn tuyệt đối |
| Căn ngang cột Điểm | N/A | Sub-Row per step → điểm luôn căn ngang đúng bước |
| Phần trắc nghiệm | Không hỗ trợ | Bảng lưới đáp án + HD giải ngắn gọn |
| Hình vẽ trong bảng chấm | Chưa tích hợp | Layout 2 cột (70% chữ – 30% hình) |
| AI sinh barem | Sinh cả bảng → dễ vỡ | AI chỉ sinh JSON → Engine dựng khung |
| Khung mẫu tái sử dụng | Không | Thư viện template (HSG Tỉnh, Huyện, Chuyên...) |
