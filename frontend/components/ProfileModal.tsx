"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, School, Crown, X, Check, Mail, Sparkles, Building2, BookMarked, CheckCircle2 } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  subscription_tier: string;
  tenant_id: string;
}

interface Props {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: UserProfile) => void;
}

export default function ProfileModal({ user, isOpen, onClose, onUpdate }: Props) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [tenantId, setTenantId] = useState(user.tenant_id || "thcs_le_quy_don");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Đồng bộ state khi thông tin user thay đổi
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setTenantId(user.tenant_id || "thcs_le_quy_don");
    }
  }, [user]);

  if (!isOpen) return null;

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
          tenant_id: tenantId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
        setSuccessMsg("Cập nhật hồ sơ thành công!");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] border border-slate-200/90 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Luxury Academic Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-7 overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-xl border-2 border-indigo-400/40 shrink-0">
              {getInitials(fullName)}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-lg font-bold text-white tracking-tight truncate">
                {fullName || "Thầy/Cô Giáo"}
              </h3>
              <p className="text-xs text-indigo-200/90 flex items-center space-x-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0 text-indigo-300" />
                <span className="truncate">{user.email}</span>
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>Bản Quyền {user.subscription_tier}</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shadow-2xs">
                  <Shield className="w-3 h-3 text-emerald-300" />
                  <span>{user.role}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="p-7 space-y-5">
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
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
              placeholder="VD: Thầy Lê Hữu Vinh"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Đơn vị công tác / Không gian trường học
              </label>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                Multi-Tenancy
              </span>
            </div>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              <option value="thcs_le_quy_don">Trường THCS Chuyên Lê Quý Đôn</option>
              <option value="thcs_amsterdam">Trường THPT Chuyên Hà Nội - Amsterdam</option>
              <option value="so_gd_ha_tinh">Sở GD&ĐT Tỉnh Hà Tĩnh (Phòng Khảo Thí)</option>
              <option value="ttgd_vinh_phat">Trung Tâm Giáo Dục Vĩnh Phát</option>
              <option value="individual">Không gian cá nhân độc lập</option>
            </select>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
              💡 Đề thi và ngân hàng câu hỏi được cách ly và lưu trữ riêng biệt theo từng đơn vị trường học bạn đang chọn.
            </p>
          </div>

          {/* Entitlements Card */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <BookMarked className="w-4 h-4 text-indigo-600" />
              <span>Đặc quyền giáo viên ({user.subscription_tier})</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Số hóa không giới hạn</span>
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

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] active:scale-[0.98] transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span>{saving ? "Đang lưu thay đổi..." : "Lưu hồ sơ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
