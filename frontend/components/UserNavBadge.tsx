"use client";

import React, { useState, useEffect } from "react";
import ProfileModal from "@/components/ProfileModal";

export default function UserNavBadge() {
  const [userProfile, setUserProfile] = useState<any>({
    id: "default_id",
    email: "giaovien.vinhphat@gmail.com",
    full_name: "Thầy/Cô Giáo",
    role: "TEACHER",
    subscription_tier: "PRO",
    tenant_id: "thcs_le_quy_don",
  });
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
        return "TTGD Vĩnh Phát";
      default:
        return "Cá nhân";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all cursor-pointer group text-left"
        title="Nhấn để xem và chỉnh sửa Hồ sơ cá nhân"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs transition-colors">
          {getInitials(userProfile?.full_name)}
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 leading-none">
            {userProfile?.full_name || "Thầy/Cô Giáo"}
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold leading-none mt-1">
            {getTenantName(userProfile?.tenant_id)} • {userProfile?.subscription_tier || "PRO"}
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
