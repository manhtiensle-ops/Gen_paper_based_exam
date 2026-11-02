# 🏛️ ĐẶC TẢ KỸ THUẬT PHÒNG CORE API (`Dept_Core_API`)
## Module: `services/core-api`
**Phụ trách:** Trưởng phòng `Lead_Dept_Core_API` | **Chuyên viên:** `Worker_APIDesigner`  
**Công ty:** VINH PHÁT (`dethi.ttgdvinhphat.com`) — Tập đoàn AI Holding OS

---

## 1. SỨ MỆNH & PHẠM VI TRÁCH NHIỆM
Phòng Core API quản lý toàn bộ logic máy chủ, mô hình dữ liệu quan hệ, bảo mật phân quyền khảo thí (RBAC), tối ưu hóa cơ sở dữ liệu PostgreSQL và cung cấp cổng kết nối RESTful API hiệu năng cao cho Web Studio và các đối tác B2B.

---

## 2. KIẾN TRÚC MÃ NGUỒN CỐT LÕI
```text
services/core-api/app/
├── main.py                     # Entry point FastAPI, cấu hình CORS, Middleware, Lifespan
├── config.py                   # Quản lý biến môi trường Pydantic Settings
├── database.py                 # Async SQLAlchemy engine & session pool
├── models.py                   # Schema ORM: Question, Exam, ExamSlot, User, AuditLog
├── schemas.py                  # Pydantic schemas cho Request/Response validation
├── rbac.py                     # Phân quyền 3 tầng: NORMAL (Student), TEACHER, ADMIN
└── routers/
    ├── questions.py            # Ngân hàng câu hỏi Toán HSG & THPT Quốc gia
    ├── exams.py                # Ma trận đề thi, tổ hợp đề thi thông minh
    ├── studio.py               # Live Preview canvas, sync items, barem chia 0.25đ
    ├── export.py               # Proxy giao tiếp với export-service (PDF/DOCX)
    └── auth.py                 # Xác thực JWT, quản trị tài khoản giáo viên/admin
```

---

## 3. MÔ HÌNH DỮ LIỆU & COMPOSITE INDEXES
Cơ sở dữ liệu được tối ưu hóa cho truy vấn tải cao (>10.000 đề thi/giờ) bằng hệ thống 4 Composite Indexes chính trong `models.py`:
1. `idx_questions_grade_subject_topic`: Truy vấn lọc nhanh câu hỏi theo Khối lớp + Môn học + Chuyên đề (`grade`, `subject`, `main_topic`).
2. `idx_questions_diff_section`: Phục vụ tổ hợp đề thi cân bằng ma trận theo Độ khó và Dạng câu hỏi (`difficulty`, `section_type`).
3. `idx_exam_slots_exam_order`: Tối ưu sắp xếp thứ tự câu hỏi trong đề thi (`exam_id`, `order_index`).
4. `idx_audit_logs_user_action`: Phục vụ kiểm toán bảo mật khảo thí và truy vết gian lận (`user_id`, `action`, `created_at`).

---

## 4. MA TRẬN PHÂN QUYỀN KHẢO THÍ (RBAC SPEC)
Hệ thống áp dụng chính sách phân quyền nghiêm ngặt nhằm bảo đảm an toàn dữ liệu đề thi HSG:
- **`NORMAL` (Học sinh/Khách)**: Chỉ có quyền xem đề thi công khai, làm bài luyện thi trắc nghiệm. Bị chặn xem lời giải chi tiết của câu hỏi VDC (Vận dụng cao) và bị che mã đề bảo mật.
- **`TEACHER` (Giáo viên khảo thí)**: Quyền tạo đề, tổ hợp ma trận, biên tập câu hỏi trong Exam Studio, chia barem 0.25đ, xuất bản file Word `.docx` và file in A4 `.pdf`.
- **`ADMIN` (Ban Khảo thí & Quản trị)**: Toàn quyền phê duyệt câu hỏi VDC vào ngân hàng đề thi quốc gia, cấu hình phôi bảo mật (Paper Seal), quản lý user và phân bổ hạn ngạch B2B.

---

## 5. HƯỚNG DẪN KẾ THỪA CHO CÁC PHÒNG BAN & AI AGENT

### A. Cách gọi API Tạo Đề & Đồng bộ Studio từ Agent khác
Khi một AI Agent hoặc công ty đối tác muốn tạo đề thi và mở studio chỉnh sửa:
```bash
# Bước 1: Tạo đề thi mới từ ma trận cấu hình
POST /api/generator/generate
Content-Type: application/json
{
  "title": "Đề Khảo sát Chất lượng Toán 12 - Lần 1",
  "grade": 12,
  "subject": "TOAN",
  "total_questions": 22,
  "matrix_config": { ... }
}
# Trả về: { "id": "6122d749-...", "status": "draft" }

# Bước 2: Đồng bộ câu hỏi vào bảng exam_items để kích hoạt Studio
POST /api/studio/exams/6122d749-.../sync-items
# Trả về: { "status": "synced", "items_count": 22 }

# Bước 3: Lấy danh sách câu hỏi & barem
GET /api/studio/exams/6122d749-.../items
```

### B. Endpoint Live Preview cho TeX Live
```http
POST /api/studio/exams/{exam_id}/preview
Content-Type: application/json
{
  "items": [ ... ],
  "layout_knobs": { "font_size_pt": 11, "columns": 2 },
  "mode": "EXAM"
}
```
*Lưu ý cho AI Agent*: Endpoint này tự động forward sang `export-service`. Nếu service biên dịch bận hoặc lỗi, Core API sẽ fallback trả về dữ liệu thô để client render giao diện HTML/KaTeX an toàn mà không làm gián đoạn trải nghiệm của giáo viên.
