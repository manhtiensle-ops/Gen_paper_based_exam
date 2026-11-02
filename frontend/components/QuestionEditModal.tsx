"use client";

import React, { useState, useEffect } from "react";
import MathRenderer from "@/components/MathRenderer";
import {
  X,
  Save,
  RotateCcw,
  Sparkles,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  FileText
} from "lucide-react";

interface Props {
  question: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedQuestion: any) => void;
}

export default function QuestionEditModal({
  question,
  isOpen,
  onClose,
  onSaveSuccess,
}: Props) {
  if (!isOpen || !question) return null;

  const [activeTab, setActiveTab] = useState<"edit" | "ocr_solution">("edit");

  // Form states
  const [contentLatex, setContentLatex] = useState(question.content_latex || "");
  const [solutionLatex, setSolutionLatex] = useState(question.solution_latex || "");
  const [finalAnswer, setFinalAnswer] = useState(question.final_answer || "");
  const [mainTopic, setMainTopic] = useState(question.main_topic || "ALGEBRA");
  const [difficulty, setDifficulty] = useState(question.difficulty || "MEDIUM");
  const [userDifficulty, setUserDifficulty] = useState(question.user_difficulty || "");
  const [points, setPoints] = useState<number>(question.default_points || 1.0);
  const [customTags, setCustomTags] = useState<string>(
    Array.isArray(question.custom_tags) ? question.custom_tags.join(", ") : ""
  );
  const [subQuestions, setSubQuestions] = useState<any[]>(
    Array.isArray(question.sub_questions) ? [...question.sub_questions] : []
  );

  // OCR state
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ solution_latex: string; final_answer: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync when question changes
  useEffect(() => {
    setContentLatex(question.content_latex || "");
    setSolutionLatex(question.solution_latex || "");
    setFinalAnswer(question.final_answer || "");
    setMainTopic(question.main_topic || "ALGEBRA");
    setDifficulty(question.difficulty || "MEDIUM");
    setUserDifficulty(question.user_difficulty || "");
    setPoints(question.default_points || 1.0);
    setCustomTags(Array.isArray(question.custom_tags) ? question.custom_tags.join(", ") : "");
    setSubQuestions(Array.isArray(question.sub_questions) ? [...question.sub_questions] : []);
    setOcrResult(null);
    setSolutionFile(null);
  }, [question]);

  // Syntax Integrity Check
  const checkSyntax = (text: string) => {
    const stripped = text.replace(/\\\$/g, "").replace(/\$\$/g, "");
    const dollarCount = (stripped.match(/\$/g) || []).length;
    const openBraces = (text.match(/\{/g) || []).length;
    const closeBraces = (text.match(/\}/g) || []).length;
    const warnings = [];
    if (dollarCount % 2 !== 0) warnings.push("Dấu '$' chưa cân bằng");
    if (openBraces !== closeBraces) warnings.push("Dấu ngoặc '{}' chưa cân bằng");
    return warnings;
  };

  const syntaxWarnings = checkSyntax(contentLatex);

  // Sub-question handlers
  const handleAddSubQuestion = () => {
    const nextIdx = subQuestions.length;
    const labels = ["a)", "b)", "c)", "d)", "e)"];
    const label = labels[nextIdx] || `${nextIdx + 1})`;
    const partId = label.replace(")", "");
    setSubQuestions([
      ...subQuestions,
      {
        part_id: partId,
        label: label,
        points: 1.0,
        content_latex: "",
        solution_latex: "",
        final_answer: "",
        main_topic: mainTopic,
        difficulty: difficulty,
      },
    ]);
  };

  const handleUpdateSubQuestion = (idx: number, field: string, val: any) => {
    const updated = [...subQuestions];
    updated[idx] = { ...updated[idx], [field]: val };
    setSubQuestions(updated);
  };

  const handleRemoveSubQuestion = (idx: number) => {
    setSubQuestions(subQuestions.filter((_, i) => i !== idx));
  };

  // Save changes
  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const tagsArray = customTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        content_latex: contentLatex,
        solution_latex: solutionLatex,
        final_answer: finalAnswer,
        main_topic: mainTopic,
        difficulty: difficulty,
        user_difficulty: userDifficulty.trim() || null,
        default_points: points,
        custom_tags: tagsArray,
        sub_questions: subQuestions,
      };

      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        onSaveSuccess(updated);
        onClose();
      } else {
        alert("Lỗi khi lưu câu hỏi");
      }
    } catch (err) {
      alert("Lỗi kết nối tới máy chủ");
    } finally {
      setSaveLoading(false);
    }
  };

  // Revert to original OCR content
  const handleRevert = async () => {
    if (!confirm("Bạn có chắc muốn khôi phục về đề bài gốc ban đầu?")) return;
    try {
      const res = await fetch(`/api/questions/${question.id}/revert`, { method: "POST" });
      if (res.ok) {
        const reverted = await res.json();
        setContentLatex(reverted.content_latex || "");
        alert("Đã khôi phục nội dung gốc!");
      }
    } catch (e) {
      alert("Lỗi khi khôi phục");
    }
  };

  // Upload solution document/image to OCR via Gemini Flash
  const handleOcrSolution = async () => {
    if (!solutionFile) return;
    setOcrLoading(true);
    const formData = new FormData();
    formData.append("file", solutionFile);

    try {
      const res = await fetch(`/api/questions/${question.id}/solution/ocr`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setOcrResult(data);
        if (data.solution_latex) {
          setSolutionLatex(data.solution_latex);
        }
        if (data.final_answer) {
          setFinalAnswer(data.final_answer);
        }
        alert("Bóc tách lời giải thành công!");
      } else {
        alert("Lỗi khi bóc tách lời giải qua AI");
      }
    } catch (err) {
      alert("Lỗi kết nối bóc tách lời giải");
    } finally {
      setOcrLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <span>Biên Tập & Tùy Biến Sư Phạm: Câu {question.original_question_number}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {mainTopic}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉnh sửa đề bài, đổi số liệu, điều chỉnh độ khó hoặc bổ sung lời giải chi tiết.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "edit" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Soạn thảo & Đánh giá
              </button>
              <button
                onClick={() => setActiveTab("ocr_solution")}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                  activeTab === "ocr_solution"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bổ sung Lời giải qua AI</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "edit" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT PANE: FORM CONTROLS */}
              <div className="space-y-4">
                {/* Meta properties */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Chủ đề chính</label>
                    <select
                      value={mainTopic}
                      onChange={(e) => setMainTopic(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ALGEBRA">Đại số</option>
                      <option value="NUMBER_THEORY">Số học</option>
                      <option value="PLANE_GEOMETRY">Hình học phẳng</option>
                      <option value="SOLID_GEOMETRY">Hình không gian</option>
                      <option value="INEQUALITY_EXTREMA">Bất đẳng thức & Cực trị</option>
                      <option value="COMBINATORICS_PROBABILITY">Tổ hợp & Xác suất</option>
                      <option value="REAL_WORLD_MATH">Toán thực tế</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Độ khó hệ thống</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="EASY">Cơ bản (EASY)</option>
                      <option value="MEDIUM">Vận dụng (MEDIUM)</option>
                      <option value="HARD">Vận dụng cao (HARD)</option>
                      <option value="OLYMPIAD">Học sinh giỏi (OLYMPIAD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-700 mb-1">Độ khó giáo viên chấm</label>
                    <input
                      type="text"
                      placeholder="VD: 8.5/10, Đội tuyển..."
                      value={userDifficulty}
                      onChange={(e) => setUserDifficulty(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Điểm số</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10"
                      value={points}
                      onChange={(e) => setPoints(parseFloat(e.target.value) || 1.0)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Custom tags input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thẻ phân loại sư phạm (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Phương trình vô tỉ, Đề Thạch Sen, Bài hình ý c khó..."
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Question Stem / Content LaTeX */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Đề bài / Giả thiết dùng chung (LaTeX)
                    </label>
                    {syntaxWarnings.length > 0 && (
                      <span className="text-[11px] text-amber-600 font-semibold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{syntaxWarnings.join(", ")}</span>
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={contentLatex}
                    onChange={(e) => setContentLatex(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed bg-slate-50/30"
                    placeholder="Nhập nội dung đề bài (đặt công thức trong $...$ hoặc $$...$$)"
                  />
                </div>

                {/* Sub-questions Manager */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      Các ý hỏi con a), b), c) ({subQuestions.length} ý)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSubQuestion}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-indigo-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm ý con</span>
                    </button>
                  </div>

                  {subQuestions.map((sq, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={sq.label || `${sq.part_id})`}
                            onChange={(e) => handleUpdateSubQuestion(idx, "label", e.target.value)}
                            className="w-12 px-2 py-1 font-bold text-indigo-900 border border-slate-300 rounded focus:outline-none"
                          />
                          <input
                            type="number"
                            step="0.25"
                            placeholder="Điểm"
                            value={sq.points || ""}
                            onChange={(e) =>
                              handleUpdateSubQuestion(idx, "points", parseFloat(e.target.value) || null)
                            }
                            className="w-16 px-2 py-1 text-slate-600 border border-slate-300 rounded focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubQuestion(idx)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={sq.content_latex || ""}
                        onChange={(e) => handleUpdateSubQuestion(idx, "content_latex", e.target.value)}
                        placeholder={`Nội dung yêu cầu ý ${sq.label || idx + 1}...`}
                        className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  ))}
                </div>

                {/* Solution & Final Answer */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Lời giải chi tiết (LaTeX)
                    </label>
                    <textarea
                      rows={4}
                      value={solutionLatex}
                      onChange={(e) => setSolutionLatex(e.target.value)}
                      className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed bg-slate-50/30"
                      placeholder="Nhập các bước chứng minh và giải chi tiết..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Đáp số ngắn / Kết luận
                    </label>
                    <input
                      type="text"
                      value={finalAnswer}
                      onChange={(e) => setFinalAnswer(e.target.value)}
                      placeholder="VD: x = 1 hoặc x = -5, P = \sqrt{5} - 2..."
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT PANE: LIVE KATEX PREVIEW */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4 h-fit sticky top-0">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Xem Trước Trực Quan (Live KaTeX)</span>
                  </h4>
                  {syntaxWarnings.length === 0 ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Cú pháp hợp lệ</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold">Cần kiểm tra cú pháp</span>
                  )}
                </div>

                {/* Rendered Stem */}
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    <MathRenderer content={contentLatex || "*(Nội dung câu hỏi sẽ hiển thị ở đây)*"} />
                  </div>

                  {/* Figure if available */}
                  {question.figures_meta && question.figures_meta.length > 0 && (
                    <div className="py-2 text-center bg-slate-50 rounded-lg p-2 border border-slate-100">
                      {question.figures_meta.map((fig: any, fIdx: number) => (
                        <img
                          key={fIdx}
                          src={`/api/assets/${fig.figure_key}`}
                          alt={fig.caption || "Hình vẽ"}
                          className="w-auto max-h-60 object-contain mx-auto rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  {/* Rendered Sub-questions */}
                  {subQuestions.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-indigo-400 bg-indigo-50/20 p-2.5 rounded-r-xl">
                      {subQuestions.map((sq, idx) => (
                        <div key={idx} className="text-xs space-y-0.5">
                          <div className="font-bold text-indigo-900">
                            {sq.label || `${idx + 1})`} {sq.points && `(${sq.points} điểm)`}:
                          </div>
                          <div className="text-slate-800 pl-1">
                            <MathRenderer content={sq.content_latex || "*(Chưa nhập yêu cầu)*"} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rendered Solution */}
                {solutionLatex && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-2 text-xs">
                    <span className="font-bold text-emerald-800 block border-b border-slate-100 pb-1">
                      Lời giải chi tiết:
                    </span>
                    <MathRenderer content={solutionLatex} />
                  </div>
                )}

                {/* Rendered Final Answer */}
                {finalAnswer && (
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60 text-xs">
                    <span className="font-bold text-emerald-900">Đáp số cuối: </span>
                    <MathRenderer content={finalAnswer} className="inline-block font-semibold text-emerald-800" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: AI SOLUTION IMPORTER */
            <div className="max-w-2xl mx-auto py-8 space-y-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Bổ Sung Lời Giải Bằng Trí Tuệ Nhân Tạo</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tải lên ảnh chụp bài giải viết tay, file Word, hoặc PDF đáp án. Gemini Flash sẽ tự động nhận diện và chuyển hóa thành mã LaTeX chuẩn mực.
                </p>
              </div>

              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                <div>
                  <label className="cursor-pointer font-bold text-xs text-indigo-600 hover:text-indigo-800">
                    <span>Chọn tệp ảnh hoặc PDF lời giải</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setSolutionFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                    />
                  </label>
                  {solutionFile ? (
                    <p className="text-xs text-emerald-700 font-bold mt-2">Đã chọn: {solutionFile.name}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Hỗ trợ PNG, JPG, WEBP, PDF</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleOcrSolution}
                  disabled={!solutionFile || ocrLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
                >
                  {ocrLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Đang bóc tách LaTeX bằng Gemini Flash...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Bắt đầu Bóc Tách Lời Giải</span>
                    </>
                  )}
                </button>
              </div>

              {ocrResult && (
                <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Kết quả bóc tách thành công</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("edit")}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      Quay lại trang soạn thảo để kiểm tra →
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono max-h-48 overflow-y-auto border border-slate-200">
                    {ocrResult.solution_latex}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={handleRevert}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-200/60 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục bản gốc OCR</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saveLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveLoading ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
