# TÀI LIỆU DỰ ÁN: HSG MATH EXAM PLATFORM
**Nền Tảng Số Hóa, Quản Lý Ngân Hàng Câu Hỏi & Exam Studio Cho Đề Thi Toán HSG THCS**

---

## 📚 Danh Mục Tài Liệu Kỹ Thuật

Thư mục `docs/` chứa toàn bộ tài liệu đặc tả kiến trúc, hướng dẫn triển khai, tài liệu API và cẩm nang người dùng cho hệ thống **HSG Math Exam**:

1. **[Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu (`ARCHITECTURE.md`)](./ARCHITECTURE.md)**
   - Tổng quan 7 microservices Docker Compose (Core API, Ingestion Worker, Export Service, Frontend, Postgres pgvector, Redis, MinIO).
   - Mô hình Snapshot Instance, cơ chế Hybrid Search (SQL + Vector 768 chiều).
   - Tích hợp mô hình AI `antigravity/gemini-3.8-flash-tiered` qua OmniRoute local proxy.

2. **[Cẩm Nang Sử Dụng Cho Giáo Viên (`USER_GUIDE.md`)](./USER_GUIDE.md)**
   - Quy trình số hóa tài liệu Word/PDF đề thi cấp 2 THCS.
   - Quản lý ngân hàng câu hỏi, kiểm duyệt và gắn nhãn độ khó sư phạm tùy biến.
   - Sử dụng **Exam Studio**: Giao diện Overleaf Live PDF Canvas, AI Layout Agent hỗ trợ dán ảnh `Ctrl + V`, và bảng Barem điểm 0.25đ Quanta chuẩn Bộ GD&ĐT.
   - Hướng dẫn xuất và tải tệp bản in PDF TeX Live & Word `.docx` OMML.

3. **[Đặc Tả Danh Mục API (`API_REFERENCE.md`)](./API_REFERENCE.md)**
   - Toàn bộ danh mục RESTful API của `core-api` (Cổng 8000) và `export-service` (Cổng 8001).
   - Định dạng Request/Response payload, Streaming Response và các mã lỗi.

4. **[Hạ Tầng Lưu Trữ & Triển Khai (`STORAGE_AND_DEPLOYMENT.md`)](./STORAGE_AND_DEPLOYMENT.md)**
   - Cấu hình phân vùng lưu trữ chuyên dụng `/second_disk` (98GB) cho Docker Volumes và hệ thống Cache.
   - Cấu hình Docker Compose local-first, biến môi trường `.env`, tài khoản MinIO và cơ sở dữ liệu.

---

## ⚡ Bắt Đầu Nhanh (Quick Start)

```bash
# 1. Di chuyển vào thư mục dự án
cd /home/manhtien/Gen_paper_based_exam

# 2. Khởi động toàn bộ hạ tầng
docker compose up -d

# 3. Địa chỉ truy cập:
# - Web App (Frontend):   http://192.168.1.229:3000
# - Core API Swagger:     http://192.168.1.229:8000/docs
# - Export Service Docs:  http://192.168.1.229:8001/docs
# - MinIO Storage WebUI:  http://192.168.1.229:9001 (minioadmin / minioadmin)
```
