"use client";

import React, { useState } from "react";
import MathRenderer from "@/components/MathRenderer";
import { Sparkles, Plus, Trash2, RefreshCw, Check, AlertCircle } from "lucide-react";

interface GradingStep {
  step_id: string;
  latex_content: string;
  points: number | null;
  milestone_tag?: string | null;
  tikz_code?: string | null;
}

interface EssayQuestion {
  sub_label: string;
  total_points: number;
  prompt_latex: string;
  grading_steps: GradingStep[];
}

interface ShortAnswerQuestion {
  number: number;
  prompt_latex: string;
  short_answer_latex: string;
  solution_hint_latex?: string | null;
}

interface ExamDocument {
  metadata: {
    exam_title: string;
    grade_and_year: string;
    subject: string;
    duration_minutes: number;
    governing_body?: string;
    department_or_school?: string;
  };
  part1_short_answer?: {
    section_title: string;
    section_note: string;
    points_per_question: number;
    questions: ShortAnswerQuestion[];
  } | null;
  part2_essay: {
    section_title: string;
    section_note: string;
    questions: EssayQuestion[];
  };
}

interface Props {
  examId: string;
  templateDoc: ExamDocument;
  onUpdate: (updatedDoc: ExamDocument) => void;
  onRefreshFromItems?: () => void;
  onRecompile?: () => void;
}

export default function RubricTablePreview({
  examId,
  templateDoc,
  onUpdate,
  onRefreshFromItems,
  onRecompile,
}: Props) {
  const [loadingAiIndex, setLoadingAiIndex] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const essayQuestions = templateDoc.part2_essay?.questions || [];
  const shortAnswerQuestions = templateDoc.part1_short_answer?.questions || [];

  // Gọi AI sinh barem chi tiết cho 1 câu
  const handleAiGenerateRubric = async (qIdx: number) => {
    setLoadingAiIndex(qIdx);
    try {
      // Tìm item_id từ exam_items qua endpoint items
      const itemsRes = await fetch(`/api/studio/exams/${examId}/items`);
      if (!itemsRes.ok) throw new Error("Không thể tải danh sách câu hỏi");
      const items = await itemsRes.json();
      const targetItem = items[qIdx];
      if (!targetItem) throw new Error("Không tìm thấy câu hỏi tương ứng");

      const res = await fetch(`/api/studio/exams/${examId}/ai-generate-grading-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: targetItem.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Lỗi AI sinh barem");
      }

      const data = await res.json();
      const newSteps: GradingStep[] = (data.grading_steps || []).map((s: any, idx: number) => ({
        step_id: s.step_id || `s${idx + 1}`,
        latex_content: s.latex_content || "",
        points: s.points !== undefined ? s.points : 0.25,
        milestone_tag: s.milestone_tag || null,
        tikz_code: s.tikz_code || null,
      }));

      // Cập nhật câu hỏi trong templateDoc
      const updatedQuestions = [...essayQuestions];
      updatedQuestions[qIdx] = {
        ...updatedQuestions[qIdx],
        grading_steps: newSteps,
      };

      const updatedDoc = {
        ...templateDoc,
        part2_essay: {
          ...templateDoc.part2_essay,
          questions: updatedQuestions,
        },
      };

      onUpdate(updatedDoc);

      // Lưu lên server
      await fetch(`/api/studio/exams/${examId}/template-document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      });

      setSaveStatus("Đã sinh barem và lưu thành công!");
      if (onRecompile) onRecompile();
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      alert(e.message || "Lỗi sinh barem");
    } finally {
      setLoadingAiIndex(null);
    }
  };

  // Tăng / giảm điểm của một bước (bước nhảy 0.25đ)
  const adjustStepPoint = async (qIdx: number, sIdx: number, delta: number) => {
    const updatedQuestions = [...essayQuestions];
    const targetQ = { ...updatedQuestions[qIdx] };
    const steps = [...targetQ.grading_steps];
    const currentPts = steps[sIdx].points || 0.25;
    const newPts = Math.max(0.25, Math.round((currentPts + delta) * 100) / 100);
    steps[sIdx] = { ...steps[sIdx], points: newPts };
    targetQ.grading_steps = steps;
    updatedQuestions[qIdx] = targetQ;

    const updatedDoc = {
      ...templateDoc,
      part2_essay: {
        ...templateDoc.part2_essay,
        questions: updatedQuestions,
      },
    };

    onUpdate(updatedDoc);

    try {
      await fetch(`/api/studio/exams/${examId}/template-document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      });
      if (onRecompile) onRecompile();
    } catch (e) {
      console.error(e);
    }
  };

  // Thêm một bước mới
  const handleAddStep = async (qIdx: number) => {
    const updatedQuestions = [...essayQuestions];
    const targetQ = { ...updatedQuestions[qIdx] };
    const steps = [...targetQ.grading_steps];
    steps.push({
      step_id: `s${steps.length + 1}`,
      latex_content: "*(Nhập lập luận toán học ở bước này...)*",
      points: 0.25,
      milestone_tag: null,
      tikz_code: null,
    });
    targetQ.grading_steps = steps;
    updatedQuestions[qIdx] = targetQ;

    const updatedDoc = {
      ...templateDoc,
      part2_essay: {
        ...templateDoc.part2_essay,
        questions: updatedQuestions,
      },
    };

    onUpdate(updatedDoc);

    try {
      await fetch(`/api/studio/exams/${examId}/template-document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      });
      if (onRecompile) onRecompile();
    } catch (e) {
      console.error(e);
    }
  };

  // Xóa một bước
  const handleDeleteStep = async (qIdx: number, sIdx: number) => {
    const updatedQuestions = [...essayQuestions];
    const targetQ = { ...updatedQuestions[qIdx] };
    if (targetQ.grading_steps.length <= 1) return;
    targetQ.grading_steps = targetQ.grading_steps.filter((_, idx) => idx !== sIdx);
    updatedQuestions[qIdx] = targetQ;

    const updatedDoc = {
      ...templateDoc,
      part2_essay: {
        ...templateDoc.part2_essay,
        questions: updatedQuestions,
      },
    };

    onUpdate(updatedDoc);

    try {
      await fetch(`/api/studio/exams/${examId}/template-document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      });
      if (onRecompile) onRecompile();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col items-center">
      {/* Top Banner Toolbar */}
      <div className="w-full max-w-[850px] mb-4 flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800">
            Khung Bảng Hướng Dẫn Chấm Chuẩn (Sub-Row + vMerge)
          </span>
          {saveStatus && (
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{saveStatus}</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onRefreshFromItems && (
            <button
              onClick={onRefreshFromItems}
              className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg font-semibold transition-all flex items-center space-x-1"
              title="Đồng bộ lại từ danh sách câu hỏi hiện tại"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Làm mới từ đề</span>
            </button>
          )}
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <div className="w-full max-w-[850px] bg-white rounded-[3px] border border-slate-300 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)] p-10 font-serif text-[12pt] leading-[1.35] text-slate-900">
        {/* Header Block */}
        <div className="text-center space-y-1 pb-6 border-b border-slate-200 mb-6">
          <p className="text-[10pt] uppercase text-slate-600">
            {templateDoc.metadata.governing_body || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}
          </p>
          <h2 className="text-[14pt] font-black uppercase text-indigo-950 tracking-wide">
            HƯỚNG DẪN CHẤM VÀ THANG ĐIỂM CHI TIẾT
          </h2>
          <p className="font-semibold text-slate-800 text-[11pt]">
            {templateDoc.metadata.exam_title} — {templateDoc.metadata.grade_and_year}
          </p>
          <p className="text-[10pt] italic text-slate-500">
            Môn thi: {templateDoc.metadata.subject} • Thời gian làm bài:{" "}
            {templateDoc.metadata.duration_minutes} phút
          </p>
        </div>

        {/* PHẦN I: GHI KẾT QUẢ (NẾU CÓ) */}
        {shortAnswerQuestions.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="font-bold text-[12pt] text-slate-900">
              {templateDoc.part1_short_answer?.section_title || "I. PHẦN GHI KẾT QUẢ"}
            </h3>
            <p className="text-[10.5pt] italic text-slate-600 mb-2">
              {templateDoc.part1_short_answer?.section_note}
            </p>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-800 p-2 text-center w-16">Câu</th>
                  <th className="border border-slate-800 p-2 text-center">Đáp số / Kết quả</th>
                  <th className="border border-slate-800 p-2 text-center w-24">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {shortAnswerQuestions.map((sq) => (
                  <tr key={sq.number}>
                    <td className="border border-slate-800 p-2 text-center font-bold">
                      Câu {sq.number}
                    </td>
                    <td className="border border-slate-800 p-2">
                      <MathRenderer content={sq.short_answer_latex} />
                    </td>
                    <td className="border border-slate-800 p-2 text-center font-bold">
                      0.50
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PHẦN II: TỰ LUẬN (BẢNG 3 CỘT CỐ ĐỊNH CHUẨN SUB-ROW + ROWSPAN) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[12pt] text-slate-900">
              {templateDoc.part2_essay?.section_title || "II. PHẦN TỰ LUẬN"}
            </h3>
            <span className="text-[10.5pt] italic text-slate-500">
              {templateDoc.part2_essay?.section_note}
            </span>
          </div>

          <table
            className="w-full border-collapse border border-slate-900"
            style={{ tableLayout: "fixed" }}
          >
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "74%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-[11pt]">
                <th className="border border-slate-900 p-2 text-center font-bold">Câu</th>
                <th className="border border-slate-900 p-2 text-center font-bold">
                  Nội dung lập luận & Các bước giải chi tiết
                </th>
                <th className="border border-slate-900 p-2 text-center font-bold">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {essayQuestions.map((q, qIdx) => {
                const totalRows = 1 + q.grading_steps.length;
                const actualSum = q.grading_steps.reduce((sum, s) => sum + (s.points || 0), 0);
                const isMismatch = Math.abs(actualSum - q.total_points) > 0.05;

                return (
                  <React.Fragment key={qIdx}>
                    {/* HÀNG 0: ĐỀ BÀI (GỘP ROWSPAN CỘT 0) */}
                    <tr className="bg-slate-50/50">
                      <td
                        rowSpan={totalRows}
                        className="border border-slate-900 p-3 text-center align-middle font-bold text-[11pt] whitespace-pre-line bg-white"
                      >
                        <div className="space-y-2">
                          <div>{q.sub_label}</div>
                          {isMismatch && (
                            <div className="text-[9px] text-amber-600 bg-amber-50 p-1 rounded font-mono border border-amber-200">
                              Lệch: {actualSum.toFixed(2)} / {q.total_points.toFixed(2)}đ
                            </div>
                          )}
                          <button
                            onClick={() => handleAiGenerateRubric(qIdx)}
                            disabled={loadingAiIndex === qIdx}
                            className="mt-2 w-full py-1 px-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 flex items-center justify-center space-x-1 transition-all"
                            title="Nhờ AI chia lại mốc điểm 0.25đ"
                          >
                            <Sparkles className={`w-3 h-3 ${loadingAiIndex === qIdx ? "animate-spin" : ""}`} />
                            <span>{loadingAiIndex === qIdx ? "Đang chia..." : "AI Barem"}</span>
                          </button>
                        </div>
                      </td>

                      <td className="border border-slate-900 p-3 font-semibold text-[11.5pt] bg-slate-50/30">
                        <MathRenderer content={q.prompt_latex} />
                      </td>

                      <td className="border border-slate-900 p-2 text-center bg-slate-50/30">
                        {/* Hàng đề bài để trống cột điểm */}
                      </td>
                    </tr>

                    {/* HÀNG 1..N: CÁC BƯỚC CHẤM NGUYÊN TỬ */}
                    {q.grading_steps.map((step, sIdx) => {
                      const isLast = sIdx === q.grading_steps.length - 1;

                      return (
                        <tr key={step.step_id} className="group hover:bg-indigo-50/30 transition-colors">
                          {/* Cột Nội Dung Bước: Ẩn border ngang nội bộ, chỉ hiện border ở hàng cuối */}
                          <td
                            className="p-3 align-top text-[11.5pt]"
                            style={{
                              borderLeft: "1px solid #0f172a",
                              borderRight: "1px solid #0f172a",
                              borderTop: "none",
                              borderBottom: isLast ? "1px solid #0f172a" : "none",
                            }}
                          >
                            <div className="flex items-start justify-between group/row">
                              <div className="flex-1">
                                <MathRenderer content={step.latex_content} />
                              </div>

                              <div className="opacity-0 group-hover/row:opacity-100 flex items-center space-x-1 ml-2 shrink-0 transition-opacity">
                                <button
                                  onClick={() => handleAddStep(qIdx)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                  title="Thêm bước dưới"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                {q.grading_steps.length > 1 && (
                                  <button
                                    onClick={() => handleDeleteStep(qIdx, sIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    title="Xóa bước này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Cột Điểm: Căn giữa, in đậm, stepper + / - 0.25đ */}
                          <td
                            className="p-2 text-center align-middle font-bold text-[11pt]"
                            style={{
                              borderLeft: "1px solid #0f172a",
                              borderRight: "1px solid #0f172a",
                              borderTop: "none",
                              borderBottom: isLast ? "1px solid #0f172a" : "none",
                            }}
                          >
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <span className="font-mono text-indigo-900">
                                {step.points !== null ? step.points.toFixed(2) : "—"}
                              </span>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => adjustStepPoint(qIdx, sIdx, -0.25)}
                                  className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shadow-xs"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => adjustStepPoint(qIdx, sIdx, 0.25)}
                                  className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shadow-xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
