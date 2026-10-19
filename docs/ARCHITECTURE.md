# KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
**HSG Math Exam Studio Platform**

---

## 1. Sơ Đồ Khối Tổng Thể (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                          │
│  - App Router, TailwindCSS, KaTeX MathRenderer                        │
│  - Exam Studio: 2-Panel Workstation + Overleaf-style Live PDF Canvas  │
│  - Multimodal AI Layout Chat (Dán ảnh Ctrl+V, Quick Knobs)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Reverse Proxy (/api/* -> core-api:8000)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       CORE API (FastAPI Backend)                       │
│  - /api/questions       : Quản lý ngân hàng & OCR lời giải            │
│  - /api/generator       : Tổ hợp đề thi theo ma trận & Direct Download│
│  - /api/studio          : Exam Studio, Quanta Rubric & AI Layout Agent│
│  - /api/assets          : Streaming hình vẽ & file PDF/DOCX từ MinIO  │
└─────────────┬─────────────────────┬──────────────────────┬─────────────┘
              │                     │                      │
   SQLAlchemy │         Celery Task │           REST Call  │
              ▼                     ▼                      ▼
┌────────────────────────┐  ┌───────────────┐  ┌─────────────────────────┐
│     PostgreSQL 16      │  │ INGESTION     │  │     EXPORT SERVICE      │
│  + pgvector (768-dim)  │  │ WORKER        │  │  - TeX Live Native      │
│  - source_exams        │  │  (Celery/Py)  │  │    pdflatex + pdftoppm  │
│  - questions           │  │  - DOCX->PNG  │  │  - Pandoc OMML to DOCX  │
│  - exam_blueprints     │  │  - Gemini OCR │  │  - RAM Disk /dev/shm    │
│  - generated_exams     │  │  - Normalizer │  │  - Cache /second_disk   │
│  - exam_items          │  │  - Embedder   │  └─────────────────────────┘
└─────────────▲──────────┘  └───────┬───────┘
              │                     │
              │ Redis Queue         │ S3 Bucket (hsg-math-assets)
┌─────────────┴──────────┐  ┌───────▼────────────────────────────────────┐
│      REDIS BROKER      │  │             MINIO STORAGE                  │
│      (Cổng 6379)       │  │ (cgr.dev/chainguard/minio:latest)          │
│  - Celery task broker  │  │ - PDF/DOCX đề thi gốc                      │
│  - Event coordination  │  │ - Ảnh render trang scan 300 DPI            │
│                        │  │ - Hình vẽ hình học cắt bằng Pillow         │
│                        │  │ - File xuất bản TeX Live PDF & DOCX        │
└────────────────────────┘  └────────────────────────────────────────────┘
```

---

## 2. Các Microservices Chi Tiết

| Service | Container Name | Công nghệ cốt lõi | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Frontend** | `hsg_frontend` | Next.js 14, React 18, TailwindCSS, KaTeX | Giao diện Studio tương tác, hiển thị Live A4 PDF Canvas, quản lý ma trận đề thi và ngân hàng câu hỏi. |
| **Core API** | `hsg_core_api` | FastAPI, Python 3.11, SQLAlchemy, OpenAI SDK | Cung cấp toàn bộ RESTful API, thuật toán Hybrid Search, điều phối AI Layout Agent và streaming download file nhị phân. |
| **Ingestion Worker** | `hsg_ingestion_worker` | Celery, PyMuPDF, Pillow, Poppler, OmniRoute | Số hóa đề thi page-by-page từ DOCX/PDF, nhận diện câu hỏi Toán, gom cụm bài hình nguyên khối (`SHARED_STEM`) và cắt hình vẽ. |
| **Export Service** | `hsg_export_service` | TeX Live (`pdflatex`), Poppler (`pdftoppm`), Pandoc, LibreOffice | Biên dịch tài liệu chuẩn Bộ GD&ĐT: sinh file PDF TeX Live native và ảnh trang 150 DPI tức thời trong `< 0.4s`. |
| **Database** | `hsg_postgres_db` | PostgreSQL 16, pgvector | Lưu trữ cấu trúc quan hệ, bảng snapshots `exam_items`, và chỉ mục vector HNSW 768 chiều. |
| **Broker** | `hsg_redis_broker` | Redis 7 Alpine | Hàng đợi tác vụ Celery phục vụ các pipeline số hóa nặng. |
| **Storage** | `hsg_minio_storage` | MinIO (Chainguard image) | Lưu trữ hướng đối tượng S3 cho hình ảnh, tệp tin đề thi và bản in tài liệu. |

---

## 3. Kiến Trúc AI & Kỹ Thuật Chế Bản (AI & LaTeX Engine)

### 3.1. Mô Hình AI Chủ Lực: `antigravity/gemini-3.8-flash-tiered`
- Được định tuyến qua OmniRoute Proxy cục bộ (`http://192.168.1.117:20128/v1`).
- Đảm bảo độ trễ thấp (`~200ms - 800ms`), chi phí tối thiểu, và hỗ trợ xử lý đa phương thức (Multimodal Vision):
  - Phân tích ảnh scan đề thi 300 DPI.
  - Phân tích ảnh chụp màn hình do giáo viên dán (`Ctrl + V`) khoanh tròn chỗ cần sửa.

### 3.2. Triết Lý "Problem Snapshot Instance"
- Khi câu hỏi được đưa vào đề thi (`generated_exams`), hệ thống tạo một bản ghi độc lập trong bảng `exam_items`.
- Giáo viên có thể tùy ý sửa số liệu, đổi câu từ, hoặc chia lại barem điểm mà không làm biến đổi câu hỏi gốc trong ngân hàng.

### 3.3. Thuật Toán Integer Quanta (Barem Điểm 0.25đ Chuẩn)
- Quy đổi $1 \text{ quantum} = 0.25 \text{ điểm}$.
- Ép mô hình phân bổ số nguyên quanta và tính dồn `cumulative_quanta` theo JSON Schema $\rightarrow$ Triệt tiêu 100% hiện tượng ảo giác số học và lệch tổng điểm đề thi.

### 3.4. Turbo-LaTeX Engine & Zero-I/O Compilation
- Sử dụng TeX Live biên dịch trực tiếp trên phân vùng RAM `tmpfs` (`/dev/shm`).
- Tích hợp bộ font Times New Roman chuẩn Toán học (`mathptmx`), căn lề A4 chuẩn Bộ GD&ĐT, và xuất ảnh từng trang A4 tức thời bằng `pdftoppm -png -r 150`.
