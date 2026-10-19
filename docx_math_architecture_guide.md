# Hướng dẫn Kiến trúc & Đặc tả Triển khai: Engine Biên dịch Đề thi & Barem Toán sang Word (.docx)
**Dự án:** HSG Math Exam Studio (Hệ thống biên dịch đề thi HSG & Lớp 10 Chuyên Toán)  
**Mục tiêu:** Cung cấp đặc tả kỹ thuật, mã nguồn mẫu và hướng dẫn triển khai cho Coding Agent nhằm xây dựng dịch vụ xuất Microsoft Word `.docx` tương thích 100% với Microsoft Word Equation Editor, chuẩn thể thức văn bản và không bị vỡ layout in ấn.

---

## 1. Tổng quan Kiến trúc & Pipeline Xử lý

### 1.1. Luồng xử lý dữ liệu (Deterministic In-Memory Pipeline)
Thay vì sử dụng các công cụ ngoại vi cồng kềnh (Pandoc CLI, LibreOffice headless), hệ thống sử dụng kiến trúc Python thuần chạy trong RAM (in-memory) thông qua C-bindings (`libxml2`/`libxslt`):

```
┌─────────────────────────────────┐
│ LaTeX / Micro-Barem JSON Input  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Phase 1: Preprocessor & AST    │ ◄── Chuẩn hóa Macro Toán VN (\heva, \hoac, \widehat,...)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Phase 2: LaTeX ➔ MathML       │ ◄── Sử dụng latex2mathml (chuẩn W3C Presentation MathML)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Phase 3: MathML ➔ OMML        │ ◄── Microsoft MML2OMML.XSL qua lxml.etree.XSLT (<m:oMath>)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Phase 4: python-docx & OOXML    │ ◄── Chèn oMath, căn lề A4, khóa cantSplit, tblHeader, side-by-side
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Native .docx File (Ready to Edit)
└─────────────────────────────────┘
```

### 1.2. Giải quyết 5 lỗi chí mạng khi xuất sang Word
1. **Công thức toán:** Chuyển đổi thành Native Office Math Markup Language (`<m:oMath>`), cho phép giáo viên bấm đúp chỉnh sửa tự nhiên trên Microsoft Word (không dùng ảnh bitmap, không dùng MathType nhúng OLE).
2. **Bảng Barem cắt ngang bước giải:** Khóa thuộc tính `<w:cantSplit/>` trên từng hàng dữ liệu của bảng.
3. **Mất tiêu đề khi sang trang:** Áp dụng `<w:tblHeader/>` cho hàng tiêu đề của bảng hướng dẫn chấm.
4. **Tiêu đề câu bị mồ côi (Orphan heading):** Kích hoạt `<w:keepNext/>` cho đoạn văn tiêu đề câu hỏi.
5. **Hình vẽ hình học trôi dạt:** Thay thế cơ chế Floating Textbox/Shape bằng Bảng bố cục 2 cột không viền (Borderless Layout Table) với tỷ lệ cố định tuyệt đối, bảo toàn Aspect Ratio 1:1.

---

## 2. Tiền xử lý Macro Toán học Đặc thù Việt Nam

Trước khi đưa qua bộ chuyển đổi MathML, mã nguồn LaTeX phải được chuẩn hóa thông qua Regex/AST Preprocessor:

| Ký hiệu Toán Việt Nam | Cú pháp Gốc | Cú pháp Chuẩn hóa cho MathML | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- |
| Hệ và (Ngoặc nhọn `{`) | `\heva{A \\ B}` | `\begin{cases} A \\ B \end{cases}` | MathML `<mtable>` có bracket `{` bên trái |
| Hệ hoặc (Ngoặc vuông `[`) | `\hoac{A \\ B}` | `\left[\begin{array}{l} A \\ B \end{array}\right.` | MathML matrix ngoặc vuông đơn |
| Ký hiệu Góc | `\widehat{ABC}` | `\hat{ABC}` hoặc `\angle ABC` | Tránh vỡ font glyph accent roof |
| Cung tròn | `\wideparen{AB}` | `\frown{AB}` | Ký hiệu cung hình học phẳng |
| Phân số hiển thị | `\dfrac{a}{b}` | `\frac{a}{b}` | Chuẩn hóa thẻ `<mfrac>` |
| Quan hệ song song / vuông góc | `\parallel`, `\perp` | `\mathbin{\parallel}`, `\bot` | Đảm bảo khoảng cách toán tử chuẩn |
| Dấu so sánh | `\le`, `\ge`, `\not=` | `\leq`, `\geq`, `\neq` | Chuẩn hóa token operator |

---

## 3. Đặc tả Kỹ thuật Thẻ OpenXML (WordprocessingML & OMML)

### 3.1. Namespace khai báo bắt buộc
```xml
xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
```

### 3.2. Cấu trúc đoạn văn chứa công thức Toán Native (`<m:oMath>`)
Công thức toán học inline được đặt trực tiếp bên trong node đoạn văn `<w:p>`, song song với các run văn bản thông thường `<w:r>`:
```xml
<w:p>
  <w:r>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/></w:rPr>
    <w:t xml:space="preserve">Giải phương trình: </w:t>
  </w:r>
  <!-- Native Office Math Markup Element -->
  <m:oMath>
    <m:r>
      <m:rPr><m:lit/></m:rPr>
      <m:t>x</m:t>
    </m:r>
    <m:sSup>
      <m:e><m:r><m:t>x</m:t></m:r></m:e>
      <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
    </m:sSup>
    <m:r><m:t>-</m:t></m:r>
    <m:r><m:t>4</m:t></m:r>
    <m:r><m:t>=</m:t></m:r>
    <m:r><m:t>0</m:t></m:r>
  </m:oMath>
</w:p>
```

### 3.3. Cấu trúc Hàng Barem Điểm chống ngắt đôi (`cantSplit`) và lặp Header (`tblHeader`)
```xml
<w:tbl>
  <w:tblPr>
    <!-- Khóa cố định layout bảng, không cho Word tự co giãn -->
    <w:tblLayout w:type="fixed"/>
  </w:tblPr>

  <!-- HÀNG TIÊU ĐỀ (HEADER ROW) -->
  <w:tr>
    <w:trPr>
      <w:tblHeader/>  <!-- Lặp lại trên đầu mỗi trang khi bảng tràn trang -->
      <w:cantSplit/>  <!-- Không cắt đôi hàng -->
    </w:trPr>
    <w:tc>
      <w:tcPr><w:tcW w:w="851" w:type="dxa"/></w:tcPr> <!-- 1.5 cm -->
      <w:p><w:pPr><w:keepNext/></w:pPr><w:r><w:t>Câu / Ý</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:tcPr><w:tcW w:w="8051" w:type="dxa"/></w:tcPr> <!-- 14.2 cm -->
      <w:p><w:pPr><w:keepNext/></w:pPr><w:r><w:t>Nội dung bước giải</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:tcPr><w:tcW w:w="851" w:type="dxa"/></w:tcPr> <!-- 1.5 cm -->
      <w:p><w:pPr><w:keepNext/></w:pPr><w:r><w:t>Điểm</w:t></w:r></w:p>
    </w:tc>
  </w:tr>

  <!-- HÀNG BƯỚC GIẢI DỮ LIỆU (DATA ROW) -->
  <w:tr>
    <w:trPr>
      <w:cantSplit/>  <!-- BẮT BUỘC: Giữ nguyên vẹn bước giải, không xé đôi ô giữa 2 trang -->
    </w:trPr>
    <w:tc>
      <w:tcPr><w:tcW w:w="851" w:type="dxa"/></w:tcPr>
      <w:p><w:r><w:t>Câu 1.a</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:tcPr><w:tcW w:w="8051" w:type="dxa"/></w:tcPr>
      <w:p><w:r><w:t>Biến đổi phương trình về tích...</w:t></w:r></w:p>
    </w:tc>
    <w:tc>
      <w:tcPr><w:tcW w:w="851" w:type="dxa"/></w:tcPr>
      <w:p><w:r><w:t>0.50</w:t></w:r></w:p>
    </w:tc>
  </w:tr>
</w:tbl>
```

### 3.4. Cấu trúc Bố cục Hình học 2 cột không viền (Side-by-side)
Thay vì dùng Shape hoặc Textbox trôi nổi, sử dụng bảng 1 hàng 2 cột với thuộc tính viền ẩn (`w:val="none"`):
```xml
<w:tbl>
  <w:tblPr>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders>
      <w:top w:val="none"/>
      <w:left w:val="none"/>
      <w:bottom w:val="none"/>
      <w:right w:val="none"/>
      <w:insideH w:val="none"/>
      <w:insideV w:val="none"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:trPr><w:cantSplit/></w:trPr>
    <!-- Cột trái: Đề bài và các ý chứng minh (chiếm 65% width) -->
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="6464" w:type="dxa"/> <!-- ~11.4 cm -->
        <w:vAlign w:val="top"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:keepNext/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>Câu 4 (3.0 điểm): </w:t></w:r>
        <w:r><w:t>Cho tam giác ABC nhọn nội tiếp (O)...</w:t></w:r>
      </w:p>
    </w:tc>
    <!-- Cột phải: Hình vẽ minh họa (chiếm 35% width) -->
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="3175" w:type="dxa"/> <!-- ~5.6 cm -->
        <w:vAlign w:val="top"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <!-- Drawing inline hình vẽ tỷ lệ 1:1 -->
        <w:r><w:drawing>...</w:drawing></w:r>
      </w:p>
    </w:tc>
  </w:tr>
</w:tbl>
```

---

## 4. Module Python Triển khai Hoàn chỉnh (`docx_math_builder.py`)

Coding Agent có thể copy trực tiếp module này vào tầng service của backend:

```python
"""
docx_math_builder.py
Core Document Generation Engine for HSG Math Exam Studio.
Environment: Python 3.11+, Debian Linux, Docker Local-First.
"""

import os
import re
from typing import List, Dict, Any, Optional
import lxml.etree as ET
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# ==============================================================================
# 1. LATEX ➔ MATHML ➔ OMML CONVERTER
# ==============================================================================

class LaTeXMathConverter:
    """Xử lý tiền biên dịch LaTeX đặc thù Việt Nam và chuyển đổi sang OMML Element."""

    MML2OMML_XSL_FALLBACK = """<?xml version="1.0" encoding="UTF-8"?>
    <xsl:stylesheet version="1.0" 
        xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
        xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
        xmlns:mml="http://www.w3.org/1998/Math/MathML">
        <xsl:output method="xml" encoding="UTF-8" indent="no"/>

        <xsl:template match="mml:math">
            <m:oMath>
                <xsl:apply-templates select="*"/>
            </m:oMath>
        </xsl:template>

        <xsl:template match="mml:mrow">
            <xsl:apply-templates select="*"/>
        </xsl:template>

        <xsl:template match="mml:mi | mml:mn">
            <m:r>
                <m:t><xsl:value-of select="."/></m:t>
            </m:r>
        </xsl:template>

        <xsl:template match="mml:mo">
            <m:r>
                <m:rPr><m:lit/></m:rPr>
                <m:t><xsl:value-of select="."/></m:t>
            </m:r>
        </xsl:template>

        <xsl:template match="mml:mfrac">
            <m:f>
                <m:num><xsl:apply-templates select="*[1]"/></m:num>
                <m:den><xsl:apply-templates select="*[2]"/></m:den>
            </m:f>
        </xsl:template>

        <xsl:template match="mml:msup">
            <m:sSup>
                <m:e><xsl:apply-templates select="*[1]"/></m:e>
                <m:sup><xsl:apply-templates select="*[2]"/></m:sup>
            </m:sSup>
        </xsl:template>

        <xsl:template match="mml:msub">
            <m:sSub>
                <m:e><xsl:apply-templates select="*[1]"/></m:e>
                <m:sub><xsl:apply-templates select="*[2]"/></m:sub>
            </m:sSub>
        </xsl:template>

        <xsl:template match="mml:msqrt">
            <m:rad>
                <m:radPr><m:degHide m:val="on"/></m:radPr>
                <m:deg/>
                <m:e><xsl:apply-templates select="*"/></m:e>
            </m:rad>
        </xsl:template>
    </xsl:stylesheet>
    """

    def __init__(self, xsl_path: Optional[str] = None):
        if xsl_path and os.path.exists(xsl_path):
            with open(xsl_path, "rb") as f:
                xslt_root = ET.XML(f.read())
        else:
            xslt_root = ET.XML(self.MML2OMML_XSL_FALLBACK.encode("utf-8"))
        self.transform = ET.XSLT(xslt_root)

    @staticmethod
    def preprocess_vietnamese_math_macros(latex_code: str) -> str:
        """Chuẩn hóa các macro Toán Việt Nam (\heva, \hoac, \widehat,...) sang LaTeX quốc tế."""
        s = latex_code.strip()
        # \heva{A \\ B} -> \begin{cases} A \\ B \end{cases}
        s = re.sub(r'\\heva\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', r'\\begin{cases} \1 \\end{cases}', s)
        # \hoac{A \\ B} -> Ngoặc vuông ghép hệ hoặc
        s = re.sub(r'\\hoac\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}', 
                   r'\\left[\\begin{array}{l} \1 \\end{array}\\right.', s)
        # Góc \widehat{ABC} và cung \wideparen{AB}
        s = re.sub(r'\\widehat\s*\{([^}]+)\}', r'\\hat{\1}', s)
        s = re.sub(r'\\wideparen\s*\{([^}]+)\}', r'\\frown{\1}', s)
        # Phân số & ký hiệu chuẩn
        s = s.replace(r'\dfrac', r'\frac')
        s = s.replace(r'\le ', r'\leq ').replace(r'\ge ', r'\geq ')
        s = s.replace(r'\not=', r'\neq ')
        s = s.replace(r'\parallel', r'\mathbin{\parallel}')
        s = s.replace(r'\perp', r'\bot')
        return s

    def latex_to_mathml(self, latex_str: str) -> str:
        """Chuyển đổi chuỗi LaTeX sang Presentation MathML."""
        clean_latex = self.preprocess_vietnamese_math_macros(latex_str)
        try:
            import latex2mathml.converter
            return latex2mathml.converter.convert(clean_latex)
        except ImportError:
            # Fallback an toàn nếu chưa có thư viện latex2mathml
            return f'<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>{clean_latex}</mi></mrow></math>'

    def mathml_to_omml(self, mathml_str: str) -> ET._Element:
        """Dùng XSLT chuyển đổi MathML sang phần tử OMML."""
        mml_dom = ET.fromstring(mathml_str.encode("utf-8"))
        omml_dom = self.transform(mml_dom)
        return omml_dom.getroot()

    def convert_latex_to_omml_element(self, latex_str: str) -> ET._Element:
        """Toàn bộ quy trình: LaTeX -> Chuẩn hóa -> MathML -> OMML Element."""
        mathml = self.latex_to_mathml(latex_str)
        return self.mathml_to_omml(mathml)


# ==============================================================================
# 2. DOCUMENT BUILDER (.DOCX ENGINE)
# ==============================================================================

class DocxMathExamBuilder:
    """Trình tạo tệp Word đề thi và barem điểm chuẩn văn bản Bộ GD&ĐT."""

    COLOR_PRIMARY = "002060"    # Xanh Navy cho tiêu đề bảng
    COLOR_BORDER = "7F7F7F"     # Viền kẻ bảng 0.5pt
    COLOR_ZEBRA = "F9F9F9"      # Nền xen kẽ chống mỏi mắt khi chấm thi

    def __init__(self, math_converter: Optional[LaTeXMathConverter] = None):
        self.doc = docx.Document()
        self.math_converter = math_converter or LaTeXMathConverter()
        self._setup_page_geometry()
        self._setup_global_styles()

    def _setup_page_geometry(self):
        """Căn lề chuẩn văn bản in ấn A4: Top/Bottom 1.8cm, Left 2.0cm, Right 1.8cm."""
        for section in self.doc.sections:
            section.top_margin = Inches(0.71)     # 1.8 cm
            section.bottom_margin = Inches(0.71)  # 1.8 cm
            section.left_margin = Inches(0.79)    # 2.0 cm
            section.right_margin = Inches(0.71)   # 1.8 cm
            section.page_width = Inches(8.27)     # 21.0 cm
            section.page_height = Inches(11.69)   # 29.7 cm

    def _setup_global_styles(self):
        """Thiết lập font mặc định Times New Roman 12pt."""
        normal_style = self.doc.styles['Normal']
        normal_style.font.name = 'Times New Roman'
        normal_style.font.size = Pt(12)
        normal_style.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

    def add_mixed_text_with_math(self, paragraph, text: str):
        """Tách chuỗi chứa công thức toán $...$ để chèn run thường và OMML song song."""
        tokens = re.split(r'(\$[^\$]+\$)', text)
        for token in tokens:
            if not token:
                continue
            if token.startswith('$') and token.endswith('$') and len(token) > 2:
                latex_expr = token[1:-1]
                try:
                    omml_node = self.math_converter.convert_latex_to_omml_element(latex_expr)
                    xml_str = ET.tostring(omml_node, encoding="utf-8").decode("utf-8")
                    docx_omml = parse_xml(xml_str)
                    paragraph._p.append(docx_omml)
                except Exception:
                    run = paragraph.add_run(token)
                    run.italic = True
            else:
                paragraph.add_run(token)

    def add_exam_header(self, agency_name: str, exam_title: str, year_str: str, time_str: str):
        """Tiêu đề hành chính 2 cột chuẩn Nghị định 30/2020/NĐ-CP (Không viền)."""
        table = self.doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        self._remove_table_borders(table)

        col_left_width = Inches(3.6)
        col_right_width = Inches(3.2)

        # Cột trái
        c_left = table.rows[0].cells[0]
        c_left.width = col_left_width
        p1 = c_left.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r1 = p1.add_run(agency_name.upper() + "\n")
        r1.font.size = Pt(11)
        r2 = p1.add_run("ĐỀ CHÍNH THỨC\n")
        r2.font.bold = True
        r2.font.size = Pt(11)
        r3 = p1.add_run("(Đề thi có 01 trang)")
        r3.font.italic = True
        r3.font.size = Pt(10)
        p1.paragraph_format.space_after = Pt(4)

        # Cột phải
        c_right = table.rows[0].cells[1]
        c_right.width = col_right_width
        p2 = c_right.paragraphs[0]
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r4 = p2.add_run(exam_title.upper() + "\n")
        r4.font.bold = True
        r4.font.size = Pt(11)
        r5 = p2.add_run(f"NĂM HỌC: {year_str}\n")
        r5.font.bold = True
        r5.font.size = Pt(11)
        r6 = p2.add_run(f"Môn thi: TOÁN (Chuyên)\nThời gian: {time_str} (không kể thời gian phát đề)")
        r6.font.italic = True
        r6.font.size = Pt(11)
        p2.paragraph_format.space_after = Pt(4)

        # Đường gạch ngang thẩm mỹ
        p_div = self.doc.add_paragraph()
        p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r_div = p_div.add_run("———————————————")
        r_div.font.bold = True
        p_div.paragraph_format.space_after = Pt(10)

    def add_question(self, q_title: str, q_content: str, points: float):
        """Thêm câu hỏi thông thường kèm keep_with_next chống mồ côi dòng."""
        p = self.doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.keep_with_next = True

        r_title = p.add_run(f"{q_title} ({points:.1f} điểm): ")
        r_title.font.bold = True
        self.add_mixed_text_with_math(p, q_content)

    def add_geometry_question_side_by_side(self, q_title: str, q_content: str, 
                                           points: float, image_path: Optional[str] = None):
        """Bố cục bài hình học 2 cột side-by-side cố định (65% Đề bài - 35% Hình vẽ)."""
        table = self.doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        self._remove_table_borders(table)

        row = table.rows[0]
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        left_width = Inches(4.5)   # ~11.4 cm
        right_width = Inches(2.2)  # ~5.6 cm

        cell_left = row.cells[0]
        cell_right = row.cells[1]

        cell_left.width = left_width
        cell_right.width = right_width
        cell_left.vertical_alignment = WD_ALIGN_VERTICAL.TOP
        cell_right.vertical_alignment = WD_ALIGN_VERTICAL.TOP

        # Đề bài bên trái
        p_left = cell_left.paragraphs[0]
        p_left.paragraph_format.line_spacing = 1.15
        p_left.paragraph_format.space_after = Pt(4)
        p_left.paragraph_format.keep_with_next = True
        r_title = p_left.add_run(f"{q_title} ({points:.1f} điểm): ")
        r_title.font.bold = True
        self.add_mixed_text_with_math(p_left, q_content)

        # Hình vẽ bên phải
        p_right = cell_right.paragraphs[0]
        p_right.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_right.paragraph_format.space_after = Pt(4)

        if image_path and os.path.exists(image_path):
            r_img = p_right.add_run()
            # BẢO TOÀN ASPECT RATIO 1:1: Chỉ định width, không set height
            r_img.add_picture(image_path, width=Inches(2.1))
            
            p_cap = cell_right.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_cap = p_cap.add_run("(Hình vẽ minh họa)")
            r_cap.font.italic = True
            r_cap.font.size = Pt(9.5)

    def add_marking_scheme_table(self, rubric_data: List[Dict[str, Any]]):
        """Tạo bảng Hướng dẫn chấm vi mô có tblHeader lặp trang và cantSplit từng hàng."""
        p_head = self.doc.add_paragraph()
        p_head.paragraph_format.space_before = Pt(14)
        p_head.paragraph_format.space_after = Pt(6)
        p_head.paragraph_format.keep_with_next = True
        r_head = p_head.add_run("HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT")
        r_head.font.bold = True
        r_head.font.size = Pt(13)

        table = self.doc.add_table(rows=1, cols=3)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER

        # Đơn vị dxa: 1cm = 567 dxa
        col_widths_dxa = [851, 8051, 851]  # 1.5cm, 14.2cm, 1.5cm
        col_widths_inch = [Inches(0.59), Inches(5.59), Inches(0.59)]

        # Header Row
        hdr_row = table.rows[0]
        hdr_tr = hdr_row._tr.get_or_add_trPr()
        hdr_tr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
        hdr_tr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

        headers_text = ["Câu / Ý", "Nội dung tóm tắt các bước giải", "Điểm"]
        for idx, text in enumerate(headers_text):
            cell = hdr_row.cells[idx]
            cell.width = col_widths_inch[idx]
            self._set_cell_width_dxa(cell, col_widths_dxa[idx])
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            
            shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{self.COLOR_PRIMARY}"/>')
            cell._tc.get_or_add_tcPr().append(shd)

            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(text)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            run.font.size = Pt(11)

        # Data Rows
        for row_idx, item in enumerate(rubric_data):
            row = table.add_row()
            trPr = row._tr.get_or_add_trPr()
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

            # Cột 1: Câu/Ý
            c0 = row.cells[0]
            c0.width = col_widths_inch[0]
            self._set_cell_width_dxa(c0, col_widths_dxa[0])
            c0.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p0 = c0.paragraphs[0]
            p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r0 = p0.add_run(item.get("question_label", ""))
            r0.font.bold = True
            r0.font.size = Pt(11)

            # Cột 2: Nội dung bước giải
            c1 = row.cells[1]
            c1.width = col_widths_inch[1]
            self._set_cell_width_dxa(c1, col_widths_dxa[1])
            c1.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p1 = c1.paragraphs[0]
            p1.paragraph_format.line_spacing = 1.15
            p1.paragraph_format.space_before = Pt(3)
            p1.paragraph_format.space_after = Pt(3)
            self.add_mixed_text_with_math(p1, item.get("solution_step", ""))

            # Cột 3: Điểm
            c2 = row.cells[2]
            c2.width = col_widths_inch[2]
            self._set_cell_width_dxa(c2, col_widths_dxa[2])
            c2.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p2 = c2.paragraphs[0]
            p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r2 = p2.add_run(f"{item.get('score', 0.0):.2f}")
            r2.font.bold = True
            r2.font.size = Pt(11)

            if row_idx % 2 == 1:
                for c in [c0, c1, c2]:
                    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{self.COLOR_ZEBRA}"/>')
                    c._tc.get_or_add_tcPr().append(shd)

        self._apply_table_borders(table)

    @staticmethod
    def _set_cell_width_dxa(cell, dxa_width: int):
        tcPr = cell._tc.get_or_add_tcPr()
        tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{dxa_width}" w:type="dxa"/>')
        tcPr.append(tcW)

    @staticmethod
    def _remove_table_borders(table):
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(f"""
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="none"/>
                <w:left w:val="none"/>
                <w:bottom w:val="none"/>
                <w:right w:val="none"/>
                <w:insideH w:val="none"/>
                <w:insideV w:val="none"/>
            </w:tblBorders>
        """)
        tblPr.append(tblBorders)

    def _apply_table_borders(self, table):
        tblPr = table._tbl.tblPr
        tblBorders = parse_xml(f"""
            <w:tblBorders {nsdecls("w")}>
                <w:top w:val="single" w:sz="4" w:space="0" w:color="{self.COLOR_BORDER}"/>
                <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{self.COLOR_BORDER}"/>
                <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{self.COLOR_BORDER}"/>
                <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{self.COLOR_BORDER}"/>
            </w:tblBorders>
        """)
        tblPr.append(tblBorders)

    def save(self, filepath: str):
        self.doc.save(filepath)
        return filepath
```

---

## 5. Cấu hình Môi trường Docker & FastAPI Service

### 5.1. Dockerfile
```dockerfile
FROM python:3.11-slim

# Cài đặt thư viện C cho lxml XSLT
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxml2-dev \
    libxslt1-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 5.2. requirements.txt
```text
fastapi>=0.110.0
uvicorn>=0.28.0
python-docx>=1.1.2
lxml>=5.1.0
latex2mathml>=3.77.0
pydantic>=2.6.0
```

### 5.3. FastAPI Endpoint Mẫu
```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import tempfile
from docx_math_builder import DocxMathExamBuilder

app = FastAPI(title="HSG Math Exam Studio DOCX Exporter")

class RubricStep(BaseModel):
    question_label: str
    solution_step: str
    score: float

class ExamExportPayload(BaseModel):
    agency_name: str
    exam_title: str
    year_str: str
    time_str: str
    questions: List[dict]
    rubric: List[RubricStep]

@app.post("/api/v1/export-docx")
async def export_docx(payload: ExamExportPayload):
    try:
        builder = DocxMathExamBuilder()
        builder.add_exam_header(
            agency_name=payload.agency_name,
            exam_title=payload.exam_title,
            year_str=payload.year_str,
            time_str=payload.time_str
        )
        
        for q in payload.questions:
            if q.get("is_geometry"):
                builder.add_geometry_question_side_by_side(
                    q_title=q["title"],
                    q_content=q["content"],
                    points=q["points"],
                    image_path=q.get("image_path")
                )
            else:
                builder.add_question(
                    q_title=q["title"],
                    q_content=q["content"],
                    points=q["points"]
                )
                
        builder.add_marking_scheme_table([step.model_dump() for step in payload.rubric])
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        builder.save(temp_file.name)
        
        return FileResponse(
            path=temp_file.name,
            filename=f"De_Thi_{payload.year_str}.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. Hướng dẫn Kiểm thử & Thẩm định (Verification Checklist)

Coding Agent sau khi hoàn thiện cần kiểm thử tự động các trường hợp:
1. **Kiểm tra OMML:** Mở tệp sinh ra trên Word 2016+, kiểm tra công thức có thể nhấp đúp và hiển thị tab "Equation" hay không.
2. **Kiểm tra Ngắt trang:** Thêm một câu có 20 bước giải và kiểm tra bằng `libreoffice --convert-to pdf`, xác nhận bảng không bị cắt ngang giữa ô dòng.
3. **Kiểm tra Tỷ lệ Hình vẽ:** Chèn ảnh hình học có đường tròn, kiểm tra trên giao diện Word xem đường tròn có giữ nguyên bán kính 1:1 hay không.
4. **Kiểm tra Lặp Header:** Kiểm tra trang 2 và trang 3 của bảng barem có lặp lại dòng tiêu đề "Câu / Ý | Nội dung | Điểm" hay không.
