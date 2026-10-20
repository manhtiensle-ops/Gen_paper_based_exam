"use client";

import React, { useState, useEffect, useRef } from "react";
import MathRenderer from "@/components/MathRenderer";
import QuestionEditModal from "@/components/QuestionEditModal";
import RubricTablePreview from "@/components/RubricTablePreview";
import {
  saveExamDraft,
  getExamDraft,
  clearExamDraft,
} from "@/utils/workspaceStorage";
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
  Table,
  ChevronRight,
  Eye,
  Paperclip,
  X,
  MessageSquare,
  Code2,
  Play,
  Bot,
  ChevronDown
} from "lucide-react";

interface Props {
  examId: string;
  onBack?: () => void;
}

export default function ExamStudioView({ examId, onBack }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"EXAM" | "RUBRIC">("EXAM");

  // Draggable Split Pane State
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left pane
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  // Left Sidebar Tab: "editor" | "rubric-table" | "items" | "knobs"
  const [sidebarTab, setSidebarTab] = useState<"editor" | "rubric-table" | "items" | "knobs">("editor");
  const [templateDoc, setTemplateDoc] = useState<any | null>(null);

  // Raw LaTeX Code State for Live Editor
  const [rawLatexCode, setRawLatexCode] = useState<string>("");
  const [isPreambleFolded, setIsPreambleFolded] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [restoredDraftNotice, setRestoredDraftNotice] = useState<string | null>(null);

  // Restore draft from local storage on mount (Disaster Recovery)
  useEffect(() => {
    if (!examId) return;
    const draft = getExamDraft(examId);
    if (draft) {
      if (draft.split_ratio) setSplitRatio(draft.split_ratio);
      if (draft.active_mode) setActiveMode(draft.active_mode);
      if (draft.active_sidebar_tab) setSidebarTab(draft.active_sidebar_tab as any);
      if (draft.unsaved_latex && draft.is_dirty) {
        setRawLatexCode(draft.unsaved_latex);
        setIsDirty(true);
        const timeStr = new Date(draft.last_modified_timestamp).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setRestoredDraftNotice(`Đã khôi phục bản nháp chưa lưu lúc ${timeStr}. Bấm Ctrl+S để lưu và biên dịch.`);
      }
    }
  }, [examId]);

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

  // Debounced auto-save draft to local storage
  useEffect(() => {
    if (!examId || !rawLatexCode) return;
    const timer = setTimeout(() => {
      saveExamDraft({
        schema_version: 2,
        exam_id: examId,
        exam_title: headerConfig.exam_name || "Đề thi",
        active_mode: activeMode,
        active_sidebar_tab: sidebarTab,
        split_ratio: splitRatio,
        unsaved_latex: rawLatexCode,
        is_dirty: isDirty,
        last_modified_timestamp: Date.now(),
        server_sync_timestamp: Date.now(),
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [rawLatexCode, isDirty, splitRatio, activeMode, sidebarTab, examId, headerConfig.exam_name]);

  // Tải ExamDocument JSON (khung bảng chấm chuẩn)
  const loadTemplateDoc = async () => {
    try {
      let res = await fetch(`/api/studio/exams/${examId}/template-document`);
      if (!res.ok) {
        res = await fetch(`/api/studio/exams/${examId}/generate-template-document`, { method: "POST" });
      }
      if (res.ok) {
        const data = await res.json();
        setTemplateDoc(data);
      }
    } catch (e) {
      console.error("Load template document error:", e);
    }
  };

  // Layout Knobs
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

  // Live Canvas Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [compiling, setCompiling] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(100);

  // AI Multimodal Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentLog, setAgentLog] = useState<{ sender: "user" | "agent"; text: string; imageUrl?: string | null }[]>([
    {
      sender: "agent",
      text: "Xin chào thầy cô! Em là Trợ lý Dàn trang & Sửa đề AI. Thầy cô có thể nhắn lệnh (như 'Dồn vừa 1 trang', 'Chuyển bài hình sang 2 cột') hoặc dán ảnh chụp màn hình (Ctrl+V) khoanh tròn chỗ cần sửa để em xử lý ngay!",
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

  // Handle Resizer Dragging (Emil Kowalski PointerCapture Pattern)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || e.pointerId !== activePointerIdRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawRatio = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(72, Math.max(28, Math.round(rawRatio)));
    setSplitRatio(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    activePointerIdRef.current = null;
    setIsDragging(false);
  };

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
            if (!aiDrawerOpen) setAiDrawerOpen(true);
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
        loadTemplateDoc();
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
        if (data.latex_source) {
          setRawLatexCode(data.latex_source);
        }
      }
    } catch (e) {
      console.error("Compile preview error:", e);
    } finally {
      setCompiling(false);
    }
  };

  // Compile Raw Edited LaTeX (< 0.3s)
  const handleCompileRawLatex = async () => {
    if (!rawLatexCode.trim() || compiling) return;
    setCompiling(true);
    try {
      const res = await fetch(`/api/studio/exams/${examId}/compile-raw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latex_source: rawLatexCode,
          mode: activeMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setIsDirty(false);
        setRestoredDraftNotice(null);
        saveExamDraft({
          schema_version: 2,
          exam_id: examId,
          exam_title: headerConfig.exam_name || "Đề thi",
          active_mode: activeMode,
          active_sidebar_tab: sidebarTab,
          split_ratio: splitRatio,
          unsaved_latex: rawLatexCode,
          is_dirty: false,
          last_modified_timestamp: Date.now(),
          server_sync_timestamp: Date.now(),
        });
      } else {
        const err = await res.json();
        alert(err.detail || "Lỗi biên dịch LaTeX");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối biên dịch mã nguồn");
    } finally {
      setCompiling(false);
    }
  };

  // Global Shortcuts: Ctrl + S (compile), Ctrl + K (toggle AI Drawer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (sidebarTab === "editor") {
          handleCompileRawLatex();
        } else {
          compileLivePreview();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAiDrawerOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarTab, rawLatexCode, activeMode, compiling]);

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

  // Adjust Step Point (0.25 Stepper)
  const adjustStepPoint = async (itemId: string, stepIdx: number, delta: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const rubric = { ...(item.rubric_data || {}) };
    const steps = [...(rubric.steps || [])];
    if (!steps[stepIdx]) return;

    const newPts = Math.max(0.25, (steps[stepIdx].points || 0.25) + delta);
    steps[stepIdx].points = Math.round(newPts * 100) / 100;
    steps[stepIdx].allocated_quanta = Math.round(newPts * 4);
    rubric.steps = steps;

    const newTotal = steps.reduce((sum: number, s: any) => sum + (s.points || 0), 0);

    const updatedItems = items.map((it) =>
      it.id === itemId ? { ...it, rubric_data: rubric, max_points: newTotal } : it
    );
    setItems(updatedItems);

    try {
      await fetch(`/api/studio/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric_data: rubric, max_points: newTotal }),
      });
      if (activeMode === "RUBRIC") {
        compileLivePreview(updatedItems, layoutKnobs, activeMode);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Switch Mode (Exam vs Rubric)
  const handleModeSwitch = (mode: "EXAM" | "RUBRIC") => {
    setActiveMode(mode);
    compileLivePreview(items, layoutKnobs, mode);
  };

  // Direct Download File (Option B - Native TeX Live PDF)
  const handleDownload = (fmt: "docx" | "pdf") => {
    const downloadUrl = `/api/generator/exams/${examId}/download?format=${fmt}&mode=${activeMode}`;
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
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. TOPBAR - LIGHT ACADEMIC THEME (TRẮNG NGÀ CHUẨN MỰC) */}
      <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shadow-sm shrink-0 z-30">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all flex items-center space-x-1"
            >
              <span>← Trở lại</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="text-indigo-600 font-extrabold">Exam Studio</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 truncate max-w-sm font-medium">{headerConfig.exam_name}</span>
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              TeX Live & OMML
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher & Score Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold border border-slate-200 shadow-inner">
            <button
              onClick={() => handleModeSwitch("EXAM")}
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
              onClick={() => handleModeSwitch("RUBRIC")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "RUBRIC"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Barem Hướng Dẫn Chấm</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs shadow-sm">
            <span className="text-slate-500 font-medium">Tổng điểm:</span>
            <span
              className={`font-black ${
                currentTotalScore === 20.0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {currentTotalScore.toFixed(2)} / 20.00đ
            </span>
          </div>
        </div>

        {/* Right: Actions, AI Drawer Toggle & Exports */}
        <div className="flex items-center space-x-2">
          {/* AI Drawer Button */}
          <button
            onClick={() => setAiDrawerOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-sm ${
              aiDrawerOpen
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Mở trợ lý AI dàn trang & dán ảnh (Ctrl+K)"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span>Trợ Lý AI</span>
            <kbd className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
          </button>

          {/* Quick Recompile Button */}
          <button
            onClick={() => (sidebarTab === "editor" ? handleCompileRawLatex() : compileLivePreview())}
            disabled={compiling}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            title="Biên dịch lại (< 0.3s) (Ctrl+S)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${compiling ? "animate-spin" : ""}`} />
            <span>{compiling ? "Đang dựng..." : "Biên dịch"}</span>
            <kbd className="text-[9px] bg-emerald-800 text-emerald-200 px-1 py-0.5 rounded font-mono">⌘S</kbd>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => handleDownload("docx")}
              className="px-2.5 py-1 text-slate-700 hover:bg-white hover:text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
              title="Xuất file Word OMML chuẩn Bộ GD&ĐT (không vỡ bảng, sửa công thức tự nhiên)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Word</span>
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              className="px-2.5 py-1 text-slate-700 hover:bg-white hover:text-rose-700 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
              title="Tải bản in PDF TeX Live gốc"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF In</span>
            </button>
          </div>
        </div>
      </header>

      {/* DISASTER RECOVERY RESTORED DRAFT BANNER */}
      {restoredDraftNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center justify-between text-xs text-amber-900 z-40 shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{restoredDraftNotice}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => (sidebarTab === "editor" ? handleCompileRawLatex() : compileLivePreview())}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all shadow-xs"
            >
              Lưu & Biên dịch (Ctrl+S)
            </button>
            <button
              onClick={() => setRestoredDraftNotice(null)}
              className="p-1 hover:bg-amber-100 rounded text-amber-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN RESIZABLE FLUID WORKSPACE (TẬN DỤNG TOÀN BỘ MÀN HÌNH) */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
        {/* LEFT WORKSTATION (WIDTH: splitRatio%) */}
        <div
          style={{ width: `${splitRatio}%` }}
          className="bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0"
        >
          {/* Workspace Tabs Header */}
          <div className="h-11 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSidebarTab("editor")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "editor"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Mã Nguồn LaTeX</span>
              </button>

              <button
                onClick={() => {
                  setSidebarTab("rubric-table");
                  handleModeSwitch("RUBRIC");
                  if (!templateDoc) loadTemplateDoc();
                }}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "rubric-table"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Khung Barem (Sub-Row)</span>
              </button>

              <button
                onClick={() => setSidebarTab("items")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "items"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Biên Tập Câu Hỏi ({items.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab("knobs")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "knobs"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Bố Cục (Sliders)</span>
              </button>
            </div>

            {/* Split Presets */}
            <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
              <button
                onClick={() => setSplitRatio(30)}
                className={`px-1.5 py-0.5 rounded ${
                  splitRatio <= 35 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
                }`}
                title="Thu nhỏ Editor 30%"
              >
                30%
              </button>
              <button
                onClick={() => setSplitRatio(50)}
                className={`px-1.5 py-0.5 rounded ${
                  splitRatio >= 45 && splitRatio <= 55 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
                }`}
                title="Chia đôi 50/50"
              >
                50%
              </button>
              <button
                onClick={() => setSplitRatio(70)}
                className={`px-1.5 py-0.5 rounded ${
                  splitRatio >= 65 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
                }`}
                title="Mở rộng Editor 70%"
              >
                70%
              </button>
            </div>
          </div>

          {/* TAB 1: LATEX LIVE CODE EDITOR */}
          {sidebarTab === "editor" && (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Code Sub-toolbar */}
              <div className="h-9 bg-slate-50/80 border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-700 font-bold flex items-center space-x-1">
                    <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>exam_document.tex</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  {/* Preamble folding toggle */}
                  <button
                    onClick={() => setIsPreambleFolded(!isPreambleFolded)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-0.5 rounded transition-all"
                  >
                    {isPreambleFolded ? (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <span>Mở cấu hình TeX (Preamble)</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>Thu gọn Preamble</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span>Nhấn <kbd className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-mono">Ctrl+S</kbd> để biên dịch</span>
                </div>
              </div>

              {/* Collapsible Banner for Preamble */}
              {isPreambleFolded && (
                <div
                  onClick={() => setIsPreambleFolded(false)}
                  className="bg-slate-100/70 border-b border-slate-200 px-4 py-1.5 text-[11px] text-slate-500 font-mono flex items-center justify-between cursor-pointer hover:bg-slate-200/50 transition-colors shrink-0"
                >
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>% [Cấu hình hệ thống TeX Live & Tiêu chuẩn Bộ GD&ĐT (đã thu gọn) — Bấm để mở rộng]</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Xem mã preamble →</span>
                </div>
              )}

              {/* Code Editor Body */}
              <div className="flex-1 flex overflow-hidden">
                <textarea
                  value={rawLatexCode}
                  onChange={(e) => {
                    setRawLatexCode(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="% Mã nguồn LaTeX của đề thi... Thầy cô có thể click sửa trực tiếp bất kỳ công thức toán hay câu từ nào và nhấn Ctrl+S để biên dịch!"
                  spellCheck={false}
                  className="flex-1 h-full bg-white text-slate-900 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none border-none selection:bg-indigo-100 selection:text-indigo-900 overflow-y-auto"
                />
              </div>

              {/* Footer status */}
              <div className="h-7 bg-slate-50 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                <span>LaTeX 2e • UTF-8 • pdfTeX Engine</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sẵn sàng chỉnh sửa trực tiếp (Ctrl+S)</span>
                </span>
              </div>
            </div>
          )}

          {/* TAB: FIXED-LAYOUT RUBRIC TABLE (SUB-ROW + VMERGE) */}
          {sidebarTab === "rubric-table" && (
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-100">
              {templateDoc ? (
                <RubricTablePreview
                  examId={examId}
                  templateDoc={templateDoc}
                  onUpdate={(updated) => setTemplateDoc(updated)}
                  onRefreshFromItems={loadTemplateDoc}
                  onRecompile={async () => {
                    const res = await fetch(`/api/studio/exams/${examId}/items`);
                    if (res.ok) {
                      const freshItems = await res.json();
                      setItems(freshItems);
                      compileLivePreview(freshItems, layoutKnobs, "RUBRIC");
                    }
                  }}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-xs">Đang tải và chuẩn hóa khung bảng hướng dẫn chấm...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUESTION ITEMS & REORDER */}
          {sidebarTab === "items" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {items.map((it, idx) => {
                const snap = it.problem_snapshot || {};
                const rubric = it.rubric_data || {};
                const steps = rubric.steps || [];

                return (
                  <div
                    key={it.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5 transition-all text-xs hover:border-indigo-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-indigo-900">
                          {it.display_label}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {it.max_points} điểm
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {snap.main_topic || "ALGEBRA"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setEditingQuestion(snap)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Sửa nội dung câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-serif line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {snap.content_latex || "..."}
                    </p>

                    {/* Step Barem Steppers if in Rubric mode */}
                    {activeMode === "RUBRIC" && steps.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Các mốc điểm Barem (0.25đ):
                        </span>
                        {steps.map((st: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                          >
                            <span className="text-slate-700 truncate max-w-[240px]">
                              {st.milestone_tag || `Bước ${sIdx + 1}`}: {st.latex_content}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => adjustStepPoint(it.id, sIdx, -0.25)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs shadow-sm"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-mono font-bold text-indigo-700">
                                {st.points}đ
                              </span>
                              <button
                                onClick={() => adjustStepPoint(it.id, sIdx, 0.25)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: LAYOUT SLIDERS & KNOBS */}
          {sidebarTab === "knobs" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Thông số cỡ chữ & khoảng cách</span>
                  <button
                    onClick={() => compileLivePreview(items, layoutKnobs, activeMode)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Áp dụng</span>
                  </button>
                </h4>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Cỡ chữ tài liệu:</span>
                    <span className="font-bold text-slate-900">{layoutKnobs.font_size_pt}pt</span>
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
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {pt}pt {pt === 12 ? "(Chuẩn Bộ)" : "(Tiết kiệm trang)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Hệ số giãn dòng (Line spread):</span>
                    <span className="font-bold text-slate-900">{layoutKnobs.line_spread}x</span>
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
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Khoảng cách giữa các câu:</span>
                    <span className="font-bold text-slate-900">{layoutKnobs.item_gap_pt}pt</span>
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
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Margins */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800">Căn lề trang in A4 (cm)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 block mb-1">Lề Trên:</label>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Lề Dưới:</label>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Lề Trái:</label>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Lề Phải:</label>
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs font-mono"
                    />
                  </div>
                </div>
                <button
                  onClick={() => compileLivePreview(items, layoutKnobs, activeMode)}
                  className="w-full mt-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-all text-xs"
                >
                  Áp Dụng Lề Mới
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DRAGGABLE RESIZABLE SPLIT RESIZER */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={() => setSplitRatio(50)}
          className={`w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize transition-all flex items-center justify-center shrink-0 group relative z-20 select-none ${
            isDragging ? "bg-indigo-600 w-2" : ""
          }`}
          title="Kéo sang trái/phải để đổi tỷ lệ. Nhấp đúp để về 50/50"
        >
          <div className="h-8 w-1 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
        </div>

        {/* RIGHT LIVE A4 PDF CANVAS (WIDTH: remaining %) */}
        <div
          style={{ width: `${100 - splitRatio}%` }}
          className="bg-slate-200/70 flex flex-col h-full overflow-hidden shrink-0"
        >
          {/* Canvas Toolbar */}
          <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 shrink-0 shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">Bản In Khổ Giấy A4 (Live PDF)</span>
              {previewData?.total_pages && (
                <span className="text-[11px] bg-slate-100 text-indigo-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                  {previewData.total_pages} trang
                </span>
              )}
              {compiling && (
                <span className="text-[11px] text-emerald-600 flex items-center space-x-1 font-semibold ml-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Đang dựng bản in TeX Live...</span>
                </span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setZoomScale((prev) => Math.max(50, prev - 10))}
                className="p-1 hover:bg-white rounded text-slate-700 transition-all"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center font-mono font-bold text-xs text-slate-800">{zoomScale}%</span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(180, prev + 10))}
                className="p-1 hover:bg-white rounded text-slate-700 transition-all"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale(100)}
                className="p-1 hover:bg-white rounded text-slate-700 transition-all border-l border-slate-200 ml-1 pl-1.5"
                title="Khôi phục 100%"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Viewer Area with High-Elevation A4 Drop Shadows */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center space-y-6">
            {previewData?.page_keys && previewData.page_keys.length > 0 ? (
              previewData.page_keys.map((pageKey: string, pIdx: number) => (
                <div
                  key={pIdx}
                  style={{ width: `${(595 * zoomScale) / 100}px` }}
                  className="bg-white rounded-[3px] overflow-hidden border border-slate-300 transition-all relative group shadow-[0_16px_36px_-6px_rgba(0,0,0,0.18)]"
                >
                  <img
                    src={`/api/assets/${pageKey}?t=${Date.now()}`}
                    alt={`Trang in A4 - Trang ${pIdx + 1}`}
                    className="w-full h-auto object-contain block bg-white"
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-600 bg-white/90 px-2 py-0.5 rounded shadow border border-slate-200">
                    Trang {pIdx + 1} / {previewData.page_keys.length}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 animate-pulse" />
                <p className="text-xs font-medium">Đang nạp bản in trực tiếp từ TeX Live Engine...</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. AI MULTIMODAL SLIDE-OVER DRAWER (SLIDE FROM RIGHT) */}
        {aiDrawerOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Trợ Lý AI Dàn Trang & Sửa Đề
                </h3>
              </div>
              <button
                onClick={() => setAiDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="p-3 border-b border-slate-100 flex flex-wrap gap-1.5 bg-slate-50/50">
              <button
                onClick={() => handleSendAgentMessage("Dồn toàn bộ câu hỏi lại để vừa khít trọn vẹn 1 trang A4")}
                className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold border border-indigo-200 transition-all flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>⚡ Dồn 1 trang A4</span>
              </button>
              <button
                onClick={() => handleSendAgentMessage("Chuyển bài hình học sang bố cục 2 cột: đề bên trái, hình bên phải")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-all"
              >
                📐 Bài hình 2 cột
              </button>
              <button
                onClick={() => handleSendAgentMessage("Thu hẹp lề trên và lề dưới xuống 1.4cm")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-all"
              >
                📏 Thu hẹp lề
              </button>
              <button
                onClick={() => handleSendAgentMessage("Đổi cỡ chữ sang 12pt chuẩn thi Bộ GD&ĐT")}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-all"
              >
                🔤 Cỡ chữ 12pt
              </button>
            </div>

            {/* Chat Message Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {agentLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${log.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      log.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                        : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none"
                    }`}
                  >
                    {log.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-black/10 max-h-48 bg-white">
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
                <div className="flex items-center space-x-2 text-xs text-indigo-700 bg-indigo-50 p-3 rounded-2xl rounded-bl-none w-fit border border-indigo-200">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Gemini Flash đang phân tích ảnh & bố cục...</span>
                </div>
              )}
            </div>

            {/* Drawer Input Area with Screenshot Paste & Upload */}
            <div className="p-3 border-t border-slate-200 space-y-2 bg-slate-50">
              {attachedImage && (
                <div className="relative inline-block border-2 border-indigo-500 rounded-xl overflow-hidden bg-white p-1 shadow-md">
                  <img
                    src={attachedImage}
                    alt="Thumbnail đính kèm"
                    className="h-16 w-auto object-contain rounded-lg"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow"
                    title="Gỡ ảnh"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="text-[9px] text-indigo-700 block text-center pt-0.5 font-semibold">
                    Ảnh chụp màn hình
                  </span>
                </div>
              )}

              <div className="relative flex items-end bg-white rounded-2xl border border-slate-300 focus-within:border-indigo-500 transition-all p-2 shadow-sm">
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
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all mr-1"
                  title="Đính kèm ảnh chụp màn hình chỗ cần sửa"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <textarea
                  rows={2}
                  placeholder="Nhập yêu cầu sửa bố cục hoặc dán ảnh (Ctrl+V)..."
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAgentMessage();
                    }
                  }}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none resize-none py-1 leading-relaxed"
                />

                <button
                  onClick={() => handleSendAgentMessage()}
                  disabled={agentLoading || (!agentInput.trim() && !attachedImage)}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all shadow shrink-0 ml-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                <span>Dán ảnh chụp màn hình bằng Ctrl+V</span>
                <span>Enter để gửi</span>
              </p>
            </div>
          </div>
        )}
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
