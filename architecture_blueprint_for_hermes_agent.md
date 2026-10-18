# SYSTEM DIRECTIVE FOR HERMES AGENT: EXAM GENERATION & LAYOUT ENGINE V2.0

## 1. MỤC TIÊU CỐT LÕI (CORE OBJECTIVE)
Bạn (Hermes Agent) có nhiệm vụ kiểm toán (audit), vá lỗ hổng và nâng cấp hệ thống Tạo Đề Thi hiện tại sang kiến trúc **Hybrid AI-Deterministic Pipeline**. 

**Nguyên tắc bất di bất dịch:**
1. **KHÔNG dùng LLM để tự sáng tác câu hỏi Toán/KHTN khi tạo đề:** Toàn bộ câu hỏi phải được truy xuất từ **Ngân hàng câu hỏi (Question Bank)** đã được kiểm duyệt.
2. **Chỉ dùng LLM cho 2 việc:** 
   - Bóc tách yêu cầu văn bản của người dùng (Prompt) thành **Ma trận đề thi (JSON Exam Matrix)**.
   - Chuẩn hóa dữ liệu đầu vào (Ingestion Pipeline) khi nạp đề thi từ file Word/LaTeX cũ vào Database.
3. **Xuất bản theo Khung cố định (Template-Driven Export):** Đề thi xuất ra (PDF/LaTeX và Word `.docx`) phải được bơm (inject) tự động vào các bộ khung mẫu đã thiết kế sẵn bố cục, giữ nguyên định dạng công thức Toán chỉnh sửa được.

---

## 2. DANH SÁCH LỖ HỔNG CẦN RÀ SOÁT & KHẮC PHỤC NGAY (CRITICAL BUGS TO FIX)

Trước khi viết tính năng mới, Hermes Agent phải kiểm tra codebase hiện tại và xử lý triệt để 4 lỗ hổng phổ biến sau:

1. **Lỗi đứt gãy chuỗi LaTeX (Unclosed/Truncated LaTeX Delimiters):**
   - *Hiện trạng:* Nội dung các bước trong bảng chấm điểm đang bị cắt chuỗi hoặc lỗi cú pháp đóng/mở ngoặc toán học (ví dụ: bị đứt ở `...loại các cặp có $$x`, `...Nhận xét $$a`, hoặc `...với $$0\le m`).
   - *Giải pháp:* Tuyệt đối không dùng hàm cắt chuỗi thông thường (`slice`/`substring`) lên chuỗi chứa LaTeX. Viết hàm `sanitize_and_validate_latex(text)` để chuẩn hóa toàn bộ công thức trên dòng (inline math) về dạng `$ ... $` thay vì `$$ ... $$`, đồng thời kiểm tra cân bằng cặp dấu `$` và `{}` trước khi lưu vào DB.

2. **Lỗi chia điểm thập phân vô hạn trong Thang chấm điểm (Floating-Point Rubric Bug):**
   - *Hiện trạng:* Khi câu hỏi có $1$ điểm chia cho $5$ ý thì ra $0.2$ đẹp, nhưng khi chia cho $6$ ý lại hiển thị số lẻ $0.166667$ gây mất thẩm mỹ và sai chuẩn chấm thi thực tế.
   - *Giải pháp:* Viết thuật toán phân bổ điểm `distribute_points(total_points, weights)` làm tròn đến $0.05$ hoặc $0.1$ (hoặc tối đa $2$ chữ số thập phân) và cộng dồn phần dư vào bước kết luận cuối cùng sao cho tổng điểm các bước luôn khớp tuyệt đối $100\%$ với điểm của câu.

3. **Lỗi xung đột cú pháp khi xuất LaTeX:**
   - *Giải pháp:* Khi dùng Jinja2 để đổ dữ liệu vào file `.tex`, không dùng dấu `{{ }}` mặc định vì sẽ đụng độ với dấu `{}` của LaTeX. Phải cấu hình lại bộ ký hiệu của Jinja2.

4. **Lỗi công thức Toán biến thành ảnh hoặc text chết khi xuất ra Word (`.docx`):**
   - *Giải pháp:* Mọi chuỗi LaTeX khi xuất ra `.docx` phải đi qua bộ chuyển đổi `LaTeX -> MathML -> OMML (Office Math Markup Language)` để giáo viên mở Microsoft Word lên có thể click đúp vào sửa công thức trực tiếp.

---

## 3. TECH STACK CHUẨN HÓA (TARGET TECH STACK)

Hermes Agent cần đảm bảo các module trong dự án tuân thủ đúng stack sau:

* **Frontend:** Next.js (App Router, TypeScript), TailwindCSS, Shadcn UI.
  - Render công thức Toán: `KaTeX` (`react-katex`) — cấu hình `throwOnError: false` để không làm sập trang nếu dữ liệu cũ còn sót lỗi cú pháp.
  - Trình soạn thảo khi bấm nút Sửa (Edit): `TipTap` tích hợp `MathLive`.
* **Backend:** Python `FastAPI` (ưu tiên xử lý chuỗi, AI, tài liệu) hoặc Node.js (nếu kiến trúc hiện tại thuần TS, nhưng bắt buộc tách Worker xử lý Document bằng Python/Pandoc).
* **Database:** `PostgreSQL` kết hợp extension `pgvector` (dùng JSONB cho cấu trúc câu hỏi/thang điểm và Vector cho tìm kiếm ngữ nghĩa).
* **Document & Template Engine:**
  - Nhánh LaTeX/PDF: `Jinja2` + `Tectonic` (hoặc `latexmk` chạy trong Docker sandbox).
  - Nhánh Word (`.docx`): `python-docx-template` (hoặc `docxtemplater`) + `Pandoc` / `mathjax` + `mml2omml`.

---

## 4. THIẾT KẾ DATABASE SCHEMA (POSTGRESQL + PGVECTOR)

Thực thi migration để bảng `questions` và `exam_templates` đạt chuẩn cấu trúc sau:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INT NOT NULL,                          -- Khối lớp (VD: 9, 10, 12)
    subject VARCHAR(50) NOT NULL,                -- Môn học (VD: 'math')
    topic_id VARCHAR(100) NOT NULL,              -- Mã chuyên đề chuẩn (VD: 'he_phuong_trinh_viete', 'so_hoc_nghiem_nguyen_to')
    difficulty VARCHAR(20) NOT NULL,             -- 'easy', 'medium', 'hard', 'olympiad'
    question_type VARCHAR(20) DEFAULT 'essay',   -- 'mcq', 'true_false', 'short_answer', 'essay'
    content_latex TEXT NOT NULL,                 -- Đề bài chuẩn hóa LaTeX ($...$)
    sub_questions JSONB DEFAULT '[]',            -- Các ý a), b) nếu có
    rubric_steps JSONB NOT NULL,                 -- Mảng chứa từng bước giải và trọng số (weight)
    embedding vector(1536),                      -- Vector phục vụ tìm kiếm ngữ nghĩa câu hỏi tương đương
    usage_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cấu trúc chuẩn của cột JSONB `rubric_steps`:
-- [
--   { "step": 1, "content_latex": "Biểu diễn đúng $S = x + y$ và $P = xy$...", "weight": 1.0 },
--   { "step": 2, "content_latex": "Nhận ra $S$ và $P$ là hai nghiệm...", "weight": 1.0 }
-- ]
```

---

## 5. KIẾN TRÚC 4 PIPELINE CỐT LÕI (IMPLEMENTATION PIPELINES)

### Pipeline 1: Text Prompt $\rightarrow$ Ma trận đề thi (Intent Parser)
- **Endpoint:** `POST /api/v1/exams/parse-matrix`
- **Cơ chế:** Nhận yêu cầu tự nhiên của người dùng, sử dụng LLM với tính năng **Structured Outputs (Pydantic / JSON Schema)** để ép đầu ra khớp với danh sách `topic_id` có thực trong Database.
- **Output Schema:**
```json
{
  "exam_metadata": { "title": "Đề thi HSG Toán 9", "duration_minutes": 120, "total_points": 10.0 },
  "slots": [
    {
      "slot_index": 1,
      "topic_id": "so_hoc_nghiem_nguyen_to",
      "difficulty": "hard",
      "points": 1.0,
      "semantic_query": "Phương trình nghiệm nguyên tố mũ"
    },
    {
      "slot_index": 2,
      "topic_id": "he_phuong_trinh_viete",
      "difficulty": "medium",
      "points": 1.0,
      "semantic_query": "Bài toán thực tế hình chữ nhật ứng dụng hệ thức Viète"
    }
  ]
}
```

### Pipeline 2: Ma trận đề $\rightarrow$ Truy xuất & Lấp đầy Ô vuông (Slot Matching & Swapping)
- **Endpoint tạo đề:** `POST /api/v1/exams/generate-from-matrix`
- **Endpoint đổi 1 câu (Nút Swap $\leftrightarrows$ trên Card UI):** `POST /api/v1/exams/slots/{slot_index}/swap`
- **Thuật toán truy xuất cho mỗi Slot:**
  1. Lọc cứng (Hard Filter) theo `grade`, `subject`, `topic_id`, `difficulty` và loại trừ danh sách `excluded_question_ids` (các câu đã có trên đề hoặc vừa bị người dùng bấm đổi).
  2. Nếu có `semantic_query`, tính khoảng cách Cosine (`embedding <=> query_vector`) để lấy Top 10 câu sát nghĩa nhất.
  3. Chọn ngẫu nhiên 1 câu trong Top 10 (ưu tiên câu có `usage_count` thấp).
- **Thuật toán chia điểm Thang chấm (Rubric Point Distributor):**
  ```python
  def distribute_rubric_points(total_points: float, steps: list[dict]) -> list[dict]:
      total_weight = sum(step.get("weight", 1.0) for step in steps)
      allocated = 0.0
      result = []
      for i, step in enumerate(steps):
          if i == len(steps) - 1:
              # Bước cuối nhận phần dư để tổng điểm chính xác tuyệt đối
              pts = round(total_points - allocated, 2)
          else:
              raw_pts = total_points * (step.get("weight", 1.0) / total_weight)
              # Làm tròn về bội số của 0.05 (VD: 0.15, 0.20, 0.25)
              pts = round(raw_pts * 20) / 20
              allocated += pts
          result.append({**step, "points": pts})
      return result
  ```

### Pipeline 3: Giao diện Card UI ("Các Ô Vuông")
Mỗi Slot trên Frontend được quản lý độc lập trong State (Zustand hoặc React Context):
- **Header của Card:** Hiển thị `Câu {index}:` bên trái; bên phải gồm Badge tổng điểm (`1 điểm`) và cụm 3 nút hành động: `Sửa (Edit)`, `Đổi câu hỏi (Swap)`, `Xóa (Delete)`.
- **Body của Card:**
  - Phần Đề bài: Render bằng `<LatexRenderer content={slot.question.content_latex} />`.
  - Bảng `Thang chấm điểm`: Gồm 3 cột `#` (Thứ tự bước), `Nội dung` (Lời giải từng bước render LaTeX), và `Điểm` (Điểm đã qua hàm `distribute_rubric_points`).

### Pipeline 4: Engine Đổ Khung Bố Cục (Template Injection Engine)

#### A. Xuất PDF qua Khung LaTeX (`.tex` Template)
Thiết lập `Jinja2` với bộ dấu phân cách riêng để không xung đột với cú pháp LaTeX:
```python
import jinja2

latex_jinja_env = jinja2.Environment(
    block_start_string=r'\BLOCK{',
    block_end_string='}',
    variable_start_string=r'\VAR{',
    variable_end_string='}',
    comment_start_string=r'\#{',
    comment_end_string='}',
    autoescape=False,
)
```
Trong các file khung (`templates/latex/chuan_bo_gd.tex`, `templates/latex/de_hsg.tex`), thiết kế sẵn phần Header, khung phách, bảng điểm và dùng vòng lặp `\BLOCK{ for slot in slots }` để bơm câu hỏi cùng bảng hướng dẫn chấm vào đúng vị trí. Sau đó gọi `tectonic output.tex` để xuất file PDF.

#### B. Xuất Word qua Khung `.docx` (Giữ nguyên Equation chỉnh sửa được)
1. Lưu các file khung Word mẫu (`templates/docx/khung_de_chuan.docx`) có định dạng sẵn bảng biểu, font Times New Roman, cỡ chữ 12pt.
2. Viết hàm `latex_to_word_omml(latex_str)`:
   - Tách chuỗi văn bản thành các đoạn text thường và các cụm toán học `$...$`.
   - Chuyển cụm `$...$` sang MathML (dùng `latex2mathml`), sau đó dùng XSLT (`MML2OMML.XSL` chuẩn của Microsoft Office) kết hợp `lxml` để biến thành thẻ `<m:oMath>` (OMML).
3. Dùng `docxtpl` (`python-docx-template`) bơm các đoạn văn bản kèm đối tượng `<m:oMath>` vào đúng các biến `{{ slots }}` và bảng chấm điểm trong file `.docx`.

---

## 6. QUY TRÌNH THỰC THI CHO HERMES AGENT (EXECUTION ROADMAP)

Khi bắt đầu chạy, Hermes Agent phải thực hiện tuần tự 4 Phase sau và báo cáo tiến độ sau mỗi Phase:

- **Phase 1 (Audit & Sanitize):** Quét toàn bộ codebase và DB hiện tại. Viết bộ lọc sửa lỗi đứt chuỗi LaTeX (`$$`) và cập nhật hàm chia điểm Rubric để loại bỏ triệt để số thập phân vô hạn.
- **Phase 2 (Database & Matching Engine):** Chuẩn hóa Schema PostgreSQL, tích hợp `pgvector` và viết API lấy đề theo Ma trận + API đổi từng câu hỏi (`swap`).
- **Phase 3 (Template Export Engine):** Xây dựng 2 nhánh xuất file (`LaTeX Jinja2 Engine` và `Docx OMML Engine`) dựa trên thư mục `templates/` chứa các khung bố cục mẫu.
- **Phase 4 (Ingestion Tool):** Xây dựng công cụ upload file `.docx`/`.tex` cũ, dùng Pandoc + LLM Structured Output tự động cắt câu hỏi, tách bảng chấm điểm và nạp vào Ngân hàng câu hỏi.