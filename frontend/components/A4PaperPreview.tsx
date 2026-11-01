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
  BookOpen
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
            isEyeCarePaper ? "bg-[#fbf7ee] text-stone-900 border-[#ebdcc4]" : "bg-white text-slate-900"
          } paper-sheet-elevation rounded-sm ${
            isBookletMode ? "p-[12mm]" : "p-[20mm]"
          } font-serif leading-relaxed transition-all duration-200 print:bg-white print:text-black print:shadow-none print:transform-none print:w-full print:p-0 ring-1 ring-slate-900/5 relative overflow-hidden`}
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
                  Mã đề: <span className="px-1.5 py-0.5 border border-slate-800 rounded font-mono">{examCode}</span>
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[9px] text-slate-600 print:border-slate-400">
                  <QrCode className="w-3.5 h-3.5 text-slate-800" />
                  <span className="font-mono">dethi.ttgdvinhphat.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Info Box */}
          <div className="flex justify-between items-center text-xs italic mb-4 pb-2 border-b border-dashed border-slate-300">
            <span>Họ và tên thí sinh: ............................................................................</span>
            <span>Số báo danh: .............................</span>
          </div>

          {/* Exam Body Container with Column Switch */}
          <div
            className={
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
                      ? "space-y-6 text-[14px] leading-loose"
                      : "space-y-4 text-[13px] leading-relaxed"
                  }`
            }
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exam Footer */}
          <div className="mt-8 pt-4 border-t border-slate-400 text-center text-xs italic text-slate-600">
            --- HẾT ---
            <p className="text-[10px] mt-0.5 text-slate-500">
              Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
