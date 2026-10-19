# ĐẶC TẢ DANH MỤC API (API REFERENCE)

Hệ thống bao gồm hai dịch vụ API chính:
1. **Core API** (`http://192.168.1.229:8000`): Cung cấp các endpoints nghiệp vụ chính.
2. **Export Service** (`http://192.168.1.229:8001`): Chế bản tài liệu TeX Live & Pandoc.

---

## 1. Core API (FastAPI)

### 1.1. Quản Lý Câu Hỏi (`/api/questions`)

#### `GET /api/questions`
Lấy danh sách câu hỏi trong ngân hàng với bộ lọc.
- **Query Parameters:**
  - `limit` (int, default: 20)
  - `offset` (int, default: 0)
  - `main_topic` (string, optional: `ALGEBRA`, `NUMBER_THEORY`, `PLANE_GEOMETRY`, `SOLID_GEOMETRY`, `INEQUALITY_EXTREMA`, `COMBINATORICS_PROBABILITY`, `REAL_WORLD_MATH`)
  - `difficulty` (string, optional: `EASY`, `MEDIUM`, `HARD`, `OLYMPIAD`)
  - `is_verified` (boolean, optional)

#### `PUT /api/questions/{question_id}`
Cập nhật toàn diện câu hỏi (giáo viên sửa đổi nội dung, ý con, lời giải).
- **Request Body (JSON):**
  ```json
  {
    "content_latex": "Nội dung câu hỏi...",
    "solution_latex": "Lời giải chi tiết...",
    "final_answer": "x = 2",
    "main_topic": "ALGEBRA",
    "difficulty": "HARD",
    "user_difficulty": "9.5 điểm",
    "default_points": 3.0,
    "custom_tags": ["Toán chuyên", "Đội tuyển"],
    "sub_questions": [
      {
        "part_id": "a",
        "label": "a)",
        "content_latex": "Chứng minh...",
        "points": 1.5
      }
    ]
  }
  ```

#### `PATCH /api/questions/{question_id}/difficulty`
Cập nhật nhanh độ khó chuẩn và độ khó giáo viên chấm.
- **Request Body (JSON):**
  ```json
  {
    "difficulty": "HARD",
    "user_difficulty": "9.0 điểm"
  }
  ```

#### `POST /api/questions/{question_id}/solution/ocr`
Nhận diện và trích xuất lời giải chi tiết từ ảnh chụp hoặc file PDF qua Gemini Flash.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (UploadFile)

#### `POST /api/questions/{question_id}/revert`
Khôi phục nội dung câu hỏi về bản gốc OCR ban đầu.

---

### 1.2. Tổ Hợp Đề Thi (`/api/generator`)

#### `POST /api/generator/generate`
Tạo đề thi mới dựa trên khung ma trận (Blueprint).
- **Request Body:**
  ```json
  {
    "title": "ĐỀ THI CHỌN HSG TOÁN 9 - ĐỀ SỐ 01",
    "blueprint_id": "UUID-ma-tran"
  }
  ```

#### `GET /api/generator/exams/{exam_id}/download`
**Tải trực tiếp tệp đề thi về máy tính thí sinh/giáo viên (Direct Streaming).**
- **Query Parameters:**
  - `format`: `"docx"` hoặc `"pdf"`
  - `mode`: `"EXAM"` (Đề thi) hoặc `"RUBRIC"` (Hướng dẫn chấm)
- **Response:** Nhị phân file đính kèm với HTTP Header `Content-Disposition: attachment; filename="de_thi_...pdf"`.

---

### 1.3. Exam Studio (`/api/studio`)

#### `POST /api/studio/exams/{exam_id}/sync-items`
Chuyển đổi các câu hỏi trong đề thi thành các Snapshot độc lập (`exam_items`).

#### `GET /api/studio/exams/{exam_id}/items`
Lấy danh sách các bài toán và mốc barem điểm trong đề thi Studio.

#### `PATCH /api/studio/exams/{exam_id}/reorder`
Cập nhật thứ tự các câu hỏi sau khi kéo-thả hoặc bấm di chuyển.
- **Request Body:**
  ```json
  {
    "item_orders": [
      {"item_id": "UUID-1", "order_index": 0},
      {"item_id": "UUID-2", "order_index": 1}
    ]
  }
  ```

#### `POST /api/studio/exams/{exam_id}/preview`
Biên dịch mã TeX Live và trả về danh sách ảnh xem trước trang A4 (150 DPI).
- **Request Body:**
  ```json
  {
    "layout_knobs": {
      "font_size_pt": 12,
      "line_spread": 1.15,
      "item_gap_pt": 10,
      "margin_top_cm": 1.8,
      "margin_bottom_cm": 1.8,
      "margin_left_cm": 2.0,
      "margin_right_cm": 1.8
    },
    "header_config": { ... },
    "mode": "EXAM"
  }
  ```
- **Response:**
  ```json
  {
    "status": "SUCCESS",
    "pdf_key": "studio/{exam_id}/exam/document.pdf",
    "page_keys": [
      "studio/{exam_id}/exam/page-1.png",
      "studio/{exam_id}/exam/page-2.png"
    ],
    "total_pages": 2
  }
  ```

#### `POST /api/studio/exams/{exam_id}/layout-agent`
**Trợ lý AI dàn trang đa phương thức (Multimodal AI Layout Agent).**
- **Request Body:**
  ```json
  {
    "user_message": "Dồn câu hỏi lại để vừa khít 1 trang A4",
    "image_data": "data:image/png;base64,... (hoặc null)",
    "current_layout_knobs": { ... },
    "mode": "EXAM"
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "ui_status_message": "Đã giảm lề trang và khoảng cách để dồn vừa vặn trang 1.",
    "updated_layout_knobs": { ... },
    "preview_data": { ... }
  }
  ```

#### `POST /api/studio/items/{item_id}/rubric/auto-split`
AI tự động phân rã lời giải thành hệ thống điểm Quanta 0.25đ chuẩn Bộ GD&ĐT.

#### `POST /api/studio/items/{item_id}/variant`
AI kiến tạo ngược từ nghiệm nguyên đẹp (Reverse-construct from clean roots) để sinh bài toán biến thể mới.

---

### 1.4. Streaming Tệp Tin Lưu Trữ (`/api/assets`)

#### `GET /api/assets/{object_key:path}`
Stream trực tiếp hình ảnh sơ đồ hình học, ảnh trang scan hoặc bản in từ MinIO về trình duyệt.
