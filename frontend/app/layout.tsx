import "./globals.css";
import React from "react";
import UserNavBadge from "@/components/UserNavBadge";
import HeaderNavLinks from "@/components/HeaderNavLinks";

export const metadata = {
  metadataBase: new URL("https://dethi.ttgdvinhphat.com"),
  title: {
    default: "Giáo Dục Vinh Phát - Dạy Học & Luyện Thi HSG Toán | Đề Thi & Barem Điểm",
    template: "%s | Giáo Dục Vinh Phát",
  },
  description:
    "Trung tâm Giáo dục Vinh Phát — Đơn vị dạy học, bồi dưỡng học sinh giỏi và luyện thi chuyên Toán cấp 2 (Lớp 6, 7, 8, 9). Hệ thống số hóa đề thi thông minh, ngân hàng đề thi HSG có barem điểm chi tiết 0.25đ chuẩn Bộ GD&ĐT.",
  keywords: [
    "vinh phát",
    "giáo dục vinh phát",
    "dạy học vinh phát",
    "ttgd vinh phát",
    "trung tâm giáo dục vinh phát",
    "luyện thi hsg toán vinh phát",
    "đề thi vinh phát",
    "dethi vinhphat",
    "học toán vinh phát",
    "đề thi hsg toán 9",
    "đề thi học sinh giỏi toán thcs",
    "barem điểm toán 9",
    "luyện thi chuyên toán vào 10",
  ],
  authors: [{ name: "Giáo Dục Vinh Phát", url: "https://dethi.ttgdvinhphat.com" }],
  creator: "Giáo Dục Vinh Phát",
  publisher: "Giáo Dục Vinh Phát",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Giáo Dục Vinh Phát - Dạy Học, Khảo Thí & Tổ Hợp Đề Thi Toán HSG",
    description:
      "Trung tâm Giáo dục Vinh Phát: Dạy học chất lượng cao, ngân hàng đề thi HSG Toán THCS, chia mốc điểm 0.25đ chuẩn mực.",
    url: "https://dethi.ttgdvinhphat.com",
    siteName: "Giáo Dục Vinh Phát",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Giáo Dục Vinh Phát - Dạy Học & Luyện Thi HSG Toán",
    description: "Trung tâm Giáo dục Vinh Phát: Nền tảng khảo thí, dạy học và luyện thi HSG Toán cấp 2.",
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
        {/* Google Fonts: Be Vietnam Pro & JetBrains Mono chuẩn Việt hóa */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
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
              "@graph": [
                {
                  "@type": "EducationalOrganization",
                  "name": "Giáo Dục Vinh Phát",
                  "alternateName": ["Dạy Học Vinh Phát", "Trung Tâm Giáo Dục Vinh Phát", "TTGD Vinh Phát"],
                  "url": "https://dethi.ttgdvinhphat.com",
                  "description": "Trung tâm Dạy học & Luyện thi Toán Học Sinh Giỏi, Chuyên Toán cấp 2 tại Việt Nam.",
                  "knowsAbout": ["Toán Học Sinh Giỏi", "Khảo thí THCS", "Chuyên Toán 9", "Barem điểm chuẩn Sở"]
                },
                {
                  "@type": "WebSite",
                  "url": "https://dethi.ttgdvinhphat.com",
                  "name": "Dạy Học & Đề Thi Vinh Phát",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Giáo Dục Vinh Phát"
                  }
                }
              ]
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 group-hover:from-indigo-700 group-hover:to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 border border-indigo-400/30 transition-all">
                ∑
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 leading-tight tracking-tight transition-colors">
                  Giáo Dục Vinh Phát
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Dạy Học & Khảo Thí Đề Thi Toán HSG Cấp 2
                </p>
              </div>
            </a>
            <div className="flex items-center space-x-3">
              <HeaderNavLinks />

              <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloudflare Synced</span>
              </span>
              <UserNavBadge />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full mx-auto px-4 sm:px-6 py-4">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500 shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <p className="font-bold text-slate-800">Giáo Dục Vinh Phát — Dạy Học & Luyện Thi Toán HSG</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Trung tâm Dạy học Vinh Phát • Khảo thí & Tổ hợp đề thi học sinh giỏi Toán THCS • Barem điểm chuẩn Sở</p>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-semibold text-indigo-600">
              <a href="/gioi-thieu" className="hover:underline">Giới thiệu</a>
              <a href="/ho-tro" className="hover:underline">Hướng dẫn & Hỗ trợ</a>
              <a href="https://dethi.ttgdvinhphat.com/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:underline">Sitemap</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
