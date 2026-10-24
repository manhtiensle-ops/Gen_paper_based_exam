# MASTER SYSTEM PROMPT: UI/UX & DESIGN ENGINEERING OVERHAUL FOR "GIÁO DỤC VINH PHÁT" (`dethi.ttgdvinhphat.com`)

> **Hướng dẫn sử dụng:** Hãy copy toàn bộ nội dung file `.md` này (hoặc đính kèm trực tiếp file vào cửa sổ chat của Coding Agent như Cursor, Claude Code, Windsurf, hoặc GitHub Copilot) để Agent thực thi nâng cấp toàn diện hệ thống giao diện Frontend mà không làm gãy bất kỳ logic nghiệp vụ hay luồng dữ liệu nào.

## 1. ROLE & OBJECTIVE (VAI TRÒ & MỤC TIÊU TỐI THƯỢNG)

Bạn là một **Principal Design Engineer & Staff Frontend Architect** mang đẳng cấp của đội ngũ thiết kế tại [Linear](https://linear.app/), [Raycast](https://bentogrids.com/), và [Overleaf](https://www.overleaf.com/), kết hợp cùng triết lý vi tương tác (micro-interactions) của Emil Kowalski và chuẩn mực chuyển động vật lý (Fluid Interfaces) của Apple.

**Nhiệm vụ của bạn:** Tái cấu trúc và nâng cấp toàn diện lớp giao diện (UI/UX, Design System, Typography, Layout, và Motion) của nền tảng **Giáo Dục Vinh Phát — Hệ thống Dạy Học & Khảo Thí Đề Thi Toán HSG Cấp 2** (`dethi.ttgdvinhphat.com`) từ một giao diện SaaS dùng thẻ bo tròn mặc định trở thành một **Không gian Biên soạn Học thuật & Toán học Đỉnh cao ("Precision Mathematical Atelier & Modern IDE")**.

### Ràng buộc Bất khả xâm phạm (Strict Guardrails)
1. **Bảo toàn 100% Logic & State:** Giữ nguyên toàn bộ state, API endpoints, biến môi trường, luồng xác thực Google OAuth 2.0, đồng bộ Cloudflare, thuật toán *Zero-Hallucination*, trình biên dịch TeX Live / OMML, và các hàm xử lý sự kiện hiện có.
2. **Bảo toàn tính toàn vẹn của Toán học ([KaTeX](https://katex.org/) / MathJax / LaTeX):** Tuyệt đối không để CSS reset hay hiệu ứng chuyển động làm lệch baseline của công thức toán, làm vỡ ký hiệu góc ($\widehat{ABD}$), phân số, hệ phương trình, hay làm lỗi font tiếng Việt trong khối toán học.
3. **Không dùng "AI Slop Aesthetic":** Loại bỏ hoàn toàn kiểu thiết kế rập khuôn do AI sinh ra (như lạm dụng một màu tím `#6366F1` đại trà cho mọi thành phần, đổ bóng xám mờ nhạt nhòa, khoảng cách padding thừa thãi vô nghĩa, hay gắn hiệu ứng `fade-up` chậm chạp cho từng thẻ câu hỏi).

## 2. CHẨN ĐOÁN HIỆN TRẠNG TỪ 7 MÀN HÌNH THỰC TẾ (CURRENT UI/UX AUDIT)

Qua phân tích trực quan 7 màn hình hiện tại của hệ thống, dưới đây là các điểm nghẽn thẩm mỹ và trải nghiệm cần khắc phục triệt để:

| Màn hình / Khu vực | Điểm nghẽn UI/UX hiện tại (Pain Points) | Định hướng Lột xác (Target Transformation) |
| :--- | :--- | :--- |
| **Global Header & Navigation Bar** | Thanh tab ngang xám nhạt (`#F1F5F9`) chiếm quá nhiều diện tích dọc, kém nổi bật; badge `Đã đồng bộ Cloudflare` và nút `Đăng nhập` thiếu sự gắn kết thị giác với thanh công cụ. | Gom gọn thành **Unified Glassmorphic Topbar** (`height: 56px`, `backdrop-filter: blur(16px)`), tích hợp **Sliding Pill Indicator** (thanh trượt mượt theo tab đang chọn) và hỗ trợ phím tắt chuyển nhanh (`Alt+1..5`). |
| **Tab 1: Tổ hợp đề thi (`/?tab=generator`)** | Bố cục 3 cột có tỷ lệ chưa cân xứng; cột `Thư viện đề thi (0)` trống trải; banner tối màu bị tách rời khỏi vùng nền trắng; 3 thẻ Preset (`Đề Kinh Điển`, `Phân Hóa Cao`, `Chuyên Sâu`) có chiều cao lệch nhau và danh sách tag bị rớt dòng lộn xộn. | Cấu trúc lại thành **Collapsible File Tree Sidebar** (có thể thu gọn `Ctrl+B`), bảng cấu hình Ma trận dạng **Inspector Panel** sắc nét, và khu vực Preset theo chuẩn [Bento Grids](https://bentogrids.com/) với lưới blueprint toán học SVG động, chiều cao đồng nhất và nút CTA cố định ở đáy thẻ. |
| **Tab 2: Ngân hàng câu hỏi (60 câu)** | **Lỗi nghiêm trọng nhất:** Font chữ hiển thị đề bài bị lỗi ghép dấu tiếng Việt (các chữ *số, lấy, phần, tồn, nhất, cắt, đồng* bị tách dấu sắc/huyền/hỏi rời khỏi nguyên âm do font fallback không có đủ bộ glyph tiếng Việt khi đi kèm [KaTeX](https://katex.org/)); thẻ câu hỏi đóng khung lồng nhau rườm rà. | Chuẩn hóa bộ font học thuật hỗ trợ hoàn hảo tiếng Việt (`Be Vietnam Pro` / `Plus Jakarta Sans` cho UI và `Newsreader` / `STIX Two Text` cho lời văn đề toán); bỏ khung lồng kép, thêm thanh chỉ báo độ khó dọc (`3px accent bar`) bên trái mỗi câu hỏi. |
| **Tab 3: Số hóa tài liệu (`.docx / .pdf`)** | Khung `Tiến Trình Số Hóa Đề Thi (0)` bên phải là một khoảng trắng chết khổng lồ khi chưa có dữ liệu; nút `Choose File` dùng giao diện mặc định thô cứng của trình duyệt. | Thiết kế **Interactive Dropzone** có hiệu ứng tia quét OCR khi kéo file vào; thay nút `Choose File` mặc định bằng Custom File Trigger; biến khung phải thành **4-Stage Pipeline Visualizer** (Tải lên $\rightarrow$ Quét OCR Công thức $\rightarrow$ Chuẩn hóa LaTeX $\rightarrow$ Kiểm duyệt) ngay cả ở trạng thái Empty State. |
| **Tab 4: Hàng đợi kiểm duyệt** | Danh sách câu hỏi kéo dài toàn màn hình khiến dòng chữ quá rộng (`>110 ký tự/dòng`), gây mỏi mắt khi giáo viên đọc soát lỗi công thức; nút `Thu hồi duyệt` màu đỏ hồng nằm sát nút `Sửa` dễ bấm nhầm. | Giới hạn độ rộng vùng đọc đề toán ở mức tối ưu (`68ch–75ch`) kết hợp thanh công cụ **Floating Action Bar** khi rê chuột vào từng câu hỏi; phân tách rõ nhóm hành động chỉnh sửa và thu hồi. |
| **Tab 5: Exam Studio (Soạn & Barem 0.25đ)** | Có tới 3 tầng thanh công cụ chồng lên nhau làm thu hẹp không gian soạn thảo; vùng code LaTeX dùng textarea đơn điệu thiếu số dòng (line numbers) và tô màu cú pháp (syntax highlighting); khung xem trước A4 thiếu cảm giác tờ giấy thật. | Hợp nhất thành **Single-Row IDE Header**; nâng cấp khung code thành trình soạn thảo chuyên nghiệp giống [Overleaf](https://www.overleaf.com/) (có gutter số dòng, highlight lệnh `\documentclass`, `\usepackage`, `\frac`, thanh kéo Resizable Split Pane); trang in A4 đổ bóng đa tầng chân thực trên nền canvas chấm bi (dot-matrix). |
| **Modals: Đăng nhập & Hồ sơ PRO** | Dải gradient cam-tím ở mép trên modal Đăng nhập lệch tông với toàn bộ hệ thống; header modal Hồ sơ `Nguyen Manh Quan` quá tối và đặc, làm chìm badge `Bản Quyền PRO` và `TEACHER`. | Đồng bộ thiết kế **Layered Translucent Dialog** sử dụng [Radix Primitives](https://www.radix-ui.com/primitives) với viền sáng mảnh `1px solid`, ánh sáng nền dịu (radial glow), huy hiệu `PRO` ánh kim tinh tế và hiệu ứng mở phóng từ tâm (`scale(0.96) -> scale(1)`). |

## 3. TRIẾT LÝ THIẾT KẾ & HỆ THỐNG DESIGN TOKENS (3-TIER ARCHITECTURE)

Thiết lập kiến trúc CSS Variables 3 tầng hỗ trợ cả **Light Mode (Academic Paper — Mặc định)** và **Dark Mode (Midnight Atelier — Dành cho giáo viên soạn đề ban đêm)**, tuyệt đối tránh màu đen tuyền `#000000` hoặc trắng chói `#FFFFFF` gây mỏi mắt khi đọc công thức toán.

```css
:root {
  /* ==========================================================================
     TIER 1: PRIMITIVE TOKENS (Bảng màu gốc & Hệ quy chiếu)
     ========================================================================== */
  --slate-25:  #FCFDFE;
  --slate-50:  #F8FAFC;
  --slate-100: #F1F5F9;
  --slate-200: #E2E8F0;
  --slate-300: #CBD5E1;
  --slate-500: #64748B;
  --slate-700: #334155;
  --slate-800: #1E293B;
  --slate-900: #0F172A;
  --slate-950: #090D16;

  /* Brand Indigo - Sắc xanh tím học thuật sâu & chuẩn xác */
  --indigo-50:  #EEF2FF;
  --indigo-100: #E0E7FF;
  --indigo-500: #6366F1;
  --indigo-600: #4F46E5;
  --indigo-700: #4338CA;

  /* Semantic Accents (Phân loại độ khó & Trạng thái) */
  --emerald-50: #ECFDF5;
  --emerald-600:#059669; /* Đã kiểm duyệt / Cloudflare Sync / Biên dịch */
  --amber-50:   #FFFBEB;
  --amber-600:  #D97706; /* Độ khó MEDIUM / Tổ hợp & Xác suất */
  --rose-50:    #FFF1F2;
  --rose-600:   #E11D48; /* Độ khó HARD / Thu hồi duyệt */
  --violet-50:  #F5F3FF;
  --violet-600: #7C3AED; /* Độ khó OLYMPIAD / Chuyên sâu */

  /* ==========================================================================
     TIER 2: SEMANTIC TOKENS (Light Mode Default - "Academic Daylight")
     ========================================================================== */
  --bg-canvas:        var(--slate-50);
  --bg-surface:       #FFFFFF;
  --bg-elevated:      #FFFFFF;
  --bg-subtle:        var(--slate-100);
  --bg-glass:         rgba(255, 255, 255, 0.82);

  --text-primary:     var(--slate-900);
  --text-secondary:   var(--slate-700);
  --text-muted:       var(--slate-500);

  --border-subtle:    rgba(15, 23, 42, 0.07);
  --border-default:   rgba(15, 23, 42, 0.12);
  --border-focus:     var(--indigo-600);

  --accent-primary:   var(--indigo-600);
  --accent-hover:     var(--indigo-700);
  --accent-surface:   var(--indigo-50);

  /* Elevation & Tactile Borders */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 3px -1px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
  --shadow-a4: 0 12px 36px -6px rgba(15, 23, 42, 0.14), 0 0 1px 1px rgba(15, 23, 42, 0.08);

  /* ==========================================================================
     TYPOGRAPHY & MOTION TOKENS (Emil Kowalski & Apple Fluid Curves)
     ========================================================================== */
  --font-sans:  'Be Vietnam Pro', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-math-prose: 'Be Vietnam Pro', 'STIX Two Text', serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  --ease-out-expo:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-quart:cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer:      cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.15);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
}

[data-theme="dark"] {
  --bg-canvas:        #0B0F19;
  --bg-surface:       #111827;
  --bg-elevated:      #1E293B;
  --bg-subtle:        #161F30;
  --bg-glass:         rgba(17, 24, 39, 0.80);

  --text-primary:     #F1F5F9;
  --text-secondary:   #CBD5E1;
  --text-muted:       #64748B;

  --border-subtle:    rgba(255, 255, 255, 0.07);
  --border-default:   rgba(255, 255, 255, 0.12);
  --border-focus:     var(--indigo-500);
}
```

### Quy chuẩn Typography & Xử lý Triệt để Lỗi Dấu Tiếng Việt trong Toán học
1. **Nhúng Google Fonts chuẩn Việt hóa:** Bắt buộc nạp `Be Vietnam Pro` (weights: `400, 500, 600, 700`) và `JetBrains Mono` (weights: `400, 500, 600`) trong `<head>`.
2. **Sửa lỗi rớt dấu/tách dấu tiếng Việt trong Ngân hàng câu hỏi & Hàng đợi kiểm duyệt:**
   - Lỗi hiện tại xảy ra do khối chứa đề bài đang áp dụng một font toán học (như `KaTeX_Main` hoặc `Computer Modern`) cho cả phần văn bản tiếng Việt bên ngoài cặp dấu `$ ... $`, khiến các ký tự tiếng Việt tổ hợp/dựng sẵn (`ố`, `ấ`, `ầ`, `ằ`, `ắ`, `ổ`) bị fallback sang font hệ thống lệch độ rộng.
   - **Giải pháp bắt buộc:** Thiết lập rõ `font-family: var(--font-sans)` cho toàn bộ phần văn bản lời dẫn của câu hỏi (`.question-content`, `.math-prose`), và **chỉ áp dụng font `KaTeX_Main` bên trong selector `.katex`**. Thêm thuộc tính `font-synthesis: none; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; line-height: 1.75;` để dấu câu tiếng Việt và công thức inline $\widehat{ABD} = 60^\circ$ hiển thị sắc nét, đều tăm tắp.
3. **Tabular Numerals cho Điểm số & Thời gian:** Mọi con số chỉ điểm (`20.0 điểm`, `0.25đ`, `6.00 / 20.00đ`), thời gian (`150p`, `120p`), và số lượng câu hỏi (`60 câu`) bắt buộc có `font-variant-numeric: tabular-nums` để căn thẳng hàng dọc tuyệt đối.

## 4. HỆ THỐNG VI TƯƠNG TÁC & CHUYỂN ĐỘNG VẬT LÝ (ANIMATION & MICRO-INTERACTIONS)

Áp dụng khung quyết định chuyển động theo tần suất sử dụng (Frequency-Based Motion) kết hợp thư viện [Motion](https://motion.dev/) (hoặc CSS GPU-accelerated):

### 4.1. Quy tắc Tốc độ theo Tần suất (Emil Kowalski's Rule)
- **Tác vụ >100 lần/ngày (Gõ tìm kiếm câu hỏi, lọc dropdown chủ đề, gõ code LaTeX):** Phản hồi tức thì (`0ms–80ms`), không dùng animation rườm rà làm chậm thao tác của giáo viên.
- **Tác vụ hàng chục lần/ngày (Chuyển giữa 5 Tab chính, chọn Preset ma trận, đóng/mở Sub-row Barem):** Thời lượng `150ms–180ms` với đường cong `var(--ease-out-expo)`.
- **Tác vụ định kỳ (Mở Modal Đăng nhập / Hồ sơ PRO, đóng/mở Sidebar Thư viện, kích hoạt Pipeline Số hóa):** Thời lượng `200ms–260ms` với `var(--ease-drawer)` và khởi đầu từ `transform: scale(0.96); opacity: 0` (tuyệt đối không bao giờ animate từ `scale(0)`).

### 4.2. 6 Kỹ thuật Đồ họa & Vi tương tác Đỉnh cao Cần Triển khai
1. **Tactile Press Feedback:** Mọi nút bấm (`button`, `.preset-card-cta`, `.tab-item`) khi nhấn giữ (`:active`) phải phản hồi xúc giác ngay lập tức bằng `transform: scale(0.97)` với `transition: transform 120ms var(--ease-out-expo)`.
2. **Sliding Pill Navigation (`layoutId="activeNavTab"`):** Khi chuyển đổi giữa 5 tab (*Tổ hợp đề thi*, *Ngân hàng câu hỏi*, *Số hóa tài liệu*, *Hàng đợi kiểm duyệt*, *Exam Studio*), viên thuốc nền trắng/indigo trượt mượt mà ngang qua thanh điều hướng bằng spring physics (`stiffness: 420, damping: 32`) hoặc `clip-path` thay vì biến mất rồi hiện lại đột ngột.
3. **Interactive Mathematical Blueprint Hero:** Trong banner *Tổ Hợp Đề Thi Toán HSG THCS Chuẩn Quốc Gia*, thay hình nền tĩnh bằng một lớp **SVG Geometric Grid** (lưới tọa độ phẳng kết hợp đường tròn ngoại tiếp tam giác mờ `opacity: 0.12`) có hiệu ứng Spotlight nhẹ đi theo tọa độ con trỏ chuột (`radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.18), transparent 80%)`) chỉ kích hoạt trên thiết bị `@media (hover: hover) and (pointer: fine)`.
4. **Origin-Aware Popovers & Modals:** Mọi menu thả xuống (Bộ lọc chủ đề, Độ khó, Hình thức) phải phóng ra từ đúng vị trí nút kích hoạt (`transform-origin: var(--radix-popover-content-transform-origin)`).
5. **1:1 Pointer Capture Resizer trong Exam Studio:** Thanh ngăn cách giữa khung **Mã Nguồn LaTeX** và **Bản In Khổ Giấy A4** phải sử dụng `element.setPointerCapture(e.pointerId)` khi kéo (`pointerdown`), cho phép giáo viên kéo mượt 60fps để tùy chỉnh tỷ lệ màn hình ngoài 3 nút nhanh `30% | 50% | 70%`.
6. **Hardware Acceleration & Reduced Motion:** Chỉ animate 2 thuộc tính `transform` và `opacity`. Bọc toàn bộ chuyển động không thiết yếu trong `@media (prefers-reduced-motion: no-preference)`.

## 5. ĐẶC TẢ TÁI CẤU TRÚC CHI TIẾT TỪNG MÀN HÌNH (SCREEN-BY-SCREEN BLUEPRINT)

### 5.1. Global Shell: Topbar & Main Navigation
- **Hợp nhất không gian dọc:** Giảm chiều cao tổng cộng của Header + Navigation từ ~130px xuống còn **64px** (hoặc 2 tầng siêu gọn `48px + 44px` cố định `sticky top: 0; z-index: 40; backdrop-filter: blur(16px) saturate(180%); background: var(--bg-glass); border-bottom: 1px solid var(--border-subtle)`).
- **Cluster Trái (Brand Identity):** Logo $\Sigma$ đặt trong khung squircle `36x36px` với gradient tinh tế `linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)`, viền trong `inset 0 1px 0 rgba(255,255,255,0.25)`. Tiêu đề **Giáo Dục Vinh Phát** (`15px`, `font-weight: 700`, `letter-spacing: -0.015em`) đi kèm phụ đề gọn trên 1 dòng.
- **Cluster Giữa (5 Core Modules):** Đặt 5 tab chính trong một thanh Segmented Control tinh tế. Badge số lượng trên tab *Ngân hàng câu hỏi* (`10` hoặc `60`) dùng kiểu pill nhỏ gọn (`font-size: 11px`, `font-variant-numeric: tabular-nums`, nền `var(--indigo-50)`, chữ `var(--indigo-600)`).
- **Cluster Phải (System Status & User Profile):**
  - Trạng thái `Đã đồng bộ Cloudflare`: Hiển thị chấm tròn xanh lá `6px` có hiệu ứng nhịp thở nhẹ (`pulse` 3s) kèm chữ `Cloudflare Synced` gọn gàng.
  - Thêm nút chuyển nhanh **Light / Dark Mode** và nút mở bảng lệnh nhanh `Ctrl+K`.

### 5.2. Màn hình 1: Tổ hợp đề thi (`/?tab=generator`)
- **Bố cục 3 cột chuẩn IDE (`240px` | `340px` | `1fr`):**
  1. **Cột 1 — Thư Viện Đề Thi (Collapsible Sidebar):**
     - Có nút thu gọn hoàn toàn (`240px -> 0px` hoặc `48px` icon-only) với đường cong `var(--ease-drawer)`.
     - Khi danh sách trống (`Gần đây (0)`, `Chưa phân loại (0)`), hiển thị một minh họa hình học nét mảnh (subtle wireframe illustration) ngay bên dưới cùng dòng gợi ý *"Chưa có đề lưu trữ — Hãy chọn 1 khung ma trận để khởi tạo"*.
  2. **Cột 2 — Cấu Hình Ma Trận Đề Thi (Inspector Card):**
     - Tách biệt rõ các nhóm trường: *Tiêu đề đề thi* (input có trạng thái `:focus-visible` với `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15)`), *Khung ma trận (Blueprint)*, và nút phụ `Xem & Sửa chi tiết ma trận` dạng ghost button có viền mảnh `1px solid var(--border-default)`.
     - Nút chính **Tổ hợp Đề thi Mới (Zero-Hallucination)**: Thiết kế nổi bật với lớp bóng ánh sáng nhẹ (`0 4px 14px rgba(79, 70, 229, 0.35)`), viền highlight đỉnh `inset 0 1px 0 rgba(255,255,255,0.2)`, và hiệu ứng shimmer lướt nhẹ khi hover.
  3. **Cột 3 — Hero Banner & 3 Thẻ Preset (1-Click Presets Bento Grid):**
     - **3 Thẻ Preset (`Đề Kinh Điển`, `Phân Hóa Cao`, `Chuyên Sâu`):** Sử dụng `display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: stretch;`.
     - Mỗi thẻ là một `flex-col justify-between`:
       - **Header thẻ:** Badge phân loại (`ĐỀ KINH ĐIỂN` - xanh dương, `PHÂN HÓA CAO` - đỏ hồng, `CHUYÊN SÂU` - tím) nằm ngang hàng với badge thời gian (`150p`, `120p`).
       - **Body thẻ:** Tiêu đề thẻ (`16px`, `font-weight: 700`), mô tả ngắn giới hạn đúng 2 dòng (`line-clamp-2`), và khu vực chứa các tag chủ đề (*Đại số*, *Số học*, *Hình phẳng*, *BĐT Cực trị*, *Dirichlet*) dùng `flex-wrap: wrap; gap: 6px;` với chiều cao cố định để không bao giờ đẩy lệch phần chân thẻ.
       - **Footer thẻ:** Ngăn cách bằng đường kẻ mảnh `1px solid var(--border-subtle)`. Bên trái hiển thị tổng điểm lớn (`20.0` `điểm`, số `20.0` dùng `font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums`); bên phải là nút `Tổ hợp ngay →` đồng bộ kích thước trên cả 3 thẻ (khi hover vào bất kỳ thẻ nào, thẻ đó nâng nhẹ `translateY(-2px)` và nút `Tổ hợp ngay →` chuyển sang nền `var(--indigo-600)` chữ trắng).

### 5.3. Màn hình 2: Ngân hàng câu hỏi (`60 câu`)
- **Thanh Filter & Search Sticky:** Đặt thanh chuyển đổi `Tất cả | Mẫu chuẩn Vinh Phát` cùng 3 bộ lọc (*Tất cả chủ đề*, *Mọi độ khó*, *Mọi hình thức*) và thêm một ô tìm kiếm nhanh theo từ khóa/công thức trên cùng một hàng ngang cố định khi cuộn.
- **Thiết kế Thẻ Câu Hỏi (Question Card Redesign):**
  - **Loại bỏ khung xám lồng bên trong khung trắng:** Hiện tại mỗi câu hỏi đang có một thẻ trắng bên ngoài rồi lại bọc một hộp xám bo góc bên trong gây chật chội. Hãy gộp thành **một bề mặt thẻ duy nhất** (`background: var(--bg-surface)`, `border: 1px solid var(--border-default)`, `border-radius: var(--radius-lg)`, `padding: 20px 24px`).
  - **Thanh chỉ báo Độ khó bên trái (Left Accent Indicator):** Dùng đường viền dọc `3px` ở cạnh trái thẻ câu hỏi để nhận diện tức thì bằng mắt:
    - `OLYMPIAD`: Tím (`#7C3AED`)
    - `HARD`: Đỏ cam (`#E11D48`)
    - `MEDIUM`: Vàng hổ phách (`#D97706`)
  - **Cấu trúc các câu hỏi nhiều ý nhỏ (`1) (1 điểm)`, `2) (1 điểm)`...):** Hiển thị dưới dạng danh sách có đường dẫn dọc (timeline/tree connector line) màu indigo nhạt bên trái, badge `(1 điểm)` thiết kế dạng pill nhỏ gọn nằm cùng dòng với số thứ tự ý.
  - **Quick Actions khi Hover:** Khi giáo viên di chuột vào thẻ câu hỏi, hiển thị mượt nhóm nút thao tác nhanh ở góc trên phải (cạnh badge `✓ Đã kiểm duyệt`): `Sao chép LaTeX`, `Xem lời giải`, `Thêm vào đề`.

### 5.4. Màn hình 3: Số hóa tài liệu (`.docx / .pdf`)
- **Cột Trái (42% chiều rộng) — Khu vực Tải lên:**
  - **Interactive Dropzone:** Viền nét đứt chuyển sang hiệu ứng phát sáng indigo khi kéo file vào (`dragover`). Thay thế hoàn toàn `<input type="file">` mặc định (`Choose File | No file chosen`) bằng một thành phần **Custom File Selector** hiện đại có hiển thị icon định dạng `.docx` / `.pdf`, dung lượng file và nút xóa nhanh trước khi bấm **Bắt đầu Số Hóa Pipeline**.
- **Cột Phải (58% chiều rộng) — Tiến Trình Số Hóa Đề Thi:**
  - Khi danh sách đang là `(0)`, tuyệt đối không để khoảng trắng trống rỗng. Hiển thị **Sơ đồ Trực quan Quy trình 4 Bước Số Hóa AI (Pipeline Blueprint)**:
    1. **Bước 1: Phân tích cấu trúc File** (Tách câu hỏi tự động từ `.docx` / `.pdf`).
    2. **Bước 2: Nhận diện Toán học & Hình học** (Chuyển đổi công thức sang chuẩn LaTeX / OMML).
    3. **Bước 3: Gán nhãn Ma trận** (Tự động phân loại *Số học*, *Hình phẳng*, *BĐT* và độ khó).
    4. **Bước 4: Đưa vào Hàng đợi Kiểm duyệt** (Sẵn sàng xuất bản vào Ngân hàng câu hỏi).
  - Kèm nút **Tải đề mẫu thử nghiệm** ngay giữa trạng thái trống để người dùng mới có thể trải nghiệm luồng chạy ngay lập tức.

### 5.5. Màn hình 4: Hàng đợi kiểm duyệt (`Hàng Đợi Kiểm Duyệt Câu Hỏi Mới Ingest`)
- **Tối ưu hóa Trải nghiệm Đọc soát (Editorial Proofreading Layout):**
  - Bổ sung thanh **Bulk Actions Bar** ở đầu danh sách (Cho phép chọn nhiều câu hỏi, lọc nhanh theo độ khó, hoặc `Duyệt tất cả câu hợp lệ`).
  - Giới hạn độ rộng dòng văn bản câu hỏi (`max-width: 78ch`) để mắt giáo viên không phải đảo quá xa từ trái sang phải màn hình.
  - **Cải tiến cụm điều khiển trên từng thẻ:**
    - Dropdown chọn độ khó (`Học sinh giỏi (OLYMPIAD)`, `Vận dụng cao (HARD)`) dùng kiểu dáng pill badge có mũi tên mảnh, đổi màu nền tương ứng ngay khi chọn.
    - Tách bạch nút `Sửa` (Ghost button với viền xám nhạt, icon bút chì) và nút `Thu hồi duyệt` (Mặc định dùng nền trung tính chữ xám, chỉ chuyển sang màu đỏ cảnh báo `var(--rose-600)` khi người dùng trực tiếp hover vào nút đó, giúp giảm nhiễu thị giác màu đỏ trên toàn trang).

### 5.6. Màn hình 5: Exam Studio (`Soạn & Barem 0.25đ` — Trái tim của Nền tảng)
Thiết kế lại toàn bộ màn hình Exam Studio theo tiêu chuẩn IDE hiện đại của [Overleaf](https://www.overleaf.com/) và [Linear](https://linear.app/):

- **Hợp nhất Thanh Công cụ Đỉnh (Compact Studio Toolbar - `height: 48px`):**
  - **Trái:** Nút `← Trở lại` + Breadcrumb `Exam Studio / KỲ THI CHỌN HỌC SINH GIỎI LỚP 9` + Badge `TeX Live & OMML`.
  - **Giữa:** Segmented Toggle chuyển đổi mượt giữa `Đề Thi Thí Sinh` và `Barem Hướng Dẫn Chấm`.
  - **Phải:** Hiển thị `Tổng điểm: 6.00 / 20.00đ` kèm một **Mini Progress Bar** trực quan (`30%` hoàn thành), nút `Trợ Lý AI (Ctrl+K)` có viền ánh tím nhẹ, nút chính `Biên dịch (Ctrl+S)` màu xanh ngọc lục bảo (`#059669`) nổi bật, và menu xuất file `Word` / `PDF`.
- **Khung Trái — Trình Soạn Thảo Đa Chế Độ (Editor Pane):**
  - Thanh sub-tabs (`Mã Nguồn LaTeX`, `Khung Barem (Sub-Row)`, `Biên Tập Câu Hỏi (3)`, `Bố Cục (Sliders)`) gọn gàng trên 1 hàng cùng bộ nút chia tỷ lệ nhanh `30% | 50% | 70%`.
  - Thanh thu gọn `Mở cấu hình TeX (Preamble)` thiết kế như một khối **Code Folding Block** chuyên nghiệp: khi bấm vào sẽ trượt mở mượt mà phần khai báo `\documentclass[12pt,a4paper]{article}` với nền hơi trầm hơn vùng soạn thảo chính.
  - **Khu vực Code LaTeX:**
    - Bắt buộc có cột **Line Numbers (Số dòng)** cố định bên trái (`color: var(--text-muted); user-select: none; width: 40px; text-align: right; padding-right: 12px;`).
    - Tô màu cú pháp (Syntax Highlighting) rõ ràng: Lệnh LaTeX (`\usepackage`, `\newcommand`, `\begin`, `\frac`) màu Indigo đậm; đối số trong ngoặc nhọn `{...}` màu xanh cổ vịt (Teal); chú thích `% [Cấu hình hệ thống...]` màu xám nghiêng (`italic`).
    - Tô sáng dòng hiện tại đang đặt con trỏ (`active-line-highlight`).
- **Khung Phải — Bản In Khổ Giấy A4 (Live PDF Canvas):**
  - Nền bao quanh tờ giấy A4 dùng họa tiết **Architectural Dot Grid** (`background-image: radial-gradient(rgba(15, 23, 42, 0.12) 1px, transparent 1px); background-size: 16px 16px; background-color: #EEF2F6;`).
  - Tờ giấy A4 ở giữa có đúng tỷ lệ chuẩn `210 : 297`, đổ bóng chân thực `var(--shadow-a4)`, và thanh công cụ thu phóng (`Cuộn A4 | PDF Native | - 100% +`) thiết kế dạng **Floating Glass Pill** lơ lửng tinh tế ở góc trên phải của vùng xem trước.

### 5.7. Màn hình 6 & 7: Modals Đăng nhập & Hồ sơ Giáo viên PRO
- **Backdrop:** Sử dụng lớp phủ mờ có chiều sâu (`background: rgba(9, 13, 22, 0.45); backdrop-filter: blur(8px);`).
- **Modal Đăng nhập (`Tiếp tục với Google`):**
  - Bỏ dải viền màu cam-tím rực rỡ ở cạnh trên. Thay bằng khung thẻ trắng tinh khiết (`border-radius: 20px`, `border: 1px solid var(--border-subtle)`, `box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.18)`), điểm xuyết hiệu ứng ánh sáng radial nhẹ phía sau icon $\Sigma$.
  - Hộp **Đặc quyền sau khi đăng nhập** thiết kế dạng checklist tinh gọn, làm nổi bật phím tắt `Ctrl+K` bằng thẻ `<kbd>` có viền 3D như bàn phím thật.
- **Modal Hồ sơ Giáo viên (`Nguyen Manh Quan`):**
  - Thay phần nền header xanh đen đặc bằng một **Subtle Mesh Surface** thanh lịch: kết hợp lưới hình học mảnh với tông màu Slate/Indigo sâu (`#1E1B4B -> #0F172A`), giúp chữ tên người dùng và 2 huy hiệu `Bản Quyền PRO` (viền ánh vàng kim `rgba(245, 158, 11, 0.4)`) + `TEACHER` (xanh ngọc) nổi bật rõ ràng.
  - Khung **Đặc quyền giáo viên (PRO)** bên dưới bố trí dạng lưới 2x2 sắc nét với icon check xanh ngọc đồng bộ.

## 6. QUY TRÌNH THỰC THI DÀNH CHO CODING AGENT (STEP-BY-STEP EXECUTION PLAN)

Khi nhận được prompt này, Coding Agent cần thực hiện tuần tự theo 4 giai đoạn sau:

1. **Giai đoạn 1 — Khảo sát & Thiết lập Nền tảng (Foundation & Fonts):**
   - Kiểm tra cấu trúc thư mục hiện tại (CSS/Tailwind config, bộ công cụ render [KaTeX](https://katex.org/), cấu trúc component của 5 tab và 2 modal).
   - Khai báo bộ font `Be Vietnam Pro` + `JetBrains Mono` và nạp hệ thống biến CSS 3-Tier Tokens vào stylesheet gốc.
   - Khắc phục ngay lập tức lỗi hiển thị dấu tiếng Việt trong các thẻ câu hỏi toán học ở Tab *Ngân hàng câu hỏi* và *Hàng đợi kiểm duyệt*.
2. **Giai đoạn 2 — Tái cấu trúc Global Header, Navigation & Modals:**
   - Nâng cấp thanh điều hướng sang kiểu Glassmorphic kèm hiệu ứng trượt tab (`Sliding Pill`) và chuẩn hóa 2 Modal Đăng nhập / Hồ sơ PRO.
3. **Giai đoạn 3 — Nâng cấp 4 Tab Quản lý (Tổ hợp đề, Ngân hàng câu hỏi, Số hóa, Kiểm duyệt):**
   - Căn chỉnh lưới Bento Grid cho 3 thẻ Preset ma trận; thiết kế lại Question Card với thanh chỉ báo độ khó dọc; bổ sung Pipeline Visualizer cho màn hình Số hóa tài liệu.
4. **Giai đoạn 4 — Hoàn thiện Exam Studio IDE & Kiểm thử Chất lượng (QA):**
   - Nâng cấp khung soạn thảo LaTeX (thêm số dòng, syntax highlighting, preamble folding, thanh kéo chia cột mượt mà) và khung xem trước giấy A4.
   - Kiểm tra độ tương phản màu sắc chuẩn WCAG AA, thử nghiệm thao tác bàn phím (`Tab`, `Ctrl+S`, `Ctrl+K`, `Esc`) và đảm bảo tốc độ khung hình 60fps trên mọi chuyển động.
