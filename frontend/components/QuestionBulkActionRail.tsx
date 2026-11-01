"use client";

import React from "react";
import {
  CheckSquare,
  Trash2,
  CheckCircle,
  FolderPlus,
  ShieldAlert,
  X,
  FileCheck
} from "lucide-react";

interface Props {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkVerify?: () => void;
  onBulkAddToExam?: () => void;
  onBulkDelete?: () => void;
  className?: string;
}

export default function QuestionBulkActionRail({
  selectedCount,
  onClearSelection,
  onBulkVerify,
  onBulkAddToExam,
  onBulkDelete,
  className = ""
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      <div className="flex items-center gap-2 border-r border-slate-700 pr-4">
        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
        <span className="text-sm font-medium">câu hỏi đã chọn</span>
      </div>

      <div className="flex items-center gap-2 text-xs font-medium">
        {onBulkAddToExam && (
          <button
            type="button"
            onClick={onBulkAddToExam}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Thêm vào đề</span>
          </button>
        )}

        {onBulkVerify && (
          <button
            type="button"
            onClick={onBulkVerify}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Duyệt câu hỏi</span>
          </button>
        )}

        {onBulkDelete && (
          <button
            type="button"
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 rounded-lg transition-colors shadow-sm text-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa bỏ</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white ml-2"
          title="Bỏ chọn tất cả"
        >
          <X className="w-3.5 h-3.5" />
          <span>Bỏ chọn</span>
        </button>
      </div>
    </div>
  );
}
