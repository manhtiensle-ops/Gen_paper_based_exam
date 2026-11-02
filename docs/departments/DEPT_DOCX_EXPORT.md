# 🖨️ ĐẶC TẢ KỸ THUẬT PHÒNG XUẤT BẢN & CHUYỂN ĐỔI TÀI LIỆU (`Dept_Docx_Export`)
## Module: `services/export-service`
**Phụ trách:** Trưởng phòng `Lead_Dept_Docx_Export` | **Chuyên viên:** `Worker_OMMLRenderer`  
**Công ty:** VINH PHÁT (`dethi.ttgdvinhphat.com`) — Tập đoàn AI Holding OS

---

## 1. SỨ MỆNH & PHẠM VI TRÁCH NHIỆM
Phòng Xuất bản & Chuyển đổi Tài liệu chịu trách nhiệm chuyển hóa đề thi từ định dạng cấu trúc sang các tài liệu in ấn chất lượng cao theo chuẩn quốc gia:
1. **Office Open XML (OMML) Word `.docx`**: Chuyển đổi mã toán học LaTeX sang thẻ XML toán học bản địa của Microsoft Word (`<m:oMath>`), bảo đảm 100% không bị vỡ font, không biến thành hình ảnh mờ và cho phép giáo viên chỉnh sửa tự nhiên trong Word.
2. **TeX Live PDF Engine**: Biên dịch tài liệu TeX Live sang PDF chất lượng in ấn 300 DPI theo tiêu chuẩn khổ giấy A4 Nghị định 30/2020/NĐ-CP của Chính phủ.
3. **High-Speed Rendering Cache**: Tối ưu hóa bộ nhớ đệm phục vụ hàng ngàn yêu cầu xuất file đồng thời với thời gian phản hồi < 0.2s.

---

## 2. KIẾN TRÚC THÀNH PHẦN
```text
services/export-service/app/
├── main.py                     # Cổng API FastAPI tiếp nhận yêu cầu xuất bản
├── docx_math_builder.py        # OMML Word Generator, XSLT Transformer & Math Cache
├── latex_engine.py             # Bộ biên dịch TeX Live (pdflatex/xelatex) & SVG preview
├── style_registry.py           # Thiết lập quy chuẩn font Cambria Math, lề trang A4
└── templates/
    └── MML2OMML.XSL            # Bản đồ ánh xạ MathML sang OMML của Microsoft
```

---

## 3. CƠ CHẾ XỬ LÝ TOÁN HỌC BẢN ĐỊA OMML & BỘ ĐỆM CACHE

### Quy trình 3 bước chuyển đổi LaTeX ➔ OMML:
```text
[Mã LaTeX Toán] 
       │
       ▼ (latex2mathml)
[Chuẩn XML MathML] 
       │
       ▼ (XSLT Transformation - MML2OMML.XSL)
[Native OMML XML (<m:oMath>)] 
       │
       ▼ (python-docx OxmlElement insertion)
[Tệp Microsoft Word .docx Hoàn chỉnh]
```

### Cơ chế LRU In-Memory Cache Tối ưu:
- Lớp `LaTeXMathConverter` duy trì bộ đệm `_OMML_CACHE` lưu trữ tới 2.000 cấu trúc XML OMML của các công thức phổ biến.
- Khi gặp công thức lặp lại (như biến số `$x$`, phân số `$\frac{1}{2}$`, tích phân, ma trận), hệ thống lấy trực tiếp từ RAM, bỏ qua bước tính toán XSLT tốn kém.
- Giúp tốc độ tạo file Word đạt kỷ lục **< 0.2 giây** cho một đề thi chuẩn 50 câu.

---

## 4. QUY CHUẨN IN ẤN A4 THEO NGHỊ ĐỊNH 30/2020/NĐ-CP
- **Khổ giấy**: A4 chuẩn (210mm x 297mm).
- **Căn lề chuẩn văn bản hành chính sư phạm**:
  - Lề trên (Top): 20mm - 25mm.
  - Lề dưới (Bottom): 20mm - 25mm.
  - Lề trái (Left): 30mm - 35mm (chừa gáy dập ghim).
  - Lề phải (Right): 15mm - 20mm.
- **Font chữ quy chuẩn**:
  - Văn bản: Times New Roman, cỡ 11pt - 12pt, giãn dòng 1.15 - 1.25.
  - Công thức: Cambria Math đồng bộ, bảo đảm các dấu tích phân, căn bậc hai co giãn hoàn hảo.

---

## 5. HƯỚNG DẪN KẾ THỪA CHO CÁC PHÒNG BAN & AI AGENT

### A. Xuất file Word OMML từ mã Python:
```python
from app.docx_math_builder import compile_native_omml_docx

exam_payload = {
    "title": "ĐỀ THI KHẢO SÁT CHẤT LƯỢNG MÔN TOÁN",
    "school_name": "TRUNG TÂM GIÁO DỤC VINH PHÁT",
    "exam_code": "101",
    "questions": [
        {
            "order_index": 1,
            "content_latex": "Tìm tập nghiệm của phương trình $\\log_2(x - 1) = 3$.",
            "options": [
                {"label": "A", "content_latex": "$S = \\{7\\}$"},
                {"label": "B", "content_latex": "$S = \\{9\\}$"},
                {"label": "C", "content_latex": "$S = \\{8\\}$"},
                {"label": "D", "content_latex": "$S = \\{10\\}$"}
            ],
            "solution_latex": "Phương trình tương đương $x - 1 = 2^3 = 8 \\Leftrightarrow x = 9$."
        }
    ]
}

# mode="EXAM" (Đề thi học sinh) hoặc mode="RUBRIC" (Barem đáp án chi tiết)
docx_file_path = compile_native_omml_docx(exam_payload, mode="EXAM")
print(f"File word đã xuất: {docx_file_path}")
```

### B. Gọi qua HTTP REST API:
```http
POST /api/export/docx/generate
Content-Type: application/json
{
  "exam_id": "6122d749-...",
  "mode": "EXAM"
}
# Trả về: Binary Stream của tệp .docx (Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document)
```
