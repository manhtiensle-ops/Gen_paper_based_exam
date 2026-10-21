"use client";

import React, { useState } from "react";
import { User, Shield, School, Crown, X, Check, Mail, Sparkles } from "lucide-react";

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

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          tenant_id: tenantId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data);
        setSuccessMsg("Cập nhật hồ sơ thành công!");
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        alert("Lỗi khi cập nhật hồ sơ");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-lg border-2 border-indigo-400">
              {fullName ? fullName.slice(0, 2).toUpperCase() : "GV"}
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {fullName || "Thầy/Cô Giáo"}
              </h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Crown className="w-3 h-3" />
                  <span>Gói {user.subscription_tier}</span>
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Shield className="w-3 h-3" />
                  <span>{user.role}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ và tên giáo viên
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="VD: Thầy Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đơn vị / Trường học (Tenant Workspace)
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="thcs_le_quy_don">Trường THCS Chuyên Lê Quý Đôn</option>
              <option value="thcs_amsterdam">Trường THPT Chuyên Hà Nội - Amsterdam</option>
              <option value="so_gd_ha_tinh">Sở GD&ĐT Tỉnh Hà Tĩnh (Khảo thí)</option>
              <option value="ttgd_vinh_phat">Trung Tâm Giáo Dục Vĩnh Phát</option>
              <option value="individual">Không gian cá nhân độc lập</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Dữ liệu đề thi và ngân hàng câu hỏi được cách ly an toàn theo từng đơn vị trường học.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Quyền lợi tài khoản</span>
            </div>
            <ul className="text-slate-500 space-y-1 list-disc list-inside text-[11px]">
              <li>Số hóa không giới hạn tệp Word/PDF</li>
              <li>Tổ hợp đề thi Zero-Hallucination đa ma trận</li>
              <li>Barem chấm điểm vi mô 0.25đ & Xuất TeX Live Native</li>
              <li>Xuất file Word (.docx) công thức toán Microsoft OMML Native</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
