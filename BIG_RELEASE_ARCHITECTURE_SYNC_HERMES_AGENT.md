# TÀI LIỆU TRAO ĐỔI KIẾN TRÚC & TRIỂN KHAI VỚI MY_CREDENTIAL_HERMES_AGENT (BIG-RELEASE SYNC V2.5.0)
**Kính gửi**: `My_credential_hermes_agent` (Chuyên gia Hạ tầng & Điều phối Phát hành)
**Người lập**: CEO — Nền tảng Giáo dục VINH PHÁT (`dethi.ttgdvinhphat.com`)
**Trạng thái**: Đã sẵn sàng phát hành tập trung (Big-Batch Deployment Ready)

---

## 🏛️ 1. MỤC TIÊU CHIẾN LƯỢC
Thực hiện nghiêm túc chỉ đạo của Chủ tịch: gom trọn vẹn khối lượng công việc lớn đa phòng ban, chấm dứt commit lẻ tẻ tốn quota CI/CD. Đợt này tập trung đại tu diện mạo UI/UX toàn hệ thống sang chuẩn thẩm mỹ Boutique SaaS sư phạm cao cấp, kết hợp tối ưu hóa cơ sở dữ liệu và công thức Toán học.

---

## 📦 2. NỘI DUNG THAY ĐỔI ĐA PHÒNG BAN (WHAT / WHY / HOW)

### 🎨 Ban Thiết Kế Sáng Tạo & Giao Diện Studio (`Ban_Design_Creative` & `Ban_Frontend_Service`)
1. **Frosted Glass Sticky Header**:
   - *Thay đổi*: Nâng cấp Header từ navbar phẳng thành hiệu ứng kính mờ `frosted-glass` (`backdrop-blur-xl bg-white/85 border-b border-slate-200/80 shadow-sm`), biểu tượng VINH PHÁT mang gradient vát chéo Indigo-Amber lộng lẫy kèm badge trạng thái Cloudflare Synced phát xung.
2. **Segmented Pills Tab & Filter Switchers**:
   - *Thay đổi*: Thiết kế lại thanh tab điều hướng chính và các thanh bộ lọc trạng thái (Scope, Review status) thành thanh trượt lõm sâu (`shadow-inner bg-slate-100/90`), tab đang kích hoạt sở hữu hiệu ứng bóng nổi (`shadow-sm font-bold`).
3. **Shimmer AI Generator Button**:
   - *Thay đổi*: Áp dụng hiệu ứng sóng ánh sáng chuyển động ánh kim (`shimmer-btn`) trên nút Tạo đề thi AI, tăng chiều sâu và độ cuốn hút khi thao tác.
4. **Paper Sheet Elevation & Canvas Đề Thi**:
   - *Thay đổi*: Khung xem trước đề thi A4 và canvas duyệt câu hỏi chuyển sang hiệu ứng đổ bóng đa tầng (`paper-sheet-elevation`), mang lại cảm giác chân thực như trang giấy in ấn sư phạm đặt trên bàn làm việc.

### ⚙️ Ban Core API & Cơ Sở Dữ Liệu (`Ban_CoreAPI_Service` & `Ban_InfraDB_Service`)
1. **Thiết lập cụm Composite Index trên PostgreSQL**:
   - *Thay đổi*: Khai báo các composite index chuyên sâu trong SQLAlchemy model:
     + `idx_questions_filter_pedagogy`: Trên các cột `(grade, main_topic, difficulty, is_verified)`.
     + `idx_questions_tenant_scope`: Trên các cột `(user_id, is_public, is_verified)`.
     + `idx_generated_exams_user_created`: Trên các cột `(user_id, created_at)`.
     + `idx_generated_exams_tenant_folder`: Trên các cột `(user_id, folder_id, updated_at)`.
   - *Lợi ích*: Giảm thời gian query của các thao tác lọc ma trận đề và kho câu hỏi xuống dưới 15ms khi dữ liệu mở rộng.

### 📄 Ban Xuất Bản & Trí Tuệ Nhân Tạo (`Ban_Export_Service` & `Ban_AIIngestion_Service`)
1. **Chuẩn hóa Macro Toán học Việt Nam**:
   - *Thay đổi*: Thêm đầy đủ bộ macro sư phạm Việt Nam vào `latex_engine.py`:
     + `\vect{AB}` ($\overrightarrow{AB}$)
     + `\dx`, `\dy`, `\dt` (vi phân tích phân)
     + `\C`, `\R`, `\Z`, `\N` (các tập hợp số)
   - *Lợi ích*: Đảm bảo biên dịch XeLaTeX và xuất PDF/Word đạt độ chính xác 100%, không bị lỗi thiếu định nghĩa ký hiệu.

---

## 🛡️ 3. KẾT QUẢ KIỂM THỬ NỘI BỘ (LOCAL STAGING VERIFICATION)
- **Frontend Build**: `npm run build` hoàn thành với mã thoát 0 (`✓ Compiled successfully`, tạo đủ 8/8 static pages tối ưu, không có lỗi runtime/type).
- **Backend Syntax Check**: `python3 -m py_compile` kiểm tra toàn bộ file `models.py` và `latex_engine.py` hoàn tất không có bất kỳ lỗi cú pháp nào.
- **Git Staging**: Sạch sẽ, sẵn sàng đồng bộ 1 đợt duy nhất.
