"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Eye,
  Paperclip,
  X,
  MessageSquare
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

  // Left Sidebar Tab: "chat" | "items" | "knobs"
  const [sidebarTab, setSidebarTab] = useState<"chat" | "items" | "knobs">("chat");

  // AI Multimodal Layout Agent Chat State
  const [agentInput, setAgentInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentLog, setAgentLog] = useState<{ sender: "user" | "agent"; text: string; imageUrl?: string | null }[]>([
    {
      sender: "agent",
      text: "Chào thầy cô! Em là Trợ lý Dàn trang & Sửa đề AI. Thầy cô có thể nhắn lệnh (như 'Dồn vừa 1 trang', 'Chuyển câu hình sang 2 cột') hoặc dán ảnh chụp màn hình (Ctrl+V) khoanh tròn chỗ cần sửa để em xử lý ngay!",
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Question editing modal
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [agentLog]);

  // Handle Clipboard Paste Image (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipItems = e.clipboardData.items;
    for (let i = 0; i < clipItems.length; i++) {
      if (clipItems[i].type.indexOf("image") !== -1) {
        const file = clipItems[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            setAttachedImage(uploadEvent.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Handle File Upload Image
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAttachedImage(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Layout Agent Action (supports Multimodal Image)
  const handleSendAgentMessage = async (msgText?: string) => {
    const textToSend = msgText || agentInput;
    if ((!textToSend.trim() && !attachedImage) || agentLoading) return;

    const userEntry = {
      sender: "user" as const,
      text: textToSend,
      imageUrl: attachedImage,
    };
    setAgentLog((prev) => [...prev, userEntry]);
    const sentImg = attachedImage;
    setAttachedImage(null);
    setAgentInput("");
    setAgentLoading(true);

    try {
      const res = await fetch(`/api/studio/exams/${examId}/layout-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: textToSend,
          image_data: sentImg,
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
        // Refresh items in case questions were patched
        const refRes = await fetch(`/api/studio/exams/${examId}/items`);
        if (refRes.ok) {
          const freshItems = await refRes.json();
          setItems(freshItems);
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

      {/* 2. TWO-PANE SPACIOUS OVERLEAF-STYLE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-53px)]">
        {/* LEFT WORKSTATION (45% WIDTH - ROOMY TABS) */}
        <div className="w-[45%] min-w-[460px] max-w-[620px] bg-slate-900 border-r border-slate-800 flex flex-col">
          {/* Workspace Tabs Header */}
          <div className="h-11 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setSidebarTab("chat")}
              className={`h-full px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
                sidebarTab === "chat"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Trợ Lý AI Dàn Trang & Sửa Đề</span>
            </button>

            <button
              onClick={() => setSidebarTab("items")}
              className={`h-full px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
                sidebarTab === "items"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Biên Tập Câu Hỏi ({items.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab("knobs")}
              className={`h-full px-3.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all ${
                sidebarTab === "knobs"
                  ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Bố Cục (Sliders)</span>
            </button>
          </div>

          {/* TAB 1: AI MULTIMODAL CHAT CO-PILOT */}
          {sidebarTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-800/80 shrink-0">
                <button
                  onClick={() => handleSendAgentMessage("Dồn toàn bộ các câu hỏi lại để vừa khít trọn vẹn 1 trang A4")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold border border-indigo-900/50 transition-all flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Dồn vừa 1 trang A4</span>
                </button>
                <button
                  onClick={() => handleSendAgentMessage("Chuyển bài hình học sang bố cục 2 cột: đề bên trái, hình bên phải")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
                >
                  📐 Bài hình 2 cột
                </button>
                <button
                  onClick={() => handleSendAgentMessage("Thu hẹp lề trên và lề dưới xuống 1.4cm")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
                >
                  📏 Thu hẹp lề 1.4cm
                </button>
                <button
                  onClick={() => handleSendAgentMessage("Đổi font chữ sang cỡ 12pt chuẩn thi")}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-all"
                >
                  🔤 Cỡ chữ 12pt
                </button>
              </div>

              {/* Chat Message List */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                {agentLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      log.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        log.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none shadow"
                          : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {log.imageUrl && (
                        <div className="rounded-lg overflow-hidden border border-white/20 max-h-48 bg-black/40">
                          <img
                            src={log.imageUrl}
                            alt="Ảnh đính kèm"
                            className="w-full h-auto object-contain block"
                          />
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{log.text}</p>
                    </div>
                  </div>
                ))}

                {agentLoading && (
                  <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-800/80 p-3 rounded-2xl rounded-bl-none w-fit border border-indigo-900/40">
                    <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Gemini Flash đang phân tích ảnh & tính toán bố cục...</span>
                  </div>
                )}
              </div>

              {/* Input Area with Image Attachment & Paste Support */}
              <div className="pt-2 border-t border-slate-800 shrink-0 space-y-2">
                {attachedImage && (
                  <div className="relative inline-block border-2 border-indigo-500 rounded-xl overflow-hidden bg-slate-950 p-1 shadow-lg">
                    <img
                      src={attachedImage}
                      alt="Thumbnail đính kèm"
                      className="h-16 w-auto object-contain rounded-lg"
                    />
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow"
                      title="Gỡ ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] text-indigo-300 block text-center pt-0.5">
                      Ảnh đã sẵn sàng gửi
                    </span>
                  </div>
                )}

                <div className="relative flex items-end bg-slate-950 rounded-2xl border border-slate-700 focus-within:border-indigo-500 transition-all p-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all mr-1"
                    title="Đính kèm ảnh chụp màn hình chỗ cần sửa"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <textarea
                    rows={2}
                    placeholder="Nhập yêu cầu sửa bố cục, hoặc dán ảnh (Ctrl+V) chỗ cần sửa..."
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAgentMessage();
                      }
                    }}
                    className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none py-1 leading-relaxed"
                  />

                  <button
                    onClick={() => handleSendAgentMessage()}
                    disabled={agentLoading || (!agentInput.trim() && !attachedImage)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all shadow shrink-0 ml-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                  <span>Mẹo: Bạn có thể nhấn Ctrl+V để dán trực tiếp ảnh chụp màn hình!</span>
                  <span>Enter để gửi</span>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTION ITEMS & REORDER */}
          {sidebarTab === "items" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((it, idx) => {
                const snap = it.problem_snapshot || {};
                return (
                  <div
                    key={it.id}
                    className="p-4 bg-slate-950/70 hover:bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-indigo-400">
                          {it.display_label}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                          {it.max_points} điểm
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          {snap.main_topic || "ALGEBRA"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingQuestion(snap)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-all"
                          title="Sửa nội dung câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-20 transition-all"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-serif line-clamp-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      {snap.content_latex || "..."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: LAYOUT SLIDERS & KNOBS */}
          {sidebarTab === "knobs" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Thông số cỡ chữ & khoảng cách</span>
                  <button
                    onClick={() => compileLivePreview(items, layoutKnobs, activeMode)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Áp dụng</span>
                  </button>
                </h4>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Cỡ chữ tài liệu:</span>
                    <span className="font-bold text-white">{layoutKnobs.font_size_pt}pt</span>
                  </div>
                  <div className="flex gap-2">
                    {[11, 12].map((pt) => (
                      <button
                        key={pt}
                        onClick={() => {
                          const updated = { ...layoutKnobs, font_size_pt: pt };
                          setLayoutKnobs(updated);
                          compileLivePreview(items, updated, activeMode);
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                          layoutKnobs.font_size_pt === pt
                            ? "bg-indigo-600 text-white border-indigo-500 shadow"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        {pt}pt {pt === 12 ? "(Chuẩn Bộ)" : "(Tiết kiệm trang)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Hệ số giãn dòng (Line spread):</span>
                    <span className="font-bold text-white">{layoutKnobs.line_spread}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="1.30"
                    step="0.05"
                    value={layoutKnobs.line_spread}
                    onChange={(e) => {
                      const updated = { ...layoutKnobs, line_spread: parseFloat(e.target.value) };
                      setLayoutKnobs(updated);
                    }}
                    onMouseUp={() => compileLivePreview(items, layoutKnobs, activeMode)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Khoảng cách giữa các câu:</span>
                    <span className="font-bold text-white">{layoutKnobs.item_gap_pt}pt</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="1"
                    value={layoutKnobs.item_gap_pt}
                    onChange={(e) => {
                      const updated = { ...layoutKnobs, item_gap_pt: parseInt(e.target.value) };
                      setLayoutKnobs(updated);
                    }}
                    onMouseUp={() => compileLivePreview(items, layoutKnobs, activeMode)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Margins */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200">Căn lề trang in A4 (cm)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Lề Trên:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.2"
                      max="3.0"
                      value={layoutKnobs.margin_top_cm}
                      onChange={(e) => {
                        const updated = { ...layoutKnobs, margin_top_cm: parseFloat(e.target.value) };
                        setLayoutKnobs(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lề Dưới:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.2"
                      max="3.0"
                      value={layoutKnobs.margin_bottom_cm}
                      onChange={(e) => {
                        const updated = { ...layoutKnobs, margin_bottom_cm: parseFloat(e.target.value) };
                        setLayoutKnobs(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lề Trái:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="3.5"
                      value={layoutKnobs.margin_left_cm}
                      onChange={(e) => {
                        const updated = { ...layoutKnobs, margin_left_cm: parseFloat(e.target.value) };
                        setLayoutKnobs(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lề Phải:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.2"
                      max="2.5"
                      value={layoutKnobs.margin_right_cm}
                      onChange={(e) => {
                        const updated = { ...layoutKnobs, margin_right_cm: parseFloat(e.target.value) };
                        setLayoutKnobs(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={() => compileLivePreview(items, layoutKnobs, activeMode)}
                  className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold rounded-xl border border-slate-700 transition-all text-xs"
                >
                  Áp Dụng Lề Mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANE 2 (RIGHT): OVERLEAF LIVE A4 PDF CANVAS */}
        <div className="flex-1 bg-slate-950 flex flex-col h-full border-l border-slate-800 overflow-hidden">
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
