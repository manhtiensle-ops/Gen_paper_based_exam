import React from "react";
import Link from "next/link";
import {
  HelpCircle,
  BookOpen,
  Layers,
  UploadCloud,
  Scale,
  Sparkles,
  Command,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

export const metadata = {
  title: "Trung Tâm Hỗ Trợ & Hướng Dẫn Sử Dụng | Giáo Dục Vinh Phát",
  description:
    "Cẩm nang hướng dẫn sử dụng chi tiết các tính năng: Tổ hợp đề thi, ngân hàng câu hỏi, số hóa tài liệu, chia barem 0.25đ và phím tắt Exam Studio.",
};

export default function HoTroPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Bàn làm việc
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800">Trung tâm hỗ trợ</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>CẨM NANG HƯỚNG DẪN THỰC HÀNH</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hướng Dẫn Sử Dụng Nền Tảng Khảo Thí Giáo Dục Vinh Phát
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          Tài liệu chuẩn hóa giúp thầy cô nắm vững quy trình tạo đề thi, quản lý kho lưu trữ cá nhân, chia nhỏ mốc điểm barem 0.25đ và khai thác trợ lý AI hiệu quả nhất.
        </p>
      </div>

      {/* Layout 2 Cột: Menu Nhanh & Nội Dung Chi Tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Menu Mục Lục Bên Trái */}
        <div className="lg:col-span-1 space-y-2">
          <div className="sticky top-20 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5 text-xs font-bold text-slate-600">
            <span className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider block mb-2 px-2">
              Danh Mục Hướng Dẫn
            </span>
            <a href="#to-hop-de" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              1. Tổ Hợp Đề Thi (Tab 1)
            </a>
            <a href="#ngan-hang" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              2. Ngân Hàng Câu Hỏi (Tab 2)
            </a>
            <a href="#so-hoa" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              3. Số Hóa Tài Liệu (Tab 3)
            </a>
            <a href="#exam-studio" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              4. Exam Studio & Barem (Tab 5)
            </a>
            <a href="#phim-tat" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              5. Bảng Phím Tắt Vàng
            </a>
            <a href="#faq" className="block px-2.5 py-1.5 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors">
              6. Câu Hỏi Thường Gặp (FAQ)
            </a>
          </div>
        </div>

        {/* Nội Dung Chi Tiết Bên Phải */}
        <div className="lg:col-span-3 space-y-8">
          {/* Section 1: Tổ Hợp Đề Thi */}
          <section id="to-hop-de" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-indigo-700">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                1. Hướng Dẫn Tổ Hợp Đề Thi Tự Động (Tab 1)
              </h2>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Cách 1 (1-Click Presets):</strong> Trên màn hình chờ, bấm nút <em>"Tổ hợp ngay →"</em> ở 1 trong 3 thẻ đề mẫu (*HSG 9 Chuẩn Quốc Gia 150p*, *Tuyển sinh Chuyên 120p*, *Khảo sát Đội tuyển*). Đề thi sẽ được lắp ráp ngay lập tức trong 2 giây.
              </p>
              <p>
                <strong>Cách 2 (Tự cấu hình ma trận):</strong> Ở cột giữa, chọn Khung ma trận (Blueprint), đặt tiêu đề đề thi và bấm nút tím <em>"Tổ hợp Đề thi Mới (Zero-Hallucination)"</em>.
              </p>
              <p>
                <strong>Đổi câu hỏi không ưng ý:</strong> Trên bản xem trước đề thi, mỗi câu hỏi đều có nút <em>"Đổi câu khác"</em>. Bấm nút này hệ thống sẽ tìm trong ngân hàng một câu tương đương cùng chủ đề và độ khó để thay thế.
              </p>
            </div>
          </section>

          {/* Section 2: Ngân Hàng Câu Hỏi */}
          <section id="ngan-hang" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-purple-700">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                2. Khai Thác Ngân Hàng Câu Hỏi & Kho Cá Nhân (Tab 2)
              </h2>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Thanh phân vùng dữ liệu:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>⭐ Của tôi:</strong> Chỉ hiển thị các câu hỏi do chính tài khoản của thầy cô tạo hoặc sao chép về.</li>
                <li><strong>📚 Mẫu chuẩn Vinh Phát:</strong> 60 câu hỏi hạt giống chuẩn mực quốc gia do trung tâm tuyển chọn sẵn.</li>
                <li><strong>Tất cả:</strong> Tổng hợp đầy đủ.</li>
              </ul>
              <p>
                <strong>Tính năng Sao chép về kho cá nhân:</strong> Khi xem câu hỏi mẫu, thầy cô bấm nút <em>"Sao chép"</em> để chuyển câu đó về kho riêng của mình. Sau khi sao chép, thầy cô có toàn quyền sửa số liệu, đổi lời giải tùy thích.
              </p>
              <p>
                <strong>Phân trang tốc độ cao:</strong> Mỗi trang hiển thị 10 câu hỏi, hỗ trợ đổi lên 20 hoặc 50 câu/trang ở góc phải phía dưới.
              </p>
            </div>
          </section>

          {/* Section 3: Số Hóa Tài Liệu */}
          <section id="so-hoa" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-emerald-700">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center font-bold">
                <UploadCloud className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                3. Tải Lên & Số Hóa Hàng Loạt Đề Thi (Tab 3)
              </h2>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Kéo thả đa tệp (Batch Upload):</strong> Thầy cô có thể chọn hoặc kéo thả cùng lúc nhiều file <code>.docx</code> hoặc <code>.pdf</code> vào vùng tải lên.
              </p>
              <p>
                Hệ thống sẽ chạy ngầm qua <strong>Celery Ingestion Worker</strong>: Render ảnh scan 300 DPI, bóc tách công thức Toán LaTeX, cắt hình vẽ hình học phẳng tự động và chuyển vào <em>Hàng đợi kiểm duyệt (Tab 4)</em>.
              </p>
            </div>
          </section>

          {/* Section 4: Exam Studio */}
          <section id="exam-studio" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-blue-700">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                4. Exam Studio: Chỉnh Sửa & Barem 0.25đ Chuẩn (Tab 5)
              </h2>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                <strong>Barem 0.25đ:</strong> Trong bảng barem 3 cột, mỗi bước giải toán đều có 2 nút bấm <code>+0.25đ</code> và <code>-0.25đ</code> để tăng giảm điểm số tức thời. Hệ thống tự động tính lại tổng điểm của câu và của cả đề thi.
              </p>
              <p>
                <strong>AI Barem tự động:</strong> Bấm nút <em>"AI Barem"</em> trên đầu mỗi câu, mô hình AI chuyên gia sẽ tự động đọc lời giải và phân rã thành các bước chấm vi mô 0.25đ chuẩn Bộ GD&ĐT.
              </p>
              <p>
                <strong>Xem trước bản in A4:</strong> Khung bên phải hiển thị tờ giấy A4 màu trắng tuyết sắc nét. Khi chỉnh sửa nội dung, chỉ cần nhấn <code>Ctrl + S</code>, TeX Live sẽ biên dịch lại bản in trong 0.3 giây.
              </p>
            </div>
          </section>

          {/* Section 5: Bảng Phím Tắt Vàng */}
          <section id="phim-tat" className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg border border-slate-800 space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-indigo-400">
              <Command className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                5. Bảng Phím Tắt Thao Tác Nhanh Trong Studio
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <span>Biên dịch lại bản in A4</span>
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-bold">Ctrl + S</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <span>Mở Trợ lý AI Layout Chat</span>
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-bold">Ctrl + K</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <span>Dán ảnh màn hình vào Trợ lý AI</span>
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-bold">Ctrl + V</kbd>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <span>Đóng bảng trượt / Modal</span>
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-indigo-300 font-bold">Esc</kbd>
              </div>
            </div>
          </section>

          {/* Section 6: FAQ */}
          <section id="faq" className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 scroll-mt-20">
            <div className="flex items-center space-x-3 text-amber-700">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center font-bold">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                6. Câu Hỏi Thường Gặp (FAQ)
              </h2>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900">Tài khoản Khách (GUEST) có dùng được AI không?</h3>
                <p>Khách vãng lai chưa đăng nhập có thể tổ hợp đề thi và xem câu hỏi mẫu bình thường. Tuy nhiên, các tính năng gọi AI (chia barem 0.25đ, OCR lời giải) yêu cầu đăng nhập tài khoản Google để nhận 100 lượt miễn phí mỗi ngày.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900">Hạn mức 100 lượt AI làm mới vào lúc nào?</h3>
                <p>Hệ thống tự động làm mới số lượt sử dụng về 100 vào đúng <strong>00:00 hàng ngày theo giờ Việt Nam (UTC+7)</strong>.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <h3 className="font-bold text-slate-900">File Word tải về có sửa được công thức Toán không?</h3>
                <p>Có. Hệ thống sử dụng engine Word OMML Native chuẩn Microsoft Office, toàn bộ công thức là đối tượng toán học gốc, không phải hình ảnh nên thầy cô có thể gõ sửa trực tiếp.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
