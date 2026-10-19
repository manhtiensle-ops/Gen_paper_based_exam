# HẠ TẦNG LƯU TRỮ & TRIỂN KHAI (STORAGE & DEPLOYMENT)

---

## 1. Cấu Hình Phân Vùng Lưu Trữ Ổ Phụ (`/second_disk`)

Hệ thống máy chủ Debian Linux (`CT104` tại IP `192.168.1.229`) được trang bị 2 ổ đĩa:
- **Ổ gốc `/`:** Dung lượng 49GB (dành riêng cho hệ điều hành).
- **Ổ phụ `/second_disk`:** Dung lượng 98GB (dành cho toàn bộ dữ liệu nặng và bộ nhớ đệm).

### 1.1. Cấu Trúc Thư Mục Dữ Liệu Trên `/second_disk`

```text
/second_disk/
├── hsg_data/                  # Dữ liệu bền vững của Docker Services
│   ├── minio/                 # Toàn bộ tệp PDF/DOCX gốc, ảnh scan 300DPI, ảnh cắt hình học (UID 65532)
│   ├── postgres/              # Cơ sở dữ liệu PostgreSQL 16 + pgvector (UID 999)
│   └── redis/                 # Dữ liệu hàng đợi Celery (UID 999)
└── user_cache/                # Bộ nhớ đệm hệ thống (Symlink từ ~/.cache)
    ├── uv/                    # Package cache của Python package manager uv (14GB)
    └── huggingface/           # Cache mô hình cục bộ
```

### 1.2. Cơ Chế Bind Mount Trong `docker-compose.yml`

Tất cả các Docker Volumes trong dự án đều được cấu hình bind-mount trực tiếp vào `/second_disk/hsg_data` để ngăn ngừa triệt để nguy cơ đầy ổ gốc `/`:

```yaml
volumes:
  pgdata:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /second_disk/hsg_data/postgres
  redisdata:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /second_disk/hsg_data/redis
  miniodata:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /second_disk/hsg_data/minio
```

---

## 2. Cấu Hình Mạng & Môi Trường (`.env`)

Tệp cấu hình môi trường nằm tại `/home/manhtien/Gen_paper_based_exam/.env`:

```env
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=***
POSTGRES_DB=hsg_math
POSTGRES_HOST=postgres-db
POSTGRES_PORT=5432

# Redis Cache & Broker
REDIS_HOST=redis-broker
REDIS_PORT=6379

# MinIO Object Storage
MINIO_ENDPOINT=minio-storage:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=***
MINIO_BUCKET_NAME=hsg-math-assets
MINIO_USE_SSL=false

# OmniRoute Local Proxy & Gemini Flash Model
OMNIROUTE_API_KEY=***
OMNIROUTE_BASE_URL=http://192.168.1.117:20128/v1
OMNIROUTE_VISION_MODEL=antigravity/gemini-3.8-flash-tiered
OMNIROUTE_EMBEDDING_MODEL=text-embedding-3-small

# Microservices Ports
FRONTEND_PORT=3000
CORE_API_PORT=8000
EXPORT_SERVICE_PORT=8001
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
```

---

## 3. Các Lệnh Quản Trị Hệ Thống (Operations Cheatsheet)

### Khởi động hoặc khởi động lại toàn bộ hệ thống
```bash
cd /home/manhtien/Gen_paper_based_exam
docker compose up -d
```

### Kiểm tra trạng thái sức khỏe các containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Xem log trực tiếp của một dịch vụ cụ thể
```bash
# Xem log Core API
docker logs -f hsg_core_api --tail 50

# Xem log Export Service (LaTeX engine)
docker logs -f hsg_export_service --tail 50

# Xem log Celery Ingestion Worker
docker logs -f hsg_ingestion_worker --tail 50
```

### Kiểm tra dung lượng phân vùng ổ đĩa
```bash
df -h / /second_disk
```
