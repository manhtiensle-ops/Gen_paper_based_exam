"use client";

import React from "react";
import { Sparkles, ArrowRight, BookOpen, Clock, Award, Compass, Layers } from "lucide-react";

interface QuickPreset {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  points: number;
  duration: number;
  questionCount: number;
  description: string;
  topics: string[];
}

interface Props {
  onSelectPreset: (blueprintNameKeyword: string) => void;
  isGenerating?: boolean;
}

export default function CreativeEmptyState({ onSelectPreset, isGenerating }: Props) {
  const PRESETS: QuickPreset[] = [
    {
      id: "preset-hsg9",
      title: "HSG 9 Chuẩn Quốc Gia / Cấp Tỉnh",
      tag: "ĐỀ KINH ĐIỂN",
      tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      points: 20.0,
      duration: 150,
      questionCount: 5,
      description: "Cấu trúc 5 bài tự luận chuẩn hóa Sở GD&ĐT: Đại số, Số học, Hình học phẳng 2 ý, Bất đẳng thức & Tổ hợp.",
      topics: ["Đại số", "Số học", "Hình phẳng", "BĐT Cực trị", "Tổ hợp"],
    },
    {
      id: "preset-chuyen10",
      title: "Tuyển Sinh Chuyên Toán Vào 10",
      tag: "PHÂN HÓA CAO",
      tagColor: "bg-rose-50 text-rose-700 border-rose-200/80",
      points: 10.0,
      duration: 120,
      questionCount: 5,
      description: "Tỷ lệ vàng 4 : 3 : 2 : 1 tuyển chọn học sinh vào các trường THPT Chuyên (Amsterdam, Lê Hồng Phong, Lam Sơn...).",
      topics: ["Căn thức", "PT Vô tỉ", "Hình phẳng", "Số học", "Cực trị"],
    },
    {
      id: "preset-doidt",
      title: "Khảo Sát Đội Tuyển Vòng 1",
      tag: "CHUYÊN SÂU",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200/80",
      points: 20.0,
      duration: 120,
      questionCount: 5,
      description: "Tập trung phân loại chuyên sâu tư duy số học đồng dư, phương trình nghiệm nguyên và hình học cực trị.",
      topics: ["Số chính phương", "Đồng dư", "Hình học phẳng", "BĐT", "Dirichlet"],
    },
  ];

  return (
    <div className="h-full flex flex-col justify-between p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Banner & SVG Mathematical Artwork */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Background Decorative SVG Math Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="math-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#math-grid)" />
            {/* Coordinate Axis & Parabola Curve */}
            <path d="M 50 160 Q 200 40 350 180 T 600 80" fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="200" cy="100" r="45" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
            <text x="380" y="70" fill="#c7d2fe" fontSize="48" fontFamily="serif" fontStyle="italic">∑</text>
            <text x="120" y="140" fill="#c7d2fe" fontSize="36" fontFamily="serif" fontStyle="italic">∫</text>
            <text x="480" y="130" fill="#c7d2fe" fontSize="28" fontFamily="serif">√Δ</text>
            <text x="280" y="45" fill="#c7d2fe" fontSize="26" fontFamily="serif">π</text>
          </svg>
        </div>

        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
            <span>PHÒNG CHỜ KHỞI TẠO ĐỀ THI SÁNG TẠO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
            Tổ Hợp Đề Thi Toán HSG THCS Chuẩn Quốc Gia
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thuật toán <span className="text-indigo-300 font-semibold">Zero-Hallucination</span> tự động quét ngân hàng câu hỏi thực tế, cân đối ma trận điểm số vi mô và bảo toàn nguyên khối các bài toán hình học phẳng.
          </p>
        </div>
      </div>

      {/* 2. Quick Matrix Presets Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Gợi Ý Nhanh 3 Bộ Khung Ma Trận Chuẩn (1-Click Presets)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Chọn để kích hoạt tổ hợp ngay lập tức
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)] hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.12)] hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.tagColor}`}>
                    {preset.tag}
                  </span>
                  <div className="flex items-center space-x-1 text-slate-400 text-[11px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{preset.duration}p</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {preset.title}
                </h4>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>

                {/* Topics pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {preset.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Score & Action button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {preset.points.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">điểm</span>
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onSelectPreset(preset.title)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs group-hover:shadow-md disabled:opacity-50"
                >
                  <span>Tổ hợp ngay</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Footer Guidance Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            Hoặc tùy chỉnh tiêu đề và chọn khung ma trận riêng ở bảng điều khiển bên trái, sau đó nhấn nút{" "}
            <strong className="text-slate-800">Tổ hợp Đề thi Mới</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono text-indigo-600 font-bold shrink-0 hidden sm:inline">
          100% Zero-Hallucination
        </span>
      </div>
    </div>
  );
}
