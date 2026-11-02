# 🎨 ĐẶC TẢ KỸ THUẬT PHÒNG GIAO DIỆN STUDIO (`Dept_Frontend_Studio`)
## Module: `frontend`
**Phụ trách:** Trưởng phòng `Lead_Dept_Frontend_Studio` | **Chuyên viên:** `Worker_UIPreview`  
**Công ty:** VINH PHÁT (`dethi.ttgdvinhphat.com`) — Tập đoàn AI Holding OS

---

## 1. SỨ MỆNH & PHẠM VI TRÁCH NHIỆM
Phòng Giao diện Studio chịu trách nhiệm toàn diện về trải nghiệm người dùng (UX/UI), xây dựng giao diện tương tác Web Studio hiện đại trên nền Next.js 14 / React / Tailwind CSS. Đảm bảo giao diện xem trước trang in A4 trực quan, khả năng biên tập câu hỏi thời gian thực, đồng bộ dữ liệu tức thì xuống CSDL và cung cấp bộ công cụ khảo thí chuyên nghiệp cho giáo viên.

---

## 2. KIẾN TRÚC THÀNH PHẦN FRONTEND
```text
frontend/
├── app/
│   ├── page.tsx                # Trang chủ: Tổ hợp đề thi, chọn ma trận, chuyển tab Studio
│   └── layout.tsx              # Root Layout, font Inter/Cinzel, SEO metadata chuẩn sư phạm
├── components/
│   ├── ExamStudioView.tsx      # Không gian làm việc chính (Canvas 2 cột, Live Sync, Tabs)
│   ├── ExamSettingsModal.tsx   # Modal Hợp nhất Cài đặt & Bảo mật Khảo thí
│   ├── A4PaperPreview.tsx      # Bộ render trang in A4 bản địa (KaTeX, SVG, đa cột)
│   ├── MathRenderer.tsx        # Trình render công thức toán học KaTeX client-side
│   ├── RubricTablePreview.tsx  # Bảng barem chấm điểm chi tiết 0.25đ
│   └── HeaderNavLinks.tsx      # Điều hướng thương hiệu chuẩn VINH PHÁT
└── public/
    └── media/                  # Hình ảnh tài nguyên, phôi đề thi và logo VINH PHÁT
```

---

## 3. CÁC TÍNH NĂNG ĐỘT PHÁ ĐÃ TRIỂN KHAI

### A. Zero-Click Auto Load & Zero-Hang Live Preview
- Khi giáo viên truy cập Studio từ Generator hoặc chọn đề thi từ danh sách, hàm `loadExamItems()` tự động tải danh sách câu hỏi và kích hoạt ngay `compileLivePreview()` mà không cần giáo viên phải thao tác thêm.
- Tích hợp `AbortController` timeout 7s. Nếu backend TeX Engine bị quá tải, giao diện lập tức kích hoạt bộ render **Fallback A4 Client-Side** hoàn chỉnh, bảo đảm màn hình không bao giờ bị treo quay spinner vô tận.

### B. Header Studio Tinh Gọn & Modal Hợp Nhất (`ExamSettingsModal`)
Gom toàn bộ hơn 20 nút cấu hình phức tạp trên header cũ vào 3 tab trong một Modal duy nhất:
1. **Bố cục & In ấn A4**: Căn lề chuẩn Nghị định 30, cỡ chữ 10-13pt, chia 2 cột / 1 cột, giãn dòng.
2. **Tiêu đề Sở & Trường**: Tùy biến Sở GD&ĐT, Trường THPT, Tên kỳ thi, Mã đề thi, Ngày thi.
3. **Bảo mật & Barem Điểm**: Khóa câu hỏi VDC phân quyền, bước chia điểm 0.25đ, chống gian lận đề thi.

### C. Hỗ trợ Render Hình học Vector SVG Bản địa
Component `A4PaperPreview.tsx` tự động kiểm tra `figures_meta`:
- Nếu có `svg_data`: Render trực tiếp dưới dạng vector sắc nét 100%.
- Nếu có `relative_url`: Tải ảnh đã crop từ MinIO/S3.
- Tự động hiển thị chú thích hình vẽ (caption) bằng font chữ serif thanh lịch.

---

## 4. HƯỚNG DẪN KẾ THỪA CHO CÁC PHÒNG BAN & AI AGENT

### A. Cách nhúng `ExamStudioView` vào một trang hoặc dashboard mới
```tsx
import ExamStudioView from "@/components/ExamStudioView";

export default function ExamEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full h-screen overflow-hidden">
      <ExamStudioView 
        examId={params.id} 
        onBack={() => window.history.back()} 
      />
    </div>
  );
}
```

### B. Cách mở `ExamSettingsModal` từ một component độc lập
```tsx
import { useState } from "react";
import ExamSettingsModal from "@/components/ExamSettingsModal";

export function HeaderActionArea() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerConfig, setHeaderConfig] = useState({
    school_name: "TRUNG TÂM GIÁO DỤC VINH PHÁT",
    department_name: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
    exam_title: "KHẢO SÁT CHẤT LƯỢNG MÔN TOÁN",
    exam_code: "101",
    duration_minutes: 90
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Cài đặt Đề thi</button>
      <ExamSettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        headerConfig={headerConfig}
        onSaveHeader={(cfg) => setHeaderConfig(cfg)}
      />
    </>
  );
}
```

### C. Quy tắc thương hiệu bắt buộc (Brand Guidelines)
Mọi component hoặc trang mới kế thừa từ frontend phải:
- Dùng tên thương hiệu: **VINH PHÁT** (tuyệt đối không viết thành "VĨNH PHÁT").
- Màu nhận diện chủ đạo: Xanh Navy (`#1E3A8A` - Slate/Indigo) kết hợp Emerald (`#059669`) cho điểm barem đạt chuẩn.
