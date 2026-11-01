# QUY CHẾ KỸ THUẬT & QUY TRÌNH PHÁT TRIỂN SẢN PHẨM TOÀN DIỆN
## CÔNG TY GIÁO DỤC VINH PHÁT (dethi.ttgdvinhphat.com)
*Ban hành bởi: CEO — Phê chuẩn bởi: Chủ tịch Tập đoàn AI Holding*
*Phiên bản: 1.0 (Có hiệu lực ngay lập tức trên toàn bộ các phòng ban)*

---

### PHẦN I: NGUYÊN TẮC THƯƠNG HIỆU & AN NINH CỐT LÕI (ZERO-TRUST)
1. **Quy chuẩn Định danh & Thương hiệu**:
   - Tên thương hiệu chính thức và duy nhất: **VINH PHÁT** (Trung tâm Giáo dục Vinh Phát).
   - Tuyệt đối nghiêm cấm việc sử dụng sai dấu chính tả thành *"VĨNH PHÁT"*.
2. **Quy tắc Quản trị Mã khóa & Bí mật (Secrets Management)**:
   - **Tuyệt đối không hardcode bí mật**: Mọi API key, Telegram Bot Token, Database Password, Private Key, JWT Secret đều không được lưu dưới dạng văn bản thô (plaintext) trong bất kỳ tệp mã nguồn nào.
   - **Cơ chế lưu trữ chuẩn**: Bắt buộc sử dụng biến môi trường cục bộ (`.env` được liệt kê trong `.gitignore`) và **GitHub Encrypted Secrets** (`${{ secrets.* }}`).
   - **Chốt chặn tự động**: Toàn bộ máy trạm phát triển bắt buộc cài đặt Pre-commit hook (`scripts/install_precommit_security.sh`). Bất kỳ commit nào cố gắng đẩy secret sẽ bị hủy bỏ ngay tại máy dev.

---

### PHẦN II: CHÍNH SÁCH SAO LƯU & PHỤC HỒI THẢM HỌA (BACKUP & DISASTER RECOVERY)
*(Đồng thuận kỹ thuật giữa CEO Vinh Phát & My_credential_devops_hermes)*

1. **Chu kỳ Sao lưu Dữ liệu**:
   - **Tần suất**: Tự động thực thi mỗi ngày vào lúc **02:00 AM UTC+7** thông qua `scripts/backup_to_telegram.sh` và Cronjob hệ thống.
   - **Đối tượng sao lưu**: Toàn bộ cơ sở dữ liệu PostgreSQL (`math_exam_db`) bao gồm bảng câu hỏi (`questions`), ngân hàng đề thi (`generated_exams`), ma trận (`blueprints`) và audit logs.
   - **Định dạng & Mã hóa**: Xuất bản `pg_dump` dạng nén gzip và mã hóa AES trước khi truyền tải.
2. **Lưu trữ Offsite & Giám sát**:
   - **Kênh thông báo & Lưu trữ an toàn**: Đẩy bản snapshot mã hóa trực tiếp lên kênh Telegram lưu trữ bảo mật thông qua `@Backup_dethi_ttgdvinhphat_bot` (`CHAT_ID: 6560430166`).
   - **Thời gian lưu trữ (Retention Policy)**: Duy trì tối thiểu 7 bản daily gần nhất, 4 bản weekly và 12 bản monthly.
3. **Diễn tập Phục hồi (DR Drill)**:
   - Định kỳ vào ngày đầu tiên của mỗi tháng, `Sub_Database_Provisioner` và `Worker_BlueTeam` phối hợp thử nghiệm khôi phục dữ liệu từ bản sao lưu gần nhất lên môi trường Staging/Isolated để kiểm tra tính toàn vẹn.

---

### PHẦN III: QUY TRÌNH PHÁT TRIỂN SẢN PHẨM (PDLC) & QUẢN TRỊ MÃ NGUỒN
1. **Chiến lược Phân nhánh (Git Branching Strategy)**:
   - **Nhánh `main` là Bất khả xâm phạm (Protected Branch)**: Tuyệt đối không commit trực tiếp (direct push) lên nhánh `main`.
   - Các nhánh tính năng tuân thủ định dạng:
     - `feature/<module>-<ten-tinh-nang>` (Ví dụ: `feature/core-api-hybrid-search`)
     - `fix/<module>-<ten-loi>` (Ví dụ: `fix/docx-omml-font-crash`)
     - `sec/<ma-lo-hong>` (Ví dụ: `sec/sec-001-revoke-token`)
2. **Các Chốt Chặn Kiểm Thử Tự Động (Quality & Security Gates)**:
   - **Gate 1 - Cục bộ (Local Verification)**:
     - Chạy `scripts/install_precommit_security.sh` để kích hoạt quét regex phát hiện bí mật.
     - Kiểm tra cú pháp TypeScript: `cd frontend && npm install && npx tsc --noEmit`.
     - Kiểm tra cú pháp Python: `python3 -m py_compile <cac_file_thay_doi>`.
   - **Gate 2 - GitHub Cloud Test (Automated CI - 0 VNĐ)**:
     - Chạy workflow `.github/workflows/deploy.yml` trên máy chủ ảo GitHub Cloud.
     - Vượt qua bước `🛡️ Security Gate - Hardcoded Secrets & Token Scanner`.
     - Vượt qua `Frontend Lint & Syntax Check` và `Backend Syntax & Code Quality Check` (Ruff).
   - **Gate 3 - Self-hosted Runner Deploy**:
     - Chỉ khi Gate 2 vượt qua 100%, hệ thống máy chủ Vinh Phát mới tự động kích hoạt zero-downtime container build và triển khai phiên bản mới.

---

### PHẦN IV: CƠ CHẾ ĐỐI THOẠI THEN CHỐT & THỐNG NHẤT LIÊN PHÒNG BAN (CONSENSUS PROTOCOL)
Trước khi bất kỳ Pull Request nào được phép merge vào `main`, bắt buộc phải có sự thống nhất bằng văn bản giữa các Trưởng ban và Chủ tịch:

```
[Phòng ban Đề xuất Tính năng]
          │
          ▼
[Hội đồng Kỹ thuật Liên Phòng Ban (Cross-Department Review)]
 ├── Core API (Lead_Core_API)        : Kiểm định API contract, DB migration, hiệu năng SQL/vector
 ├── AI Ingestion (Lead_AI_Ingestion): Kiểm định chất lượng prompt, OCR, trích xuất cấu trúc đề
 ├── Docx Export (Lead_Docx_Export)  : Kiểm định layout Word A4, công thức OMML, cờ an toàn LaTeX
 └── Frontend (Lead_Frontend_Studio) : Kiểm định trải nghiệm giáo viên, split-view preview
          │
          ▼
[Chốt chặn An Ninh (Security Sign-off)]
 ├── Red Team (Worker_RedTeam)       : Thử nghiệm tấn công, quét lỗ hổng injection / privilege escalation
 └── Blue Team (Worker_BlueTeam)     : Rà soát secret scanning, HTTP headers, CSP, CORS
          │
          ▼
[Phê duyệt Cấp cao (Executive Gate)]
 ├── CEO (dethi.ttgdvinhphat.com)    : Đánh giá tác động hệ thống & nghiệm thu kỹ thuật
 └── Chủ tịch Tập đoàn (Chairman)   : Phê chuẩn quyết định cuối cùng trước khi Deploy Production
```

1. **Cam kết Phản biện Kỹ thuật**: Các Trưởng ban có quyền và nghĩa vụ từ chối (Block PR) nếu giải pháp vi phạm kiến trúc, thiếu an toàn hoặc làm giảm trải nghiệm người dùng.
2. **Quy định Phê duyệt Hạ tầng (`WAITING_CHAIRMAN_APPROVAL`)**: Mọi thao tác cấp phát tài nguyên đám mây tốn phí, thay đổi tên miền, cấu hình DNS hay can thiệp cấu trúc CSDL chính thức bắt buộc phải gửi ticket tới `My_credential_devops_hermes` và chỉ được triển khai khi Chủ tịch ký duyệt.
