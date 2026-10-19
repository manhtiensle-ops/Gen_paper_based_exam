# Tài liệu Thiết kế Hệ thống Giao diện & Kiến trúc Web IDE (UI/UX Design System Spec)
**Dự án:** HSG Math Exam Studio (Nền tảng Soạn thảo & Chế bản Đề thi Chuyên Toán THCS)  
**Mục tiêu:** Bản đặc tả kỹ thuật thiết kế giao diện (Design System Spec), bảng màu (Color Tokens), kiến trúc component và tương tác vi mô (Micro-interactions) đạt chuẩn Overleaf v2 / Cursor / Linear cho đội ngũ phát triển Frontend (Next.js 14 App Router, Tailwind CSS, CodeMirror 6 / Monaco).

---

## 1. Triết lý Thiết kế & Nguyên tắc Cốt lõi (Design Principles)

1. **Content-First (Ưu tiên Nội dung Đề thi):**
   - Giáo viên THCS soạn đề không phải là lập trình viên LaTeX chuyên nghiệp. Mọi macro cấu hình hệ thống (`\documentclass`, `\usepackage`, `\LogLayoutTelemetry`) phải được ẩn gọn gàng vào một khối banner thu gọn, đưa con trỏ chuột vào thẳng nội dung `Câu 1`, `Câu 2`... ngay khi mở trang.
2. **Tactile & Fluid (Phản hồi Xúc giác Tức thì):**
   - Mọi thao tác kéo co giãn khung nhìn (Split Resizer), gập mở Preamble, chuyển tab xem (Đề thi / Barem) phải mượt mà ở tần số 60fps, sử dụng API `setPointerCapture` để chống trượt chuột khi kéo qua canvas.
3. **Calibrated Elevation (Độ sâu Tương phản Chuẩn mực):**
   - Tờ giấy in A4 màu trắng tuyết (`#FFFFFF`) phải nổi bật như một trang giấy vật lý đặt trên mặt bàn xám trung tính (`#181C24` hoặc `#0F172A`), sử dụng đổ bóng đa lớp (layered elevation shadow) để giáo viên cảm nhận chính xác tỷ lệ lề và bố cục in ấn thực tế.

---

## 2. Kiến trúc Trình Soạn Thảo LaTeX: CodeMirror 6 vs. Monaco Editor

### 2.1. Bảng phân tích so sánh kỹ thuật
| Tiêu chí | CodeMirror 6 (`@uiw/react-codemirror`) (Khuyên dùng) | Monaco Editor (`@monaco-editor/react`) |
| :--- | :--- | :--- |
| **Kích thước Bundle** | **~120 KB** (Siêu nhẹ, tải trong chớp mắt) | **~5.5 MB** (Cồng kềnh, tải web worker riêng) |
| **Next.js 14 App Router** | **Hoàn hảo**: Chạy client component không lo lỗi SSR Hydration | **Dễ lỗi**: Cần `next/dynamic` với `ssr: false`, cấu hình webpack phức tạp |
| **Tùy biến Syntax LaTeX** | Dễ dàng mở rộng qua StreamParser / Lezer grammar | Khó can thiệp sâu vào tokenizer Monarch |
| **Hiệu năng cuộn** | Ảo hóa dòng (Virtualized rendering) cực nhanh | Tốt nhưng tốn nhiều bộ nhớ RAM |
| **Giao diện di động / iPad** | Hỗ trợ bàn phím ảo và cảm ứng tự nhiên | Trải nghiệm cảm ứng trên máy tính bảng kém |

### 2.2. Bảng mã màu Syntax Highlighting cho LaTeX Toán học
Áp dụng cơ chế Semantic Highlighting phân tách rõ giữa lệnh điều khiển và nội dung toán học:

```css
/* Token Palette cho LaTeX Editor */
--token-comment:      #64748B; /* Slate 500: Chú thích % (in nghiêng, độ mờ 70%) */
--token-structure:    #818CF8; /* Indigo 400: \begin, \end, \question, \section */
--token-macro:        #38BDF8; /* Sky 400: \dfrac, \sqrt, \heva, \hoac, \widehat */
--token-math-text:    #FCD34D; /* Amber 300: $x^2 + y^2 = 1$ (công thức toán rực rỡ) */
--token-math-bg:      rgba(245, 158, 11, 0.08); /* Nền vàng hổ phách nhẹ cho inline math */
--token-bracket:      #34D399; /* Emerald 400: Dấu ngoặc nhọn {} và ngoặc vuông [] */
--token-body:         #E2E8F0; /* Slate 200: Chữ tiếng Việt thông thường */
```

### 2.3. Cơ chế "Focus on Content" (Preamble Folding)
- **Vấn đề:** 30–50 dòng mã preamble kỹ thuật gây choáng ngợp cho giáo viên.
- **Giải pháp:**
  - Mặc định khởi tạo `isPreambleFolded = true`.
  - Hiển thị thanh banner thông minh:
    ```
    % ▸ [Cấu hình hệ thống & Macro Bộ GD&ĐT (38 dòng đã ẩn) — Bấm để mở rộng]
    ```
  - Khi bấm mở, khối Preamble hiển thị dạng Read-Only với nền xám tối hơn để nhắc nhở người dùng không cần sửa các macro này.
  - Cột số dòng (Line Numbers Gutter) tự động bù trừ offset (ví dụ dòng đầu tiên của `Câu 1` bắt đầu từ dòng 39) để đảm bảo đồng bộ 100% với log lỗi biên dịch của TeX Live.

---

## 3. Kiến trúc Khung Chia Đôi Co Giãn (Draggable Resizable Split Pane)

### 3.1. Kỹ thuật Pointer Capture chống trượt chuột (Emil Kowalski Pattern)
Khi giáo viên kéo nhanh con trỏ chuột qua khung PDF viewer (chứa thẻ `svg`, `iframe` hoặc `canvas`), trình duyệt thông thường sẽ mất sự kiện `mousemove` khiến thanh chia bị đơ.

**Giải pháp kỹ thuật bắt buộc:**
```tsx
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  // 1. Khóa con trỏ chuột vào phần tử Resizer
  e.currentTarget.setPointerCapture(e.pointerId);
  activePointerIdRef.current = e.pointerId;
  setIsDragging(true);
};

const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!isDragging || e.pointerId !== activePointerIdRef.current) return;
  const containerRect = containerRef.current.getBoundingClientRect();
  const rawRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
  // 2. Kẹp trong ngưỡng an toàn: Không cho phép thu nhỏ quá 28% hoặc lớn hơn 72%
  const clampedRatio = Math.min(72, Math.max(28, Math.round(rawRatio)));
  setSplitRatio(clampedRatio);
};

const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
  if (e.pointerId !== activePointerIdRef.current) return;
  e.currentTarget.releasePointerCapture(e.pointerId);
  activePointerIdRef.current = null;
  setIsDragging(false);
};
```

### 3.2. Chuyển đổi góc nhìn nhanh (1-Click Presets)
- Cụm nút Segmented Control trên Topbar cung cấp 3 trạng thái:
  - `Mã nguồn (100/0)`: Toàn màn hình cho việc gõ code tập trung.
  - `Song song (Split)`: Tỷ lệ linh hoạt (mặc định 48/52 hoặc 50/50).
  - `Bản in A4 (0/100)`: Toàn màn hình để duyệt in ấn và chấm thử.
- **Thao tác nhấp đúp (Double-click):** Nhấp đúp vào thanh chia Resizer sẽ tự động đưa tỷ lệ về chính xác `50/50`.

---

## 4. Bộ Trình Chiếu Trang In A4 Đẳng Cấp (Overleaf-Grade PDF Canvas)

### 4.1. Hiệu ứng Giấy in Vật lý (Physical Paper Metaphor)
- **Màu nền Canvas:** `#181C24` (Dark Neutral Slate của Overleaf) hoặc `#E2E8F0` (Light Slate).
- **Màu trang giấy A4:** Màu trắng tuyết `#FFFFFF` thuần khiết.
- **Đổ bóng đa lớp (Layered Elevation Shadow):**
  ```css
  box-shadow: 
    0 12px 32px -4px rgba(0, 0, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.25);
  border-radius: 3px;
  ```
- **Kích thước hiển thị:** Chiều rộng chuẩn A4 tương ứng $680\text{px}$ ở tỷ lệ 100% zoom (tỷ lệ chuẩn A4 $1:\sqrt{2} \approx 210\text{mm} \times 297\text{mm}$).

### 4.2. Thanh công cụ tài liệu (Document Canvas Bar)
- **Thu phóng thông minh:**
  - Nút `-` và `+` điều chỉnh zoom từng bước 10%.
  - `Fit Width`: Tự động tính toán chiều rộng cửa sổ hiện tại để phóng to trang A4 vừa khít mép ngang.
  - `Fit Page`: Thu nhỏ trang về khoảng 75–80% để giáo viên nhìn thấy trọn vẹn từ tiêu đề Quốc hiệu đến chân trang mà không cần cuộn.
- **Bộ lọc trang nhanh:** Chuyển đổi giữa `Đề chính thức (Trang 1)` $\leftrightarrow$ `Hướng dẫn chấm (Trang 2)` $\leftrightarrow$ `Tất cả 2 trang (Continuous Scroll)`.
- **Khay thu nhỏ trang (Thumbnail Sidebar):** Dải xem trước mép trái cho phép nhấp nhảy nhanh giữa các trang với viền sáng highlight (`ring-2 ring-indigo-500`).

### 4.3. Đồng bộ 2 chiều (SyncTeX-Style Highlight)
- Khi giáo viên nhấp chuột vào khối `Câu 4` trên trang giấy A4:
  1. Trình soạn thảo bên trái tự động cuộn đến vị trí dòng `\begin{question}...{Câu 4}`.
  2. Dòng tương ứng trong editor được tô sáng nền màu xanh Indigo mờ (`bg-indigo-500/10`).
  3. Badge hiển thị trên thanh trạng thái: `Đang chọn: Câu 4`.

---

## 5. Khung Chat AI Co-pilot Đa Phương Thức Gọn Gàng (Sleek Drawer)

### 5.1. Bố cục Ngăn kéo Nổi (Flyout Drawer)
- Không dùng tab toàn màn hình làm mất ngữ cảnh soạn thảo.
- Thiết kế dạng ngăn kéo trượt từ cạnh phải (`right-0`), bề rộng $380\text{px}$, hiệu ứng chuyển động `transition: transform 220ms cubic-bezier(0.32, 0.72, 0, 1)`.
- Phím tắt mở nhanh: `⌘K` (Mac) hoặc `Ctrl+I` / `Ctrl+K` (Windows).

### 5.2. Các tác vụ dàn trang thông minh 1-Click (Smart Action Chips)
Các nút chip thanh mảnh đặt ngay dưới header của Drawer:
1. `⚡️ Dồn 1 trang A4`: Tự động điều chỉnh giãn dòng (`line-spacing: 1.08`), co khoảng cách câu (`\vspace{-4pt}`) để 5 câu vừa khít 01 trang in A4.
2. `📐 Đưa hình sang phải`: Tự động bọc câu hình học vào bảng bố cục 2 cột không viền (Trái 65% Đề bài – Phải 35% TikZ).
3. `📏 Thu hẹp lề Bộ GD&ĐT`: Áp dụng chuẩn lề hành chính (Top 1.8cm, Bottom 1.8cm, Left 2.0cm, Right 1.8cm).
4. `✨ Sinh Barem 0.25đ`: Tự động phân rã các bước giải chi tiết và tính điểm vi mô trên Trang 2.

### 5.3. Hỗ trợ Dán ảnh Đa phương thức (`Ctrl + V`)
- Cho phép giáo viên chụp ảnh đề viết tay hoặc hình vẽ hình học trong sách bài tập, bấm `Ctrl + V` ngay tại ô chat.
- Hiển thị thẻ thumbnail xem trước có hiệu ứng viền phát sáng (`border-indigo-400/40 bg-indigo-500/15`) kèm nút xóa nhanh `X`.
- AI nhận diện OCR và tự động sinh code LaTeX tương ứng kèm hình vẽ TikZ.

---

## 6. Bảng Màu & Design Tokens Chuẩn (Dark IDE & Light Mode)

### 6.1. Bảng giá trị màu sắc chi tiết (Tailwind Tokens)
| Thành phần Giao diện | Dark IDE Token (Mặc định) | Light Mode Token | Vai trò Chức năng |
| :--- | :--- | :--- | :--- |
| **Topbar & Thanh trạng thái** | `#0B0F19` (`bg-[#0B0F19]`) | `#FFFFFF` (`bg-white`) | Khung điều hướng chính, chiều cao cố định $48\text{px}$ (`h-12`) |
| **Nền Code Editor** | `#0F141C` (`bg-[#0F141C]`) | `#FFFFFF` (`bg-white`) | Tone Slate tối dịu mắt, không dùng màu đen tuyền `#000` |
| **Cột Số dòng (Gutter)** | `#0C1017` (`text-slate-600`) | `#F8FAFC` (`text-slate-400`) | Căn phải, làm mờ để không gây phân tâm |
| **Dòng Editor đang chọn** | `rgba(99, 102, 241, 0.07)` | `rgba(99, 102, 241, 0.05)` | Highlight dòng con trỏ chuột đang đứng |
| **Nền PDF Canvas** | `#181C24` (`bg-[#181C24]`) | `#E2E8F0` (`bg-[#E2E8F0]`) | Tương phản làm nổi bật tờ giấy trắng A4 |
| **Mặt Giấy In A4** | `#FFFFFF` (`bg-white`) | `#FFFFFF` (`bg-white`) | Màu trắng in ấn vật lý chuẩn |
| **Đường viền Hairline** | `rgba(255, 255, 255, 0.07)` | `#E2E8F0` (`border-slate-200`) | Phân chia ranh giới 1px tinh tế giữa các khung |
| **Màu nhấn chính (Primary)**| `#6366F1` (Indigo 500) | `#4F46E5` (Indigo 600) | Nút hành động chính, tab đang chọn |
| **Trạng thái Dịch Thành công** | `#10B981` (Emerald 500) | `#059669` (Emerald 600) | Nút Biên dịch và Badge đo đạc tốc độ TeX Live |

### 6.2. Kiểu chữ (Typography Hierarchy)
- **Giao diện người dùng (UI):** `Inter` hoặc `Plus Jakarta Sans` (Font weight: `400` cho nhãn phụ, `500` cho nút bấm, `600` cho tiêu đề).
- **Mã nguồn LaTeX:** `JetBrains Mono` hoặc `Fira Code` (Font size: $13\text{px}$, Line-height: $24\text{px}$).
- **Nội dung Đề thi A4:** Font Serif có chân in ấn chuẩn Bộ GD&ĐT: `Times New Roman` (hoặc phông `mathptmx` của LaTeX).

---

## 7. Hướng dẫn Tích hợp Component vào Dự án Next.js 14

### 7.1. Cài đặt thư viện phụ thuộc
```bash
npm install lucide-react clsx tailwind-merge
# Nếu nâng cấp lên CodeMirror 6 hoàn chỉnh:
npm install @uiw/react-codemirror @codemirror/language
```

### 7.2. Cấu hình Tailwind CSS (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          dark: '#0B0F19',
          editor: '#0F141C',
          canvas: '#181C24',
          gutter: '#0C1017',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Times New Roman', 'serif'],
      }
    },
  },
  plugins: [],
}
```

### 7.3. Nhúng component vào Page Route (`app/studio/page.tsx`)
```tsx
// app/studio/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Khuyến nghị nạp dynamic client-side để tối ưu tốc độ render ban đầu
const ExamStudioView = dynamic(() => import('@/components/ExamStudioView'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-full bg-[#0B0F19] flex items-center justify-center text-slate-400 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
        Đang khởi tạo HSG Math Exam Studio...
      </div>
    </div>
  ),
});

export default function StudioPage() {
  return <ExamStudioView />;
}
```
