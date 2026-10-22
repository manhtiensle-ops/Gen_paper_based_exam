"use client";

import React, { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  ChevronLeft, 
  MoreVertical, 
  Trash2, 
  Layers,
  Sparkles
} from "lucide-react";

export interface ExamItemMeta {
  id: string;
  title: string;
  total_target_score: number;
  folder_id?: string | null;
  created_at: string;
  slots_count: number;
  has_template: boolean;
}

export interface FolderItem {
  id: string;
  name: string;
  parent_id?: string | null;
  color?: string;
}

interface Props {
  exams: ExamItemMeta[];
  folders: FolderItem[];
  selectedExamId?: string | null;
  selectedFolderId?: string | null;
  onSelectExam: (id: string) => void;
  onSelectFolder?: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onCreateExamInFolder?: (folderId: string | null) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ExamWorkspaceRail({
  exams,
  folders,
  selectedExamId,
  selectedFolderId,
  onSelectExam,
  onSelectFolder,
  onCreateFolder,
  onCreateExamInFolder,
  isCollapsed,
  onToggleCollapse,
}: Props) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    recent: true,
    root: true,
  });
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const toggleFolder = (key: string) => {
    setOpenFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  if (isCollapsed) {
    return (
      <div className="w-14 bg-white border-r border-slate-200/80 flex flex-col items-center py-4 justify-between shrink-0 select-none transition-all">
        <div className="flex flex-col items-center space-y-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Mở rộng danh mục đề thi"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-8 h-[1px] bg-slate-200" />
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold" title="Tổng số đề thi">
            {exams.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 sm:w-72 bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0 select-none transition-all">
      {/* 1. Header Toolbar */}
      <div className="h-12 border-b border-slate-100 px-4 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Thư Viện Đề Thi ({exams.length})
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setIsCreatingFolder(true)}
            className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            title="Tạo thư mục mới"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            title="Thu gọn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. New Folder Inline Input */}
      {isCreatingFolder && (
        <form onSubmit={handleCreateFolderSubmit} className="p-3 border-b border-indigo-100 bg-indigo-50/40 space-y-2">
          <input
            type="text"
            required
            autoFocus
            placeholder="Tên thư mục (VD: Đề thi thử 2026)..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
          <div className="flex items-center justify-end space-x-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="text-[11px] px-2 py-1 rounded text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="text-[11px] px-2.5 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Tạo
            </button>
          </div>
        </form>
      )}

      {/* 3. Tree Scroll Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Nhóm Gần Đây */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleFolder("recent")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Gần đây ({exams.slice(0, 5).length})</span>
            </div>
            {openFolders["recent"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openFolders["recent"] && (
            <div className="space-y-0.5 pl-2 border-l border-slate-200/80 ml-2">
              {exams.slice(0, 5).map((ex) => (
                <button
                  key={`recent-${ex.id}`}
                  type="button"
                  onClick={() => onSelectExam(ex.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                    selectedExamId === ex.id
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${selectedExamId === ex.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="truncate">{ex.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {ex.total_target_score}đ
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách Thư mục người dùng */}
        {folders.map((folder) => {
          const folderExams = exams.filter((e) => e.folder_id === folder.id);
          const isOpen = openFolders[folder.id];

          return (
            <div key={folder.id} className="space-y-1">
              <div className="flex items-center justify-between group/header px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-all">
                <button
                  type="button"
                  onClick={() => {
                    toggleFolder(folder.id);
                    if (onSelectFolder) onSelectFolder(folder.id);
                  }}
                  className="flex-1 flex items-center space-x-1.5 truncate text-left text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {isOpen ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{folder.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({folderExams.length})</span>
                </button>

                <div className="flex items-center space-x-0.5">
                  {onCreateExamInFolder && (
                    <button
                      type="button"
                      onClick={() => onCreateExamInFolder(folder.id)}
                      className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 transition-all cursor-pointer opacity-70 group-hover/header:opacity-100"
                      title={`Tạo đề mới trong ${folder.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFolder(folder.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-0.5 pl-2 border-l border-slate-200/80 ml-2">
                  {folderExams.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-1 px-2">Thư mục trống</p>
                  ) : (
                    folderExams.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelectExam(ex.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                          selectedExamId === ex.id
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate pr-1">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${selectedExamId === ex.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                          <span className="truncate">{ex.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {ex.total_target_score}đ
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Danh sách đề chưa phân loại (Root) */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => toggleFolder("root")}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 py-1 px-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-1.5">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Chưa phân loại ({exams.filter((e) => !e.folder_id).length})</span>
            </div>
            {openFolders["root"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openFolders["root"] && (
            <div className="space-y-0.5 pl-2 border-l border-slate-200/80 ml-2">
              {exams.filter((e) => !e.folder_id).map((ex) => (
                <button
                  key={`root-${ex.id}`}
                  type="button"
                  onClick={() => onSelectExam(ex.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                    selectedExamId === ex.id
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate pr-1">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${selectedExamId === ex.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span className="truncate">{ex.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {ex.total_target_score}đ
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
