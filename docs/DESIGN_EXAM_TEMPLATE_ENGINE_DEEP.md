# THIẾT KẾ KỸ THUẬT SÂU: Fixed-Layout Exam Template Engine
## Phụ lục chi tiết Tech Stack, Call Chain, Code Skeleton & Integration Map

**Bổ sung cho:** `docs/DESIGN_EXAM_TEMPLATE_ENGINE.md`
**Ngày:** 19/10/2026 — **Trạng thái:** CHỜ DUYỆT

---

## 1. Bảng Tổng Kết Tech Stack Đã Có vs Cần Thêm

### 1.1. Những gì ĐÃ CÓ trong hệ thống (tận dụng 100%, không cài thêm)

| Thành phần | Phiên bản | Container | Vai trò trong tính năng mới |
| :--- | :--- | :--- | :--- |
| **Python 3.11** | 3.11-slim | `hsg_core_api`, `hsg_export_service` | Chạy Pydantic schema, API FastAPI, Render engine |
| **FastAPI** | ≥0.110 | `hsg_core_api` | API endpoint mới `/api/exam-templates/*` |
| **Pydantic v2** | ≥2.6 | `hsg_core_api` | `ExamDocumentSchema` validation + `response_format` cho AI |
| **SQLAlchemy + PostgreSQL 16** | pgvector | `hsg_postgres_db` | Cột mới `template_document JSONB` trên bảng `generated_exams` |
| **OpenAI SDK** | ≥1.20 | `hsg_core_api` | Gọi Gemini Flash qua OmniRoute để sinh `grading_steps` JSON |
| **python-docx** | ≥1.1 | `hsg_export_service` | Dựng bảng 3 cột Word với `w:vMerge` |
| **lxml** | ≥5.1 | `hsg_export_service` | Thao tác XML Word trực tiếp (`tcBorders`, `vMerge`) |
| **latex2mathml** | ≥3.77 | `hsg_export_service` | Chuyển LaTeX → MathML → OMML (pipeline đã chạy) |
| **TeX Live** (`pdflatex`) | 2025/dev | `hsg_export_service` | Biên dịch TikZ hình vẽ hình học → PNG |
| **Poppler** (`pdftoppm`) | ≥22 | `hsg_export_service` | Chuyển PDF trang → PNG 150 DPI cho preview |
| **Pandoc** | 3.1.11 | `hsg_export_service` | Dự phòng (không dùng chính cho tính năng mới) |
| **MinIO** | Chainguard | `hsg_minio_storage` | Lưu file PNG preview, PDF, DOCX đã render |
| **KaTeX** | 0.16.9 | `hsg_frontend` (npm) | Render công thức toán trên Web preview |
| **React 18 + Next.js 14** | — | `hsg_frontend` | Component `RubricTablePreview.tsx` mới |
| **TailwindCSS** | — | `hsg_frontend` | CSS cho bảng chấm (kết hợp inline style cho print) |
| **`DocxMathExamBuilder`** | Tự viết | `hsg_export_service` | Class đã có sẵn phương thức `add_marking_scheme_table()` — cần **mở rộng** thêm `w:vMerge` |
| **`LaTeXMathConverter`** | Tự viết | `hsg_export_service` | Pipeline LaTeX → MathML → OMML XSLT đã hoạt động |

### 1.2. Cần cài thêm (ít — 0-1 package)

| Package | Lý do | Container | Cài đặt |
| :--- | :--- | :--- | :--- |
| Không cần thêm gì | Toàn bộ tech stack đã đủ | — | — |

> **Kết luận:** Tính năng này **không cần cài thêm dependency nào**. Tất cả đều tận dụng lại code và thư viện hiện có.

---

## 2. Chi Tiết Từng Tầng Kỹ Thuật

### 2.1. TẦNG 1 — AI Content Generator

#### Nơi đặt code: `services/core-api/app/routers/studio.py`

#### Call chain khi giáo viên bấm "AI Sinh Barem"

```
Frontend                    Core API                         OmniRoute Proxy
─────────                   ────────                         ───────────────
Bấm [🤖 AI Sinh Barem]  →  POST /api/studio/exams/{id}/
cho Câu 14a                   ai-generate-grading-steps
                                 │
                                 │ 1. Đọc exam_items[câu 14a]
                                 │    lấy problem_snapshot.content_latex
                                 │    và problem_snapshot.solution_latex
                                 │
                                 │ 2. Gọi OpenAI SDK:
                                 │    client = OpenAI(base_url="http://192.168.1.117:20128/v1")
                                 │    response = client.chat.completions.create(
                                 │      model="antigravity/gemini-3.8-flash-tiered",
                                 │      response_format={"type": "json_schema", "json_schema": ...},
                                 │      messages=[
                                 │        {"role": "system", "content": GRADING_SYSTEM_PROMPT},
                                 │        {"role": "user", "content": f"""
                                 │          Đề bài: {content_latex}
                                 │          Lời giải tham khảo: {solution_latex}
                                 │          Tổng điểm: {total_points}
                                 │          Hãy chia thành các grading_steps, mỗi bước
                                 │          ứng mốc 0.25đ hoặc bội 0.25đ.
                                 │        """}
                                 │      ]
                                 │    )                          → Gemini Flash
                                 │                               ← JSON grading_steps
                                 │
                                 │ 3. Validate bằng Pydantic:
                                 │    steps = [GradingStep(**s) for s in parsed_steps]
                                 │    assert sum(s.points for s in steps) == total_points
                                 │
                                 │ 4. Lưu vào exam_items[câu 14a].rubric_data.steps
                                 │
                              ← 200 OK { grading_steps: [...] }
```

#### JSON Schema truyền cho Gemini (`response_format`)

```python
# Sử dụng OpenAI SDK's response_format với json_schema
# Gemini Flash qua OmniRoute hỗ trợ structured output

GRADING_STEPS_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "grading_steps_response",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "grading_steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step_id":       {"type": "string"},
                            "latex_content": {"type": "string"},
                            "points":        {"type": "number", "enum": [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]},
                            "tikz_code":     {"type": ["string", "null"]}
                        },
                        "required": ["step_id", "latex_content", "points"]
                    }
                }
            },
            "required": ["grading_steps"]
        }
    }
}
```

#### Hàm Python cụ thể (skeleton)

```python
# Trong services/core-api/app/routers/studio.py — thêm endpoint mới

@router.post("/exams/{exam_id}/ai-generate-grading-steps")
def ai_generate_grading_steps(
    exam_id: UUID,
    body: dict = Body(...),  # { "item_index": 2 } hoặc { "item_id": "uuid" }
    db: Session = Depends(get_db)
):
    """Gọi Gemini Flash sinh grading_steps cho 1 câu tự luận."""
    
    # 1. Tìm exam_item
    item_id = body.get("item_id")
    item = db.query(ExamItem).filter(ExamItem.id == item_id).first()
    if not item:
        raise HTTPException(404, "Không tìm thấy câu hỏi")
    
    snap = item.problem_snapshot or {}
    content = snap.get("content_latex", "")
    solution = snap.get("solution_latex", "")
    total_pts = float(item.max_points)
    
    # 2. Gọi AI
    client = get_omniroute_client()
    response = client.chat.completions.create(
        model="antigravity/gemini-3.8-flash-tiered",
        response_format=GRADING_STEPS_SCHEMA,
        messages=[
            {"role": "system", "content": GRADING_SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Đề bài LaTeX:
{content}

Lời giải tham khảo:
{solution}

Tổng điểm câu này: {total_pts} điểm.
Hãy chia lời giải thành các bước chấm (grading_steps).
Mỗi bước là 1 mốc điểm 0.25đ hoặc bội của 0.25đ.
Tổng điểm tất cả các bước PHẢI = {total_pts} điểm.
"""}
        ]
    )
    
    # 3. Parse & Validate
    import json
    result = json.loads(response.choices[0].message.content)
    steps = result["grading_steps"]
    
    actual_sum = sum(s["points"] for s in steps)
    if abs(actual_sum - total_pts) > 0.01:
        raise HTTPException(422, f"AI sinh tổng {actual_sum}đ ≠ {total_pts}đ. Thử lại.")
    
    # 4. Cập nhật rubric_data
    rubric = item.rubric_data or {}
    rubric["steps"] = steps
    item.rubric_data = rubric
    db.commit()
    
    return {"grading_steps": steps, "total_points": total_pts}
```

---

### 2.2. TẦNG 2 — Fixed-Layout Template Engine

#### Nơi đặt code: `services/export-service/app/template_renderer.py` (file mới)

#### Chức năng: Nhận `ExamDocument` JSON → Sinh HTML bảng chấm chuẩn 3 cột

```python
# services/export-service/app/template_renderer.py

"""
Fixed-Layout Rubric Table Renderer.
Kỹ thuật: Sub-Row per GradingStep + <td rowspan> cho cột Câu + ẩn border nội bộ.
Output: HTML string (dùng cho Web Preview) hoặc PDF (qua pdflatex/Playwright).
"""

import re
from typing import Dict, Any, List

def render_rubric_html(exam_document: Dict[str, Any]) -> str:
    """
    Render bảng Hướng dẫn chấm 3 cột từ ExamDocument JSON.
    
    Kỹ thuật cốt lõi:
    - Với mỗi EssayQuestion (VD: Câu 14a, 2.0đ, có 4 grading_steps):
      → Tạo 5 hàng <tr>: 1 hàng đề bài + 4 hàng step
      → <td rowspan="5"> ở cột Câu (gộp dọc)
      → Border ngang giữa các step: display none
      → Border ngang ở step cuối cùng: 1px solid #000
    """
    
    meta = exam_document.get("metadata", {})
    part2 = exam_document.get("part2_essay", {})
    questions = part2.get("questions", [])
    
    html_parts = []
    
    # 1. Tiêu đề trang
    html_parts.append(f'''
    <div class="exam-container">
      <div class="rubric-header">
        <h2>HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT</h2>
        <p>{meta.get("exam_title", "")} — {meta.get("grade_and_year", "")}</p>
        <p>Môn: {meta.get("subject", "TOÁN")} — Thời gian: {meta.get("duration_minutes", 120)} phút</p>
      </div>

      <table class="rubric-table">
        <colgroup>
          <col class="col-cau" style="width: 12%;" />
          <col class="col-noidung" style="width: 78%;" />
          <col class="col-diem" style="width: 10%;" />
        </colgroup>
        <thead>
          <tr>
            <th>Câu</th>
            <th>Nội dung</th>
            <th>Điểm</th>
          </tr>
        </thead>
        <tbody>
    ''')
    
    # 2. Render từng câu tự luận
    for q in questions:
        steps = q.get("grading_steps", [])
        total_rows = 1 + len(steps)  # 1 hàng đề + N hàng step
        sub_label = q.get("sub_label", "")
        prompt = q.get("prompt_latex", "")
        
        # Hàng 0: Đề bài
        html_parts.append(f'''
          <tr class="row-prompt">
            <td class="cell-cau" rowspan="{total_rows}">
              {sub_label.replace(chr(10), "<br/>")}
            </td>
            <td class="cell-prompt">{_katex_placeholder(prompt)}</td>
            <td class="cell-prompt-points"></td>
          </tr>
        ''')
        
        # Hàng 1..N: Các bước giải
        for s_idx, step in enumerate(steps):
            is_last = (s_idx == len(steps) - 1)
            last_cls = " last-step" if is_last else ""
            content = step.get("latex_content", "")
            points = step.get("points")
            tikz = step.get("tikz_code")
            
            # Nếu có hình vẽ TikZ → layout 2 cột trong ô
            if tikz:
                content_html = f'''
                  <div class="step-with-figure">
                    <div class="text-col">{_katex_placeholder(content)}</div>
                    <div class="figure-col">
                      <img src="/api/tikz-render?code={_url_encode(tikz)}" 
                           alt="Hình vẽ" style="max-width: 180px;" />
                    </div>
                  </div>
                '''
            else:
                content_html = _katex_placeholder(content)
            
            points_str = f"{points:.2f}" if points else ""
            
            html_parts.append(f'''
              <tr class="row-step{last_cls}">
                <td class="cell-content">{content_html}</td>
                <td class="cell-points">{points_str}</td>
              </tr>
            ''')
    
    html_parts.append('''
        </tbody>
      </table>
    </div>
    ''')
    
    return "\n".join(html_parts)


def _katex_placeholder(latex_text: str) -> str:
    """
    Đánh dấu biểu thức $...$ và $$...$$ để frontend thay bằng KaTeX rendered.
    Nếu render server-side, gọi KaTeX CLI hoặc katex npm trực tiếp.
    """
    # Placeholder: giữ nguyên LaTeX, frontend sẽ dùng react-katex parse
    return latex_text


def _url_encode(s: str) -> str:
    import urllib.parse
    return urllib.parse.quote(s, safe="")
```

---

### 2.3. TẦNG 3A — Web Preview (Frontend React)

#### Nơi đặt code: `frontend/components/RubricTablePreview.tsx` (file mới)

#### Cách hoạt động

```
ExamStudioView.tsx
  │
  │ Khi giáo viên bấm tab [⚖️ Hướng Dẫn Chấm]:
  │
  │ 1. Gọi GET /api/studio/exams/{id}/template-document
  │    → nhận ExamDocument JSON
  │
  │ 2. Truyền JSON vào <RubricTablePreview examDocument={data} />
  │
  │ 3. Component render bảng HTML ngay trên trình duyệt
  │    (không cần gọi backend render)
  │
  │ 4. Mỗi chuỗi $...$ được bọc trong <InlineMath math="..." />
  │    (dùng react-katex, đã cài sẵn trong package.json)
  │
  └→ Kết quả: Bảng 3 cột hiển thị tức thì trên nửa phải của Studio
```

#### Code skeleton React

```tsx
// frontend/components/RubricTablePreview.tsx

"use client";
import React from "react";
import MathRenderer from "@/components/MathRenderer";

interface GradingStep {
  step_id: string;
  latex_content: string;
  points: number | null;
  tikz_code?: string | null;
}

interface EssayQuestion {
  sub_label: string;
  total_points: number;
  prompt_latex: string;
  grading_steps: GradingStep[];
}

interface ExamDocument {
  metadata: {
    exam_title: string;
    grade_and_year: string;
    subject: string;
    duration_minutes: number;
  };
  part2_essay: {
    section_title: string;
    questions: EssayQuestion[];
  };
}

export default function RubricTablePreview({ examDocument }: { examDocument: ExamDocument }) {
  const questions = examDocument.part2_essay?.questions || [];
  
  return (
    <div className="rubric-container font-serif text-[12pt] leading-[1.35] text-black bg-white p-6">
      {/* Tiêu đề */}
      <div className="text-center mb-4">
        <h2 className="font-bold text-[13pt] uppercase">
          Hướng Dẫn Chấm Và Thang Điểm Chi Tiết
        </h2>
        <p className="text-[11pt]">
          {examDocument.metadata.exam_title} — {examDocument.metadata.grade_and_year}
        </p>
      </div>
      
      {/* Bảng 3 cột */}
      <table className="w-full border-collapse border border-black" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "12%" }} />
          <col style={{ width: "78%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-black p-1.5 text-center font-bold text-[11pt]">Câu</th>
            <th className="border border-black p-1.5 text-center font-bold text-[11pt]">Nội dung</th>
            <th className="border border-black p-1.5 text-center font-bold text-[11pt]">Điểm</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, qi) => {
            const totalRows = 1 + q.grading_steps.length;
            return (
              <React.Fragment key={qi}>
                {/* Hàng đề bài */}
                <tr>
                  <td
                    rowSpan={totalRows}
                    className="border border-black p-2 text-center align-middle font-bold text-[11pt] whitespace-pre-line"
                  >
                    {q.sub_label}
                  </td>
                  <td className="border border-black p-2 font-bold">
                    <MathRenderer content={q.prompt_latex} />
                  </td>
                  <td className="border border-black p-1.5 text-center"></td>
                </tr>
                
                {/* Các hàng bước giải */}
                {q.grading_steps.map((step, si) => {
                  const isLast = si === q.grading_steps.length - 1;
                  return (
                    <tr key={step.step_id}>
                      <td
                        className="p-2 align-top"
                        style={{
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: isLast ? "1px solid #000" : "none",
                        }}
                      >
                        <MathRenderer content={step.latex_content} />
                      </td>
                      <td
                        className="text-center align-middle font-bold text-[11pt]"
                        style={{
                          borderLeft: "1px solid #000",
                          borderRight: "1px solid #000",
                          borderTop: "none",
                          borderBottom: isLast ? "1px solid #000" : "none",
                        }}
                      >
                        {step.points != null ? step.points.toFixed(2) : ""}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

#### Tích hợp vào ExamStudioView.tsx hiện tại

Thêm 1 tab mới `"rubric-table"` vào thanh tab bên trái (cạnh "editor", "items", "knobs"):

```tsx
// Trong ExamStudioView.tsx, thêm state:
const [sidebarTab, setSidebarTab] = useState<"editor" | "items" | "knobs" | "rubric-table">("editor");
const [templateDocument, setTemplateDocument] = useState<any>(null);

// Thêm nút tab:
<button onClick={() => { setSidebarTab("rubric-table"); loadTemplateDocument(); }}>
  📊 Khung Barem
</button>

// Thêm panel:
{sidebarTab === "rubric-table" && templateDocument && (
  <RubricTablePreview examDocument={templateDocument} />
)}
```

---

### 2.4. TẦNG 3B — Export Word DOCX (Mở rộng `docx_math_builder.py`)

#### Thay đổi cụ thể cần làm trên class `DocxMathExamBuilder`

**Phương thức hiện tại:** `add_marking_scheme_table()` ở dòng 326-407

**Vấn đề:** Mỗi bước giải là 1 hàng riêng NHƯNG cột Câu cũng là 1 hàng riêng → không có `rowspan` → nhãn câu bị lặp lại hoặc để trống.

**Giải pháp: Viết phương thức MỚI** `add_fixed_layout_rubric_table()` dùng `w:vMerge`:

```python
def add_fixed_layout_rubric_table(self, essay_questions: List[Dict[str, Any]]):
    """
    Dựng bảng 3 cột với kỹ thuật vMerge (gộp ô dọc) cho cột Câu.
    
    Word XML cho vMerge:
    - Hàng đầu tiên của câu: <w:vMerge w:val="restart"/>
    - Các hàng step tiếp theo: <w:vMerge/>  (tức w:val="continue")
    - Ẩn border ngang: <w:tcBorders><w:top w:val="nil"/><w:bottom w:val="nil"/></w:tcBorders>
    - Hàng cuối của câu: <w:bottom w:val="single"/>
    """
    
    # Tạo bảng rỗng với 1 hàng header
    table = self.doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Định nghĩa chiều rộng cố định
    col_widths_dxa = [1417, 7511, 1134]  # ~12%, ~78%, ~10% của A4
    
    # Setup thead (header row)
    hdr_row = table.rows[0]
    trPr = hdr_row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
    
    for idx, text in enumerate(["Câu", "Nội dung", "Điểm"]):
        cell = hdr_row.cells[idx]
        self._set_cell_width_dxa(cell, col_widths_dxa[idx])
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.bold = True
        run.font.size = Pt(11)
    
    self._apply_table_borders(table)  # Border ngoài khung
    
    # Render từng câu tự luận
    for q in essay_questions:
        sub_label = q["sub_label"]
        prompt = q["prompt_latex"]
        steps = q["grading_steps"]
        
        # ─── Hàng 0: Đề bài ───
        row_prompt = table.add_row()
        trPr = row_prompt._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        # Cột 0 (Câu): vMerge RESTART
        c0 = row_prompt.cells[0]
        self._set_cell_width_dxa(c0, col_widths_dxa[0])
        c0.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        tcPr0 = c0._tc.get_or_add_tcPr()
        tcPr0.append(parse_xml(f'<w:vMerge {nsdecls("w")} w:val="restart"/>'))
        p0 = c0.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for line in sub_label.split("\n"):
            run = p0.add_run(line + "\n")
            run.font.bold = True
            run.font.size = Pt(10.5)
        
        # Cột 1 (Nội dung): Đề bài in đậm
        c1 = row_prompt.cells[1]
        self._set_cell_width_dxa(c1, col_widths_dxa[1])
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        self.add_mixed_text_with_math(p1, prompt)
        for run in p1.runs:
            run.font.bold = True
        
        # Cột 2 (Điểm): để trống cho hàng đề bài
        c2 = row_prompt.cells[2]
        self._set_cell_width_dxa(c2, col_widths_dxa[2])
        
        # ─── Hàng 1..N: Các bước giải ───
        for s_idx, step in enumerate(steps):
            is_last = (s_idx == len(steps) - 1)
            
            row_step = table.add_row()
            trPr = row_step._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            
            # Cột 0: vMerge CONTINUE (ô rỗng, gộp vào ô trên)
            c0s = row_step.cells[0]
            self._set_cell_width_dxa(c0s, col_widths_dxa[0])
            tcPr0s = c0s._tc.get_or_add_tcPr()
            tcPr0s.append(parse_xml(f'<w:vMerge {nsdecls("w")}/>'))
            
            # Cột 1: Nội dung bước giải
            c1s = row_step.cells[1]
            self._set_cell_width_dxa(c1s, col_widths_dxa[1])
            p1s = c1s.paragraphs[0]
            p1s.paragraph_format.space_before = Pt(2)
            p1s.paragraph_format.space_after = Pt(2)
            self.add_mixed_text_with_math(p1s, step.get("latex_content", ""))
            
            # ẨN border ngang nội bộ
            border_bottom = 'w:val="single" w:sz="4" w:color="000000"' if is_last else 'w:val="nil"'
            border_top = 'w:val="nil"'
            
            for cell in [c0s, c1s]:
                tcPr = cell._tc.get_or_add_tcPr()
                borders = parse_xml(f'''
                    <w:tcBorders {nsdecls("w")}>
                        <w:top {border_top}/>
                        <w:bottom {border_bottom}/>
                    </w:tcBorders>
                ''')
                tcPr.append(borders)
            
            # Cột 2: Điểm (in đậm, căn giữa)
            c2s = row_step.cells[2]
            self._set_cell_width_dxa(c2s, col_widths_dxa[2])
            c2s.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p2s = c2s.paragraphs[0]
            p2s.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pts = step.get("points")
            if pts:
                run_pts = p2s.add_run(f"{pts:.2f}")
                run_pts.font.bold = True
                run_pts.font.size = Pt(10.5)
            
            # Border cho ô điểm
            tcPr2 = c2s._tc.get_or_add_tcPr()
            borders2 = parse_xml(f'''
                <w:tcBorders {nsdecls("w")}>
                    <w:top {border_top}/>
                    <w:bottom {border_bottom}/>
                </w:tcBorders>
            ''')
            tcPr2.append(borders2)
```

#### Xử lý hình vẽ TikZ trong Word

```python
def _render_tikz_to_png(self, tikz_code: str, temp_dir: str) -> str:
    """Biên dịch TikZ → PDF → PNG bằng TeX Live đã có sẵn trong container."""
    import subprocess
    
    tex_content = r"""
\documentclass[border=2pt]{standalone}
\usepackage{tikz}
\begin{document}
""" + tikz_code + r"""
\end{document}
"""
    tex_path = os.path.join(temp_dir, "figure.tex")
    with open(tex_path, "w") as f:
        f.write(tex_content)
    
    # pdflatex (đã có trong container)
    subprocess.run(
        ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
        capture_output=True, timeout=10
    )
    
    # pdftoppm (đã có trong container)  
    pdf_path = os.path.join(temp_dir, "figure.pdf")
    png_path = os.path.join(temp_dir, "figure")
    subprocess.run(
        ["pdftoppm", "-png", "-r", "300", pdf_path, png_path],
        capture_output=True, timeout=5
    )
    
    return f"{png_path}-1.png"  # pdftoppm output format
```

---

### 2.5. TẦNG 3A bổ sung — Export PDF từ HTML

#### Phương án: TeX Live biên dịch `longtblr` (TẬN DỤNG TeX Live ĐÃ CÓ)

**Không cài Playwright/Puppeteer** (nặng 300MB+). Thay vào đó, sinh file `.tex` với gói `tabularray` (đã có trong `texlive-latex-recommended`), biên dịch bằng `pdflatex` đã có sẵn:

```python
def render_rubric_to_latex(exam_document: Dict[str, Any]) -> str:
    """Sinh mã LaTeX bảng chấm 3 cột dùng longtblr (tự động sang trang)."""
    
    meta = exam_document["metadata"]
    questions = exam_document["part2_essay"]["questions"]
    
    lines = [
        r"\documentclass[12pt,a4paper]{article}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage[vietnamese]{babel}",
        r"\usepackage{mathptmx}",  # Times New Roman
        r"\usepackage[top=1.8cm,bottom=1.8cm,left=2cm,right=1.8cm]{geometry}",
        r"\usepackage{tabularray}",
        r"\usepackage{amsmath,amssymb}",
        r"\UseTblrLibrary{booktabs}",
        r"\begin{document}",
        r"\begin{center}",
        r"{\bfseries\large HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT}\\[4pt]",
        f"{meta['exam_title']} --- {meta['grade_and_year']}",
        r"\end{center}",
        r"\vspace{6pt}",
        r"\begin{longtblr}[",
        r"  caption={},",
        r"  label={tbl:rubric},",
        r"]{",
        r"  colspec = {|p{0.12\textwidth}|X[l]|p{0.08\textwidth}|},",
        r"  rowhead = 1,",  # Lặp header khi sang trang
        r"  hlines,",
        r"  row{1} = {font=\bfseries, halign=c},",
        r"}",
        r"Câu & Nội dung & Điểm \\",
    ]
    
    for q in questions:
        steps = q["grading_steps"]
        n_rows = 1 + len(steps)
        label_escaped = q["sub_label"].replace("\n", r"\\")
        
        # Hàng đề bài với \SetCell[r=N]{m} (rowspan trong tabularray)
        lines.append(
            f"\\SetCell[r={n_rows}]{{m}} {label_escaped} "
            f"& \\textbf{{{q['prompt_latex']}}} & \\\\"
        )
        
        for s_idx, step in enumerate(steps):
            pts_str = f"{step['points']:.2f}" if step.get("points") else ""
            # Ẩn hline nội bộ (dùng \cline chỉ ở step cuối)
            hline = r"\hline" if s_idx == len(steps) - 1 else ""
            lines.append(f"  & {step['latex_content']} & {pts_str} \\\\ {hline}")
    
    lines.append(r"\end{longtblr}")
    lines.append(r"\end{document}")
    
    return "\n".join(lines)
```

---

## 3. API Endpoints — Đặc Tả Chi Tiết

### 3.1. Sơ đồ tổng thể API

```
/api/studio/
  │
  ├── exams/{id}/generate-template-document    POST   Gom exam_items → ExamDocument JSON
  ├── exams/{id}/template-document             GET    Lấy ExamDocument JSON đã lưu
  ├── exams/{id}/template-document             PUT    Cập nhật ExamDocument JSON
  ├── exams/{id}/ai-generate-grading-steps     POST   AI sinh barem cho 1 câu
  ├── exams/{id}/render-rubric-preview         POST   Render bảng chấm → PNG pages
  └── exams/{id}/download-template             GET    Tải PDF/DOCX theo khung mẫu

/api/exam-templates/
  ├── (list)                                   GET    Danh sách khung mẫu
  ├── (create)                                 POST   Tạo khung mẫu tùy chỉnh
  └── {template_id}                            GET    Chi tiết 1 khung mẫu
```

### 3.2. Chi tiết từng endpoint

#### `POST /api/studio/exams/{id}/generate-template-document`

```python
@router.post("/exams/{exam_id}/generate-template-document")
def generate_template_document(exam_id: UUID, db: Session = Depends(get_db)):
    """
    Đọc tất cả exam_items của đề thi → gom thành ExamDocument JSON.
    Nếu câu nào chưa có grading_steps → gọi AI sinh tự động.
    Validate tổng điểm → lưu vào generated_exams.template_document.
    """
    
    # 1. Load exam + items
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    items = db.query(ExamItem)\
              .filter(ExamItem.exam_id == exam_id)\
              .order_by(ExamItem.order_index).all()
    
    # 2. Phân loại: Phần I (SHORT_ANSWER) vs Phần II (ESSAY/MIXED)
    part1_questions = []
    part2_questions = []
    
    for item in items:
        snap = item.problem_snapshot or {}
        section = snap.get("section_type", "ESSAY")
        
        if section == "SHORT_ANSWER":
            part1_questions.append({
                "number": item.order_index + 1,
                "prompt_latex": snap.get("content_latex", ""),
                "short_answer_latex": snap.get("final_answer", ""),
                "solution_hint_latex": snap.get("solution_latex", "")
            })
        else:
            rubric = item.rubric_data or {}
            steps = rubric.get("steps", [])
            
            # Nếu chưa có steps → gọi AI sinh (hoặc để trống cho GV tự điền)
            if not steps:
                steps = [{"step_id": f"{item.order_index}-1",
                          "latex_content": snap.get("solution_latex", "Đang cập nhật..."),
                          "points": float(item.max_points)}]
            
            part2_questions.append({
                "sub_label": f"{item.display_label}\n({float(item.max_points):.1f} điểm)",
                "total_points": float(item.max_points),
                "prompt_latex": snap.get("content_latex", ""),
                "grading_steps": steps
            })
    
    # 3. Dựng ExamDocument
    header = exam.header_config or {}
    template_doc = {
        "metadata": {
            "exam_title": header.get("exam_name", exam.title),
            "grade_and_year": header.get("academic_year", "LỚP 9 NĂM HỌC 2026-2027"),
            "subject": header.get("subject_title", "TOÁN"),
            "duration_minutes": header.get("duration_minutes", 120),
            "governing_body": header.get("governing_body", "SỞ GIÁO DỤC VÀ ĐÀO TẠO"),
            "department_or_school": header.get("department_or_school", "")
        },
        "part1_short_answer": {
            "section_title": "I. PHẦN GHI KẾT QUẢ",
            "questions": part1_questions
        } if part1_questions else None,
        "part2_essay": {
            "section_title": "II. PHẦN TỰ LUẬN",
            "questions": part2_questions
        }
    }
    
    # 4. Validate & Lưu
    # (Pydantic validation ở đây)
    exam.template_document = template_doc
    db.commit()
    
    return template_doc
```

---

## 4. Database Migration

```sql
-- Chạy bằng: docker exec -i hsg_postgres_db psql -U postgres -d hsg_math

ALTER TABLE generated_exams
  ADD COLUMN IF NOT EXISTS template_document JSONB DEFAULT NULL;

COMMENT ON COLUMN generated_exams.template_document IS
  'ExamDocument JSON theo ExamDocumentSchema. NULL = chưa sinh theo khung mẫu.';
```

Tương ứng, thêm vào `models.py`:
```python
# Trong class GeneratedExam:
template_document = Column(JSONB, nullable=True)
```

Và `schemas.py`:
```python
# Trong class GeneratedExamResponse:
template_document: Optional[Dict[str, Any]] = None
```

---

## 5. Tóm Tắt File Cần Tạo / Sửa

| File | Hành động | Nội dung |
| :--- | :---: | :--- |
| `services/core-api/app/schemas/exam_template_schemas.py` | **TẠO MỚI** | Pydantic models: `GradingStep`, `EssayQuestion`, `ShortAnswerQuestion`, `ExamDocument` |
| `services/core-api/app/models/models.py` | SỬA | Thêm cột `template_document = Column(JSONB, nullable=True)` vào `GeneratedExam` |
| `services/core-api/app/schemas/schemas.py` | SỬA | Thêm `template_document: Optional[Dict] = None` vào `GeneratedExamResponse` |
| `services/core-api/app/routers/studio.py` | SỬA | Thêm 4 endpoint mới (generate, get, put, ai-grading-steps) |
| `services/export-service/app/template_renderer.py` | **TẠO MỚI** | `render_rubric_html()`, `render_rubric_to_latex()` |
| `services/export-service/app/docx_math_builder.py` | SỬA | Thêm method `add_fixed_layout_rubric_table()` với `w:vMerge` |
| `frontend/components/RubricTablePreview.tsx` | **TẠO MỚI** | React component render bảng 3 cột + KaTeX |
| `frontend/components/ExamStudioView.tsx` | SỬA | Thêm tab "📊 Khung Barem" + state `templateDocument` |

**Tổng:** 3 file mới + 5 file sửa. Không cài thêm dependency nào.

---

## 6. Thứ Tự Triển Khai (Từng PR)

```
PR #1: Schema + Database Migration
  → exam_template_schemas.py
  → ALTER TABLE generated_exams ADD template_document
  → models.py + schemas.py cập nhật
  → Test: python -c "from app.schemas.exam_template_schemas import ExamDocument"

PR #2: API Backend (Core API)
  → 4 endpoint mới trong studio.py
  → Test: curl POST /generate-template-document → nhận JSON hợp lệ
  → Test: curl POST /ai-generate-grading-steps → AI trả đúng format

PR #3: DOCX Export vMerge
  → add_fixed_layout_rubric_table() trong docx_math_builder.py  
  → Test: mở file .docx trong MS Word, kiểm tra cột Điểm căn ngang đúng

PR #4: Frontend RubricTablePreview
  → RubricTablePreview.tsx
  → Tích hợp tab "Khung Barem" vào ExamStudioView.tsx
  → Test: mở http://192.168.1.229:3000, vào Studio, bấm tab Khung Barem
```
