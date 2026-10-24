"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowRight } from "lucide-react";

interface LoginSlideOverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginSlideOverModal({ isOpen, onClose }: LoginSlideOverModalProps) {
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      const timer = setTimeout(() => setAnimating(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if ((!isOpen && !animating) || !mounted) return null;

  const handleGoogleLogin = () => {
    try {
      localStorage.removeItem("hsg_logged_out");
    } catch (e) {}
    // Chuyển hướng tới cổng Google OAuth 2.0 trực tiếp của ứng dụng (ép chọn tài khoản thật, không auto SSO ẩn)
    window.location.href = "https://dethi.ttgdvinhphat.com/api/auth/google-login";
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex justify-center items-start transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop Mờ Kính phủ kín 100% toàn bộ viewport */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Trượt Từ Trên Xuống (Slide Down Panel) */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-b-3xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-200/90 overflow-hidden transform transition-all duration-300 ease-out mt-4 sm:mt-12 mb-8 ${
          isOpen ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thanh trang trí gradient trên đỉnh */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Nút Đóng Modal */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Brand & Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              ∑
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Giáo Dục Vinh Phát
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
              Đăng nhập tài khoản Google cá nhân để mở khóa quyền biên soạn & nhận hạn mức AI mỗi ngày
            </p>
          </div>

          {/* Quyền lợi tài khoản thật */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Đặc quyền sau khi đăng nhập:
            </span>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-700">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>100 lượt gọi AI/ngày</strong> (Chia barem 0.25đ, OCR lời giải)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Lưu trữ đề thi không giới hạn trong thư mục cá nhân</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Trợ lý AI Layout Chat trong Exam Studio (<kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Ctrl+K</kbd>)</span>
              </div>
            </div>
          </div>

          {/* Cụm Nút Đăng Nhập Bằng Google Chính Thống */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-300 hover:border-slate-400 shadow-sm hover:shadow transition-all font-bold text-sm flex items-center justify-center space-x-3 cursor-pointer group active:scale-95"
            >
              {/* Google SVG Logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.11-6.7-4.96H1.27v3.15C3.25 21.32 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.27 6.61l4.03 3.15c.94-2.85 3.58-4.96 6.7-4.96z"
                />
              </svg>
              <span>Tiếp tục với Google</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Ghi chú an toàn & chống nick ảo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Xác thực an toàn qua Google OAuth 2.0 • Không lưu mật khẩu</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
