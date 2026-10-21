# HSG Math Exam Studio (Nền Tảng Biên Soạn & Số Hóa Đề Thi Toán HSG)
**Hệ thống số hóa đề thi thông minh, quản lý ngân hàng câu hỏi và phòng studio biên soạn đề thi Toán Học Sinh Giỏi cấp THCS (Lớp 8 - 9) theo chuẩn in ấn quốc gia.**

[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](./docker-compose.yml)
[![Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](./frontend)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](./services/core-api)
[![TeX Live](https://img.shields.io/badge/Engine-TeX%20Live%20Native-blue)](./services/export-service)
[![Word OMML](https://img.shields.io/badge/Export-Word%20OMML%20Native-2B579A?logo=microsoftword&logoColor=white)](./services/export-service)

---

## 📖 Giới Thiệu Tổng Quan

**HSG Math Exam Studio** là nền tảng chuyên biệt được thiết kế cho các giáo viên, chuyên viên toán và ban ra đề thi học sinh giỏi THCS. Hệ thống giải quyết trọn vẹn chu trình làm đề thi:
1. **Số hóa hàng loạt đề thi cũ** từ tệp `.docx` hoặc `.pdf` bằng mô hình AI Gemini Vision kết hợp OCR cấu trúc.
2. **Quản lý ngân hàng câu hỏi** phân cấp sâu theo độ khó (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao/Olympic) và các chuyên đề toán chuyên (Đại số, Số học, Hình học phẳng, Bất đẳng thức, Tổ hợp rời rạc).
3. **Tổ hợp đề thi theo ma trận (Blueprint Engine)** đảm bảo nguyên tắc *Zero-Hallucination* (chỉ lấy câu hỏi thực tế có sẵn từ ngân hàng).
4. **Exam Studio (Biên soạn & Dàn trang A4 trực tiếp)**: Phòng làm việc phong cách *Light Academic Theme* lấy cảm hứng từ Overleaf Studio, tích hợp trình xem PDF native, bảng chia điểm barem vi mô 0.25đ, và xuất bản in đồng nhất từng pixel sang cả hai định dạng **TeX Live PDF** và **Microsoft Word (.docx)** công thức toán OMML native.

---

## ✨ Tính Năng Nổi Bật

### 1. 🚀 Số Hóa Hàng Loạt (Batch Document Ingestion Pipeline)
- **Vùng kéo-thả đa tệp (Batch Dropzone):** Kéo thả cùng lúc hàng chục file `.docx` và `.pdf`.
- **Hàng đợi kiểm duyệt (Staging Queue):** Xem trước danh sách file, dung lượng, định dạng, xóa tệp linh hoạt trước khi tải lên.
- **Xử lý nền với Celery & MinIO:** LibreOffice render từng trang ảnh 300 DPI, Gemini Flash phân tích cấu trúc, tự động bóc tách đề bài, lời giải và hình vẽ đi kèm (TikZ/ảnh cắt).

### 2. 📐 Tùy Biến Khung Ma Trận Đề Thi (Blueprint Customizer)
- Tích hợp sẵn 4 bộ preset ma trận chuẩn kỳ thi:
  1. *Khung Đề thi HSG 9 Chuẩn Quốc Gia (20.0đ)*
  2. *Khung Đề thi Chuyên Toán Vào 10 (10.0đ)*
  3. *Khung Đề Khảo Sát Đội Tuyển HSG Vòng 1 (20.0đ)*
  4. *Khung Chuyên Đề Bất Đẳng Thức & Cực Trị (10.0đ)*
- Cho phép giáo viên tự tạo khung ma trận mới, nhân bản (clone), chỉnh sửa tỷ lệ phần trăm từng phân môn và độ khó mong muốn.

### 3. 🎯 Tổ Hợp Đề Thi "Zero-Hallucination"
- Tự động quét và chọn câu hỏi theo đúng ma trận blueprint đã chọn.
- Cơ chế *Atomic Bundling* cho câu hình học: Giữ nguyên vẹn giả thiết chung, hình vẽ minh họa và các ý chứng minh con a/b/c trong cùng 1 câu hỏi, không bao giờ bị xé lẻ.
- Đổi câu hỏi (Swap) hoặc sửa câu hỏi ngay trên đề thi đã tạo.

### 4. 🎨 Exam Studio (Phòng Soạn Thảo & Dàn Trang Đẳng Cấp)
- **Giao diện Light Academic Theme:** Nền trắng ngà/slate sáng sủa, thanh kéo resizer chia đôi màn hình tùy ý.
- **Trình chiếu A4 kép (Dual Viewer Mode):**
  - **Cuộn A4 mượt mà (Continuous Scroll):** Cuộn xem dọc toàn bộ các trang A4 với bóng đổ 3D sâu, số trang hiển thị rõ ràng.
  - **PDF Native nhúng trực tiếp:** Hỗ trợ tìm kiếm văn bản (`Ctrl+F`), in ấn nhanh (`Ctrl+P`) và phóng to thu nhỏ.
- **Khung Barem Điểm Sub-Row (Hướng dẫn chấm chuẩn Sở):**
  - Bảng barem 3 cột: *Câu hỏi* | *Các bước giải chi tiết* | *Điểm từng mốc*.
  - **Chia điểm 0.25đ Quanta:** Nút `+` và `-` 0.25đ ở từng bước giải, tự động cập nhật tổng điểm câu và tự động kích hoạt TeX Live biên dịch lại trong `<0.3s`.
  - **Nút 🤖 AI Barem:** Tự động gọi Gemini Flash phân tích bài toán và chia mốc giải 0.25đ chi tiết nếu câu hỏi chưa có lời giải.
- **Trợ Lý AI Dàn Trang & Sửa Đề:** Thanh drawer trượt bên phải hỗ trợ ra lệnh bằng ngôn ngữ tự nhiên: dồn trang A4, đổi câu hình sang 2 cột, dán ảnh chụp đề bài từ clipboard (`Ctrl+V`).

### 5. 🖨️ Xuất Bản In Chuẩn Bộ/Sở GD&ĐT
- **PDF TeX Live Native:** Sử dụng template LaTeX chuẩn font Times New Roman (`mathptmx`), căn lề A4, gói `longtable`, tự động ngắt trang thông minh.
- **Word OMML Native:** Xuất file `.docx` với bảng barem chuẩn Sub-Row `w:vMerge`, chống vỡ bảng qua trang `w:cantSplit`, lặp tiêu đề bảng `w:tblHeader`, và công thức toán Microsoft Equation OMML (không bị chuyển thành ảnh mờ).

### 6. 🛡️ Cơ Chế Bảo Vệ Tiến Trình 4 Tầng (Workspace Resilience)
- **Tầng 1 (URL Sync):** Lưu `exam_id` lên URL query parameter.
- **Tầng 2 (SWR Cache):** Nạp lại dữ liệu ngay lập tức trong 0ms khi chuyển tab.
- **Tầng 3 (Draft Recovery LRU):** Tự động lưu bản nháp chưa biên dịch vào `localStorage`, tự động dọn dẹp các bản nháp quá 7 ngày.
- **Tầng 4 (Navigation Guard):** Cảnh báo khi người dùng vô tình bấm `F5` hoặc đóng tab khi có nội dung chưa lưu.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

Hệ thống vận hành trên 7 Docker containers độc lập:

```text
                                  +---------------------------------------+
                                  |     Next.js 14 Frontend (:3000)       |
                                  +-------------------+-------------------+
                                                      |
                                           REST API & Web Rewrites
                                                      v
                                  +---------------------------------------+
                                  |        Core API FastAPI (:8000)       |
                                  +---------+-------------------+---------+
                                            |                   |
                       Dispatch Celery Tasks|                   | MinIO S3 API
                                            v                   v
+------------------------+        +---------+---------+   +-----+-----------------+
| Redis Broker (:6379)   |------->| Ingestion Worker  |   | MinIO S3 Storage      |
+------------------------+        +---------+---------+   | (:9000 / :9001)       |
                                            |             +-----------------------+
                                   PostgreSQL + pgvector                ^
                                            | (:5432)                   | Upload assets
                                            v                           |
                                  +-------------------+   +-------------+---------+
                                  | PostgreSQL DB     |   | Export Service (:8001)|
                                  | (16 + pgvector)   |   | (TeX Live & docx OMML)|
                                  +-------------------+   +-----------------------+
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Hệ điều hành:** Linux (Ubuntu 20.04+, Debian, Proxmox VE) hoặc macOS.
- **Docker & Docker Compose:** Docker version 24+ và Docker Compose v2.
- **Tài nguyên tối thiểu:** 4 Cores CPU, 8GB RAM, 30GB ổ cứng trống (khuyến nghị phân vùng SSD).

### 1. Clone repository
```bash
git clone https://github.com/manhtiensle-ops/Gen_paper_based_exam.git
cd Gen_paper_based_exam
```

### 2. Cấu hình biến môi trường (`.env`)
Tạo tệp `.env` tại thư mục gốc của dự án:
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hsg_math
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432

# Redis & Celery
CELERY_BROKER_URL=redis://redis-broker:6379/0
CELERY_RESULT_BACKEND=redis://redis-broker:6379/0

# MinIO Storage
MINIO_ENDPOINT=minio-storage:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=hsg-math-assets

# AI OmniRoute / LLM Proxy
OMNIROUTE_BASE_URL=http://192.168.1.117:20128/v1
OMNIROUTE_API_KEY=local-omniroute-key
OMNIROUTE_MODEL=antigravity/gemini-3.8-flash-tiered
```

### 3. Khởi động toàn bộ dịch vụ
```bash
docker compose up -d
```

### 4. Kiểm tra trạng thái các container
```bash
docker ps --filter "name=hsg_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
Tất cả 7 container sau phải ở trạng thái `Up`:
- `hsg_frontend` (:3000)
- `hsg_core_api` (:8000)
- `hsg_export_service` (:8001)
- `hsg_ingestion_worker`
- `hsg_postgres_db` (:5432)
- `hsg_redis_broker` (:6379)
- `hsg_minio_storage` (:9000, :9001)

### 5. Nạp ma trận đề thi mẫu (Seeding Blueprints)
Chạy lệnh nạp 4 preset blueprints quốc gia vào cơ sở dữ liệu:
```bash
docker exec -it hsg_core_api python app/seed_blueprints.py
```

---

## 🧭 Cẩm Nang Sử Dụng Cho Giáo Viên

### Bước 1: Số hóa tài liệu đề thi cũ
1. Mở trình duyệt truy cập: `http://<IP_MAY_CHU>:3000`.
2. Chọn tab **"Số hóa tài liệu"**.
3. Kéo thả các tệp đề thi cũ (`.docx` hoặc `.pdf`) vào vùng **Batch Dropzone**.
4. Bấm **`[ 🚀 Bắt đầu Số Hóa Hàng Loạt ]`**.
5. Theo dõi tiến trình số hóa ở cột bên phải cho đến khi tệp chuyển sang trạng thái `REVIEW_NEEDED`.

### Bước 2: Kiểm duyệt câu hỏi nạp vào ngân hàng
1. Chuyển sang tab **"Kiểm duyệt câu hỏi"**.
2. Xem lại nội dung toán, công thức LaTeX và hình vẽ đính kèm do AI bóc tách.
3. Chỉnh sửa công thức hoặc nhãn độ khó nếu cần, sau đó bấm **"Phê duyệt (Publish)"** để đưa câu hỏi vào ngân hàng chính thức.

### Bước 3: Tạo và tổ hợp đề thi mới
1. Chuyển sang tab **"Tổ hợp đề thi"**.
2. Chọn khung ma trận mong muốn (ví dụ: *Khung Đề thi HSG 9 Chuẩn Quốc Gia*). Nếu muốn tùy chỉnh, bấm nút **"Tùy biến khung ma trận"** để sửa tỷ lệ điểm và các câu hỏi.
3. Nhập tiêu đề đề thi và bấm **`[ Tổ Hợp Đề Thi Mới (Zero-Hallucination) ]`**.
4. Hệ thống sẽ bốc câu hỏi từ ngân hàng lắp vào bố cục đề thi. Bạn có thể bấm nút **"Đổi câu hỏi"** hoặc **"Sửa câu hỏi"** để thay đổi đề bài trực tiếp.

### Bước 4: Tinh chỉnh trong Exam Studio & Xuất bản in
1. Bấm **"Mở Exam Studio"** tại đề thi vừa tạo.
2. Tại Exam Studio:
   - Chuyển sang tab **"Khung Barem (Sub-Row)"** để xem và sửa các bước chấm điểm.
   - Bấm **`[ 🤖 AI Barem ]`** để nhờ AI chia mốc điểm 0.25đ tự động.
   - Bấm nút `+` hoặc `-` trên từng bước để tăng giảm điểm theo ý muốn.
   - Xem bản in A4 thời gian thực ở khung bên phải (hỗ trợ cuộn chuột liên tục hoặc chuyển sang chế độ **PDF Native**).
3. Bấm **"Tải PDF"** hoặc **"Tải Word (.docx)"** để xuất tài liệu in ấn gửi học sinh và hội đồng coi thi.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
Gen_paper_based_exam/
├── README.md                      # Tài liệu tổng quan dự án (tệp này)
├── docker-compose.yml             # Khởi chạy toàn bộ hạ tầng 7 microservices
├── docs/                          # Thư viện tài liệu kỹ thuật chi tiết
│   ├── ARCHITECTURE.md            # Đặc tả kiến trúc microservices và data flows
│   ├── USER_GUIDE.md              # Hướng dẫn sử dụng chi tiết từng chức năng
│   ├── API_REFERENCE.md           # Toàn bộ danh mục REST API endpoints
│   ├── STORAGE_AND_DEPLOYMENT.md  # Hướng dẫn cấu hình lưu trữ & mount disk
│   ├── DESIGN_EXAM_TEMPLATE_ENGINE.md      # Thiết kế engine dàn trang đề thi
│   └── DESIGN_EXAM_TEMPLATE_ENGINE_DEEP.md # Đặc tả kỹ thuật Word OMML & LaTeX
├── frontend/                      # Ứng dụng Next.js 14 App Router
│   ├── app/                       # Dashboard chính, routing & layout
│   ├── components/                # ExamStudioView, RubricTablePreview, Modals...
│   └── utils/                     # Quản lý lưu trữ 4 tầng workspaceStorage.ts
└── services/
    ├── core-api/                  # FastAPI backend: đề thi, ngân hàng, blueprints
    │   └── app/routers/           # studio.py, generator.py, exams.py, questions.py
    ├── export-service/            # TeX Live Compiler & docx_math_builder OMML
    └── ingestion-worker/          # Celery worker: OCR, Vision, LibreOffice pipeline
```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, KaTeX Math.
- **Backend:** FastAPI, Python 3.11, Pydantic v2, SQLAlchemy ORM, Alembic.
- **Cơ sở dữ liệu & Caching:** PostgreSQL 16 với tiện ích mở rộng `pgvector`, Redis 7.
- **Lưu trữ đối tượng:** MinIO Object Storage (S3 API Compatible).
- **Trình biên dịch in ấn:** TeX Live Full Native (`pdflatex`, `longtable`, `tikz`, `mathptmx`), `python-docx` tích hợp XML OMML Native.
- **Trí tuệ nhân tạo (AI):** OmniRoute Proxy (`antigravity/gemini-3.8-flash-tiered`) hỗ trợ Structured Output JSON.

---

## 📄 Bản Quyền & Giấy Phép

Dự án được phát triển và vận hành nội bộ phục vụ công tác bồi dưỡng học sinh giỏi môn Toán cấp THCS. Mọi đóng góp, báo lỗi xin vui lòng tạo Issue hoặc Pull Request trên kho lưu trữ GitHub chính thức.
