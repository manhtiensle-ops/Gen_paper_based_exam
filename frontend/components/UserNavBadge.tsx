"use client";

import React, { useState, useEffect } from "react";
import ProfileModal from "@/components/ProfileModal";

export default function UserNavBadge() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUserProfile(data);
      })
      .catch((err) => console.error("Fetch profile error:", err));
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "GV";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getTenantName = (tId: string) => {
    switch (tId) {
      case "thcs_le_quy_don":
        return "THCS Chuyên Lê Quý Đôn";
      case "thcs_amsterdam":
        return "THPT Chuyên Hà Nội - Amsterdam";
      case "so_gd_ha_tinh":
        return "Sở GD&ĐT Hà Tĩnh";
      case "ttgd_vinh_phat":
        return "TTGD Vinh Phát";
      default:
        return "Cá nhân";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2.5 bg-slate-50 hover:bg-white px-3 py-1.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group text-left"
        title="Nhấn để xem và chỉnh sửa Hồ sơ cá nhân"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 group-hover:from-indigo-700 group-hover:to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm transition-all border border-indigo-400/40">
          {getInitials(userProfile?.full_name)}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 leading-none transition-colors">
            {userProfile?.full_name || userProfile?.email?.split("@")[0] || "Đang tải hồ sơ..."}
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold leading-none mt-1 flex items-center space-x-1">
            <span>{getTenantName(userProfile?.tenant_id)}</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{userProfile?.subscription_tier || "PRO"}</span>
          </div>
        </div>
      </button>

      {userProfile && (
        <ProfileModal
          isOpen={isOpen}
          user={userProfile}
          onClose={() => setIsOpen(false)}
          onUpdate={(updated) => setUserProfile(updated)}
        />
      )}
    </>
  );
}
