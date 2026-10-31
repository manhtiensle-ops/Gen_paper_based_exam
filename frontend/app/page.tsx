"use client";

import React, { useState, useEffect } from "react";
import MathRenderer from "@/components/MathRenderer";
import QuestionEditModal from "@/components/QuestionEditModal";
import ExamStudioView from "@/components/ExamStudioView";
import BlueprintBuilderModal from "@/components/BlueprintBuilderModal";
import CreativeEmptyState from "@/components/CreativeEmptyState";
import ExamWorkspaceRail from "@/components/ExamWorkspaceRail";
import {
  saveWorkspaceSession,
  getWorkspaceSession,
  hasAnyUnsavedDrafts,
} from "@/utils/workspaceStorage";
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
  Scale,
  Sliders,
  X,
  Copy,
  User as UserIcon
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"generator" | "questions" | "ingestion" | "review" | "studio">("generator");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Nhận diện tài khoản hiện tại (nếu là GUEST thì currentUser = null)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("hsg_logged_out") === "true") {
      setCurrentUser(null);
      return;
    }
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch(() => setCurrentUser(null));
  }, []);
  
  // Questions Bank State with Pagination & Scope
  const [questions, setQuestions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterScope, setFilterScope] = useState<"ALL" | "MINE" | "TENANT" | "SYSTEM">("ALL");

  // Source Exams State
  const [sourceExams, setSourceExams] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; stage: string } | null>(null);

  // Generator & Assembled Exam State
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [generatedExam, setGeneratedExam] = useState<any | null>(null);
  const [savedExamsList, setSavedExamsList] = useState<any[]>([]);
  const [examFolders, setExamFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isFolderRailCollapsed, setIsFolderRailCollapsed] = useState<boolean>(false);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState("Đề thi chọn HSG Toán 9 - Đề số 01");
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  // Handle tab navigation with URL Query string & Session persistence
  const handleTabChange = (tab: "generator" | "questions" | "ingestion" | "review" | "studio") => {
    setActiveTab(tab);
    const examId = generatedExam?.id;
    saveWorkspaceSession(tab, examId, generatedExam);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      if (examId && (tab === "studio" || tab === "generator")) {
        url.searchParams.set("exam_id", examId);
      } else {
        url.searchParams.delete("exam_id");
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const fetchExamById = async (id: string, targetTab?: any) => {
    try {
      const res = await fetch(`/api/generator/exams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGeneratedExam(data);
        saveWorkspaceSession(targetTab || activeTab, data.id, data);
      }
    } catch (e) {
      console.warn("Could not fetch exam by id:", e);
    }
  };

  // Restore session on mount (Disaster Recovery from URL & LocalStorage SWR)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Nếu người dùng đã đăng xuất: Xóa sạch dữ liệu bài thi cũ trên view
    if (localStorage.getItem("hsg_logged_out") === "true") {
      setGeneratedExam(null);
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = urlParams.get("tab") as any;
    const urlExamId = urlParams.get("exam_id");

    const session = getWorkspaceSession();

    // 1. Restore active tab
    const effectiveTab = urlTab && ["generator", "questions", "ingestion", "review", "studio"].includes(urlTab)
      ? urlTab
      : session?.active_tab || "generator";
    setActiveTab(effectiveTab);

    // 2. Restore generatedExam in 0ms from cache
    if (session?.cached_exam_data) {
      setGeneratedExam(session.cached_exam_data);
    }

    const effectiveExamId = urlExamId || session?.active_exam_id;
    if (effectiveExamId) {
      fetchExamById(effectiveExamId, effectiveTab);
    }

    // 3. Register navigation guard for unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyUnsavedDrafts()) {
        e.preventDefault();
        e.returnValue = "Bạn có thay đổi chưa lưu trong đề thi. Bạn có chắc muốn rời đi?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Swap Slot Modal State
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<any[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Ánh xạ nhãn tiếng Việt chuẩn sư phạm cho các chủ đề toán học
  const TOPIC_VI_MAP: Record<string, string> = {
    ALGEBRA: "Đại số",
    NUMBER_THEORY: "Số học",
    PLANE_GEOMETRY: "Hình học phẳng",
    SOLID_GEOMETRY: "Hình không gian",
    INEQUALITY_EXTREMA: "Bất đẳng thức & Cực trị",
    COMBINATORICS_PROBABILITY: "Tổ hợp & Xác suất",
    REAL_WORLD_MATH: "Toán thực tế",
  };

  // Helper trả về style màu Pastel theo chuyên đề Toán THCS
  const getTopicBadgeStyle = (topic: string) => {
    switch (topic) {
      case "ALGEBRA":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "NUMBER_THEORY":
        return "bg-violet-50 text-violet-700 border-violet-200/80";
      case "PLANE_GEOMETRY":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "SOLID_GEOMETRY":
        return "bg-teal-50 text-teal-700 border-teal-200/80";
      case "INEQUALITY_EXTREMA":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "COMBINATORICS_PROBABILITY":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "REAL_WORLD_MATH":
        return "bg-cyan-50 text-cyan-700 border-cyan-200/80";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200/80";
    }
  };

  // Helper trả về style theo 4 mức độ khó
  const getDifficultyBadgeStyle = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";
      case "MEDIUM":
        return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/25";
      case "HARD":
        return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/25";
      case "OLYMPIAD":
        return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/25";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20";
    }
  };

  const getDifficultyLeftBorder = (diff: string) => {
    switch (diff) {
      case "OLYMPIAD":
        return "border-l-4 border-l-purple-600";
      case "HARD":
        return "border-l-4 border-l-rose-500";
      case "MEDIUM":
        return "border-l-4 border-l-amber-500";
      case "EASY":
        return "border-l-4 border-l-emerald-500";
      default:
        return "border-l-4 border-l-slate-300";
    }
  };
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

  // Fetch Questions with Pagination & Scope support
  const fetchQuestions = async (pageOverride?: number, scopeOverride?: string) => {
    setLoadingQuestions(true);
    try {
      const pageToFetch = pageOverride !== undefined ? pageOverride : currentPage;
      const effectiveScope = scopeOverride !== undefined ? scopeOverride : filterScope;
      const params = new URLSearchParams();
      if (filterTopic) params.append("main_topic", filterTopic);
      if (filterDifficulty) params.append("difficulty", filterDifficulty);
      if (filterSection) params.append("section_type", filterSection);
      if (effectiveScope) params.append("scope", effectiveScope);
      params.append("page", pageToFetch.toString());
      params.append("page_size", pageSize.toString());

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Hỗ trợ cả payload phân trang mới và mảng fallback
        if (data && Array.isArray(data.items)) {
          setQuestions(data.items);
          setTotalQuestions(data.total || 0);
          setTotalPages(data.total_pages || 1);
          setCurrentPage(data.page || 1);
        } else if (Array.isArray(data)) {
          setQuestions(data);
          setTotalQuestions(data.length);
          setTotalPages(1);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Source Exams with Scope (Chỉ xem đề của chính tài khoản)
  const fetchSourceExams = async () => {
    try {
      const res = await fetch("/api/exams?scope=MINE");
      if (res.ok) {
        const data = await res.json();
        setSourceExams(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Saved Exams & Folders List for Left Explorer Rail
  const fetchSavedExamsAndFolders = async () => {
    try {
      const [examsRes, foldersRes] = await Promise.all([
        fetch("/api/generator/exams"),
        fetch("/api/generator/folders"),
      ]);
      if (examsRes.ok) {
        const data = await examsRes.json();
        setSavedExamsList(data);
      }
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setExamFolders(data);
      }
    } catch (err) {
      console.error("Fetch saved exams/folders error:", err);
    }
  };

  // Load a saved exam by ID into current view
  const handleSelectExamFromRail = async (examId: string) => {
    try {
      const res = await fetch(`/api/generator/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setGeneratedExam(data);
        setExamTitle(data.title);
        if (data.blueprint_id) setSelectedBlueprintId(data.blueprint_id);
        saveWorkspaceSession("generator", data.id, data);
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("exam_id", data.id);
          window.history.replaceState(null, "", url.toString());
        }
      }
    } catch (err) {
      console.error("Select exam error:", err);
    }
  };

  // Create New Exam Folder
  const handleCreateNewFolder = async (folderName: string) => {
    try {
      const res = await fetch("/api/generator/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName }),
      });
      if (res.ok) {
        await fetchSavedExamsAndFolders();
      }
    } catch (err) {
      console.error("Create folder error:", err);
    }
  };

  // Fetch Blueprints on Mount
  const fetchBlueprints = async () => {
    try {
      const res = await fetch("/api/generator/blueprints");
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data);
        if (data.length > 0) {
          const exists = data.some((b: any) => b.id === selectedBlueprintId);
          if (!exists) {
            setSelectedBlueprintId(data[0].id);
          }
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
    fetchSavedExamsAndFolders();
  }, []);

  useEffect(() => {
    // Reset về trang 1 khi người dùng đổi bộ lọc hoặc scope
    setCurrentPage(1);
    fetchQuestions(1, filterScope);
  }, [filterTopic, filterDifficulty, filterSection, filterScope, pageSize]);

  // Quick Preset Selection Handler from Creative Empty State
  const handleSelectPresetFromEmptyState = async (keyword: string) => {
    // Tìm blueprint tương ứng theo từ khóa
    let targetBp = blueprints.find((b) =>
      b.name.toLowerCase().includes(keyword.toLowerCase().slice(0, 8))
    );
    if (!targetBp && blueprints.length > 0) {
      targetBp = blueprints[0];
    }

    if (targetBp) {
      setSelectedBlueprintId(targetBp.id);
      setExamTitle(`Đề thi chọn HSG Toán 9 - ${targetBp.name.slice(0, 25)}`);
      // Kích hoạt sinh đề ngay lập tức
      setGenerating(true);
      try {
        const res = await fetch("/api/generator/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Đề thi chọn HSG Toán 9 - ${targetBp.name.slice(0, 25)}`,
            blueprint_id: targetBp.id,
            similarity_threshold: 0.65,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedExam(data);
          saveWorkspaceSession(activeTab, data.id, data);
        }
      } catch (err) {
        console.error("Generate from preset error:", err);
      } finally {
        setGenerating(false);
      }
    } else {
      await handleCreateDefaultBlueprint();
    }
  };

  // Handle Document Upload
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0 && (!uploadFile || !uploadTitle)) return;

    setUploading(true);
    setUploadProgress(null);

    try {
      if (batchFiles.length > 0) {
        // GIAI ĐOẠN 1: Chia nhỏ upload từng file độc lập lên Server/MinIO
        const total = batchFiles.length;
        const uploadedExamIds: string[] = [];
        let failedCount = 0;

        setUploadProgress({ current: 0, total, stage: "Đang tải dữ liệu thô lên máy chủ..." });

        for (let i = 0; i < total; i++) {
          const file = batchFiles[i];
          setUploadProgress({ 
            current: i + 1, 
            total, 
            stage: `Đang lưu file (${i + 1}/${total}): ${file.name.slice(0, 30)}...` 
          });

          const singleForm = new FormData();
          singleForm.append("file", file);
          singleForm.append("grade", "9");
          singleForm.append("exam_level", "HSG_TINH");

          try {
            const res = await fetch("/api/exams/stage-single", {
              method: "POST",
              body: singleForm,
            });

            if (res.ok) {
              const resData = await res.json();
              if (resData.exam_id) {
                uploadedExamIds.push(resData.exam_id);
              }
            } else {
              failedCount++;
              console.error(`Lỗi tải file ${file.name}: status ${res.status}`);
            }
          } catch (fileErr) {
            failedCount++;
            console.error(`Lỗi kết nối khi gửi ${file.name}:`, fileErr);
          }
        }

        // GIAI ĐOẠN 2: Kích hoạt Celery OCR ngầm đồng loạt cho toàn bộ các file đã Stage thành công
        if (uploadedExamIds.length > 0) {
          setUploadProgress({ 
            current: uploadedExamIds.length, 
            total, 
            stage: "Đang kích hoạt hàng đợi OCR LLM đồng loạt..." 
          });

          try {
            await fetch("/api/exams/trigger-batch-ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ exam_ids: uploadedExamIds }),
            });
          } catch (triggerErr) {
            console.error("Lỗi kích hoạt OCR batch:", triggerErr);
          }
        }

        setBatchFiles([]);
        await fetchSourceExams();

        if (failedCount === 0) {
          alert(`Đã nạp thành công toàn bộ ${uploadedExamIds.length} tài liệu vào máy chủ! Hệ thống Celery đang kích hoạt OCR xử lý ngầm.`);
        } else {
          alert(`Đã lưu thành công ${uploadedExamIds.length}/${total} tài liệu vào hàng đợi OCR. Có ${failedCount} tệp gặp lỗi đường truyền.`);
        }
      } else if (uploadFile && uploadTitle) {
        // Gửi upload đơn lẻ
        const formData = new FormData();
        formData.append("title", uploadTitle);
        formData.append("file", uploadFile);
        formData.append("grade", "9");

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
      }
    } catch (err: any) {
      alert(`Lỗi khi kết nối máy chủ tải lên tài liệu: ${err?.message || err}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
  const handleGenerateExam = async (customConfig?: any) => {
    // Phòng thủ chặt chẽ: Loại trừ trường hợp React MouseEvent bị truyền ngầm vào tham số đầu tiên
    const isValidCustomConfig =
      customConfig &&
      typeof customConfig === "object" &&
      !("nativeEvent" in customConfig) &&
      !("target" in customConfig) &&
      (Array.isArray(customConfig.sections_config) || typeof customConfig.name === "string");

    const activeConfig = isValidCustomConfig ? customConfig : undefined;

    if (!activeConfig && !selectedBlueprintId) {
      if (blueprints.length === 0) {
        await handleCreateDefaultBlueprint();
        return;
      }
      return;
    }

    setGenerating(true);
    try {
      const payload: any = {
        title: activeConfig?.name || examTitle,
        folder_id: selectedFolderId || undefined,
        similarity_threshold: 0.65
      };

      if (activeConfig) {
        payload.custom_blueprint_config = activeConfig;
      } else {
        payload.blueprint_id = selectedBlueprintId;
      }

      const res = await fetch("/api/generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedExam(data);
        saveWorkspaceSession(activeTab, data.id, data);
        await fetchSavedExamsAndFolders();
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.set("exam_id", data.id);
          window.history.replaceState(null, "", url.toString());
        }
      } else {
        let errDetail = `Lỗi máy chủ (${res.status})`;
        try {
          const errJson = await res.json();
          errDetail = errJson.detail || errDetail;
        } catch (_) {
          const errText = await res.text().catch(() => "");
          if (errText) errDetail = errText;
        }
        alert(`Lỗi khi tổ hợp đề thi: ${errDetail}`);
      }
    } catch (e: any) {
      alert(`Lỗi khi tổ hợp đề thi: ${e.message || e}`);
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
        {/* 1. Shared Stem or Problem Content - Vietnamese Typography Fix */}
        <div className="text-sm text-slate-900 leading-relaxed question-prose">
          <MathRenderer content={q.content_latex || "Đang cập nhật nội dung câu hỏi..."} />
        </div>

        {/* 2. Geometric Figure with aspect ratio preserved on technical grid */}
        {q.figures_meta && q.figures_meta.length > 0 && (
          <div className="py-2 text-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 shadow-2xs">
            {q.figures_meta.map((fig: any, fIdx: number) => (
              <div key={fIdx} className="space-y-1.5">
                <img
                  src={`/api/assets/${fig.figure_key}`}
                  alt={fig.caption || "Hình vẽ hình học"}
                  className="w-auto max-h-72 object-contain mx-auto my-2 rounded-lg border border-slate-300 bg-white shadow-sm hover:scale-[1.02] transition-transform"
                />
                {fig.caption && (
                  <p className="text-[11px] text-slate-500 font-medium italic text-center">{fig.caption}</p>
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
    <div className="space-y-4">
      {/* Unified Glassmorphic Segmented Navigation Bar */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200/80 shadow-2xs space-x-1 overflow-x-auto backdrop-blur-sm">
        <button
          onClick={() => handleTabChange("generator")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "generator"
              ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-900/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Tổ hợp đề thi</span>
        </button>

        <button
          onClick={() => handleTabChange("questions")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "questions"
              ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-900/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <span>Ngân hàng câu hỏi</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-mono font-bold">
            {totalQuestions || questions.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("ingestion")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "ingestion"
              ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-900/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          <span>Số hóa tài liệu</span>
        </button>

        <button
          onClick={() => handleTabChange("review")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "review"
              ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-900/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Hàng đợi kiểm duyệt</span>
        </button>

        <button
          onClick={() => handleTabChange("studio")}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "studio"
              ? "bg-white text-indigo-700 shadow-xs ring-1 ring-slate-900/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>Exam Studio (Soạn & Barem 0.25đ)</span>
        </button>
      </div>

      {/* TAB 1: EXAM GENERATOR & THREE-COLUMN FLUID WORKSPACE */}
      {activeTab === "generator" && (
        <div className="flex bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[640px]">
          {/* CỘT 1: LEFT EXAM EXPLORER RAIL */}
          <ExamWorkspaceRail
            exams={savedExamsList}
            folders={examFolders}
            selectedExamId={generatedExam?.id}
            selectedFolderId={selectedFolderId}
            onSelectExam={handleSelectExamFromRail}
            onSelectFolder={(fId) => setSelectedFolderId(fId)}
            onCreateFolder={handleCreateNewFolder}
            onCreateExamInFolder={(fId) => {
              setSelectedFolderId(fId);
              const targetFolder = examFolders.find((f) => f.id === fId);
              if (targetFolder) {
                setExamTitle(`Đề thi mới - ${targetFolder.name}`);
              }
            }}
            isCollapsed={isFolderRailCollapsed}
            onToggleCollapse={() => setIsFolderRailCollapsed(!isFolderRailCollapsed)}
          />

          {/* CỘT 2: CẤU HÌNH MA TRẬN & THAM SỐ (360px) */}
          <div className="w-80 sm:w-96 border-r border-slate-200/80 p-5 space-y-5 shrink-0 bg-slate-50/40">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Cấu hình Ma trận Đề thi</span>
              </h2>
              {selectedFolderId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80">
                  📁 {examFolders.find((f) => f.id === selectedFolderId)?.name || "Folder"}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tiêu đề đề thi
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Khung ma trận (Blueprint)
                </label>
                <button
                  type="button"
                  onClick={() => setBlueprintModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                >
                  <span>⚙️ Tùy biến khung</span>
                </button>
              </div>

              {blueprints.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={selectedBlueprintId}
                    onChange={(e) => setSelectedBlueprintId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none cursor-pointer truncate"
                  >
                    {blueprints.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.target_total_score || 20}đ - {b.duration_minutes || 150}p)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setBlueprintModalOpen(true)}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Xem & Sửa chi tiết ma trận</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                  <p>Chưa có ma trận đề thi mẫu nào.</p>
                  <button
                    onClick={handleCreateDefaultBlueprint}
                    className="w-full py-1.5 bg-amber-600 text-white font-semibold rounded-lg text-xs hover:bg-amber-700 cursor-pointer"
                  >
                    + Khởi tạo Ma trận HSG Toán 9 Chuẩn
                  </button>
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                onClick={() => handleGenerateExam()}
                disabled={generating}
                className="w-full py-3 px-4 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50 group cursor-pointer"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>Đang tìm kiếm & xếp slot...</span>
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 text-indigo-200 group-hover:rotate-45 transition-transform duration-300" />
                    <span>Tổ hợp Đề thi Mới (Zero-Hallucination)</span>
                  </>
                )}
              </button>
            </div>

            {generatedExam && (
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Xuất bản đề thi (Word & PDF)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExport("docx")}
                    disabled={exporting !== null}
                    className="py-2 px-2.5 bg-blue-50 border border-blue-200/80 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="truncate">{exporting === "docx" ? "Đang xuất..." : "Tải Word (.docx)"}</span>
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting !== null}
                    className="py-2 px-2.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="truncate">{exporting === "pdf" ? "Đang xuất..." : "Tải PDF In ấn"}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleTabChange("studio")}
                  className="w-full mt-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Scale className="w-4 h-4" />
                  <span>Mở Exam Studio (Chia Barem 0.25đ) ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* CỘT 3: CANVAS XEM TRƯỚC VÀ DUYỆT ĐỀ THI (Flex-1, Cuộn dọc tự nhiên, CHỐNG TRÀN NGANG) */}
          <div className="flex-1 overflow-x-hidden p-5 sm:p-7 bg-slate-100/50 flex flex-col items-center">
            {generatedExam ? (
              <div className="w-full max-w-3xl bg-white p-7 sm:p-9 rounded-2xl border border-slate-200/90 shadow-sm space-y-7">
                <div className="text-center border-b border-slate-200 pb-5 space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">{generatedExam.title.toUpperCase()}</h2>
                  <p className="text-xs text-slate-500 font-semibold tracking-wide">
                    KỲ THI CHỌN HỌC SINH GIỎI TOÁN THCS - THỜI GIAN LÀM BÀI: 120 PHÚT
                  </p>
                </div>

                <div className="space-y-6 divide-y divide-slate-100">
                  {generatedExam.slots_state.map((slot: any) => (
                    <div key={slot.slot_index} className="pt-6 first:pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">
                            Câu {slot.slot_index}. ({slot.points} điểm)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTopicBadgeStyle(slot.main_topic)}`}>
                            {TOPIC_VI_MAP[slot.main_topic] || slot.main_topic}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getDifficultyBadgeStyle(slot.difficulty)}`}>
                            {slot.difficulty}
                          </span>
                        </div>
                        {slot.question && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingQuestion(slot.question)}
                              className="text-xs text-slate-600 hover:text-indigo-600 font-semibold flex items-center space-x-1 py-1 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={() => openSwapModal(slot.slot_index, slot.question.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-indigo-50 cursor-pointer"
                            >
                              <Shuffle className="w-3 h-3" />
                              <span>Đổi câu khác</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {slot.question ? (
                        <div className="text-[15px] font-serif leading-[1.75] text-slate-800 bg-[#FCFBF9] p-4 rounded-xl border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
                          {renderQuestionContent(slot.question)}
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-200">
                          Chưa tìm thấy câu hỏi phù hợp trong ngân hàng cho slot này. Hãy bổ sung câu hỏi vào ngân hàng!
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full max-w-4xl">
                <CreativeEmptyState
                  onSelectPreset={handleSelectPresetFromEmptyState}
                  isGenerating={generating}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS BANK */}
      {activeTab === "questions" && (
        <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Ngân Hàng Câu Hỏi HSG Toán ({totalQuestions || questions.length} câu)</span>
              </h2>

              {/* Scope Segmented Switch: Của tôi / Đơn vị / Mẫu Vinh Phát / Tất cả */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 space-x-1">
                <button
                  type="button"
                  onClick={() => setFilterScope("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterScope === "ALL"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tất cả
                </button>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => setFilterScope("MINE")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      filterScope === "MINE"
                        ? "bg-white text-indigo-600 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>⭐ Của tôi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterScope("SYSTEM")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    filterScope === "SYSTEM"
                      ? "bg-white text-indigo-600 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>📚 Mẫu chuẩn Vinh Phát</span>
                </button>
              </div>
            </div>

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
            <div className="py-20 text-center text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-400" />
              {filterScope === "MINE" ? (
                <div>
                  <p className="text-sm font-bold text-slate-700">Kho cá nhân của bạn hiện chưa có câu hỏi nào</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Hãy vào tab <strong>Số hóa tài liệu</strong> để tải lên đề thi Word/PDF riêng của bạn, hoặc bấm nút <strong>Sao chép</strong> trên các câu hỏi Mẫu Vinh Phát để lưu về kho cá nhân!
                  </p>
                </div>
              ) : filterScope === "TENANT" ? (
                <div>
                  <p className="text-sm font-bold text-slate-700">Chưa có câu hỏi nào được chia sẻ trong đơn vị của bạn</p>
                  <p className="text-xs text-slate-500 mt-1">Các câu hỏi do đồng nghiệp cùng trường chia sẻ sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                <p className="text-sm">Chưa có câu hỏi nào khớp với bộ lọc.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all shadow-xs space-y-3.5 ${getDifficultyLeftBorder(q.difficulty)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getTopicBadgeStyle(q.main_topic)}`}>
                        {TOPIC_VI_MAP[q.main_topic] || q.main_topic}
                      </span>
                      {/* Interactive Difficulty Selector */}
                    {currentUser ? (
                      /* Dropdown đổi độ khó cho Giáo viên đã đăng nhập */
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleQuickDifficultyChange(q.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer ${getDifficultyBadgeStyle(q.difficulty)}`}
                        title="Bấm để đổi nhanh độ khó"
                      >
                        <option value="EASY">Cơ bản (EASY)</option>
                        <option value="MEDIUM">Vận dụng (MEDIUM)</option>
                        <option value="HARD">Vận dụng cao (HARD)</option>
                        <option value="OLYMPIAD">Học sinh giỏi (OLYMPIAD)</option>
                      </select>
                    ) : (
                      /* Badge tĩnh cho Khách vãng lai (GUEST) */
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded select-none ${getDifficultyBadgeStyle(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    )}
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
                    {/* Nút Sao chép về kho cá nhân nếu câu hỏi không phải của user */}
                    {currentUser && q.user_id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/questions/${q.id}/clone-to-vault`, { method: "POST" });
                            if (res.ok) {
                              alert("Đã sao chép câu hỏi về Kho cá nhân của bạn thành công!");
                              fetchQuestions();
                            }
                          } catch (e) {
                            alert("Không thể sao chép câu hỏi.");
                          }
                        }}
                        className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center space-x-1 cursor-pointer"
                        title="Sao chép câu này về kho cá nhân để chỉnh sửa riêng"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </button>
                    )}

                    {currentUser && (!q.user_id || q.user_id === currentUser.id) && (
                      <button
                        onClick={() => setEditingQuestion(q)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all flex items-center space-x-1 cursor-pointer"
                        title="Sửa nội dung, lời giải & gắn thẻ tùy biến"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa & Gắn nhãn</span>
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      q.is_verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {q.is_verified ? "✓ Đã kiểm duyệt" : "Chờ duyệt"}
                    </span>
                  </div>
                  </div>

                  {/* Custom tags list */}
                  {q.custom_tags && q.custom_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {q.custom_tags.map((tag: string, tIdx: number) => (
                        <span key={tIdx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[15px] font-serif leading-[1.75] text-slate-800 bg-[#FCFBF9] p-3.5 rounded-xl border border-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)]">
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

          {/* Smart Pagination Bar (Tối ưu tải theo trang 10 câu) */}
          {!loadingQuestions && totalQuestions > 0 && (
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Đang hiển thị{" "}
                <span className="font-bold text-slate-800">
                  {Math.min((currentPage - 1) * pageSize + 1, totalQuestions)}
                </span>
                {" - "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * pageSize, totalQuestions)}
                </span>
                {" trên tổng số "}
                <span className="font-bold text-indigo-600">{totalQuestions}</span> câu hỏi
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loadingQuestions}
                  onClick={() => {
                    const prev = Math.max(1, currentPage - 1);
                    setCurrentPage(prev);
                    fetchQuestions(prev);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                >
                  ← Trang trước
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-1 text-xs text-slate-400 select-none">...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage(p);
                              fetchQuestions(p);
                            }}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentPage === p
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loadingQuestions}
                  onClick={() => {
                    const next = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(next);
                    fetchQuestions(next);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
                >
                  Trang sau →
                </button>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Số câu:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                    fetchQuestions(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value={10}>10 câu / trang</option>
                  <option value={20}>20 câu / trang</option>
                  <option value={50}>50 câu / trang</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENT INGESTION PIPELINE */}
      {activeTab === "ingestion" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 h-fit">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <span>Số Hóa Đề Thi (.docx / .pdf)</span>
              </h2>
              {batchFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBatchFiles([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Xóa tất cả ({batchFiles.length})
                </button>
              )}
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              {/* Batch Upload Drag & Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn một hoặc nhiều tệp đề thi (Batch Upload)
                </label>
                <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-5 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    multiple
                    accept=".docx,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const newFiles = Array.from(e.target.files);
                        setBatchFiles((prev) => [...prev, ...newFiles]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                    <UploadCloud className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-indigo-900">
                      Kéo thả hoặc nhấn để chọn nhiều file cùng lúc
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Hỗ trợ hàng loạt định dạng .DOCX và .PDF (Tối đa 50MB/file)
                    </p>
                  </div>
                </div>
              </div>

              {/* Danh sách tệp đã chọn sẵn sàng tải lên */}
              {batchFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Danh sách hàng đợi ({batchFiles.length} tệp):</span>
                    <span className="text-indigo-600">
                      {(batchFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {batchFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            file.name.endsWith(".pdf")
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {file.name.endsWith(".pdf") ? "PDF" : "DOCX"}
                          </span>
                          <span className="truncate max-w-[180px] font-medium text-slate-800" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => setBatchFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-rose-600 transition-all"
                            title="Xóa tệp này"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tùy chọn tải lên đơn lẻ khi chưa chọn batch */}
              {batchFiles.length === 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Hoặc tải lên đơn lẻ có đặt tên:
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tên đề thi</label>
                    <input
                      type="text"
                      placeholder="VD: Đề thi HSG Toán 9 Tỉnh Hà Tĩnh 2025"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chọn 1 tệp</label>
                    <input
                      type="file"
                      accept=".docx,.pdf"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || (batchFiles.length === 0 && (!uploadFile || !uploadTitle))}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex flex-col items-center justify-center space-y-1 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadProgress ? uploadProgress.stage : "Đang xử lý..."}</span>
                    </div>
                    {uploadProgress && (
                      <div className="w-full max-w-xs bg-indigo-950/40 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="bg-emerald-400 h-1.5 transition-all duration-200"
                          style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {batchFiles.length > 0
                        ? `🚀 Bắt đầu Số Hóa Hàng Loạt (${batchFiles.length} Đề)`
                        : "Bắt đầu Số Hóa Pipeline"}
                    </span>
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Source Exams List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Tiến Trình Số Hóa Đề Thi ({sourceExams.length})</span>
              </h2>
              <button
                type="button"
                onClick={fetchSourceExams}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
                title="Làm mới danh sách tiến trình"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {sourceExams.length === 0 ? (
                /* Pipeline Blueprint 4 Bước khi danh sách trống */
                <div className="py-8 space-y-6">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-800">Quy Trình Số Hóa Đề Thi AI Chuẩn Quốc Gia</p>
                    <p className="text-xs text-slate-400">Các tệp tải lên sẽ tự động chạy qua pipeline 4 bước khép kín:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">1</span>
                        <span>Phân Tích Cấu Trúc</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Tự động bóc tách từng câu hỏi, hình thức tự luận/điền đáp số từ file .docx hoặc scan .pdf.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">2</span>
                        <span>Nhận Diện Công Thức & Hình Vẽ</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Chuyển đổi công thức toán sang chuẩn LaTeX/OMML, crop hình học phẳng độ phân giải cao bằng Pillow.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">3</span>
                        <span>Gán Nhãn Ma Trận & Độ Khó</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Phân loại chuyên đề (Đại số, Số học, Hình phẳng, BĐT) và ước lượng độ khó chuẩn Sở GD&ĐT.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-700 font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[11px]">4</span>
                        <span>Hàng Đợi Kiểm Duyệt</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Đưa vào hàng đợi để giáo viên rà soát, duyệt đưa vào Ngân hàng câu hỏi hoặc biên chế trực tiếp.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                sourceExams.map((exam) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REVIEW QUEUE */}
      {activeTab === "review" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 max-w-5xl mx-auto">
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
                      {TOPIC_VI_MAP[q.main_topic] || q.main_topic}
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
                      <span>{TOPIC_VI_MAP[c.main_topic] || c.main_topic} • {c.difficulty}</span>
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
          onBack={() => handleTabChange("generator")}
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

      {/* BLUEPRINT BUILDER & CUSTOMIZER MODAL */}
      <BlueprintBuilderModal
        isOpen={blueprintModalOpen}
        onClose={() => setBlueprintModalOpen(false)}
        onSelectBlueprint={async (selectedId) => {
          setSelectedBlueprintId(selectedId);
          // Nạp lại danh sách blueprints
          try {
            const res = await fetch("/api/generator/blueprints");
            if (res.ok) {
              const data = await res.json();
              setBlueprints(data);
            }
          } catch (e) {}
        }}
        onGenerateFromCustomConfig={async (customConfig) => {
          setBlueprintModalOpen(false);
          await handleGenerateExam(customConfig);
        }}
      />
    </div>
  );
}
