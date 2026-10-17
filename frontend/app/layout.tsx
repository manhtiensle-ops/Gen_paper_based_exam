import "./globals.css";
import React from "react";

export const metadata = {
  title: "HSG Math Platform - Hệ Thống Tạo Đề Toán HSG Cấp 2",
  description: "Hệ thống số hóa, kiểm duyệt và tổ hợp đề thi chọn học sinh giỏi Toán THCS theo tiêu chuẩn Bộ GD&ĐT",
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
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                ● Docker Local-First
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          HSG Math Platform © 2026 - Chuẩn Typography & Quy chuẩn Toán học THCS Việt Nam
        </footer>
      </body>
    </html>
  );
}
