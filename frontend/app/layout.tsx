import "./globals.css";
import React from "react";
import UserNavBadge from "@/components/UserNavBadge";

export const metadata = {
  metadataBase: new URL("https://dethi.ttgdvinhphat.com"),
  title: {
    default: "HSG Math Exam Studio - Nền Tảng Biên Soạn & Tổ Hợp Đề Thi Toán HSG Cấp 2",
    template: "%s | HSG Math Exam Studio",
  },
  description:
    "Hệ thống số hóa đề thi thông minh, quản lý ngân hàng câu hỏi và tổ hợp đề thi chọn học sinh giỏi Toán THCS theo tiêu chuẩn Bộ GD&ĐT. Barem điểm vi mô 0.25đ, xuất Word OMML Native và TeX Live PDF chuẩn mực.",
  keywords: [
    "đề thi hsg toán 9",
    "đề thi học sinh giỏi toán thcs",
    "barem điểm toán 9",
    "tổ hợp đề thi toán",
    "đề thi chuyên toán vào 10",
    "toán 9 hà tĩnh",
    "toán 9 nghệ an",
    "đề thi hsg toán 8",
    "phần mềm trộn đề toán tự luận",
    "ttgd vĩnh phát",
    "hsg math studio",
  ],
  authors: [{ name: "Trung Tâm Giáo Dục Vĩnh Phát", url: "https://dethi.ttgdvinhphat.com" }],
  creator: "TTGD Vĩnh Phát",
  publisher: "TTGD Vĩnh Phát",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "HSG Math Exam Studio - Tạo Đề Thi & Barem Điểm Toán HSG Cấp 2",
    description:
      "Tổ hợp đề thi Zero-Hallucination, phân chia mốc điểm 0.25đ Sub-Row vMerge, xuất bản in TeX Live PDF và Word OMML native.",
    url: "https://dethi.ttgdvinhphat.com",
    siteName: "HSG Math Platform",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HSG Math Exam Studio - Nền Tảng Tạo Đề Toán HSG Cấp 2",
    description: "Tổ hợp đề thi Zero-Hallucination, barem vi mô 0.25đ chuẩn Bộ GD&ĐT.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
        {/* JSON-LD Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "HSG Math Exam Studio",
              "operatingSystem": "Web",
              "applicationCategory": "EducationalApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "VND",
              },
              "description":
                "Hệ thống số hóa đề thi thông minh, quản lý ngân hàng câu hỏi và tổ hợp đề thi chọn học sinh giỏi Toán THCS theo tiêu chuẩn Bộ GD&ĐT.",
              "author": {
                "@type": "Organization",
                "name": "Trung Tâm Giáo Dục Vĩnh Phát",
                "url": "https://dethi.ttgdvinhphat.com",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                ∑
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  HSG Math Exam Generator
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Ngân hàng & Tổ hợp đề Toán HSG Cấp 2 (Zero-Hallucination)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                ● Đã đồng bộ Cloudflare
              </span>
              <UserNavBadge />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-4 overflow-x-hidden">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-bold text-slate-700">HSG Math Exam Studio — Trung Tâm Giáo Dục Vĩnh Phát</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Nền tảng tạo đề thi học sinh giỏi Toán THCS • Barem điểm vi mô 0.25đ • Xuất Word & PDF chuẩn Bộ GD&ĐT</p>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-semibold text-indigo-600">
              <a href="#tinh-nang" className="hover:underline">Tính năng</a>
              <a href="#ma-tran" className="hover:underline">Khung ma trận</a>
              <a href="https://dethi.ttgdvinhphat.com/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:underline">Sitemap</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
