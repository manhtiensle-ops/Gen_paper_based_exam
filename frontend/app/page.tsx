"use client";

import React, { useState, useEffect } from "react";
import MathRenderer from "@/components/MathRenderer";
import QuestionEditModal from "@/components/QuestionEditModal";
import ExamStudioView from "@/components/ExamStudioView";
import {
  FileText,
  UploadCloud,
  CheckCircle,
  RefreshCw,
  Download,
  Layers,
  Search,
  BookOpen,
  Shuffle,
  ShieldCheck,
  ChevronRight,
  Eye,
  AlertCircle,
  Edit3,
  Sparkles,
  Scale
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"generator" | "questions" | "ingestion" | "review" | "studio">("generator");
  
  // Questions Bank State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Source Exams State
  const [sourceExams, setSourceExams] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Generator & Assembled Exam State
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [examTitle, setExamTitle] = useState("Đề thi chọn HSG Toán 9 - Đề số 01");
  const [generatedExam, setGeneratedExam] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  // Swap Slot Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Quick Difficulty Update Handler
  const handleQuickDifficultyChange = async (questionId: string, newDiff: string) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/difficulty`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: newDiff }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, difficulty: newDiff } : q))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Questions
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = new URLSearchParams();
      if (filterTopic) params.append("main_topic", filterTopic);
      if (filterDifficulty) params.append("difficulty", filterDifficulty);
      if (filterSection) params.append("section_type", filterSection);

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Source Exams
  const fetchSourceExams = async () => {
    try {
      const res = await fetch("/api/exams");
      if (res.ok) {
        const data = await res.json();
        setSourceExams(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Blueprints
  const fetchBlueprints = async () => {
    try {
      const res = await fetch("/api/generator/blueprints");
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data);
        if (data.length > 0 && !selectedBlueprintId) {
          setSelectedBlueprintId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchSourceExams();
    fetchBlueprints();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [filterTopic, filterDifficulty, filterSection]);

  // Handle Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("title", uploadTitle);
    formData.append("file", uploadFile);
    formData.append("grade", "9");

    try {
      const res = await fetch("/api/exams/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadTitle("");
        setUploadFile(null);
        await fetchSourceExams();
        alert("Tải lên thành công! Tiến trình số hóa đang chạy ngầm.");
      }
    } catch (err) {
      alert("Lỗi khi tải lên tài liệu");
    } finally {
      setUploading(false);
    }
  };

  // Create Standard Blueprint if none exists
  const handleCreateDefaultBlueprint = async () => {
    const payload = {
      name: "Khung ma trận Đề thi HSG Toán 9 Chuẩn (20 Điểm)",
      description: "Cấu trúc 2 phần: 5 câu điền đáp số ngắn (5đ) và 5 câu tự luận phân loại cao (15đ)",
      grade: 9,
      sections_config: [
        {
          section_type: "SHORT_ANSWER",
          slots: [
            { slot_index: 1, main_topic: "ALGEBRA", difficulty: "EASY", points: 1.0 },
            { slot_index: 2, main_topic: "ALGEBRA", difficulty: "MEDIUM", points: 1.0 },
            { slot_index: 3, main_topic: "NUMBER_THEORY", difficulty: "MEDIUM", points: 1.0 },
            { slot_index: 4, main_topic: "PLANE_GEOMETRY", difficulty: "MEDIUM", points: 1.0 },
            { slot_index: 5, main_topic: "REAL_WORLD_MATH", difficulty: "MEDIUM", points: 1.0 }
          ]
        },
        {
          section_type: "ESSAY",
          slots: [
            { slot_index: 6, main_topic: "ALGEBRA", difficulty: "HARD", points: 3.0 },
            { slot_index: 7, main_topic: "NUMBER_THEORY", difficulty: "HARD", points: 3.0 },
            { slot_index: 8, main_topic: "PLANE_GEOMETRY", difficulty: "HARD", points: 3.0 },
            { slot_index: 9, main_topic: "INEQUALITY_EXTREMA", difficulty: "OLYMPIAD", points: 3.0 },
            { slot_index: 10, main_topic: "COMBINATORICS_PROBABILITY", difficulty: "OLYMPIAD", points: 3.0 }
          ]
        }
      ]
    };

    try {
      const res = await fetch("/api/generator/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchBlueprints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Algorithmic Exam Generation
  const handleGenerateExam = async () => {
    if (!selectedBlueprintId) {
      if (blueprints.length === 0) {
        await handleCreateDefaultBlueprint();
        return;
      }
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          blueprint_id: selectedBlueprintId,
          similarity_threshold: 0.65
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedExam(data);
      }
    } catch (e) {
      alert("Lỗi khi tổ hợp đề thi");
    } finally {
      setGenerating(false);
    }
  };

  // Open Swap Question Modal
  const openSwapModal = async (slotIdx: number, questionId: string) => {
    setActiveSlotIdx(slotIdx);
    setSwapModalOpen(true);
    setLoadingCandidates(true);
    try {
      const res = await fetch("/api/generator/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_question_id: questionId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSwapCandidates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Replace Question in Slot
  const handleSelectReplacement = (replacement: any) => {
    if (activeSlotIdx === null || !generatedExam) return;
    const updatedSlots = [...generatedExam.slots_state];
    const targetSlot = updatedSlots.find(s => s.slot_index === activeSlotIdx);
    if (targetSlot) {
      targetSlot.question = {
        id: replacement.id,
        content_latex: replacement.content_latex,
        solution_latex: replacement.solution_latex,
        final_answer: replacement.final_answer,
        sub_questions: replacement.sub_questions,
        has_figure: replacement.has_figure,
        figures_meta: replacement.figures_meta,
        main_topic: replacement.main_topic,
        difficulty: replacement.difficulty
      };
      setGeneratedExam({ ...generatedExam, slots_state: updatedSlots });
    }
    setSwapModalOpen(false);
  };

  // Export & Download Exam directly to Client (Option B - Direct Streaming)
  const handleExport = (type: "docx" | "pdf") => {
    if (!generatedExam) return;
    setExporting(type);
    
    // Direct browser download without alert
    const downloadUrl = `/api/generator/exams/${generatedExam.id}/download?format=${type}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setExporting(null);
    }, 1500);
  };

  // Toggle Verification State
  const handleToggleVerify = async (questionId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/questions/${questionId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !currentStatus })
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Render question body with figure and sub_questions
  const renderQuestionContent = (q: any) => {
    if (!q) return null;
    return (
      <div className="space-y-3">
        {/* 1. Shared Stem or Problem Content */}
        <div className="text-sm text-slate-900 leading-relaxed">
          <MathRenderer content={q.content_latex || "Đang cập nhật nội dung câu hỏi..."} />
        </div>

        {/* 2. Geometric Figure with aspect ratio preserved */}
        {q.figures_meta && q.figures_meta.length > 0 && (
          <div className="py-2 text-center bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            {q.figures_meta.map((fig: any, fIdx: number) => (
              <div key={fIdx} className="space-y-1">
                <img
                  src={`/api/assets/${fig.figure_key}`}
                  alt={fig.caption || "Hình vẽ hình học"}
                  className="w-auto max-h-72 object-contain mx-auto my-2 rounded-lg border border-slate-200 shadow-sm"
                />
                {fig.caption && (
                  <p className="text-[11px] text-slate-500 italic text-center">{fig.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. Sub-questions (Parts a, b, c) */}
        {q.sub_questions && q.sub_questions.length > 0 && (
          <div className="space-y-2 pl-4 border-l-2 border-indigo-400 bg-indigo-50/30 p-2.5 rounded-r-xl">
            {q.sub_questions.map((sq: any, sIdx: number) => (
              <div key={sIdx} className="text-sm space-y-0.5">
                <div className="font-bold text-indigo-900 flex items-center space-x-1">
                  <span>{sq.label || `${sq.part_id})`}</span>
                  {sq.points && <span className="text-xs font-normal text-indigo-700">({sq.points} điểm)</span>}
                </div>
                <div className="text-slate-800 pl-1">
                  <MathRenderer content={sq.content_latex} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm space-x-1">
        <button
          onClick={() => setActiveTab("generator")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "generator"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tổ hợp đề thi</span>
        </button>

        <button
          onClick={() => setActiveTab("questions")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "questions"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ngân hàng câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveTab("ingestion")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "ingestion"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Số hóa tài liệu</span>
        </button>

        <button
          onClick={() => setActiveTab("review")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "review"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Hàng đợi kiểm duyệt</span>
        </button>

        <button
          onClick={() => setActiveTab("studio")}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "studio"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Exam Studio (Soạn & Barem 0.25đ)</span>
        </button>
      </div>

      {/* TAB 1: EXAM GENERATOR */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Controls */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Cấu hình Ma trận Đề thi</span>
            </h2>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tiêu đề đề thi
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Khung ma trận (Blueprint)
              </label>
              {blueprints.length > 0 ? (
                <select
                  value={selectedBlueprintId}
                  onChange={(e) => setSelectedBlueprintId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {blueprints.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
                  <p>Chưa có ma trận đề thi mẫu nào.</p>
                  <button
                    onClick={handleCreateDefaultBlueprint}
                    className="w-full py-1.5 bg-amber-600 text-white font-semibold rounded text-xs hover:bg-amber-700"
                  >
                    + Khởi tạo Ma trận HSG Toán 9 Chuẩn
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateExam}
                disabled={generating}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tìm kiếm & xếp slot...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4" />
                    <span>Tổ hợp Đề thi Mới (Zero-Hallucination)</span>
                  </>
                )}
              </button>
            </div>

            {generatedExam && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Xuất bản đề thi (Word & PDF)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExport("docx")}
                    disabled={exporting !== null}
                    className="py-2.5 px-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exporting === "docx" ? "Đang xuất..." : "Tải Word (.docx)"}</span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}
                    className="py-2.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center justify-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exporting === "pdf" ? "Đang xuất..." : "Tải PDF In ấn"}</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab("studio")}
                  className="w-full mt-3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all"
                >
                  <Scale className="w-4 h-4" />
                  <span>Mở Exam Studio (Soạn đề & Barem 0.25đ) ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Exam Preview */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[600px]">
            {generatedExam ? (
              <div className="space-y-6">
                <div className="text-center border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900">{generatedExam.title.toUpperCase()}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    KỲ THI CHỌN HỌC SINH GIỎI TOÁN THCS - THỜI GIAN LÀM BÀI: 120 PHÚT
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-slate-100">
                  {generatedExam.slots_state.map((slot: any) => (
                    <div key={slot.slot_index} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Câu {slot.slot_index}. ({slot.points} điểm)
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                            {slot.main_topic}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700">
                            {slot.difficulty}
                          </span>
                        </div>
                        {slot.question && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingQuestion(slot.question)}
                              className="text-xs text-slate-600 hover:text-indigo-600 font-semibold flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-slate-100"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => openSwapModal(slot.slot_index, slot.question.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-indigo-50"
                            >
                              <Shuffle className="w-3 h-3" />
                              <span>Đổi câu khác</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {slot.question ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                          {renderQuestionContent(slot.question)}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 text-amber-700 text-xs rounded-lg">
                          Chưa tìm thấy câu hỏi phù hợp trong ngân hàng cho slot này. Hãy bổ sung câu hỏi vào ngân hàng!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-400">
                <FileText className="w-16 h-16 stroke-1 mb-3" />
                <h3 className="font-bold text-slate-700 text-base">Chưa có đề thi được tạo</h3>
                <p className="text-xs max-w-sm mt-1">
                  Chọn khung ma trận ở bảng bên trái và nhấn &quot;Tổ hợp Đề thi Mới&quot; để thuật toán tự động chọn lọc câu hỏi chuẩn theo tiêu chí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS BANK */}
      {activeTab === "questions" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Ngân Hàng Câu Hỏi HSG Toán ({questions.length} câu)</span>
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
              >
                <option value="">Tất cả chủ đề</option>
                <option value="ALGEBRA">Đại số</option>
                <option value="NUMBER_THEORY">Số học</option>
                <option value="PLANE_GEOMETRY">Hình học phẳng</option>
                <option value="SOLID_GEOMETRY">Hình không gian</option>
                <option value="INEQUALITY_EXTREMA">Bất đẳng thức & Cực trị</option>
                <option value="COMBINATORICS_PROBABILITY">Tổ hợp & Xác suất</option>
                <option value="REAL_WORLD_MATH">Toán thực tế</option>
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
              >
                <option value="">Mọi độ khó</option>
                <option value="EASY">Cơ bản</option>
                <option value="MEDIUM">Vận dụng</option>
                <option value="HARD">Vận dụng cao</option>
                <option value="OLYMPIAD">Học sinh giỏi (Olympiad)</option>
              </select>

              <select
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none"
              >
                <option value="">Mọi hình thức</option>
                <option value="SHORT_ANSWER">Điền đáp số</option>
                <option value="ESSAY">Tự luận</option>
              </select>
            </div>
          </div>

          {/* Questions Grid */}
          {loadingQuestions ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-sm">Đang tải câu hỏi từ ngân hàng...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Chưa có câu hỏi nào khớp với bộ lọc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {q.main_topic}
                      </span>
                      {/* Interactive Difficulty Selector */}
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleQuickDifficultyChange(q.id, e.target.value)}
                        className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        title="Bấm để đổi nhanh độ khó"
                      >
                        <option value="EASY">Cơ bản (EASY)</option>
                        <option value="MEDIUM">Vận dụng (MEDIUM)</option>
                        <option value="HARD">Vận dụng cao (HARD)</option>
                        <option value="OLYMPIAD">Học sinh giỏi (OLYMPIAD)</option>
                      </select>
                      {q.user_difficulty && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          {q.user_difficulty}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                        {q.section_type === "SHORT_ANSWER" ? "Điền đáp số" : "Tự luận"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-all flex items-center space-x-1"
                        title="Sửa nội dung hoặc lời giải"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        q.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {q.is_verified ? "✓ Đã kiểm duyệt" : "Chờ duyệt"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-800">
                    {renderQuestionContent(q)}
                  </div>

                  {q.final_answer && (
                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="font-bold text-slate-600">Đáp số: </span>
                      <MathRenderer content={q.final_answer} className="inline-block" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENT INGESTION PIPELINE */}
      {activeTab === "ingestion" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>Tải Lên Đề Thi Gốc (.docx / .pdf)</span>
            </h2>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đề thi</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đề thi HSG Toán 9 Tỉnh Hà Tĩnh 2025"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tệp tài liệu (DOCX hoặc PDF)</label>
                <input
                  type="file"
                  required
                  accept=".docx,.pdf"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Bắt đầu Số Hóa Pipeline</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Source Exams List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Tiến Trình Số Hóa Đề Thi ({sourceExams.length})</span>
            </h2>

            <div className="divide-y divide-slate-100">
              {sourceExams.map((exam) => (
                <div key={exam.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{exam.title}</h4>
                      <p className="text-xs text-slate-400">Mã file: {exam.original_file_key}</p>
                    </div>

                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      exam.status === "REVIEW_NEEDED"
                        ? "bg-amber-100 text-amber-800"
                        : exam.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800 animate-pulse"
                    }`}>
                      {exam.status}
                    </span>
                  </div>

                  {exam.page_image_keys && exam.page_image_keys.length > 0 && (
                    <div className="text-xs text-slate-500">
                      Đã render: <span className="font-bold">{exam.page_image_keys.length}</span> trang ảnh (300 DPI)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVIEW QUEUE */}
      {activeTab === "review" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Hàng Đợi Kiểm Duyệt Câu Hỏi Mới Ingest</span>
          </h2>

          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {q.main_topic}
                    </span>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleQuickDifficultyChange(q.id, e.target.value)}
                      className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="EASY">Cơ bản (EASY)</option>
                      <option value="MEDIUM">Vận dụng (MEDIUM)</option>
                      <option value="HARD">Vận dụng cao (HARD)</option>
                      <option value="OLYMPIAD">Học sinh giỏi (OLYMPIAD)</option>
                    </select>
                    {q.user_difficulty && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {q.user_difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-all flex items-center space-x-1"
                      title="Sửa nội dung hoặc lời giải"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleToggleVerify(q.id, q.is_verified)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                        q.is_verified
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{q.is_verified ? "Thu hồi duyệt" : "Phê duyệt đưa vào Ngân hàng"}</span>
                    </button>
                  </div>
                </div>

                <div className="text-sm">
                  {renderQuestionContent(q)}
                </div>

                {q.solution_latex && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-700">Lời giải chi tiết:</span>
                    <MathRenderer content={q.solution_latex} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SWAP QUESTION MODAL */}
      {swapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Shuffle className="w-5 h-5 text-indigo-600" />
                <span>Chọn câu hỏi thay thế cho Slot {activeSlotIdx}</span>
              </h3>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Các câu hỏi dưới đây được lọc theo cùng tiêu chí độ khó, chủ đề và xếp hạng tương đồng ngữ nghĩa bằng Vector Cosine Distance (pgvector).
            </p>

            {loadingCandidates ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs">Đang tìm các ứng viên tương đồng...</p>
              </div>
            ) : swapCandidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Không tìm thấy câu hỏi thay thế khả dụng.
              </div>
            ) : (
              <div className="space-y-3">
                {swapCandidates.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectReplacement(c)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{c.main_topic} • {c.difficulty}</span>
                      <span className="text-indigo-600">Chọn câu này →</span>
                    </div>
                    <div className="text-xs text-slate-800">
                      {renderQuestionContent(c)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EXAM STUDIO (INTERACTIVE CANVAS & 0.25 RUBRIC) */}
      {activeTab === "studio" && (
        <ExamStudioView
          examId={generatedExam?.id || "6122d749-249f-496b-9e41-ffbe43d420a9"}
          onBack={() => setActiveTab("generator")}
        />
      )}

      {/* QUESTION EDIT & SOLUTION OCR MODAL */}
      <QuestionEditModal
        question={editingQuestion}
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        onSaveSuccess={(updatedQ) => {
          setQuestions((prev) =>
            prev.map((item) => (item.id === updatedQ.id ? updatedQ : item))
          );
          if (generatedExam && Array.isArray(generatedExam.slots_state)) {
            const updatedSlots = generatedExam.slots_state.map((s: any) =>
              s.question && s.question.id === updatedQ.id
                ? { ...s, question: updatedQ }
                : s
            );
            setGeneratedExam({ ...generatedExam, slots_state: updatedSlots });
          }
        }}
      />
    </div>
  );
}
