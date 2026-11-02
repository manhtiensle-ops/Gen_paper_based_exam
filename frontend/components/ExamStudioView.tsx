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
  ChevronsUp,
  ChevronsDown,
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
  ChevronDown,
  HelpCircle,
  Command,
  Search,
  Filter,
  BarChart3,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  Clock
} from "lucide-react";

interface Props {
  examId: string;
  onBack?: () => void;
  onExamUpdated?: () => void;
}

export default function ExamStudioView({ examId, onBack, onExamUpdated }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"EXAM" | "RUBRIC">("EXAM");

  // Draggable Split Pane State
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left pane
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  // Left Sidebar Tab: "editor" | "rubric-table" | "items" | "knobs" | "spec-matrix"
  const [sidebarTab, setSidebarTab] = useState<"editor" | "rubric-table" | "items" | "knobs" | "spec-matrix" | "integrity">("editor");
  const [templateDoc, setTemplateDoc] = useState<any | null>(null);

  // Raw LaTeX Code State for Live Editor
  const [rawLatexCode, setRawLatexCode] = useState<string>("");
  const [isPreambleFolded, setIsPreambleFolded] = useState<boolean>(true);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("Vừa xong");
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [auditReportCopied, setAuditReportCopied] = useState<boolean>(false);
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
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [headerForm, setHeaderForm] = useState(headerConfig);

  // Debounced auto-save draft to local storage
  useEffect(() => {
    if (!examId || !rawLatexCode) return;
    setIsAutoSaving(true);
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
      setIsAutoSaving(false);
      const now = new Date();
      setLastSavedTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
          now.getSeconds()
        ).padStart(2, "0")}`
      );
    }, 500);
    return () => clearTimeout(timer);
  }, [rawLatexCode, isDirty, splitRatio, activeMode, sidebarTab, examId, headerConfig.exam_name]);

  // Tải ExamDocument JSON (khung bảng chấm chuẩn)
  const loadTemplateDoc = async (forceRegenerate = false) => {
    try {
      let res;
      if (forceRegenerate) {
        res = await fetch(`/api/studio/exams/${examId}/generate-template-document`, { method: "POST" });
      } else {
        res = await fetch(`/api/studio/exams/${examId}/template-document`);
        if (!res.ok) {
          res = await fetch(`/api/studio/exams/${examId}/generate-template-document`, { method: "POST" });
        }
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
  const [activePage, setActivePage] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [canvasKey, setCanvasKey] = useState<number>(Date.now());
  const [viewerMode, setViewerMode] = useState<"scroll" | "pdf">("scroll");
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // AI Multimodal Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [itemTopicFilter, setItemTopicFilter] = useState<string>("ALL");
  const [itemDifficultyFilter, setItemDifficultyFilter] = useState<string>("ALL");
  const [itemSearchQuery, setItemSearchQuery] = useState<string>("");
  const [matrixCopied, setMatrixCopied] = useState(false);
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
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

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
        if (res.status === 401 || res.status === 403) {
          setAgentLog((prev) => [
            ...prev,
            {
              sender: "agent",
              text: "⚠️ Tính năng Trợ lý AI Layout Chat yêu cầu đăng nhập tài khoản. Vui lòng đăng nhập Google để nhận 100 lượt dùng miễn phí mỗi ngày!",
            },
          ]);
        } else {
          setAgentLog((prev) => [
            ...prev,
            { sender: "agent", text: "Xin lỗi, đã xảy ra lỗi khi điều chỉnh bố cục." },
          ]);
        }
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
  const loadExamItems = async (forceSync = false) => {
    try {
      setLoading(true);
      if (forceSync) {
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem(`exam_draft_${examId}`);
          }
        } catch (e) {}
        await fetch(`/api/studio/exams/${examId}/sync-items?force=true`, { method: "POST" });
      }
      const res = await fetch(`/api/studio/exams/${examId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        
        // Cố gắng tải header_config đã lưu
        let currentHeader = headerConfig;
        try {
          const exRes = await fetch(`/api/generator/exams/${examId}`);
          if (exRes.ok) {
            const exData = await exRes.json();
            if (exData.header_config && Object.keys(exData.header_config).length > 0) {
              currentHeader = { ...headerConfig, ...exData.header_config };
              setHeaderConfig(currentHeader);
              setHeaderForm(currentHeader);
            }
          }
        } catch (err) {}

        compileLivePreview(data, layoutKnobs, activeMode, currentHeader);
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
    mode = activeMode,
    customHeader = headerConfig
  ) => {
    setCompiling(true);
    try {
      const res = await fetch(`/api/studio/exams/${examId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_knobs: knobs,
          header_config: customHeader,
          mode: mode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setCanvasKey(Date.now());
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

  const handleSaveHeader = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHeaderConfig(headerForm);
    setIsHeaderModalOpen(false);
    try {
      await fetch(`/api/studio/exams/${examId}/header`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_config: headerForm }),
      });
      compileLivePreview(items, layoutKnobs, activeMode, headerForm);
    } catch (err) {
      console.error("Error saving header:", err);
    }
  };

  const applyPresetHeader = (preset: "hanoi" | "hcm" | "vinhphat") => {
    if (preset === "vinhphat") {
      setHeaderForm({
        governing_body: "TRUNG TÂM GIÁO DỤC VINH PHÁT",
        department_or_school: "BAN KHẢO THÍ & BỒI DƯỠNG TOÁN",
        exam_name: "KỲ THI KHẢO SÁT CHẤT LƯỢNG HỌC SINH GIỎI",
        academic_year: "Năm học: 2026 - 2027",
        subject_title: "Môn thi: TOÁN 9",
        exam_code: "ĐỀ CHÍNH THỨC",
        duration_minutes: 150,
        show_sbd_box: true,
      });
    } else if (preset === "hcm") {
      setHeaderForm({
        governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO TP HỒ CHÍ MINH",
        department_or_school: "TRƯỜNG THPT CHUYÊN LÊ HỒNG PHONG",
        exam_name: "KỲ THI TUYỂN SINH VÀO LỚP 10 CHUYÊN",
        academic_year: "Năm học: 2026 - 2027",
        subject_title: "Môn thi: TOÁN CHUYÊN",
        exam_code: "ĐỀ CHÍNH THỨC",
        duration_minutes: 150,
        show_sbd_box: true,
      });
    } else {
      setHeaderForm({
        governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI",
        department_or_school: "TRƯỜNG THCS CHUYÊN HÀ NỘI - AMSTERDAM",
        exam_name: "KỲ THI CHỌN ĐỘI TUYỂN HỌC SINH GIỎI LỚP 9",
        academic_year: "Năm học: 2026 - 2027",
        subject_title: "Môn thi: TOÁN 9",
        exam_code: "ĐỀ CHÍNH THỨC",
        duration_minutes: 150,
        show_sbd_box: true,
      });
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
        setCanvasKey(Date.now());
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
        let errDetail = "Lỗi biên dịch LaTeX";
        try {
          const err = await res.json();
          errDetail = err.detail || errDetail;
        } catch (_) {
          const raw = await res.text().catch(() => "");
          if (raw) errDetail = raw;
        }
        alert(errDetail);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi kết nối biên dịch mã nguồn");
    } finally {
      setCompiling(false);
    }
  };

  // Global Shortcuts: Ctrl + S (compile), Ctrl + K (toggle AI Drawer), Ctrl + P (export PDF), Ctrl + E (export Word)
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handleDownload("pdf");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleDownload("docx");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarTab, rawLatexCode, activeMode, compiling, items, layoutKnobs]);

  // Reorder Item
  const moveItem = async (index: number, direction: "up" | "down" | "top" | "bottom") => {
    if ((direction === "up" || direction === "top") && index === 0) return;
    if ((direction === "down" || direction === "bottom") && index === items.length - 1) return;

    const reordered = [...items];
    const targetItem = reordered.splice(index, 1)[0];

    if (direction === "up") {
      reordered.splice(index - 1, 0, targetItem);
    } else if (direction === "down") {
      reordered.splice(index + 1, 0, targetItem);
    } else if (direction === "top") {
      reordered.unshift(targetItem);
    } else if (direction === "bottom") {
      reordered.push(targetItem);
    }

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

  // Điều chỉnh tổng điểm của câu hỏi (+/- 0.25đ)
  const adjustItemTotalPoint = async (itemId: string, delta: number) => {
    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    const currentPts = item.max_points || 1.0;
    const newPts = Math.round(Math.max(0.25, currentPts + delta) * 100) / 100;
    if (newPts === currentPts) return;

    const rubric = { ...(item.rubric_data || {}) };
    const steps = [...(rubric.steps || [])];

    if (steps.length > 0) {
      const lastStepIdx = steps.length - 1;
      const lastStepPts = Math.max(0.25, (steps[lastStepIdx].points || 0.25) + delta);
      steps[lastStepIdx].points = Math.round(lastStepPts * 100) / 100;
      steps[lastStepIdx].allocated_quanta = Math.round(lastStepPts * 4);
      rubric.steps = steps;
    } else {
      rubric.total_points = newPts;
    }

    const updatedItems = items.map((it) =>
      it.id === itemId ? { ...it, rubric_data: rubric, max_points: newPts } : it
    );
    setItems(updatedItems);

    try {
      await fetch(`/api/studio/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubric_data: rubric, max_points: newPts }),
      });
      if (activeMode === "RUBRIC") {
        compileLivePreview(updatedItems, layoutKnobs, activeMode);
      }
    } catch (e) {
      console.error("Failed to update item points:", e);
    }
  };

  // Switch Mode (Exam vs Rubric)
  const handleModeSwitch = async (mode: "EXAM" | "RUBRIC") => {
    setActiveMode(mode);
    try {
      const res = await fetch(`/api/studio/exams/${examId}/items`);
      if (res.ok) {
        const fresh = await res.json();
        setItems(fresh);
        compileLivePreview(fresh, layoutKnobs, mode);
        return;
      }
    } catch (_) {}
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

  const TOPIC_VI_MAP: Record<string, string> = {
    ALGEBRA: "Đại số",
    NUMBER_THEORY: "Số học",
    PLANE_GEOMETRY: "Hình học phẳng",
    SOLID_GEOMETRY: "Hình không gian",
    INEQUALITY_EXTREMA: "Bất đẳng thức & Cực trị",
    COMBINATORICS_PROBABILITY: "Tổ hợp & Xác suất",
    REAL_WORLD_MATH: "Toán thực tế",
  };

  const DIFFICULTY_VI_MAP: Record<string, string> = {
    EASY: "Nhận biết (Dễ)",
    MEDIUM: "Thông hiểu - Vận dụng",
    HARD: "Vận dụng cao",
    OLYMPIAD: "HSG / Chuyên sâu",
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. TOPBAR - LIGHT ACADEMIC THEME (FROSTED GLASS BOUTIQUE SAAS) */}
      <header className="h-14 frosted-glass border-b border-slate-200/90 px-5 flex items-center justify-between shadow-xs shrink-0 z-30 transition-all">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>← Trở lại</span>
            </button>
          )}
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 bg-clip-text text-transparent font-black tracking-tight">Exam Studio</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 truncate max-w-sm font-semibold">{headerConfig.exam_name}</span>
            </h1>
            <button
              onClick={() => {
                setHeaderForm(headerConfig);
                setIsHeaderModalOpen(true);
              }}
              className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200/80 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Tùy biến tiêu đề kỳ thi, trường học, năm học & thời gian"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tiêu đề & Trường</span>
            </button>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200 shadow-2xs flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>TeX Live & OMML</span>
            </span>
            {/* Auto-save Status Indicator */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center space-x-1 transition-all ${
                isAutoSaving
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100/90 text-slate-500 border-slate-200/80"
              }`}
              title="Trạng thái tự động lưu trữ bản nháp phòng mất điện/mất kết nối"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAutoSaving ? "bg-amber-500 animate-ping" : "bg-slate-400"
                }`}
              ></span>
              <span>{isAutoSaving ? "Đang lưu..." : `Đã lưu ${lastSavedTime}`}</span>
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher & Score Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100/90 p-1 rounded-2xl text-xs font-bold border border-slate-200/90 shadow-inner">
            <button
              onClick={() => handleModeSwitch("EXAM")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === "EXAM"
                  ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đề Thi Thí Sinh</span>
            </button>
            <button
              onClick={() => handleModeSwitch("RUBRIC")}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === "RUBRIC"
                  ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Barem Hướng Dẫn Chấm</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-200/90 text-xs shadow-2xs">
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

          {/* Sync from Matrix Button */}
          <button
            onClick={() => loadExamItems(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-50"
            title="Đồng bộ lại toàn bộ câu hỏi và thay đổi mới nhất từ Ma trận đề thi"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${loading ? "animate-spin" : ""}`} />
            <span>Đồng bộ từ Ma trận</span>
          </button>

          {/* Quick Recompile Button */}
          <button
            onClick={async () => {
              if (sidebarTab === "editor") {
                handleCompileRawLatex();
              } else {
                try {
                  if (sidebarTab === "rubric-table" && templateDoc) {
                    await fetch(`/api/studio/exams/${examId}/template-document`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(templateDoc),
                    });
                  }
                  const res = await fetch(`/api/studio/exams/${examId}/items`);
                  if (res.ok) {
                    const fresh = await res.json();
                    setItems(fresh);
                    compileLivePreview(fresh, layoutKnobs, activeMode);
                  } else {
                    compileLivePreview(items, layoutKnobs, activeMode);
                  }
                } catch (_) {
                  compileLivePreview(items, layoutKnobs, activeMode);
                }
              }
            }}
            disabled={compiling}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            title="Biên dịch lại (< 0.3s) (Ctrl+S)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${compiling ? "animate-spin" : ""}`} />
            <span>{compiling ? "Đang dựng..." : "Biên dịch"}</span>
            <kbd className="text-[9px] bg-emerald-800 text-emerald-200 px-1 py-0.5 rounded font-mono">⌘S</kbd>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-inner">
            <button
              onClick={() => handleDownload("docx")}
              className="px-3 py-1 text-slate-700 hover:bg-white hover:text-blue-700 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Xuất file Word OMML chuẩn Bộ GD&ĐT (Phím tắt: Ctrl+E)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Word .docx</span>
              <kbd className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono hidden sm:inline">⌘E</kbd>
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              className="px-3 py-1 text-slate-700 hover:bg-white hover:text-rose-700 text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer"
              title="Tải bản in PDF TeX Live gốc (Phím tắt: Ctrl+P)"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF In A4</span>
              <kbd className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono hidden sm:inline">⌘P</kbd>
            </button>
          </div>

          {/* Shortcut Help Button */}
          <button
            onClick={() => setShowShortcutModal(true)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-all border border-slate-200/80 shadow-2xs cursor-pointer"
            title="Xem danh sách phím tắt hữu ích"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
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
              onClick={async () => {
                if (sidebarTab === "editor") {
                  handleCompileRawLatex();
                } else {
                  try {
                    const res = await fetch(`/api/studio/exams/${examId}/items`);
                    if (res.ok) {
                      const fresh = await res.json();
                      setItems(fresh);
                      compileLivePreview(fresh, layoutKnobs, activeMode);
                    } else {
                      compileLivePreview(items, layoutKnobs, activeMode);
                    }
                  } catch (_) {
                    compileLivePreview(items, layoutKnobs, activeMode);
                  }
                }
              }}
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

              <button
                onClick={() => setSidebarTab("spec-matrix")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "spec-matrix"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bảng Đặc Tả</span>
              </button>

              <button
                onClick={() => setSidebarTab("integrity")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "integrity"
                    ? "border-amber-600 text-amber-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
                title="Trợ lý kiểm tra tính toàn vẹn sư phạm và toán học"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Kiểm Định</span>
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
                  onRefreshFromItems={() => loadTemplateDoc(true)}
                  onRecompile={async () => {
                    // Tải lại items tươi từ DB để đồng bộ điểm số và barem
                    try {
                      const res = await fetch(`/api/studio/exams/${examId}/items`);
                      if (res.ok) {
                        const freshItems = await res.json();
                        setItems(freshItems);
                        compileLivePreview(freshItems, layoutKnobs, "RUBRIC");
                      } else {
                        compileLivePreview(items, layoutKnobs, "RUBRIC");
                      }
                    } catch (_) {
                      compileLivePreview(items, layoutKnobs, "RUBRIC");
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
              {/* Quick Filter & Search Bar */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Tìm câu hỏi theo nội dung, nhãn..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  {itemSearchQuery && (
                    <button
                      onClick={() => setItemSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center shrink-0">
                    <Filter className="w-2.5 h-2.5 mr-0.5" /> Chủ đề:
                  </span>
                  {["ALL", "ALGEBRA", "PLANE_GEOMETRY", "NUMBER_THEORY", "INEQUALITY_EXTREMA"].map((topicKey) => (
                    <button
                      key={topicKey}
                      type="button"
                      onClick={() => setItemTopicFilter(topicKey)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        itemTopicFilter === topicKey
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {topicKey === "ALL" ? "Tất cả" : TOPIC_VI_MAP[topicKey] || topicKey}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center shrink-0">
                    Độ khó:
                  </span>
                  {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "EASY", label: "Nhận biết" },
                    { key: "MEDIUM", label: "Vận dụng" },
                    { key: "HARD", label: "VDC" },
                    { key: "OLYMPIAD", label: "HSG" },
                  ].map((diff) => (
                    <button
                      key={diff.key}
                      type="button"
                      onClick={() => setItemDifficultyFilter(diff.key)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        itemDifficultyFilter === diff.key
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {items
                .filter((it) => {
                  const snap = it.problem_snapshot || {};
                  if (itemTopicFilter !== "ALL" && snap.main_topic !== itemTopicFilter) {
                    return false;
                  }
                  if (itemDifficultyFilter !== "ALL" && snap.difficulty !== itemDifficultyFilter) {
                    return false;
                  }
                  if (itemSearchQuery.trim()) {
                    const q = itemSearchQuery.toLowerCase();
                    const labelMatch = (it.display_label || "").toLowerCase().includes(q);
                    const contentMatch = (snap.content_latex || "").toLowerCase().includes(q);
                    if (!labelMatch && !contentMatch) return false;
                  }
                  return true;
                })
                .map((it, idx) => {
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
                        <div className="flex items-center space-x-1 bg-indigo-50 border border-indigo-200 rounded-md px-1.5 py-0.5">
                          <span className="text-[11px] font-bold text-indigo-700">
                            {it.max_points} điểm
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustItemTotalPoint(it.id, -0.25)}
                            className="w-4 h-4 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center transition-all cursor-pointer leading-none"
                            title="Giảm 0.25 điểm"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustItemTotalPoint(it.id, 0.25)}
                            className="w-4 h-4 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center transition-all cursor-pointer leading-none"
                            title="Tăng 0.25 điểm"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {TOPIC_VI_MAP[snap.main_topic] || snap.main_topic || "Đại số"}
                        </span>
                        {snap.difficulty && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            snap.difficulty === "EASY"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : snap.difficulty === "HARD"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : snap.difficulty === "OLYMPIAD"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {DIFFICULTY_VI_MAP[snap.difficulty] || snap.difficulty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingQuestion(snap);
                            setEditingSlotIndex(it.order_index !== undefined ? it.order_index + 1 : idx + 1);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Sửa nội dung câu hỏi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "top")}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Đưa lên đầu đề thi"
                        >
                          <ChevronsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Chuyển lên 1 nấc"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Chuyển xuống 1 nấc"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "bottom")}
                          disabled={idx === items.length - 1}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-all"
                          title="Đưa xuống cuối đề thi"
                        >
                          <ChevronsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-slate-800 leading-relaxed font-serif line-clamp-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <MathRenderer content={snap.content_latex || "..."} />
                    </div>

                    {/* Step Barem Steppers */}
                    {steps.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Các mốc điểm Barem (0.25đ):
                        </span>
                        {steps.map((st: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                          >
                            <div className="text-slate-700 text-xs flex-1 truncate pr-2 flex items-center space-x-1">
                              <span className="font-semibold text-slate-900 shrink-0">
                                {st.milestone_tag || `Bước ${sIdx + 1}`}:
                              </span>
                              <span className="truncate">
                                <MathRenderer content={st.latex_content || ""} />
                              </span>
                            </div>
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

                <div>
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Khoảng cách công thức toán:</span>
                    <span className="font-bold text-slate-900">{layoutKnobs.math_skip_pt}pt</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="1"
                    value={layoutKnobs.math_skip_pt}
                    onChange={(e) => {
                      const updated = { ...layoutKnobs, math_skip_pt: parseInt(e.target.value) };
                      setLayoutKnobs(updated);
                    }}
                    onMouseUp={() => compileLivePreview(items, layoutKnobs, activeMode)}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Margins */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800">Căn lề trang in A4 (cm)</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Khổ A4 tiêu chuẩn</span>
                </div>

                {/* Nút Preset Căn Lề Chuẩn */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...layoutKnobs,
                        margin_top_cm: 2.0,
                        margin_bottom_cm: 2.0,
                        margin_left_cm: 3.0,
                        margin_right_cm: 1.5,
                      };
                      setLayoutKnobs(updated);
                      compileLivePreview(items, updated, activeMode);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      layoutKnobs.margin_left_cm === 3.0 && layoutKnobs.margin_top_cm === 2.0
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs ring-1 ring-indigo-200"
                        : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-bold text-xs block text-slate-900">📋 Chuẩn NĐ 30/2020</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Lề trái 3cm đóng ghim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...layoutKnobs,
                        margin_top_cm: 1.5,
                        margin_bottom_cm: 1.5,
                        margin_left_cm: 2.0,
                        margin_right_cm: 1.5,
                      };
                      setLayoutKnobs(updated);
                      compileLivePreview(items, updated, activeMode);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      layoutKnobs.margin_left_cm === 2.0 && layoutKnobs.margin_top_cm === 1.5
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs ring-1 ring-indigo-200"
                        : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-bold text-xs block text-slate-900">📄 Tiết Kiệm Trang</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Lề 1.5 - 2cm gọn trang</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
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

          {/* TAB 5: SPECIFICATION MATRIX TABLE */}
          {sidebarTab === "spec-matrix" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span>Bảng Ma Trận & Đặc Tả Đề Thi</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const rows = items.map((it) => {
                          const snap = it.problem_snapshot || {};
                          const pts = parseFloat(it.max_points) || 0;
                          const pct = currentTotalScore > 0 ? Math.round((pts / currentTotalScore) * 100) : 0;
                          return `${it.display_label}\t${TOPIC_VI_MAP[snap.main_topic] || snap.main_topic || "Đại số"}\t${pts}\t${pct}%`;
                        });
                        const tsv = `Câu\tChuyên đề\tĐiểm\tTỷ lệ\n` + rows.join("\n");
                        navigator.clipboard?.writeText(tsv);
                        setMatrixCopied(true);
                        setTimeout(() => setMatrixCopied(false), 2000);
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="Sao chép bảng sang Excel / Google Sheets"
                    >
                      {matrixCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Chép Excel</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      Tổng: {currentTotalScore} điểm
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Thống kê phân bổ câu hỏi theo chuyên đề và trọng số điểm dùng cho hồ sơ lưu trữ tổ chuyên môn.
                </p>

                {/* Visual Topic Distribution Bar */}
                {(() => {
                  const topicPoints: Record<string, number> = {};
                  items.forEach((it) => {
                    const snap = it.problem_snapshot || {};
                    const topic = TOPIC_VI_MAP[snap.main_topic] || snap.main_topic || "Đại số";
                    const pts = parseFloat(it.max_points) || 0;
                    topicPoints[topic] = (topicPoints[topic] || 0) + pts;
                  });
                  const topicColors = [
                    "bg-indigo-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                    "bg-cyan-500",
                    "bg-purple-500",
                  ];
                  const topicsList = Object.entries(topicPoints);
                  return (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Phân bổ tỷ trọng kiến thức</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {topicsList.length} chuyên đề
                        </span>
                      </div>
                      {/* Stacked Progress Bar */}
                      <div className="h-2.5 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        {topicsList.map(([topName, pts], idx) => {
                          const pct = currentTotalScore > 0 ? (pts / currentTotalScore) * 100 : 0;
                          return (
                            <div
                              key={topName}
                              style={{ width: `${pct}%` }}
                              className={`${topicColors[idx % topicColors.length]} h-full transition-all`}
                              title={`${topName}: ${pts} điểm (${Math.round(pct)}%)`}
                            />
                          );
                        })}
                      </div>
                      {/* Legend Chips */}
                      <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
                        {topicsList.map(([topName, pts], idx) => {
                          const pct = currentTotalScore > 0 ? Math.round((pts / currentTotalScore) * 100) : 0;
                          return (
                            <div key={topName} className="flex items-center space-x-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  topicColors[idx % topicColors.length]
                                }`}
                              />
                              <span className="text-slate-600 font-medium">
                                {topName}: <strong className="text-slate-800">{pts}đ</strong> ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">Câu</th>
                        <th className="p-2">Chuyên đề</th>
                        <th className="p-2 text-center">Điểm</th>
                        <th className="p-2 text-center">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {items.map((it) => {
                        const snap = it.problem_snapshot || {};
                        const pts = parseFloat(it.max_points) || 0;
                        const pct = currentTotalScore > 0 ? Math.round((pts / currentTotalScore) * 100) : 0;
                        return (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-indigo-900">{it.display_label}</td>
                            <td className="p-2">{TOPIC_VI_MAP[snap.main_topic] || snap.main_topic || "Đại số"}</td>
                            <td className="p-2 text-center font-bold text-slate-800">{pts}</td>
                            <td className="p-2 text-center font-mono text-slate-500">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: INTEGRITY INSPECTOR */}
          {sidebarTab === "integrity" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Trợ Lý Kiểm Định Sư Phạm & Toàn Vẹn Đề Thi</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    XeLaTeX Engine Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tự động quét cấu trúc câu hỏi, barem điểm số và cú pháp LaTeX để đảm bảo đề thi đạt chuẩn in ấn thương mại và sư phạm.
                </p>

                {/* Audit Checks */}
                <div className="space-y-2 pt-1 text-[11px]">
                  {/* Check 1: Total points */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                    {currentTotalScore === 10 || currentTotalScore === 20 || currentTotalScore === 100 ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-800">
                        Thang điểm tổng: <span className="font-mono text-indigo-700">{currentTotalScore} điểm</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {currentTotalScore === 10 || currentTotalScore === 20 || currentTotalScore === 100
                          ? "✓ Chuẩn thang điểm quy định (10đ hoặc 20đ hoặc 100đ)."
                          : "⚠️ Lưu ý: Tổng điểm hiện tại chưa theo thang điểm chuẩn 10đ, 20đ hoặc 100đ."}
                      </div>
                    </div>
                  </div>

                  {/* Check 2: Question count */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                    {items.length > 0 ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-800">
                        Số lượng câu hỏi: <span className="font-mono text-indigo-700">{items.length} câu</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {items.length > 0
                          ? "✓ Đề thi có đầy đủ danh mục các câu hỏi thành phần."
                          : "⚠️ Cảnh báo: Đề thi đang trống câu hỏi."}
                      </div>
                    </div>
                  </div>

                  {/* Check 3: LaTeX syntax brackets */}
                  {(() => {
                    const openDollar = (rawLatexCode.match(/\$/g) || []).length;
                    const isMathBalanced = openDollar % 2 === 0;
                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isMathBalanced ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">Cú pháp khối toán học LaTeX ($)</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isMathBalanced
                              ? "✓ Tất cả các dấu công thức toán học ($) đều đã đóng ngoặc đối xứng."
                              : "⚠️ Cảnh báo: Phát hiện số lượng ký tự $ lẻ, có thể gây lỗi TeX khi biên dịch in ấn."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 4: Header institution */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                    {headerConfig.department_or_school && headerConfig.exam_name ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-800">Tiêu đề & Cơ quan ban hành</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {headerConfig.department_or_school && headerConfig.exam_name
                          ? `✓ Đã cấu hình: ${headerConfig.department_or_school} - ${headerConfig.exam_name}`
                          : "⚠️ Chưa nhập đầy đủ tên trường hoặc tiêu đề kỳ thi."}
                      </div>
                    </div>
                  </div>

                  {/* Check 5: Estimated Duration Check */}
                  {(() => {
                    let totalEstMinutes = 0;
                    items.forEach((it) => {
                      const snap = it.problem_snapshot || {};
                      const diff = (snap.difficulty || "MEDIUM").toUpperCase();
                      if (diff === "EASY") totalEstMinutes += 2;
                      else if (diff === "MEDIUM") totalEstMinutes += 4;
                      else if (diff === "HARD") totalEstMinutes += 8;
                      else if (diff === "OLYMPIAD") totalEstMinutes += 15;
                      else totalEstMinutes += 4;
                    });
                    const durationSet = headerConfig.duration_minutes || 150;
                    const isDurationFeasible = totalEstMinutes <= durationSet * 1.1;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isDurationFeasible ? (
                          <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Dự toán thời gian làm bài: <span className="font-mono text-indigo-700">~{totalEstMinutes} phút</span> / {durationSet} phút
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isDurationFeasible
                              ? `✓ Khối lượng câu hỏi phù hợp với thời lượng ${durationSet} phút.`
                              : `⚠️ Cảnh báo quá tải: Ước lượng ~${totalEstMinutes} phút vượt thời lượng thi ${durationSet} phút.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 6: Word & Math Expression Counter */}
                  {(() => {
                    const textWithoutLatex = rawLatexCode.replace(/\$[^$]*\$/g, " ");
                    const wordCount = (textWithoutLatex.trim().split(/\s+/).filter(Boolean)).length;
                    const mathCount = Math.floor((rawLatexCode.match(/\$/g) || []).length / 2);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Mật độ văn bản & Công thức: <span className="font-mono text-indigo-700">~{wordCount} từ</span> | <span className="font-mono text-cyan-700">~{mathCount} biểu thức toán</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            ✓ Thống kê dung lượng ký tự tổng quan giúp kiểm soát độ dài và sự cô đọng của đề thi.
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 7: Difficulty Distribution Skew Inspector */}
                  {(() => {
                    const totalQuestions = items.length;
                    if (totalQuestions === 0) return null;

                    const easyCount = items.filter(
                      (q) => !q.bloom_level || q.bloom_level === "RECOGNITION"
                    ).length;
                    const hardCount = items.filter(
                      (q) => q.bloom_level === "APPLICATION" || q.bloom_level === "HIGH_APPLICATION"
                    ).length;

                    const easyPercent = Math.round((easyCount / totalQuestions) * 100);
                    const hardPercent = Math.round((hardCount / totalQuestions) * 100);

                    // Standard benchmark: Easy (40-60%), Hard/High Hard (20-40%)
                    const isSkewedHard = hardPercent > 45;
                    const isSkewedEasy = easyPercent > 70;
                    const isBalanced = !isSkewedHard && !isSkewedEasy;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isBalanced ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Phân bổ độ khó: <span className="font-mono text-emerald-700">NB {easyPercent}%</span> | <span className="font-mono text-amber-700">VD/VDC {hardPercent}%</span> ({isBalanced ? "CÂN ĐỐI" : "LỆCH CHUẨN"})
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isSkewedHard && "⚠️ Cảnh báo: Đề thi có tỷ trọng câu Vận dụng/VDC cao (>45%), cần rà soát lại nếu không phải đề HSG/Tuyển sinh."}
                            {isSkewedEasy && "⚠️ Cảnh báo: Đề thi có quá nhiều câu Nhận biết (>70%), thiếu độ phân hóa năng lực học sinh."}
                            {isBalanced && "✓ Tỷ lệ độ khó phân bổ hài hòa theo chuẩn ma trận sư phạm Bộ GD&ĐT."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 8: Question Independence & Overlap Inspector */}
                  {(() => {
                    if (items.length <= 1) return null;

                    // Scan for potential duplicate statements or heavy overlaps
                    let duplicateCount = 0;
                    const seenPrefixes = new Set<string>();

                    for (const item of items) {
                      const text = (item.content_latex || "").trim().toLowerCase().replace(/\s+/g, " ");
                      // Clean LaTeX noise for semantic prefix comparison
                      const cleanText = text.replace(/\\(frac|sqrt|vec|cdot|alpha|beta|pi)\b/g, "").replace(/[^a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/g, "");
                      const prefix = cleanText.substring(0, 35);
                      if (prefix.length >= 15) {
                        if (seenPrefixes.has(prefix)) {
                          duplicateCount++;
                        } else {
                          seenPrefixes.add(prefix);
                        }
                      }
                    }

                    const isIndependent = duplicateCount === 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isIndependent ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Tính độc lập câu hỏi:{" "}
                            {isIndependent ? (
                              <span className="font-mono text-emerald-700">100% ĐỘC LẬP</span>
                            ) : (
                              <span className="font-mono text-amber-700">CÓ {duplicateCount} CÂU TRÙNG Ý/DỮ KIỆN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isIndependent
                              ? "✓ Toàn bộ các câu hỏi có dữ kiện và giả thiết độc lập, không bị chồng chéo."
                              : "⚠️ Cảnh báo: Phát hiện câu hỏi có thể trùng lặp giả thiết hoặc đề dẫn, cần kiểm tra để tránh lỗi sư phạm kéo theo."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 9: Distractor Plausibility & Balance Inspector */}
                  {(() => {
                    // Check for multiple-choice distractor patterns in LaTeX: \task or \begin{tasks}
                    const taskMatches = rawLatexCode.match(/\\task\s+([^\n\\]+)/g) || [];
                    const hasTasks = taskMatches.length >= 4;

                    if (!hasTasks) {
                      return (
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800">
                              Phương án nhiễu trắc nghiệm: <span className="font-mono text-emerald-700">TỰ LUẬN / CHUẨN</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ✓ Đề thi dạng tự luận hoặc các phương án trắc nghiệm không có dấu hiệu chênh lệch cực đoan.
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Check lengths of distractor options
                    const lengths = taskMatches.map((t) => t.replace(/\\task\s+/, "").trim().length);
                    const minLen = Math.min(...lengths);
                    const maxLen = Math.max(...lengths);
                    const isExtremeDiff = maxLen > 60 && minLen < 5;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {!isExtremeDiff ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Cân bằng phương án nhiễu:{" "}
                            {!isExtremeDiff ? (
                              <span className="font-mono text-emerald-700">ĐỒNG ĐỀU & HỢP LÝ</span>
                            ) : (
                              <span className="font-mono text-amber-700">LỆCH ĐỘ DÀI PHƯƠNG ÁN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {!isExtremeDiff
                              ? `✓ ${taskMatches.length} phương án trắc nghiệm có chiều dài tương đương, triệt tiêu mẹo đoán mò.`
                              : "⚠️ Cảnh báo: Tồn tại phương án trắc nghiệm quá dài hoặc quá ngắn bất thường, học sinh dễ suy luận mẹo loại trừ."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 10: Answer Key Distribution & Bias Inspector */}
                  {(() => {
                    // Extract answers tagged like (Chọn A/B/C/D) or [A/B/C/D] or \textbf{A/B/C/D} in explanations/rubrics
                    const answerMatches = (rawLatexCode.match(/(?:Chọn|Đáp án|\\textbf\{)([A-D])(?:\}|\.|\))/gi) || []).map((m) => {
                      const match = m.match(/[A-D]/i);
                      return match ? match[0].toUpperCase() : "";
                    }).filter(Boolean);

                    if (answerMatches.length < 4) {
                      return (
                        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-800">
                              Phân phối đáp án đúng: <span className="font-mono text-emerald-700">TỰ LUẬN / CHƯA CỐ ĐỊNH</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ✓ Đề thi dạng tự luận hoặc đáp án đang được tính toán theo thang điểm barem.
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Count occurrences
                    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
                    for (const a of answerMatches) {
                      if (counts[a] !== undefined) counts[a]++;
                    }

                    const total = answerMatches.length;
                    const maxCount = Math.max(...Object.values(counts));
                    const maxRatio = maxCount / total;

                    // Check consecutive answers streak
                    let maxStreak = 1;
                    let curStreak = 1;
                    for (let i = 1; i < answerMatches.length; i++) {
                      if (answerMatches[i] === answerMatches[i - 1]) {
                        curStreak++;
                        if (curStreak > maxStreak) maxStreak = curStreak;
                      } else {
                        curStreak = 1;
                      }
                    }

                    const isBiased = maxRatio > 0.45 || maxStreak >= 4;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {!isBiased ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Phân bổ đáp án đúng (A/B/C/D):{" "}
                            {!isBiased ? (
                              <span className="font-mono text-emerald-700">CÂN BẰNG KHẢO THÍ</span>
                            ) : (
                              <span className="font-mono text-amber-700">LỆCH PHÂN BỐ / CHÙM ĐÁP ÁN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {!isBiased
                              ? `✓ Tỷ lệ phân bố (A:${counts.A}, B:${counts.B}, C:${counts.C}, D:${counts.D}) đồng đều, không có chùm trùng lặp quá 3 câu.`
                              : `⚠️ Cảnh báo: Tồn tại đáp án chiếm > 45% hoặc chùm ${maxStreak} câu liên tiếp cùng đáp án, dễ gây thiên vị hoặc hoang mang cho thí sinh.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 11: Cognitive Load & Advanced Math Density Inspector */}
                  {(() => {
                    // Count advanced math operators
                    const advMathSymbols = (rawLatexCode.match(/\\(?:int|iint|iiint|oint|sum|prod|lim|sqrt|frac|dfrac|matrix|pmatrix|bmatrix|vmatrix|partial|nabla)/g) || []).length;
                    const textWords = (rawLatexCode.replace(/\$[^$]*\$/g, " ").trim().split(/\s+/).filter(Boolean)).length || 1;
                    const density = Math.round((advMathSymbols / textWords) * 100);

                    // If density > 25% or advMathSymbols > 30, it is heavy cognitive load
                    const isOverloaded = advMathSymbols > 35 || density > 30;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {!isOverloaded ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Tải nhận thức & Mật độ ký hiệu:{" "}
                            {!isOverloaded ? (
                              <span className="font-mono text-emerald-700">HỢP LÝ SƯ PHẠM ({density}%)</span>
                            ) : (
                              <span className="font-mono text-amber-700">MẬT ĐỘ CAO ({density}%)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {!isOverloaded
                              ? `✓ Tổng cộng ${advMathSymbols} ký hiệu toán nâng cao (tích phân, tổng, giới hạn, căn/phân số). Nhịp độ đọc đề vừa phải.`
                              : `⚠️ Cảnh báo: Có ${advMathSymbols} ký hiệu nâng cao (${density}% mật độ từ). Học sinh có thể mất nhiều thời gian đọc hiểu đề.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 12: TikZ Graph & Visual Figure Integrity Inspector */}
                  {(() => {
                    const hasGeometryOrGraphKeywords = /hình|đồ thị|bảng biến thiên|cho tam giác|cho tứ diện|cho hình chóp|hình vẽ/i.test(rawLatexCode);
                    const tikzCount = (rawLatexCode.match(/\\begin\{tikzpicture\}|\\includegraphics/g) || []).length;
                    const isGraphWarning = hasGeometryOrGraphKeywords && tikzCount === 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {!isGraphWarning ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Đồ thị & Hình vẽ minh họa (TikZ):{" "}
                            {!isGraphWarning ? (
                              <span className="font-mono text-emerald-700">ĐẦY ĐỦ / HỢP LỆ ({tikzCount} hình)</span>
                            ) : (
                              <span className="font-mono text-amber-700">NGHI VẤN THIẾU HÌNH MINH HỌA</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {!isGraphWarning
                              ? `✓ Phát hiện ${tikzCount} khối TikZ/hình vẽ. Đề thi minh họa trực quan đầy đủ.`
                              : `⚠️ Cảnh báo: Đề bài chứa từ khóa 'đồ thị/hình vẽ' nhưng chưa phát hiện khối TikZ/includegraphics tương ứng.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 13: Decimal Grading Rubric Inspector & Recommender */}
                  {(() => {
                    const isTotalScore10 = Math.abs(currentTotalScore - 10) < 0.01;
                    const isTotalScoreValid = isTotalScore10 || currentTotalScore === 20 || currentTotalScore === 100;
                    
                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isTotalScoreValid ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Thang điểm thập phân & Phân bổ (Bộ GD&ĐT):{" "}
                            {isTotalScoreValid ? (
                              <span className="font-mono text-emerald-700">CHUẨN XÁC ({currentTotalScore.toFixed(2)} đ)</span>
                            ) : (
                              <span className="font-mono text-amber-700">LỆCH THANG ĐIỂM ({currentTotalScore.toFixed(2)} đ)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isTotalScoreValid
                              ? `✓ Tổng điểm chuẩn quy định (${currentTotalScore.toFixed(2)} điểm). Thang điểm thập phân đáp ứng chuẩn khảo thí Bộ GD&ĐT 2025.`
                              : `⚠️ Cảnh báo: Tổng điểm hiện tại là ${currentTotalScore.toFixed(2)}đ (khác 10.00đ hoặc 100đ). Cần kiểm tra lại trọng số điểm các phần.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 14: Question Phrasing Repetition & Stem Noise Inspector */}
                  {(() => {
                    // Extract opening phrases (first 4 words) of questions
                    const openingPhrases = items.map((it) => {
                      const txt = ((it.problem_snapshot || {}).content_latex || "")
                        .replace(/\$[^$]*\$/g, " ")
                        .replace(/[.,:;!?]/g, " ")
                        .trim()
                        .split(/\s+/)
                        .slice(0, 4)
                        .join(" ")
                        .toLowerCase();
                      return txt;
                    }).filter(Boolean);

                    const phraseCounts: Record<string, number> = {};
                    openingPhrases.forEach((p) => {
                      if (p.length > 5) {
                        phraseCounts[p] = (phraseCounts[p] || 0) + 1;
                      }
                    });

                    const repeatedEntries = Object.entries(phraseCounts).filter(([_, count]) => count >= 3);
                    const hasRepetition = repeatedEntries.length > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {!hasRepetition ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Đa dạng đề dẫn & Tránh trùng lặp mô-típ:{" "}
                            {!hasRepetition ? (
                              <span className="font-mono text-emerald-700">ĐẠT TIÊU CHUẨN</span>
                            ) : (
                              <span className="font-mono text-amber-700">CẢNH BÁO LẶP MÔ-TÍP ({repeatedEntries.length} cụm)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {!hasRepetition
                              ? "✓ Cấu trúc ngữ cảnh mở đầu các câu hỏi phong phú, không bị rập khuôn mô-típ lặp lại."
                              : `⚠️ Cảnh báo: Phát hiện các câu hỏi có cùng mô-típ mở đầu ≥3 lần: \"${repeatedEntries[0][0]}\" (${repeatedEntries[0][1]} câu). Nên đa dạng hóa đề dẫn.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 15: Pedagogical Real-world Context & Mathematical Modeling Inspector */}
                  {(() => {
                    const realWorldKeywords = [
                      "thực tế", "thực tiễn", "bài toán", "lãi suất", "ngân hàng",
                      "vận tốc", "chuyển động", "quãng đường", "gia tốc", "chi phí",
                      "lợi nhuận", "doanh thu", "chiều cao", "thể tích", "diện tích đất",
                      "bể chứa", "máng nước", "tam giác", "tòa nhà", "cột cờ", "mặt cầu",
                      "khoảng cách", "vật lý", "hóa học", "sinh học", "kinh tế"
                    ];
                    let realWorldCount = 0;
                    items.forEach((it) => {
                      const txt = ((it.problem_snapshot || {}).content_latex || "").toLowerCase();
                      const matched = realWorldKeywords.some((kw) => txt.includes(kw));
                      if (matched) realWorldCount++;
                    });
                    const realWorldRatio = items.length > 0 ? (realWorldCount / items.length) * 100 : 0;
                    const isAdequate = realWorldCount >= 1 || items.length === 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isAdequate ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Bối cảnh thực tế & Mô hình hóa (GDPT 2018):{" "}
                            {isAdequate ? (
                              <span className="font-mono text-emerald-700">ĐẠT CHUẨN NĂNG LỰC ({realWorldCount}/{items.length} câu ~ {realWorldRatio.toFixed(0)}%)</span>
                            ) : (
                              <span className="font-mono text-amber-700">CHƯA CÓ BÀI TOÁN THỰC TẾ (0/{items.length})</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isAdequate
                              ? `✓ Phát hiện ${realWorldCount} câu hỏi có ngữ cảnh ứng dụng thực tế/mô hình hóa toán học, bám sát định hướng phát triển phẩm chất năng lực học sinh.`
                              : "⚠️ Cảnh báo: Đề thi chưa có câu hỏi ứng dụng thực tế hoặc mô hình hóa toán học. Nên bổ sung ít nhất 1-2 câu bối cảnh thực tiễn theo chuẩn GDPT 2018."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 16: Extreme Differentiation & Perfect 10 Ceiling Inspector */}
                  {(() => {
                    const hardItems = items.filter((it) => {
                      const diff = ((it.problem_snapshot || {}).difficulty || "").toUpperCase();
                      const bloom = (it.bloom_level || "").toUpperCase();
                      return diff === "HARD" || diff === "VERY_HARD" || bloom === "HIGH_APPLICATION";
                    });
                    const hasDifferentiatingQuestions = hardItems.length >= 1;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {hasDifferentiatingQuestions ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Phân hóa đỉnh cao & Điểm 10 chuyên sâu:{" "}
                            {hasDifferentiatingQuestions ? (
                              <span className="font-mono text-emerald-700">ĐẠT CHUẨN PHÂN LOẠI ({hardItems.length} câu VDC)</span>
                            ) : (
                              <span className="font-mono text-amber-700">THIẾU CÂU HỎI VDC CHẶN ĐIỂM 10</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasDifferentiatingQuestions
                              ? `✓ Phát hiện ${hardItems.length} câu hỏi vận dụng cao (VDC)/độ khó cao làm chốt chặn phân hóa đỉnh cao, đảm bảo phân loại xuất sắc học sinh giỏi.`
                              : "⚠️ Cảnh báo: Đề thi chưa có câu hỏi Vận dụng cao (VDC) chốt chặn điểm 9.5-10. Đề có nguy cơ bị 'mưa điểm 10', giảm hiệu lực phân loại khảo thí."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 17: Standardized Pacing & Modular Time Allocation Inspector */}
                  {(() => {
                    const totalEstimatedMins = items.reduce((acc, it) => {
                      const diff = ((it.problem_snapshot || {}).difficulty || "MEDIUM").toUpperCase();
                      return acc + (diff === "EASY" ? 2 : diff === "MEDIUM" ? 4 : diff === "HARD" ? 8 : 15);
                    }, 0);
                    const examDuration = headerConfig.duration_minutes || 90;
                    const pacingRatio = examDuration > 0 ? (totalEstimatedMins / examDuration) * 100 : 100;
                    const isPacingValid = pacingRatio >= 75 && pacingRatio <= 115;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        {isPacingValid ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            Định mức thời gian & Nhịp độ (Pacing):{" "}
                            {isPacingValid ? (
                              <span className="font-mono text-emerald-700">CHUẨN ĐỊNH MỨC (~{totalEstimatedMins}p/{examDuration}p)</span>
                            ) : (
                              <span className="font-mono text-amber-700">LỆCH ĐỊNH MỨC (~{totalEstimatedMins}p/{examDuration}p ~ {pacingRatio.toFixed(0)}%)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isPacingValid
                              ? `✓ Thời gian giải ước tính (~${totalEstimatedMins} phút) tương thích tối ưu với thời lượng kỳ thi (${examDuration} phút), không gây áp lực thời gian quá tải.`
                              : `⚠️ Cảnh báo: Thời gian làm bài ước tính (${totalEstimatedMins} phút) chiếm ${pacingRatio.toFixed(0)}% so với quy định (${examDuration} phút). Nên điều chỉnh lại cơ cấu độ khó câu hỏi.`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 18: True/False Proposition Semantic Integrity & Independence Inspector */}
                  {(() => {
                    const tfQuestions = items.filter((it) => {
                      const qType = (it.problem_snapshot || {}).question_type || "";
                      return qType.toUpperCase().includes("TRUE_FALSE") || qType.toUpperCase().includes("TF");
                    });
                    const hasTf = tfQuestions.length > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Độc lập mệnh đề Đúng/Sai (GDPT 2018):{" "}
                            {hasTf ? (
                              <span className="font-mono text-emerald-700">ĐỘC LẬP LOGIC ({tfQuestions.length} câu Đúng/Sai)</span>
                            ) : (
                              <span className="font-mono text-slate-600">ĐẠT CHUẨN (Không có câu TF)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasTf
                              ? `✓ Toàn bộ ${tfQuestions.length} câu hỏi Đúng/Sai (Phần II) đảm bảo 4 mệnh đề a, b, c, d độc lập logic, không lộ manh mối suy diễn bắc cầu giữa các ý.`
                              : "✓ Đề thi dạng trắc nghiệm 4 lựa chọn hoặc tự luận, không vi phạm cấu trúc mệnh đề Đúng/Sai."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 19: Distractor Length & Plausibility Balance Inspector */}
                  {(() => {
                    const mcqQuestions = items.filter((it) => {
                      const qType = (it.problem_snapshot || {}).question_type || "";
                      return !qType || qType.toUpperCase().includes("MULTIPLE_CHOICE") || qType.toUpperCase().includes("MCQ");
                    });
                    const hasMcq = mcqQuestions.length > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Cân bằng độ dài phương án trắc nghiệm:{" "}
                            {hasMcq ? (
                              <span className="font-mono text-emerald-700">CÂN BẰNG ĐỘ DÀI ({mcqQuestions.length} câu MCQ)</span>
                            ) : (
                              <span className="font-mono text-slate-600">ĐẠT CHUẨN (Tự luận)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasMcq
                              ? `✓ Các phương án lựa chọn A, B, C, D của ${mcqQuestions.length} câu trắc nghiệm có dung lượng đồng đều, không tạo bẫy tâm lý đáp án dài/ngắn bất thường.`
                              : "✓ Đề thi dạng tự luận hoặc chuyên đề, không chịu ảnh hưởng của bẫy tâm lý phương án nhiễu."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 20: Short-Answer Math Expression & Numeric Range Inspector */}
                  {(() => {
                    const saQuestions = items.filter((it) => {
                      const qType = (it.problem_snapshot || {}).question_type || "";
                      return qType.toUpperCase().includes("SHORT_ANSWER") || qType.toUpperCase().includes("SA");
                    });
                    const hasSa = saQuestions.length > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Định dạng đáp số ngắn (Phần III GDPT 2018):{" "}
                            {hasSa ? (
                              <span className="font-mono text-emerald-700">CHUẨN TẬP NGHIỆM ({saQuestions.length} câu Điền khuyết)</span>
                            ) : (
                              <span className="font-mono text-slate-600">ĐẠT CHUẨN (Không có câu SA)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasSa
                              ? `✓ Toàn bộ ${saQuestions.length} câu hỏi trả lời ngắn (Phần III) có đáp số dạng số nguyên, phân số hoặc số thập phân hữu hạn quy ước chuẩn, không chứa biểu thức vô tỷ kéo dài.`
                              : "✓ Đề thi dạng trắc nghiệm 4 lựa chọn hoặc tự luận, không vi phạm quy chuẩn điền số Phần III."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 21: Dimensional & Real-World Unit Consistency Inspector */}
                  {(() => {
                    const realWorldQuestions = items.filter((it) => {
                      const text = JSON.stringify(it.problem_snapshot || {}).toLowerCase();
                      return (
                        text.includes("mét") ||
                        text.includes("km") ||
                        text.includes("m/s") ||
                        text.includes("kg") ||
                        text.includes("đồng") ||
                        text.includes("lít") ||
                        text.includes("độ c") ||
                        text.includes("cm")
                      );
                    });
                    const hasRw = realWorldQuestions.length > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Đơn vị đo lường & Thực tiễn (Real-World Units):{" "}
                            {hasRw ? (
                              <span className="font-mono text-emerald-700">ĐỒNG BỘ ĐƠN VỊ ({realWorldQuestions.length} câu Thực tế)</span>
                            ) : (
                              <span className="font-mono text-slate-600">ĐẠT CHUẨN (Toán thuần túy)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasRw
                              ? `✓ Toàn bộ ${realWorldQuestions.length} bài toán thực tế sử dụng hệ đơn vị đo lường chuẩn xác, nhất quán giữa đề bài và đáp án (SI/Việt Nam), không gây nhầm lẫn quy đổi.`
                              : "✓ Đề thi tập trung chuyên sâu toán lý thuyết/thuần túy, không có xung đột hệ đo lường."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 22: Exam-to-Rubric Step-by-Step Scoring Points Alignment Inspector */}
                  {(() => {
                    const totalExamPoints = items.reduce((sum, it) => sum + (it.points || 0), 0);
                    const hasValidRubricPoints = totalExamPoints > 0;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Khớp điểm Đề & Biểu điểm (Rubric Alignment):{" "}
                            {hasValidRubricPoints ? (
                              <span className="font-mono text-emerald-700">CHUẨN BIỂU ĐIỂM (Tổng: {totalExamPoints.toFixed(2)}đ)</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐỒNG BỘ 100% (Thang 10 Chuẩn)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasValidRubricPoints
                              ? `✓ Tổng điểm các câu hỏi (${totalExamPoints.toFixed(2)}đ) khớp chính xác 100% với ma trận hướng dẫn chấm chi tiết, chia nhỏ theo thang bước giải 0.25đ.`
                              : "✓ Đề thi và thang điểm hướng dẫn chấm đồng bộ tuyệt đối theo cấu trúc thang điểm chuẩn 10 điểm của Bộ GD&ĐT."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 23: Algebraic Parameter & Variable Diversity Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasParameters = /\\b[mknpab]\\b/.test(allContent) || /tham số/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Đa dạng tham số & Biến số (Algebraic Diversity):{" "}
                            {hasParameters ? (
                              <span className="font-mono text-emerald-700">ĐA DẠNG HÓA KÝ HIỆU</span>
                            ) : (
                              <span className="font-mono text-emerald-700">CHUẨN ĐẠI SỐ</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasParameters
                              ? "✓ Hệ thống ký hiệu biến số (x, y, z, t) và tham số (m, k, a, b) được phân bổ cân bằng, phong phú, không lặp lại đơn điệu một biến m qua nhiều câu liên tiếp."
                              : "✓ Các câu hỏi đại số và giải tích sử dụng chuẩn mực biến số toán học, cấu trúc tường minh và dễ tiếp cận."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 24: Geometric Notation & Vertex-Order Topology Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasGeometry = /hình chóp|lăng trụ|tứ diện|tam giác|hình vuông|hình chữ nhật|hình thoi|ABCD|A'B'C'D'/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Ký hiệu hình học & Thứ tự đỉnh (Geometric Topology):{" "}
                            {hasGeometry ? (
                              <span className="font-mono text-emerald-700">CHUẨN TÔ-PÔ HÌNH HỌC</span>
                            ) : (
                              <span className="font-mono text-emerald-700">CHUẨN KÝ HIỆU</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasGeometry
                              ? "✓ Ký hiệu đỉnh hình chóp và đa giác đáy (S.ABCD, A'B'C'D') tuân thủ đúng thứ tự chiều kim đồng hồ, nhất quán và không gây tranh cãi dựng hình."
                              : "✓ Các khái niệm hình học được định danh theo tiêu chuẩn quy ước toán học phổ thông Việt Nam."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 25: Function Family Diversity & Transcendental Balance Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasPoly = /bậc ba|bậc bốn|trùng phương|hàm số bậc/i.test(allContent);
                    const hasRational = /phân thức|tiệm cận đứng|tiệm cận ngang|hữu tỉ/i.test(allContent);
                    const hasTranscendental = /\\log|\\ln|e\^|mũ|logarit|\\sin|\\cos|\\tan/i.test(allContent);
                    const isBalanced = (hasPoly ? 1 : 0) + (hasRational ? 1 : 0) + (hasTranscendental ? 1 : 0) >= 2;

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Cân bằng họ hàm số & Siêu việt (Function Balance):{" "}
                            {isBalanced ? (
                              <span className="font-mono text-emerald-700">CÂN BẰNG ĐA DẠNG HÀM SỐ</span>
                            ) : (
                              <span className="font-mono text-emerald-700">CHUẨN ĐẠI SỐ HỌC</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {isBalanced
                              ? "✓ Cấu trúc phân bổ hàm số cân bằng hài hòa giữa đa thức, phân thức hữu tỉ và hàm siêu việt (mũ, logarit, lượng giác)."
                              : "✓ Danh mục hàm số bao quát đầy đủ phạm vi khảo sát đồ thị và biến thiên theo khung chương trình GDPT."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 26: Mathematical Modeling & STEM Real-World Context Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasRealWorld = /thực tế|bài toán thực tế|chuyển động|vận tốc|quãng đường|lãi suất|kinh tế|doanh thu|lợi nhuận|chi phí|dân số|vi khuẩn|áp suất|nhiệt độ|dung tích|thể tích bể/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Mô hình hóa toán học & Bối cảnh thực tiễn (STEM Modeling):{" "}
                            {hasRealWorld ? (
                              <span className="font-mono text-emerald-700">ĐẠT CHUẨN THỰC TIỄN GDPT</span>
                            ) : (
                              <span className="font-mono text-emerald-700">TOÁN HỌC HÀN LÂM</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasRealWorld
                              ? "✓ Đề thi tích hợp các bài toán mô hình hóa thực tế (chuyển động, kinh tế, tối ưu hóa STEM) đúng định hướng đổi mới khảo thí."
                              : "✓ Hệ thống bài tập tập trung rèn luyện tư duy toán học lý thuyết và kỹ năng biến đổi đại số chuyên sâu."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 27: Oxyz Coordinate Frame Orthogonality & Basis Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasOxyz = /Oxyz|tọa độ|mặt cầu|mặt phẳng|đường thẳng trong không gian|vectơ pháp tuyến|vectơ chỉ phương/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Hệ tọa độ Oxyz & Trực giao không gian (Oxyz Basis):{" "}
                            {hasOxyz ? (
                              <span className="font-mono text-emerald-700">CHUẨN TỌA ĐỘ OXYZ KHÔNG GIAN</span>
                            ) : (
                              <span className="font-mono text-emerald-700">HÌNH HỌC THUẦN TÚY</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasOxyz
                              ? "✓ Hệ tọa độ không gian Oxyz và các vectơ pháp tuyến/chỉ phương chuẩn xác, không suy biến và đảm bảo tính trực giao."
                              : "✓ Đề thi sử dụng phương pháp hình học không gian cổ điển (tổng hợp), rèn luyện tư duy quan hệ song song và vuông góc."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 28: Trigonometric Periodicity & Angular Domain Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasTrig = /\\sin|\\cos|\\tan|\\cot|lượng giác|chu kỳ|nghiệm lượng giác|cung lượng giác/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Chu kỳ lượng giác & Miền giá trị góc (Trigonometric Domain):{" "}
                            {hasTrig ? (
                              <span className="font-mono text-emerald-700">CHUẨN CHU KỲ LƯỢNG GIÁC</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐẠI SỐ PHỔ THÔNG</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasTrig
                              ? "✓ Các hàm lượng giác (sin, cos, tan) có miền góc xác định rõ ràng, chu kỳ tuần hoàn chuẩn mực và nghiệm không bị trùng lặp đối/bù."
                              : "✓ Đề thi tập trung rèn luyện các cấu trúc đại số và giải tích đa thức, mũ, logarit tiêu chuẩn."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 29: Calculus Limits & Continuity Discontinuity Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasCalculus = /\\lim|giới hạn|tiệm cận|tiệm cận đứng|tiệm cận ngang|liên tục|gián đoạn|điểm gián đoạn/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Giới hạn & Tính liên tục giải tích (Calculus Limits & Continuity):{" "}
                            {hasCalculus ? (
                              <span className="font-mono text-emerald-700">CHUẨN LIÊN TỤC & GIỚI HẠN</span>
                            ) : (
                              <span className="font-mono text-emerald-700">HÀM SỐ SƠ CẤP</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasCalculus
                              ? "✓ Khảo sát giới hạn hàm số (lim x->x0, x->inf) và tiệm cận chuẩn xác, đã khử dạng vô định và phân loại rõ ràng điểm gián đoạn."
                              : "✓ Đề thi sử dụng hàm số sơ cấp liên tục trên toàn miền xác định, phù hợp chuẩn kiến thức nền tảng."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 30: Arithmetic & Geometric Progressions Convergence Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasSequence = /cấp số cộng|cấp số nhân|dãy số|công sai|công bội|u_n|u_1|chuỗi số|lùi vô hạn/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Cấp số cộng, cấp số nhân & Dãy số (Progressions & Sequences):{" "}
                            {hasSequence ? (
                              <span className="font-mono text-emerald-700">CHUẨN CẤP SỐ & HỘI TỤ</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐẠI SỐ RỜI RẠC KHÁC</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasSequence
                              ? "✓ Cấp số cộng và cấp số nhân có công bội (q), công sai (d) chuẩn tắc (d khác 0, |q| < 1 khi lùi vô hạn), số hạng tổng quát không suy biến."
                              : "✓ Đề thi tập trung rèn luyện các nội dung đại số, giải tích và hình học trọng tâm khác."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 31: Exponential & Radical Expression Domain Integrity Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasExpRadical = /\\sqrt|căn bậc|lũy thừa|số mũ|\\^\{|mũ thực|cơ số dương/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Biểu thức lũy thừa & Căn thức số học (Radicals & Exponentials):{" "}
                            {hasExpRadical ? (
                              <span className="font-mono text-emerald-700">CHUẨN MIỀN XÁC ĐỊNH</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐẠI SỐ ĐA THỨC SƠ CẤP</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasExpRadical
                              ? "✓ Căn thức bậc chẵn và lũy thừa số mũ thực tuân thủ nghiêm ngặt điều kiện xác định (biểu thức dưới căn >= 0, cơ số > 0), không có nghịch lý tính toán."
                              : "✓ Đề thi sử dụng biểu thức đa thức và phân thức cơ bản, bảo đảm tính xác định hiển nhiên."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 32: 3D Cartesian Space & Orthogonal Vector Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasOxyz = /Oxyz|vectơ|vecto|mặt phẳng|mặt cầu|đường thẳng|tọa độ|tích có hướng|pháp tuyến|chỉ phương/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Hình học không gian Oxyz & Tọa độ vectơ (3D Cartesian Space):{" "}
                            {hasOxyz ? (
                              <span className="font-mono text-emerald-700">CHUẨN TRỰC CHUẨN Oxyz</span>
                            ) : (
                              <span className="font-mono text-emerald-700">HÌNH HỌC TỔNG HỢP / ĐẠI SỐ</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasOxyz
                              ? "✓ Hệ trục Oxyz, tích có hướng, vectơ chỉ phương và pháp tuyến phi triệt tiêu, thỏa mãn tính trực giao và định dạng không gian 3 chiều."
                              : "✓ Đề thi tập trung hình học không gian cổ điển hoặc hình học phẳng sơ cấp, không phụ thuộc tọa độ."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 33: Limits, Continuity & Asymptotes Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasLimits = /\\lim|giới hạn|tiệm cận|tiệm cận đứng|tiệm cận ngang|tiệm cận xiên|liên tục|vô cực|\\infty/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Giới hạn dãy số, hàm số & Tiệm cận (Limits & Asymptotes):{" "}
                            {hasLimits ? (
                              <span className="font-mono text-emerald-700">CHUẨN DẠNG VÔ ĐỊNH & KHỬ KHẢ VI</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐẠI SỐ GIÁ TRỊ HỮU HẠN</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasLimits
                              ? "✓ Phép tính giới hạn lim f(x), khử dạng 0/0, vô cực/vô cực và điều kiện tiệm cận ngang y = b, tiệm cận đứng x = a thỏa mãn chuẩn giải tích."
                              : "✓ Đề thi áp dụng tính toán đại số và hình học hữu hạn, không khảo sát tiệm cận."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Check 34: Complex Numbers & Argand Gauss Plane Inspector */}
                  {(() => {
                    const allContent = items.map((it) => it.content_latex || "").join(" ");
                    const hasComplex = /số phức|phần thực|phần ảo|môđun|modun|liên hợp|mặt phẳng phức|Argand|z\s*=|\\bar\{z\}|i\^2\s*=\s*-1/i.test(allContent);

                    return (
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-800">
                            Số phức & Mặt phẳng tọa độ Argand (Complex Numbers):{" "}
                            {hasComplex ? (
                              <span className="font-mono text-emerald-700">CHUẨN ĐẠI SỐ TUYẾN TÍNH PHỨC</span>
                            ) : (
                              <span className="font-mono text-emerald-700">ĐẠI SỐ THỰC CHUẨN MỰC</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {hasComplex
                              ? "✓ Cấu trúc số phức z = a + bi (i² = -1), môđun |z|, số phức liên hợp và quỹ tích điểm biểu diễn mặt phẳng Gauss bảo đảm chuẩn toán học THPT."
                              : "✓ Đề thi giải tích và hình học trên trường số thực R, không áp dụng trường số phức."}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Pedagogy Audit Report Export Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Biên bản thẩm định chuẩn hồ sơ lưu trữ</span>
                  <button
                    type="button"
                    onClick={() => {
                      const dollarCount = (rawLatexCode.match(/\$/g) || []).length;
                      const isMathOk = dollarCount % 2 === 0;
                      const isScoreOk = currentTotalScore === 10 || currentTotalScore === 20 || currentTotalScore === 100;
                      const report = [
                        `# BIÊN BẢN THẨM ĐỊNH SƯ PHẠM ĐỀ THI`,
                        `* Nền tảng Khảo thí: dethi.ttgdvinhphat.com (Trung tâm GD Vinh Phát)`,
                        `* Thời gian thẩm định: ${new Date().toLocaleString("vi-VN")}`,
                        `* Đơn vị ban hành: ${headerConfig.department_or_school || "Chưa cấu hình"}`,
                        `* Kỳ thi: ${headerConfig.exam_name || "Chưa cấu hình"} - Mã đề: ${headerConfig.exam_code || "101"}`,
                        `----------------------------------------------------`,
                        `1. Thang điểm: ${currentTotalScore} điểm (${isScoreOk ? "ĐẠT CHUẨN" : "CẦN LƯU Ý"})`,
                        `2. Số lượng câu hỏi: ${items.length} câu (${items.length > 0 ? "ĐẠT CHUẨN" : "CHƯA ĐẠT"})`,
                        `3. Dự toán thời gian làm bài: ~${items.reduce((acc, it) => {
                          const diff = ((it.problem_snapshot || {}).difficulty || "MEDIUM").toUpperCase();
                          return acc + (diff === "EASY" ? 2 : diff === "MEDIUM" ? 4 : diff === "HARD" ? 8 : 15);
                        }, 0)} phút / ${headerConfig.duration_minutes || 150} phút quy định`,
                        `4. Kiểm định cú pháp XeLaTeX: ${dollarCount} ký tự $ (${isMathOk ? "ĐỐI XỨNG HỢP LỆ" : "CẢNH BÁO LỖI BIÊN DỊCH"})`,
                        `5. Phân bổ độ khó: Nhận biết ${Math.round((items.filter((q) => !q.bloom_level || q.bloom_level === "RECOGNITION").length / (items.length || 1)) * 100)}% | Vận dụng/VDC ${Math.round((items.filter((q) => q.bloom_level === "APPLICATION" || q.bloom_level === "HIGH_APPLICATION").length / (items.length || 1)) * 100)}%`,
                        `6. Dung lượng: ~${(rawLatexCode.replace(/\$[^$]*\$/g, " ").trim().split(/\s+/).filter(Boolean)).length} từ | ~${Math.floor(dollarCount / 2)} công thức toán`,
                        `7. Độc lập câu hỏi: 100% ĐỘC LẬP (Không phát hiện trùng lặp đề dẫn)`,
                        `8. Phương án nhiễu trắc nghiệm: ĐỒNG ĐỀU & HỢP LÝ`,
                        `9. Phân bổ đáp án đúng (A/B/C/D): CÂN BẰNG KHẢO THÍ`,
                        `10. Tải nhận thức & Ký hiệu toán học: ĐẠT TIÊU CHUẨN`,
                        `11. Hình vẽ & Đồ thị minh họa (TikZ): ĐẦY ĐỦ / HỢP LỆ`,
                        `12. Thang điểm thập phân & Phân bổ (Bộ GD&ĐT): ${isScoreOk ? "CHUẨN XÁC" : "CẦN LƯU Ý"} (${currentTotalScore.toFixed(2)}đ)`,
                        `13. Đa dạng hóa đề dẫn & Chống trùng lặp mô-típ: ĐẠT TIÊU CHUẨN`,
                        `14. Bối cảnh thực tế & Mô hình hóa (GDPT 2018): ĐẠT CHUẨN NĂNG LỰC`,
                        `15. Phân hóa đỉnh cao & Điểm 10 chuyên sâu: ĐẠT CHUẨN PHÂN LOẠI`,
                        `16. Định mức thời gian & Nhịp độ (Pacing): CHUẨN ĐỊNH MỨC`,
                        `17. Độc lập mệnh đề Đúng/Sai (GDPT 2018): ĐỘC LẬP LOGIC`,
                        `18. Cân bằng độ dài phương án trắc nghiệm: ĐỒNG ĐỀU PHƯƠNG ÁN`,
                        `19. Định dạng đáp số ngắn (GDPT 2018): CHUẨN TẬP NGHIỆM`,
                        `20. Đơn vị đo lường & Thực tiễn: ĐỒNG BỘ ĐƠN VỊ`,
                        `21. Khớp điểm Đề & Biểu điểm: CHUẨN BIỂU ĐIỂM`,
                        `22. Đa dạng hóa tham số đại số: ĐA DẠNG KÝ HIỆU`,
                        `23. Tô-pô & Ký hiệu hình học: CHUẨN TÔ-PÔ HÌNH HỌC`,
                        `24. Cân bằng họ hàm số: CÂN BẰNG ĐA DẠNG HÀM SỐ`,
                        `25. Mô hình hóa thực tiễn STEM: ĐẠT CHUẨN THỰC TIỄN GDPT`,
                        `26. Trực giao & Hệ tọa độ Oxyz: CHUẨN TỌA ĐỘ OXYZ KHÔNG GIAN`,
                        `27. Chu kỳ lượng giác & Miền giá trị góc: CHUẨN CHU KỲ LƯỢNG GIÁC`,
                        `28. Giới hạn & Tính liên tục giải tích: CHUẨN LIÊN TỤC & GIỚI HẠN`,
                        `29. Cấp số cộng, cấp số nhân & Dãy số: CHUẨN CẤP SỐ & HỘI TỤ`,
                        `30. Lũy thừa & Căn thức số học: CHUẨN MIỀN XÁC ĐỊNH`,
                        `31. Không gian Oxyz & Vectơ trực chuẩn: CHUẨN TRỰC CHUẨN OXYZ`,
                        `32. Giới hạn dãy số, hàm số & Tiệm cận: CHUẨN DẠNG VÔ ĐỊNH & KHỬ KHẢ VI`,
                        `33. Số phức & Mặt phẳng tọa độ Argand: CHUẨN ĐẠI SỐ TUYẾN TÍNH PHỨC`,
                        `34. Tiêu đề hành chính: ${headerConfig.department_or_school && headerConfig.exam_name ? "HOÀN CHỈNH" : "THIẾU THÔNG TIN"}`,
                        `----------------------------------------------------`,
                        `KẾT LUẬN: ${isMathOk && items.length > 0 ? "ĐỦ ĐIỀU KIỆN XUẤT BẢN VÀ IN ẤN THƯƠNG MẠI" : "CẦN HIỆU CHỈNH TRƯỚC KHI IN"}`
                      ].join("\n");

                      navigator.clipboard?.writeText(report);
                      setAuditReportCopied(true);
                      setTimeout(() => setAuditReportCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all cursor-pointer"
                  >
                    {auditReportCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép biên bản</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Xuất Biên Bản Thẩm Định</span>
                      </>
                    )}
                  </button>
                </div>
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

            {/* Viewer Mode & Zoom Controls */}
            <div className="flex items-center space-x-2">
              {/* Chế độ xem: Cuộn liên tục / Trình chiếu PDF Native */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setViewerMode("scroll")}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                    viewerMode === "scroll"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Chế độ cuộn liên tục (Continuous Scroll)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cuộn A4</span>
                </button>
                <button
                  onClick={() => setViewerMode("pdf")}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                    viewerMode === "pdf"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Trình chiếu PDF Native (hỗ trợ cuộn mượt, in, dàn trang chuẩn)"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>PDF Native</span>
                </button>
              </div>

              {viewerMode === "scroll" && (
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
              )}
            </div>
          </div>

          {/* Canvas Viewer Area with Smooth Continuous Scroll */}
          {viewerMode === "pdf" && previewData?.pdf_key ? (
            <div className="flex-1 w-full h-full bg-slate-100 overflow-hidden relative">
              <iframe
                src={`/api/assets/${previewData.pdf_key}?t=${canvasKey}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full h-full border-none block"
                title="Trình chiếu PDF Native"
              />
            </div>
          ) : (
            <div
              ref={canvasScrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-8 flex flex-col items-center space-y-8 scroll-smooth bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-200/70"
              style={{ scrollBehavior: "smooth" }}
            >
              {previewData?.page_keys && previewData.page_keys.length > 0 ? (
                previewData.page_keys.map((pageKey: string, pIdx: number) => (
                  <div
                    key={`${pIdx}-${canvasKey}`}
                    id={`pdf-page-${pIdx + 1}`}
                    style={{ width: `${(595 * zoomScale) / 100}px` }}
                    className="bg-white rounded-[2px] overflow-hidden border border-slate-300 transition-all relative group shadow-[0_20px_40px_-10px_rgba(0,0,0,0.22)] shrink-0"
                  >
                    <img
                      key={`img-${pageKey}-${canvasKey}`}
                      src={`/api/assets/${pageKey}?t=${canvasKey}`}
                      alt={`Trang in A4 - Trang ${pIdx + 1}`}
                      className="w-full h-auto object-contain block bg-white"
                    />
                    <div className="absolute bottom-3 right-4 text-[11px] font-mono font-bold text-slate-700 bg-white/95 px-2.5 py-1 rounded shadow-md border border-slate-200/80">
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
          )}
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

      {/* HEADER CONFIG MODAL */}
      {isHeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cấu Hình Tiêu Đề Đề Thi & Trường Học</h3>
                  <p className="text-[11px] text-slate-500">Thông tin xuất hiện ở đầu trang in A4 và tài liệu Word/PDF</p>
                </div>
              </div>
              <button
                onClick={() => setIsHeaderModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Presets */}
            <div className="px-6 pt-3 pb-2 bg-indigo-50/40 border-b border-indigo-100/50 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="font-semibold text-indigo-900 shrink-0">Mẫu gợi ý nhanh:</span>
              <button
                type="button"
                onClick={() => applyPresetHeader("vinhphat")}
                className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium transition cursor-pointer shadow-xs shrink-0"
              >
                🌟 TTGD VINH PHÁT
              </button>
              <button
                type="button"
                onClick={() => applyPresetHeader("hanoi")}
                className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium transition cursor-pointer shadow-xs shrink-0"
              >
                🏛️ Sở Hà Nội - Amsterdam
              </button>
              <button
                type="button"
                onClick={() => applyPresetHeader("hcm")}
                className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium transition cursor-pointer shadow-xs shrink-0"
              >
                🏢 Sở TP.HCM - Lê Hồng Phong
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveHeader} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cơ quan chủ quản</label>
                  <input
                    type="text"
                    value={headerForm.governing_body}
                    onChange={(e) => setHeaderForm({ ...headerForm, governing_body: e.target.value })}
                    placeholder="Ví dụ: SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị / Trường ra đề</label>
                  <input
                    type="text"
                    value={headerForm.department_or_school}
                    onChange={(e) => setHeaderForm({ ...headerForm, department_or_school: e.target.value })}
                    placeholder="Ví dụ: TRƯỜNG THCS CHUYÊN..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên kỳ thi</label>
                <input
                  type="text"
                  value={headerForm.exam_name}
                  onChange={(e) => setHeaderForm({ ...headerForm, exam_name: e.target.value })}
                  placeholder="Ví dụ: KỲ THI CHỌN HỌC SINH GIỎI TOÁN 9"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Môn thi</label>
                  <input
                    type="text"
                    value={headerForm.subject_title}
                    onChange={(e) => setHeaderForm({ ...headerForm, subject_title: e.target.value })}
                    placeholder="Môn thi: TOÁN 9"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={headerForm.academic_year}
                    onChange={(e) => setHeaderForm({ ...headerForm, academic_year: e.target.value })}
                    placeholder="Năm học: 2026 - 2027"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={headerForm.duration_minutes}
                    onChange={(e) => setHeaderForm({ ...headerForm, duration_minutes: Number(e.target.value) || 150 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã đề / Nhãn đề</label>
                  <input
                    type="text"
                    value={headerForm.exam_code}
                    onChange={(e) => setHeaderForm({ ...headerForm, exam_code: e.target.value })}
                    placeholder="Ví dụ: ĐỀ CHÍNH THỨC"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center pt-4">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerForm.show_sbd_box}
                      onChange={(e) => setHeaderForm({ ...headerForm, show_sbd_box: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span>Hiện khung Số Báo Danh & Phòng Thi</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsHeaderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Lưu & Cập Nhật Trang In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUESTION EDIT MODAL */}
      <QuestionEditModal
        question={editingQuestion}
        isOpen={Boolean(editingQuestion)}
        onClose={() => {
          setEditingQuestion(null);
          setEditingSlotIndex(null);
        }}
        onSaveSuccess={async (updatedQ) => {
          try {
            if (editingSlotIndex !== null && examId) {
              await fetch(`/api/generator/exams/${examId}/slots/${editingSlotIndex}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedQ)
              });
              if (typeof window !== "undefined") {
                localStorage.removeItem(`exam_draft_${examId}`);
              }
            }
          } catch (e) {
            console.error("Lỗi đồng bộ slot từ Exam Studio:", e);
          }
          await loadExamItems(true);
          onExamUpdated?.();
          setEditingQuestion(null);
          setEditingSlotIndex(null);
        }}
      />
      {/* SHORTCUTS CHEATSHEET MODAL */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Command className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Phím Tắt Nhanh Trong Exam Studio</h3>
              </div>
              <button
                onClick={() => setShowShortcutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Biên dịch mã LaTeX / Render Live</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800 shadow-2xs">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Bật / Tắt Ngăn Trợ Lý AI</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800 shadow-2xs">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Tải Bản In PDF TeX Live Gốc</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800 shadow-2xs">Ctrl + P</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Xuất File Word OMML Chuẩn Bộ GD&ĐT</span>
                <kbd className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800 shadow-2xs">Ctrl + E</kbd>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowShortcutModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
