"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Shield,
  Crown,
  X,
  Check,
  Mail,
  Sparkles,
  BookMarked,
  CheckCircle2,
  LogOut,
  LogIn
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  subscription_tier: string;
  tenant_id: string;
  daily_quota?: number;
  used_today?: number;
  remaining_quota?: number;
  is_unlimited?: boolean;
}

interface Props {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: UserProfile) => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export default function ProfileModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  onLogout,
  onOpenLoginModal,
}: Props) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          full_name: fullName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
        setSuccessMsg("Cập nhật hồ sơ thành công!");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Lỗi khi cập nhật hồ sơ: ${err.detail || res.statusText}`);
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "GV";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex justify-center items-start overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Slide-Down Card trượt từ đỉnh xuống */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-200/90 overflow-hidden transform animate-in slide-in-from-top-6 duration-300 ease-out mt-4 sm:mt-10 mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Luxury Academic Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-7 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-xl border-2 border-indigo-400/40 shrink-0">
              {getInitials(fullName)}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {fullName || "Thầy/Cô Giáo"}
              </h3>
              <p className="text-xs text-indigo-200/90 flex items-center space-x-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                <span className="truncate">{user.email}</span>
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>Gói {user.role || "NORMAL"}</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <Shield className="w-3 h-3 text-emerald-300" />
                  <span>
                    {user.is_unlimited
                      ? "AI Vô hạn"
                      : `AI: ${user.remaining_quota ?? 100}/${user.daily_quota ?? 100}`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-5">
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center space-x-2.5 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Họ và tên hiển thị
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="VD: Thầy Lê Hữu Vinh"
            />
          </div>

          {/* Entitlements Card */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-indigo-600" />
                <span>Đặc quyền giáo viên ({user.role || "NORMAL"})</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-600">
                Làm mới 00:00 (VN)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Số hóa đề thi tự do</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Xuất Word OMML Native</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Barem mốc điểm 0.25đ</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Biên dịch TeX Live &lt;0.3s</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLoginModal();
                }}
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đổi tài khoản</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
