# DATA STANDARDS & SCHEMA SPECIFICATION

**Target Subject:** Vietnamese Secondary School Gifted Mathematics (Toán HSG Cấp 2 / Lớp 8-9)  
**Focus:** Taxonomy Enums, Relational Schema, Multi-part Question Handling, and LaTeX Conventions.

---

## 1. VIETNAMESE MATH CURRICULUM TAXONOMY (STRICT ENUMS)

To ensure SQL filters and vector searches operate deterministically without free-text drift, all questions must map to standardized enums:

### 1.1. Core Enums

```python
from enum import Enum

class SectionType(str, Enum):
    SHORT_ANSWER = "SHORT_ANSWER"  # Phần I: Ghi kết quả (Điền đáp số ngắn)
    ESSAY = "ESSAY"                # Phần II: Tự luận (Trình bày đầy đủ lời giải)

class StructureType(str, Enum):
    SINGLE = "SINGLE"                       # Câu đơn lẻ (1 yêu cầu, không chia ý a, b)
    INDEPENDENT_PARTS = "INDEPENDENT_PARTS" # Nhiều ý a, b độc lập, không dùng chung giả thiết (VD: Câu 15: a) PT vô tỉ, b) Hệ PT)
    SHARED_STEM = "SHARED_STEM"             # Có giả thiết chung ở đầu rồi mới chia ý a, b (VD: Câu 16 Hình học phẳng)

class Difficulty(str, Enum):
    EASY = "EASY"          # Vận dụng cơ bản (Lấy điểm khởi đầu)
    MEDIUM = "MEDIUM"      # Vận dụng khá (Rút gọn căn thức, hình ý a)
    HARD = "HARD"          # Vận dụng cao (Số học tự luận, Hệ PT, hình ý b)
    OLYMPIAD = "OLYMPIAD"  # Phân loại tối đa (Bất đẳng thức cực trị, hình ý c)

class MainTopic(str, Enum):
    ALGEBRA = "ALGEBRA"                                     # Đại số
    NUMBER_THEORY = "NUMBER_THEORY"                         # Số học
    PLANE_GEOMETRY = "PLANE_GEOMETRY"                       # Hình học phẳng
    SOLID_GEOMETRY = "SOLID_GEOMETRY"                       # Hình học không gian / Trực quan
    INEQUALITY_EXTREMA = "INEQUALITY_EXTREMA"               # Bất đẳng thức & Cực trị
    COMBINATORICS_PROBABILITY = "COMBINATORICS_PROBABILITY" # Tổ hợp, Xác suất & Logic
    REAL_WORLD_MATH = "REAL_WORLD_MATH"                     # Toán thực tế & Giải bài toán bằng cách lập PT
```

### 1.2. SubTopic Mapping (Vietnamese Secondary School Gifted Exams)

| MainTopic | Standardized SubTopic Code | Vietnamese Description | Reference Pattern |
| :--- | :--- | :--- | :--- |
| `ALGEBRA` | `ALG_RADICAL_SIMPLIFY` | Rút gọn căn thức & Biểu thức số | $\sqrt{9-\sqrt{5\sqrt{3}+...}}$ |
| `ALGEBRA` | `ALG_CONDITIONAL_EXPR` | Tính giá trị biểu thức có điều kiện | Giả thiết đối xứng $x, y, z$ |
| `ALGEBRA` | `ALG_POLYNOMIAL_DIV` | Đa thức & Phép chia đa thức có dư | $P(x)$ chia cho $(x^2+10x+21)$ |
| `ALGEBRA` | `ALG_QUADRATIC_VIETA` | Phương trình bậc hai, Parabol & Vi-ét | Giao điểm Parabol & Đường thẳng |
| `ALGEBRA` | `ALG_IRRATIONAL_EQ` | Phương trình vô tỉ / Bậc cao | Đưa về PT bậc hai ẩn phụ $\sqrt{3}$ |
| `ALGEBRA` | `ALG_SYSTEM_OF_EQ` | Hệ phương trình đại số | Hệ đối xứng, đẳng cấp, phân thức |
| `NUMBER_THEORY` | `NUM_DIOPHANTINE_EQ` | Phương trình nghiệm nguyên | Delta chính phương, chặn khoảng |
| `NUMBER_THEORY` | `NUM_PRIME_DIVISIBILITY` | Số nguyên tố, Hợp số & Tính chia hết | $(x^3-x+3)(x^2-x+1)=p^y$ |
| `NUMBER_THEORY` | `NUM_PERFECT_SQUARE` | Số chính phương & Số lập phương | $2n-1$ và $3n+1$ là số chính phương |
| `PLANE_GEOMETRY` | `GEO_TRIANGLE_METRIC` | Hệ thức lượng & Đường phân giác | Tính diện tích tam giác từ phân giác |
| `PLANE_GEOMETRY` | `GEO_TRIGONOMETRY` | Tỉ số lượng giác góc nhọn | $\sin 75^\circ, \tan 15^\circ$ |
| `PLANE_GEOMETRY` | `GEO_CIRCLE_INSCRIBED` | Đường tròn ngoại tiếp, Tứ giác nội tiếp | Bốn điểm cùng thuộc đường tròn |
| `PLANE_GEOMETRY` | `GEO_SIMILARITY_COLLINEAR` | Tam giác đồng dạng, Vuông góc, Thẳng hàng | Đồng quy, $MN \perp AD$ |
| `SOLID_GEOMETRY` | `SOLID_PRISM_BOX` | Hình hộp chữ nhật, Hình lăng trụ đứng | Tính thể tích, diện tích xung quanh |
| `SOLID_GEOMETRY` | `SOLID_PYRAMID_CYLINDER` | Hình chóp, Hình nón, Hình trụ | Tính diện tích và thể tích |
| `INEQUALITY_EXTREMA` | `INEQ_ALGEBRAIC` | Bất đẳng thức Đại số (AM-GM, Cauchy-Schwarz) | Tìm GTLN, GTNN có điều kiện $x+y+z=k$ |
| `INEQUALITY_EXTREMA` | `INEQ_GEOMETRIC` | Cực trị Hình học | Vị trí điểm để diện tích lớn nhất |
| `COMBINATORICS_PROBABILITY` | `COMB_PROBABILITY` | Xác suất cổ điển & Phép đếm | Gieo xúc xắc, chọn số tự nhiên |
| `COMBINATORICS_PROBABILITY` | `COMB_DIRICHLET_INVARIANT` | Nguyên lý Dirichlet, Bất biến, Tô màu | Bài toán bảng ô vuông, chia nhóm |
| `REAL_WORLD_MATH` | `REAL_MOTION_WORK` | Toán chuyển động, Năng suất, Phần trăm | Ô tô và xe máy đi ngược chiều |
| `REAL_WORLD_MATH` | `REAL_OPTIMIZATION` | Tối ưu hóa thực tế | Gấp máng nước từ miếng tôn |

---

## 2. VIETNAMESE LATEX & NUMBER NOTATION STANDARDS

1. **Math Enclosures:** Strictly wrap inline math in single dollar signs (`$ ... $`) and block math in double dollar signs (`$$ ... $$`).
2. **Decimal Comma Notation:** In Vietnamese textbooks, decimals use commas ($235,2\text{ cm}^2$, $3,5\text{ kg}$). In LaTeX, write `$235{,}2\text{ cm}^2$` or `$235,2\text{ cm}^2$` to ensure spacing renders correctly.
3. **Vietnamese Geometry & Degree Symbols:**
   - Degrees must be written as `^\circ` (e.g., `$60^\circ$`, `$\sin 75^\circ$`). Do not use `^0` or raw Unicode `°`.
   - Angles must be represented as `\widehat{ABC}` or `\angle ABC`.
   - Triangles must use `\triangle ABC`.
4. **Systems and Case Statements:**
   - Systems of equations: `\begin{cases} eq_1 \\ eq_2 \end{cases}`.
   - Or conditions: `\left[ \begin{array}{l} branch_1 \\ branch_2 \end{array} \right.`.
5. **Number Sets:**
   - Use standard Blackboard Bold: `\mathbb{N}`, `\mathbb{N}^*`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{R}`.
   - Divisibility symbols: `\vdots` for divisibility, `\mid` for divides.

---

## 3. POSTGRESQL + PGVECTOR DATABASE DEFINITION

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ENUMS
CREATE TYPE section_type_enum AS ENUM ('SHORT_ANSWER', 'ESSAY');
CREATE TYPE structure_type_enum AS ENUM ('SINGLE', 'INDEPENDENT_PARTS', 'SHARED_STEM');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD', 'OLYMPIAD');
CREATE TYPE main_topic_enum AS ENUM (
    'ALGEBRA',
    'NUMBER_THEORY',
    'PLANE_GEOMETRY',
    'SOLID_GEOMETRY',
    'INEQUALITY_EXTREMA',
    'COMBINATORICS_PROBABILITY',
    'REAL_WORLD_MATH'
);
CREATE TYPE ingestion_status_enum AS ENUM ('UPLOADED', 'CONVERTING_IMAGES', 'OCR_PROCESSING', 'REVIEW_NEEDED', 'PUBLISHED', 'FAILED');

-- 1. SOURCE EXAM PAPERS
CREATE TABLE source_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    exam_level VARCHAR(100) DEFAULT 'HSG_TINH',
    grade INT NOT NULL DEFAULT 9,
    school_or_province VARCHAR(255),
    academic_year VARCHAR(20),
    duration_minutes INT DEFAULT 120,
    original_file_key TEXT NOT NULL,
    page_image_keys JSONB DEFAULT '[]'::jsonb,
    status ingestion_status_enum DEFAULT 'UPLOADED',
    processing_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. QUESTION BANK
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
    original_question_number INT NOT NULL,
    
    section_type section_type_enum NOT NULL,
    structure_type structure_type_enum NOT NULL DEFAULT 'SINGLE',
    default_points NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    
    content_latex TEXT NOT NULL,
    normalized_hash VARCHAR(64) NOT NULL,
    sub_questions JSONB DEFAULT '[]'::jsonb,
    solution_latex TEXT,
    final_answer TEXT,
    
    has_figure BOOLEAN DEFAULT FALSE,
    figures_meta JSONB DEFAULT '[]'::jsonb,
    
    grade INT NOT NULL DEFAULT 9,
    main_topic main_topic_enum NOT NULL,
    sub_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    solution_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
    difficulty difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    
    semantic_summary TEXT NOT NULL,
    embedding vector(768),
    usage_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_q_lookup ON questions (grade, section_type, main_topic, difficulty, structure_type) WHERE is_verified = TRUE;
CREATE INDEX idx_q_subtopics_gin ON questions USING GIN (sub_topics);
CREATE INDEX idx_q_hash ON questions (normalized_hash);
CREATE INDEX idx_q_embedding_hnsw ON questions USING hnsw (embedding vector_cosine_ops);

-- 3. EXAM BLUEPRINTS
CREATE TABLE exam_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    grade INT NOT NULL DEFAULT 9,
    source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
    sections_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSEMBLED EXAMS
CREATE TABLE generated_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    blueprint_id UUID REFERENCES exam_blueprints(id) ON DELETE SET NULL,
    slots_state JSONB NOT NULL,
    exported_docx_key TEXT,
    exported_pdf_key TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
