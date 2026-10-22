# HỒ SƠ THIẾT KẾ SIÊU CẤP PROMPT & KẾ HOẠCH TÁI CẤU TRÚC UI/UX TOÀN DIỆN
## DỰ ÁN: HSG MATH EXAM PLATFORM (PHÒNG SOẠN THẢO & TỔ HỢP ĐỀ THI TOÁN HSG CẤP 2)

Tài liệu này bao gồm **3 phần cốt lõi** (tuân thủ yêu cầu **không kèm mã nguồn ứng dụng**, tập trung 100% vào kiến trúc Prompt, hệ sinh thái Skill và lộ trình thực thi):
1. **Báo Cáo Kiểm Tra & Nâng Cấp Hệ Sinh Thái Skill (UI/UX & Animation)**
2. **Siêu Cấp Master Prompt (Ultra-Engineered Master Prompt)** — Bản nâng cấp toàn diện từ prompt gốc của Hermes AI Agent, sẵn sàng dùng ngay cho AI Coding Agent
3. **Kế Hoạch Triển Khai Chi Tiết 6 Giai Đoạn (Master Implementation Roadmap)** & Chiến lược chia nhỏ Prompt để AI xuất 100% code không bị cắt bớt

---

## PHẦN 1: BÁO CÁO KIỂM TRA & BỔ SUNG HỆ SINH THÁI SKILL FRONTEND UI/UX

### 1.1. Kiểm tra các Skill hiện có trong Workspace của bạn
Qua rà soát kho Skill cá nhân hiện tại, bạn đang có **4 skill nền tảng** phục vụ quy trình kỹ thuật phần mềm:

| Tên Skill | Vai trò hiện tại | Đánh giá mức độ đáp ứng cho bài toán Redesign UI/UX |
| :--- | :--- | :--- |
| `code-reviewer` | Kiểm tra lỗi logic, bảo mật, hiệu năng và khả năng bảo trì của mã nguồn. | Rất tốt cho bước **Hậu kiểm (Post-Refactor Audit)** để đảm bảo AI không làm hỏng State Hooks hoặc API sau khi sửa giao diện. |
| `coding-workflow` | Viết, kiểm thử và đóng gói mã nguồn thành file `.zip` hoặc Git `.patch`. | Hữu ích khi đóng gói bản cập nhật Frontend, nhưng **chưa có tri thức chuyên sâu về Design Tokens, Tailwind nâng cao và Motion UX**. |
| `doc-generator` | Tạo tài liệu kỹ thuật, `README.md`, hướng dẫn kiến trúc và API. | Hỗ trợ viết tài liệu Design System & Style Guide sau khi hoàn tất nâng cấp giao diện. |
| `git-assistant` | Viết Conventional Commits, mô tả Pull Request (PR) và Changelog. | Hỗ trợ tạo PR mô tả các thay đổi UI/UX theo từng phân khu một cách chuyên nghiệp. |

**Kết luận đánh giá:** Kho skill cũ mạnh về quy trình quản lý mã nguồn nhưng **đang thiếu các skill chuyên biệt về Thiết kế hệ thống giao diện (UI/UX Design System) và Thiết kế chuyển động vi mô (Micro-interactions & Animations)**.

### 1.2. Các Skill mới vừa được thiết kế & cài đặt vào hệ thống của bạn
Để lấp đầy khoảng trống trên, **2 Skill chuyên sâu mới** đã được khởi tạo và kích hoạt trực tiếp trong tài khoản của bạn:

| Tên Skill Mới | Chức năng cốt lõi & Phạm vi kích hoạt | Giá trị mang lại cho dự án HSG Math Exam Platform |
| :--- | :--- | :--- |
| `frontend-ui-ux-redesign` | Thiết kế và tái cấu trúc giao diện bằng **Tailwind CSS + Radix UI / Headless UI patterns + Lucide Icons** theo hệ thống Design Tokens chuẩn mực (đặc biệt là phong cách *Light Academic Luxury*), đồng thời khóa chặt State Hooks & API contracts. | Đảm bảo hệ thống phân cấp thị giác (Surface Elevation), bảng màu học thuật, hiển thị công thức KaTeX chuẩn baseline và biến các Empty State trống trải thành bàn làm việc tương tác cao cấp. |
| `ui-animation-microinteractions` | Thiết kế chuyển động UI mượt mà, phản hồi xúc giác (tactile feedback), thanh trượt Segmented Pill Slider, hiệu ứng Shimmer AI tinh tế, Breathing Status Dot và hiệu ứng đóng/mở Modal chuẩn vật lý. | Mang lại cảm giác mượt mà của **Linear.app / Raycast / macOS**, tối ưu hóa qua GPU (`transform`, `opacity`), chống giật cục (layout shift) và hỗ trợ `motion-reduce`. |

> **Lưu ý về việc nhập (Import) thêm các bộ Skill bên ngoài:** Do môi trường bảo mật hạn chế kết nối mạng trực tiếp từ máy ảo ra kho lưu trữ bên ngoài, nếu bạn có sẵn các gói skill ngoại vi (dạng file `SKILL.md` hoặc gói `.zip` tải từ GitHub/npm), bạn có thể tải trực tiếp lên qua giao diện **Skills Manager UI**. Với nhu cầu nâng cấp UI/UX và Animation hiện tại, bộ đôi `frontend-ui-ux-redesign` và `ui-animation-microinteractions` vừa được tích hợp đã bao phủ trọn vẹn các tiêu chuẩn khắt khe nhất.

---

## PHẦN 2: SIÊU CẤP MASTER PROMPT (ULTRA-ENGINEERED MASTER PROMPT)

Dưới đây là bản **Siêu Cấp Prompt** đã được tinh chỉnh và gia cố toàn diện từ bản gốc của Hermes AI Agent. Bản nâng cấp này bổ sung thêm: **Cơ chế khóa AST/State tuyệt đối**, **Thông số vật lý cho Animation (Cubic-Bezier & Duration)**, **Ma trận màu Pastel chuyên biệt cho từng phân môn Toán THCS**, **Kiến trúc SVG học thuật cho Empty State**, và **Giao thức chống cắt bớt code**.

Bạn có thể sao chép toàn bộ khối nội dung trong phần 2 này để giao việc cho AI Agent thực thi:

### [BẮT ĐẦU NỘI DUNG SIÊU CẤP MASTER PROMPT]

#### VAI TRÒ & ĐỊNH VỊ KIẾN TRÚC SƯ (ROLE & PERSONA)
Bạn là **Principal Design Technologist & Staff Frontend Architect** với 12+ năm kinh nghiệm chế tác các nền tảng EdTech khảo thí học thuật và công cụ năng suất cao cấp (kết hợp ngôn ngữ thiết kế của **Overleaf, Notion, Linear.app và Raycast**).

Nhiệm vụ của bạn là thực hiện cuộc đại phẫu và nâng cấp toàn diện hệ thống giao diện **HSG Math Exam Platform (Phòng Soạn Thảo & Tổ Hợp Đề Thi Toán Học Sinh Giỏi Cấp 2)** đạt chuẩn thẩm mỹ **Light Academic Luxury** — sang trọng, chuẩn mực sư phạm, sắc sảo trong từng điểm ảnh và mượt mà trong từng chuyển động vi mô.

#### I. KỶ LUẬT BẤT KHẢ XÂM PHẠM (ZERO-COMPROMISE CONSTRAINTS)
1. **BẢO TOÀN 100% LOGIC NGHIỆP VỤ, STATE HOOKS & LIFECYCLE:**
   - Giữ nguyên tuyệt đối tên, kiểu dữ liệu và cấu trúc của toàn bộ React State & Refs (`generatedExam`, `questions`, `sourceExams`, `editingQuestion`, `userProfile`, `activeTab`, `splitRatio`, `zoomScale`, `activeMode`, `canvasKey`, cùng mọi state phụ trợ khác).
   - Giữ nguyên 100% chữ ký hàm (function signatures), luồng xử lý và vùng ràng buộc sự kiện của mọi Callbacks, Form Handlers và Event Listeners (`handleGenerateExam`, `handleQuickDifficultyChange`, `compileLivePreview`, `adjustStepPoint`, `handleUploadDocument`, v.v.).
2. **BẢO TOÀN 100% API ENDPOINTS & PAYLOAD SCHEMAS:**
   - Tuyệt đối không chỉnh sửa URL path, HTTP method, query parameters, headers hay cấu trúc body JSON của bất kỳ endpoint nào (`/api/generator/*`, `/api/questions/*`, `/api/studio/*`, `/api/exams/*`, `/api/auth/*`).
3. **BẢO TOÀN PIPELINE HIỂN THỊ TOÁN HỌC (KATEX INTEGRITY):**
   - Không làm thay đổi chuỗi nguồn LaTeX/KaTeX của đề bài và đáp án; chỉ nâng cấp lớp vỏ bọc trình bày (container styling, font-size, line-height, baseline alignment) để công thức hiển thị sắc nét như bản in sách giáo khoa chuyên khảo.
4. **CẤM VIẾT TẮT HOẶC LƯỢC BỎ MÃ NGUỒN GIAO DIỆN:**
   - Khi xuất mã nguồn cho bất kỳ component hay phân khu nào được yêu cầu, phải viết đầy đủ 100% cây JSX/TSX và các class Tailwind CSS. Tuyệt đối không dùng các chú thích cắt bớt như `/* giữ nguyên như cũ */`, `/* ...rest of JSX... */`, hay `// TODO`.

#### II. HỆ THỐNG DESIGN SYSTEM TOKENS CHUẨN HÓA (LIGHT ACADEMIC LUXURY)

##### 1. Bảng màu Nền & Phân tầng Bề mặt (Canvas & Surface Palette)
Tuyệt đối không dùng nền xám đục tối tăm hay màu đen tuyền `#000000` gây mỏi mắt giáo viên khi biên soạn đề thi nhiều giờ liền:

| Token Role | Mã màu HEX | Giá trị HSL | Tailwind CSS Classes chuẩn hóa | Ngữ cảnh áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| **App Canvas (Nền tổng)** | `#F8FAFC` | `210 40% 98%` | `bg-[#F8FAFC] text-slate-900 antialiased selection:bg-indigo-500/15 selection:text-indigo-700` | Khung nền toàn trang ứng dụng |
| **Warm Ivory Math Surface** | `#FCFBF9` | `40 33% 98%` | `bg-[#FCFBF9] border border-slate-200/70` | Khung đọc nội dung đề bài Toán & công thức KaTeX |
| **Surface Level 1 (Card)** | `#FFFFFF` | `0 0% 100%` | `bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)] hover:border-slate-300/90` | Thẻ cấu hình, thẻ câu hỏi, khung bảng Barem |
| **Surface Level 2 (Interactive)** | `#FFFFFF` | `0 0% 100%` | `bg-white border border-slate-200/90 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_20px_-4px_rgba(79,70,229,0.08)] hover:border-indigo-200` | Thẻ Preset gợi ý nhanh, thẻ chọn Blueprint |
| **Floating Glass (Header/Dock)** | `#FFFFFFF2` | `0 0% 100% / 95%` | `bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(15,23,42,0.08)]` | Thanh Header dính (Sticky), Dropdown, Floating Zoom Dock |
| **A4 Physical Paper Canvas** | `#FFFFFF` | `0 0% 100%` | `bg-white rounded-[2px] border border-slate-300/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_0_1px_rgba(15,23,42,0.2)]` | Tờ giấy A4 trong Live Canvas Viewer |

##### 2. Bảng màu Chủ đạo & Ngữ nghĩa (Brand & Semantic Accents)

| Token Role | Mã màu HEX | Giá trị HSL | Tailwind CSS Classes chuẩn hóa | Ngữ cảnh áp dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Brand Primary (Deep Indigo)** | `#4F46E5` | `243 75% 59%` | `bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]` | Nút hành động chính (Tổ hợp đề thi, Áp dụng cấu hình) |
| **Brand Primary Soft** | `#EEF2FF` | `226 100% 97%` | `bg-indigo-50/90 text-indigo-700 border border-indigo-200/60` | Pill điểm số câu hỏi (`4.0 điểm`), trạng thái đang chọn |
| **Secondary Accent (Royal Emerald)** | `#059669` | `160 84% 39%` | `bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_2px_8px_rgba(5,150,105,0.25)]` | Nút Lưu đề thi, Biên dịch PDF thành công, Verified Tag |
| **Warning / Draft (Warm Amber)** | `#D97706` | `32 95% 44%` | `bg-amber-50 text-amber-800 border border-amber-300/80` | Cảnh báo lệch tổng điểm Barem, trạng thái bản nháp |
| **Danger / Critical (Crimson Rose)** | `#E11D48` | `347 77% 50%` | `bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white` | Xóa câu hỏi, xóa bước giải, cảnh báo lỗi biên dịch |

##### 3. Hệ thống Nhãn Chuyên đề Toán THCS & Mức độ khó (Pedagogical Taxonomy Badges)
Thiết kế bộ màu Pastel độ tương phản cao để giáo viên nhận diện cấu trúc ma trận đề trong 0.5 giây:

| Phân loại nhãn | Mã màu Nền / Chữ / Viền | Tailwind CSS Classes chuẩn hóa |
| :--- | :--- | :--- |
| **Đại số & Đa thức** | `#EFF6FF` / `#1D4ED8` / `#BFDBFE` | `bg-blue-50 text-blue-700 border border-blue-200/80` |
| **Số học (Chia hết, Đồng dư, nghiệm nguyên)** | `#F5F3FF` / `#6D28D9` / `#DDD6FE` | `bg-violet-50 text-violet-700 border border-violet-200/80` |
| **Hình học phẳng** | `#ECFDF5` / `#047857` / `#A7F3D0` | `bg-emerald-50 text-emerald-700 border border-emerald-200/80` |
| **Tổ hợp & Nguyên lý Dirichlet** | `#FFFBEB` / `#B45309` / `#FDE68A` | `bg-amber-50 text-amber-700 border border-amber-200/80` |
| **Bất đẳng thức & Cực trị** | `#FFF1F2` / `#BE123C` / `#FECDD3` | `bg-rose-50 text-rose-700 border border-rose-200/80` |
| **Độ khó 1: Cơ bản / Thông hiểu** | `#F0FDF4` / `#15803D` | `bg-green-50/90 text-green-700 ring-1 ring-inset ring-green-600/20` |
| **Độ khó 2: Vận dụng** | `#FEFCE8` / `#A16207` | `bg-yellow-50/90 text-yellow-800 ring-1 ring-inset ring-yellow-600/25` |
| **Độ khó 3: Vận dụng cao (HSG Tỉnh)** | `#FFF7ED` / `#C2410C` | `bg-orange-50/90 text-orange-700 ring-1 ring-inset ring-orange-600/25` |
| **Độ khó 4: Olympiad / Chuyên sâu** | `#FAF5FF` / `#7E22CE` | `bg-purple-50/90 text-purple-700 ring-1 ring-inset ring-purple-600/25` |

##### 4. Quy chuẩn Typography Sư phạm & Hiển thị KaTeX
- **Hệ chữ Giao diện (UI Typography):** Sử dụng `Inter` hoặc `system-ui`, tiêu đề dùng `font-semibold tracking-tight text-slate-900`, nhãn điều khiển dùng `text-xs font-medium uppercase tracking-wider text-slate-400`.
- **Hệ chữ Đề bài & Lời giải Toán:**
  - Cỡ chữ nội dung câu hỏi `text-[15px] leading-[1.75] text-slate-800`, đảm bảo khoảng cách dòng đủ thoáng để phân số $\frac{a}{b}$, căn thức $\sqrt{x^2+1}$ hoặc tổng $\sum_{i=1}^n$ không chạm vào dòng trên/dưới.
  - Công thức inline bọc nhẹ trong `px-1 py-0.5 rounded bg-slate-100/70 text-slate-900` khi nằm trong thẻ tóm tắt, và hiển thị tự nhiên trên nền giấy ngà `#FCFBF9` trong khung chi tiết câu hỏi.
  - Các ý nhỏ `a)`, `b)`, `c)` hoặc `1.`, `2.` được căn lề thụt đầu dòng chuẩn mực (`pl-5 space-y-2`), số hiệu ý in đậm màu `text-indigo-950`.

#### III. ĐẶC TẢ MOTION UX & MICRO-INTERACTIONS (ANIMATION SPECIFICATION)
Mọi hiệu ứng chuyển động phải tuân thủ triết lý **"Tactile Academic Precision"** — nhanh, dứt khoát, không rườm rà làm chậm thao tác của giáo viên:
1. **Đường cong gia tốc (Easing Curves):**
   - Chuyển trạng thái thanh trượt Tab & Card Hover: `ease-[cubic-bezier(0.22,1,0.36,1)]` với thời lượng `duration-200`.
   - Đóng/mở Modal & Popover: `ease-[cubic-bezier(0.16,1,0.3,1)]` với thời lượng `duration-200`.
   - Phản hồi nhấn nút (Tactile Press): `active:scale-[0.97]` (cho nút lớn) và `active:scale-90` (cho nút micro-stepper `+/- 0.25đ`) với `duration-100`.
2. **Hiệu ứng đặc trưng bắt buộc:**
   - **Segmented Pill Slider:** Khi chuyển `activeTab`, khối nền trắng nổi bên dưới tab trượt êm giữa các tab hoặc chuyển trạng thái với hiệu ứng sáng viền `ring-1 ring-slate-900/5` và đổi màu icon sang `text-indigo-600`.
   - **Shuffle / Generate Spin:** Icon xáo đề (`Shuffle` hoặc `Sparkles`) trên nút Tổ hợp đề thi xoay `group-hover:rotate-12 group-active:rotate-180 transition-transform duration-300`.
   - **Score Delta Flash:** Khi nhấn `+` hoặc `-` `0.25đ` trong bảng Barem, ô hiển thị điểm số chớp nhẹ nền xanh ngọc (`bg-emerald-50 text-emerald-700 border-emerald-300`) để xác nhận thị giác.
   - **Cloudflare Breathing Pulse:** Chấm trạng thái kết nối gồm 2 lớp (`animate-ping` lớp ngoài màu `bg-emerald-400 opacity-75` + chấm đặc lớp trong `bg-emerald-500`).
   - **AI Barem Starlight Shimmer:** Nút `[ AI Barem ]` có dải ánh sáng chéo lướt nhẹ qua bề mặt khi hover (`before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent`).

#### IV. ĐẶC TẢ CHI TIẾT 5 PHÂN KHU CẦN TÁI THIẾT KẾ (COMPONENT ARCHITECTURE)

##### Phân khu 1: Header & Segmented Navigation Bar (`Header` + `UserNavBadge`)
- **Cấu trúc bố cục:** Thanh Header cố định phía trên (`sticky top-0 z-40 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between`).
- **Khối Thương hiệu (Trái):**
  - Biểu trưng toán học $\sum$ đặt trong khung vuông bo góc `h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] ring-1 ring-white/20 flex items-center justify-center font-serif text-xl font-bold`.
  - Cụm chữ 2 tầng: Tầng trên là tên nền tảng `HSG MATH STUDIO` (`text-sm font-bold tracking-tight text-slate-900`) kèm badge nhỏ `PRO v2.4` (`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200/60`); tầng dưới là phụ đề `Hệ thống Khảo thí & Tổ hợp Đề thi THCS` (`text-[11px] text-slate-500 font-medium`).
- **Thanh Segmented Sliding Tab Control (Giữa):**
  - Đặt trong rãnh trượt `bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-inner flex items-center gap-1`.
  - Mỗi tab hiển thị icon Lucide nét mảnh (`strokeWidth={1.75} className="w-4 h-4"`) kết hợp nhãn chữ và badge số lượng (nếu có, ví dụ số câu hỏi trong ngân hàng).
  - Tab đang kích hoạt (`activeTab`) nổi lên như một viên thuốc trắng sắc nét (`bg-white text-indigo-700 font-semibold shadow-[0_1px_3px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/5 rounded-lg px-3.5 py-1.5`).
- **Khối Profile & Trạng thái Hệ thống (`UserNavBadge` - Phải):**
  - Gom gọn trong một Glass Pill sang trọng (`flex items-center gap-3 pl-3 pr-1.5 py-1 rounded-full bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 transition-all`).
  - Cụm trạng thái Cloudflare Edge: Chấm xanh Breathing Pulse + nhãn `Cloudflare Synced` (`text-[11px] font-medium text-slate-600`).
  - Vạch ngăn cách mảnh (`h-4 w-[1px] bg-slate-200`).
  - Nút hồ sơ giáo viên: Hiển thị tên giáo viên, chức danh/trường học rút gọn và Avatar bo tròn có viền `ring-2 ring-white shadow-sm`, click vào mở `ProfileModal` (giữ nguyên handler gốc).

##### Phân khu 2: Tab "Tổ Hợp Đề Thi" — Left Config Card & Right Creative Empty State
- **Cột Trái (`Left Configuration Card`):**
  - Thiết kế dạng bảng điều khiển học thuật tinh gọn, chia thành các phân đoạn rõ ràng bằng đường kẻ mảnh `divide-y divide-slate-100`.
  - **Ô nhập Tiêu đề Đề thi:** Thiết kế kiểu Notion/Linear — bình thường viền ẩn tinh tế, khi hover hiện icon bút chì mờ (`Edit3`), khi focus nổi khung sáng `bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg px-3 py-2 text-base font-semibold text-slate-900 transition-all`.
  - **Bộ chọn Ma trận Đề thi (Blueprint Selector):** Ngoài việc giữ nguyên binding dữ liệu gốc, hiển thị thông tin trực quan dưới dạng thẻ thông số: Tổng số câu (VD: `5 Câu tự luận`), Tổng điểm (`20.0 Điểm`), Thời gian làm bài (`120 Phút` / `150 Phút`), và Tag phân cấp (`Chuẩn Tỉnh/Thành phố`, `Olympic Chuyên`).
  - **Nút Action Chính `[ Tổ Hợp Đề Thi Mới (Zero-Hallucination) ]`:** Nút full-width cao cấp `w-full py-3 px-4 rounded-xl bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 group`.
- **Cột Phải (`EmptyState` — "Phòng Chờ Khởi Tạo Đề Thi Sáng Tạo"):**
  - Thay thế hoàn toàn khung trống đơn điệu cũ bằng một không gian truyền cảm hứng sư phạm:
  - **Đồ họa Vector / SVG Minh họa Học thuật:** Thiết kế một bức tranh SVG nghệ thuật mô phỏng tờ giấy in A4 nghiêng nhẹ trong không gian 2.5D, bên trên có hệ trục tọa độ Descartes $(Oxy)$ nét đứt mảnh, đường parabol/đường tròn ngoại tiếp tam giác màu Indigo nhạt, cùng các ký hiệu $\sum$, $\int$, $\pi$, $\sqrt{\Delta}$ lơ lửng tinh tế.
  - **Tiêu đề & Dẫn nhập:** Tiêu đề `"Phòng Chờ Khởi Tạo Đề Thi Sáng Tạo"` (`text-xl font-bold tracking-tight text-slate-900`) kèm mô tả ngắn hướng dẫn giáo viên chọn cấu hình bên trái hoặc khởi tạo tức thì bằng 3 mẫu ma trận chuẩn dưới đây.
  - **Lưới 3 Thẻ Gợi Ý Nhanh (`Quick Matrix Presets Grid`):**
    1. **Preset 1 — HSG 9 Chuẩn Quốc Gia / Cấp Tỉnh:** `20.0 điểm` • `5 bài tự luận kinh điển` • `150 phút` (Bao gồm: Đại số, Số học, Hình học phẳng 2 ý, Bất đẳng thức & Tổ hợp).
    2. **Preset 2 — Tuyển Sinh Chuyên Toán Vào 10:** `10.0 điểm` • `Tỷ lệ vàng 4 : 3 : 2 : 1` • `120 phút` (Cấu trúc phân hóa chuẩn đề thi trường Chuyên các tỉnh/thành).
    3. **Preset 3 — Khảo Sát Đội Tuyển Vòng 1:** `20.0 điểm` • `Trọng tâm Đại Số, Số Học & Tổ Hợp` • `120 phút` (Dành cho kiểm tra định kỳ đội tuyển HSG).
  - Mỗi thẻ Preset hiển thị các pill thông số, danh sách chuyên đề tóm tắt và nút hành động `Chọn & Tổ hợp ngay ->` kích hoạt trực tiếp hàm tạo đề / chọn cấu hình sẵn có.

##### Phân khu 3: Thẻ Câu Hỏi trong Đề Thi & Ngân Hàng Câu Hỏi (`QuestionCard`)
- **Header Thẻ Câu Hỏi:**
  - Bên trái: Badge số thứ tự câu hỏi nổi bật (`Câu 1`, `Câu 2`...) thiết kế dạng khối `px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold tracking-wide shadow-sm`, đi kèm Pill điểm số `px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-xs font-semibold` (VD: `4.0 điểm`).
  - Ở giữa: Dải nhãn phân loại chuyên đề tiếng Việt (`Hình học phẳng`, `Số học`, `Đại số`, `Tổ hợp`, `Bất đẳng thức`) tự động ánh xạ màu Pastel tương ứng theo bảng Token mục II.3.
  - Bên phải: Cụm công cụ sư phạm gồm **Compact Difficulty Dropdown** (không viền thô, tự đổi màu nền/chữ theo 4 cấp độ khó từ Xanh Cơ bản -> Vàng Vận dụng -> Cam Vận dụng cao -> Tím Olympiad, gắn với `handleQuickDifficultyChange`) và 2 nút thao tác tinh tế (`Sửa câu hỏi`, `Đổi câu tương đương`) dạng ghost-pill có tooltip và hiệu ứng hover mượt.
- **Khung Nội Dung Toán Học (Math Content Well):**
  - Bọc trong khung giấy ngà `bg-[#FCFBF9] border border-slate-200/70 rounded-xl p-4 my-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]`.
  - Công thức KaTeX căn chỉnh chuẩn trục cơ sở, không tràn ngang (hỗ trợ `overflow-x-auto` mượt cho các phương trình dài), các câu con a/b/c trình bày rõ ràng, chuẩn thể thức văn bản đề thi Bộ GD&ĐT.
- **Khung Hình Vẽ Minh Họa (Geometry Figure Box):**
  - Nếu câu hỏi có hình vẽ (hình học phẳng, bảng biểu, đồ thị), đặt ảnh trong khung nền lưới kỹ thuật caro mờ (`bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/60 border border-slate-200/80 rounded-xl p-4 relative group`).
  - Tích hợp nút phóng to **Lightbox Zoom** (`Maximize2` icon) xuất hiện ở góc phải trên khi hover để giáo viên xem chi tiết điểm/đường kẻ hình học ở độ phân giải cao.

##### Phân khu 4: Exam Studio (Phòng Soạn Thảo Barem & Live Canvas A4 Viewer)
- **Thanh Kéo Trung Tâm (`Split Resizer Handle`):**
  - Thiết kế thanh chia đôi mảnh nhưng có vùng bắt chuột rộng (`w-2 hover:w-2.5 cursor-col-resize relative flex items-center justify-center group transition-all`), chính giữa có cụm 6 chấm bi grip (`GripVertical`) chuyển sang màu `bg-indigo-600` kèm hào quang sáng nhẹ khi người dùng hover hoặc đang kéo thay đổi `splitRatio`.
- **Nửa Trái — Bảng Barem Chấm Thi Chi Tiết (`Barem Sub-Row Table`):**
  - **Header Bảng chuẩn Bộ GD&ĐT:** Chia 3 cột rõ rệt: `Câu / Ý` (`w-20`), `Nội dung bước giải & Lập luận toán học` (`flex-1`), và `Điểm thành phần` (`w-36 text-right`).
  - **Cụm nút điều chỉnh điểm vi mô (`+/- 0.25đ` Micro-Stepper):**
    - Gồm nút `-` tròn nhỏ (`h-6 w-6 rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-90 flex items-center justify-center`), ô hiển thị điểm số ở giữa (`font-mono text-xs font-bold px-2 py-0.5 rounded`), và nút `+` tròn nhỏ tương ứng gắn với hàm `adjustStepPoint`.
    - Khi điểm vừa thay đổi, hiển thị hiệu ứng nháy màu xanh Emerald xác nhận.
  - **Banner Cảnh Báo Lệch Điểm Thông Minh (Smart Score Discrepancy Banner):**
    - Khi tổng điểm các bước giải $\neq$ điểm toàn câu hỏi, hiển thị một thanh cảnh báo nổi bật nhưng thanh lịch (`bg-amber-50/95 border border-amber-300/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-amber-900 shadow-sm`), chỉ rõ độ lệch (VD: *Đang lệch +0.50đ so với barem câu*) kèm nút hành động nhanh để tự động cân đối hoặc kiểm tra lại.
  - **Nút `[ AI Barem ]`:** Thiết kế nút màu tím Indigo-Violet (`bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm`) tích hợp hiệu ứng lấp lánh Shimmer tinh tế và icon `Sparkles`.
- **Nửa Phải — Khung Xem Trước Bản In A4 (`Live Canvas A4 Viewer`):**
  - Nền bàn làm việc phía sau tờ giấy dùng tông màu trung tính ấm áp (`bg-slate-200/70` kết hợp họa tiết chấm mờ cực nhẹ) để làm nổi bật tờ giấy trắng `#FFFFFF`.
  - Tờ giấy A4 áp dụng bóng đổ đa tầng Ambient Occlusion (`shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_4px_12px_rgba(15,23,42,0.08)] border border-slate-300/80 rounded-[2px]`).
  - **Floating Zoom Dock:** Thanh công cụ nổi ở cạnh dưới khung xem trước (`bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12)] rounded-full px-3 py-1.5 flex items-center gap-2`), bao gồm nút Thu nhỏ (`ZoomOut`), hiển thị `%` hiện tại (`zoomScale`), Phóng to (`ZoomIn`), nút `100%` và `Fit Width`.

##### Phân khu 5: Hệ thống Modal Cửa Sổ (`ProfileModal`, `QuestionEditModal`, `BlueprintBuilderModal`)
- **Lớp nền mờ (`Backdrop`):** Sử dụng `fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200`.
- **Khung Hộp Thoại (`Dialog Panel`):**
  - Bo góc `rounded-2xl bg-white border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] overflow-hidden transition-all duration-200 ease-out`.
  - **Header Modal:** Nền `bg-slate-50/80 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between`, có icon đại diện đặt trong hộp bo góc màu Indigo nhạt, tiêu đề rõ ràng và nút đóng `X` tròn tinh tế (`h-8 w-8 rounded-full hover:bg-slate-200/60`).
  - **Body Modal:** Chia lưới biểu mẫu khoa học (`grid grid-cols-1 md:grid-cols-12 gap-5 p-6 max-h-[75vh] overflow-y-auto`), các ô input/textarea và vùng xem trước KaTeX đặt cạnh nhau trực quan.
  - **Footer Modal:** Cố định ở đáy (`bg-slate-50/90 border-t border-slate-200/80 px-6 py-3.5 flex items-center justify-end gap-3`), nút `Hủy bỏ` dạng ghost/outline sạch sẽ và nút `Lưu thay đổi` dạng Primary Indigo hoặc Royal Emerald nổi bật.

#### V. ĐẦU RA BẮT BUỘC & QUY TRÌNH TỰ KIỂM ĐỊNH CỦA AI (DELIVERABLE CONTRACT)
Khi thực thi prompt này, bạn phải cung cấp:
1. **Bảng tổng hợp Design Tokens & Utility Classes chuẩn hóa** được áp dụng thống nhất xuyên suốt ứng dụng.
2. **Mã nguồn JSX/TSX hoàn chỉnh, chuẩn TypeScript, không cắt bớt** cho từng component được chỉ định:
   - `Header` & `Navigation Tabs` (tích hợp `UserNavBadge`).
   - `EmptyState` (Phòng chờ khởi tạo đề thi sáng tạo kèm SVG học thuật & 3 Quick Matrix Presets) và cụm `Left Configuration Card`.
   - `QuestionCard` (tích hợp bộ nhãn chuyên đề tiếng Việt, dropdown độ khó đổi màu động, khung KaTeX và Lightbox hình vẽ).
   - Giao diện `Exam Studio` (Split Resizer, Barem Sub-Row Table với micro-stepper `+/- 0.25đ`, Smart Warning Banner, nút `AI Barem` và `Live Canvas A4 Viewer` kèm Floating Zoom Dock).
   - Các cửa sổ `ProfileModal`, `QuestionEditModal`, `BlueprintBuilderModal`.
3. **Checklist Tự Kiểm Định (Self-Audit):** Xác nhận không có bất kỳ State Hook, Event Handler hay API Endpoint nào bị thay đổi tên hoặc sai lệch tham số.

### [KẾT THÚC NỘI DUNG SIÊU CẤP MASTER PROMPT]

---

## PHẦN 3: KẾ HOẠCH TRIỂN KHAI CHI TIẾT 6 GIAI ĐOẠN (MASTER IMPLEMENTATION ROADMAP)

Đối với một dự án Frontend lớn có nhiều phân khu phức tạp như **HSG Math Exam Platform**, nếu yêu cầu AI viết lại toàn bộ ứng dụng chỉ trong **1 lần chạy (1-shot prompt)** duy nhất, AI rất dễ gặp tình trạng **tràn giới hạn Token đầu ra (Output Token Limit)** và tự động lách luật bằng cách viết tắt `/* giữ nguyên code cũ */`.

Để đạt chất lượng **100% hoàn hảo, không rớt một dòng code nào**, hãy triển khai theo lộ trình **6 Giai đoạn (6 Phases)** dưới đây:

### 3.1. Sơ đồ Tổng quan 6 Giai đoạn Thực thi

| Giai đoạn | Tên Giai đoạn | Mục tiêu trọng tâm | Tiêu chí nghiệm thu (Definition of Done) |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | **Khóa Logic & Thiết lập Design Tokens** | Đóng băng danh sách State/Callbacks và thiết lập bảng màu, bóng đổ, font chữ, keyframes animation. | Có danh sách kiểm kê toàn bộ Props/State; cấu hình xong các biến CSS/Tailwind cho Light Academic Luxury. |
| **Giai đoạn 2** | **Nâng cấp Header & Navigation Shell** | Tái thiết kế khung toàn trang, Logo $\sum$, Segmented Sliding Tabs và cụm `UserNavBadge` (Cloudflare Pulse + Profile). | Chuyển tab mượt mà, hiệu ứng kính mờ hoạt động chuẩn, mở được `ProfileModal` và giữ nguyên trạng thái đăng nhập. |
| **Giai đoạn 3** | **Tái cấu trúc Tab Tổ Hợp Đề Thi & Empty State** | Nâng cấp `Left Configuration Card` và xây dựng mới hoàn toàn component `EmptyState` kèm SVG toán học + 3 Quick Presets. | Click vào nút chính hoặc bất kỳ thẻ Preset nào đều kích hoạt đúng hàm `handleGenerateExam` với thông số ma trận chuẩn. |
| **Giai đoạn 4** | **Chuẩn hóa `QuestionCard` & Ngân Hàng Câu Hỏi** | Thiết kế lại thẻ câu hỏi, badge chuyên đề tiếng Việt, dropdown độ khó đổi màu, khung KaTeX nền giấy ngà và Lightbox hình vẽ. | Công thức KaTeX không vỡ dòng, đổi độ khó gọi đúng `handleQuickDifficultyChange`, nút Sửa/Đổi câu hoạt động trơn tru. |
| **Giai đoạn 5** | **Nâng cấp Exam Studio (Barem & Live A4 Viewer)** | Tinh chỉnh thanh kéo `splitRatio`, bảng Barem Bộ GD&ĐT, nút `+/- 0.25đ`, cảnh báo lệch điểm, nút `AI Barem` và khung giấy A4 + Zoom Dock. | Kéo chia đôi màn hình mượt, bấm `+/- 0.25đ` cập nhật đúng `adjustStepPoint`, phóng to/thu nhỏ tờ A4 không làm lệch bố cục. |
| **Giai đoạn 6** | **Đồng bộ Hệ thống Modal & Kiểm thử Hồi quy** | Chuẩn hóa `ProfileModal`, `QuestionEditModal`, `BlueprintBuilderModal` và kiểm tra toàn diện với skill `code-reviewer`. | Tất cả Modal có hiệu ứng mở/đóng mượt, không lỗi TypeScript, không rò rỉ sự kiện bàn phím/chuột. |

---

### 3.2. Chi tiết công việc từng Giai đoạn & Chiến lược Chia Nhỏ Prompt (Batching Strategy)

#### Giai đoạn 1: Kiểm kê State Hooks & Khởi tạo Hệ thống Token (Pre-Flight & Token Setup)
1. **Đóng băng danh sách biến trạng thái (State Freeze):**
   - Trước khi cho AI sửa JSX, cung cấp file mã nguồn hiện tại và yêu cầu AI liệt kê toàn bộ các biến `useState`, `useRef`, `useMemo`, `useCallback` và các hàm xử lý sự kiện.
   - Bản danh sách này đóng vai trò là **"Hợp đồng bất biến" (Immutable Contract)** cho các bước tiếp theo.
2. **Chuẩn bị lớp tiện ích dùng chung (Shared Visual Primitives):**
   - Định nghĩa sẵn 2 hàm helper thuần hiển thị (không can thiệp nghiệp vụ) để tái sử dụng:
     - `getTopicBadgeStyle(topicName)`: Trả về bộ class màu Pastel theo đúng chuyên đề Toán (Đại số, Số học, Hình học phẳng, Tổ hợp, Bất đẳng thức).
     - `getDifficultyBadgeStyle(level)`: Trả về bộ class màu theo 4 mức độ khó (Cơ bản, Vận dụng, Vận dụng cao, Olympiad).

#### Giai đoạn 2: Nâng cấp Khung Điều Hướng (`Header`, `SegmentedTabs`, `UserNavBadge`)
1. **Điểm nhấn UI/UX cần kiểm soát:**
   - Đảm bảo thanh Header có `z-40` để nổi trên nội dung khi cuộn nhưng nằm dưới Modal (`z-50`).
   - Cụm Segmented Sliding Tabs cần giữ nguyên giá trị `activeTab` hiện có của ứng dụng; chỉ thay lớp vỏ button phẳng bằng cấu trúc rãnh trượt `bg-slate-100/90 p-1 rounded-xl`.
   - Huy hiệu Cloudflare sử dụng `animate-ping` nhẹ nhàng, không gây xao nhãng thị giác.
2. **Cách giao việc cho AI (Đợt Prompt 1):**
   - Gửi kèm **Siêu Cấp Master Prompt (Phần I, II, III và Phân khu 1)** cùng đoạn code Header hiện tại. Yêu cầu AI xuất trọn vẹn code của `Header` và `UserNavBadge`.

#### Giai đoạn 3: Nâng cấp Tab "Tổ Hợp Đề Thi" & Khung `EmptyState` Sáng tạo
1. **Điểm nhấn UI/UX cần kiểm soát:**
   - **Left Configuration Card:** Giữ nguyên `value` và `onChange` của input tiêu đề và select ma trận; bổ sung dải thông số trực quan (`Số câu`, `20.0đ`, `120p`) ngay bên dưới hoặc bên trong thẻ chọn ma trận để giáo viên không phải đoán.
   - **Right Empty State:** Đảm bảo đồ họa SVG được nhúng trực tiếp bằng JSX hợp lệ (`viewBox`, `strokeWidth`, `strokeDasharray` chuẩn React camelCase) để không phụ thuộc vào file ảnh ngoài.
   - **3 Thẻ Quick Matrix Presets:** Nút *"Chọn & Tổ hợp ngay"* trên mỗi thẻ cần ánh xạ vào hàm chọn blueprint và gọi `handleGenerateExam` (hoặc cập nhật state tương ứng rồi kích hoạt tạo đề).
2. **Cách giao việc cho AI (Đợt Prompt 2):**
   - Gửi kèm **Phân khu 2 của Siêu Cấp Master Prompt** và đoạn code Tab Tổ hợp đề thi hiện tại. Yêu cầu xuất đầy đủ code của `LeftConfigurationCard` và `EmptyState`.

#### Giai đoạn 4: Nâng cấp Thẻ Câu Hỏi (`QuestionCard`) & Ngân Hàng Đề
1. **Điểm nhấn UI/UX cần kiểm soát:**
   - **Cấu trúc phân tầng trong thẻ:** Tách rõ 3 vùng: (1) Thanh Header chứa Badge câu + Điểm + Tags chuyên đề + Nút thao tác; (2) Khung nội dung Toán nền giấy ngà `#FCFBF9`; (3) Khung hình vẽ minh họa (chỉ hiển thị khi câu hỏi có ảnh/hình vẽ) kèm trạng thái mở Lightbox phóng to.
   - **Căn chỉnh KaTeX:** Bổ sung class `overflow-x-auto max-w-full` cho các công thức block dài để không bao giờ đẩy vỡ khung thẻ câu hỏi trên màn hình laptop 13-inch.
2. **Cách giao việc cho AI (Đợt Prompt 3):**
   - Gửi kèm **Phân khu 3 của Siêu Cấp Master Prompt** và code `QuestionCard` hiện tại. Yêu cầu xuất trọn vẹn component `QuestionCard` (bao gồm cả Lightbox xem hình vẽ nếu nằm cùng component).

#### Giai đoạn 5: Nâng cấp Phòng Soạn Thảo `Exam Studio` (Barem & Live A4 Canvas)
1. **Điểm nhấn UI/UX cần kiểm soát:**
   - **Thanh kéo chia đôi (`Split Resizer`):** Giữ nguyên toàn bộ sự kiện `onMouseDown` / `onMouseMove` / `onMouseUp` điều khiển `splitRatio`, chỉ nâng cấp giao diện thanh kéo với dải chấm grip và hiệu ứng sáng màu Indigo khi kéo.
   - **Bảng Barem & Micro-Stepper:** Đảm bảo 2 nút `+` và `-` `0.25đ` gọi chính xác `adjustStepPoint(questionId, stepIndex, +0.25)` và `adjustStepPoint(questionId, stepIndex, -0.25)` theo đúng chữ ký hàm gốc.
   - **Banner cảnh báo lệch điểm:** Tính toán độ lệch giữa tổng điểm các bước giải và điểm quy định của câu (dùng biểu thức hiển thị trực tiếp trong JSX, làm tròn `toFixed(2)` để tránh lỗi số thực dấu phẩy động của JavaScript như `0.30000000000000004`).
   - **Live Canvas A4 Viewer:** Đặt thanh `Floating Zoom Dock` ở vị trí `sticky bottom-6` hoặc `absolute bottom-6 left-1/2 -translate-x-1/2 z-20` để luôn nổi gọn gàng phía dưới vùng xem trước mà không che khuất nội dung trang giấy A4.
2. **Cách giao việc cho AI (Đợt Prompt 4):**
   - Gửi kèm **Phân khu 4 của Siêu Cấp Master Prompt** và code khu vực `Exam Studio` hiện tại.

#### Giai đoạn 6: Chuẩn hóa Hệ thống Modal & Hậu kiểm Chất lượng (Modal Polish & QA Audit)
1. **Điểm nhấn UI/UX cần kiểm soát:**
   - Đồng bộ hóa thiết kế của 3 cửa sổ `ProfileModal`, `QuestionEditModal`, và `BlueprintBuilderModal` theo cùng một khuôn mẫu: Header phân vùng rõ, Body chia lưới 12 cột thoáng đãng, Footer cố định nút bấm.
2. **Quy trình Kiểm thử Hồi quy (Regression Checklist):**
   - Kích hoạt skill `frontend-ui-ux-redesign` và `ui-animation-microinteractions` trong quá trình tạo giao diện.
   - Sau khi ghép code, kích hoạt skill `code-reviewer` để rà soát:
     - Không có biến State hoặc hàm Handler nào bị rơi rớt.
     - Không có lỗi cú pháp JSX (thẻ chưa đóng, nhầm `class` thay vì `className`, thuộc tính SVG chưa viết dạng camelCase).
     - Độ tương phản chữ đạt chuẩn dễ đọc và hiệu ứng chuyển động mượt mà ở 60fps.
