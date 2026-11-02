# 🧠 ĐẶC TẢ KỸ THUẬT PHÒNG TRÍ TUỆ NHÂN TẠO & XỬ LÝ DỮ LIỆU (`Dept_AI_Ingestion`)
## Module: `services/ingestion-worker`
**Phụ trách:** Trưởng phòng `Lead_Dept_AI_Ingestion` | **Chuyên viên:** `Worker_MathParser`  
**Công ty:** VINH PHÁT (`dethi.ttgdvinhphat.com`) — Tập đoàn AI Holding OS

---

## 1. SỨ MỆNH & PHẠM VI TRÁCH NHIỆM
Phòng Trí tuệ Nhân tạo & Xử lý Dữ liệu phụ trách pipeline chuyển đổi tài liệu thô (PDF, Scan, Ảnh đề thi) thành dữ liệu toán học có cấu trúc chuẩn JSON, chuẩn hóa ký hiệu toán học LaTeX theo chuẩn Bộ GD&ĐT Việt Nam, bóc tách sơ đồ hình học (Vector SVG và tọa độ bounding box 2D) và vector hóa ngữ nghĩa để phục vụ tìm kiếm thông minh.

---

## 2. KIẾN TRÚC PIPELINE XỬ LÝ DỮ LIỆU
```text
services/ingestion-worker/worker/
├── tasks.py                    # Celery / Background task pipeline orchestrator
├── vision_ocr.py               # 2-pass LLM Vision OCR (Gemini / Claude / Qwen Vision)
├── vision_schema.py            # Pydantic schemas: LLMExtractedQuestion, LLMFigureBox
├── normalizer.py               # Chuẩn hóa macro toán học VN, xóa duplicate hash
├── image_cropper.py            # Bóc tách ảnh hình học theo tọa độ [ymin, xmin, ymax, xmax]
├── embedder.py                 # Sinh vector embeddings phục vụ tra cứu ngữ nghĩa
├── converter.py                # Chuyển đổi PDF tài liệu sang chuỗi ảnh PNG 300 DPI
└── minio_helper.py             # Quản lý lưu trữ tệp tin MinIO S3 an toàn
```

---

## 3. QUY TRÌNH BÓC TÁCH 2 BƯỚC (2-PASS LLM INGESTION)

### Bước 1: Text & LaTeX OCR (Pass 1)
- Nhận diện toàn bộ nội dung đề thi từ ảnh chất lượng cao.
- Ép LLM tuân thủ nghiêm ngặt định dạng LaTeX chuẩn:
  - Công thức trong dòng bọc trong `$ ... $`.
  - Công thức hiển thị khối bọc trong `$$ ... $$` hoặc `\begin{aligned} ... \end{aligned}`.
  - Tự động thay thế ký hiệu nhân thành `\times`, vecto chuẩn `\vect{AB}`, đạo hàm `\dx, \dy`, tập số `\R, \Z, \N, \C`.

### Bước 2: Bóc tách Hình học & Đồ họa Vector (Pass 2 - Geometric SVG & BBox)
- Phát hiện tọa độ vùng chứa hình vẽ đồ thị hàm số, hình học không gian hoặc bảng biến thiên theo hệ chuẩn normalized `0 - 1000`:
  `box_2d: [ymin, xmin, ymax, xmax]`.
- **Đặc tả Vector SVG (`svg_data`)**:
  - Đối với các hình học giải tích cơ bản, LLM sinh mã SVG vector toán học chuẩn xác, độc lập (standalone), có hệ trục tọa độ rõ ràng.
  - Mã SVG được nhúng thẳng vào trường `svg_data` trong `LLMFigureBox`.
  - Frontend và xuất bản Word sẽ ưu tiên dùng mã SVG này để bảo đảm độ sắc nét tuyệt đối khi in ấn ở mọi kích thước mà không bị vỡ hạt như ảnh raster PNG.

---

## 4. CHUẨN HÓA DỮ LIỆU TOÁN HỌC (NORMALIZER SPEC)
Tất cả câu hỏi trước khi ghi vào cơ sở dữ liệu đều đi qua bộ lọc `normalizer.py`:
1. **Deduplication Hash**: Băm nội dung câu hỏi sau khi loại bỏ khoảng trắng và chuẩn hóa biến số toán học để loại bỏ 100% câu trùng lặp trong ngân hàng đề.
2. **Auto-Topic Classification**: Tự động gán nhãn chuyên đề (Hàm số, Mũ - Logarit, Tích phân, Hình học Oxyz, Số phức, Xác suất) dựa trên cây ma trận kiến thức THPT.

---

## 5. HƯỚNG DẪN KẾ THỪA CHO CÁC PHÒNG BAN & AI AGENT

### A. Cấu trúc JSON chuẩn đầu ra của một câu hỏi đã bóc tách
```json
{
  "question_number": 1,
  "section_type": "PART_1",
  "structure_type": "MULTIPLE_CHOICE",
  "content_latex": "Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ bên. Giá trị cực tiểu của hàm số đã cho bằng:",
  "options": [
    { "label": "A", "content_latex": "$2$" },
    { "label": "B", "content_latex": "$-3$" },
    { "label": "C", "content_latex": "$0$" },
    { "label": "D", "content_latex": "$1$" }
  ],
  "final_answer": "B",
  "solution_latex": "Từ bảng biến thiên, ta thấy hàm số đạt cực tiểu tại $x = 2$ và giá trị cực tiểu $y_{CT} = -3$.",
  "has_figure": true,
  "figures_meta": [
    {
      "box_2d": [120, 450, 380, 890],
      "placement_target": "QUESTION_BODY",
      "position": "CENTER_BLOCK",
      "caption": "Bảng biến thiên hàm số f(x)",
      "svg_data": "<svg viewBox='0 0 300 150'>...</svg>"
    }
  ],
  "difficulty": "comprehension",
  "grade": 12,
  "subject": "TOAN"
}
```
Mọi module kế thừa (Studio, Export Word, Export PDF) chỉ cần đọc cấu trúc `figures_meta` và `content_latex` này để hiển thị hoặc in ấn mà không cần xử lý lại văn bản thô.
