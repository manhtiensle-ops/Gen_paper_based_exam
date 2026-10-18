"use client";

import React, { useState, useEffect } from "react";
import MathRenderer from "@/components/MathRenderer";
import {
  FileText,
  Scale,
  Sparkles,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Settings,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  Sliders
} from "lucide-react";

interface Props {
  examId: string;
  onBack?: () => void;
}

export default function ExamStudioView({ examId, onBack }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"EXAM" | "RUBRIC">("EXAM");

  // Header Config
  const [headerConfig, setHeaderConfig] = useState<any>({
    governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
    department_or_school: "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN",
    exam_name: "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9",
    academic_year: "Năm học: 2026 - 2027",
    subject_title: "Môn thi: TOÁN 9",
    exam_code: "ĐỀ CHÍNH THỨC",
    duration_minutes: 150,
    show_sbd_box: true,
  });

  // Health-check state
  const [healthReport, setHealthReport] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  // Variant generator state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<any>(null);
  const [variantInstructions, setVariantInstructions] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantPreview, setVariantPreview] = useState<any>(null);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch Items
  const loadExamItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studio/exams/${examId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamItems();
    }
  }, [examId]);

  // Compute Total Score
  const currentTotalScore = items.reduce((acc, it) => acc + (parseFloat(it.max_points) || 0), 0);

  // Reorder Item
  const moveItem = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === items.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...items];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const payload = reordered.map((it, idx) => ({
      item_id: it.id,
      order_index: idx,
    }));

    setItems(reordered.map((it, idx) => ({ ...it, order_index: idx, display_label: `Câu ${idx + 1}` })));

    try {
      await fetch(`/api/studio/exams/${examId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_orders: payload }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // AI Health-Check
  const handleRunHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`/api/studio/exams/${examId}/health-check`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setHealthReport(data.health_check_report);
        setHealthModalOpen(true);
      }
    } catch (e) {
      alert("Lỗi khi thẩm định sức khỏe đề thi");
    } finally {
      setHealthLoading(false);
    }
  };

  // AI Auto-Split Rubric
  const handleAutoSplitRubric = async (itemId: string, maxPoints: number) => {
    try {
      const res = await fetch(`/api/studio/items/${itemId}/rubric/auto-split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_points: maxPoints }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
        alert("AI đã bẻ Barem 0.25đ chuẩn thành công!");
      } else {
        const err = await res.json();
        alert(err.detail || "Lỗi khi bẻ barem");
      }
    } catch (e) {
      alert("Lỗi kết nối bẻ barem");
    }
  };

  // Adjust Step Point (0.25 Stepper)
  const adjustStepPoint = async (itemId: string, stepIdx: number, delta: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const rubric = { ...item.rubric_data };
    const steps = [...(rubric.steps || [])];
    if (!steps[stepIdx]) return;

    const newPts = Math.max(0.25, (steps[stepIdx].points || 0.25) + delta);
    steps[stepIdx].points = Math.round(newPts * 100) / 100;
    steps[stepIdx].allocated_quanta = Math.round(newPts * 4);
    rubric.steps = steps;

    // Recalculate max_points for item
    const newTotal = steps.reduce((sum: number, s: any) => sum + (s.points || 0), 0);

    setItems((prev) =>
      prev.map((it) =>
        it.id === itemId ? { ...it, rubric_data: rubric, max_points: newTotal } : it
      )
    );

    try {
      await fetch(`/api/studio/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric_data: rubric, max_points: newTotal }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Variant
  const handleGenerateVariant = async () => {
    if (!selectedItemForVariant) return;
    setVariantLoading(true);
    try {
      const res = await fetch(`/api/studio/items/${selectedItemForVariant.id}/variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: variantInstructions }),
      });
      if (res.ok) {
        const data = await res.json();
        setVariantPreview(data);
      } else {
        alert("Lỗi khi sinh biến thể");
      }
    } catch (e) {
      alert("Lỗi kết nối sinh biến thể");
    } finally {
      setVariantLoading(false);
    }
  };

  const handleApplyVariant = () => {
    if (!variantPreview) return;
    setItems((prev) =>
      prev.map((it) => (it.id === variantPreview.id ? variantPreview : it))
    );
    setVariantModalOpen(false);
    setVariantPreview(null);
    alert("Đã áp dụng bài toán biến thể mới vào đề thi!");
  };

  // Export & Download directly to Client (Option B - Direct Streaming)
  const handleExport = (format: "docx" | "pdf") => {
    setExportLoading(true);
    const downloadUrl = `/api/generator/exams/${examId}/download?format=${format}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setExportLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 1. TOPBAR STICKY SCORE BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              ← Quay lại
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Exam Studio: Xưởng Soạn Đề & Barem Điểm</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase tracking-wider">
                Production-Ready
              </span>
            </h2>
          </div>
        </div>

        {/* Center: Total Score Indicator */}
        <div className="flex items-center space-x-2 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold">Tổng điểm đề thi:</span>
          <span
            className={`text-sm font-black tracking-tight ${
              currentTotalScore === 20.0
                ? "text-emerald-600"
                : currentTotalScore > 20.0
                ? "text-rose-600"
                : "text-amber-600"
            }`}
          >
            {currentTotalScore.toFixed(2)} / 20.00đ
          </span>
          {currentTotalScore === 20.0 ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>

        {/* Right: Switcher & Actions */}
        <div className="flex items-center space-x-3">
          {/* Dual-Mode Toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveMode("EXAM")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "EXAM"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đề Thi Thí Sinh</span>
            </button>
            <button
              onClick={() => setActiveMode("RUBRIC")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "RUBRIC"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Hướng Dẫn Chấm & Barem</span>
            </button>
          </div>

          {/* AI Health-check Button */}
          <button
            onClick={handleRunHealthCheck}
            disabled={healthLoading}
            className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200/80 transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{healthLoading ? "Đang quét AI..." : "Thẩm định Đề AI"}</span>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleExport("docx")}
              disabled={exportLoading}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word .docx</span>
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exportLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (3-PANE LAYOUT) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE (4 COLS): NAVIGATION & REORDER */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Cấu trúc & Thứ tự câu hỏi</span>
            </h3>

            {loading ? (
              <p className="text-xs text-slate-400 py-4 text-center">Đang tải câu hỏi...</p>
            ) : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div
                    key={it.id}
                    className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{it.display_label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {it.max_points}đ
                        </span>
                        {it.is_ai_variant && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                            Biến thể AI
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {it.problem_snapshot?.content_latex || "..."}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => moveItem(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(idx, "down")}
                        disabled={idx === items.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Header Administrative Configuration */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Tiêu đề hành chính (Header)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Sở / Cơ quan quản lý</label>
                <input
                  type="text"
                  value={headerConfig.governing_body}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, governing_body: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Trường / Hội đồng ra đề</label>
                <input
                  type="text"
                  value={headerConfig.department_or_school}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, department_or_school: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Tên kỳ thi</label>
                <input
                  type="text"
                  value={headerConfig.exam_name}
                  onChange={(e) => setHeaderConfig({ ...headerConfig, exam_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Thời gian</label>
                  <input
                    type="number"
                    value={headerConfig.duration_minutes}
                    onChange={(e) => setHeaderConfig({ ...headerConfig, duration_minutes: parseInt(e.target.value) || 150 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Mã đề / Phân ban</label>
                  <input
                    type="text"
                    value={headerConfig.exam_code}
                    onChange={(e) => setHeaderConfig({ ...headerConfig, exam_code: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANE (8 COLS): FLUID PAPER CANVAS (A4 FORMAT) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 min-h-[85vh] space-y-6">
          {/* Header Form */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <div className="flex justify-between items-start text-xs font-bold uppercase tracking-wider text-slate-800">
              <div className="text-left">
                <p>{headerConfig.governing_body}</p>
                <p className="font-extrabold text-indigo-900">{headerConfig.department_or_school}</p>
                <p className="text-[10px] text-slate-500 font-normal">-----------------</p>
              </div>

              <div className="text-right">
                <p className="text-red-700">{headerConfig.exam_code}</p>
                <p>NĂM HỌC 2026 - 2027</p>
                <p className="text-[10px] text-slate-500 font-normal">Thời gian: {headerConfig.duration_minutes} phút</p>
              </div>
            </div>

            <h1 className="text-base font-black text-slate-900 tracking-tight pt-2">
              {headerConfig.exam_name.toUpperCase()}
            </h1>
            <p className="text-xs font-bold text-slate-700">MÔN THI: TOÁN (DÀNH CHO HỌC SINH GIỎI LỚP 9)</p>

            {activeMode === "EXAM" && headerConfig.show_sbd_box && (
              <div className="mt-3 p-2 border border-dashed border-slate-300 rounded-lg flex justify-between text-[11px] text-slate-600 font-medium">
                <span>Họ và tên thí sinh: ................................................................</span>
                <span>Số báo danh: ........................</span>
              </div>
            )}
          </div>

          {/* MODE 1: STUDENT EXAM PAPER */}
          {activeMode === "EXAM" ? (
            <div className="space-y-6 pt-2">
              {items.map((it) => {
                const snap = it.problem_snapshot || {};
                const subQs = snap.sub_questions || [];

                return (
                  <div key={it.id} className="space-y-2 text-sm leading-relaxed text-slate-900">
                    <div className="flex items-baseline space-x-1.5 font-bold">
                      <span className="text-indigo-900 font-extrabold">{it.display_label}.</span>
                      <span className="text-slate-600 font-semibold">({it.max_points} điểm)</span>
                      <div className="inline">
                        <MathRenderer content={snap.content_latex || "*(Chưa có nội dung)*"} />
                      </div>
                    </div>

                    {/* Figure if any */}
                    {snap.figures_meta && snap.figures_meta.length > 0 && (
                      <div className="py-2 text-center">
                        {snap.figures_meta.map((fig: any, fIdx: number) => (
                          <img
                            key={fIdx}
                            src={`/api/assets/${fig.figure_key}`}
                            alt="Hình vẽ"
                            className="w-auto max-h-56 object-contain mx-auto rounded-lg border border-slate-200"
                          />
                        ))}
                      </div>
                    )}

                    {/* Sub-questions if any */}
                    {subQs.length > 0 && (
                      <div className="pl-6 space-y-1.5 text-slate-800">
                        {subQs.map((sq: any, sIdx: number) => (
                          <div key={sIdx} className="flex items-baseline space-x-1.5">
                            <span className="font-bold text-indigo-900">
                              {sq.label || `${sIdx + 1})`}
                              {sq.points && ` (${sq.points} điểm)`}
                            </span>
                            <div className="inline">
                              <MathRenderer content={sq.content_latex || ""} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODE 2: TEACHER GRADING RUBRIC TABLE (CHUẨN BỘ GIÁO DỤC 2 CỘT) */
            <div className="space-y-6 pt-2">
              <div className="text-center pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM CHI TIẾT
                </h3>
                <p className="text-[11px] text-slate-500 italic">
                  (Thang điểm 0.25đ chuẩn - Thí sinh làm cách khác nếu đúng vẫn cho điểm tối đa tương ứng)
                </p>
              </div>

              {/* 2-Column Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-800 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 w-28 border-r border-slate-300 text-center">Câu / Ý</th>
                      <th className="py-2.5 px-4 border-r border-slate-300">Nội dung lập luận & Các bước giải chi tiết</th>
                      <th className="py-2.5 px-3 w-28 text-center">Điểm (0.25đ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((it) => {
                      const snap = it.problem_snapshot || {};
                      const rubric = it.rubric_data || {};
                      const steps = rubric.steps || [];

                      return (
                        <React.Fragment key={it.id}>
                          {/* Row Header for each Question */}
                          <tr className="bg-slate-50/80 font-bold text-slate-900 border-t-2 border-slate-300">
                            <td className="py-2 px-3 text-center border-r border-slate-200">
                              <span className="text-indigo-900 font-extrabold">{it.display_label}</span>
                            </td>
                            <td className="py-2 px-4 border-r border-slate-200 flex items-center justify-between">
                              <span className="text-slate-700 italic">
                                {rubric.pedagogical_analysis || "Lời giải & tiêu chí phân bổ điểm"}
                              </span>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => handleAutoSplitRubric(it.id, it.max_points)}
                                  className="text-[11px] text-amber-700 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 transition-all"
                                  title="AI tự động phân rã lời giải thành các mốc 0.25đ"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Bẻ Barem 0.25đ</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedItemForVariant(it);
                                    setVariantInstructions("");
                                    setVariantPreview(null);
                                    setVariantModalOpen(true);
                                  }}
                                  className="text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 transition-all"
                                  title="Sinh đề biến thể giữ nguyên nghiệm đẹp"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Đổi số đẹp</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-black text-indigo-900">
                              {it.max_points}đ
                            </td>
                          </tr>

                          {/* Render Steps */}
                          {steps.length > 0 ? (
                            steps.map((st: any, sIdx: number) => (
                              <tr key={sIdx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2 px-3 text-center border-r border-slate-200 text-slate-400 font-mono text-[11px]">
                                  {it.display_label}.{sIdx + 1}
                                </td>
                                <td className="py-2 px-4 border-r border-slate-200 leading-relaxed text-slate-800">
                                  <span className="font-bold text-slate-900 mr-1.5">
                                    [{st.milestone_tag || `Bước ${sIdx + 1}`}]:
                                  </span>
                                  <div className="inline">
                                    <MathRenderer content={st.latex_content || ""} />
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-slate-700">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() => adjustStepPoint(it.id, sIdx, -0.25)}
                                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="w-10 text-center font-mono">{st.points || 0.25}</span>
                                    <button
                                      onClick={() => adjustStepPoint(it.id, sIdx, 0.25)}
                                      className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-400">-</td>
                              <td className="py-3 px-4 border-r border-slate-200 text-slate-800 leading-relaxed">
                                <MathRenderer content={snap.solution_latex || "*(Chưa có lời giải chi tiết)*"} />
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {it.max_points}đ
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: AI HEALTH-CHECK REPORT */}
      {healthModalOpen && healthReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Báo Cáo Thẩm Định Sức Khỏe Đề Thi (AI Pedagogical Audit)</span>
              </h3>
              <button
                onClick={() => setHealthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Đóng ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Đánh giá chung:</span>
                <span
                  className={`font-black px-2.5 py-1 rounded-full ${
                    healthReport.overall_rating === "EXCELLENT"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {healthReport.overall_rating}
                </span>
              </div>

              {healthReport.warnings && healthReport.warnings.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-rose-800 block flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Các rủi ro sư phạm & Bẫy tư duy cần lưu ý:</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-1 text-rose-700">
                    {healthReport.warnings.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {healthReport.strengths && healthReport.strengths.length > 0 && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-emerald-800 block">Ưu điểm đề thi:</span>
                  <ul className="list-disc pl-5 space-y-1 text-emerald-700">
                    {healthReport.strengths.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setHealthModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Đã tiếp thu khuyến nghị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VARIANT GENERATOR ASSISTANT */}
      {variantModalOpen && selectedItemForVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Sinh Bài Toán Biến Thể Nghiệm Nguyên Đẹp (Zero-Ugly Numbers)</span>
              </h3>
              <button
                onClick={() => setVariantModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs"
              >
                Đóng ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">Bài toán gốc:</span>
                <MathRenderer content={selectedItemForVariant.problem_snapshot?.content_latex || ""} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Yêu cầu sư phạm bổ sung (Đổi số liệu, đổi tỉ lệ...):
                </label>
                <input
                  type="text"
                  placeholder="VD: Đổi nghiệm nguyên sang x = 3, y = 5, giữ nguyên phương pháp..."
                  value={variantInstructions}
                  onChange={(e) => setVariantInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleGenerateVariant}
                disabled={variantLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{variantLoading ? "Gemini Flash đang kiến tạo nghiệm đẹp..." : "Bắt đầu Sinh Biến Thể"}</span>
              </button>

              {variantPreview && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800">
                      Biến thể mới: {variantPreview.variant_metadata?.change_summary}
                    </span>
                    <button
                      onClick={handleApplyVariant}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      ✓ Áp dụng vào đề thi
                    </button>
                  </div>

                  <div className="space-y-2 bg-white p-3 rounded-lg border border-emerald-100 text-slate-900">
                    <span className="font-bold block text-slate-700">Đề bài mới:</span>
                    <MathRenderer content={variantPreview.problem_snapshot?.content_latex || ""} />
                    <span className="font-bold block text-slate-700 pt-2">Lời giải mới:</span>
                    <MathRenderer content={variantPreview.problem_snapshot?.solution_latex || ""} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
