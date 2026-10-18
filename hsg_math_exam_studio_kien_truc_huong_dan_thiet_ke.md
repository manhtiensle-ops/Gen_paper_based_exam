# KIẾN TRÚC KỸ THUẬT & THIẾT KẾ HỆ THỐNG
# HSG MATH EXAM STUDIO & AI PEDAGOGICAL CO-PILOT

---

## 1. TỔNG QUAN KIẾN TRÚC & MỤC TIÊU HỆ THỐNG

Nền tảng **HSG Math Exam Studio** được định vị là công cụ chuyên nghiệp phục vụ giáo viên bồi dưỡng học sinh giỏi Toán THCS (lớp 8, 9) và luyện thi vào lớp 10 Chuyên. Hệ thống chuyển đổi từ luồng lọc câu hỏi truyền thống sang môi trường **Interactive Document Studio** tương tác hai chiều, tích hợp mô hình ngôn ngữ lớn `antigravity/gemini-3.8-flash-tiered` qua proxy OmniRoute cục bộ và dịch vụ xuất bản tài liệu Word/PDF chuẩn biểu mẫu Bộ/Sở Giáo dục và Đào tạo.

---

## 2. THIẾT KẾ KIẾN TRÚC DỮ LIỆU (HYBRID RELATIONAL + JSONB)

### 2.1. Triết lý Thiết kế: "Snapshot Instance"
Khi câu hỏi được đưa vào một đề thi cụ thể, câu hỏi đó tách khỏi tham chiếu tĩnh của ngân hàng câu hỏi (`questions`) để trở thành một bản thể độc lập (**Problem Snapshot**). Giáo viên có quyền sửa đổi lời dẫn, điều chỉnh hệ số, hoán đổi thứ tự hoặc bẻ nhỏ mốc điểm mà không làm thay đổi câu hỏi gốc trong ngân hàng.

### 2.2. Data Schema chi tiết trên PostgreSQL 16

```sql
-- 1. Bảng lưu trữ Đề thi & Cấu hình Header hành chính
CREATE TABLE generated_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL DEFAULT 'HSG_9', -- 'HSG_8', 'HSG_9', 'CHUYEN_10'
    total_target_score NUMERIC(4, 2) NOT NULL DEFAULT 20.00, -- Thường là 10.00 hoặc 20.00 điểm
    current_total_score NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 150,
    
    -- Lưu cấu hình Quốc hiệu, Sở/Phòng GD, Trường, Kỳ thi, Khung SBD/Phách
    header_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Lưu kết quả thẩm định sức khỏe đề thi (Exam Health-check) gần nhất
    health_check_report JSONB DEFAULT NULL,
    
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'VERIFIED', 'PUBLISHED'
    version INT NOT NULL DEFAULT 1,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng chi tiết từng Câu hỏi trong Đề thi (Snapshot + Barem)
CREATE TABLE exam_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES generated_exams(id) ON DELETE CASCADE,
    source_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    
    order_index INT NOT NULL, -- Phục vụ Drag & Drop (0, 1, 2...)
    display_label VARCHAR(50) NOT NULL, -- Tự động đánh lại: "Câu 1", "Câu 2" hoặc "Bài I"
    max_points NUMERIC(4, 2) NOT NULL DEFAULT 3.00,
    
    -- Snapshot độc lập để giáo viên sửa đề/biến thể không làm hỏng ngân hàng gốc
    problem_snapshot JSONB NOT NULL,
    
    -- Cấu trúc Barem điểm chi tiết đến 0.25đ (Phục vụ bảng 2 cột Hướng dẫn chấm)
    rubric_data JSONB NOT NULL,
    
    -- Lưu vết nếu câu này được sinh biến thể từ AI
    is_ai_variant BOOLEAN NOT NULL DEFAULT FALSE,
    variant_metadata JSONB DEFAULT NULL,
    
    -- Embedding của lời giải/kỹ thuật giải để chạy Health-check chống trùng lặp
    technique_embedding vector(768),
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_items_exam_order ON exam_items(exam_id, order_index);

-- 3. Bảng Audit Trail & Undo/Redo lịch sử sửa Barem của Giáo viên
CREATE TABLE exam_rubric_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_item_id UUID NOT NULL REFERENCES exam_items(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,
    actor_type VARCHAR(30) NOT NULL, -- 'AI_CO_PILOT', 'TEACHER_MANUAL', 'AUTO_REBALANCE'
    previous_rubric JSONB NOT NULL,
    new_rubric JSONB NOT NULL,
    change_summary TEXT, -- VD: "Giáo viên tách bước ĐKXĐ thành 0.25đ riêng"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3. Cấu trúc JSONB Chuẩn cho `header_config` & `rubric_data`

```json
{
  "header_config": {
    "governing_body": "UBND QUẬN CẦU GIẤY",
    "department_or_school": "PHÒNG GIÁO DỤC VÀ ĐÀO TẠO",
    "exam_name": "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9 CẤP QUẬN",
    "academic_year": "Năm học: 2026 - 2027",
    "subject_title": "Môn thi: TOÁN 9",
    "exam_code": "ĐỀ CHÍNH THỨC",
    "show_sbd_box": true,
    "show_grading_box": false,
    "footer_note": "Thí sinh không được sử dụng tài liệu và máy tính cầm tay."
  },
  "rubric_data": {
    "sub_parts": [
      {
        "part_id": "part_1a",
        "part_label": "1a",
        "part_title": "Giải phương trình vô tỉ",
        "sub_max_points": 2.00,
        "keep_together_on_page": true,
        "geometry_image_minio_key": null,
        "steps": [
          {
            "step_id": "st_01",
            "milestone_tag": "ĐKXĐ",
            "latex_content": "Điều kiện xác định: $x \\ge -\\frac{3}{2}$ và $x \\ne 1$.",
            "points": 0.25,
            "is_locked_by_teacher": true
          },
          {
            "step_id": "st_02",
            "milestone_tag": "Biến đổi tương đương",
            "latex_content": "Phương trình tương đương với: $(x - 2)\\left(\\sqrt{2x+3} - \\frac{x+5}{\\sqrt{2x+3}+3}\\right) = 0$",
            "points": 0.75,
            "is_locked_by_teacher": false
          },
          {
            "step_id": "st_03",
            "milestone_tag": "Giải từng trường hợp",
            "latex_content": "Trường hợp 1: $x - 2 = 0 \\Leftrightarrow x = 2$ (thỏa mãn ĐKXĐ).\\\\ Trường hợp 2: Chứng minh biểu thức trong ngoặc luôn dương với mọi $x \\ge -\\frac{3}{2}$.",
            "points": 0.75,
            "is_locked_by_teacher": false
          },
          {
            "step_id": "st_04",
            "milestone_tag": "Kết luận",
            "latex_content": "Vậy tập nghiệm của phương trình là $S = \\{2\\}$.",
            "points": 0.25,
            "is_locked_by_teacher": false
          }
        ]
      }
    ]
  }
}
```

---

## 3. TECH STACK & GIẢI PHÁP TỐI ƯU HIỆU NĂNG

### 3.1. Phía Frontend (Next.js 14 App Router)

Khi xử lý một đề thi HSG có 5–6 bài lớn (15–20 ý nhỏ và hàng trăm đoạn công thức KaTeX phức tạp), kéo-thả trực tiếp DOM sẽ gây tụt giật khung hình nếu re-render toàn bộ cây component.

| Thành phần | Công nghệ lựa chọn | Lý do & Kỹ thuật tối ưu |
| :--- | :--- | :--- |
| **Kéo - Thả (DnD)** | `@dnd-kit/core` + `@dnd-kit/sortable` | Tách biệt hoàn toàn sự kiện kéo chuột khỏi DOM thực tế; tối ưu hơn `framer-motion` cho danh sách có chiều cao biến thiên lớn. |
| **Quản lý trạng thái** | `Zustand` + `immer` + `zundo` | Cập nhật cấu trúc cây điểm lồng nhau mà không re-render toàn bộ đề; hỗ trợ Undo/Redo (`Ctrl+Z`, `Ctrl+Y`) tự động và nhẹ dưới 1KB. |
| **Render Công thức** | `katex.renderToString` + `React.memo` | Tránh dùng `<BlockMath>` bọc lại component. Viết component `<MemoizedLatex>` chỉ render lại khi chuỗi LaTeX có sự thay đổi thực sự. |

#### 3 Kỹ thuật bắt buộc để giữ vững 60 FPS:
1. **Collapse-on-DragStart:** Khi sự kiện `onDragStart` kích hoạt, dùng `<DragOverlay>` chỉ hiển thị thẻ tóm tắt ngắn gọn (`Câu 2 [4.0 điểm] - Bất đẳng thức Cauchy`) thay vì kéo theo cả khối nội dung dài hàng trang giấy.
2. **CSS Containment:** Sử dụng `contain: layout paint;` và `content-visibility: auto;` cho từng thẻ câu hỏi. Điều này ngăn trình duyệt tính toán lại layout của các công thức KaTeX ở các câu hỏi đứng yên.
3. **Debounced Sync & Client Re-indexing:** Khi hoán đổi vị trí câu hỏi, Zustand cập nhật lại nhãn `display_label = "Câu " + (index + 1)` tức thì trên Client, sau đó gọi `PATCH /api/exams/{id}/reorder` debounced 800ms xuống Backend.

---

### 3.2. Phía Backend Export Service (Hybrid OOXML Builder)

Biên dịch từ LaTeX/Markdown sang Word `.docx` thuần bằng Pandoc thường gặp 3 lỗi nghiêm trọng đối với đề thi chuẩn Việt Nam:
1. Không thể can thiệp thẻ XML `<w:cantSplit/>` trên từng bước giải $\rightarrow$ bước giải hoặc hình vẽ bị cắt ngang giữa hai trang.
2. Không trộn ô (rowspan/colspan) chính xác cho bảng Hướng dẫn chấm 3 cột (`Câu` - `Nội dung hướng dẫn chấm` - `Điểm`).
3. Công thức bị render dưới dạng hình ảnh chất lượng thấp hoặc vỡ font nếu dùng LibreOffice headless để chuyển đổi.

#### Kiến trúc Hybrid OOXML Builder chuẩn:
* **Tầng chuyển đổi LaTeX $\rightarrow$ OMML Native:**
  Sử dụng `latex2mathml` để chuyển chuỗi LaTeX sang MathML, sau đó dùng `lxml.etree.XSLT` với file stylesheet `MML2OMML.XSL` để sinh ra node XML `<m:oMath>` chuẩn của Microsoft Word. Node này được nhúng trực tiếp vào paragraph của `python-docx`. Công thức hiển thị tự nhiên, sắc nét và có thể chỉnh sửa trực tiếp bằng Word Equation Editor.
* **Tầng kiểm soát ngắt trang (Page-break Rules):**
  Can thiệp trực tiếp vào cấu trúc OOXML:
  ```python
  from docx.oxml import OxmlElement
  from docx.oxml.ns import qn

  def prevent_row_split_and_repeat_header(row, is_header=False):
      """Khóa không cho Word cắt đôi bước giải giữa trang và lặp lại tiêu đề bảng."""
      trPr = row._tr.get_or_add_trPr()
      
      # 1. Chống cắt ngang dòng khi sang trang mới
      cantSplit = OxmlElement('w:cantSplit')
      trPr.append(cantSplit)
      
      # 2. Lặp lại dòng tiêu đề nếu bảng kéo dài sang trang tiếp theo
      if is_header:
          tblHeader = OxmlElement('w:tblHeader')
          trPr.append(tblHeader)

  def keep_with_next_paragraph(paragraph):
      """Đảm bảo tiêu đề câu dính liền với nội dung bước đầu tiên."""
      pPr = paragraph._p.get_or_add_pPr()
      keepNext = OxmlElement('w:keepNext')
      pPr.append(keepNext)
  ```
* **Xuất song song và đóng gói ZIP:**
  FastAPI chạy song song 2 tác vụ trên `asyncio.to_thread`:
  1. `build_student_exam_docx(exam_data)` $\rightarrow$ `De_thi_chinh_thuc.docx`
  2. `build_official_rubric_docx(exam_data)` $\rightarrow$ `Huong_dan_cham_va_bieu_diem.docx`
  Đóng gói cả hai tệp vào `io.BytesIO` thông qua thư viện `zipfile` và trả về trực tiếp cho trình duyệt.

---

## 4. CHIẾN LƯỢC PROMPT ENGINEERING CHO GEMINI 3.8 FLASH

### 4.1. Kỹ thuật "Integer Quanta Tokenization" (Bẻ Barem 0.25đ Không Ảo Giác)

Mô hình LLM dạng Flash dễ gặp sai số cộng dồn khi tính toán số thập phân ($0.25, 0.5, 0.75$). 
**Giải pháp:** Quy đổi toàn bộ điểm số sang đơn vị nguyên gọi là **Quanta** ($1\text{ quantum} = 0.25\text{ điểm}$).
Ví dụ: Câu 3.0 điểm = 12 quanta. Buộc AI phân bổ số nguyên quanta và tính giá trị cộng dồn `cumulative_quanta` tại từng bước.

```python
RUBRIC_SYSTEM_PROMPT = """
Bạn là Chuyên gia Khảo thí Toán THCS & Chuyên Toán tại Việt Nam.
Nhiệm vụ: Phân rã lời giải LaTeX của một bài toán thành biểu điểm chấm thi (Barem) chi tiết theo chuẩn Sở GD&ĐT.

QUY TẮC SỐ HỌC BẮT BUỘC (QUANTA SYSTEM):
1. Hệ thống sử dụng đơn vị điểm nguyên gọi là "quanta", trong đó: 1 quantum = 0.25 điểm.
2. Bạn được cấp `target_total_quanta` (Tổng số quanta bắt buộc của câu hỏi).
3. Mỗi bước chấm điểm (`steps`) chỉ được gán `allocated_quanta` là số nguyên dương (1 = 0.25đ, 2 = 0.50đ, 3 = 0.75đ, 4 = 1.00đ).
4. Tại mỗi bước, bạn PHẢI tính `cumulative_quanta` = tổng `allocated_quanta` từ bước 1 đến bước hiện tại.
5. Ở bước cuối cùng, `cumulative_quanta` BẮT BUỘC BẰNG CHÍNH XÁC `target_total_quanta`.

QUY TẮC SƯ PHẠM TOÁN THCS:
- Luôn tách riêng mốc "Điều kiện xác định (ĐKXĐ)" hoặc "Vẽ hình / Giả thiết kết luận" (thường 1 quantum = 0.25đ).
- Các bước biến đổi tương đương chủ chốt, lập luận đồng dư, hoặc chứng minh tứ giác nội tiếp nhận 2 đến 3 quanta (0.50đ - 0.75đ).
- Bước "Đối chiếu điều kiện và Kết luận nghiệm" ở cuối bài nhận 1 quantum (0.25đ).
- Giữ nguyên định dạng công thức LaTeX chuẩn trong cặp dấu $...$ hoặc $$...$$.
"""

RUBRIC_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "target_total_quanta": {"type": "integer"},
        "pedagogical_analysis": {
            "type": "string",
            "description": "Phân tích chốt chặn sư phạm ăn điểm của bài toán"
        },
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "step_order": {"type": "integer"},
                    "milestone_tag": {
                        "type": "string",
                        "enum": ["ĐKXĐ", "Đặt ẩn phụ", "Biến đổi đại số", "Chứng minh hình học", "Bất đẳng thức", "Xét trường hợp", "Kết luận"]
                    },
                    "latex_content": {"type": "string"},
                    "allocated_quanta": {"type": "integer", "minimum": 1, "maximum": 6},
                    "cumulative_quanta": {"type": "integer"}
                },
                "required": ["step_order", "milestone_tag", "latex_content", "allocated_quanta", "cumulative_quanta"]
            }
        }
    },
    "required": ["target_total_quanta", "pedagogical_analysis", "steps"]
}
```

---

### 4.2. Kỹ thuật "Reverse-Construct from Roots" (Sinh Biến Thể Nghiệm Nguyên Đẹp)

Tuyệt đối cấm LLM thay số ngẫu nhiên vào phương trình/bất đẳng thức gốc. AI phải tuân thủ chu trình kiến tạo ngược 4 bước:

```text
[SYSTEM PROMPT - REVERSE VARIANT GENERATOR]
Bạn là Chuyên gia Ra đề thi Học sinh giỏi Toán THCS & Tuyển sinh Lớp 10 Chuyên.
Nhiệm vụ: Tạo bài toán biến thể (Đề A / Đề B / Chống lộ đề) từ một bài toán gốc đã có.
Nguyên tắc cốt lõi: GIỮ NGUYÊN BẢN CHẤT PHƯƠNG PHÁP & NGHIỆM PHẢI LÀ SỐ NGUYÊN ĐẸP HOẶC PHÂN SỐ TỐI GIẢN (ZERO-UGLY NUMBERS).

Quy trình 4 bước bắt buộc:
1. `structural_skeleton`: Nhận diện khung bất biến của bài toán gốc (Ví dụ: phương trình tích $(x - x_0)(A\sqrt{mx+n} + B) = 0$, hay BĐT đối xứng đạt cực trị tại $a = b = c = k$).
2. `new_clean_anchor`: Chọn trước giá trị nghiệm nguyên mới $x_0$ hoặc điểm rơi cực trị mới sao cho các biểu thức dưới dấu căn tại điểm đó luôn là số chính phương ($4, 9, 16, 25$).
3. `reverse_coefficient_calculation`: Thay ngược nghiệm đẹp vào khung đại số để tính toán các hệ số mới của bài toán. Thử lại trực tiếp để đảm bảo không sinh thêm nghiệm ngoại lai không mong muốn.
4. `output_generation`: Xuất đề bài hoàn chỉnh, lời giải chi tiết và barem điểm theo quy chuẩn Quanta 0.25đ.
```

---

### 4.3. Thẩm định Sức Khỏe Đề Thi (Exam Health-Check Pipeline)

Kết hợp giữa tìm kiếm tương đồng vector (`pgvector`) và bộ lọc logic của Gemini Flash:
1. **Lớp 1 – Vector Filtering (`pgvector`):**
   Mỗi câu hỏi có vector `technique_embedding` (768 chiều, mô tả: *Dạng toán + Kỹ thuật then chốt + Kiến thức sử dụng*). Khi giáo viên ấn Health-check, hệ thống quét ma trận khoảng cách Cosine giữa tất cả các cặp câu trong đề:
   $$\text{Similarity}(i, j) = 1 - (\text{item}_i.\text{technique\_embedding} \Leftrightarrow \text{item}_j.\text{technique\_embedding})$$
   Các cặp câu có $\text{Similarity} \ge 0.82$ được đưa vào danh sách cảnh báo trùng lặp kỹ thuật giải.
2. **Lớp 2 – LLM Pedagogical Judge (Gemini 3.8 Flash):**
   Đánh giá toàn diện 4 yếu tố:
   * **Trùng lặp kỹ thuật:** Chỉ ra rõ hai câu cùng dùng chung một kỹ thuật biến đổi (VD: Cùng sử dụng kỹ thuật liên hợp tách nghiệm hoặc BĐT Cauchy ngược dấu).
   * **Cân bằng chuyên đề:** Kiểm tra độ phủ đủ 5 trụ cột: Số học, Đại số, Hình học phẳng, Bất đẳng thức & Cực trị, Tổ hợp / Nguyên lý Dirichlet.
   * **Độ chặt chẽ của biểu thức:** Soát lỗi điều kiện tồn tại của biểu thức, thiếu điều kiện nguyên dương của biến, hoặc sai ký hiệu hình học.
   * **Tải thời gian 150 phút:** Tổng hợp số bước giải trong toàn bộ các câu; nếu tổng số bước tư duy phức tạp vượt quá 32 mốc, hệ thống đưa ra cảnh báo quá tải thời gian.

---

## 5. THIẾT KẾ TRẢI NGHIỆM NGƯỜI DÙNG (EXAM STUDIO UX/UI)

Hệ thống được tổ chức thành giao diện **3-Pane Studio** chuyên dụng:

```
+---------------------------------------------------------------------------------------------------+
| Topbar: Tên Kỳ Thi | Sticky Score Bar: [ Tổng: 20.00 / 20.00đ ] | Switcher: [Đề Thi | Hướng Dẫn] |
+------------------+-------------------------------------------------------------+------------------+
| CỘT TRÁI (280px) | CỘT GIỮA (Fluid Paper Canvas - Khổ A4)                     | CỘT PHẢI (340px) |
| - Cấu trúc ma    |                                                             | - Drawer AI      |
|   trận đề thi    | [📄 Chế độ Đề thi Thí sinh]:                                |   Co-pilot       |
| - Kéo thả câu    | + Header Quốc hiệu, Sở GD, Khung SBD, Điểm/Lời phê          |                  |
|   thu gọn        | + Câu 1 (4.0đ): Khảo sát & Phương trình...                  | - Bẻ lại barem   |
| - Slot           | + Câu 2 (4.0đ): Bất đẳng thức & Cực trị...                  |   0.25đ          |
|   Recommendation | ----------------------------------------------------------- | - Đổi số nghiệm  |
|   (Gợi ý lấp câu | [⚖️ Chế độ Hướng dẫn chấm & Barem]:                         |   đẹp (Biến thể) |
|   thiếu)         | + Bảng 2 cột: Cột Lời giải chi tiết | Cột Barem 0.25đ       | - Báo cáo Health |
|                  | + Nút bấm nhanh: [-0.25] [0.50đ] [+0.25] [🔒 Khóa]          |   check đề thi   |
|                  | + Hover dòng: [+ Tách bước chấm] [⇅ Gộp dòng trên]          | - Diff-view trực |
|                  |                                                             |   quan           |
+------------------+-------------------------------------------------------------+------------------+
| Footer: Nút Xuất Bản DOCX Song Song (Đề Thi + Barem) | Nút Lưu Bản In PDF                        |
+---------------------------------------------------------------------------------------------------+
```

### Các Vi tương tác (Micro-interactions) Nâng cao cho Giáo viên
* **Sticky Score Bar:** Thanh báo điểm neo cố định trên đỉnh màn hình, tự động cập nhật trạng thái màu sắc: *Xanh lá cây* (Tròn 20.0/20.0đ), *Vàng cam* (Thiếu điểm), *Đỏ* (Thừa điểm kèm số liệu chênh lệch cụ thể).
* **0.25đ Stepper & Score Lock:** Mỗi dòng bước giải có stepper điều chỉnh nhanh `0.25đ` kèm biểu tượng ổ khóa. Khi bấm khóa một số bước quan trọng và ấn *"Tự động cân bằng"*, hệ thống tự động bù trừ điểm vào các bước chưa khóa để tổng điểm của bài luôn khớp điểm trần.
* **Side-by-Side Diff View:** Khi AI Co-pilot sinh biến thể bài toán hoặc bẻ lại barem điểm, giao diện hiển thị 2 cột so sánh trực quan giữa *Nội dung hiện tại* và *Đề xuất từ AI*. Giáo viên bấm *"Chấp nhận"* để ghi đè hoặc *"Chỉnh sửa thêm"* trước khi đưa vào đề chính thức.