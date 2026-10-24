# KIẾN TRÚC HỆ THỐNG TOÀN DIỆN (SYSTEM ARCHITECTURE SPEC)
**Nền Tảng Khảo Thí & Biên Soạn Đề Thi HSG Toán — Giáo Dục Vinh Phát**  
*Mã dự án:* `Gen_paper_based_exam` | *Cập nhật phiên bản:* `v2.4.0 (Tháng 10/2026)`

---

## 1. SƠ ĐỒ KHỐI TỔNG THỂ (SYSTEM TOPOLOGY)

```
                              INTERNET (Giáo viên / Học sinh)
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    CLOUDFLARE ZERO TRUST & ACCESS GATEWAY    │
                      │  - Tên miền chính thức: dethi.ttgdvinhphat.com│
                      │  - SSL/TLS Full Strict, DDOS Protection      │
                      │  - Bypass chính sách cho Web tĩnh/SEO bots   │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    ORACLE CLOUD VPS (Reverse Proxy Gateway)  │
                      │  - IP Public: 168.110.193.43                 │
                      │  - WireGuard Server IP: 15.18.16.1           │
                      │  - Nginx Reverse Proxy điều phối traffic     │
                      └──────────────────────┬───────────────────────┘
                                             │ WireGuard Encrypted Tunnel
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │      LOCAL CT104 SERVER (15.18.16.2:3000)    │
                      │               Docker Compose Stack           │
                      └──────────────────────┬───────────────────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        ▼                                    ▼                                    ▼
┌───────────────────────┐        ┌───────────────────────┐        ┌───────────────────────┐
│ FRONTEND (Next.js 14) │        │  CORE API (FastAPI)   │        │ EXPORT SERVICE (Fast) │
│ - Port: 3000          │───────▶│ - Port: 8000          │───────▶│ - Port: 8001          │
│ - Fluid 3-Column Rail │        │ - RBAC 4-Tier Guard   │        │ - TeX Live Native     │
│ - KaTeX & Pagination  │        │ - Direct Google OAuth │        │ - Pandoc OMML to DOCX │
│ - Studio A4 Live View │        │ - Quota Engine (Redis)│        │ - RAM Disk (/dev/shm) │
└───────────────────────┘        └───────────┬───────────┘        └───────────────────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
         ┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐
         │  PostgreSQL 16 DB     ││   REDIS BROKER & DB   ││   MINIO OBJECT S3     │
         │ - Port: 5432          ││ - Port: 6379          ││ - Port: 9000 / 9001   │
         │ - pgvector (768-dim)  ││ - Celery task broker  ││ - Storage đề gốc/ảnh  │
         │ - Bảng Users & RBAC   ││ - Daily AI Quota (VN) ││ - Bản in PDF & DOCX   │
         │ - Exam & Folder Trees ││ - TTL 28h Key Expiry  ││ - Chainguard image    │
         └───────────────────────┘└───────────────────────┘└───────────────────────┘
                                             │
                                             ▼
                                 ┌───────────────────────┐
                                 │   INGESTION WORKER    │
                                 │ - Celery Async Tasks  │
                                 │ - PyMuPDF / Poppler   │
                                 │ - OmniRoute Proxy AI  │
                                 │   (Gemini 3.8 Flash)  │
                                 └───────────────────────┘
```

---

## 2. KIẾN TRÚC XÁC THỰC & PHÂN QUYỀN (RBAC & DIRECT GOOGLE OAUTH)

Hệ thống loại bỏ sự phụ thuộc vào OAuth session của Cloudflare Access bằng cơ chế **Direct Google OAuth 2.0 Flow**:

```
[ Người dùng bấm Đăng nhập ]
            │
            ▼
[ GET /api/auth/google-login ] ──▶ [ Chuyển hướng tới Google Sign-In ]
                                                │ (Chọn tài khoản Gmail)
                                                ▼
[ Callback: GET /api/auth/callback/google ] ◀───┘ (Kèm Authorization Code)
            │
            ├─ 1. Backend đổi code lấy access_token trực tiếp từ Google OAuth
            ├─ 2. Gọi Google API Userinfo lấy: email, name, avatar
            ├─ 3. Upsert vào bảng PostgreSQL `users` (gán Role mặc định: NORMAL)
            ├─ 4. Gắn Cookie an toàn `hsg_user_email` (max_age: 7 ngày, domain: .ttgdvinhphat.com)
            ▼
[ Redirect về Trang Chủ dethi.ttgdvinhphat.com ] ──▶ Đã nhận diện danh tính & nạp Quota!
```

### 2.1. Ma Trận Phân Quyền 4 Tầng (4-Tier Role System)

| Tiêu chí | 1. GUEST (Khách) | 2. NORMAL (Google Free) | 3. VIP (Nạp thử nghiệm) | 4. PRO (Bản quyền toàn phần) |
|---|:---:|:---:|:---:|:---:|
| **Điều kiện nhận diện** | Chưa đăng nhập | Đăng nhập tài khoản Google | `role == 'VIP'` & còn hạn | `role == 'PRO'` / Trường học |
| **Xem Ngân hàng câu hỏi** | Có (Read-only) | Có (Read-only) | Có (Read-only) | Có (Đầy đủ) |
| **Tổ hợp đề thi (Zero-Hallucination)** | ❌ Bị khóa | Có (Lưu trữ cá nhân) | Có (Lưu trữ cá nhân) | Có (Không giới hạn) |
| **Định ngạch AI hàng ngày (Daily Quota)** | ❌ **0 lượt** | **100 lượt / ngày** | **500 lượt / ngày** | 👑 **Vô hạn (Unlimited)** |
| **Cơ chế tính Quota AI** | Không khả dụng | Trừ qua Redis counter | Trừ qua Redis counter | Bỏ qua kiểm tra hạn ngạch |
| **Thời điểm Reset Quota** | - | **00:00 (Giờ Việt Nam - UTC+7)** | **00:00 (Giờ Việt Nam - UTC+7)** | - |
| **Xuất file Word (.docx) & PDF** | ❌ Bị khóa | Có | Có | Có |
| **Phân quyền dữ liệu (Data Isolation)** | Danh sách rỗng `[]` | Chỉ thấy đề của chính mình | Chỉ thấy đề của chính mình | Xem đề cá nhân + đơn vị |

### 2.2. Danh Mục Các Tác Vụ Trừ Quota AI (Cost Mapping)
* `POST /api/studio/items/{id}/rubric/auto-split`: **-1 lượt** (Chia nhỏ barem KaTeX 0.25đ).
* `POST /api/studio/exams/{id}/ai-generate-grading-steps`: **-1 lượt** (Tự động sinh bước giải chi tiết).
* `POST /api/studio/items/{id}/variant`: **-1 lượt** (Sinh bài toán biến thể tương đương).
* `POST /api/questions/{id}/solution/ocr`: **-1 lượt** (OCR lời giải chữ viết tay / hình ảnh).
* `POST /api/exams/batch-upload`: **-N lượt** ($N = \text{số lượng file đề thi tải lên}$).
* *(Các thao tác tổ hợp đề, lọc câu hỏi, đổi câu hỏi tương đương qua SQL/pgvector hoàn toàn **KHÔNG trừ Quota**).*

---

## 3. CẤU TRÚC DỮ LIỆU & CÔ LẬP NGUYÊN KHỐI (DATA ISOLATION SCHEMA)

### 3.1. Phân tầng Bảng `users` & `generated_exams`
```sql
-- Bảng tài khoản người dùng & gói dịch vụ
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'NORMAL', -- GUEST, NORMAL, VIP, PRO, ADMIN
    subscription_tier VARCHAR(50) DEFAULT 'NORMAL',
    tenant_id VARCHAR(100) DEFAULT 'default_school',
    vip_expires_at TIMESTAMPTZ,
    pro_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng thư mục phân loại đề thi
CREATE TABLE exam_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id VARCHAR(100) DEFAULT 'default_school',
    parent_id UUID REFERENCES exam_folders(id) ON DELETE CASCADE,
    color VARCHAR(30) DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng đề thi đã tổ hợp (gắn chặt quyền sở hữu)
CREATE TABLE generated_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES exam_blueprints(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES exam_folders(id) ON DELETE SET NULL,
    slots_state JSONB NOT NULL,
    header_config JSONB DEFAULT '{}',
    total_target_score NUMERIC(4,2) DEFAULT 20.00,
    tenant_id VARCHAR(100) DEFAULT 'default_school',
    template_document JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2. Chỉ Mục Phân Trang Ngân Hàng Câu Hỏi (Composite Indexing)
Nhằm đảm bảo ngân hàng câu hỏi mở rộng lên $> 100.000$ bản ghi mà tốc độ truy vấn vẫn $< 15\text{ms}$:
```sql
CREATE INDEX idx_questions_query_filter 
ON questions (grade, section_type, main_topic, difficulty, is_verified, created_at DESC);
```
API `/api/questions` áp dụng **Server-side Pagination**:
- Tham số: `page` (mặc định 1) và `page_size` (10, 20, 50).
- Trả về payload chuẩn: `{ items: [...], total: 60, page: 1, page_size: 10, total_pages: 6 }`.

---

## 4. QUY TRÌNH CHẾ BẢN VÀ XUẤT BẢN ĐỀ THI (LATEX & OMML WORD)

### 4.1. Turbo TeX Live Live Preview Engine (<0.3s)
* Thực thi trên RAM Disk (`/dev/shm`), không ghi đĩa vật lý $\to$ triệt tiêu độ trễ I/O.
* Tiêu chuẩn trình bày:
  - Font chữ: Times New Roman toán học (`mathptmx`).
  - Định dạng: Khổ giấy A4, lề chuẩn Bộ GD&ĐT (Trái 2cm, Phải 1.5cm, Trên 2cm, Dưới 2cm).
  - Tự động tách ảnh từng trang độ phân giải 150 DPI bằng Poppler `pdftoppm`.

### 4.2. Engine Xuất Word OMML Bản Quyền (`docx_math_builder.py`)
* Không dùng ảnh công thức toán (Math as Image) $\to$ Xuất toán học bản địa Word (Office Math Markup Language - OMML).
* Bảng Barem điểm 3 cột:
  - Cột 1: Câu/Ý.
  - Cột 2: Nội dung hướng dẫn giải chi tiết (KaTeX $\to$ OMML).
  - Cột 3: Điểm số chi tiết mốc 0.25đ.
* Tự động gộp dòng (`w:vMerge`) cho các bài toán nhiều ý và chống gãy bảng qua trang (`w:cantSplit`).

---

## 5. THƯƠNG HIỆU & TIÊU CHUẨN TRÌNH BÀY (BRAND IDENTITY)

* **Tên thương hiệu chính thức:** **Giáo Dục Vinh Phát** (hoặc **Dạy Học Vinh Phát**, **TTGD Vinh Phát**).
  * *Lưu ý tuyệt đối:* Tên "Vinh" **không có dấu ngã**.
* **Định vị:** Đơn vị Dạy học & Khảo thí chuyên sâu Toán Học Sinh Giỏi (Lớp 6, 7, 8, 9) và Luyện thi Chuyên Toán vào 10.
* **Phong cách giao diện:** **Light Academic Workspace** (Trắng tuyết / Slate trung tính nhã nhặn, bố cục 3 cột chống tràn ngang, tối ưu cho màn hình laptop và PC giáo viên).
