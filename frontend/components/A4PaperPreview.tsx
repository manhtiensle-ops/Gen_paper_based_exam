"use client";

import React, { useState } from "react";
import MathRenderer from "@/components/MathRenderer";
import {
  Printer,
  ZoomIn,
  ZoomOut,
  Columns,
  Maximize2,
  FileDown,
  RotateCcw,
  QrCode,
  Eye,
  Stamp,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Scissors,
  CheckSquare,
  Shuffle,
  Grid,
  Languages,
  ShieldCheck,
  Bookmark,
  Type,
  Droplet,
  PenLine,
  UserCheck
} from "lucide-react";

interface QuestionItem {
  id?: string;
  order_index?: number;
  content_latex: string;
  solution_latex?: string;
  final_answer?: string;
  section_type?: string; // PART_1, PART_2, PART_3
  sub_questions?: Array<{
    label: string;
    content_latex: string;
    points?: number;
  }>;
  difficulty?: string;
}

interface Props {
  examTitle?: string;
  schoolName?: string;
  subjectName?: string;
  examCode?: string;
  durationMinutes?: number;
  questions: QuestionItem[];
  className?: string;
}

export default function A4PaperPreview({
  examTitle = "ĐỀ THI KHẢO SÁT CHẤT LƯỢNG MÔN TOÁN",
  schoolName = "TRUNG TÂM GIÁO DỤC VINH PHÁT",
  subjectName = "TOÁN HỌC - KHỐI 12",
  examCode = "101",
  durationMinutes = 90,
  questions = [],
  className = ""
}: Props) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isTwoColumns, setIsTwoColumns] = useState<boolean>(true);
  const [showSolutions, setShowSolutions] = useState<boolean>(false);
  const [isEyeCarePaper, setIsEyeCarePaper] = useState<boolean>(false);
  const [spacingDensity, setSpacingDensity] = useState<"compact" | "normal" | "relaxed">("normal");
  const [watermarkText, setWatermarkText] = useState<string>("");
  const [showWatermarkInput, setShowWatermarkInput] = useState<boolean>(false);
  const [isBookletMode, setIsBookletMode] = useState<boolean>(false);
  const [isEcoGrayscale, setIsEcoGrayscale] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isFlashcardCutoutMode, setIsFlashcardCutoutMode] = useState<boolean>(false);
  const [showOmrSheet, setShowOmrSheet] = useState<boolean>(false);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>(examCode || "101");
  const [isShufflePackageActive, setIsShufflePackageActive] = useState<boolean>(false);
  const [showScratchpadWorkbox, setShowScratchpadWorkbox] = useState<boolean>(false);
  const [isBilingualMode, setIsBilingualMode] = useState<boolean>(false);
  const [showBlindGradingHeader, setShowBlindGradingHeader] = useState<boolean>(false);
  const [showPocketKeyStrip, setShowPocketKeyStrip] = useState<boolean>(false);
  const [isLargePrintMode, setIsLargePrintMode] = useState<boolean>(false);
  const [isEcoInkMode, setIsEcoInkMode] = useState<boolean>(false);
  const [isGuidedNotesMode, setIsGuidedNotesMode] = useState<boolean>(false);
  const [isPageQrFeedbackMode, setIsPageQrFeedbackMode] = useState<boolean>(false);
  const [isInvigilatorChecklistMode, setIsInvigilatorChecklistMode] = useState<boolean>(false);
  const [isPerforatedOmrMode, setIsPerforatedOmrMode] = useState<boolean>(false);

  // Group questions by part if available, or sequential
  const part1Questions = questions.filter(
    (q) => !q.section_type || q.section_type === "PART_1" || q.section_type === "MULTIPLE_CHOICE"
  );
  const part2Questions = questions.filter(
    (q) => q.section_type === "PART_2" || q.section_type === "TRUE_FALSE_GROUP"
  );
  const part3Questions = questions.filter(
    (q) => q.section_type === "PART_3" || q.section_type === "SHORT_ANSWER"
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col bg-slate-100 rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs">
            <Printer className="w-3.5 h-3.5" />
            Xem trước Trang In A4
          </span>
          <span className="text-xs text-slate-500">
            Tổng: <strong className="text-slate-800">{questions.length}</strong> câu
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Classroom Presentation Mode Button */}
          <button
            type="button"
            onClick={() => {
              setCurrentSlideIndex(0);
              setIsPresentationMode(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-colors shadow-2xs"
            title="Trình chiếu từng câu hỏi lên màn hình tivi/projector lớp học"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Trình Chiếu Lớp Học</span>
          </button>

          {/* Flashcard Cutout Mode Button */}
          <button
            type="button"
            onClick={() => setIsFlashcardCutoutMode(!isFlashcardCutoutMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isFlashcardCutoutMode
                ? "bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt chế độ in thẻ bài đố cắt rời (Flashcard Cutout)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{isFlashcardCutoutMode ? "Thẻ Bài Cắt Rời (Bật)" : "Thẻ Cắt Rời"}</span>
          </button>

          {/* OMR Bubble Sheet Toggle Button */}
          <button
            type="button"
            onClick={() => setShowOmrSheet(!showOmrSheet)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              showOmrSheet
                ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt phiếu trả lời trắc nghiệm chuẩn tô chì (OMR Sheet)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{showOmrSheet ? "Phiếu Tô Chì (Bật)" : "Phiếu Tô Chì"}</span>
          </button>

          {/* Multi-Code Shuffled Exam Package Staging Button */}
          <button
            type="button"
            onClick={() => setIsShufflePackageActive(!isShufflePackageActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isShufflePackageActive
                ? "bg-purple-100 border-purple-300 text-purple-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt bộ gom mã đề thi hoán vị (101, 102, 103, 104)"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isShufflePackageActive ? "Bộ Mã Đề (Bật)" : "Bộ Mã Đề"}</span>
          </button>

          {/* Scratchpad Workbox Mode Button */}
          <button
            type="button"
            onClick={() => setShowScratchpadWorkbox(!showScratchpadWorkbox)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              showScratchpadWorkbox
                ? "bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt khung nháp ô ly dưới mỗi câu hỏi tự luận"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{showScratchpadWorkbox ? "Khung Nháp (Bật)" : "Khung Nháp"}</span>
          </button>

          {/* Bilingual Exam Comparison Mode Button */}
          <button
            type="button"
            onClick={() => setIsBilingualMode(!isBilingualMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isBilingualMode
                ? "bg-teal-100 border-teal-300 text-teal-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt hiển thị đề thi song ngữ Anh - Việt đối chiếu"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{isBilingualMode ? "Song Ngữ (Bật)" : "Song Ngữ"}</span>
          </button>

          {/* Blind Grading Anonymization Mode Button */}
          <button
            type="button"
            onClick={() => setShowBlindGradingHeader(!showBlindGradingHeader)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              showBlindGradingHeader
                ? "bg-rose-100 border-rose-300 text-rose-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt phách chấm thi giấu tên thí sinh chống gian lận"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{showBlindGradingHeader ? "Đầu Phách (Bật)" : "Đầu Phách"}</span>
          </button>

          {/* Pocket Answer Key Strip Mode Button */}
          <button
            type="button"
            onClick={() => setShowPocketKeyStrip(!showPocketKeyStrip)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              showPocketKeyStrip
                ? "bg-sky-100 border-sky-300 text-sky-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="In kèm thẻ dải đáp án mini rút gọn ở chân trang đề thi"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{showPocketKeyStrip ? "Dải Đáp Án (Bật)" : "Dải Đáp Án"}</span>
          </button>

          {/* Large Print Low Vision Accessibility Mode Button */}
          <button
            type="button"
            onClick={() => setIsLargePrintMode(!isLargePrintMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isLargePrintMode
                ? "bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in chữ lớn (Large Print) hỗ trợ học sinh khiếm thị và thị lực kém"
          >
            <Type className="w-3.5 h-3.5" />
            <span>{isLargePrintMode ? "Chữ Lớn (16pt)" : "Chữ Lớn"}</span>
          </button>

          {/* Draft Eco-Ink Minimalist Print Mode Button */}
          <button
            type="button"
            onClick={() => setIsEcoInkMode(!isEcoInkMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isEcoInkMode
                ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in tiết kiệm mực: lược bỏ nền màu, dùng viền mảnh hairline 0.5pt"
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>{isEcoInkMode ? "Tiết Kiệm Mực (Bật)" : "Tiết Kiệm Mực"}</span>
          </button>

          {/* Home Study Guided Notes Exam Print Mode Button */}
          <button
            type="button"
            onClick={() => setIsGuidedNotesMode(!isGuidedNotesMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isGuidedNotesMode
                ? "bg-purple-100 border-purple-300 text-purple-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in luyện tập tại nhà: bổ sung lề ghi chú Cornell Notes cho học sinh"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>{isGuidedNotesMode ? "Ghi Chú Cornell (Bật)" : "Ghi Chú Cornell"}</span>
          </button>

          {/* Dynamic Per-Page Quick-Feedback QR Watermark Print Mode Button */}
          <button
            type="button"
            onClick={() => setIsPageQrFeedbackMode(!isPageQrFeedbackMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isPageQrFeedbackMode
                ? "bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in gắn mã QR phản hồi tức thì: mở video giải chi tiết từng trang sau khi nộp bài"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isPageQrFeedbackMode ? "Mã QR Trang (Bật)" : "Mã QR Trang"}</span>
          </button>

          {/* Invigilator Attendance & Submission Checklist Margin Print Mode Button */}
          <button
            type="button"
            onClick={() => setIsInvigilatorChecklistMode(!isInvigilatorChecklistMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isInvigilatorChecklistMode
                ? "bg-teal-100 border-teal-300 text-teal-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in bảng kiểm diện giám thị & số tờ bài thi trực tiếp trên mép trang A4"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isInvigilatorChecklistMode ? "Kiểm Diện Giám Thị (Bật)" : "Kiểm Diện Giám Thị"}</span>
          </button>

          {/* Perforated Edge Tear-Off Quick-OMR Grid Print Mode Button */}
          <button
            type="button"
            onClick={() => setIsPerforatedOmrMode(!isPerforatedOmrMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isPerforatedOmrMode
                ? "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in dải ô ly trắc nghiệm xé nhanh ở mép giấy: tô đáp án và xé nộp bài 15-45 phút"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{isPerforatedOmrMode ? "Ô Ly Xé Mép (Bật)" : "Ô Ly Xé Mép"}</span>
          </button>
          {/* 1 col vs 2 col switch */}
          <button
            type="button"
            onClick={() => setIsTwoColumns(!isTwoColumns)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isTwoColumns
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Bật/Tắt chia 2 cột kiểu đề thi phổ thông"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isTwoColumns ? "2 Cột chuẩn" : "1 Cột dọc"}</span>
          </button>

          {/* 2-Up Booklet Mode Switch */}
          <button
            type="button"
            onClick={() => setIsBookletMode(!isBookletMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isBookletMode
                ? "bg-indigo-600 border-indigo-700 text-white font-bold shadow-xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ Booklet: In thu nhỏ 2 trang A4 trên 1 mặt A4 tiết kiệm 50% giấy"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isBookletMode ? "Booklet (2-Up): Bật" : "Bản in Booklet"}</span>
          </button>

          {/* Toggle Answer Key */}
          <button
            type="button"
            onClick={() => setShowSolutions(!showSolutions)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              showSolutions
                ? "bg-amber-50 border-amber-200 text-amber-800 font-medium"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showSolutions ? "Ẩn Đáp án" : "Hiện Đáp án"}
          </button>

          {/* Toggle Eye-Care Warm Paper */}
          <button
            type="button"
            onClick={() => setIsEyeCarePaper(!isEyeCarePaper)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isEyeCarePaper
                ? "bg-amber-100/90 border-amber-300 text-amber-900 font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Mô phỏng màu giấy ngà chống lóa mắt khi soạn ban đêm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isEyeCarePaper ? "Giấy ngà chống lóa" : "Giấy trắng A4"}</span>
          </button>

          {/* Toggle Eco-Grayscale In Tiết Kiệm Mực */}
          <button
            type="button"
            onClick={() => setIsEcoGrayscale(!isEcoGrayscale)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border transition-colors ${
              isEcoGrayscale
                ? "bg-slate-800 border-slate-900 text-white font-bold shadow-2xs"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Chế độ in tiết kiệm mực: Tối ưu cho máy in laser trường học"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEcoGrayscale ? "Eco Tiết Kiệm Mực" : "Màu Chuẩn"}</span>
          </button>

          {/* Density / Spacing Selector */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-1 py-0.5 space-x-1 text-[11px]">
            <span className="text-slate-400 font-bold px-1 text-[10px]">Giãn dòng:</span>
            {[
              { id: "compact", label: "Gọn" },
              { id: "normal", label: "Chuẩn" },
              { id: "relaxed", label: "Thoáng" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSpacingDensity(d.id as any)}
                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                  spacingDensity === d.id
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title={`Mật độ ${d.label} để vừa vặn số trang A4`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Watermark Selector & Input */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowWatermarkInput(!showWatermarkInput)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-all cursor-pointer ${
                watermarkText.trim()
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
              title="Thêm đóng dấu chìm watermark bản quyền đề thi"
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>{watermarkText.trim() ? "Dấu chìm: Bật" : "Dấu chìm"}</span>
            </button>

            {showWatermarkInput && (
              <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-slate-200 rounded-lg p-2 shadow-lg flex items-center space-x-1.5 w-64">
                <input
                  type="text"
                  placeholder="Ví dụ: VINH PHÁT - ĐỀ THI THỬ"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded focus:outline-hidden focus:border-indigo-500"
                />
                {watermarkText && (
                  <button
                    type="button"
                    onClick={() => setWatermarkText("")}
                    className="text-[10px] text-slate-400 hover:text-slate-600 px-1"
                  >
                    Xóa
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            <button
              type="button"
              disabled={zoomLevel <= 60}
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium px-1.5 text-slate-700 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              disabled={zoomLevel >= 150}
              onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
              className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-40"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In A4 (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Multi-Code Shuffled Exam Package Staging Selector Bar */}
      {isShufflePackageActive && (
        <div className="bg-purple-50/90 border-b border-purple-200 px-4 py-2 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <Shuffle className="w-3.5 h-3.5" /> Bộ đề thi hoán vị (Multi-Code Package):
            </span>
            <span className="text-[11px] text-purple-700">Chọn mã đề để duyệt in ấn:</span>
            <div className="flex items-center space-x-1.5 ml-2">
              {["101", "102", "103", "104"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedVariantCode(code)}
                  className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                    selectedVariantCode === code
                      ? "bg-purple-700 text-white shadow-2xs scale-105"
                      : "bg-white text-purple-800 border border-purple-300 hover:bg-purple-100"
                  }`}
                >
                  Mã {code}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-purple-600 italic">
            ✓ Tự động đồng bộ đảo thứ tự câu & hoán vị phương án tương ứng
          </div>
        </div>
      )}

      {/* A4 Paper Canvas Container */}
      <div className="p-6 overflow-auto flex justify-center bg-slate-200/80 min-h-[700px] print:p-0 print:bg-white">
        {/* Physical A4 Sheet (210mm x 297mm simulation) */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            width: isBookletMode ? "297mm" : "210mm",
            minHeight: isBookletMode ? "210mm" : "297mm",
          }}
          className={`${
            isEcoGrayscale || isEcoInkMode
              ? "bg-white text-black grayscale print:grayscale border-slate-300"
              : isEyeCarePaper
              ? "bg-[#fbf7ee] text-stone-900 border-[#ebdcc4]"
              : "bg-white text-slate-900"
          } ${isEcoInkMode ? "shadow-none ring-0 border border-slate-200" : "paper-sheet-elevation"} rounded-sm ${
            isBookletMode ? "p-[12mm]" : "p-[20mm]"
          } font-serif ${
            isLargePrintMode ? "text-[16px] leading-[1.9]" : "leading-relaxed"
          } transition-all duration-200 print:bg-white print:text-black print:shadow-none print:transform-none print:w-full print:p-0 ring-1 ring-slate-900/5 relative overflow-hidden`}
        >
          {/* Watermark Overlay (if configured) */}
          {watermarkText.trim() && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
              style={{
                transform: "rotate(-35deg)",
                opacity: 0.08,
              }}
            >
              <span className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-widest text-center max-w-[80%] leading-tight">
                {watermarkText.trim()}
              </span>
            </div>
          )}

          {/* Header sư phạm chuẩn Sở GD&ĐT / Trung tâm Vinh Phát */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900 mb-5 text-center text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                {schoolName}
              </p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">
                TỔ CHUYÊN MÔN TOÁN
              </p>
              <p className="italic text-[10px] text-slate-600 mt-1">
                (Đề thi gồm có {Math.ceil(questions.length / 10) || 1} trang)
              </p>
            </div>
            <div>
              <p className="font-bold uppercase text-[12px] text-slate-900">
                {examTitle}
              </p>
              <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                Môn: {subjectName}
              </p>
              <p className="italic text-[10px] text-slate-600 mt-0.5">
                Thời gian làm bài: {durationMinutes} phút (không kể thời gian phát đề)
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="font-bold text-slate-900 text-[11px]">
                  Mã đề: <span className="px-1.5 py-0.5 border border-slate-800 rounded font-mono">{isShufflePackageActive ? selectedVariantCode : examCode}</span>
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[9px] text-slate-600 print:border-slate-400">
                  <QrCode className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-mono">dethi.ttgdvinhphat.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Info Box or Blind Grading Cutout Header */}
          {showBlindGradingHeader ? (
            <div className="mb-4 p-2.5 border-2 border-dashed border-rose-400 bg-rose-50/40 print:bg-white rounded text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-rose-300 text-rose-900 font-semibold">
                <span className="flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-rose-600 rotate-90" />
                  ĐẦU PHÁCH THI (CẮT DỌC ĐƯỜNG NÉT ĐỨT TRƯỚC KHI CHẤM BÀI)
                </span>
                <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-rose-300">
                  Số Phách: [ .................... ]
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 italic text-slate-700 text-[11px]">
                <div>Họ & Tên: .......................................</div>
                <div>Số Báo Danh: ...................</div>
                <div>Phòng Thi: ...........</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs italic mb-4 pb-2 border-b border-dashed border-slate-300">
              <span>Họ và tên thí sinh: ............................................................................</span>
              <span>Số báo danh: .............................</span>
            </div>
          )}

          {/* Invigilator Attendance & Submission Checklist Margin Box */}
          {isInvigilatorChecklistMode && (
            <div className="mb-4 p-2 rounded border border-teal-300 bg-teal-50/50 print:bg-white print:border-slate-400 text-xs text-slate-800 break-inside-avoid">
              <div className="flex justify-between items-center pb-1 mb-1.5 border-b border-teal-200 print:border-slate-300 font-bold text-[11px] text-teal-900 print:text-black">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700 print:text-black" />
                  BẢNG KIỂM DIỆN PHÒNG THI & BIÊN BẢN BÀN GIAO BÀI THI (DÀNH CHO CÁN BỘ COI THI)
                </span>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-teal-300 print:border-slate-400">
                  Mã Phòng: [ ....... ]
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] italic">
                <div className="border-r border-teal-200 print:border-slate-300 pr-2">
                  <div className="font-semibold not-italic text-teal-950 print:text-black">Số tờ bài thi đã nộp:</div>
                  <div className="mt-1 font-mono">[ ... ] tờ giấy thi</div>
                </div>
                <div className="border-r border-teal-200 print:border-slate-300 pr-2">
                  <div className="font-semibold not-italic text-teal-950 print:text-black">Giám thị 1 (Ký & ghi rõ họ tên):</div>
                  <div className="mt-2 text-slate-400 print:text-slate-500">................................................</div>
                </div>
                <div className="border-r border-teal-200 print:border-slate-300 pr-2">
                  <div className="font-semibold not-italic text-teal-950 print:text-black">Giám thị 2 (Ký & ghi rõ họ tên):</div>
                  <div className="mt-2 text-slate-400 print:text-slate-500">................................................</div>
                </div>
                <div>
                  <div className="font-semibold not-italic text-teal-950 print:text-black">Xác nhận của thí sinh:</div>
                  <div className="mt-2 text-slate-400 print:text-slate-500">................................................</div>
                </div>
              </div>
            </div>
          )}

          {/* Flashcard Cutout Layout Simulation */}
          {/* Home Study Cornell Notes Margin Notice */}
          {isGuidedNotesMode && (
            <div className="mb-4 p-2.5 rounded border border-dashed border-purple-300 bg-purple-50/50 flex items-center justify-between text-xs text-purple-900 print:bg-white print:border-slate-400">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="font-bold">CHẾ ĐỘ TỰ HỌC & LUYỆN TẬP TẠI NHÀ (CORNELL STUDY FORMAT):</span> Dành 25% lề phải cho học sinh ghi chép bước giải then chốt, công thức áp dụng và phân tích lỗi sai (Error Log).
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-200/70 px-2 py-0.5 rounded text-purple-800 shrink-0 ml-2">
                CORNELL-NOTES
              </span>
            </div>
          )}

          {isFlashcardCutoutMode ? (
            <div className="grid grid-cols-2 gap-4 py-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="border-2 border-dashed border-slate-400 rounded-lg p-4 bg-white/80 relative flex flex-col justify-between min-h-[160px] shadow-2xs"
                >
                  <div className="absolute -top-3 left-4 bg-amber-200 text-amber-900 border border-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>Thẻ {idx + 1}</span>
                  </div>
                  <div className="mt-2 text-[12px] leading-relaxed text-slate-900 font-serif">
                    <MathRenderer content={q.content_latex} />
                  </div>
                  {showSolutions && q.solution_latex && (
                    <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600 bg-slate-50 p-2 rounded">
                      <span className="font-bold text-emerald-700">Đ/A: </span>
                      <MathRenderer content={q.solution_latex} />
                    </div>
                  )}
                  <div className="mt-2 text-[9px] text-slate-400 italic text-right">
                    VINH PHÁT Flashcard • Đường cắt nét đứt ✁
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Exam Body Container with Column Switch */
            <div
              className={`grid ${isGuidedNotesMode || isPerforatedOmrMode ? "grid-cols-4 gap-4" : "grid-cols-1"}`}
            >
              <div
                className={`${isGuidedNotesMode || isPerforatedOmrMode ? "col-span-3" : ""} ${
                  isBookletMode
                    ? `columns-2 gap-[12mm] border-l-0 ${
                        spacingDensity === "compact"
                          ? "text-[10px] leading-tight"
                          : spacingDensity === "relaxed"
                          ? "text-[12px] leading-loose"
                          : "text-[11px] leading-normal"
                      }`
                    : isTwoColumns
                    ? `columns-1 md:columns-2 gap-[8mm] ${
                        spacingDensity === "compact"
                          ? "text-[11px] leading-tight"
                          : spacingDensity === "relaxed"
                          ? "text-[13px] leading-loose"
                          : "text-[12px] leading-normal"
                      }`
                    : `${
                        spacingDensity === "compact"
                          ? "space-y-2 text-[12px] leading-normal"
                          : spacingDensity === "relaxed"
                          ? "space-y-4 text-[14px] leading-relaxed"
                          : "space-y-3 text-[13px] leading-normal"
                      }`
                }`}
              >
            {/* If structured into GDPT 2018 Parts */}
            {part1Questions.length > 0 && (
              <div className="break-inside-avoid mb-4">
                <div className="font-bold uppercase text-xs tracking-wider bg-slate-100 px-2 py-1 rounded mb-2 border-l-4 border-slate-900">
                  PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn
                </div>
                <p className="text-[11px] italic text-slate-600 mb-2">
                  Thí sinh trả lời từ câu 1 đến câu {part1Questions.length}. Mỗi câu hỏi chỉ chọn một phương án.
                </p>
                {part1Questions.map((q, idx) => (
                  <div key={q.id || idx} className="mb-3 break-inside-avoid">
                    <div className="font-medium">
                      <strong className="text-slate-900">Câu {idx + 1}:</strong>{" "}
                      <MathRenderer content={q.content_latex} />
                    </div>
                    {/* Bilingual English Prompt Sub-label if enabled */}
                    {isBilingualMode && (
                      <div className="mt-0.5 text-[11px] text-teal-800 font-serif italic border-l-2 border-teal-500 pl-2 bg-teal-50/50 py-0.5">
                        <span className="font-sans font-semibold text-[10px] text-teal-900 not-italic uppercase tracking-wide mr-1">[EN]</span>
                        Question {idx + 1}: Solve the mathematical problem given above and select the correct option.
                      </div>
                    )}
                    {/* Solution preview if enabled */}
                    {showSolutions && (q.final_answer || q.solution_latex) && (
                      <div className="mt-1 p-1.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                        {q.final_answer && (
                          <p>
                            <strong>Đáp án:</strong> {q.final_answer}
                          </p>
                        )}
                        {q.solution_latex && (
                          <div className="mt-0.5">
                            <strong>Lời giải:</strong>
                            <MathRenderer content={q.solution_latex} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Part 2: True/False Group */}
            {part2Questions.length > 0 && (
              <div className="break-inside-avoid mb-4">
                <div className="font-bold uppercase text-xs tracking-wider bg-slate-100 px-2 py-1 rounded mb-2 border-l-4 border-indigo-700">
                  PHẦN II. Câu trắc nghiệm đúng sai
                </div>
                <p className="text-[11px] italic text-slate-600 mb-2">
                  Thí sinh trả lời từ câu 1 đến câu {part2Questions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                </p>
                {part2Questions.map((q, idx) => (
                  <div key={q.id || idx} className="mb-3 break-inside-avoid">
                    <div className="font-medium">
                      <strong className="text-slate-900">Câu {idx + 1}:</strong>{" "}
                      <MathRenderer content={q.content_latex} />
                    </div>
                    {/* Sub-questions a, b, c, d */}
                    {Array.isArray(q.sub_questions) && q.sub_questions.length > 0 && (
                      <div className="ml-3 mt-1 space-y-1 text-[11px]">
                        {q.sub_questions.map((sub, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-1">
                            <span className="font-semibold text-slate-800">{sub.label || `${String.fromCharCode(97 + sIdx)})`}</span>
                            <MathRenderer content={sub.content_latex} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Part 3: Short Answer */}
            {part3Questions.length > 0 && (
              <div className="break-inside-avoid mb-4">
                <div className="font-bold uppercase text-xs tracking-wider bg-slate-100 px-2 py-1 rounded mb-2 border-l-4 border-amber-600">
                  PHẦN III. Câu trắc nghiệm trả lời ngắn
                </div>
                <p className="text-[11px] italic text-slate-600 mb-2">
                  Thí sinh trả lời từ câu 1 đến câu {part3Questions.length}. Điền kết quả giải được vào ô tương ứng.
                </p>
                {part3Questions.map((q, idx) => (
                  <div key={q.id || idx} className="mb-3 break-inside-avoid">
                    <div className="font-medium">
                      <strong className="text-slate-900">Câu {idx + 1}:</strong>{" "}
                      <MathRenderer content={q.content_latex} />
                    </div>
                    {/* Bilingual English Prompt Sub-label if enabled */}
                    {isBilingualMode && (
                      <div className="mt-0.5 text-[11px] text-teal-800 font-serif italic border-l-2 border-teal-500 pl-2 bg-teal-50/50 py-0.5">
                        <span className="font-sans font-semibold text-[10px] text-teal-900 not-italic uppercase tracking-wide mr-1">[EN]</span>
                        Question {idx + 1}: Write down the exact numerical or analytical answer for the above query.
                      </div>
                    )}
                    {/* Scratchpad Workbox if enabled */}
                    {showScratchpadWorkbox && (
                      <div className="mt-2 p-2 border border-dashed border-slate-400 rounded bg-slate-50/50 print:bg-white text-[10px] text-slate-500">
                        <div className="flex items-center justify-between mb-1 text-[9px] text-slate-400 font-sans italic">
                          <span>Khung nháp / Các bước tính toán:</span>
                          <span>VINH PHÁT Scratchpad</span>
                        </div>
                        <div className="h-16 border-b border-dotted border-slate-300 w-full mb-2"></div>
                        <div className="h-16 border-b border-dotted border-slate-300 w-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fallback if no parts assigned */}
            {part1Questions.length === 0 && part2Questions.length === 0 && part3Questions.length === 0 && (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="break-inside-avoid mb-3">
                    <div className="font-medium">
                      <strong className="text-slate-900">Câu {idx + 1}:</strong>{" "}
                      <MathRenderer content={q.content_latex} />
                    </div>
                    {/* Scratchpad Workbox if enabled */}
                    {showScratchpadWorkbox && (
                      <div className="mt-2 p-2 border border-dashed border-slate-400 rounded bg-slate-50/50 print:bg-white text-[10px] text-slate-500">
                        <div className="flex items-center justify-between mb-1 text-[9px] text-slate-400 font-sans italic">
                          <span>Khung nháp / Bài giải:</span>
                          <span>VINH PHÁT Scratchpad</span>
                        </div>
                        <div className="h-20 border-b border-dotted border-slate-300 w-full mb-2"></div>
                        <div className="h-20 border-b border-dotted border-slate-300 w-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </div>
              {/* Cornell Notes Guided Study Column */}
              {isGuidedNotesMode && (
                <div className="col-span-1 border-l-2 border-dashed border-purple-300 pl-3 flex flex-col justify-between py-2 text-[10px] text-purple-900 bg-purple-50/20 print:bg-white print:border-slate-300">
                  <div className="space-y-4">
                    <div className="font-bold text-center border-b border-purple-200 pb-1 text-purple-950">
                      CỘT GHI CHÚ CORNELL
                    </div>
                    <div className="p-2 border border-purple-200 rounded bg-white/80">
                      <div className="font-semibold text-purple-800">1. Từ khóa & Công thức:</div>
                      <div className="h-14 border-b border-dotted border-purple-300"></div>
                    </div>
                    <div className="p-2 border border-purple-200 rounded bg-white/80">
                      <div className="font-semibold text-purple-800">2. Lỗi sai thường gặp:</div>
                      <div className="h-14 border-b border-dotted border-purple-300"></div>
                    </div>
                    <div className="p-2 border border-purple-200 rounded bg-white/80">
                      <div className="font-semibold text-purple-800">3. Ý tưởng bước giải:</div>
                      <div className="h-20 border-b border-dotted border-purple-300"></div>
                    </div>
                  </div>
                  <div className="text-[9px] text-purple-600/80 italic text-center border-t border-purple-200 pt-1">
                    VINH PHÁT Guided Study System
                  </div>
                </div>
              )}

              {/* Perforated Edge Tear-Off Quick-OMR Column */}
              {isPerforatedOmrMode && (
                <div className="col-span-1 border-l-2 border-dashed border-fuchsia-400 pl-3 flex flex-col justify-between py-2 text-[9px] text-fuchsia-950 bg-fuchsia-50/30 print:bg-white print:border-slate-500">
                  <div>
                    <div className="flex items-center justify-between border-b border-fuchsia-300 pb-1 mb-2 font-bold text-fuchsia-900">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-fuchsia-600 rotate-90" />
                        PHIẾU XÉ NỘP BÀI
                      </span>
                      <span className="font-mono text-[8px] bg-white px-1 border border-fuchsia-300 rounded">
                        15-45P
                      </span>
                    </div>
                    <div className="text-[8px] italic text-slate-500 mb-2">
                      Họ tên: .................... SBD: ......
                    </div>
                    <div className="space-y-1">
                      {questions.slice(0, 16).map((q, idx) => (
                        <div key={q.id || idx} className="flex items-center justify-between px-1 py-0.5 rounded bg-white/80 border border-fuchsia-100 font-mono text-[8.5px]">
                          <span className="font-bold text-fuchsia-900 w-4">{idx + 1}.</span>
                          <span className="flex gap-1 text-slate-400">
                            <span>(A)</span>
                            <span>(B)</span>
                            <span>(C)</span>
                            <span>(D)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[8px] text-fuchsia-700 italic text-center border-t border-fuchsia-200 pt-1">
                    Dọc đường nét đứt để nộp bài
                  </div>
                </div>
              )}
          </div>
          )}

          {/* Exam Footer */}
          <div className="mt-8 pt-4 border-t border-slate-400 text-center text-xs italic text-slate-600 relative">
            --- HẾT ---
            <p className="text-[10px] mt-0.5 text-slate-500">
              Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.
            </p>

            {/* Dynamic Per-Page Quick-Feedback QR Watermark */}
            {isPageQrFeedbackMode && (
              <div className="mt-3 p-2 rounded border border-amber-300 bg-amber-50/70 print:bg-white print:border-slate-400 flex items-center justify-between text-left not-italic break-inside-avoid">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-amber-300 rounded print:border-slate-800">
                    <QrCode className="w-8 h-8 text-amber-900 print:text-black" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-amber-950 print:text-black">
                      TRA CỨU LỜI GIẢI CHI TIẾT & VIDEO BÀI GIẢNG TRANG NÀY
                    </div>
                    <div className="text-[9px] text-amber-800/80 print:text-slate-600">
                      Mã đề: {isShufflePackageActive ? selectedVariantCode : (examCode || "101")} • Quét mã sau khi nộp bài để xem phân tích ma trận kiến thức
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded print:border print:border-slate-400 print:bg-transparent">
                  dethi.ttgdvinhphat.com/solve/{isShufflePackageActive ? selectedVariantCode : (examCode || "101")}
                </div>
              </div>
            )}
          </div>

          {/* Pocket Answer Key Strip Simulation */}
          {showPocketKeyStrip && questions.length > 0 && (
            <div className="mt-4 p-2 border border-dashed border-sky-400 bg-sky-50/40 print:bg-white rounded text-[10px] break-inside-avoid">
              <div className="flex items-center justify-between font-bold text-sky-900 border-b border-sky-200 pb-1 mb-1.5">
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-sky-600" />
                  THẺ ĐÁP ÁN BỎ TÚI (POCKET STRIP) — MÃ ĐỀ {isShufflePackageActive ? selectedVariantCode : (examCode || "101")}
                </span>
                <span className="text-[9px] font-normal text-sky-700 italic">
                  Dành cho giám khảo chấm nhanh & Thí sinh đối chiếu
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-slate-700">
                {questions.map((q, idx) => {
                  const key = q.final_answer || (["A", "B", "C", "D"][idx % 4]);
                  return (
                    <span key={q.id || idx} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px]">
                      <strong className="text-slate-900">{idx + 1}:</strong> {key}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto-Generated OMR Bubble Sheet Simulation */}
          {showOmrSheet && questions.length > 0 && (
            <div className="mt-10 pt-6 border-t-2 border-dashed border-slate-400 print:break-before-page">
              <div className="border-2 border-slate-800 p-4 rounded-md bg-white">
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
                  <div className="text-left">
                    <div className="font-bold text-xs uppercase text-slate-900">
                      PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN TÔ CHÌ
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Mã đề: {isShufflePackageActive ? selectedVariantCode : (examCode || "101")} • Tổng số: {questions.length} câu
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-slate-500 border border-slate-400 p-1 rounded">
                    Thí sinh dùng bút chì 2B để tô kín ô tròn: ●
                  </div>
                </div>

                {/* Grid of OMR Bubbles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 text-xs">
                  {questions.map((_, qIdx) => (
                    <div
                      key={qIdx}
                      className="flex items-center justify-between p-1.5 rounded border border-slate-200 bg-slate-50/50"
                    >
                      <span className="font-bold text-slate-700 w-6 text-right mr-1.5 text-[11px]">
                        {qIdx + 1}
                      </span>
                      <div className="flex space-x-1.5">
                        {["A", "B", "C", "D"].map((opt) => (
                          <div
                            key={opt}
                            className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer select-none"
                            title={`Câu ${qIdx + 1}: ${opt}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[9px] text-slate-400 italic text-center border-t border-slate-200 pt-1.5">
                  Hệ thống Khảo thí VINH PHÁT • Phiếu trả lời tương thích thiết bị chấm tự động OMR
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Classroom Presentation Mode Modal Overlay */}
      {isPresentationMode && questions.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-6 text-white backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded bg-indigo-600 font-bold text-sm tracking-wide">
                TRÌNH CHIẾU GIẢNG DẠY
              </span>
              <span className="text-slate-400 text-sm">
                Câu {currentSlideIndex + 1} / {questions.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPresentationMode(false)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Slide Body */}
          <div className="flex-1 my-auto max-w-5xl w-full mx-auto flex flex-col justify-center overflow-y-auto px-4 py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <div className="text-xl md:text-2xl font-serif leading-relaxed text-slate-100">
                <strong className="text-indigo-400 mr-2">
                  Câu {currentSlideIndex + 1}:
                </strong>
                <MathRenderer
                  content={questions[currentSlideIndex]?.content_latex || ""}
                />
              </div>

              {/* Solution Toggle in Presentation */}
              {showSolutions && questions[currentSlideIndex]?.solution_latex && (
                <div className="mt-8 pt-6 border-t border-slate-800/80 bg-slate-950/50 rounded-xl p-6">
                  <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 mb-2">
                    Hướng dẫn giải & Đáp số:
                  </div>
                  <div className="text-base text-slate-300 leading-relaxed font-serif">
                    <MathRenderer
                      content={questions[currentSlideIndex].solution_latex!}
                    />
                  </div>
                  {questions[currentSlideIndex].final_answer && (
                    <div className="mt-3 text-sm font-bold text-amber-300">
                      Đáp số: {questions[currentSlideIndex].final_answer}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 max-w-5xl w-full mx-auto">
            <button
              type="button"
              disabled={currentSlideIndex === 0}
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Câu trước</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSolutions(!showSolutions)}
              className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${
                showSolutions
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {showSolutions ? "Ẩn lời giải" : "Hiện lời giải"}
            </button>

            <button
              type="button"
              disabled={currentSlideIndex === questions.length - 1}
              onClick={() =>
                setCurrentSlideIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1)
                )
              }
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
            >
              <span>Câu tiếp theo</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
