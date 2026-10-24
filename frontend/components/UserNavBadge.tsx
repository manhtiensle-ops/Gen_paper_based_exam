"use client";

import React, { useState, useEffect, useRef } from "react";
import ProfileModal from "@/components/ProfileModal";
import { User, LogIn, LogOut, Settings, Shield, ChevronDown, Sparkles, ExternalLink } from "lucide-react";

export default function UserNavBadge() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Nếu người dùng đã chủ động đăng xuất
    const isLoggedOut = typeof window !== "undefined" && localStorage.getItem("hsg_logged_out") === "true";
    if (isLoggedOut) {
      setUserProfile(null);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUserProfile(data);
      })
      .catch((err) => console.error("Fetch profile error:", err));
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 250);
  };

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

  // Hàm chuyển hướng đến trang đăng nhập chuẩn của Cloudflare Access
  const handleLoginRedirect = () => {
    try {
      localStorage.removeItem("hsg_logged_out");
    } catch (e) {}
    // Endpoint xác thực chuẩn của ứng dụng trên domain
    window.location.href = "https://dethi.ttgdvinhphat.com/cdn-cgi/access/login";
  };

  // Hàm đăng xuất: xóa sạch cookie, lưu cờ logged_out, xóa session và reload
  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("hsg_logged_out", "true");
      document.cookie = "CF_Authorization=; Path=/; Domain=.ttgdvinhphat.com; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie = "CF_Authorization=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch (e) {}

    try {
      await fetch("https://dethi.ttgdvinhphat.com/cdn-cgi/access/logout", {
        method: "GET",
        mode: "no-cors",
        credentials: "include",
      });
    } catch (e) {}

    window.location.replace("https://dethi.ttgdvinhphat.com");
  };

  return (
    <>
      <div
        ref={dropdownRef}
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {userProfile ? (
          /* Nút Tài Khoản Chính Khi Đã Đăng Nhập (Hover / Click) */
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center space-x-2.5 bg-slate-50 hover:bg-white px-3 py-1.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer group text-left"
            title="Tài khoản & Tùy chọn đăng nhập"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 group-hover:from-indigo-700 group-hover:to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm transition-all border border-indigo-400/40 shrink-0">
              {getInitials(userProfile?.full_name)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 leading-none transition-colors">
                {userProfile?.full_name || userProfile?.email?.split("@")[0] || "Đang tải hồ sơ..."}
              </div>
              <div className="text-[10px] text-indigo-700 font-semibold leading-none mt-1 flex items-center space-x-1">
                <span>{getTenantName(userProfile?.tenant_id)}</span>
                <span>•</span>
                <span className={`font-bold ${userProfile?.role === "PRO" ? "text-amber-600" : userProfile?.role === "VIP" ? "text-purple-600" : "text-emerald-600"}`}>
                  {userProfile?.role || "NORMAL"}
                </span>
                {!userProfile?.is_unlimited && (
                  <span className="text-slate-400 font-normal">
                    ({userProfile?.remaining_quota ?? 100} lượt)
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
        ) : (
          /* Nút Đăng Nhập Khi Đã Đăng Xuất (Chế độ Khách / Guest) */
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>
        )}

        {/* Menu Dropdown Xuất Hiện Phía Dưới Khi Đã Đăng Nhập */}
        {dropdownOpen && userProfile && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_35px_-5px_rgba(15,23,42,0.18)] border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* User Info Header inside menu */}
            <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
              <p className="text-xs font-bold text-slate-900 truncate">
                {userProfile?.full_name || "Thầy/Cô Giáo"}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {userProfile?.email}
              </p>
              <div className="flex items-center space-x-1.5 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${userProfile?.role === "PRO" ? "bg-amber-100 text-amber-800 border-amber-300/60" : userProfile?.role === "VIP" ? "bg-purple-100 text-purple-800 border-purple-300/60" : "bg-emerald-100 text-emerald-800 border-emerald-300/60"}`}>
                  ★ Gói {userProfile?.role || "NORMAL"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {userProfile?.is_unlimited ? "AI Vô hạn" : `AI: ${userProfile?.remaining_quota ?? 100}/${userProfile?.daily_quota ?? 100}`}
                </span>
              </div>
            </div>

            {/* Menu Actions */}
            <div className="space-y-0.5 px-1.5">
              {/* Nút Xem & Sửa Hồ Sơ */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setIsOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/70 flex items-center space-x-2.5 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Chỉnh sửa hồ sơ cá nhân</span>
              </button>

              {/* Nút Đăng nhập / Chuyển tài khoản Google */}
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center justify-between transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <LogIn className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Đổi tài khoản đăng nhập</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              <div className="my-1 border-t border-slate-100" />

              {/* Nút Đăng xuất */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2.5 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Đăng xuất khỏi thiết bị</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Profile */}
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
