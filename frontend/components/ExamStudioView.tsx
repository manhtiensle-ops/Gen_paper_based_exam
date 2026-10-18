"use client";

import React, { useState, useEffect } from "react";
import MathRenderer from "@/components/MathRenderer";
import QuestionEditModal from "@/components/QuestionEditModal";
import {
  FileText,
  Scale,
  Sparkles,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Settings,
  Edit3,
  Layers,
  ChevronRight,
  Eye
} from "lucide-react";

interface Props {
  examId: string;
  onBack?: () => void;
}

export default function ExamStudioView({ examId, onBack }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"EXAM" | "RUBRIC">("EXAM");

  // Layout Knobs (Controlled by sliders & AI Agent)
  const [layoutKnobs, setLayoutKnobs] = useState({
    font_size_pt: 12,
    margin_top_cm: 1.8,
    margin_bottom_cm: 1.8,
    margin_left_cm: 2.0,
    margin_right_cm: 1.8,
    line_spread: 1.15,
    item_gap_pt: 10,
    math_skip_pt: 6,
  });

  // Header Config
  const [headerConfig, setHeaderConfig] = useState({
    governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI",
    department_or_school: "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN",
    exam_name: "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9",
    academic_year: "Năm học: 2026 - 2027",
    subject_title: "Môn thi: TOÁN 9",
    exam_code: "ĐỀ CHÍNH THỨC",
    duration_minutes: 150,
    show_sbd_box: true,
  });

  // Overleaf Live Canvas Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [compiling, setCompiling] = useState(false);
  const [zoomScale, setZoomScale] = useState(100);

  // AI Layout Co-pilot Chat State
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentLog, setAgentLog] = useState<{ sender: "user" | "agent"; text: string }[]>([
    {
      sender: "agent",
      text: "Chào thầy cô! Tôi là Trợ lý Dàn trang LaTeX. Hãy ra lệnh cho tôi như: 'Dồn trang gọn gàng', 'Giảm lề 1.5cm', 'Cỡ chữ 11pt', 'Giãn dòng thưa hơn'...",
    },
  ]);

  // Question editing modal
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Fetch Items & Compile Initial Live Preview
  const loadExamItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studio/exams/${examId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        compileLivePreview(data, layoutKnobs, activeMode);
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

  // Compile Live LaTeX Preview (calls core-api -> export-service pdflatex)
  const compileLivePreview = async (
    currentItems = items,
    knobs = layoutKnobs,
    mode = activeMode
  ) => {
    setCompiling(true);
    try {
      const res = await fetch(`/api/studio/exams/${examId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_knobs: knobs,
          header_config: headerConfig,
          mode: mode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (e) {
      console.error("Compile preview error:", e);
    } finally {
      setCompiling(false);
    }
  };

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

    const updatedItems = reordered.map((it, idx) => ({
      ...it,
      order_index: idx,
      display_label: `Câu ${idx + 1}`,
    }));
    setItems(updatedItems);
    compileLivePreview(updatedItems, layoutKnobs, activeMode);

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

  // AI Layout Agent Action
  const handleSendAgentMessage = async (msgText?: string) => {
    const textToSend = msgText || agentInput;
    if (!textToSend.trim() || agentLoading) return;

    setAgentLog((prev) => [...prev, { sender: "user", text: textToSend }]);
    setAgentInput("");
    setAgentLoading(true);

    try {
      const res = await fetch(`/api/studio/exams/${examId}/layout-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: textToSend,
          current_layout_knobs: layoutKnobs,
          header_config: headerConfig,
          mode: activeMode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAgentLog((prev) => [
          ...prev,
          { sender: "agent", text: data.ui_status_message || "Đã điều chỉnh bố cục thành công!" },
        ]);
        if (data.updated_layout_knobs) {
          setLayoutKnobs(data.updated_layout_knobs);
        }
        if (data.preview_data) {
          setPreviewData(data.preview_data);
        }
      } else {
        setAgentLog((prev) => [
          ...prev,
          { sender: "agent", text: "Xin lỗi, đã xảy ra lỗi khi điều chỉnh bố cục." },
        ]);
      }
    } catch (e) {
      setAgentLog((prev) => [
        ...prev,
        { sender: "agent", text: "Lỗi kết nối tới AI Layout Agent." },
      ]);
    } finally {
      setAgentLoading(false);
    }
  };

  // Switch Mode (Exam vs Rubric)
  const handleModeSwitch = (mode: "EXAM" | "RUBRIC") => {
    setActiveMode(mode);
    compileLivePreview(items, layoutKnobs, mode);
  };

  // Direct Download File (Option B)
  const handleDownload = (fmt: "docx" | "pdf") => {
    const downloadUrl = `/api/generator/exams/${examId}/download?format=${fmt}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTotalScore = items.reduce(
    (acc, it) => acc + (parseFloat(it.max_points) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* 1. TOPBAR STICKY OVERLEAF-STYLE HEADER */}
      <header className="sticky top-0 z-40 bg-slate-800/95 backdrop-blur-md border-b border-slate-700 px-5 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-600 hover:bg-slate-700 text-slate-300 transition-all"
            >
              ← Quay lại
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
              <span>HSG Math Exam Studio</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                Turbo-LaTeX Engine
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Total Score Indicator & Dual-Mode */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900/90 p-0.5 rounded-xl text-xs font-bold border border-slate-700">
            <button
              onClick={() => handleModeSwitch("EXAM")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "EXAM"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đề Thi Thí Sinh</span>
            </button>
            <button
              onClick={() => handleModeSwitch("RUBRIC")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "RUBRIC"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Barem Hướng Dẫn Chấm</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Tổng điểm:</span>
            <span
              className={`font-black ${
                currentTotalScore === 20.0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {currentTotalScore.toFixed(2)} / 20.00đ
            </span>
          </div>
        </div>

        {/* Right: Actions & Exports */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => compileLivePreview()}
            disabled={compiling}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 border border-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${compiling ? "animate-spin text-indigo-400" : ""}`} />
            <span>{compiling ? "Đang dựng..." : "Biên dịch lại"}</span>
          </button>

          <button
            onClick={() => handleDownload("docx")}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Word .docx</span>
          </button>
          <button
            onClick={() => handleDownload("pdf")}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF In ấn</span>
          </button>
        </div>
      </header>

      {/* 2. THREE-PANE OVERLEAF-LIKE WORKSPACE */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-53px)]">
        {/* PANE 1 (LEFT - 3 COLS): AI ACTIONABLE LAYOUT AGENT */}
        <div className="col-span-3 bg-slate-850 border-r border-slate-800 flex flex-col p-4 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Layout Co-pilot</span>
            </h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              Gemini 3.8 Flash
            </span>
          </div>

          {/* Quick Action Pills */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Lệnh dàn trang nhanh:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendAgentMessage("Dồn câu hỏi vừa vặn trong 1 trang A4")}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-200 transition-all font-medium"
              >
                ⚡ Dồn vừa 1 trang
              </button>
              <button
                onClick={() => handleSendAgentMessage("Thu nhỏ lề trang xuống 1.5cm")}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all font-medium"
              >
                📐 Thu nhỏ lề 1.5cm
              </button>
              <button
                onClick={() => handleSendAgentMessage("Đổi cỡ chữ sang 11pt thanh mảnh")}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all font-medium"
              >
                🔤 Cỡ chữ 11pt
              </button>
              <button
                onClick={() => handleSendAgentMessage("Giãn dòng thưa hơn cho dễ đọc")}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all font-medium"
              >
                ↔️ Giãn dòng 1.2
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-slate-900/60 rounded-xl p-3 border border-slate-800 space-y-2.5 overflow-y-auto text-xs min-h-[220px]">
            {agentLog.map((log, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl leading-relaxed ${
                  log.sender === "user"
                    ? "bg-indigo-600 text-white ml-4 shadow-sm"
                    : "bg-slate-800/90 text-slate-200 mr-4 border border-slate-700"
                }`}
              >
                <p className="font-semibold text-[10px] opacity-75 mb-0.5">
                  {log.sender === "user" ? "Thầy cô" : "Trợ lý Layout"}
                </p>
                <p>{log.text}</p>
              </div>
            ))}
            {agentLoading && (
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 mr-4 border border-slate-700 text-xs flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Đang tính toán bố cục vật lý & biên dịch...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Nhập yêu cầu: 'Dồn trang', 'Cỡ chữ 11pt'..."
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendAgentMessage()}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => handleSendAgentMessage()}
              disabled={agentLoading || !agentInput.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PANE 2 (CENTER - 4 COLS): STRUCTURE, QUICK KNOBS & ITEM MANAGER */}
        <div className="col-span-4 bg-slate-850/80 border-r border-slate-800 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* Layout Quick Sliders */}
          <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Thanh Trượt Tinh Chỉnh Bố Cục (Knobs)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Cỡ chữ: <span className="text-white font-bold">{layoutKnobs.font_size_pt}pt</span>
                </label>
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => {
                      const updated = { ...layoutKnobs, font_size_pt: 11 };
                      setLayoutKnobs(updated);
                      compileLivePreview(items, updated);
                    }}
                    className={`flex-1 py-1 rounded text-center font-bold text-[11px] ${
                      layoutKnobs.font_size_pt === 11 ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    11pt (Thanh)
                  </button>
                  <button
                    onClick={() => {
                      const updated = { ...layoutKnobs, font_size_pt: 12 };
                      setLayoutKnobs(updated);
                      compileLivePreview(items, updated);
                    }}
                    className={`flex-1 py-1 rounded text-center font-bold text-[11px] ${
                      layoutKnobs.font_size_pt === 12 ? "bg-indigo-600 text-white" : "text-slate-400"
                    }`}
                  >
                    12pt (Chuẩn)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Giãn dòng: <span className="text-white font-bold">{layoutKnobs.line_spread}</span>
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="1.3"
                  step="0.05"
                  value={layoutKnobs.line_spread}
                  onChange={(e) => {
                    const updated = { ...layoutKnobs, line_spread: parseFloat(e.target.value) };
                    setLayoutKnobs(updated);
                    compileLivePreview(items, updated);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Cách câu: <span className="text-white font-bold">{layoutKnobs.item_gap_pt}pt</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={layoutKnobs.item_gap_pt}
                  onChange={(e) => {
                    const updated = { ...layoutKnobs, item_gap_pt: parseInt(e.target.value) };
                    setLayoutKnobs(updated);
                    compileLivePreview(items, updated);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Lề trang: <span className="text-white font-bold">{layoutKnobs.margin_left_cm}cm</span>
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.5"
                  step="0.1"
                  value={layoutKnobs.margin_left_cm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const updated = {
                      ...layoutKnobs,
                      margin_left_cm: val,
                      margin_right_cm: Math.max(1.2, val - 0.2),
                      margin_top_cm: val,
                      margin_bottom_cm: val,
                    };
                    setLayoutKnobs(updated);
                    compileLivePreview(items, updated);
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Question Items List with Move / Edit Buttons */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Danh sách bài toán ({items.length} câu)
              </span>
            </div>

            {items.map((it, idx) => (
              <div
                key={it.id}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 rounded-xl border border-slate-700/80 space-y-2 text-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-indigo-400">{it.display_label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {it.max_points} điểm
                    </span>
                    {it.problem_snapshot?.figures_meta?.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Hình vẽ 2 cột
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => moveItem(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-20"
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingQuestion(it.problem_snapshot)}
                      className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-700"
                      title="Sửa nội dung câu hỏi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {it.problem_snapshot?.content_latex || "..."}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* PANE 3 (RIGHT - 5 COLS): OVERLEAF LIVE A4 PDF CANVAS */}
        <div className="col-span-5 bg-slate-950 flex flex-col h-full border-l border-slate-800">
          {/* Canvas Controls Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider">
                Bản Xem Trước In Ấn A4 (Live PDF Canvas)
              </span>
              {compiling && (
                <span className="text-[11px] text-indigo-400 flex items-center space-x-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Đang dựng trang...</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomScale(Math.max(60, zoomScale - 10))}
                className="p-1 hover:text-white"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300">{zoomScale}%</span>
              <button
                onClick={() => setZoomScale(Math.min(150, zoomScale + 10))}
                className="p-1 hover:text-white"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale(100)}
                className="p-1 hover:text-white"
                title="Khôi phục 100%"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Viewer Area with A4 Drop Shadows */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-6 bg-slate-950">
            {previewData?.page_keys && previewData.page_keys.length > 0 ? (
              previewData.page_keys.map((pageKey: string, pIdx: number) => (
                <div
                  key={pIdx}
                  style={{ width: `${(595 * zoomScale) / 100}px` }}
                  className="bg-white rounded shadow-2xl overflow-hidden border border-slate-300 transition-all relative group"
                >
                  <img
                    src={`/api/assets/${pageKey}?t=${Date.now()}`}
                    alt={`Trang in A4 - Trang ${pIdx + 1}`}
                    className="w-full h-auto object-contain block"
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400 bg-white/80 px-2 py-0.5 rounded shadow">
                    Trang {pIdx + 1} / {previewData.page_keys.length}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                <FileText className="w-12 h-12 text-slate-600 animate-pulse" />
                <p className="text-xs">Đang nạp bản in từ TeX Live Engine...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUESTION EDIT MODAL */}
      <QuestionEditModal
        question={editingQuestion}
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        onSaveSuccess={(updatedQ) => {
          loadExamItems();
        }}
      />
    </div>
  );
}
