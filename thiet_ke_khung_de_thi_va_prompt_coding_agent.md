# Thiết Kế Kiến Trúc & Prompt Cho Coding Agent: Hệ Thống Sinh Đề Thi & Hướng Dẫn Chấm Theo Khung Chuẩn (Fixed-Layout Exam Engine)

Tài liệu này phân tích cấu trúc thực tế từ file mẫu của bạn (`ĐỀ THI CHỌN V Chiến gửi Lê Hữu Vinh.docx`), đề xuất kiến trúc kỹ thuật tối ưu nhất để **tách biệt hoàn toàn phần sinh nội dung của AI với phần dàn trang/kẻ bảng/chia điểm**, và cung cấp **Prompt hoàn chỉnh** để bạn giao ngay cho Coding Agent tích hợp vào hệ thống hiện có.

## 1. Phân Tích Điểm Nghẽn Từ File Word Mẫu Của Bạn

Qua phân tích cấu trúc XML trực tiếp từ file `ĐỀ THI CHỌN V Chiến gửi Lê Hữu Vinh.docx` và ảnh chụp màn hình:

1. **Lệch dòng điểm số ở bảng Hướng dẫn chấm (`Table 3 - 16x3`)**:
   - Trong file Word hiện tại, toàn bộ lời giải của một ý (ví dụ `Câu 14b` hoặc `Câu 15`) đang được nhồi chung vào **1 ô duy nhất** ở cột `Nội dung`.
   - Cột `Điểm` bên phải dùng cách bấm phím `Enter` thủ công nhiều lần (`0.25 \n\n\n 0.25 \n\n\n 0.5`) để căn ngang bằng mắt với các bước biến đổi bên cột `Nội dung`.
   - **Hậu quả**: Khi AI sinh lời giải dài/ngắn khác nhau hoặc khi đổi cỡ chữ, cột `Điểm` sẽ bị trôi, lệch khỏi bước giải tương ứng.
2. **Công thức Toán dạng OLE MathType cũ (`224 đối tượng w:object`)**:
   - File hiện tại dùng đối tượng nhúng MathType OLE (`w:object`), vừa nặng vừa khiến AI không thể sinh trực tiếp hay chỉnh sửa bằng code.
3. **Hình vẽ Hình học (`Câu 16a` - Đường tròn & Tam giác)**:
   - Hình vẽ đang được chèn nổi (floating drawing) đè lên ô bảng, dễ bị nhảy vị trí khi sang trang mới.

## 2. Giải Pháp Kiến Trúc: Nguyên Lý "AI Sinh JSON — Engine Dựng Khung"

Để AI Agent **không bao giờ làm vỡ khung bảng, đường kẻ hay cột điểm**, tuyệt đối **KHÔNG** bảo AI sinh trực tiếp code HTML/LaTeX/Word của cả bảng. Thay vào đó, áp dụng kiến trúc 3 tầng:

1. **Tầng 1 — AI Content Generator (Structured Output / JSON Schema)**:
   - AI chỉ sinh ra một chuỗi JSON tuân thủ chặt chẽ `ExamSchema` (dùng OpenAI/Gemini `response_schema`, `Zod` hoặc `Pydantic`).
   - Mọi công thức toán học trong JSON đều viết bằng **chuẩn LaTeX thuần** (`$...$` cho inline, `$$...$$` cho công thức khối).
   - Mỗi câu tự luận được chia thành mảng các **Bước chấm nguyên tử (`grading_steps`)**, mỗi bước gồm `{ step_content, points }` và tự động kiểm tra tổng `sum(points) == question.total_points`.
2. **Tầng 2 — Kỹ Thuật Kẻ Bảng "Sub-Row + Vertical Merge" (Bí quyết căn điểm tuyệt đối)**:
   - Thay vì nhồi cả bài giải vào 1 ô, **mỗi bước giải (`grading_step`) có điểm số (`0.25`, `0.5`) là 1 hàng (row) riêng biệt** trong bảng 3 cột (`Câu | Nội dung | Điểm`).
   - **Cột 1 (`Câu`)**: Dùng thuộc tính gộp ô dọc (`rowspan` trong HTML / `w:vMerge` trong Word / `\multirow` trong LaTeX) kéo dài từ hàng đề bài xuống hết tất cả các hàng bước giải của câu đó.
   - **Đường kẻ ngang giữa các bước giải trong cùng 1 câu**: Ẩn đường viền ngang (`border-top: none; border-bottom: none` trong CSS hoặc `w:val="nil"` trong Word XML) giữa các bước giải của cùng một câu để nhìn bề ngoài **y hệt một ô lớn liền mạch như ảnh mẫu của bạn**, nhưng về mặt kỹ thuật, con số `0.25` hay `0.5` luôn nằm cùng hàng ngang với đúng dòng biến đổi đó!
   - **Hình học (`Câu 16`)**: Nếu bước giải có kèm hình vẽ (`diagram_svg` hoặc `tikz_code`), ô `Nội dung` của bước đầu tiên tự động chia layout 2 cột nội bộ (70% chữ bên trái – 30% hình SVG/PNG bên phải).
3. **Tầng 3 — Dual-Output Rendering Engine (Web/PDF + MS Word `.docx`)**:
   - **Luồng 1 (Web Preview & Xuất PDF chuẩn in ấn - Khuyên dùng làm mặc định)**: Dùng **HTML5 + CSS Print (`@page A4`) + KaTeX + Playwright/Puppeteer**. Tốc độ render < 50ms, tự động lặp lại tiêu đề bảng (`Câu | Nội dung | Điểm`) khi sang trang mới, không bao giờ lỗi biên dịch.
   - **Luồng 2 (Xuất file Word `.docx` chỉnh sửa được cho giáo viên)**: Dùng `docx` (Node.js) hoặc `python-docx` kết hợp bộ chuyển đổi **LaTeX → MathML (`temml` / `latex2mathml`) → OMML (`MML2OMML.XSL`)**. Công thức khi mở trong MS Word là **Equation chính chủ của Word (`m:oMath`)**, giáo viên click đúp vào sửa công thức trực tiếp mà không cần cài MathType.

## 3. So Sánh Tech Stack Để Bạn Lựa Chọn

| Tiêu chí | KaTeX + HTML/CSS Print → PDF | Word Native (`.docx` + OMML) | LaTeX (`XeLaTeX` + `tabularray`) | Typst |
| :--- | :--- | :--- | :--- | :--- |
| **Độ sát với ảnh mẫu** | Tuyệt đối (CSS Table `rowspan` + ẩn border nội bộ) | Tuyệt đối (dùng `w:vMerge` + ẩn border giữa các bước) | Rất cao (dùng gói `tabularray` + `longtblr`) | Rất cao |
| **Tốc độ hiển thị trên Web** | Tức thì (< 50ms, xem trực tiếp trên trình duyệt) | Cần tải file về mở bằng MS Word | Chậm (1.5s – 4s để biên dịch ra PDF) | Nhanh (~200ms) |
| **Rủi ro lỗi cú pháp do AI** | Rất thấp (KaTeX có `throwOnError: false`, chỉ báo đỏ cụm lỗi) | Rất thấp (fallback về text nếu LaTeX lỗi) | Cao (thiếu 1 dấu `}` hoặc `&` là sập toàn bộ file PDF) | Trung bình |
| **Giáo viên tải về sửa trên Word** | Không (chỉ xuất PDF / In trực tiếp) | Có (sửa trực tiếp chữ, bảng và công thức OMML) | Không | Không |
| **Khuyến nghị sử dụng** | **Dùng cho giao diện Web Preview & Xuất PDF** | **Dùng cho nút "Tải file Word (.docx)"** | Chỉ dùng nếu cần vẽ hình `TikZ` phức tạp tự động | Thay thế LaTeX nếu muốn build PDF nhanh |

## 4. Prompt Hoàn Chỉnh Cho Coding Agent Của Bạn

Bạn chỉ cần **sao chép toàn bộ nội dung trong khối dưới đây** và dán vào Coding Agent (Cursor, Claude Code, Windsurf, GitHub Copilot...) trong project của bạn:

```markdown
# TASK: Xây dựng tính năng "Fixed-Layout Math Exam & Grading Rubric Generator" (AI JSON -> KaTeX/PDF & DOCX)

## 1. Bối cảnh & Mục tiêu
Hệ thống hiện tại của chúng ta cần bổ sung tính năng tạo Đề thi Toán và Bảng Hướng dẫn chấm (Đáp án) theo khung bố cục chuẩn cố định (giống chuẩn đề thi Học sinh giỏi / Tuyển sinh tại Việt Nam).
Yêu cầu cốt lõi:
- **Tách biệt hoàn toàn Nội dung (AI) và Bố cục (Template Engine)**: AI Agent CHỈ sinh ra dữ liệu JSON theo Schema cố định (chứa nội dung câu hỏi, các bước giải bằng LaTeX và điểm thành phần). AI KHÔNG tự sinh HTML/LaTeX/Word table để tránh vỡ khung.
- **Định dạng đầu ra chuẩn mực**:
  1. Quốc hiệu / Tiêu ngữ / Khung thông tin kỳ thi ở đầu trang.
  2. **Phần I. Phần ghi kết quả / Trắc nghiệm**: Danh sách câu hỏi + Bảng tổng hợp đáp án dạng lưới (6 cột x N hàng).
  3. **Phần II. Phần tự luận**: Danh sách câu hỏi tự luận kèm tổng điểm từng câu.
  4. **Bảng Hướng dẫn chấm Tự luận (3 cột cố định: `Câu` | `Nội dung` | `Điểm`)**:
     - Cột `Câu` (rộng ~12%): Ghi tên câu và tổng điểm (VD: `Câu 14b (2,0 điểm)`), tự động gộp ô dọc (`rowspan` / `vMerge`) từ dòng đề bài xuống hết các bước giải của câu đó.
     - Cột `Nội dung` (rộng ~78%): Dòng đầu là đề bài của câu/ý đó (có đường kẻ ngang mảnh ngăn cách với phần lời giải bên dưới). Các dòng tiếp theo là từng bước giải (`grading_steps`).
     - Cột `Điểm` (rộng ~10%, căn giữa, in đậm): Hiển thị điểm thành phần (`0.25`, `0.5`, `1.0`) tương ứng chính xác trên cùng một hàng ngang với bước giải đó.
     - **Quy tắc đường kẻ (Borders)**: Giữa các bước giải (`grading_steps`) trong cùng một câu/ý, ẩn đường kẻ ngang (`border-top: hidden; border-bottom: hidden`) để nhìn liền mạch như một ô duy nhất, nhưng vẫn đảm bảo điểm số bên cột `Điểm` luôn căn ngang tuyệt đối với bước giải bên cột `Nội dung`. Giữa các câu/ý khác nhau có đường kẻ ngang nét liền (`1px solid #000`).

---

## 2. Thiết kế Data Contract (JSON Schema / Zod / Pydantic)
Hãy tạo module định nghĩa Schema và Validator bắt buộc cho đầu ra của AI Agent như sau:

```typescript
// exam-schema.ts (Hoặc tương đương bằng Python Pydantic nếu backend dùng Python)
import { z } from "zod";

export const GradingStepSchema = z.object({
  step_id: z.string().describe("Mã bước, VD: '14b-1'"),
  latex_content: z.string().describe("Nội dung bước giải (hỗ trợ nhiều dòng, công thức toán bọc trong $...$ hoặc $$...$$)"),
  points: z.number().nullable().describe("Điểm của bước này, VD: 0.25, 0.5, 1.0, hoặc null nếu bước chuyển tiếp không tính điểm"),
  geometry_svg_or_tikz: z.string().optional().describe("Mã SVG hoặc mô tả hình học (nếu là câu hình học và cần đặt hình bên phải bước giải đầu tiên)")
});

export const EssaySubQuestionSchema = z.object({
  sub_label: z.string().describe("Nhãn câu/ý hiển thị ở cột 1, VD: 'Câu 14a\n(2,0 điểm)' hoặc 'Câu 15\n(2,0 điểm)'"),
  total_points: z.number().describe("Tổng điểm của câu/ý này, VD: 2.0"),
  prompt_latex: z.string().describe("Nội dung đề bài của câu/ý này (dùng $...$ cho công thức)"),
  grading_steps: z.array(GradingStepSchema).min(1)
});

export const ShortAnswerQuestionSchema = z.object({
  number: z.number().describe("Số thứ tự câu, VD: 1, 2, ..., 12"),
  prompt_latex: z.string().describe("Đề bài câu trả lời ngắn"),
  short_answer_latex: z.string().describe("Kết quả ngắn gọn để điền vào bảng đáp án, VD: '$P = 2025$'"),
  solution_hint_latex: z.string().optional().describe("Hướng dẫn giải ngắn gọn (HD: ...)")
});

export const ExamDocumentSchema = z.object({
  metadata: z.object({
    exam_title: z.string().default("KỲ THI THỬ HỌC SINH GIỎI TỈNH"),
    grade_and_year: z.string().default("LỚP 9 NĂM HỌC 2026 - 2027"),
    subject: z.string().default("TOÁN"),
    duration_minutes: z.number().default(120),
    exam_code: z.string().optional()
  }),
  part1_short_answer: z.object({
    section_title: z.string().default("I. PHẦN GHI KẾT QUẢ (6,0 điểm)"),
    section_note: z.string().default("(Thí sinh chỉ cần ghi kết quả vào tờ giấy thi)"),
    points_per_question: z.number().default(0.5),
    questions: z.array(ShortAnswerQuestionSchema)
  }),
  part2_essay: z.object({
    section_title: z.string().default("II. PHẦN TỰ LUẬN (14,0 điểm)"),
    section_note: z.string().default("(Thí sinh trình bày lời giải vào tờ giấy thi)"),
    questions: z.array(EssaySubQuestionSchema)
  })
});
```

### Quy tắc Validation (Post-generation Validator):
Viết hàm `validateExamPoints(examData)`:
1. Kiểm tra với mỗi `subQuestion` trong `part2_essay.questions`: Tổng `grading_steps.reduce((acc, s) => acc + (s.points || 0), 0)` phải bằng đúng `subQuestion.total_points` (sai số `< 1e-6`).
2. Nếu lệch điểm, tự động trả lỗi chi tiết cho AI Agent để sửa lại phân bổ điểm trước khi đưa vào bộ Render.

---

## 3. System Prompt cho AI Exam Generator Agent
Hãy cấu hình System Prompt cho AI Agent sinh đề như sau:

```text
Bạn là Chuyên gia Ra đề và Xây dựng Hướng dẫn chấm môn Toán.
Nhiệm vụ của bạn là sinh đề thi và đáp án chi tiết dưới dạng JSON tuân thủ tuyệt đối `ExamDocumentSchema`.

QUY TẮC BẮT BUỘC:
1. KHÔNG sinh thẻ bảng HTML, KHÔNG sinh mã bảng LaTeX (`egin{tabular}`). Chỉ trả về JSON hợp lệ.
2. Mọi biểu thức toán học, biến số, phương trình, hệ phương trình PHẢI đặt trong cặp dấu `$ ... $` (inline) hoặc `$$ ... $$` (display).
   - Hệ phương trình dùng `$egin{cases} ... \end{cases}$`.
   - Góc hình học dùng `$\widehat{ABC} = 90^\circ$`, tam giác dùng `$	riangle ABC$`, vuông góc dùng `$\perp$`, thuộc dùng `$\in$`.
3. Trong phần Tự luận (`part2_essay`), mỗi câu hoặc mỗi ý lớn (`Câu 14a`, `Câu 14b`, `Câu 15`, `Câu 16a`, `Câu 16b`) phải được tách thành một phần tử trong mảng `questions`.
4. Trong mỗi câu/ý tự luận, hãy chia lời giải thành các bước chấm điểm rõ ràng (`grading_steps`). Mỗi bước ứng với một mốc điểm chuẩn (`0.25`, `0.5`, `0.75`, `1.0`).
5. Tổng điểm các `grading_steps` của một câu/ý PHẢI bằng chính xác `total_points` của câu/ý đó.
```

---

## 4. Xây dựng Template Engine 1: Web Preview & Xuất PDF (HTML + CSS A4 + KaTeX)
Hãy tạo component/service `renderExamToHtml(examData: ExamDocument)` sử dụng **KaTeX** (render phía server hoặc client) với bố cục chuẩn:

### Quy tắc CSS cho Bảng Hướng Dẫn Chấm (`rubric-table`):
```css
@page {
  size: A4 portrait;
  margin: 15mm 15mm 15mm 20mm;
}

.exam-container {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.35;
  color: #000;
}

.rubric-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #000;
}

.rubric-table thead {
  display: table-header-group; /* Tự động lặp lại hàng tiêu đề khi sang trang mới */
}

.rubric-table th {
  border: 1px solid #000;
  font-weight: bold;
  text-align: center;
  padding: 6px 4px;
  background-color: #f8f9fa;
}

.rubric-table col.col-cau { width: 12%; }
.rubric-table col.col-noidung { width: 78%; }
.rubric-table col.col-diem { width: 10%; }

/* Ô cột Câu (được gộp rowspan) */
.cell-cau {
  border: 1px solid #000;
  text-align: center;
  vertical-align: middle;
  font-weight: bold;
  padding: 6px 4px;
  white-space: pre-line;
}

/* Hàng chứa đề bài của từng câu trong bảng chấm */
.row-question-prompt td {
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 6px 8px;
}

/* Các hàng chứa từng bước giải (grading_steps) */
.row-grading-step {
  page-break-inside: avoid; /* Không cắt đôi 1 bước chấm giữa 2 trang */
}

.row-grading-step td.cell-step-content {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: none;    /* Ẩn đường kẻ ngang giữa các bước trong cùng 1 câu */
  border-bottom: none;
  padding: 4px 8px;
  vertical-align: top;
}

.row-grading-step td.cell-step-points {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-top: none;
  border-bottom: none;
  text-align: center;
  vertical-align: middle;
  font-weight: bold;
  padding: 4px;
}

/* Bước cuối cùng của một câu thì đóng khung đáy bằng nét liền */
.row-grading-step.is-last-step td {
  border-bottom: 1px solid #000;
}

/* Hỗ trợ bố cục 2 cột cho câu Hình học (Chữ bên trái - Hình vẽ bên phải) */
.step-with-geometry {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.step-with-geometry .step-text { flex: 1; }
.step-with-geometry .step-figure {
  width: 180px;
  flex-shrink: 0;
  text-align: center;
}
```

### Logic Render HTML cho mỗi `subQuestion` trong Bảng Hướng dẫn chấm:
- Tính `totalRows = 1 + subQuestion.grading_steps.length` (1 hàng cho đề bài + N hàng cho N bước chấm).
- **Hàng 0 (Hàng đề bài)**:
  - `<td class="cell-cau" rowspan="${totalRows}">${subQuestion.sub_label}</td>`
  - `<td class="cell-prompt">${renderKatex(subQuestion.prompt_latex)}</td>`
  - `<td class="cell-prompt-points"></td>` (Để trống hoặc ghi tổng điểm tùy cấu hình).
- **Hàng `1..N` (Các hàng `grading_steps`)**:
  - Không tạo lại thẻ `<td>` cho cột `Câu` (do đã có `rowspan`).
  - Cột `Nội dung`: Render `step.latex_content` qua KaTeX. Nếu có `step.geometry_svg_or_tikz`, bọc trong `.step-with-geometry`.
  - Cột `Điểm`: Hiển thị `step.points !== null ? formatPoint(step.points) : ""` (định dạng dấu phẩy hoặc dấu chấm thống nhất, VD: `0,25` hoặc `0.25`).
  - Nếu là phần tử cuối cùng của `grading_steps`, thêm class `is-last-step` để kẻ đường ngang đóng khung câu đó.

---

## 5. Xây dựng Template Engine 2: Xuất File MS Word (`.docx`) Chuẩn Giáo Viên
Hãy tạo thêm service xuất `.docx` (dùng thư viện `docx` trong TypeScript/Node.js hoặc `python-docx` + `lxml` trong Python) thỏa mãn:
1. **Chuyển đổi công thức Toán sang Native Word Equation (OMML)**:
   - Chuyển chuỗi `$...$` từ LaTeX sang MathML (dùng `temml` hoặc `katex.renderToString(..., { output: "mathml" })` trong JS, hoặc `latex2mathml` trong Python).
   - Chuyển MathML sang OMML (`<m:oMath>`) để nhúng trực tiếp vào đoạn văn (`w:p`) của Word. Không dùng ảnh hay đối tượng MathType OLE.
2. **Dựng bảng 3 cột (`Câu | Nội dung | Điểm`) bằng `vMerge`**:
   - Với mỗi `subQuestion`, hàng đầu tiên ở cột 0 đặt `verticalMerge: VerticalMergeType.RESTART`.
   - Tất cả các hàng `grading_steps` thuộc câu đó ở cột 0 đặt `verticalMerge: VerticalMergeType.CONTINUE`.
   - Đặt thuộc tính `cantSplit` cho từng hàng `grading_step` và `tblHeader` cho hàng tiêu đề `Câu | Nội dung | Điểm`.
   - Ẩn border ngang (`BorderStyle.NONE`) giữa các hàng `grading_steps` trong cùng một câu, và bật `BorderStyle.SINGLE` ở đáy hàng cuối cùng của câu.

---

## 6. Các bước thực thi (Action Plan cho Coding Agent)
1. Khảo sát codebase hiện tại của tôi để xác định ngôn ngữ/framework đang dùng ở Backend và Frontend.
2. Tạo file Schema (`exam-schema`) và hàm kiểm tra tổng điểm (`validateExamPoints`).
3. Cập nhật Prompt / Function Calling của AI Agent hiện tại để trả về đúng `ExamDocumentSchema`.
4. Cài đặt Component hiển thị Preview bằng KaTeX + CSS Table theo đúng thiết kế `Sub-Row + Rowspan` ở Mục 4 và nút "In / Xuất PDF".
5. Cài đặt API/Service xuất file `.docx` theo Mục 5.
6. Viết 1 bộ dữ liệu mẫu (Mock Data lấy từ Câu 14b, Câu 15, Câu 16a trong đề Toán lớp 9) để test giao diện bảng chấm điểm ngay lập tức.
```
