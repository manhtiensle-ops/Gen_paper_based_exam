# 📚 HỆ THỐNG TÀI LIỆU KỸ THUẬT CẤP CÔNG TY (ENGINEERING SPECS & PLAYBOOKS)
## Nền tảng Khảo thí & In ấn Đề thi Giấy VINH PHÁT (dethi.ttgdvinhphat.com)
*Trực thuộc Tập đoàn AI Holding OS — Ban hành bởi CEO VINH PHÁT*

---

## 🏛️ TỔNG QUAN HỆ THỐNG TÀI LIỆU
Hệ thống tài liệu này được biên soạn bởi 4 Trưởng phòng chuyên trách trực thuộc CEO nhằm chuẩn hóa toàn bộ kiến trúc, giao thức API, mô hình dữ liệu và quy trình vận hành. Tài liệu được thiết kế chuyên biệt để:
1. **Các AI Agent** (Hermes Agent, Coding Agents, Subagents) dễ dàng đọc, phân tích ngữ cảnh và tự động mở rộng tính năng mà không làm phá vỡ logic cốt lõi.
2. **Các công ty thành viên trong AI Holding OS** (B2B Partners) dễ dàng tích hợp API khảo thí, kế thừa microservices và xuất bản tài liệu chuẩn sư phạm.
3. **Các kỹ sư mới và phòng ban liên kết** nắm bắt kiến trúc trong vòng 15 phút.

---

## 📑 MỤC LỤC BỘ TÀI LIỆU 4 PHÒNG BAN

| Phòng Ban | Trách Nhiệm Cốt Lõi | Tài Liệu Chi Tiết |
| :--- | :--- | :--- |
| **1. Phòng Core API (`Dept_Core_API`)** | Backend FastAPI, Database Schema, Composite Indexes, RBAC & API Router | [`docs/departments/DEPT_CORE_API.md`](./departments/DEPT_CORE_API.md) |
| **2. Phòng AI & Xử lý Dữ liệu (`Dept_AI_Ingestion`)** | Pipeline OCR đa tầng, Schema Pydantic, Vector SVG & Normalizer | [`docs/departments/DEPT_AI_INGESTION.md`](./departments/DEPT_AI_INGESTION.md) |
| **3. Phòng Xuất bản & Chuyển đổi Tài liệu (`Dept_Docx_Export`)** | Engine TeX Live, OMML Word `.docx`, In-Memory Cache & A4 Printing | [`docs/departments/DEPT_DOCX_EXPORT.md`](./departments/DEPT_DOCX_EXPORT.md) |
| **4. Phòng Giao diện Studio (`Dept_Frontend_Studio`)** | Next.js 14, Interactive Exam Canvas, Barem 0.25đ & Fallback Preview | [`docs/departments/DEPT_FRONTEND_STUDIO.md`](./departments/DEPT_FRONTEND_STUDIO.md) |

---

## 🎯 CÁC TÀI LIỆU HỆ THỐNG KHÁC
- [Kiến trúc Tổng thể Hệ thống (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [Cẩm nang Kỹ thuật Vận hành (COMPANY_ENGINEERING_PLAYBOOK.md)](./COMPANY_ENGINEERING_PLAYBOOK.md)
- [Hướng dẫn Tích hợp API (API_REFERENCE.md)](./API_REFERENCE.md)
- [Đặc tả Engine Mẫu Đề thi Chuyên sâu (DESIGN_EXAM_TEMPLATE_ENGINE_DEEP.md)](./DESIGN_EXAM_TEMPLATE_ENGINE_DEEP.md)

---
*Tài liệu được bảo chứng chất lượng và kiểm định bởi Ban Giám đốc VINH PHÁT.*
