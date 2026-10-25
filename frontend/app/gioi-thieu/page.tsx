import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Award,
  Layers,
  Cpu
} from "lucide-react";

export const metadata = {
  title: "Giới Thiệu Nền Tảng Khảo Thí & Luyện Thi Toán HSG | Giáo Dục Vinh Phát",
  description:
    "Tìm hiểu về Trung tâm Giáo dục Vinh Phát — Hệ sinh thái số hóa, khảo thí tự động và luyện thi học sinh giỏi Toán THCS chuẩn quốc gia với công nghệ Zero-Hallucination và TeX Live.",
};

export default function GioiThieuPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 py-4 animate-in fade-in duration-300">
      {/* Schema.org AboutPage for Google SEO Entity Recognition */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "Giới thiệu Giáo Dục Vinh Phát",
            "description": "Trung tâm Giáo dục Vinh Phát — Đơn vị dạy học, khảo thí và bồi dưỡng Toán học sinh giỏi cấp 2 chuẩn mực tại Việt Nam.",
            "url": "https://dethi.ttgdvinhphat.com/gioi-thieu",
            "mainEntity": {
              "@type": "EducationalOrganization",
              "name": "Giáo Dục Vinh Phát",
              "alternateName": ["Dạy Học Vinh Phát", "TTGD Vinh Phát"],
              "url": "https://dethi.ttgdvinhphat.com",
              "email": "lienhe@ttgdvinhphat.com"
            }
          }),
        }}
      />
      {/* Breadcrumb & Navigation Back */}
      <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Bàn làm việc
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800">Giới thiệu hệ thống</span>
      </div>

      {/* Hero Banner: Identity & Vision */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NỀN TẢNG KHẢO THÍ TOÁN HỌC THẾ HỆ MỚI</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Giáo Dục Vinh Phát — Chuẩn Hóa Chế Bản & Khảo Thí Toán HSG Cấp 2
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Chúng tôi giải quyết bài toán cốt lõi của giáo viên bồi dưỡng học sinh giỏi: Chuyển đổi từ biên soạn thủ công mất hàng giờ sang hệ sinh thái tạo đề thi, chia barem điểm vi mô 0.25đ chuẩn mực và xuất bản tài liệu chuẩn Bộ GD&ĐT trong vài giây.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2"
            >
              <span>Vào Bàn Làm Việc Tạo Đề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ho-tro"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center space-x-2"
            >
              <span>Xem Hướng Dẫn Sử Dụng</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Comparative Matrix: Pain Points vs Solution */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sự Khác Biệt Giữa Cách Làm Cũ Và Giải Pháp Vinh Phát
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tối ưu hóa từng thao tác của giáo viên với công nghệ toán học thực chất
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cũ */}
          <div className="bg-rose-50/50 rounded-2xl p-6 border border-rose-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Biên Soạn & Cắt Dán Thủ Công Truyền Thống</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Mất 2–4 tiếng để tìm câu hỏi, chỉnh sửa số liệu và định dạng Word/MathType.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Công thức hay lỗi font, vỡ khung hình học phẳng khi in ấn hoặc gửi giữa các máy tính.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Tự chia thang điểm thủ công dễ bị lệch tổng điểm (không khớp 20.00đ hoặc 10.00đ).</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>Đề thi phân tán, khó quản lý cây thư mục và không có lịch sử tái sử dụng.</span>
              </li>
            </ul>
          </div>

          {/* Mới */}
          <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Hệ Thống Khảo Thí Giáo Dục Vinh Phát</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Thuật toán <strong>Zero-Hallucination</strong> ghép đề chuẩn ma trận chuyên đề trong 3 giây.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Xuất <strong>Native Word OMML</strong> & <strong>TeX Live PDF</strong> chất lượng cao, không dùng ảnh mờ.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Barem toán học khóa cứng theo mốc vi mô <strong>0.25 điểm</strong>, triệt tiêu lỗi lệch điểm.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Cây thư mục Workspace cá nhân lưu trữ đám mây, bảo mật dữ liệu độc lập.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Core Technological Pillars */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            4 Trụ Cột Kỹ Thuật Độc Quyền
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Được thiết kế riêng cho đặc thù đề thi toán phân loại THCS tại Việt Nam
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Zero-Hallucination SQL</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổ hợp câu hỏi từ ngân hàng thực tế qua chỉ mục vector và SQL quan hệ, không bịa công thức giả.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Barem Quanta 0.25đ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mô hình số nguyên bước chấm giúp tự động cân đối và bảo vệ tổng điểm tuyệt đối khi giáo viên điều chỉnh.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Native Word OMML</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trình xuất Word sử dụng cấu trúc toán bản địa Microsoft Office, cho phép chỉnh sửa trực tiếp sau khi tải về.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Turbo TeX Live RAM</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Biên dịch tài liệu trên bộ nhớ tmpfs với font chuẩn Times New Roman, xuất ảnh xem trước A4 trong 0.3 giây.
            </p>
          </div>
        </div>
      </div>

      {/* Contact & Organization Information */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Thông Tin Liên Hệ</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Trung Tâm Giáo Dục Vinh Phát
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Đơn vị chuyên sâu về dạy học, khảo thí và bồi dưỡng Toán học sinh giỏi lớp 6, 7, 8, 9 và luyện thi vào lớp 10 chuyên Toán.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Email Hỗ Trợ</p>
              <p className="text-slate-400">lienhe@ttgdvinhphat.com</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Tư Vấn & Hợp Tác</p>
              <p className="text-slate-400">0963.xxx.xxx (Hotline/Zalo)</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Nền Tảng Trực Tuyến</p>
              <p className="text-slate-400">dethi.ttgdvinhphat.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
