# CẨM NANG HƯỚNG DẪN SỬ DỤNG CHO GIÁO VIÊN
**Dành cho Giáo viên Bồi dưỡng HSG Toán THCS & Luyện thi vào 10 Chuyên**

---

## 1. Số Hóa Đề Thi Mới (Ingestion Tab)

1. Mở trình duyệt truy cập: `http://192.168.1.229:3000` (hoặc `http://localhost:3000`).
2. Vào tab **"Số hóa tài liệu"**:
   - Nhập tiêu đề kỳ thi (ví dụ: *Đề thi chọn HSG 9 Huyện Thạch Sen 2026-2027*).
   - Chọn tệp đề thi gốc dạng `.docx` hoặc `.pdf`.
   - Bấm **"Bắt đầu Số Hóa Pipeline"**.
3. **Quá trình AI xử lý tự động ngầm:**
   - LibreOffice chuyển tệp sang PDF và Poppler kết xuất ảnh scan sắc nét 300 DPI.
   - Mô hình Gemini 3.8 Flash bóc tách từng trang, phát hiện bài hình học nguyên khối (`SHARED_STEM`) và gom trọn vẹn các ý a, b, c vào cùng một câu hỏi.
   - Tự động cắt sơ đồ hình học bằng Pillow và lưu trữ vào hệ thống.

---

## 2. Kiểm Duyệt & Biên Tập Ngân Hàng Câu Hỏi (Question Bank)

1. Vào tab **"Hàng đợi kiểm duyệt"**:
   - Duyệt qua từng câu hỏi vừa được bóc tách.
   - Xem công thức toán học hiển thị trực quan qua KaTeX.
   - Bấm **"Phê duyệt đưa vào Ngân hàng"** để đưa câu hỏi vào kho đề chính thức.
2. **Tùy biến sư phạm trực tiếp trên mỗi câu hỏi:**
   - **Đổi độ khó nhanh:** Bấm vào nhãn độ khó để chuyển nhanh giữa `Cơ bản (EASY)`, `Vận dụng (MEDIUM)`, `Vận dụng cao (HARD)`, `Học sinh giỏi (OLYMPIAD)`.
   - **Độ khó giáo viên chấm (`user_difficulty`):** Giáo viên có thể tự chấm theo thang điểm riêng của trường (ví dụ: `9.5 điểm`, `Đội tuyển vòng 2`).
   - **Nút "Sửa" (Icon cây bút ✏️):**
     - Sửa lại đề bài, đổi số liệu hoặc chỉnh công thức toán.
     - Thêm/bớt các ý hỏi con a), b), c).
     - **Bổ sung lời giải qua AI:** Chuyển sang tab *Bổ sung Lời giải qua AI*, tải lên ảnh chụp bài giải viết tay hoặc file PDF đáp án $\rightarrow$ Bấm *Bắt đầu bóc tách* để AI tự động chuyển hóa thành mã LaTeX lời giải chi tiết.

---

## 3. Không Gian Làm Việc "Exam Studio" (Overleaf-Grade Light Studio)

Vào tab **"Exam Studio (Soạn & Barem 0.25đ)"** hoặc bấm nút **"Mở Exam Studio ➔"** từ bảng tổ hợp đề thi:

### 3.1. Giao Diện Sáng Nhã Nhặn (Light Academic Theme) & Tận Dụng Toàn Màn Hình
- **Tone màu chủ đạo:** Màu trắng tuyết và xám slate thanh lịch, tạo sự đồng nhất với giao diện toàn trang và giúp mắt giáo viên thoải mái khi làm việc lâu.
- **Thanh chia đôi co giãn (Draggable Split Resizer):** 
  - Nằm ở ranh giới giữa khung Code và khung PDF.
  - Giáo viên có thể bấm giữ chuột để kéo co giãn tỷ lệ (từ 30% đến 70%) tùy theo nhu cầu xem code rộng hơn hay xem bản in to hơn.
  - Nhấp đúp (Double-click) vào thanh chia để tự động khôi phục tỷ lệ cân bằng `50/50`.

### 3.2. Sửa Công Thức Trực Tiếp Bằng Mã LaTeX (Code Editor - Nửa Trái)
- **Thu gọn Preamble thông minh (Focus on Content):**
  - Khối mã cấu hình TeX Live được ẩn tự động dưới banner `▸ [Cấu hình hệ thống TeX Live]`.
  - Giáo viên nhìn thấy ngay các đề bài: `Câu 1`, `Câu 2`... để chỉnh sửa nhanh.
- **Gõ sửa tự do & Phím tắt `Ctrl + S`:**
  - Giáo viên click chuột sửa bất kỳ ký hiệu toán nào (như đổi `x^2` thành `x^3`, sửa nghiệm, sửa đề bài).
  - Bấm **`Ctrl + S`** (hoặc nút *Biên dịch lại*): TeX Live biên dịch ngầm tức thì (< 0.3s) và bản in A4 bên phải cập nhật ngay lập tức.

### 3.3. Trợ Lý AI Dàn Trang & Sửa Đề Đa Phương Thức (Slide-Over Drawer)
- Bấm nút **`[ 💬 Trợ Lý AI ]`** hoặc nhấn **`Ctrl + K`** để mở ngăn kéo trợ lý thông minh:
  - **Dán ảnh chụp màn hình (`Ctrl + V`):** Dùng Snipping Tool chụp chỗ cần sửa trên bản in, khoanh tròn đỏ rồi bấm `Ctrl + V` vào ô chat kèm lệnh (ví dụ: *"Sửa biểu thức này thành...", "Đổi bài hình sang 2 cột"*).
  - **Nút lệnh dàn trang 1-click:** `⚡ Dồn vừa 1 trang A4`, `📐 Bài hình 2 cột`, `📏 Thu hẹp lề 1.4cm`, `🔤 Cỡ chữ 12pt`.

### 3.4. Chế Độ Xem Kép (Dual-Mode)
- **[📄 Đề Thi Thí Sinh]:** Hiển thị đúng biểu mẫu đề thi in phát cho học sinh (Quốc hiệu, Sở GD&ĐT, Tên trường, khung Số báo danh 6 ô, đề bài phân câu, hình vẽ).
- **[⚖️ Barem Hướng Dẫn Chấm]:** Hiển thị bảng 2 cột truyền thống chuẩn Bộ GD&ĐT (Cột nội dung các bước lập luận chi tiết và Cột barem điểm bẻ nhỏ 0.25đ Quanta).

---

## 4. Tải Xuất Bản Tệp In Ấn

Ở thanh công cụ trên cùng của Studio:
- **Nút "PDF In":** Tải ngay tệp **PDF TeX Live gốc** (giống hệt 100% từng pixel với bản hiển thị A4 trên màn hình, font Times New Roman chuẩn Toán, không bao giờ bị vỡ font hay lệch dòng).
  - Đang ở chế độ *Đề Thi Thí Sinh* $\rightarrow$ Tải file `de_thi_...pdf`.
  - Đang ở chế độ *Barem Hướng Dẫn Chấm* $\rightarrow$ Tải file `huong_dan_cham_...pdf` (bảng 2 cột chuẩn).
- **Nút "Word":** Tải file Word `.docx` chứa công thức toán học OMML sắc nét (chỉnh sửa được trực tiếp bằng Word Equation Editor).
