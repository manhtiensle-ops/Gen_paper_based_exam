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
  RotateCcw
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
            width: "210mm",
            minHeight: "297mm",
          }}
          className="bg-white shadow-xl rounded-sm p-[18mm] text-slate-900 font-serif leading-relaxed transition-transform duration-150 print:shadow-none print:transform-none print:w-full print:p-0"
        >
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
              <p className="font-bold text-slate-900 mt-1 text-[11px]">
                Mã đề: <span className="px-1.5 py-0.5 border border-slate-800 rounded font-mono">{examCode}</span>
              </p>
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
              isTwoColumns
                ? "columns-1 md:columns-2 gap-[8mm] text-[12px] leading-normal"
                : "space-y-4 text-[13px] leading-relaxed"
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
