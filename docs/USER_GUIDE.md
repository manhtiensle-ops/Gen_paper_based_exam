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

## 3. Không Gian Làm Việc "Exam Studio" (Xưởng Soạn Đề & Barem)

Vào tab **"Exam Studio (Soạn & Barem 0.25đ)"** hoặc bấm nút **"Mở Exam Studio ➔"** từ bảng tổ hợp đề thi:

### 3.1. Chế Độ Xem Kép (Dual-Mode)
- **[📄 Đề Thi Thí Sinh]:** Hiển thị đúng biểu mẫu đề thi in phát cho học sinh (gồm Quốc hiệu, Sở GD&ĐT, Tên trường, khung Số báo danh 6 ô, đề bài phân câu, hình vẽ).
- **[⚖️ Barem Hướng Dẫn Chấm]:** Hiển thị bảng 2 cột truyền thống chuẩn Bộ GD&ĐT (Cột nội dung các bước lập luận chi tiết và Cột barem điểm bẻ nhỏ 0.25đ).

### 3.2. Trợ Lý AI Dàn Trang & Sửa Đề Đa Phương Thức (Multimodal Co-pilot)
Nằm ở cột bên trái:
- **Dán ảnh chụp màn hình trực tiếp (`Ctrl + V`):**
  - Khi xem bản in PDF bên phải, bạn thấy chỗ nào cần sửa hoặc muốn đổi bố cục:
  - Dùng công cụ Snipping Tool chụp màn hình, khoanh tròn hoặc vẽ mũi tên vào chỗ cần sửa $\rightarrow$ Bấm `Ctrl + V` vào ô chat của AI.
  - Nhập lệnh (ví dụ: *"Sửa biểu thức trong vòng tròn đỏ thành...", "Đổi bố cục bài hình này thành 2 cột"*).
  - Bấm gửi $\rightarrow$ Gemini Flash sẽ quan sát vết khoanh tròn trên ảnh, tự động sửa mã đề thi và biên dịch lại bản in tức thì.
- **Các nút lệnh dàn trang nhanh:**
  - `⚡ Dồn vừa 1 trang A4`: Tự động co giãn lề và khoảng cách dòng để đề thi nằm gọn trong 1 trang giấy.
  - `📐 Bài hình 2 cột`: Đặt đề bài và câu hỏi bên trái, đưa hình vẽ sang bên phải.
  - `📏 Thu hẹp lề 1.4cm`: Tối ưu diện tích in ấn.
  - `🔤 Cỡ chữ 12pt`: Đặt cỡ chữ chuẩn theo quy định của Sở.

### 3.3. Tinh Chỉnh Bằng Tay & Barem Điểm 0.25đ
- **Tab Biên tập câu hỏi:**
  - Bấm nút mũi tên lên / xuống để hoán đổi vị trí các câu hỏi (tự động cập nhật lại nhãn *Câu 1, Câu 2...*).
  - Bấm nút `+` / `-` trên các dòng barem để tăng/giảm $0.25$ điểm cho từng bước chấm thi.
- **Tab Bố cục (Sliders):**
  - Kéo thanh trượt để thay đổi cỡ chữ, giãn dòng và 4 lề trang in A4.

---

## 4. Tải Xuất Bản Tệp In Ấn

Ở thanh công cụ trên cùng của Studio:
- **Nút "PDF In":** Tải ngay tệp **PDF TeX Live gốc** (giống hệt 100% từng pixel với bản hiển thị A4 trên màn hình, font Times New Roman chuẩn Toán, không bao giờ bị vỡ font hay lệch dòng).
  - Đang ở chế độ *Đề Thi Thí Sinh* $\rightarrow$ Tải file `de_thi_...pdf`.
  - Đang ở chế độ *Barem Hướng Dẫn Chấm* $\rightarrow$ Tải file `huong_dan_cham_...pdf` (bảng 2 cột chuẩn).
- **Nút "Word":** Tải file Word `.docx` chứa công thức toán học OMML sắc nét (chỉnh sửa được trực tiếp bằng Word Equation Editor).
