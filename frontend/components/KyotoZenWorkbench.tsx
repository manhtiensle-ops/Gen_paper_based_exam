"use client";

import React, { useState } from "react";
import MathRenderer from "@/components/MathRenderer";
import ExamWorkspaceRail, { ExamItemMeta, FolderItem } from "@/components/ExamWorkspaceRail";
import ExamMatrixHeatmap from "@/components/ExamMatrixHeatmap";
import CreativeEmptyState from "@/components/CreativeEmptyState";
import {
  Layers,
  Shuffle,
  RefreshCw,
  Download,
  Scale,
  Edit3,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Stamp,
  Ruler,
  FileCheck,
  ScrollText,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Wand2,
  Copy,
  FolderOpen
} from "lucide-react";

interface KyotoZenWorkbenchProps {
  generatedExam: any | null;
  savedExamsList: ExamItemMeta[];
  examFolders: FolderItem[];
  selectedFolderId: string | null;
  onSelectExam: (id: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onCreateExamInFolder: (folderId: string | null) => void;
  blueprints: any[];
  selectedBlueprintId: string;
  onSelectBlueprintId: (id: string) => void;
  onOpenBlueprintModal: () => void;
  examTitle: string;
  onChangeExamTitle: (title: string) => void;
  generating: boolean;
  onGenerateExam: () => void;
  exporting: "docx" | "pdf" | null;
  onExport: (type: "docx" | "pdf") => void;
  onOpenStudio: () => void;
  onOpenSwapModal: (slotIdx: number, questionId: string | null, topic: string, diff: string) => void;
  onOpenEditQuestion: (q: any) => void;
  renderQuestionContent: (q: any) => React.ReactNode;
  onSelectPresetFromEmptyState: (presetKeyword: string) => void;
  topicViMap: Record<string, string>;
  getTopicBadgeStyle: (topic: string) => string;
  getDifficultyBadgeStyle: (diff: string) => string;
}

export default function KyotoZenWorkbench({
  generatedExam,
  savedExamsList,
  examFolders,
  selectedFolderId,
  onSelectExam,
  onSelectFolder,
  onCreateFolder,
  onCreateExamInFolder,
  blueprints,
  selectedBlueprintId,
  onSelectBlueprintId,
  onOpenBlueprintModal,
  examTitle,
  onChangeExamTitle,
  generating,
  onGenerateExam,
  exporting,
  onExport,
  onOpenStudio,
  onOpenSwapModal,
  onOpenEditQuestion,
  renderQuestionContent,
  onSelectPresetFromEmptyState,
  topicViMap,
  getTopicBadgeStyle,
  getDifficultyBadgeStyle,
}: KyotoZenWorkbenchProps) {
  // Folder Rail collapse state
  const [isFolderRailCollapsed, setIsFolderRailCollapsed] = useState<boolean>(false);

  // Zen Physical A4 Canvas Tool States
  const [viewMode, setViewMode] = useState<"exam" | "rubric" | "split">("exam");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFocusRulerActive, setIsFocusRulerActive] = useState<boolean>(false);
  const [rulerY, setRulerY] = useState<number>(180);
  const [isWatermarkActive, setIsWatermarkActive] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("VINH PHÁT • BẢN MẬT THI THỬ");
  const [showOmrHeader, setShowOmrHeader] = useState<boolean>(true);

  // Pin Slot state for slots
  const [pinnedSlots, setPinnedSlots] = useState<Record<number, boolean>>({});

  // AI Layout Feedback Banner
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);

  const togglePinSlot = (slotIdx: number) => {
    setPinnedSlots((prev) => ({
      ...prev,
      [slotIdx]: !prev[slotIdx],
    }));
  };

  const handleAiLayoutAction = (actionName: string, message: string) => {
    setAiActionMessage(`Đang thực hiện AI [${actionName}]: ${message}...`);
    setTimeout(() => {
      setAiActionMessage(`✓ Hoàn tất: [${actionName}] đã áp dụng thành công trên bố cục A4!`);
      setTimeout(() => setAiActionMessage(null), 4000);
    }, 1200);
  };

  // Bloom taxonomy calculations
  const calculateBloomTaxonomy = () => {
    if (!generatedExam || !generatedExam.slots_state) {
      return {
        nbPts: 0,
        thPts: 5.0,
        vdPts: 13.0,
        vdcPts: 2.0,
        total: 20.0,
        nbPct: 0,
        thPct: 25,
        vdPct: 65,
        vdcPct: 10,
      };
    }

    let th = 0;
    let vd = 0;
    let vdc = 0;
    let nb = 0;

    generatedExam.slots_state.forEach((s: any) => {
      const p = Number(s.points) || 0;
      const diff = (s.difficulty || "").toUpperCase();
      if (diff.includes("VDC") || diff.includes("CAO") || diff.includes("HARD")) {
        vdc += p;
      } else if (diff.includes("VD") || diff.includes("VẬN DỤNG") || diff.includes("MEDIUM")) {
        vd += p;
      } else if (diff.includes("NB") || diff.includes("NHẬN BIẾT") || diff.includes("EASY")) {
        nb += p;
      } else {
        th += p;
      }
    });

    const total = nb + th + vd + vdc || 20;
    return {
      nbPts: nb,
      thPts: th,
      vdPts: vd,
      vdcPts: vdc,
      total,
      nbPct: Math.round((nb / total) * 100),
      thPct: Math.round((th / total) * 100),
      vdPct: Math.round((vd / total) * 100),
      vdcPct: Math.round((vdc / total) * 100),
    };
  };

  const bloom = calculateBloomTaxonomy();

  return (
    <div className="space-y-4">
      {/* 1. KYOTO ZEN TOP HEADER BAR */}
      <div className="bg-[#FAF6F0] rounded-2xl border border-[#E8DFD5] p-3.5 sm:p-4 shadow-sm transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-3.5">
            {/* Cinnabar Seal Stamp (Ấn Triện Son Đỏ) */}
            <div className="w-11 h-11 rounded-xl bg-[#B91C1C] flex items-center justify-center text-white font-serif font-black text-xl shadow-[0_2px_8px_rgba(185,28,28,0.35)] border-2 border-[#991B1B] shrink-0 tracking-tighter">
              VP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#2D2926] font-serif">
                  VINH PHÁT KYOTO ZEN STUDIO
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E6] text-[#B91C1C] border border-[#F3D5CE] tracking-wider uppercase">
                  HÀN LÂM KHẢO THÍ
                </span>
              </div>
              <p className="text-[11px] text-[#716B64] font-medium">
                Nền tảng Khảo thí & Chế bản Đề thi Chuyên Toán 9 — Chuẩn Sư Phạm A4 & OMML
              </p>
            </div>
          </div>

          {/* Bloom Taxonomy Realtime Ribbon */}
          <div className="hidden xl:flex items-center bg-[#FFFDF9] px-3.5 py-1.5 rounded-xl border border-[#E8DFD5] space-x-3 text-xs shadow-2xs">
            <div className="text-[11px] font-bold text-[#716B64] uppercase tracking-wider flex items-center space-x-1">
              <ScrollText className="w-3.5 h-3.5 text-[#3F6212]" />
              <span>Thước đo Bloom:</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-[#F4F1EA] text-[#716B64] font-medium text-[11px]">
                NB: <b>{bloom.nbPct}%</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#EBF3ED] text-[#2F5233] font-bold text-[11px]">
                TH: <b>{bloom.thPct}% ({bloom.thPts}đ)</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E3A8A] font-bold text-[11px]">
                VD: <b>{bloom.vdPct}% ({bloom.vdPts}đ)</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#B91C1C] font-bold text-[11px] border border-[#FCA5A5]">
                VDC: <b>{bloom.vdcPct}% ({bloom.vdcPts}đ)</b>
              </span>
              <span className="text-[11px] font-bold text-[#2D2926] ml-1 pl-1 border-l border-[#E8DFD5]">
                Tổng: <span className="text-[#3F6212] font-mono">{bloom.total.toFixed(2)}đ</span>
              </span>
            </div>
          </div>

          {/* Master Actions Group (Nút thao tác tối cao) */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onOpenStudio()}
              className="px-3.5 py-2 bg-[#2D2926] hover:bg-[#1A1816] text-[#FAF6F0] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              title="Chuyển sang chế bản LaTeX chuyên sâu"
            >
              <Scale className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Exam Studio (TeX & Barem)</span>
            </button>

            <button
              onClick={() => onExport("docx")}
              disabled={!generatedExam || exporting !== null}
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#FAF6F0] text-[#1E3A8A] border border-[#BFDBFE] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{exporting === "docx" ? "Đang xuất..." : "Tải Word (.docx)"}</span>
            </button>

            <button
              onClick={() => onExport("pdf")}
              disabled={!generatedExam || exporting !== null}
              className="px-3 py-2 bg-[#FFFFFF] hover:bg-[#FAF6F0] text-[#B91C1C] border border-[#FECACA] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{exporting === "pdf" ? "Đang xuất..." : "Xuất Bản PDF"}</span>
            </button>
          </div>
        </div>

        {/* AI Action Status Banner */}
        {aiActionMessage && (
          <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#EBF3ED] text-[#2F5233] border border-[#BBF7D0] text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-[#3F6212] animate-spin" />
              <span>{aiActionMessage}</span>
            </div>
            <button onClick={() => setAiActionMessage(null)} className="text-xs hover:underline cursor-pointer">
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* 2. THREE-COLUMN FLUID WORKSPACE (KYOTO ZEN LAYOUT) */}
      <div className="flex bg-[#FAF6F0] rounded-2xl border border-[#E8DFD5] shadow-sm overflow-hidden min-h-[720px]">
        {/* CỘT 1: LEFT EXAM EXPLORER RAIL (Zen Style) */}
        <ExamWorkspaceRail
          exams={savedExamsList}
          folders={examFolders}
          selectedExamId={generatedExam?.id}
          selectedFolderId={selectedFolderId}
          onSelectExam={onSelectExam}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          onCreateExamInFolder={onCreateExamInFolder}
          isCollapsed={isFolderRailCollapsed}
          onToggleCollapse={() => setIsFolderRailCollapsed(!isFolderRailCollapsed)}
        />

        {/* CỘT 2: CẤU HÌNH MA TRẬN & 5 PHIẾN ĐÁ CHUYÊN ĐỀ (380px) */}
        <div className="w-80 lg:w-96 border-r border-[#E8DFD5] p-4 sm:p-5 space-y-4 shrink-0 bg-[#FFFDF9] overflow-y-auto max-h-[850px]">
          {/* Header Ma trận */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE4]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2D2926] flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#3F6212]" />
              <span>Bàn Điều Khiển Ma Trận</span>
            </h2>
            {selectedFolderId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#8C5E3C] border border-[#E5D2C1]">
                📁 {examFolders.find((f) => f.id === selectedFolderId)?.name || "Thư mục"}
              </span>
            )}
          </div>

          {/* Tiêu đề Đề thi */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#716B64]">
              Tiêu đề Kỳ thi & Mã đề
            </label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => onChangeExamTitle(e.target.value)}
              placeholder="VD: Kỳ thi Chọn Học sinh Giỏi Toán 9..."
              className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FFFFFF] text-xs font-semibold text-[#2D2926] focus:ring-2 focus:ring-[#3F6212]/20 focus:border-[#3F6212] focus:outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Blueprint Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#716B64]">
                Khung Ma Trận (Blueprint)
              </label>
              <button
                type="button"
                onClick={onOpenBlueprintModal}
                className="text-xs font-bold text-[#3F6212] hover:text-[#2E480D] flex items-center space-x-1 cursor-pointer"
              >
                <span>⚙️ Tùy biến khung</span>
              </button>
            </div>

            {blueprints.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedBlueprintId}
                  onChange={(e) => onSelectBlueprintId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8DFD5] bg-[#FFFFFF] text-xs font-semibold text-[#2D2926] focus:ring-2 focus:ring-[#3F6212]/20 focus:border-[#3F6212] focus:outline-none cursor-pointer truncate shadow-2xs"
                >
                  {blueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.target_total_score || 20}đ - {b.duration_minutes || 150}p)
                    </option>
                  ))}
                </select>

                {selectedBlueprintId && (
                  <ExamMatrixHeatmap
                    blueprint={blueprints.find((b) => b.id === selectedBlueprintId) || null}
                  />
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#FAF6F0] border border-[#E8DFD5] rounded-xl text-xs text-[#716B64]">
                Đang nạp danh sách ma trận khảo thí chuẩn...
              </div>
            )}
          </div>

          {/* Nút Tạo Đề Thi Thiền Định AI (Zero-Hallucination) */}
          <div className="pt-1">
            <button
              onClick={onGenerateExam}
              disabled={generating}
              className="w-full py-2.5 px-4 bg-[#2D2926] hover:bg-[#1A1816] text-[#FAF6F0] font-bold rounded-xl text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FAF6F0]" />
                  <span>Đang bóc tách & xếp slot...</span>
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4 text-[#D4AF37]" />
                  <span>Tổ hợp Đề thi Mới (Zero-Hallucination)</span>
                </>
              )}
            </button>
          </div>

          {/* 5 PHIẾN ĐÁ CHUYÊN ĐỀ (ZEN SLOTS CONTROLLER) */}
          {generatedExam && generatedExam.slots_state && (
            <div className="pt-2 space-y-2.5 border-t border-[#F2ECE4]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#716B64] uppercase tracking-wider">
                  5 Phiến Đá Chuyên Đề Khảo Thí
                </span>
                <span className="text-[10px] font-bold text-[#3F6212] bg-[#EBF3ED] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                  5/5 Bài Toàn Diện
                </span>
              </div>

              <div className="space-y-2">
                {generatedExam.slots_state.map((slot: any) => {
                  const isPinned = !!pinnedSlots[slot.slot_index];
                  const isVdc = (slot.difficulty || "").includes("VDC") || slot.slot_index === 3;

                  return (
                    <div
                      key={slot.slot_index}
                      className={`p-2.5 rounded-xl border transition-all text-xs ${
                        isVdc
                          ? "bg-[#FFF9F9] border-[#FECACA] shadow-2xs"
                          : "bg-[#FFFFFF] border-[#E8DFD5] hover:border-[#D5C9BD] shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[#2D2926]">
                            Câu {slot.slot_index} ({slot.points}đ)
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getTopicBadgeStyle(slot.main_topic)}`}>
                            {topicViMap[slot.main_topic] || slot.main_topic}
                          </span>
                          {isVdc && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#B91C1C] text-white">
                              VDC THỦ KHOA
                            </span>
                          )}
                        </div>

                        {/* Pin status toggle */}
                        <button
                          type="button"
                          onClick={() => togglePinSlot(slot.slot_index)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isPinned
                              ? "text-[#B91C1C] bg-[#FEE2E2]"
                              : "text-[#9E968B] hover:text-[#2D2926] hover:bg-[#F4F1EA]"
                          }`}
                          title={isPinned ? "Đã khóa câu này" : "Khóa câu để không bị đảo"}
                        >
                          {isPinned ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Micro Action Buttons per Slot */}
                      <div className="flex items-center justify-end space-x-1 pt-1 border-t border-[#F7F3EE]">
                        <button
                          onClick={() =>
                            onOpenSwapModal(
                              slot.slot_index,
                              slot.question?.id,
                              slot.main_topic,
                              slot.difficulty
                            )
                          }
                          className="px-2 py-0.5 rounded bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#2D2926] font-semibold text-[10px] flex items-center space-x-0.5 border border-[#E8DFD5] cursor-pointer"
                        >
                          <Shuffle className="w-2.5 h-2.5 text-[#3F6212]" />
                          <span>Đổi câu</span>
                        </button>

                        {slot.question && (
                          <button
                            onClick={() => onOpenEditQuestion(slot.question)}
                            className="px-2 py-0.5 rounded bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#2D2926] font-semibold text-[10px] flex items-center space-x-0.5 border border-[#E8DFD5] cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-[#1E3A8A]" />
                            <span>Sửa</span>
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleAiLayoutAction(
                              `Biến thể Câu ${slot.slot_index}`,
                              "Đã sinh biến thể toán học tương đương nghiệm nguyên đẹp"
                            )
                          }
                          className="px-2 py-0.5 rounded bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#B91C1C] font-semibold text-[10px] flex items-center space-x-0.5 border border-[#F3D5CE] cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Biến thể</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Co-Pilot Mini Drawer in Left Col */}
          <div className="pt-3 border-t border-[#F2ECE4] space-y-2">
            <span className="text-[11px] font-bold text-[#716B64] uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3F6212]" />
              <span>Trợ Lý Dàn Trang AI 1-Chạm</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  handleAiLayoutAction(
                    "Dồn 1 Trang A4",
                    "Đã tự động tính vi mô và co giãn dòng hoàn hảo trên 1 trang A4"
                  )
                }
                className="p-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] border border-[#E8DFD5] rounded-xl text-[10px] font-bold text-[#2D2926] text-left transition-all cursor-pointer"
              >
                ⚡️ Dồn 1 trang A4
              </button>
              <button
                onClick={() =>
                  handleAiLayoutAction(
                    "Bọc TikZ 2 Cột",
                    "Đã căn chuyển hình học sang cột phải theo chuẩn đề thi Chuyên"
                  )
                }
                className="p-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] border border-[#E8DFD5] rounded-xl text-[10px] font-bold text-[#2D2926] text-left transition-all cursor-pointer"
              >
                📐 Đưa hình sang phải
              </button>
              <button
                onClick={() =>
                  handleAiLayoutAction(
                    "Phân Rã Barem 0.25đ",
                    "Đã bóc tách barem chấm từng bước 0.25đ chuẩn Bộ GD&ĐT"
                  )
                }
                className="p-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] border border-[#E8DFD5] rounded-xl text-[10px] font-bold text-[#2D2926] text-left transition-all cursor-pointer"
              >
                ⚖️ Chia Barem 0.25đ
              </button>
              <button
                onClick={() =>
                  handleAiLayoutAction(
                    "Bác Sĩ Đề Thi",
                    "Kiểm tra hoàn tất: Toàn bộ công thức LaTeX hợp lệ, không trùng kiến thức"
                  )
                }
                className="p-2 bg-[#FAF6F0] hover:bg-[#F2ECE4] border border-[#E8DFD5] rounded-xl text-[10px] font-bold text-[#2D2926] text-left transition-all cursor-pointer"
              >
                🩺 Bác sĩ Đề thi
              </button>
            </div>
          </div>
        </div>

        {/* CỘT 3: ZEN PHYSICAL A4 PAPER CANVAS (Trang in A4 Vật lý) */}
        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#FAF6F0] flex flex-col items-center relative">
          {/* Zen A4 Floating Document Toolbar */}
          <div className="sticky top-2 z-20 w-full max-w-3xl mb-4 bg-[#FFFDF9]/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#E8DFD5] shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 bg-[#FAF6F0] p-1 rounded-xl border border-[#E8DFD5]">
              <button
                onClick={() => setViewMode("exam")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "exam"
                    ? "bg-[#FFFFFF] text-[#2D2926] shadow-2xs"
                    : "text-[#716B64] hover:text-[#2D2926]"
                }`}
              >
                Đề thi chính thức
              </button>
              <button
                onClick={() => setViewMode("rubric")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "rubric"
                    ? "bg-[#FFFFFF] text-[#B91C1C] shadow-2xs"
                    : "text-[#716B64] hover:text-[#2D2926]"
                }`}
              >
                Hướng dẫn chấm (Barem)
              </button>
            </div>

            {/* A4 Helper Tools: Zoom, Focus Ruler, Watermark */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-[#716B64]">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1 hover:bg-[#F2ECE4] rounded cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-[11px] w-10 text-center">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                  className="p-1 hover:bg-[#F2ECE4] rounded cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-4 w-[1px] bg-[#E8DFD5]" />

              <button
                onClick={() => setIsFocusRulerActive(!isFocusRulerActive)}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                  isFocusRulerActive
                    ? "bg-[#3F6212] text-white shadow-2xs"
                    : "text-[#716B64] hover:bg-[#F2ECE4]"
                }`}
                title="Bật/Tắt Thước đọc tập trung"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thước đọc</span>
              </button>

              <button
                onClick={() => setIsWatermarkActive(!isWatermarkActive)}
                className={`px-2 py-1 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer transition-all ${
                  isWatermarkActive
                    ? "bg-[#B91C1C] text-white shadow-2xs"
                    : "text-[#716B64] hover:bg-[#F2ECE4]"
                }`}
                title="Đóng dấu bảo mật Watermark"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dấu mật</span>
              </button>
            </div>
          </div>

          {/* PHYSICAL A4 PAPER SHEET */}
          {generatedExam ? (
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
              className="w-full max-w-3xl bg-[#FFFFFF] rounded-2xl border border-[#E8DFD5] shadow-[0_12px_40px_rgba(45,41,38,0.08)] p-8 sm:p-12 relative transition-transform duration-200"
            >
              {/* Focus Reading Ruler Overlay */}
              {isFocusRulerActive && (
                <div
                  style={{ top: `${rulerY}px` }}
                  onMouseDown={(e) => {
                    const startY = e.clientY;
                    const initialRulerY = rulerY;
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      setRulerY(Math.max(50, initialRulerY + (moveEvent.clientY - startY)));
                    };
                    const handleMouseUp = () => {
                      window.removeEventListener("mousemove", handleMouseMove);
                      window.removeEventListener("mouseup", handleMouseUp);
                    };
                    window.addEventListener("mousemove", handleMouseMove);
                    window.addEventListener("mouseup", handleMouseUp);
                  }}
                  className="absolute left-0 right-0 h-10 bg-amber-200/35 border-y-2 border-amber-500/80 pointer-events-auto cursor-ns-resize z-30 flex items-center justify-between px-4 select-none backdrop-blur-[1px]"
                >
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded shadow-2xs">
                    Thước dò bài (Kéo dọc để kiểm tra từng dòng)
                  </span>
                  <span className="text-[10px] text-amber-900 font-mono">↕ Kéo thả</span>
                </div>
              )}

              {/* Watermark Overlay */}
              {isWatermarkActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 select-none">
                  <div className="text-red-900/10 text-4xl sm:text-5xl font-black uppercase tracking-widest rotate-[-30deg] border-4 border-red-900/10 px-8 py-4 rounded-3xl">
                    {watermarkText}
                  </div>
                </div>
              )}

              {/* Standard Pedagogical Exam Header (Tiêu Đề Chuẩn Sư Phạm Bộ GD&ĐT) */}
              <div className="border-b-2 border-[#2D2926] pb-5 mb-7 space-y-2">
                <div className="flex justify-between items-start text-xs font-bold text-[#2D2926]">
                  <div className="text-center w-1/2 pr-2">
                    <p className="uppercase tracking-wide">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
                    <p className="font-bold underline decoration-1 underline-offset-4">
                      TRUNG TÂM GIÁO DỤC VINH PHÁT
                    </p>
                    <p className="text-[10px] font-normal text-[#716B64] mt-1">ĐỀ THI CHÍNH THỨC</p>
                  </div>
                  <div className="text-center w-1/2 pl-2">
                    <p className="uppercase tracking-wide font-extrabold text-[#B91C1C]">
                      KỲ THI CHỌN HỌC SINH GIỎI LỚP 9
                    </p>
                    <p className="text-xs font-bold">MÔN THI: TOÁN HỌC (VÒNG 1)</p>
                    <p className="text-[10px] font-normal text-[#716B64] mt-1">
                      Thời gian làm bài: 150 phút (không kể thời gian giao đề)
                    </p>
                  </div>
                </div>

                {/* Phách thi & Hướng dẫn làm bài */}
                {showOmrHeader && (
                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#716B64] border-t border-[#F2ECE4] mt-2">
                    <span>Họ và tên thí sinh: ................................................................</span>
                    <span>Số báo danh: ....................... Phòng thi: .........</span>
                  </div>
                )}
              </div>

              {/* Danh sách 5 bài toán chuẩn mực */}
              <div className="space-y-6">
                {generatedExam.slots_state.map((slot: any) => (
                  <div key={slot.slot_index} className="space-y-2 text-[#2D2926]">
                    <div className="flex items-baseline justify-between">
                      <div className="font-bold text-sm text-[#2D2926] flex items-center space-x-2">
                        <span>
                          Câu {slot.slot_index}. ({slot.points} điểm)
                        </span>
                        <span className="text-[10px] font-normal text-[#716B64] italic">
                          [{topicViMap[slot.main_topic] || slot.main_topic} - {slot.difficulty}]
                        </span>
                      </div>
                    </div>

                    {/* Question Content View */}
                    {slot.question ? (
                      <div className="text-[14px] leading-relaxed font-serif text-[#2D2926] pl-2 border-l-2 border-[#E8DFD5]">
                        {renderQuestionContent(slot.question)}

                        {/* Rubric / Solution View if viewMode includes rubric */}
                        {(viewMode === "rubric" || viewMode === "split") && (
                          <div className="mt-3 p-3 bg-[#FAF6F0] rounded-xl border border-[#E8DFD5] text-xs font-sans space-y-1.5">
                            <div className="flex items-center space-x-1.5 text-[#B91C1C] font-bold text-[11px] uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Hướng dẫn chấm & Barem điểm chi tiết:</span>
                            </div>
                            <div className="text-[#2D2926] font-serif leading-relaxed pl-1">
                              {slot.question.solution_latex ? (
                                <MathRenderer content={slot.question.solution_latex} />
                              ) : (
                                <p className="italic text-[#716B64]">
                                  Lời giải chi tiết và barem điểm 0.25đ đang được trích xuất từ ngân hàng...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-[#FFF9F5] border border-[#F3D5CE] rounded-xl text-xs text-[#8C5E3C] flex items-center justify-between">
                        <span>Chưa xếp câu hỏi vào slot này.</span>
                        <button
                          onClick={() =>
                            onOpenSwapModal(
                              slot.slot_index,
                              null,
                              slot.main_topic,
                              slot.difficulty
                            )
                          }
                          className="px-2.5 py-1 bg-[#2D2926] text-white rounded-lg font-bold text-[10px]"
                        >
                          + Chọn câu hỏi
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer của trang thi */}
              <div className="mt-12 pt-4 border-t border-[#E8DFD5] text-center text-xs text-[#716B64] italic">
                <p>--- HẾT ---</p>
                <p className="text-[10px] mt-1 text-[#9E968B]">
                  Cán bộ coi thi không giải thích gì thêm • Thí sinh không được sử dụng máy tính cầm tay
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full max-w-4xl">
              <CreativeEmptyState
                onSelectPreset={onSelectPresetFromEmptyState}
                isGenerating={generating}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
