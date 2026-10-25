"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Info, HelpCircle } from "lucide-react";

export default function HeaderNavLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Workspace", icon: Layers },
    { href: "/gioi-thieu", label: "Giới thiệu", icon: Info },
    { href: "/ho-tro", label: "Hỗ trợ", icon: HelpCircle },
  ];

  return (
    <nav className="hidden md:flex items-center space-x-1 text-xs font-bold mr-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              isActive
                ? "bg-indigo-50 text-indigo-700 shadow-2xs border border-indigo-200/60"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
