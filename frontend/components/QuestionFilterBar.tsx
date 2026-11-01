"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  GraduationCap
} from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGrade: string;
  onGradeChange: (grade: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (diff: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  totalResults: number;
  onResetFilters: () => void;
  className?: string;
}

export default function QuestionFilterBar({
  searchQuery,
  onSearchChange,
  selectedGrade,
  onGradeChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedTopic,
  onTopicChange,
  totalResults,
  onResetFilters,
  className = ""
}: Props) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedGrade !== "ALL" ||
    selectedDifficulty !== "ALL" ||
    selectedTopic !== "ALL";

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3 ${className}`}>
      {/* Search Input Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm kiếm theo từ khóa LaTeX hoặc nội dung câu hỏi (ví dụ: f(x), tích phân, logarit...)"
            className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              title="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Total Badge & Reset */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium">
            Tìm thấy: <strong className="text-indigo-600">{totalResults}</strong> câu hỏi
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onResetFilters();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors font-medium"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        {/* Grade Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">Khối lớp:</span>
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
          >
            <option value="ALL">Tất cả các khối</option>
            <option value="GRADE_10">Khối 10 (GDPT 2018)</option>
            <option value="GRADE_11">Khối 11 (GDPT 2018)</option>
            <option value="GRADE_12">Khối 12 (Tốt nghiệp THPT)</option>
            <option value="DGNL">Đánh Giá Năng Lực (ĐGNL/ĐGTD)</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">Mức độ:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="EASY">1. Nhận biết (Dễ)</option>
            <option value="MEDIUM">2. Thông hiểu (Trung bình)</option>
            <option value="HARD">3. Vận dụng (Khá/Khó)</option>
            <option value="VERY_HARD">4. Vận dụng cao (Phân loại)</option>
          </select>
        </div>

        {/* Topic Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">Chuyên đề:</span>
          <select
            value={selectedTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
          >
            <option value="ALL">Tất cả chuyên đề</option>
            <option value="HAM_SO">Hàm số & Khảo sát đồ thị</option>
            <option value="MU_LOGARIT">Mũ & Logarit</option>
            <option value="NGUYEN_HAM_TICH_PHAN">Nguyên hàm & Tích phân</option>
            <option value="SO_PHUC">Số phức</option>
            <option value="HINH_KHONG_GIAN">Hình học không gian (Cổ điển)</option>
            <option value="OXYZ">Hình học Oxyz</option>
            <option value="XAC_SUAT_THONG_KE">Xác suất & Thống kê</option>
          </select>
        </div>
      </div>
    </div>
  );
}
