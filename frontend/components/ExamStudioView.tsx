"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Columns,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sliders,
  Glasses,
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
  Shuffle,
  Printer,
  ArrowUpDown,
  CheckSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Check,
  HelpCircle,
  Command,
  PieChart,
  Info,
  Search,
  Replace,
  Undo2,
  Redo2,
  ArrowRight,
  Hash,
  AlignLeft,
  MessageSquareCode,
  GitCompare,
  FileCheck2,
  ListTree,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  CopyPlus,
  LayoutTemplate,
  BarChart3,
  ShieldCheck,
  Binary,
  History,
  Boxes,
  Plus,
  Trash2,
  FileSpreadsheet,
  Award,
  ScrollText,
  Package,
  FileCode,
  BookOpen,
  Timer
} from "lucide-react";

import ExamSettingsModal, { LayoutKnobs } from "./ExamSettingsModal";

interface Props {
  examId: string;
  onBack?: () => void;
}

interface LatexFormulaItem {
  name: string;
  code: string;
  category: "algebra" | "calculus" | "geometry" | "logic" | "matrix" | "greek";
  description: string;
}

const LATEX_FORMULA_CHEAT_SHEET: LatexFormulaItem[] = [
  // Đại số & Phương trình
  { name: "Phân số", code: "\\dfrac{a}{b}", category: "algebra", description: "Phân số chuẩn hiển thị lớn" },
  { name: "Căn bậc n", code: "\\sqrt[n]{x}", category: "algebra", description: "Căn thức bậc n" },
  { name: "Hệ phương trình", code: "\\begin{cases}\n  2x + y = 5 \\\\\n  x - 3y = -1\n\\end{cases}", category: "algebra", description: "Hệ ngoặc nhọn nhiều phương trình" },
  { name: "Tập nghiệm ngoặc vuông", code: "\\left[\\begin{array}{l}\n  x = 1 \\\\\n  x = -2\n\\end{array}\\right.", category: "algebra", description: "Ngoặc vuông hoặc phương trình" },
  { name: "Lũy thừa & Chỉ số", code: "x^{n}_{k}", category: "algebra", description: "Số mũ trên và chỉ số dưới" },
  
  // Giải tích & Vi phân - Tích phân
  { name: "Tích phân xác định", code: "\\int_{a}^{b} f(x) \\, \\mathrm{d}x", category: "calculus", description: "Tích phân từ a đến b với vi phân chuẩn" },
  { name: "Giới hạn (Limit)", code: "\\lim_{x \\to x_0} \\dfrac{f(x)}{g(x)}", category: "calculus", description: "Giới hạn hàm số khi x tiến đến x0" },
  { name: "Tổng chuỗi Sigma", code: "\\sum_{i=1}^{n} a_i", category: "calculus", description: "Tổng hữu hạn từ i=1 đến n" },
  { name: "Đạo hàm cấp cao", code: "f''(x) = \\dfrac{\\mathrm{d}^2 y}{\\mathrm{d}x^2}", category: "calculus", description: "Đạo hàm bậc 2 dạng phân số" },
  { name: "Vô cực", code: "\\pm \\infty", category: "calculus", description: "Cộng trừ vô cùng" },

  // Hình học & Vector
  { name: "Vector", code: "\\vec{u} = (x; y; z)", category: "geometry", description: "Vector có dấu mũi tên trên đầu" },
  { name: "Đoạn thẳng / Vector AB", code: "\\overrightarrow{AB}", category: "geometry", description: "Vectơ có tên 2 điểm mút" },
  { name: "Độ dài đoạn thẳng", code: "|\\vec{u}| = \\sqrt{x^2 + y^2}", category: "geometry", description: "Độ dài / Môđun vector" },
  { name: "Góc toán học", code: "\\widehat{ABC} = 60^\\circ", category: "geometry", description: "Ký hiệu góc có mũ trên đỉnh" },
  { name: "Vuông góc & Song song", code: "d_1 \\perp d_2, \\quad (P) \\parallel (Q)", category: "geometry", description: "Quan hệ vuông góc và song song" },
  { name: "Tam giác đồng dạng", code: "\\Delta ABC \\sim \\Delta A'B'C'", category: "geometry", description: "Ký hiệu đồng dạng" },

  // Logic & Tập hợp
  { name: "Thuộc & Không thuộc", code: "x \\in A, \\quad y \\notin B", category: "logic", description: "Quan hệ phần tử với tập hợp" },
  { name: "Tập hợp con & Giao/Hợp", code: "A \\subset B, \\quad A \\cap B, \\quad A \\cup B", category: "logic", description: "Tập con, giao tập hợp, hợp tập hợp" },
  { name: "Với mọi & Tồn tại", code: "\\forall x \\in \\mathbb{R}, \\quad \\exists y > 0", category: "logic", description: "Lượng từ phổ dụng và lượng từ tồn tại" },
  { name: "Tương đương & Suy ra", code: "P \\Leftrightarrow Q, \\quad A \\Rightarrow B", category: "logic", description: "Mệnh đề kéo theo và tương đương" },
  { name: "Tập số thực, nguyên, tự nhiên", code: "\\mathbb{R}, \\; \\mathbb{Z}, \\; \\mathbb{N}, \\; \\mathbb{Q}", category: "logic", description: "Tập hợp số kiểu blackboard bold" },

  // Ma trận & Bảng
  { name: "Ma trận ngoặc tròn", code: "\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}", category: "matrix", description: "Ma trận 2x2 ngoặc tròn" },
  { name: "Định thức (Determinant)", code: "\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}", category: "matrix", description: "Định thức dấu gạch đứng" },

  // Chữ cái Hy Lạp
  { name: "Alpha, Beta, Gamma", code: "\\alpha, \\; \\beta, \\; \\gamma, \\; \\Gamma", category: "greek", description: "Góc và tham số thường gặp" },
  { name: "Delta, Theta, Lambda", code: "\\Delta, \\; \\theta, \\; \\lambda", category: "greek", description: "Biệt thức delta và góc theta" },
  { name: "Pi, Sigma, Omega", code: "\\pi \\approx 3.14, \\; \\sigma, \\; \\Omega", category: "greek", description: "Số pi, sai số sigma và ohm/omega" },
];

export default function ExamStudioView({ examId, onBack }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<"EXAM" | "RUBRIC" | "OMR">("EXAM");

  // Draggable Split Pane State
  const [splitRatio, setSplitRatio] = useState<number>(50); // percentage for left pane
  const [isEditorCollapsed, setIsEditorCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerIdRef = useRef<number | null>(null);

  // Left Sidebar Tab: "editor" | "rubric-table" | "items" | "knobs"
  const [sidebarTab, setSidebarTab] = useState<"editor" | "rubric-table" | "items" | "knobs" | "matrix">("editor");
  const [templateDoc, setTemplateDoc] = useState<any | null>(null);

  // Raw LaTeX Code State for Live Editor
  const [rawLatexCode, setRawLatexCode] = useState<string>("");
  const [isPreambleFolded, setIsPreambleFolded] = useState<boolean>(true);
  const [editorFontSize, setEditorFontSize] = useState<number>(12); // pt
  const [editorCursorInfo, setEditorCursorInfo] = useState<{ line: number; col: number; selectedChars: number }>({
    line: 1,
    col: 1,
    selectedChars: 0,
  });
  const [editorSearchTerm, setEditorSearchTerm] = useState<string>("");
  const [editorSearchCaseSensitive, setEditorSearchCaseSensitive] = useState<boolean>(false);
  const [editorSearchWholeWord, setEditorSearchWholeWord] = useState<boolean>(false);
  const [editorSearchRegex, setEditorSearchRegex] = useState<boolean>(false);
  const [editorReplaceTerm, setEditorReplaceTerm] = useState<string>("");
  const [isEditorSearchOpen, setIsEditorSearchOpen] = useState<boolean>(false);
  const [isEditorReplaceMode, setIsEditorReplaceMode] = useState<boolean>(false);
  const [isEditorGotoLineOpen, setIsEditorGotoLineOpen] = useState<boolean>(false);
  const [gotoLineInput, setGotoLineInput] = useState<string>("");
  const [isEditorDiffOpen, setIsEditorDiffOpen] = useState<boolean>(false);
  const [isEditorOutlineOpen, setIsEditorOutlineOpen] = useState<boolean>(false);
  const [isEditorSnippetsOpen, setIsEditorSnippetsOpen] = useState<boolean>(false);
  const [isEditorStatsOpen, setIsEditorStatsOpen] = useState<boolean>(false);
  const [isEditorLinterOpen, setIsEditorLinterOpen] = useState<boolean>(false);
  const [isEditorSymbolsOpen, setIsEditorSymbolsOpen] = useState<boolean>(false);
  const [editorBookmarks, setEditorBookmarks] = useState<number[]>([]);
  const [isEditorBookmarksOpen, setIsEditorBookmarksOpen] = useState<boolean>(false);
  const [isEditorPreflightOpen, setIsEditorPreflightOpen] = useState<boolean>(false);
  const [isEditorHistoryDrawerOpen, setIsEditorHistoryDrawerOpen] = useState<boolean>(false);
  const [isEditorWrapEnvOpen, setIsEditorWrapEnvOpen] = useState<boolean>(false);
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState<boolean>(false);
  const [isEditorAnswerKeyOpen, setIsEditorAnswerKeyOpen] = useState<boolean>(false);
  const [isScaleScoreModalOpen, setIsScaleScoreModalOpen] = useState<boolean>(false);
  const [isPrintConfigModalOpen, setIsPrintConfigModalOpen] = useState<boolean>(false);
  const [isTimingBudgetModalOpen, setIsTimingBudgetModalOpen] = useState<boolean>(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBatchActionModalOpen, setIsBatchActionModalOpen] = useState<boolean>(false);
  const [isExamPassportModalOpen, setIsExamPassportModalOpen] = useState<boolean>(false);
  const [isExportPackageModalOpen, setIsExportPackageModalOpen] = useState<boolean>(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState<boolean>(false);
  const [isFormulaCheatSheetOpen, setIsFormulaCheatSheetOpen] = useState<boolean>(false);
  const [formulaCategoryFilter, setFormulaCategoryFilter] = useState<string>("all");
  const [formulaSearchQuery, setFormulaSearchQuery] = useState<string>("");
  const [newQuestionForm, setNewQuestionForm] = useState<{
    content: string;
    question_type: "mcq" | "short_answer" | "essay";
    options: { key: string; text: string }[];
    correct_key: string;
    difficulty: "nb" | "th" | "vd" | "vdc";
    points: number;
    solution: string;
  }>({
    content: "",
    question_type: "mcq",
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    correct_key: "A",
    difficulty: "nb",
    points: 0.25,
    solution: "",
  });
  const [exportPackageOptions, setExportPackageOptions] = useState<{
    includeDocx: boolean;
    includePdf: boolean;
    includeAnswerKeyDocx: boolean;
    includePassportDocx: boolean;
  }>({
    includeDocx: true,
    includePdf: true,
    includeAnswerKeyDocx: true,
    includePassportDocx: true,
  });
  const [batchTargetDifficulty, setBatchTargetDifficulty] = useState<string>("TH");
  const [batchPointsDelta, setBatchPointsDelta] = useState<number>(0.5);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [includeAnswerKeyInPrint, setIncludeAnswerKeyInPrint] = useState<boolean>(false);
  const [includeStudentPledge, setIncludeStudentPledge] = useState<boolean>(false);
  const [printPageNumbering, setPrintPageNumbering] = useState<boolean>(true);
  const [targetScaleScore, setTargetScaleScore] = useState<number>(10);
  const [scaleMode, setScaleMode] = useState<"proportional" | "equal">("proportional");
  const [variantCount, setVariantCount] = useState<number>(4);
  const [variantPrefix, setVariantPrefix] = useState<string>("101");
  const [isGeneratingVariants, setIsGeneratingVariants] = useState<boolean>(false);
  const [generatedVariants, setGeneratedVariants] = useState<Array<{ code: string; questionsCount: number; latex: string }>>([]);
  const [selectedVariantPreview, setSelectedVariantPreview] = useState<number | null>(null);
  const [lastSavedLatexSnapshot, setLastSavedLatexSnapshot] = useState<string>("");
  const [editorSearchMatches, setEditorSearchMatches] = useState<number>(0);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper: Extract structural outline elements (Sections, Questions, Theorems, Tables, Figures) from LaTeX
  const extractLatexOutline = () => {
    const lines = (rawLatexCode || "").split("\n");
    const items: Array<{
      id: string;
      lineNum: number;
      type: "section" | "subsection" | "question" | "item" | "theorem" | "table" | "figure";
      label: string;
      level: number;
    }> = [];

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("%")) return;

      // Match \section{...} or \section*{...}
      const secMatch = trimmed.match(/\\section\*?\{([^}]+)\}/i);
      if (secMatch) {
        items.push({
          id: `sec-${lineNum}`,
          lineNum,
          type: "section",
          label: secMatch[1],
          level: 1,
        });
        return;
      }

      // Match \subsection{...}
      const subMatch = trimmed.match(/\\subsection\*?\{([^}]+)\}/i);
      if (subMatch) {
        items.push({
          id: `sub-${lineNum}`,
          lineNum,
          type: "subsection",
          label: subMatch[1],
          level: 2,
        });
        return;
      }

      // Match Questions: \textbf{Câu X: ...} or \textbf{Câu X.} or \item \textbf{Câu X} or Câu X:
      const cauMatch = trimmed.match(/(?:\\textbf\{)?(?:\\item\s+)?(C[âa]u\s+\d+[^:.}]*(?:[:.}]))/i);
      if (cauMatch) {
        items.push({
          id: `cau-${lineNum}`,
          lineNum,
          type: "question",
          label: cauMatch[1].replace(/\\textbf\{|\}/g, "").trim(),
          level: 2,
        });
        return;
      }

      // Match Theorem/Exercise/Proof environments: \begin{vd}, \begin{ex}, \begin{bt}, \begin{dn}
      const envMatch = trimmed.match(/\\begin\{(vd|ex|bt|dn|dl|tc|hd|luuy|dang)\}(?:\[([^\]]+)\])?/i);
      if (envMatch) {
        const envName = envMatch[1].toUpperCase();
        const envDesc = envMatch[2] ? ` (${envMatch[2]})` : "";
        items.push({
          id: `env-${lineNum}`,
          lineNum,
          type: "theorem",
          label: `[${envName}] Khối bài toán${envDesc}`,
          level: 2,
        });
        return;
      }

      // Match \begin{table} or \begin{tabular}
      if (trimmed.match(/\\begin\{(?:table|tabular)\}/i)) {
        items.push({
          id: `tbl-${lineNum}`,
          lineNum,
          type: "table",
          label: "Bảng dữ liệu (Table)",
          level: 3,
        });
        return;
      }

      // Match \begin{tikzpicture}
      if (trimmed.match(/\\begin\{tikzpicture\}/i)) {
        items.push({
          id: `fig-${lineNum}`,
          lineNum,
          type: "figure",
          label: "Hình vẽ TikZ / Đồ thị",
          level: 3,
        });
        return;
      }
    });

    return items;
  };

  // Helper: Jump directly to a line from outline
  const handleJumpToOutlineLine = (lineNum: number) => {
    const ta = editorTextareaRef.current;
    if (!ta) return;
    const lines = (rawLatexCode || "").split("\n");
    const targetLine = Math.max(1, Math.min(lineNum, lines.length));
    let charIndex = 0;
    for (let i = 0; i < targetLine - 1; i++) {
      charIndex += lines[i].length + 1;
    }
    ta.focus();
    ta.setSelectionRange(charIndex, charIndex + (lines[targetLine - 1]?.length || 0));
    const lineHeight = 24;
    ta.scrollTop = Math.max(0, (targetLine - 5) * lineHeight);
    showToast(`Đã chuyển đến dòng ${targetLine}`, "info");
  };

  // Helper: Compute line-by-line diff between current editor LaTeX and last saved/compiled snapshot
  const computeLatexDiff = () => {
    const originalLines = (lastSavedLatexSnapshot || "").split("\n");
    const currentLines = (rawLatexCode || "").split("\n");

    const diffRows: Array<{
      type: "added" | "removed" | "unchanged" | "modified";
      origLineNum?: number;
      currLineNum?: number;
      origText?: string;
      currText?: string;
    }> = [];

    let origIdx = 0;
    let currIdx = 0;

    while (origIdx < originalLines.length || currIdx < currentLines.length) {
      const origLine = originalLines[origIdx];
      const currLine = currentLines[currIdx];

      if (origIdx < originalLines.length && currIdx < currentLines.length) {
        if (origLine === currLine) {
          diffRows.push({
            type: "unchanged",
            origLineNum: origIdx + 1,
            currLineNum: currIdx + 1,
            origText: origLine,
            currText: currLine,
          });
          origIdx++;
          currIdx++;
        } else {
          // Lookahead heuristic for line modification vs insert/delete
          const nextMatchInOrig = originalLines.indexOf(currLine, origIdx + 1);
          const nextMatchInCurr = currentLines.indexOf(origLine, currIdx + 1);

          if (nextMatchInCurr !== -1 && (nextMatchInOrig === -1 || nextMatchInCurr <= nextMatchInOrig)) {
            // New line added in current
            diffRows.push({
              type: "added",
              currLineNum: currIdx + 1,
              currText: currLine,
            });
            currIdx++;
          } else if (nextMatchInOrig !== -1) {
            // Line removed in current
            diffRows.push({
              type: "removed",
              origLineNum: origIdx + 1,
              origText: origLine,
            });
            origIdx++;
          } else {
            // Line modified
            diffRows.push({
              type: "modified",
              origLineNum: origIdx + 1,
              currLineNum: currIdx + 1,
              origText: origLine,
              currText: currLine,
            });
            origIdx++;
            currIdx++;
          }
        }
      } else if (currIdx < currentLines.length) {
        // Remaining added lines
        diffRows.push({
          type: "added",
          currLineNum: currIdx + 1,
          currText: currLine,
        });
        currIdx++;
      } else {
        // Remaining removed lines
        diffRows.push({
          type: "removed",
          origLineNum: origIdx + 1,
          origText: origLine,
        });
        origIdx++;
      }
    }

    const addedCount = diffRows.filter((r) => r.type === "added").length;
    const removedCount = diffRows.filter((r) => r.type === "removed").length;
    const modifiedCount = diffRows.filter((r) => r.type === "modified").length;

    return {
      diffRows,
      stats: { addedCount, removedCount, modifiedCount },
      hasChanges: addedCount > 0 || removedCount > 0 || modifiedCount > 0,
    };
  };

  // Helper: Toggle LaTeX Line Comments (% prefix) for selected lines or current cursor line
  const handleToggleCommentInEditor = () => {
    const ta = editorTextareaRef.current;
    if (!ta) return;

    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const val = ta.value;

    // Find the starting line index and ending line index based on character offsets
    const lines = val.split("\n");
    let currentOffset = 0;
    let startLineIdx = -1;
    let endLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length + 1; // +1 for \n
      const lineEndOffset = currentOffset + lines[i].length;

      if (startLineIdx === -1 && selStart <= lineEndOffset) {
        startLineIdx = i;
      }
      if (endLineIdx === -1 && (selEnd <= lineEndOffset || (selEnd === lineEndOffset + 1 && i === lines.length - 1))) {
        endLineIdx = i;
      }

      currentOffset += lineLen;
    }

    if (startLineIdx === -1) startLineIdx = 0;
    if (endLineIdx === -1) endLineIdx = lines.length - 1;
    if (endLineIdx < startLineIdx) endLineIdx = startLineIdx;

    // Check if ALL lines in range are currently commented (% prefix or % prefix with spaces)
    const targetLines = lines.slice(startLineIdx, endLineIdx + 1);
    const nonBlankTargetLines = targetLines.filter((l) => l.trim().length > 0);
    const areAllCommented =
      nonBlankTargetLines.length > 0 &&
      nonBlankTargetLines.every((l) => l.trimStart().startsWith("%"));

    // Toggle: if all commented -> uncomment; otherwise comment
    const updatedLines = [...lines];
    for (let i = startLineIdx; i <= endLineIdx; i++) {
      const line = lines[i];
      if (areAllCommented) {
        // Remove leading '%' and optional 1 space after '%'
        updatedLines[i] = line.replace(/^(\s*)%\s?/, "$1");
      } else {
        // Add '% ' at start of line (preserving existing indent if present)
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : "";
        const rest = line.slice(indent.length);
        updatedLines[i] = `${indent}% ${rest}`;
      }
    }

    const newCode = updatedLines.join("\n");
    setRawLatexCode(newCode);
    pushToLatexHistory(newCode);
    setIsDirty(true);

    // Restore focus and cursor selection
    setTimeout(() => {
      if (editorTextareaRef.current) {
        editorTextareaRef.current.focus();
        updateCursorStats();
      }
    }, 20);

    showToast(
      areAllCommented ? "Đã gỡ chú thích (Uncomment)" : "Đã bật chú thích dòng (Comment)",
      "info"
    );
  };

  // Helper: Duplicate current line or selected lines up/down
  const handleDuplicateLinesInEditor = (direction: "down" | "up" = "down") => {
    const ta = editorTextareaRef.current;
    if (!ta) return;

    const fullText = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    const lines = fullText.split("\n");
    let currentPos = 0;
    let startLineIdx = -1;
    let endLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const lineEnd = currentPos + lineLen;
      if (startLineIdx === -1 && start <= lineEnd) {
        startLineIdx = i;
      }
      if (end <= lineEnd) {
        endLineIdx = i;
        break;
      }
      currentPos = lineEnd + 1; // +1 for \n
    }
    if (startLineIdx === -1) startLineIdx = 0;
    if (endLineIdx === -1) endLineIdx = lines.length - 1;

    const selectedLines = lines.slice(startLineIdx, endLineIdx + 1);
    const duplicatedText = selectedLines.join("\n");

    const newLines = [...lines];
    if (direction === "down") {
      newLines.splice(endLineIdx + 1, 0, ...selectedLines);
    } else {
      newLines.splice(startLineIdx, 0, ...selectedLines);
    }

    const newCode = newLines.join("\n");
    setRawLatexCode(newCode);
    pushToLatexHistory(newCode);
    setIsDirty(true);

    setTimeout(() => {
      if (editorTextareaRef.current) {
        const textarea = editorTextareaRef.current;
        textarea.focus();
        // Calculate new selection
        let newStartChar = 0;
        const targetStartLine = direction === "down" ? endLineIdx + 1 : startLineIdx;
        for (let i = 0; i < targetStartLine; i++) {
          newStartChar += newLines[i].length + 1;
        }
        const newEndChar = newStartChar + duplicatedText.length;
        textarea.setSelectionRange(newStartChar, newEndChar);
        updateCursorStats();
      }
    }, 20);

    showToast(`Đã nhân đôi dòng (Duplicate line ${direction})`, "info");
  };

  // Helper: Move current line or selected lines up/down (Alt + ArrowUp / Alt + ArrowDown)
  const handleMoveLinesInEditor = (direction: "up" | "down") => {
    const ta = editorTextareaRef.current;
    if (!ta) return;

    const fullText = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    const lines = fullText.split("\n");
    let currentPos = 0;
    let startLineIdx = -1;
    let endLineIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const lineEnd = currentPos + lineLen;
      if (startLineIdx === -1 && start <= lineEnd) {
        startLineIdx = i;
      }
      if (end <= lineEnd) {
        endLineIdx = i;
        break;
      }
      currentPos = lineEnd + 1;
    }
    if (startLineIdx === -1) startLineIdx = 0;
    if (endLineIdx === -1) endLineIdx = lines.length - 1;

    if (direction === "up" && startLineIdx === 0) return; // Cannot move above line 1
    if (direction === "down" && endLineIdx === lines.length - 1) return; // Cannot move below last line

    const newLines = [...lines];
    const selectedBlock = newLines.splice(startLineIdx, endLineIdx - startLineIdx + 1);
    if (direction === "up") {
      newLines.splice(startLineIdx - 1, 0, ...selectedBlock);
    } else {
      newLines.splice(startLineIdx + 1, 0, ...selectedBlock);
    }

    const newCode = newLines.join("\n");
    setRawLatexCode(newCode);
    pushToLatexHistory(newCode);
    setIsDirty(true);

    setTimeout(() => {
      if (editorTextareaRef.current) {
        const textarea = editorTextareaRef.current;
        textarea.focus();
        let newStartChar = 0;
        const newStartLine = direction === "up" ? startLineIdx - 1 : startLineIdx + 1;
        for (let i = 0; i < newStartLine; i++) {
          newStartChar += newLines[i].length + 1;
        }
        let blockLen = 0;
        const blockCount = endLineIdx - startLineIdx + 1;
        for (let i = 0; i < blockCount; i++) {
          blockLen += newLines[newStartLine + i].length + (i < blockCount - 1 ? 1 : 0);
        }
        textarea.setSelectionRange(newStartChar, newStartChar + blockLen);
        updateCursorStats();
      }
    }, 20);

    showToast(`Đã dịch chuyển dòng sang vị trí ${direction === "up" ? "lên" : "xuống"}`, "info");
  };

  // Helper: Toggle bookmark at current cursor line
  const handleToggleCurrentLineBookmark = () => {
    const ta = editorTextareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const textBefore = ta.value.substring(0, pos);
    const lineNum = textBefore.split("\n").length;

    setEditorBookmarks((prev) => {
      if (prev.includes(lineNum)) {
        const next = prev.filter((l) => l !== lineNum);
        showToast(`Đã gỡ dấu trang (Bookmark) tại Dòng ${lineNum}`, "info");
        return next;
      } else {
        const next = [...prev, lineNum].sort((a, b) => a - b);
        showToast(`Đã đánh dấu trang (Bookmark) tại Dòng ${lineNum}`, "success");
        return next;
      }
    });
  };

  // Helper: Jump to next or previous bookmark
  const handleJumpToBookmark = (direction: "next" | "prev") => {
    if (editorBookmarks.length === 0) {
      showToast("Chưa có dấu trang (Bookmark) nào được tạo!", "warning");
      return;
    }
    const ta = editorTextareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const currentLine = ta.value.substring(0, pos).split("\n").length;

    let targetLine: number;
    if (direction === "next") {
      const nextBookmarks = editorBookmarks.filter((b) => b > currentLine);
      targetLine = nextBookmarks.length > 0 ? nextBookmarks[0] : editorBookmarks[0];
    } else {
      const prevBookmarks = editorBookmarks.filter((b) => b < currentLine);
      targetLine = prevBookmarks.length > 0 ? prevBookmarks[prevBookmarks.length - 1] : editorBookmarks[editorBookmarks.length - 1];
    }

    handleGotoLineInEditor(targetLine);
    showToast(`Đã nhảy đến Bookmark tại Dòng ${targetLine}`, "info");
  };

  // Helper: Format & Beautify LaTeX source code with intelligent indentation and line clean-up
  const handleFormatLatexCode = () => {
    if (!rawLatexCode || !rawLatexCode.trim()) {
      showToast("Mã nguồn LaTeX đang trống!", "warning");
      return;
    }

    try {
      const lines = rawLatexCode.split("\n");
      const formattedLines: string[] = [];
      let indentLevel = 0;
      const indentUnit = "  "; // 2 spaces

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        // Keep empty lines clean without trailing spaces
        if (trimmed === "") {
          formattedLines.push("");
          continue;
        }

        // Dedent if line starts with closing environments/tags
        const isClosingEnv = /^\\end\{(enumerate|itemize|cases|align\*?|equation\*?|tabular|matrix|pmatrix|bmatrix|vmatrix|tikzpicture)\}/.test(trimmed);
        const isRightBrace = /^\\}/.test(trimmed) || /^\}/.test(trimmed);

        if (isClosingEnv || isRightBrace) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        // Apply indentation
        formattedLines.push(indentUnit.repeat(indentLevel) + trimmed);

        // Indent after opening environments
        const isOpeningEnv = /^\\begin\{(enumerate|itemize|cases|align\*?|equation\*?|tabular|matrix|pmatrix|bmatrix|vmatrix|tikzpicture)\}/.test(trimmed);
        const isLeftBrace = /\{$/.test(trimmed) && !/\\\}$/.test(trimmed);

        if (isOpeningEnv || isLeftBrace) {
          indentLevel++;
        }
      }

      const formattedResult = formattedLines.join("\n");
      if (formattedResult === rawLatexCode) {
        showToast("Mã nguồn LaTeX đã được định dạng chuẩn sẵn!", "info");
        return;
      }

      setRawLatexCode(formattedResult);
      pushToLatexHistory(formattedResult);
      setIsDirty(true);
      setTimeout(updateCursorStats, 30);
      showToast("Đã định dạng & căn lề chuẩn mã nguồn LaTeX!", "success");
    } catch (e) {
      showToast("Không thể định dạng mã nguồn!", "warning");
    }
  };

  // Helper: Jump / Go to specific line number in LaTeX editor
  const handleGotoLineInEditor = (targetLineNum?: number) => {
    const lineNum = targetLineNum !== undefined ? targetLineNum : parseInt(gotoLineInput, 10);
    if (isNaN(lineNum) || lineNum < 1 || !editorTextareaRef.current) {
      showToast("Vui lòng nhập số dòng hợp lệ!", "warning");
      return;
    }

    const textarea = editorTextareaRef.current;
    const lines = textarea.value.split("\n");
    const totalLines = lines.length;

    if (lineNum > totalLines) {
      showToast(`Số dòng vượt quá giới hạn (Tối đa ${totalLines} dòng)!`, "warning");
      return;
    }

    // Calculate character offset for target line (1-indexed)
    let charOffset = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      charOffset += lines[i].length + 1; // +1 for \n
    }

    textarea.focus();
    textarea.setSelectionRange(charOffset, charOffset + lines[lineNum - 1].length);
    updateCursorStats();

    // Scroll textarea to roughly center the target line
    const approxLineHeight = 20; // px
    const targetScrollTop = Math.max(0, (lineNum - 5) * approxLineHeight);
    textarea.scrollTop = targetScrollTop;

    setIsEditorGotoLineOpen(false);
    showToast(`Đã di chuyển đến dòng ${lineNum}`, "info");
  };

  // Helper: Build search RegExp based on options
  const getSearchRegExp = (flags: string = "g") => {
    if (!editorSearchTerm) return null;
    try {
      let pattern = editorSearchTerm;
      if (!editorSearchRegex) {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      if (editorSearchWholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const activeFlags = flags.includes("i") && !editorSearchCaseSensitive ? flags : flags.replace("i", "");
      const finalFlags = editorSearchCaseSensitive ? activeFlags.replace("i", "") : (activeFlags.includes("i") ? activeFlags : activeFlags + "i");
      return new RegExp(pattern, finalFlags);
    } catch (_) {
      return null;
    }
  };

  // Helper: Find next occurrence of term in editor
  const handleFindNextInEditor = (forward: boolean = true) => {
    if (!editorSearchTerm || !editorTextareaRef.current) return;
    const textarea = editorTextareaRef.current;
    const text = textarea.value;

    const regex = getSearchRegExp("g");
    if (!regex) {
      showToast("Cú pháp biểu thức chính quy (Regex) không hợp lệ!", "warning");
      return;
    }

    const matches: { index: number; length: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ index: m.index, length: m[0].length });
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }

    if (matches.length === 0) {
      showToast("Không tìm thấy kết quả phù hợp!", "warning");
      return;
    }

    const curPos = forward ? textarea.selectionEnd : textarea.selectionStart;
    let targetMatch: { index: number; length: number } | null = null;

    if (forward) {
      targetMatch = matches.find((item) => item.index >= curPos) || matches[0];
    } else {
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i].index + matches[i].length <= curPos) {
          targetMatch = matches[i];
          break;
        }
      }
      if (!targetMatch) {
        targetMatch = matches[matches.length - 1];
      }
    }

    if (targetMatch) {
      textarea.focus();
      textarea.setSelectionRange(targetMatch.index, targetMatch.index + targetMatch.length);
    }
  };

  // Helper: Replace currently selected match or find next and replace
  const handleReplaceOneInEditor = () => {
    if (!editorSearchTerm || !editorTextareaRef.current) return;
    const textarea = editorTextareaRef.current;
    const text = rawLatexCode;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const selectedText = text.substring(selStart, selEnd);

    const regex = getSearchRegExp("");
    if (!regex) {
      showToast("Cú pháp Regex không hợp lệ!", "warning");
      return;
    }

    const isCurrentMatch = regex.test(selectedText) && (selectedText.length > 0 || editorSearchTerm === "");
    if (isCurrentMatch) {
      const replacedChunk = selectedText.replace(regex, editorReplaceTerm);
      const newText = text.substring(0, selStart) + replacedChunk + text.substring(selEnd);
      setRawLatexCode(newText);
      pushToLatexHistory(newText);
      setIsDirty(true);
      showToast("Đã thay thế 1 kết quả!", "info");
      setTimeout(() => {
        handleFindNextInEditor(true);
      }, 50);
    } else {
      handleFindNextInEditor(true);
    }
  };

  // Helper: Replace all occurrences
  const handleReplaceAllInEditor = () => {
    if (!editorSearchTerm) return;
    const regex = getSearchRegExp("g");
    if (!regex) {
      showToast("Cú pháp biểu thức chính quy (Regex) không hợp lệ!", "warning");
      return;
    }

    const matches = rawLatexCode.match(regex);
    const count = matches ? matches.length : 0;

    if (count === 0) {
      showToast("Không tìm thấy kết quả phù hợp để thay thế!", "warning");
      return;
    }

    const updatedCode = rawLatexCode.replace(regex, editorReplaceTerm);

    setRawLatexCode(updatedCode);
    pushToLatexHistory(updatedCode);
    setIsDirty(true);
    showToast(`Đã thay thế toàn bộ ${count} vị trí trong mã nguồn LaTeX!`, "success");
  };

  // Pedagogical exam snippet templates for rapid question creation
  const PEDAGOGICAL_SNIPPET_TEMPLATES = [
    {
      id: "part_single_choice",
      title: "PHẦN I: Trắc nghiệm 4 phương án (ABCD)",
      category: "Cấu trúc đề",
      desc: "Mẫu chuẩn BGD cho câu hỏi trắc nghiệm nhiều lựa chọn",
      snippet: `\\section*{PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn}
\\textit{Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi thí sinh chỉ chọn một phương án.}

\\begin{ex}
  Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ và có bảng biến thiên như hình vẽ. Khẳng định nào sau đây đúng?
  \\choice
  {Hàm số đồng biến trên khoảng $(-\\infty; 0)$}
  {\\True Hàm số nghịch biến trên khoảng $(0; 2)$}
  {Hàm số đạt cực đại tại $x = 2$}
  {Giá trị nhỏ nhất của hàm số bằng $-1$}
\\end{ex}
`,
    },
    {
      id: "part_true_false",
      title: "PHẦN II: Trắc nghiệm Đúng/Sai (4 ý a,b,c,d)",
      category: "Cấu trúc đề",
      desc: "Mẫu chuẩn trắc nghiệm Đúng/Sai quy định mới của BGD",
      snippet: `\\section*{PHẦN II. Câu trắc nghiệm đúng sai}
\\textit{Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.}

\\begin{ex}
  Cho hàm số bậc ba $y = f(x) = ax^3 + bx^2 + cx + d$ có đồ thị là đường cong trong hình bên.
  \\choiceTF
  {\\True Hàm số đồng biến trên khoảng $(-1; 1)$}
  {Hàm số đạt cực trị tại $x = 0$}
  {\\True Giá trị cực đại của hàm số bằng $2$}
  {Phương trình $f(x) = 0$ có đúng $3$ nghiệm thực phân biệt}
\\end{ex}
`,
    },
    {
      id: "part_short_answer",
      title: "PHẦN III: Câu trắc nghiệm trả lời ngắn",
      category: "Cấu trúc đề",
      desc: "Mẫu điền số/kết quả chuẩn form chấm thi máy tính",
      snippet: `\\section*{PHẦN III. Câu trắc nghiệm trả lời ngắn}
\\textit{Thí sinh trả lời từ câu 1 đến câu 6.}

\\begin{ex}
  Một chất điểm chuyển động theo quy luật $s(t) = -t^3 + 6t^2 + 10$ với $t$ tính bằng giây, $s$ tính bằng mét. Vận tốc tức thời lớn nhất của chất điểm trong khoảng thời gian từ $t = 0$ đến $t = 5$ bằng bao nhiêu $\\text{m/s}$?
  \\loigiai{
    Ta có $v(t) = s'(t) = -3t^2 + 12t = -3(t - 2)^2 + 12 \\le 12$. Đạt được khi $t = 2$.
    Đáp số: $12$.
  }
\\end{ex}
`,
    },
    {
      id: "question_table_var",
      title: "Bảng biến thiên hàm số (tkz-tab)",
      category: "Đồ thị & Bảng biểu",
      desc: "Khối tạo bảng biến thiên 3 dòng x, y', y chuẩn sư phạm",
      snippet: `\\begin{center}
\\begin{tikzpicture}
  \\tkzTabInit[lgt=1.5,espcl=2.5]{$x$/1, $y'$/1, $y$/2}{$-\\infty$, $-1$, $1$, $+\\infty$}
  \\tkzTabLine{, +, 0, -, 0, +, }
  \\tkzTabVar{-/ $-\\infty$, +/ $3$, -/ $-1$, +/ $+\\infty$}
\\end{tikzpicture}
\\end{center}
`,
    },
    {
      id: "question_figure_grid",
      title: "Khung hình vẽ TikZ 2D Hệ tọa độ Oxy",
      category: "Đồ thị & Bảng biểu",
      desc: "Hệ trục Oxy với lưới kẻ tọa độ sắc nét",
      snippet: `\\begin{center}
\\begin{tikzpicture}[scale=0.8,>=stealth]
  \\draw[->] (-3,0) -- (3,0) node[below] {$x$};
  \\draw[->] (0,-3) -- (0,3) node[left] {$y$};
  \\draw (0,0) node[below left] {$O$};
  \\draw[domain=-2.2:2.2,smooth,variable=\\x,blue,thick] plot ({\\x},{\\x*\\x - 2});
\\end{tikzpicture}
\\end{center}
`,
    },
    {
      id: "matrix_system",
      title: "Hệ phương trình toán học & Ma trận",
      category: "Công thức toán",
      desc: "Hệ phương trình nhiều ẩn hoặc ma trận số học",
      snippet: `\\left\\{
\\begin{aligned}
  2x + y - z &= 3 \\\\
  x - 2y + 3z &= -1 \\\\
  3x + 2y - z &= 4
\\end{aligned}
\\right.
`,
    },
  ];

  // Helper: Compute real-time pedagogical document & exam analytics
  const examPedagogicalStats = useMemo(() => {
    const text = rawLatexCode || "";
    const lines = text.split("\n");
    const totalLines = lines.length;
    const totalChars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    // Detect structural sections
    const part1Matches = (text.match(/\\section\*?\{.*PHẦN I.*\}|PHẦN I\b/gi) || []).length;
    const part2Matches = (text.match(/\\section\*?\{.*PHẦN II.*\}|PHẦN II\b/gi) || []).length;
    const part3Matches = (text.match(/\\section\*?\{.*PHẦN III.*\}|PHẦN III\b/gi) || []).length;

    // Count questions / exercises
    const exMatches = (text.match(/\\begin\{ex\}/g) || []).length;
    const cauMatches = (text.match(/\\textbf\{Câu\s+\d+[:.]?\}/gi) || text.match(/\bCâu\s+\d+[:.]/gi) || []).length;
    const totalQuestions = Math.max(exMatches, cauMatches);

    // Count choice types
    const choice4Count = (text.match(/\\choice\b/g) || []).length;
    const choiceTFCount = (text.match(/\\choiceTF\b/g) || []).length;
    const loigiaiCount = (text.match(/\\loigiai\b/g) || []).length;

    // Count formulas & math
    const inlineMath = (text.match(/(^|[^\\])\$([^\$]+)\$/g) || []).length;
    const displayMath = (text.match(/\$\$[\s\S]*?\$\$/g) || text.match(/\\\[[\s\S]*?\\\]/g) || []).length;
    const totalMathFormulas = inlineMath + displayMath;

    // Count TikZ & figures
    const tikzPictures = (text.match(/\\begin\{tikzpicture\}/g) || []).length;
    const tikzTabs = (text.match(/\\begin\{tikzpicture\}[\s\S]*?\\tkzTab/g) || text.match(/\\tkzTabInit/g) || []).length;

    // Estimated reading / solving time
    const readingMinutes = Math.max(1, Math.ceil(words / 130));

    return {
      totalLines,
      totalChars,
      words,
      part1Matches,
      part2Matches,
      part3Matches,
      totalQuestions,
      choice4Count,
      choiceTFCount,
      loigiaiCount,
      totalMathFormulas,
      tikzPictures,
      tikzTabs,
      readingMinutes,
    };
  }, [rawLatexCode]);

  // LaTeX Environment Template Data
  interface LatexEnvTemplate {
    name: string;
    label: string;
    desc: string;
    category: "exam" | "math" | "table" | "diagram";
    param?: string;
    iconText: string;
  }

  const LATEX_ENV_TEMPLATES: LatexEnvTemplate[] = [
    // Exam Question Environments
    { name: "ex", label: "Bài toán / Câu hỏi (ex)", desc: "Môi trường câu hỏi tiêu chuẩn chuẩn kỳ thi BGD", category: "exam", iconText: "EX" },
    { name: "bt", label: "Bài tập rèn luyện (bt)", desc: "Môi trường bài tập có hướng dẫn lời giải", category: "exam", iconText: "BT" },
    { name: "vd", label: "Ví dụ minh họa (vd)", desc: "Môi trường ví dụ áp dụng lý thuyết", category: "exam", iconText: "VD" },
    { name: "loigiai", label: "Lời giải chi tiết (loigiai)", desc: "Khối trình bày lời giải và phân tích đáp án", category: "exam", iconText: "LG" },
    { name: "note", label: "Ghi chú sư phạm (note)", desc: "Khối lưu ý trọng tâm cho học sinh", category: "exam", iconText: "NT" },

    // Math Equations Environments
    { name: "align*", label: "Hệ biến đổi căn chỉnh (align*)", desc: "Căn lề công thức nhiều dòng qua dấu &", category: "math", iconText: "AL" },
    { name: "equation*", label: "Phương trình nổi bật (equation*)", desc: "Công thức toán đứng riêng một dòng trung tâm", category: "math", iconText: "EQ" },
    { name: "gather*", label: "Tập hợp biểu thức (gather*)", desc: "Nhiều dòng công thức căn giữa độc lập", category: "math", iconText: "GT" },
    { name: "cases", label: "Dấu ngoặc nhọn hệ PT (cases)", desc: "Chia nhánh điều kiện hoặc hệ phương trình", category: "math", iconText: "CS" },
    { name: "matrix", label: "Ma trận không viền (matrix)", desc: "Bảng số ma trận tiêu chuẩn", category: "math", iconText: "MX" },
    { name: "pmatrix", label: "Ma trận ngoặc tròn (pmatrix)", desc: "Ma trận bọc trong dấu ngoặc đơn ( )", category: "math", iconText: "PM" },
    { name: "bmatrix", label: "Ma trận ngoặc vuông (bmatrix)", desc: "Ma trận bọc trong dấu ngoặc vuông [ ]", category: "math", iconText: "BM" },

    // Diagram & Layout Environments
    { name: "tikzpicture", label: "Đồ thị TikZ (tikzpicture)", desc: "Vẽ hình học, đồ thị hàm số và sơ đồ", category: "diagram", iconText: "TZ" },
    { name: "center", label: "Căn giữa trang in (center)", desc: "Căn giữa hình vẽ, bảng biểu hoặc tiêu đề", category: "diagram", iconText: "CT" },
    { name: "multicols", label: "Chia cột đề thi (multicols)", desc: "Trình bày 2 cột tiết kiệm diện tích in ấn A4", param: "2", category: "diagram", iconText: "MC" },
    { name: "enumerate", label: "Danh sách đánh số (enumerate)", desc: "Liệt kê ý 1, 2, 3... hoặc a, b, c...", category: "diagram", iconText: "EN" },
    { name: "tabular", label: "Bảng dữ liệu (tabular)", desc: "Kẻ bảng đối sánh hoặc bảng biến thiên", param: "|c|c|c|", category: "table", iconText: "TB" },
  ];

  // Mathematical Symbols & Operators Palette Data
  interface MathSymbolItem {
    symbol: string;
    latex: string;
    name: string;
    category: "greek" | "operators" | "relations" | "sets" | "geometry";
  }

  const QUICK_MATH_SYMBOLS: MathSymbolItem[] = [
    // Greek
    { symbol: "α", latex: "\\alpha", name: "alpha", category: "greek" },
    { symbol: "β", latex: "\\beta", name: "beta", category: "greek" },
    { symbol: "γ", latex: "\\gamma", name: "gamma", category: "greek" },
    { symbol: "Δ", latex: "\\Delta", name: "Delta (biệt thức)", category: "greek" },
    { symbol: "π", latex: "\\pi", name: "pi (3.14)", category: "greek" },
    { symbol: "θ", latex: "\\theta", name: "theta (góc)", category: "greek" },
    { symbol: "ω", latex: "\\omega", name: "omega", category: "greek" },
    { symbol: "λ", latex: "\\lambda", name: "lambda (bước sóng)", category: "greek" },
    { symbol: "φ", latex: "\\varphi", name: "phi", category: "greek" },
    // Operators
    { symbol: "±", latex: "\\pm", name: "cộng trừ", category: "operators" },
    { symbol: "×", latex: "\\times", name: "nhân (times)", category: "operators" },
    { symbol: "÷", latex: "\\div", name: "chia (div)", category: "operators" },
    { symbol: "·", latex: "\\cdot", name: "chấm nhân", category: "operators" },
    { symbol: "∫", latex: "\\int_{a}^{b}", name: "tích phân", category: "operators" },
    { symbol: "∑", latex: "\\sum_{i=1}^{n}", name: "tổng sigma", category: "operators" },
    { symbol: "lim", latex: "\\lim_{x \\to x_0}", name: "giới hạn", category: "operators" },
    { symbol: "√", latex: "\\sqrt{x}", name: "căn bậc hai", category: "operators" },
    { symbol: "∞", latex: "\\infty", name: "vô cực", category: "operators" },
    // Relations
    { symbol: "≠", latex: "\\ne", name: "khác", category: "relations" },
    { symbol: "≤", latex: "\\le", name: "nhỏ hơn hoặc bằng", category: "relations" },
    { symbol: "≥", latex: "\\ge", name: "lớn hơn hoặc bằng", category: "relations" },
    { symbol: "≈", latex: "\\approx", name: "xấp xỉ", category: "relations" },
    { symbol: "≡", latex: "\\equiv", name: "đồng nhất / đồng dư", category: "relations" },
    { symbol: "⇒", latex: "\\Rightarrow", name: "suy ra", category: "relations" },
    { symbol: "⇔", latex: "\\Leftrightarrow", name: "tương đương", category: "relations" },
    // Sets & Logic
    { symbol: "∈", latex: "\\in", name: "thuộc", category: "sets" },
    { symbol: "∉", latex: "\\notin", name: "không thuộc", category: "sets" },
    { symbol: "⊂", latex: "\\subset", name: "tập con", category: "sets" },
    { symbol: "∪", latex: "\\cup", name: "hợp", category: "sets" },
    { symbol: "∩", latex: "\\cap", name: "giao", category: "sets" },
    { symbol: "∅", latex: "\\emptyset", name: "tập rỗng", category: "sets" },
    { symbol: "∀", latex: "\\forall", name: "với mọi", category: "sets" },
    { symbol: "∃", latex: "\\exists", name: "tồn tại", category: "sets" },
    { symbol: "ℝ", latex: "\\mathbb{R}", name: "tập số thực", category: "sets" },
    // Geometry & Vectors
    { symbol: "⊥", latex: "\\perp", name: "vuông góc", category: "geometry" },
    { symbol: "∥", latex: "\\parallel", name: "song song", category: "geometry" },
    { symbol: "∠", latex: "\\widehat{ABC}", name: "góc tam giác", category: "geometry" },
    { symbol: "→", latex: "\\vec{u}", name: "vectơ u", category: "geometry" },
    { symbol: "Δ", latex: "\\Delta ABC", name: "tam giác ABC", category: "geometry" },
  ];

  // Answer Key Item Interface
  interface ExamAnswerKeyItem {
    questionNumber: number;
    questionTextSnippet: string;
    answerType: "mcq" | "tf" | "sa" | "essay";
    correctAnswer: string;
    hasSolution: boolean;
    solutionSnippet?: string;
  }

  // Memoized Answer Key Matrix Extraction Engine
  const examAnswerKeyMatrix = useMemo<ExamAnswerKeyItem[]>(() => {
    const text = rawLatexCode || "";
    if (!text.trim()) return [];

    const exRegex = /\\begin\{ex\}([\s\S]*?)\\end\{ex\}/g;
    const items: ExamAnswerKeyItem[] = [];
    let match;
    let qIdx = 1;

    while ((match = exRegex.exec(text)) !== null) {
      const qBody = match[1];
      
      // Determine question snippet (first meaningful text line)
      const cleanLines = qBody
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith("%") && !l.startsWith("\\choice") && !l.startsWith("\\motcot") && !l.startsWith("\\haicot") && !l.startsWith("\\loigiai"));
      const questionTextSnippet = cleanLines[0] ? cleanLines[0].substring(0, 100) : `Câu hỏi ${qIdx}`;

      // Check for solution
      const hasSolution = /\\loigiai\{([\s\S]*?)\}/.test(qBody) || /\\begin\{loigiai\}/.test(qBody);
      let solutionSnippet = "";
      const solMatch = qBody.match(/\\loigiai\{([\s\S]*?)\}/) || qBody.match(/\\begin\{loigiai\}([\s\S]*?)\\end\{loigiai\}/);
      if (solMatch && solMatch[1]) {
        solutionSnippet = solMatch[1].replace(/[\n\r]+/g, " ").trim().substring(0, 120);
      }

      // Check MCQ with \choice, \True
      const choiceBlockMatch = qBody.match(/\\(?:choice|haicot|motcot)\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}\s*\{([\s\S]*?)\}/);
      if (choiceBlockMatch) {
        const choices = [choiceBlockMatch[1], choiceBlockMatch[2], choiceBlockMatch[3], choiceBlockMatch[4]];
        let correctLetter = "";
        choices.forEach((c, idx) => {
          if (c.includes("\\True")) {
            correctLetter = String.fromCharCode(65 + idx); // A, B, C, D
          }
        });

        items.push({
          questionNumber: qIdx,
          questionTextSnippet,
          answerType: "mcq",
          correctAnswer: correctLetter || "Chưa gán \\True",
          hasSolution,
          solutionSnippet
        });
      } else {
        // True / False or Short Answer or Essay
        const tfMatches = Array.from(qBody.matchAll(/\\True/g));
        if (tfMatches.length > 0) {
          items.push({
            questionNumber: qIdx,
            questionTextSnippet,
            answerType: "tf",
            correctAnswer: `Có ${tfMatches.length} ý \\True`,
            hasSolution,
            solutionSnippet
          });
        } else {
          items.push({
            questionNumber: qIdx,
            questionTextSnippet,
            answerType: hasSolution ? "essay" : "sa",
            correctAnswer: hasSolution ? "Xem lời giải" : "Chưa có đáp án",
            hasSolution,
            solutionSnippet
          });
        }
      }
      qIdx++;
    }

    return items;
  }, [rawLatexCode]);

  // Helper: Real-time LaTeX syntax, environment & bracket linter
  interface LatexLintDiagnostic {
    id: string;
    line: number;
    severity: "error" | "warning";
    message: string;
    suggestion?: string;
  }

  const examLatexDiagnostics = useMemo<LatexLintDiagnostic[]>(() => {
    const text = rawLatexCode || "";
    if (!text.trim()) return [];
    const lines = text.split("\n");
    const diagnostics: LatexLintDiagnostic[] = [];

    // 1. Line-by-line checks
    const envStack: { name: string; line: number }[] = [];

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const trimmed = lineText.trim();
      if (trimmed.startsWith("%")) return; // Skip pure comment lines

      // Count unescaped dollar signs on this line (inline math pairing warning)
      const unescapedDollars = (lineText.match(/(?<!\\)\$/g) || []).length;
      if (unescapedDollars % 2 !== 0 && !lineText.includes("$$")) {
        diagnostics.push({
          id: `dollar-${lineNum}`,
          line: lineNum,
          severity: "warning",
          message: `Dấu $ mở công thức toán chưa được đóng trên dòng này (${unescapedDollars} dấu $).`,
          suggestion: "Kiểm tra xem bạn có quên đóng cặp $...$ không.",
        });
      }

      // Check unbalanced curly braces on single line if not spanning multiline
      let openBraces = 0;
      let closeBraces = 0;
      for (let i = 0; i < lineText.length; i++) {
        if (lineText[i] === "{" && (i === 0 || lineText[i - 1] !== "\\")) openBraces++;
        if (lineText[i] === "}" && (i === 0 || lineText[i - 1] !== "\\")) closeBraces++;
      }
      if (openBraces !== closeBraces && Math.abs(openBraces - closeBraces) > 2) {
        diagnostics.push({
          id: `brace-${lineNum}`,
          line: lineNum,
          severity: "warning",
          message: `Dấu ngoặc nhọn { } có độ lệch lớn (${openBraces} mở vs ${closeBraces} đóng).`,
          suggestion: "Kiểm tra các cặp ngoặc tham số của lệnh LaTeX.",
        });
      }

      // Track begin / end environments
      const beginMatches = Array.from(lineText.matchAll(/\\begin\{([a-zA-Z0-9*_-]+)\}/g));
      beginMatches.forEach((m) => {
        envStack.push({ name: m[1], line: lineNum });
      });

      const endMatches = Array.from(lineText.matchAll(/\\end\{([a-zA-Z0-9*_-]+)\}/g));
      endMatches.forEach((m) => {
        const endName = m[1];
        if (envStack.length === 0) {
          diagnostics.push({
            id: `end-unmatched-${lineNum}-${endName}`,
            line: lineNum,
            severity: "error",
            message: `Lệnh \\end{${endName}} không có môi trường \\begin tương ứng trước đó.`,
            suggestion: `Bổ sung \\begin{${endName}} hoặc xóa thẻ đóng dư thừa.`,
          });
        } else {
          const last = envStack.pop()!;
          if (last.name !== endName) {
            diagnostics.push({
              id: `env-mismatch-${lineNum}`,
              line: lineNum,
              severity: "error",
              message: `Môi trường đóng lệch: mong đợi \\end{${last.name}} (mở ở dòng ${last.line}) nhưng gặp \\end{${endName}}.`,
              suggestion: `Đóng đúng môi trường \\end{${last.name}} trước khi đóng \\end{${endName}}.`,
            });
          }
        }
      });
    });

    // Check remaining unclosed environments
    envStack.forEach((unclosed) => {
      diagnostics.push({
        id: `unclosed-env-${unclosed.line}-${unclosed.name}`,
        line: unclosed.line,
        severity: "error",
        message: `Môi trường \\begin{${unclosed.name}} ở dòng ${unclosed.line} chưa được đóng bằng \\end{${unclosed.name}}.`,
        suggestion: `Bổ sung \\end{${unclosed.name}} vào cuối khối câu hỏi hoặc văn bản.`,
      });
    });

    return diagnostics;
  }, [rawLatexCode]);

  // Preflight Quality Assurance Checklist for BGD 2025 Exam Standard
  interface PreflightCheckItem {
    id: string;
    title: string;
    description: string;
    passed: boolean;
    severity: "critical" | "recommended" | "optional";
    category: "structure" | "pedagogy" | "syntax" | "printing";
  }

  const examPreflightAudit = useMemo<{
    items: PreflightCheckItem[];
    score: number;
    totalPassed: number;
    totalChecks: number;
    isReadyForPrint: boolean;
  }>(() => {
    const text = rawLatexCode || "";
    const stats = examPedagogicalStats;
    const diagnostics = examLatexDiagnostics;

    const items: PreflightCheckItem[] = [
      {
        id: "syntax_errors",
        title: "Toàn vẹn cú pháp & môi trường LaTeX",
        description: "Không có lỗi nghiêm trọng (unclosed environments, thẻ lệch)",
        passed: diagnostics.filter((d) => d.severity === "error").length === 0,
        severity: "critical",
        category: "syntax",
      },
      {
        id: "has_questions",
        title: "Có câu hỏi thi hợp lệ",
        description: "Tài liệu chứa ít nhất 1 câu hỏi (môi trường ex)",
        passed: stats.totalQuestions > 0,
        severity: "critical",
        category: "structure",
      },
      {
        id: "part_one_structure",
        title: "Cấu trúc Phần I: Trắc nghiệm 4 lựa chọn",
        description: "Có phần I và số phương án choice đúng chuẩn 4 phương án {A}{B}{C}{D}",
        passed: stats.part1Matches === 0 || (stats.part1Matches > 0 && stats.choice4Count >= 1),
        severity: "recommended",
        category: "pedagogy",
      },
      {
        id: "part_two_structure",
        title: "Cấu trúc Phần II: Trắc nghiệm Đúng/Sai",
        description: "Nếu có Phần II, phải có các mệnh đề choiceTF 4 ý {a}{b}{c}{d}",
        passed: stats.part2Matches === 0 || (stats.part2Matches > 0 && stats.choiceTFCount >= 1),
        severity: "recommended",
        category: "pedagogy",
      },
      {
        id: "solutions_rate",
        title: "Đầy đủ lời giải chi tiết (\\loigiai)",
        description: "Tối thiểu 70% số câu hỏi có phần hướng dẫn giải chi tiết sư phạm",
        passed: stats.totalQuestions === 0 ? false : (stats.loigiaiCount / stats.totalQuestions) >= 0.7,
        severity: "recommended",
        category: "pedagogy",
      },
      {
        id: "exam_header",
        title: "Thông tin tiêu đề đề thi & Trung tâm",
        description: "Có tiêu đề đề thi, mã đề hoặc tên trường/trung tâm",
        passed: text.includes("\\tieude") || text.includes("\\begin{center}") || text.includes("ĐỀ THI") || text.includes("SỞ GIÁO DỤC") || text.includes("TRUNG TÂM"),
        severity: "recommended",
        category: "structure",
      },
      {
        id: "no_syntax_warnings",
        title: "Không có cảnh báo công thức toán ($...$)",
        description: "Các công thức toán inline đều được đóng cặp trọn vẹn",
        passed: diagnostics.filter((d) => d.severity === "warning").length === 0,
        severity: "optional",
        category: "syntax",
      },
      {
        id: "duration_specified",
        title: "Quy định thời gian làm bài chuẩn",
        description: "Có ghi rõ thời gian làm bài (ví dụ: 90 phút, 50 phút)",
        passed: /thời gian( làm bài)?:\s*\d+/i.test(text) || /\d+\s*phút/i.test(text),
        severity: "optional",
        category: "printing",
      },
    ];

    const criticalItems = items.filter((i) => i.severity === "critical");
    const recommendedItems = items.filter((i) => i.severity === "recommended");
    const totalPassed = items.filter((i) => i.passed).length;
    const score = Math.round((totalPassed / items.length) * 100);
    const isReadyForPrint = criticalItems.every((i) => i.passed) && recommendedItems.filter((i) => i.passed).length >= 2;

    return {
      items,
      score,
      totalPassed,
      totalChecks: items.length,
      isReadyForPrint,
    };
  }, [rawLatexCode, examPedagogicalStats, examLatexDiagnostics]);

  // Helper: Handle smart auto-pairing, auto-wrap & backspace removal in editor
  const handleEditorKeyDownAutoPair = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isAutoClosePairs) return;
    const ta = editorTextareaRef.current;
    if (!ta) return;

    const pairs: Record<string, string> = {
      "{": "}",
      "[": "]",
      "(": ")",
      "$": "$",
      '"': '"',
    };

    const key = e.key;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;

    // 1. If key is an opening pair character
    if (pairs[key]) {
      const closeChar = pairs[key];
      // Case A: User has selected text -> Wrap selection with the pair!
      if (start !== end) {
        e.preventDefault();
        const selected = text.substring(start, end);
        const wrapped = `${key}${selected}${closeChar}`;
        const newText = text.substring(0, start) + wrapped + text.substring(end);
        setRawLatexCode(newText);
        pushToLatexHistory(newText, true);
        setIsDirty(true);
        setTimeout(() => {
          if (editorTextareaRef.current) {
            editorTextareaRef.current.selectionStart = start + 1;
            editorTextareaRef.current.selectionEnd = end + 1;
            updateCursorStats();
          }
        }, 10);
        return;
      }

      // Case B: Key is '$' and next char is already '$' -> skip closing (overtype)
      if (key === "$" && text[start] === "$") {
        e.preventDefault();
        ta.selectionStart = start + 1;
        ta.selectionEnd = start + 1;
        updateCursorStats();
        return;
      }

      // Case C: Insert both and put cursor inside
      e.preventDefault();
      const newText = text.substring(0, start) + key + closeChar + text.substring(end);
      setRawLatexCode(newText);
      pushToLatexHistory(newText, true);
      setIsDirty(true);
      setTimeout(() => {
        if (editorTextareaRef.current) {
          ta.selectionStart = start + 1;
          ta.selectionEnd = start + 1;
          updateCursorStats();
        }
      }, 10);
      return;
    }

    // 2. Overtyping closing character: }, ], ), $
    const closePairs = ["}", "]", ")", "$", '"'];
    if (closePairs.includes(key) && start === end && text[start] === key) {
      e.preventDefault();
      ta.selectionStart = start + 1;
      ta.selectionEnd = start + 1;
      updateCursorStats();
      return;
    }

    // 3. Smart backspace: if backspacing inside empty pair like {} or [] or () or $$, delete both!
    if (key === "Backspace" && start === end && start > 0) {
      const prevChar = text[start - 1];
      const nextChar = text[start];
      if (pairs[prevChar] && pairs[prevChar] === nextChar) {
        e.preventDefault();
        const newText = text.substring(0, start - 1) + text.substring(start + 1);
        setRawLatexCode(newText);
        pushToLatexHistory(newText, true);
        setIsDirty(true);
        setTimeout(() => {
          if (editorTextareaRef.current) {
            ta.selectionStart = start - 1;
            ta.selectionEnd = start - 1;
            updateCursorStats();
          }
        }, 10);
        return;
      }
    }
  };

  // Helper: Generate multiple shuffled exam variants with customized exam codes
  const handleGenerateExamVariants = () => {
    setIsGeneratingVariants(true);
    try {
      // 1. Parse all items/questions from rawLatexCode
      const rawText = rawLatexCode || "";
      const exRegex = /\\begin\{ex\}([\s\S]*?)\\end\{ex\}/g;
      const questionBlocks: string[] = [];
      let match;
      while ((match = exRegex.exec(rawText)) !== null) {
        questionBlocks.push(match[0]);
      }

      if (questionBlocks.length === 0) {
        showToast("Không tìm thấy câu hỏi \\begin{ex}...\\end{ex} nào trong mã đề để hoán vị!", "warning");
        setIsGeneratingVariants(false);
        return;
      }

      // Find the range of questions in rawText to replace
      const firstIndex = rawText.indexOf(questionBlocks[0]);
      const lastIndex = rawText.lastIndexOf(questionBlocks[questionBlocks.length - 1]) + questionBlocks[questionBlocks.length - 1].length;
      const prefixHeader = rawText.substring(0, firstIndex);
      const suffixFooter = rawText.substring(lastIndex);

      const count = Math.min(Math.max(1, variantCount), 10);
      const startBase = parseInt(variantPrefix, 10) || 101;
      const variants: Array<{ code: string; questionsCount: number; latex: string }> = [];

      // Pseudo-random seeded shuffle helper (Fisher-Yates)
      const shuffleArray = <T,>(arr: T[], seed: number): T[] => {
        const copy = [...arr];
        let m = copy.length, t, i;
        let s = seed;
        const random = () => {
          s = (s * 9301 + 49297) % 233280;
          return s / 233280;
        };
        while (m) {
          i = Math.floor(random() * m--);
          t = copy[m];
          copy[m] = copy[i];
          copy[i] = t;
        }
        return copy;
      };

      for (let idx = 0; idx < count; idx++) {
        const currentCode = (startBase + idx).toString();
        // If first variant and startBase matches default, keep original order, else shuffle
        const shuffledQuestions = idx === 0 ? [...questionBlocks] : shuffleArray(questionBlocks, startBase * 73 + idx * 1337);
        
        // Update exam_code in header if present
        let variantHeader = prefixHeader;
        if (/Mã đề:\s*\d+/i.test(variantHeader)) {
          variantHeader = variantHeader.replace(/Mã đề:\s*\d+/gi, `Mã đề: ${currentCode}`);
        } else if (/Mã đề/i.test(variantHeader)) {
          variantHeader = variantHeader.replace(/Mã đề[^\n\r\\}]*/gi, `Mã đề: ${currentCode}`);
        }

        const variantFullLatex = `${variantHeader}${shuffledQuestions.join("\n\n")}${suffixFooter}`;
        variants.push({
          code: currentCode,
          questionsCount: shuffledQuestions.length,
          latex: variantFullLatex
        });
      }

      setGeneratedVariants(variants);
      setSelectedVariantPreview(0);
      showToast(`Đã tạo thành công ${variants.length} mã đề thi hoán vị!`, "success");
    } catch (err: any) {
      console.error("Variant generation error:", err);
      showToast("Có lỗi xảy ra khi tạo mã đề hoán vị: " + (err.message || String(err)), "warning");
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // Helper: Batch update cognitive level/difficulty for selected questions
  const handleApplyBatchDifficulty = (diff: string) => {
    if (selectedItemIds.length === 0) {
      showToast("Chưa chọn câu hỏi nào để cập nhật!", "warning");
      return;
    }
    const updated = items.map((it) => {
      if (selectedItemIds.includes(it.id)) {
        return {
          ...it,
          difficulty: diff,
          problem_snapshot: {
            ...(it.problem_snapshot || {}),
            difficulty: diff,
            cognitive_level: diff,
          },
        };
      }
      return it;
    });
    setItems(updated);
    setIsDirty(true);
    setIsBatchActionModalOpen(false);
    showToast(`Đã cập nhật độ khó cho ${selectedItemIds.length} câu hỏi thành công!`, "success");
  };

  // Helper: Batch set points for selected questions
  const handleApplyBatchPoints = (points: number) => {
    if (selectedItemIds.length === 0) {
      showToast("Chưa chọn câu hỏi nào để gán điểm!", "warning");
      return;
    }
    if (points <= 0) {
      showToast("Điểm số phải lớn hơn 0!", "warning");
      return;
    }
    const updated = items.map((it) => {
      if (selectedItemIds.includes(it.id)) {
        return {
          ...it,
          points: points,
          max_points: points,
        };
      }
      return it;
    });
    setItems(updated);
    setIsDirty(true);
    setIsBatchActionModalOpen(false);
    showToast(`Đã gán ${points} điểm cho ${selectedItemIds.length} câu hỏi thành công!`, "success");
  };

  // Helper: Batch delete selected questions
  const handleApplyBatchDelete = () => {
    if (selectedItemIds.length === 0) {
      showToast("Chưa chọn câu hỏi nào để xóa!", "warning");
      return;
    }
    if (items.length - selectedItemIds.length <= 0) {
      showToast("Không thể xóa toàn bộ câu hỏi của đề thi!", "warning");
      return;
    }
    const remaining = items.filter((it) => !selectedItemIds.includes(it.id));
    setItems(remaining);
    setSelectedItemIds([]);
    setIsDirty(true);
    setIsBatchActionModalOpen(false);
    showToast(`Đã xóa ${selectedItemIds.length} câu hỏi được chọn!`, "success");
  };

  // Helper: Rescale and rebalance exam score distribution
  const handleCreateCustomQuestion = () => {
    if (!newQuestionForm.content.trim()) {
      showToast("Vui lòng nhập nội dung câu hỏi!", "warning");
      return;
    }
    const newId = `custom_${Date.now()}`;
    const nextOrder = items.length + 1;
    const newItem: any = {
      id: newId,
      exam_id: examId,
      order_index: nextOrder,
      display_label: `Câu ${nextOrder}`,
      difficulty: newQuestionForm.difficulty,
      points: Number(newQuestionForm.points) || 0.25,
      max_points: Number(newQuestionForm.points) || 0.25,
      problem_snapshot: {
        id: newId,
        content: newQuestionForm.content.trim(),
        question_type: newQuestionForm.question_type,
        options: newQuestionForm.question_type === "mcq" ? newQuestionForm.options : [],
        correct_answer: newQuestionForm.correct_key,
        difficulty: newQuestionForm.difficulty,
        cognitive_level: newQuestionForm.difficulty,
        solution: newQuestionForm.solution.trim(),
      },
      rubric_data: {
        steps: newQuestionForm.solution.trim() ? [
          { step_order: 1, description: newQuestionForm.solution.trim(), points: Number(newQuestionForm.points) || 0.25 }
        ] : []
      }
    };
    setItems([...items, newItem]);
    setIsDirty(true);
    setIsAddQuestionModalOpen(false);
    // Reset form
    setNewQuestionForm({
      content: "",
      question_type: "mcq",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
      ],
      correct_key: "A",
      difficulty: "nb",
      points: 0.25,
      solution: "",
    });
    showToast(`Đã thêm thành công Câu ${nextOrder} vào đề thi!`, "success");
  };

  const handleApplyScoreRescaling = () => {
    if (items.length === 0) {
      showToast("Không có câu hỏi nào để quy đổi điểm!", "warning");
      return;
    }
    if (targetScaleScore <= 0) {
      showToast("Thang điểm mục tiêu phải lớn hơn 0!", "warning");
      return;
    }

    let updatedItems = [...items];
    if (scaleMode === "equal") {
      // Chia đều điểm cho tất cả câu hỏi
      const rawPointsPerItem = targetScaleScore / items.length;
      const roundedPoints = Math.round(rawPointsPerItem * 100) / 100;
      let totalAssigned = 0;

      updatedItems = updatedItems.map((item, index) => {
        if (index === updatedItems.length - 1) {
          // Gán phần dư chính xác cho câu cuối cùng để tổng điểm tuyệt đối bằng targetScaleScore
          const lastPoint = Math.round((targetScaleScore - totalAssigned) * 100) / 100;
          return { ...item, points: lastPoint };
        }
        totalAssigned += roundedPoints;
        return { ...item, points: roundedPoints };
      });
    } else {
      // Quy đổi tỷ lệ thuận theo điểm hiện tại (Proportional)
      const currentSum = updatedItems.reduce((acc, it) => acc + (it.points || 1), 0);
      if (currentSum <= 0) {
        showToast("Tổng điểm hiện tại không hợp lệ!", "warning");
        return;
      }
      const ratio = targetScaleScore / currentSum;
      let totalAssigned = 0;

      updatedItems = updatedItems.map((item, index) => {
        if (index === updatedItems.length - 1) {
          const lastPoint = Math.round((targetScaleScore - totalAssigned) * 100) / 100;
          return { ...item, points: lastPoint };
        }
        const scaledPoint = Math.round((item.points || 1) * ratio * 100) / 100;
        totalAssigned += scaledPoint;
        return { ...item, points: scaledPoint };
      });
    }

    setItems(updatedItems);
    setIsDirty(true);
    setIsScaleScoreModalOpen(false);
    showToast(`Đã quy đổi toàn bộ điểm sang thang ${targetScaleScore} điểm thành công!`, "success");
  };

  // Helper: Wrap currently selected text with a custom LaTeX environment
  const handleWrapSelectionWithEnv = (envName: string, param: string = "") => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;

    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const currentText = rawLatexCode;
    const selectedText = currentText.substring(selStart, selEnd);

    const openTag = param ? `\\begin{${envName}}{${param}}\n` : `\\begin{${envName}}\n`;
    const closeTag = `\n\\end{${envName}}`;
    const indentedContent = selectedText
      ? selectedText
          .split("\n")
          .map((line) => (line.trim() ? `  ${line}` : line))
          .join("\n")
      : "  ";

    const wrappedSnippet = `${openTag}${indentedContent}${closeTag}`;
    const newText = currentText.substring(0, selStart) + wrappedSnippet + currentText.substring(selEnd);

    setRawLatexCode(newText);
    setIsDirty(true);
    pushToLatexHistory(newText);

    setTimeout(() => {
      if (editorTextareaRef.current) {
        editorTextareaRef.current.focus();
        if (selectedText) {
          // Select wrapped content inside
          const newStart = selStart + openTag.length;
          const newEnd = newStart + indentedContent.length;
          editorTextareaRef.current.setSelectionRange(newStart, newEnd);
        } else {
          // Position cursor between tags
          const newPos = selStart + openTag.length + 2;
          editorTextareaRef.current.setSelectionRange(newPos, newPos);
        }
        updateCursorStats();
      }
    }, 30);

    showToast(`Đã bọc vùng chọn trong môi trường \\begin{${envName}}!`, "success");
  };

  // Helper: Insert math snippet or symbol into editor at cursor position
  const handleInsertMathSnippet = (snippet: string, cursorOffset: number = 0) => {
    setRawLatexCode((prevText) => {
      const textarea = editorTextareaRef.current;
      const selStart = textarea ? textarea.selectionStart : prevText.length;
      const selEnd = textarea ? textarea.selectionEnd : prevText.length;

      const newText = prevText.substring(0, selStart) + snippet + prevText.substring(selEnd);

      // Reset cursor position inside snippet
      setTimeout(() => {
        if (editorTextareaRef.current) {
          editorTextareaRef.current.focus();
          const newPos = selStart + snippet.length + cursorOffset;
          editorTextareaRef.current.setSelectionRange(newPos, newPos);
          updateCursorStats();
        }
      }, 30);

      pushToLatexHistory(newText);
      return newText;
    });
    setIsDirty(true);
  };

  // Recount matches whenever search term, options or code changes
  useEffect(() => {
    if (!editorSearchTerm) {
      setEditorSearchMatches(0);
      return;
    }
    const regex = getSearchRegExp("g");
    if (!regex) {
      setEditorSearchMatches(0);
      return;
    }
    const matches = rawLatexCode.match(regex);
    setEditorSearchMatches(matches ? matches.length : 0);
  }, [editorSearchTerm, editorSearchCaseSensitive, editorSearchWholeWord, editorSearchRegex, rawLatexCode]);
  const [isWordWrap, setIsWordWrap] = useState<boolean>(true);
  const [isAutoClosePairs, setIsAutoClosePairs] = useState<boolean>(true);
  const [copiedTex, setCopiedTex] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // In-Editor Undo / Redo History Stack
  const [latexHistory, setLatexHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isHistoryActionRef = useRef<boolean>(false);
  const historyDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Push new state to history when rawLatexCode changes (debounced or on user action)
  const pushToLatexHistory = (newCode: string, debounce: boolean = false) => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }

    const doPush = (code: string) => {
      setLatexHistory((prev) => {
        const currentHistory = historyIndex >= 0 ? prev.slice(0, historyIndex + 1) : prev;
        if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1] === code) {
          return currentHistory;
        }
        const updated = [...currentHistory, code];
        if (updated.length > 50) updated.shift();
        return updated;
      });
      setHistoryIndex((prev) => {
        const nextIndex = historyIndex >= 0 ? Math.min(historyIndex + 1, 49) : 0;
        return nextIndex;
      });
    };

    if (debounce) {
      if (historyDebounceTimerRef.current) clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = setTimeout(() => {
        doPush(newCode);
      }, 600);
    } else {
      doPush(newCode);
    }
  };

  const updateCursorStats = () => {
    const ta = editorTextareaRef.current;
    if (!ta) return;
    const val = ta.value;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const textBefore = val.substring(0, selStart);
    const lines = textBefore.split("\n");
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;
    const selectedChars = Math.abs(selEnd - selStart);
    setEditorCursorInfo({
      line: currentLine,
      col: currentCol,
      selectedChars,
    });
  };

  const handleEditorUndo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex - 1;
      const targetCode = latexHistory[targetIndex];
      setHistoryIndex(targetIndex);
      setRawLatexCode(targetCode);
      setIsDirty(true);
      setTimeout(updateCursorStats, 30);
      showToast("Đã hoàn tác thao tác (Undo)", "info");
    }
  };

  const handleEditorRedo = () => {
    if (historyIndex < latexHistory.length - 1) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex + 1;
      const targetCode = latexHistory[targetIndex];
      setHistoryIndex(targetIndex);
      setRawLatexCode(targetCode);
      setIsDirty(true);
      setTimeout(updateCursorStats, 30);
      showToast("Đã làm lại thao tác (Redo)", "info");
    }
  };
  const [restoredDraftNotice, setRestoredDraftNotice] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    id: number;
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ id: Date.now(), text, type });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Warn user before leaving page if there are unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Bạn có thay đổi chưa lưu trên đề thi. Bạn có chắc chắn muốn rời đi?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
  useEffect(() => {
    if (!examId) return;
    const draft = getExamDraft(examId);
    if (draft) {
      if (draft.split_ratio) setSplitRatio(draft.split_ratio);
      if (draft.active_mode) setActiveMode(draft.active_mode);
      if (draft.active_sidebar_tab) setSidebarTab(draft.active_sidebar_tab as any);
      if (draft.unsaved_latex && draft.is_dirty) {
        setRawLatexCode(draft.unsaved_latex);
        pushToLatexHistory(draft.unsaved_latex);
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
  const [headerConfig, setHeaderConfig] = useState<any>({
    governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI",
    department_or_school: "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN",
    exam_name: "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9",
    academic_year: "Năm học: 2026 - 2027",
    subject_title: "Môn thi: TOÁN 9",
    exam_code: "ĐỀ CHÍNH THỨC",
    duration_minutes: 150,
    show_sbd_box: true,
    watermark_text: "",
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
  const [layoutKnobs, setLayoutKnobs] = useState<LayoutKnobs>({
    font_size_pt: 12,
    font_family: "times",
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
  const [lastCompileStats, setLastCompileStats] = useState<{ durationMs: number; timeStr: string } | null>(null);
  const [activePage, setActivePage] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [isDualSpreadMode, setIsDualSpreadMode] = useState<boolean>(false);
  const [isProofreadingRulerActive, setIsProofreadingRulerActive] = useState<boolean>(false);
  const [rulerTopY, setRulerTopY] = useState<number>(150);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // Auto-fit A4 page width to viewport
  const handleAutoFitWidth = () => {
    const el = canvasAreaRef.current || canvasScrollRef.current;
    if (!el) return;
    const availableWidth = el.clientWidth - 48; // padding margin
    if (availableWidth > 200) {
      const calculatedScale = Math.min(180, Math.max(50, Math.round((availableWidth / 595) * 100)));
      setZoomScale(calculatedScale);
    }
  };
  const [canvasKey, setCanvasKey] = useState<number>(Date.now());
  const [viewerMode, setViewerMode] = useState<"scroll" | "pdf" | "html">("scroll");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

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

  // Quick Question Swap in Studio
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<any[]>([]);
  const [loadingSwap, setLoadingSwap] = useState<boolean>(false);
  const [swapSearchQuery, setSwapSearchQuery] = useState<string>("");

  const handleOpenStudioSwap = async (item: any) => {
    setSwappingItemId(item.id);
    setLoadingSwap(true);
    setSwapCandidates([]);
    const snap = item.problem_snapshot || {};
    try {
      const payload: any = {
        page: 1,
        page_size: 10,
        current_question_id: snap.id || undefined,
        main_topic: snap.main_topic || undefined,
        difficulty: snap.difficulty || undefined
      };
      const res = await fetch("/api/generator/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setSwapCandidates(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải câu hỏi thay thế:", err);
    } finally {
      setLoadingSwap(false);
    }
  };

  const handleSelectStudioReplacement = async (candidate: any) => {
    if (!swappingItemId) return;
    try {
      const updatedSnapshot = {
        id: candidate.id,
        content_latex: candidate.content_latex,
        solution_latex: candidate.solution_latex,
        final_answer: candidate.final_answer,
        sub_questions: candidate.sub_questions,
        has_figure: candidate.has_figure,
        figures_meta: candidate.figures_meta,
        main_topic: candidate.main_topic,
        difficulty: candidate.difficulty
      };
      const res = await fetch(`/api/studio/items/${swappingItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_snapshot: updatedSnapshot })
      });
      if (res.ok) {
        setItems(prev => prev.map(it => it.id === swappingItemId ? { ...it, problem_snapshot: updatedSnapshot } : it));
        setSwappingItemId(null);
        compileLivePreview(
          items.map(it => it.id === swappingItemId ? { ...it, problem_snapshot: updatedSnapshot } : it),
          layoutKnobs,
          activeMode
        );
      }
    } catch (e) {
      console.error("Lỗi thay thế câu hỏi trong Studio:", e);
    }
  };

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
    mode = activeMode,
    customHeader = headerConfig
  ) => {
    const startTime = performance.now();
    setCompiling(true);
    setPreviewError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`/api/studio/exams/${examId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout_knobs: knobs,
          header_config: customHeader,
          mode: mode,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setCanvasKey(Date.now());
        const duration = Math.round(performance.now() - startTime);
        const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastCompileStats({ durationMs: duration, timeStr: timeNow });
        if (data.latex_source) {
          setRawLatexCode(data.latex_source);
          setLastSavedLatexSnapshot((prev) => prev || data.latex_source);
          pushToLatexHistory(data.latex_source);
        }
      } else {
        const errText = await res.text();
        console.warn("Preview API error, fallback to HTML DOM mode:", errText);
        setPreviewError("Máy chủ TeX đang tải. Hệ thống tự động chuyển sang bản xem trước DOM A4 trực quan.");
        const duration = Math.round(performance.now() - startTime);
        const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastCompileStats({ durationMs: duration, timeStr: timeNow });
      }
    } catch (e: any) {
      console.warn("Compile preview exception, fallback to HTML DOM mode:", e);
      setPreviewError("Không thể kết nối máy chủ TeX. Đang hiển thị bản xem trước DOM A4.");
      const duration = Math.round(performance.now() - startTime);
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastCompileStats({ durationMs: duration, timeStr: timeNow });
    } finally {
      setCompiling(false);
    }
  };

  // Compile Raw Edited LaTeX (< 0.3s)
  const handleCompileRawLatex = async () => {
    if (!rawLatexCode.trim() || compiling) return;
    const startTime = performance.now();
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
        const duration = Math.round(performance.now() - startTime);
        const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastCompileStats({ durationMs: duration, timeStr: timeNow });
        setIsDirty(false);
        setLastSavedLatexSnapshot(rawLatexCode);
        setRestoredDraftNotice(null);
        showToast("Đã biên dịch mã nguồn LaTeX thành công!", "success");
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
        const duration = Math.round(performance.now() - startTime);
        const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastCompileStats({ durationMs: duration, timeStr: timeNow });
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Lỗi kết nối biên dịch mã nguồn");
      const duration = Math.round(performance.now() - startTime);
      const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastCompileStats({ durationMs: duration, timeStr: timeNow });
    } finally {
      setCompiling(false);
    }
  };

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen state with document changes (e.g. Esc key pressed)
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      // Ctrl + F: Toggle Search in LaTeX Code Editor (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorSearchOpen((prev) => !prev);
        }
      }
      // Ctrl + /: Toggle LaTeX Line Comments % (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleToggleCommentInEditor();
        }
      }
      // Ctrl + D / Cmd + D: Toggle LaTeX Diff Inspector (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorDiffOpen((prev) => !prev);
        }
      }
      // Ctrl + Shift + A: Toggle Answer Key Matrix Inspector Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorAnswerKeyOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsEditorBookmarksOpen(false);
              setIsEditorPreflightOpen(false);
              setIsEditorHistoryDrawerOpen(false);
              setIsEditorWrapEnvOpen(false);
              setIsEditorOutlineOpen(false);
              setIsEditorSnippetsOpen(false);
              setIsEditorSymbolsOpen(false);
              setIsEditorLinterOpen(false);
              setIsEditorDiffOpen(false);
            }
            return next;
          });
        }
      }

      // Ctrl + Shift + E: Toggle LaTeX Environment Wrapper Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorWrapEnvOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsEditorSnippetsOpen(false);
              setIsEditorStatsOpen(false);
              setIsEditorLinterOpen(false);
              setIsEditorSymbolsOpen(false);
              setIsEditorBookmarksOpen(false);
              setIsEditorPreflightOpen(false);
              setIsEditorHistoryDrawerOpen(false);
            }
            return next;
          });
          return;
        }
      }

      // Ctrl + Shift + H: Toggle Undo / Redo History Snapshots Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "h") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorHistoryDrawerOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsEditorSnippetsOpen(false);
              setIsEditorStatsOpen(false);
              setIsEditorLinterOpen(false);
              setIsEditorSymbolsOpen(false);
              setIsEditorBookmarksOpen(false);
              setIsEditorPreflightOpen(false);
            }
            return next;
          });
          return;
        }
      }

      // Ctrl + Alt + P: Toggle Pedagogical Preflight QA Audit Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === "p") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorPreflightOpen((prev) => {
            const next = !prev;
            if (next) {
              if (isEditorBookmarksOpen) setIsEditorBookmarksOpen(false);
              if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
              if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
              if (isEditorStatsOpen) setIsEditorStatsOpen(false);
              if (isEditorLinterOpen) setIsEditorLinterOpen(false);
              if (isEditorSymbolsOpen) setIsEditorSymbolsOpen(false);
            }
            return next;
          });
        }
      }
      // Ctrl + B / Cmd + B: Toggle Bookmark at current cursor line (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleToggleCurrentLineBookmark();
        }
      }
      // F2 / Shift+F2: Jump to next / previous Bookmark (when on editor tab)
      if (e.key === "F2") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleJumpToBookmark(e.shiftKey ? "prev" : "next");
        }
      }
      // Ctrl + K / Cmd + K: Toggle Quick Mathematical Symbols & Greek Operators Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorSymbolsOpen((prev) => !prev);
          if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
          if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
          if (isEditorStatsOpen) setIsEditorStatsOpen(false);
          if (isEditorLinterOpen) setIsEditorLinterOpen(false);
        }
      }
      // Ctrl + L / Cmd + L: Toggle Real-time LaTeX Syntax & Environment Linter (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorLinterOpen((prev) => !prev);
          if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
          if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
          if (isEditorStatsOpen) setIsEditorStatsOpen(false);
        }
      }
      // Ctrl + I / Cmd + I: Toggle Pedagogical Document Stats & Analytics Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorStatsOpen((prev) => !prev);
          if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
          if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
        }
      }
      // Ctrl + M / Cmd + M: Toggle Pedagogical Exam Snippets & Templates Drawer (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorSnippetsOpen((prev) => !prev);
          if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
        }
      }
      // Ctrl + O / Cmd + O: Toggle LaTeX Outline Tree Navigator (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorOutlineOpen((prev) => !prev);
        }
      }
      // Shift + Alt + Down: Duplicate Lines Down in Editor (when on editor tab)
      if (e.shiftKey && e.altKey && e.key === "ArrowDown") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleDuplicateLinesInEditor("down");
        }
      }
      // Shift + Alt + Up: Duplicate Lines Up in Editor (when on editor tab)
      if (e.shiftKey && e.altKey && e.key === "ArrowUp") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleDuplicateLinesInEditor("up");
        }
      }
      // Alt + ArrowUp: Move Lines Up (when on editor tab)
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.key === "ArrowUp") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleMoveLinesInEditor("up");
        }
      }
      // Alt + ArrowDown: Move Lines Down (when on editor tab)
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.key === "ArrowDown") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleMoveLinesInEditor("down");
        }
      }
      // Ctrl + Alt + F / Shift + Alt + F: Format LaTeX Code (when on editor tab)
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && e.altKey && e.key.toLowerCase() === "f") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleFormatLatexCode();
        }
      }
      // Ctrl + G: Go to line in LaTeX Code Editor (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorGotoLineOpen((prev) => !prev);
          setIsEditorSearchOpen(false);
        }
      }
      // Ctrl + H: Toggle Replace in LaTeX Code Editor (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          setIsEditorSearchOpen(true);
          setIsEditorReplaceMode(true);
        }
      }
      // Ctrl + Z: Undo in LaTeX Code Editor (when on editor tab)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleEditorUndo();
        }
      }
      // Ctrl + Y or Ctrl + Shift + Z: Redo in LaTeX Code Editor (when on editor tab)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (sidebarTab === "editor") {
          e.preventDefault();
          handleEditorRedo();
        }
      }
      // Ctrl + '+' / '=': Zoom in preview canvas
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoomScale((prev) => Math.min(180, prev + 10));
      }
      // Ctrl + '-': Zoom out preview canvas
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoomScale((prev) => Math.max(50, prev - 10));
      }
      // Ctrl + '0': Reset zoom to 100%
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoomScale(100);
      }
      if (e.key === "Escape") {
        setShowShortcutsModal(false);
        setIsSettingsOpen(false);
        setSwappingItemId(null);
        setIsEditorSnippetsOpen(false);
        setIsEditorStatsOpen(false);
        setIsEditorLinterOpen(false);
        setIsEditorSymbolsOpen(false);
        setIsEditorBookmarksOpen(false);
        setIsEditorPreflightOpen(false);
        setIsEditorHistoryDrawerOpen(false);
        setIsEditorWrapEnvOpen(false);
        setIsEditorAnswerKeyOpen(false);
        setIsEditorOutlineOpen(false);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Chỉ kích hoạt khi không gõ trong input/textarea
        const target = e.target as HTMLElement;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarTab, rawLatexCode, activeMode, compiling]);

  // Sắp xếp tự động chuẩn sư phạm (Độ khó tăng dần: NB -> TH -> VD -> VDC hoặc theo Điểm số)
  const autoReorderPedagogical = async (strategy: "difficulty" | "points") => {
    if (items.length <= 1) return;

    const diffWeight: Record<string, number> = {
      NB: 1,
      TH: 2,
      VD: 3,
      VDC: 4,
    };

    const sorted = [...items].sort((a, b) => {
      if (strategy === "points") {
        const ptA = parseFloat(a.max_points) || 0;
        const ptB = parseFloat(b.max_points) || 0;
        return ptA - ptB;
      } else {
        const snapA = a.problem_snapshot || {};
        const snapB = b.problem_snapshot || {};
        const diffA = diffWeight[snapA.cognitive_level || snapA.difficulty] || 2;
        const diffB = diffWeight[snapB.cognitive_level || snapB.difficulty] || 2;
        return diffA - diffB;
      }
    });

    const payload = sorted.map((it, idx) => ({
      item_id: it.id,
      order_index: idx,
    }));

    const updatedItems = sorted.map((it, idx) => ({
      ...it,
      order_index: idx,
      display_label: `Câu ${idx + 1}`,
    }));

    setItems(updatedItems);
    compileLivePreview(updatedItems, layoutKnobs, activeMode, headerConfig);

    try {
      await fetch(`/api/studio/exams/${examId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_orders: payload }),
      });
    } catch (e) {
      console.error("Auto reorder error:", e);
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

  // Switch Mode (Exam vs Rubric vs OMR Answer Sheet)
  const handleModeSwitch = async (mode: "EXAM" | "RUBRIC" | "OMR") => {
    setActiveMode(mode);
    if (mode === "OMR") {
      setViewerMode("html");
      return;
    }
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

  const [isExporting, setIsExporting] = useState<"docx" | "pdf" | null>(null);

  // Direct Download File (Option B - Native TeX Live PDF)
  const handleDownload = async (fmt: "docx" | "pdf") => {
    if (isExporting) return;
    setIsExporting(fmt);
    try {
      const downloadUrl = `/api/generator/exams/${examId}/download?format=${fmt}&mode=${activeMode}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Tải file thất bại (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const extension = fmt === "docx" ? "docx" : "pdf";
      const cleanTitle = (headerConfig.exam_name || "de_thi").replace(/[/\\?%*:|"<>]/g, "_");
      link.download = `${cleanTitle}_${activeMode.toLowerCase()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast(
        fmt === "docx"
          ? "Đã tạo và tải file Word OMML thành công!"
          : "Đã xuất bản in PDF TeX Live thành công!",
        "success"
      );
    } catch (err: any) {
      alert(`Không thể tải tệp: ${err.message || "Lỗi hệ thống"}`);
    } finally {
      setIsExporting(null);
    }
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

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. TOPBAR - LIGHT ACADEMIC THEME (TRẮNG NGÀ CHUẨN MỰC) */}
      <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shadow-sm shrink-0 z-30">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={() => {
                if (isDirty) {
                  if (window.confirm("Bạn có thay đổi chưa lưu trên đề thi. Bạn có chắc chắn muốn quay lại?")) {
                    onBack();
                  }
                } else {
                  onBack();
                }
              }}
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
            {isDirty ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 flex items-center space-x-1" title="Có thay đổi chưa biên dịch / lưu (Bấm Ctrl+S để lưu)">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Chưa lưu</span>
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center space-x-1" title="Đã đồng bộ và biên dịch hoàn tất">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Đã lưu</span>
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
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
            <button
              onClick={() => handleModeSwitch("OMR")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeMode === "OMR"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Phiếu Tô Trắc Nghiệm OMR</span>
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
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            title="Cài đặt tiêu đề trường học và căn lề A4 chuẩn sư phạm"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cài Đặt Đề</span>
          </button>
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
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setIsVariantsModalOpen(true)}
              className="px-2.5 py-1 text-slate-700 hover:bg-white hover:text-purple-700 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
              title="Tạo nhiều mã đề thi hoán vị câu hỏi & đáp án (101, 102, 103, 104...)"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-600" />
              <span>Trộn Đề</span>
            </button>
            <button
              onClick={() => setIsExportPackageModalOpen(true)}
              className="px-2.5 py-1 text-slate-700 hover:bg-white hover:text-indigo-700 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
              title="Xuất trọn gói hồ sơ đề thi (Word OMML, PDF in ấn, Đáp án & Bàn giao)"
            >
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gói Khảo Thí</span>
            </button>
            <button
              onClick={() => handleDownload("docx")}
              disabled={isExporting !== null}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
                isExporting === "docx"
                  ? "bg-blue-100 text-blue-700 cursor-wait"
                  : "text-slate-700 hover:bg-white hover:text-indigo-700"
              }`}
              title="Xuất file Word OMML chuẩn Bộ GD&ĐT (không vỡ bảng, sửa công thức tự nhiên)"
            >
              <Download className={`w-3.5 h-3.5 text-blue-600 ${isExporting === "docx" ? "animate-bounce" : ""}`} />
              <span>{isExporting === "docx" ? "Đang xuất..." : "Word"}</span>
            </button>
            <button
              onClick={() => handleDownload("pdf")}
              disabled={isExporting !== null}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
                isExporting === "pdf"
                  ? "bg-rose-100 text-rose-700 cursor-wait"
                  : "text-slate-700 hover:bg-white hover:text-rose-700"
              }`}
              title="Tải bản in PDF TeX Live gốc"
            >
              <Download className={`w-3.5 h-3.5 text-rose-600 ${isExporting === "pdf" ? "animate-bounce" : ""}`} />
              <span>{isExporting === "pdf" ? "Đang tạo..." : "PDF In"}</span>
            </button>
            <button
              onClick={() => setIsPrintConfigModalOpen(true)}
              className="px-2.5 py-1 text-slate-700 hover:bg-white hover:text-emerald-700 text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
              title="Cấu hình thiết lập in A4 sư phạm & In trực tiếp (Ctrl + P)"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={() => setIsTimingBudgetModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Phân bổ ngân sách thời gian làm bài & Đánh giá sư phạm (Timing Budget)"
            >
              <Timer className="w-3.5 h-3.5 text-indigo-600" />
            </button>
            <button
              onClick={() => setIsFormulaCheatSheetOpen(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Sổ tay tra cứu công thức LaTeX Toán học (Cheat Sheet)"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
            </button>
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="Hướng dẫn phím tắt bàn phím (Bấm ?)"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-lg transition-colors border ${
                isFullscreen
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "text-slate-500 hover:text-indigo-600 hover:bg-white border-transparent hover:border-slate-200"
              }`}
              title={isFullscreen ? "Thoát toàn màn hình (Esc / F11)" : "Toàn màn hình Studio (F11)"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION FLOATING PILL */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl shadow-lg border backdrop-blur-md text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-900/90 text-white border-emerald-700/50 shadow-emerald-950/20"
                : toastMessage.type === "info"
                ? "bg-sky-900/90 text-white border-sky-700/50 shadow-sky-950/20"
                : "bg-amber-900/90 text-white border-amber-700/50 shadow-amber-950/20"
            }`}
          >
            {toastMessage.type === "success" && <Check className="w-4 h-4 text-emerald-300 shrink-0" />}
            {toastMessage.type === "info" && <Info className="w-4 h-4 text-sky-300 shrink-0" />}
            {toastMessage.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
        {/* LEFT WORKSTATION (WIDTH: splitRatio% or COLLAPSED) */}
        {!isEditorCollapsed && (
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
                onClick={() => setSidebarTab("matrix")}
                className={`h-full px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-all ${
                  sidebarTab === "matrix"
                    ? "border-indigo-600 text-indigo-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Ma Trận & Phổ Điểm</span>
              </button>
            </div>

            {/* Split Presets & Collapse Toggle */}
            <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
              <button
                onClick={() => setIsEditorCollapsed(true)}
                className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-600 font-sans flex items-center space-x-1 border border-slate-200"
                title="Thu gọn Sidebar để toàn màn hình bản in A4"
              >
                <PanelLeftClose className="w-3 h-3 text-slate-600" />
                <span className="text-[10px]">Thu gọn</span>
              </button>
              <button
                onClick={() => {
                  setIsEditorCollapsed(false);
                  setSplitRatio(30);
                }}
                className={`px-1.5 py-0.5 rounded ${
                  !isEditorCollapsed && splitRatio <= 35 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
                }`}
                title="Thu nhỏ Editor 30%"
              >
                30%
              </button>
              <button
                onClick={() => {
                  setIsEditorCollapsed(false);
                  setSplitRatio(50);
                }}
                className={`px-1.5 py-0.5 rounded ${
                  !isEditorCollapsed && splitRatio >= 45 && splitRatio <= 55 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
                }`}
                title="Chia đôi 50/50"
              >
                50%
              </button>
              <button
                onClick={() => {
                  setIsEditorCollapsed(false);
                  setSplitRatio(70);
                }}
                className={`px-1.5 py-0.5 rounded ${
                  !isEditorCollapsed && splitRatio >= 65 ? "bg-slate-200 text-slate-800 font-bold" : "hover:text-slate-700"
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
                  {/* Pedagogical Preflight QA Audit Button */}
                  <button
                    onClick={() => {
                      setIsEditorPreflightOpen((prev) => !prev);
                      if (isEditorBookmarksOpen) setIsEditorBookmarksOpen(false);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                      if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                      if (isEditorLinterOpen) setIsEditorLinterOpen(false);
                      if (isEditorSymbolsOpen) setIsEditorSymbolsOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorPreflightOpen
                        ? "bg-purple-100 text-purple-900 border-purple-300 font-semibold"
                        : examPreflightAudit.isReadyForPrint
                        ? "hover:bg-slate-100 text-purple-700 border-purple-200 bg-purple-50/50"
                        : "hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                    title="Kiểm định chất lượng xuất bản & Sư phạm BGD 2025 (Ctrl+Alt+P / Preflight QA)"
                  >
                    <CheckSquare className="w-3 h-3 text-purple-600" />
                    <span>Nghiệm thu: {examPreflightAudit.score}%</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        examPreflightAudit.isReadyForPrint
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      }`}
                    />
                  </button>

                  {/* Editor Bookmarks Quick Manager Button */}
                  <div className="flex items-center rounded border border-slate-200 bg-slate-100 p-0.5 space-x-0.5">
                    <button
                      onClick={handleToggleCurrentLineBookmark}
                      className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                      title="Đánh dấu / Gỡ Bookmark tại dòng hiện tại (Ctrl+B / Cmd+B)"
                    >
                      {editorBookmarks.length > 0 ? (
                        <BookmarkCheck className="w-3 h-3 text-sky-600" />
                      ) : (
                        <BookmarkPlus className="w-3 h-3 text-slate-500" />
                      )}
                      <span>Bookmark ({editorBookmarks.length})</span>
                    </button>
                    {editorBookmarks.length > 0 && (
                      <>
                        <button
                          onClick={() => handleJumpToBookmark("prev")}
                          className="px-1 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                          title="Nhảy đến Bookmark trước đó (Shift+F2)"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleJumpToBookmark("next")}
                          className="px-1 py-0.5 rounded hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                          title="Nhảy đến Bookmark kế tiếp (F2)"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => {
                            setIsEditorBookmarksOpen((prev) => !prev);
                            if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                            if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                            if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                            if (isEditorLinterOpen) setIsEditorLinterOpen(false);
                            if (isEditorSymbolsOpen) setIsEditorSymbolsOpen(false);
                          }}
                          className={`px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            isEditorBookmarksOpen
                              ? "bg-sky-200 text-sky-900 font-bold"
                              : "hover:bg-slate-200 text-slate-600"
                          }`}
                          title="Danh sách tất cả Bookmark"
                        >
                          Xem
                        </button>
                      </>
                    )}
                  </div>

                  {/* Quick Mathematical Symbols & Greek Operators Palette Button */}
                  <button
                    onClick={() => {
                      setIsEditorSymbolsOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                      if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                      if (isEditorLinterOpen) setIsEditorLinterOpen(false);
                      if (isEditorWrapEnvOpen) setIsEditorWrapEnvOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorSymbolsOpen
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    }`}
                    title="Bảng ký tự toán học & ký hiệu Hy Lạp chèn nhanh (Ctrl+K / Cmd+K)"
                  >
                    <Binary className="w-3 h-3 text-indigo-600" />
                    <span>Ký hiệu toán (Ω)</span>
                  </button>

                  {/* Quick LaTeX Environment Wrapper Button */}
                  <button
                    onClick={() => {
                      setIsEditorWrapEnvOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                      if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                      if (isEditorLinterOpen) setIsEditorLinterOpen(false);
                      if (isEditorSymbolsOpen) setIsEditorSymbolsOpen(false);
                      if (isEditorBookmarksOpen) setIsEditorBookmarksOpen(false);
                      if (isEditorPreflightOpen) setIsEditorPreflightOpen(false);
                      if (isEditorHistoryDrawerOpen) setIsEditorHistoryDrawerOpen(false);
                      if (isEditorAnswerKeyOpen) setIsEditorAnswerKeyOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorWrapEnvOpen
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    }`}
                    title="Bọc vùng chọn trong môi trường LaTeX (\\begin{env}...\\end{env}) (Ctrl+Shift+E)"
                  >
                    <Boxes className="w-3 h-3 text-emerald-600" />
                    <span>Bọc môi trường (Env)</span>
                  </button>

                  {/* Answer Key Matrix Inspector Button */}
                  <button
                    onClick={() => {
                      setIsEditorAnswerKeyOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                      if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                      if (isEditorLinterOpen) setIsEditorLinterOpen(false);
                      if (isEditorSymbolsOpen) setIsEditorSymbolsOpen(false);
                      if (isEditorBookmarksOpen) setIsEditorBookmarksOpen(false);
                      if (isEditorPreflightOpen) setIsEditorPreflightOpen(false);
                      if (isEditorHistoryDrawerOpen) setIsEditorHistoryDrawerOpen(false);
                      if (isEditorWrapEnvOpen) setIsEditorWrapEnvOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorAnswerKeyOpen
                        ? "border-teal-400 bg-teal-50 text-teal-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    }`}
                    title="Trích xuất ma trận đáp án đúng và lời giải câu hỏi (Ctrl+Shift+A)"
                  >
                    <CheckCircle className="w-3 h-3 text-teal-600" />
                    <span>Ma trận đáp án</span>
                  </button>

                  {/* Real-time LaTeX Syntax & Environment Linter Drawer Button */}
                  <button
                    onClick={() => {
                      setIsEditorLinterOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                      if (isEditorStatsOpen) setIsEditorStatsOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorLinterOpen
                        ? "border-rose-300 bg-rose-50 text-rose-800 font-semibold"
                        : examLatexDiagnostics.length > 0
                        ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Kiểm tra cú pháp & tính toàn vẹn môi trường LaTeX thời gian thực (Ctrl+L / Cmd+L)"
                  >
                    {examLatexDiagnostics.length > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>Cú pháp ({examLatexDiagnostics.length} cảnh báo)</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Cú pháp: Chuẩn</span>
                      </>
                    )}
                  </button>

                  {/* Pedagogical Document Analytics & Stats Drawer Button */}
                  <button
                    onClick={() => {
                      setIsEditorStatsOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                      if (isEditorSnippetsOpen) setIsEditorSnippetsOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorStatsOpen
                        ? "border-teal-300 bg-teal-50 text-teal-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Phân tích định lượng sư phạm: số câu, trắc nghiệm, đồ thị TikZ, thời gian làm bài (Ctrl+I / Cmd+I)"
                  >
                    <BarChart3 className="w-3 h-3 text-teal-600" />
                    <span>Thống kê ({examPedagogicalStats.totalQuestions} câu)</span>
                  </button>

                  {/* Exam Snippets & Template Blocks Drawer Button */}
                  <button
                    onClick={() => {
                      setIsEditorSnippetsOpen((prev) => !prev);
                      if (isEditorOutlineOpen) setIsEditorOutlineOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorSnippetsOpen
                        ? "border-amber-300 bg-amber-50 text-amber-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Mở thư viện mẫu đề thi khảo thí & khối LaTeX sư phạm (Ctrl+M / Cmd+M)"
                  >
                    <LayoutTemplate className="w-3 h-3 text-amber-600" />
                    <span>Mẫu đề ({PEDAGOGICAL_SNIPPET_TEMPLATES.length})</span>
                  </button>

                  {/* Outline Tree Navigator */}
                  <button
                    onClick={() => setIsEditorOutlineOpen((prev) => !prev)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorOutlineOpen
                        ? "border-sky-300 bg-sky-50 text-sky-800 font-semibold"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Cây cấu trúc đề thi & định hướng nhanh các phần/câu hỏi (Outline Navigator)"
                  >
                    <ListTree className="w-3 h-3 text-sky-600" />
                    <span>Mục lục ({extractLatexOutline().length})</span>
                  </button>

                  {/* Compare Diff */}
                  <button
                    onClick={() => setIsEditorDiffOpen(true)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isDirty
                        ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold animate-pulse"
                        : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="So sánh thay đổi với bản lưu/biên dịch gần nhất (Diff Inspector)"
                  >
                    <GitCompare className="w-3 h-3 text-indigo-600" />
                    <span>So sánh {isDirty ? "(Có sửa)" : ""}</span>
                  </button>

                  {/* Toggle Comment */}
                  <button
                    onClick={handleToggleCommentInEditor}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Bật / Tắt chú thích dòng % (Ctrl+/)"
                  >
                    <MessageSquareCode className="w-3 h-3 text-emerald-600" />
                    <span>Chú thích</span>
                  </button>

                  {/* Format LaTeX Code */}
                  <button
                    onClick={handleFormatLatexCode}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Định dạng và căn lề thụt đầu dòng chuẩn mã LaTeX (Ctrl+Alt+F)"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Định dạng</span>
                  </button>

                  {/* Duplicate Line Down */}
                  <button
                    onClick={() => handleDuplicateLinesInEditor("down")}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Nhân đôi dòng hiện tại hoặc khối đang chọn xuống dưới (Shift+Alt+Down)"
                  >
                    <CopyPlus className="w-3 h-3 text-purple-600" />
                    <span>Nhân đôi</span>
                  </button>

                  {/* Move Line Up / Down */}
                  <div className="flex items-center space-x-0.5 bg-slate-100 rounded border border-slate-200 p-0.5">
                    <button
                      onClick={() => handleMoveLinesInEditor("up")}
                      className="p-0.5 hover:bg-white rounded text-slate-700 transition-colors"
                      title="Dịch dòng lên trên (Alt+Up)"
                    >
                      <ArrowUp className="w-3 h-3 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleMoveLinesInEditor("down")}
                      className="p-0.5 hover:bg-white rounded text-slate-700 transition-colors"
                      title="Dịch dòng xuống dưới (Alt+Down)"
                    >
                      <ArrowDown className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>

                  {/* Go to Line Toggle */}
                  <button
                    onClick={() => {
                      setIsEditorGotoLineOpen(!isEditorGotoLineOpen);
                      setIsEditorSearchOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorGotoLineOpen
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                    }`}
                    title="Nhảy đến dòng chỉ định trong mã nguồn LaTeX (Ctrl+G)"
                  >
                    <Hash className="w-3 h-3 text-slate-500" />
                    <span>Dòng (Ctrl+G)</span>
                  </button>

                  {/* Find in Code Toggle */}
                  <button
                    onClick={() => setIsEditorSearchOpen(!isEditorSearchOpen)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                      isEditorSearchOpen
                        ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                    }`}
                    title="Tìm kiếm từ khóa trong mã nguồn LaTeX (Ctrl+F)"
                  >
                    <Search className="w-3 h-3 text-slate-500" />
                    <span>Tìm (Ctrl+F)</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!rawLatexCode) return;
                      try {
                        await navigator.clipboard.writeText(rawLatexCode);
                      } catch (_) {
                        // Fallback textarea copy for headless / restricted environments
                        const ta = document.createElement("textarea");
                        ta.value = rawLatexCode;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.focus();
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                      }
                      setCopiedTex(true);
                      showToast("Đã sao chép toàn bộ mã nguồn LaTeX vào bộ nhớ tạm!", "info");
                      setTimeout(() => setCopiedTex(false), 2000);
                    }}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                    title="Sao chép toàn bộ mã nguồn LaTeX vào bộ nhớ tạm"
                  >
                    {copiedTex ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Sao chép TeX</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!rawLatexCode) return;
                      const blob = new Blob([rawLatexCode], { type: "text/plain;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = `${headerConfig.exam_name || "de_thi"}.tex`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      showToast("Đã tải tệp .tex mã nguồn thành công!", "success");
                    }}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                    title="Tải tập tin nguồn .tex về máy để mở bằng Overleaf / TeXStudio"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>Tải .tex</span>
                  </button>

                  <span className="text-slate-300">|</span>

                  {/* Font size adjustments */}
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-1 space-x-1" title="Cỡ chữ soạn thảo LaTeX">
                    <button
                      onClick={() => setEditorFontSize((prev) => Math.max(10, prev - 1))}
                      className="px-1 text-slate-600 hover:text-slate-900 font-bold hover:bg-white rounded"
                    >
                      -
                    </button>
                    <span className="font-mono text-[10px] text-slate-700 font-bold min-w-[24px] text-center">{editorFontSize}pt</span>
                    <button
                      onClick={() => setEditorFontSize((prev) => Math.min(20, prev + 1))}
                      className="px-1 text-slate-600 hover:text-slate-900 font-bold hover:bg-white rounded"
                    >
                      +
                    </button>
                  </div>

                  {/* Word wrap toggle */}
                  <button
                    onClick={() => setIsWordWrap(!isWordWrap)}
                    className={`px-2 py-0.5 rounded border transition-colors text-[10px] font-medium ${
                      isWordWrap
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="Bật/Tắt ngắt dòng tự động (Word Wrap)"
                  >
                    {isWordWrap ? "Wrap: Bật" : "Wrap: Tắt"}
                  </button>

                  {/* Auto Close Bracket Pairs toggle */}
                  <button
                    onClick={() => {
                      setIsAutoClosePairs(!isAutoClosePairs);
                      showToast(!isAutoClosePairs ? "Đã bật tự động đóng ngoặc và bọc cặp ký tự" : "Đã tắt tự động đóng ngoặc", "info");
                    }}
                    className={`px-2 py-0.5 rounded border transition-colors text-[10px] font-medium ${
                      isAutoClosePairs
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="Tự động đóng cặp ngoặc {}, [], (), $$, và bọc khối chọn khi gõ ký tự mở"
                  >
                    {isAutoClosePairs ? "Tự đóng ngoặc: Bật" : "Tự đóng ngoặc: Tắt"}
                  </button>

                  <span className="text-slate-300">|</span>

                  {/* Undo / Redo Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleEditorUndo}
                      disabled={historyIndex <= 0}
                      className={`p-1 rounded border transition-colors ${
                        historyIndex > 0
                          ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-600 shadow-2xs"
                          : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                      title="Hoàn tác (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleEditorRedo}
                      disabled={historyIndex >= latexHistory.length - 1}
                      className={`p-1 rounded border transition-colors ${
                        historyIndex < latexHistory.length - 1
                          ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-600 shadow-2xs"
                          : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                      title="Làm lại (Ctrl+Y / Ctrl+Shift+Z)"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </button>
                    {/* History Snapshots Drawer Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditorHistoryDrawerOpen(!isEditorHistoryDrawerOpen);
                        if (!isEditorHistoryDrawerOpen) {
                          setIsEditorSnippetsOpen(false);
                          setIsEditorStatsOpen(false);
                          setIsEditorLinterOpen(false);
                          setIsEditorSymbolsOpen(false);
                          setIsEditorBookmarksOpen(false);
                          setIsEditorPreflightOpen(false);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-medium flex items-center space-x-1 transition-colors ${
                        isEditorHistoryDrawerOpen
                          ? "bg-amber-100 border-amber-300 text-amber-800 font-bold"
                          : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-700 shadow-2xs"
                      }`}
                      title="Xem toàn bộ lịch sử hoàn tác & các mốc snapshot (Ctrl+Shift+H)"
                    >
                      <History className="w-3 h-3 text-amber-600" />
                      <span>Lịch sử ({latexHistory.length > 0 ? historyIndex + 1 : 0}/{latexHistory.length})</span>
                    </button>
                  </div>

                  <span className="text-slate-300">|</span>
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

              {/* Undo / Redo History Snapshots Drawer */}
              {isEditorHistoryDrawerOpen && (
                <div className="bg-amber-50/95 border-b border-amber-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <History className="w-4 h-4 text-amber-700" />
                      <span className="font-semibold text-amber-950 text-xs">
                        Lịch Sử Hoàn Tác & Cột Mốc Soạn Thảo (Undo / Redo Timeline)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {latexHistory.length} mốc lưu trữ
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsEditorHistoryDrawerOpen(false)}
                        className="text-amber-800 hover:text-amber-950 p-0.5 rounded hover:bg-amber-200/60"
                        title="Đóng bảng lịch sử"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {latexHistory.length === 0 ? (
                    <div className="py-3 text-center text-slate-500 italic">
                      Chưa có mốc lịch sử nào được ghi lại.
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {latexHistory.map((snapshotText, idx) => {
                        const isCurrent = idx === historyIndex;
                        const lineCount = snapshotText.split("\n").length;
                        const charCount = snapshotText.length;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setHistoryIndex(idx);
                              setRawLatexCode(snapshotText);
                              showToast(`Đã phục hồi về phiên bản mốc #${idx + 1}`, "info");
                            }}
                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                              isCurrent
                                ? "bg-amber-100/90 border-amber-400 text-amber-900 shadow-2xs font-medium"
                                : "bg-white hover:bg-amber-50/70 border-slate-200 text-slate-700 hover:border-amber-200"
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-mono font-bold ${
                                  isCurrent ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-semibold text-xs">
                                  {idx === 0
                                    ? "Bản ghi khởi tạo ban đầu"
                                    : idx === latexHistory.length - 1
                                    ? "Phiên bản mới nhất hiện tại"
                                    : `Cột mốc chỉnh sửa #${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2">
                                  {lineCount} dòng • {charCount} ký tự
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                                  Đang chọn
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-amber-200 text-slate-700 hover:text-amber-900 border border-slate-200"
                                >
                                  Phục hồi mốc này
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pedagogical Preflight QA Audit Drawer */}
              {isEditorPreflightOpen && (
                <div className="bg-purple-50/95 border-b border-purple-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-4 h-4 text-purple-700" />
                      <span className="font-semibold text-purple-950 text-xs">
                        Bảng Nghiệm Thu Sư Phạm & Tiêu Chuẩn Xuất Bản BGD 2025 (Preflight QA)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          examPreflightAudit.isReadyForPrint
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {examPreflightAudit.score}% — {examPreflightAudit.isReadyForPrint ? "Đạt chuẩn xuất bản" : "Cần hoàn thiện"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-purple-800">
                        {examPreflightAudit.totalPassed}/{examPreflightAudit.totalChecks} tiêu chí đạt
                      </span>
                      <button
                        onClick={() => setIsEditorPreflightOpen(false)}
                        className="text-purple-700 hover:text-purple-900 px-1.5 py-0.5 rounded hover:bg-purple-100 font-bold text-xs"
                        title="Đóng bảng nghiệm thu (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {examPreflightAudit.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border flex flex-col justify-between transition-all ${
                          item.passed
                            ? "bg-white border-emerald-200 text-slate-700"
                            : item.severity === "critical"
                            ? "bg-rose-50 border-rose-300 text-rose-900"
                            : item.severity === "recommended"
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between space-x-1.5 mb-1">
                          <span className="font-medium text-xs leading-snug">
                            {item.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                              item.passed
                                ? "bg-emerald-100 text-emerald-700"
                                : item.severity === "critical"
                                ? "bg-rose-200 text-rose-800 font-mono"
                                : "bg-amber-200 text-amber-800 font-mono"
                            }`}
                          >
                            {item.passed ? "✓ ĐẠT" : item.severity === "critical" ? "✕ BẮT BUỘC" : "! KHUYÊN DÙNG"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Bookmarks List Drawer */}
              {isEditorBookmarksOpen && (
                <div className="bg-sky-50/95 border-b border-sky-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <BookmarkCheck className="w-4 h-4 text-sky-700" />
                      <span className="font-semibold text-sky-950 text-xs">
                        Danh Sách Dấu Trang Đã Đánh Dấu (Editor Bookmarks)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-200 text-sky-900">
                        {editorBookmarks.length} vị trí
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditorBookmarks([]);
                          setIsEditorBookmarksOpen(false);
                          showToast("Đã xóa toàn bộ dấu trang (Bookmarks)", "info");
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium hover:underline"
                      >
                        Xóa tất cả
                      </button>
                      <button
                        onClick={() => setIsEditorBookmarksOpen(false)}
                        className="text-sky-700 hover:text-sky-900 px-1.5 py-0.5 rounded hover:bg-sky-100 font-bold text-xs"
                        title="Đóng danh sách dấu trang (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                    {editorBookmarks.map((lineNum) => {
                      const allLines = (rawLatexCode || "").split("\n");
                      const snippet = (allLines[lineNum - 1] || "").trim();
                      return (
                        <button
                          key={`bm-${lineNum}`}
                          onClick={() => {
                            handleGotoLineInEditor(lineNum);
                            showToast(`Đã chuyển đến Bookmark Dòng ${lineNum}`, "info");
                          }}
                          className="flex items-center space-x-2 px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-200 hover:border-sky-400 rounded transition-all shadow-sm group text-left max-w-xs"
                          title={`Bấm để nhảy đến dòng ${lineNum}: ${snippet}`}
                        >
                          <span className="font-mono font-bold text-sky-800 text-xs bg-sky-100 group-hover:bg-sky-200 px-1.5 py-0.5 rounded">
                            Dòng {lineNum}
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 truncate max-w-[160px]">
                            {snippet || "(Dòng trống)"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Mathematical Symbols & Greek Operators Drawer */}
              {isEditorSymbolsOpen && (
                <div className="bg-indigo-50/95 border-b border-indigo-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <Binary className="w-4 h-4 text-indigo-700" />
                      <span className="font-semibold text-indigo-950 text-xs">
                        Bảng Ký Tự Toán Học & Ký Hiệu Hy Lạp Chèn Nhanh (Math & Greek Palette)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-200 text-indigo-900">
                        {QUICK_MATH_SYMBOLS.length} ký hiệu
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditorSymbolsOpen(false)}
                      className="text-indigo-700 hover:text-indigo-900 px-1.5 py-0.5 rounded hover:bg-indigo-100 font-bold text-xs"
                      title="Đóng bảng ký hiệu (Esc)"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {QUICK_MATH_SYMBOLS.map((item, idx) => (
                      <button
                        key={`${item.latex}-${idx}`}
                        onClick={() => {
                          const ta = editorTextareaRef.current;
                          if (ta) {
                            const start = ta.selectionStart;
                            const end = ta.selectionEnd;
                            const currentVal = ta.value;
                            const insertion = item.latex + " ";
                            const newVal = currentVal.substring(0, start) + insertion + currentVal.substring(end);
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                              window.HTMLTextAreaElement.prototype,
                              "value"
                            )?.set;
                            if (nativeInputValueSetter) {
                              nativeInputValueSetter.call(ta, newVal);
                            } else {
                              ta.value = newVal;
                            }
                            ta.dispatchEvent(new Event("input", { bubbles: true }));
                            ta.focus();
                            const newCursorPos = start + insertion.length;
                            ta.setSelectionRange(newCursorPos, newCursorPos);
                            updateCursorStats();
                          }
                        }}
                        className="flex items-center space-x-1.5 px-2 py-1 bg-white hover:bg-indigo-100/80 border border-indigo-200 hover:border-indigo-400 rounded transition-all shadow-sm group text-left"
                        title={`${item.name} (${item.latex}) - Bấm để chèn`}
                      >
                        <span className="font-bold text-indigo-900 text-sm group-hover:scale-110 transition-transform inline-block w-4 text-center">
                          {item.symbol}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 group-hover:text-indigo-800">
                          {item.latex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LaTeX Environment Wrapper Drawer */}
              {isEditorWrapEnvOpen && (
                <div className="bg-emerald-50/95 border-b border-emerald-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <Boxes className="w-4 h-4 text-emerald-700" />
                      <span className="font-semibold text-emerald-950 text-xs">
                        Bọc Vùng Chọn Trong Môi Trường LaTeX (\begin&#123;env&#125; ... \end&#123;env&#125;)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900">
                        {LATEX_ENV_TEMPLATES.length} môi trường
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditorWrapEnvOpen(false)}
                      className="text-emerald-700 hover:text-emerald-900 px-1.5 py-0.5 rounded hover:bg-emerald-100 font-bold text-xs"
                      title="Đóng bảng bọc môi trường (Esc)"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {LATEX_ENV_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.name}
                        onClick={() => handleWrapSelectionWithEnv(tpl.name, tpl.param)}
                        className="flex items-start space-x-2 p-2 bg-white hover:bg-emerald-100/80 border border-emerald-200 hover:border-emerald-400 rounded transition-all shadow-sm group text-left"
                        title={`Bọc vùng chọn trong \\begin{${tpl.name}}...\\end{${tpl.name}}`}
                      >
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px] rounded shrink-0 group-hover:bg-emerald-200">
                          {tpl.iconText}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-emerald-950 text-xs truncate">
                            {tpl.label}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {tpl.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Key Matrix Inspector Drawer */}
              {isEditorAnswerKeyOpen && (
                <div className="bg-teal-50/95 border-b border-teal-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-teal-700" />
                      <span className="font-semibold text-teal-950 text-xs">
                        Ma Trận Đáp Án Đúng & Lời Giải Câu Hỏi (Answer Key Matrix Inspector)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-200 text-teal-900">
                        {examAnswerKeyMatrix.length} câu hỏi
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const csvHeader = "Câu,Dạng câu,Đáp án,Có lời giải\n";
                          const csvRows = examAnswerKeyMatrix.map(
                            (item) => `${item.questionNumber},"${item.answerType}","${item.correctAnswer}","${item.hasSolution ? "Có" : "Không"}"`
                          ).join("\n");
                          const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `Ma_tran_dap_an_${(headerConfig?.exam_name || "de_thi").replace(/[/\\?%*:|"<>]/g, "_")}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showToast("Đã xuất ma trận đáp án dạng CSV!", "success");
                        }}
                        className="px-2 py-0.5 bg-white border border-teal-300 hover:bg-teal-100/60 text-teal-800 rounded text-[11px] font-bold flex items-center space-x-1"
                        title="Tải bảng đáp án dạng CSV"
                      >
                        <Download className="w-3 h-3 text-teal-600" />
                        <span>Xuất CSV</span>
                      </button>
                      <button
                        onClick={() => setIsEditorAnswerKeyOpen(false)}
                        className="text-teal-700 hover:text-teal-900 px-1.5 py-0.5 rounded hover:bg-teal-100 font-bold text-xs"
                        title="Đóng ma trận đáp án (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {examAnswerKeyMatrix.length === 0 ? (
                    <div className="p-3 bg-white/90 border border-teal-200 rounded text-center text-teal-800 text-xs">
                      Không tìm thấy câu hỏi nào dạng \begin{'{ex}'}...\end{'{ex}'} trong đề thi hiện tại.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1">
                      {examAnswerKeyMatrix.map((item) => (
                        <div
                          key={item.questionNumber}
                          className="p-2 bg-white rounded-lg border border-teal-200 shadow-sm flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-xs font-mono">
                              Câu {item.questionNumber}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1 rounded uppercase font-bold ${
                                item.answerType === "mcq"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : item.answerType === "tf"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.answerType}
                            </span>
                          </div>

                          <div className="my-1 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-sm font-black font-mono shadow-xs ${
                                ["A", "B", "C", "D"].includes(item.correctAnswer)
                                  ? "bg-emerald-500 text-white"
                                  : item.correctAnswer.includes("\\True")
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-200 text-slate-700 text-xs"
                              }`}
                            >
                              {item.correctAnswer}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>{item.hasSolution ? "✓ Lời giải" : "—"}</span>
                            <button
                              onClick={() => {
                                // Jump to question in editor textarea
                                if (editorTextareaRef.current) {
                                  const text = editorTextareaRef.current.value;
                                  let currentMatch;
                                  let count = 0;
                                  const regex = /\\begin\{ex\}/g;
                                  let targetPos = -1;
                                  while ((currentMatch = regex.exec(text)) !== null) {
                                    count++;
                                    if (count === item.questionNumber) {
                                      targetPos = currentMatch.index;
                                      break;
                                    }
                                  }
                                  if (targetPos !== -1) {
                                    editorTextareaRef.current.focus();
                                    editorTextareaRef.current.setSelectionRange(targetPos, targetPos + 10);
                                    const linesUpTo = text.substring(0, targetPos).split("\n").length;
                                    const lineHeight = 20;
                                    editorTextareaRef.current.scrollTop = (linesUpTo - 5) * lineHeight;
                                    showToast(`Đã cuộn đến Câu ${item.questionNumber} (Dòng ${linesUpTo})`, "info");
                                  }
                                }
                              }}
                              className="text-teal-600 hover:text-teal-900 font-bold hover:underline"
                              title="Nhảy đến vị trí câu hỏi trong trình soạn thảo"
                            >
                              Xem câu
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Real-time LaTeX Syntax & Environment Linter Drawer */}
              {isEditorLinterOpen && (
                <div className="bg-rose-50/95 border-b border-rose-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-rose-700" />
                      <span className="font-semibold text-rose-950 text-xs">
                        Kiểm tra cú pháp & Tính toàn vẹn cấu trúc LaTeX (Syntax & Environment Linter)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          examLatexDiagnostics.length === 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-200 text-rose-900"
                        }`}
                      >
                        {examLatexDiagnostics.length === 0
                          ? "✓ Không phát hiện lỗi cú pháp"
                          : `⚠ ${examLatexDiagnostics.length} vấn đề cần lưu ý`}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditorLinterOpen(false)}
                      className="text-rose-700 hover:text-rose-900 px-1.5 py-0.5 rounded hover:bg-rose-100 font-bold text-xs"
                      title="Đóng bảng cú pháp (Esc)"
                    >
                      ✕
                    </button>
                  </div>

                  {examLatexDiagnostics.length === 0 ? (
                    <div className="p-3 bg-white/90 border border-emerald-200 rounded text-center text-emerald-800 text-xs flex items-center justify-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Toàn bộ các cặp môi trường `\begin` - `\end`, dấu ngoặc nhọn `{}` và cặp `$` đều cân bằng chuẩn xác!</span>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {examLatexDiagnostics.map((diag) => (
                        <div
                          key={diag.id}
                          onClick={() => {
                            // Jump to line and focus
                            const ta = editorTextareaRef.current;
                            if (ta) {
                              const lines = (ta.value || "").split("\n");
                              let charIndex = 0;
                              for (let i = 0; i < Math.min(diag.line - 1, lines.length); i++) {
                                charIndex += lines[i].length + 1;
                              }
                              ta.focus();
                              ta.setSelectionRange(charIndex, charIndex + (lines[diag.line - 1] ? lines[diag.line - 1].length : 0));
                              updateCursorStats();
                            }
                          }}
                          className={`p-2 rounded border cursor-pointer transition-all flex items-start space-x-2 ${
                            diag.severity === "error"
                              ? "bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50/50"
                              : "bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50/50"
                          }`}
                          title="Bấm để nhảy tới dòng này trong Editor"
                        >
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                              diag.severity === "error" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Dòng {diag.line}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 text-xs">{diag.message}</div>
                            {diag.suggestion && (
                              <div className="text-[11px] text-slate-500 mt-0.5 italic">
                                Gợi ý khắc phục: {diag.suggestion}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 hover:text-slate-600 shrink-0 font-medium">
                            Nhảy tới ➔
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pedagogical Document Analytics & Stats Drawer */}
              {isEditorStatsOpen && (
                <div className="bg-teal-50/90 border-b border-teal-200 p-2.5 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner flex flex-col font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200 mb-2 px-1">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-teal-700" />
                      <span className="font-semibold text-teal-950 text-xs">
                        Bảng phân tích định lượng sư phạm đề thi (Pedagogical Telemetry)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-200 text-teal-800 font-bold">
                        Đang đồng bộ trực tiếp
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditorStatsOpen(false)}
                      className="text-teal-700 hover:text-teal-900 px-1.5 py-0.5 rounded hover:bg-teal-100 font-bold text-xs"
                      title="Đóng bảng phân tích (Esc)"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Tổng số câu hỏi</div>
                      <div className="text-base font-bold text-teal-900 mt-0.5">
                        {examPedagogicalStats.totalQuestions} câu
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {examPedagogicalStats.loigiaiCount} câu có lời giải
                      </div>
                    </div>

                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Cấu trúc 3 Phần</div>
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mt-1">
                        <span className={`px-1 rounded ${examPedagogicalStats.part1Matches ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>P.I</span>
                        <span className={`px-1 rounded ${examPedagogicalStats.part2Matches ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>P.II</span>
                        <span className={`px-1 rounded ${examPedagogicalStats.part3Matches ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>P.III</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Chuẩn đề BGD 2025</div>
                    </div>

                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Kiểu trắc nghiệm</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1 space-y-0.5">
                        <div>4 phương án: <span className="text-teal-700 font-bold">{examPedagogicalStats.choice4Count}</span></div>
                        <div>Đúng / Sai: <span className="text-amber-700 font-bold">{examPedagogicalStats.choiceTFCount}</span></div>
                      </div>
                    </div>

                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Công thức Toán</div>
                      <div className="text-base font-bold text-indigo-900 mt-0.5">
                        {examPedagogicalStats.totalMathFormulas}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Inline & Display math</div>
                    </div>

                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Đồ thị & Bảng TikZ</div>
                      <div className="text-base font-bold text-violet-900 mt-0.5">
                        {examPedagogicalStats.tikzPictures} hình
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {examPedagogicalStats.tikzTabs} bảng biến thiên
                      </div>
                    </div>

                    <div className="bg-white/90 border border-teal-100 p-2 rounded shadow-xs">
                      <div className="text-[10px] text-slate-500 uppercase font-medium">Quy mô & Thời gian</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">
                        ~{examPedagogicalStats.readingMinutes} phút đọc đề
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {examPedagogicalStats.words} từ • {examPedagogicalStats.totalLines} dòng
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pedagogical Exam Snippets & Template Blocks Drawer */}
              {isEditorSnippetsOpen && (
                <div className="bg-amber-50/90 border-b border-amber-200 p-2 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner max-h-60 flex flex-col">
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200 mb-1.5 px-1">
                    <div className="flex items-center space-x-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5 text-amber-700" />
                      <span className="font-semibold text-amber-950">
                        Thư viện mẫu đề thi & Khối câu hỏi chuẩn BGD (Exam Snippets)
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-200 text-amber-800">
                        {PEDAGOGICAL_SNIPPET_TEMPLATES.length} mẫu
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditorSnippetsOpen(false)}
                      className="text-amber-700 hover:text-amber-900 px-1.5 py-0.5 rounded hover:bg-amber-100 font-bold"
                      title="Đóng thư viện mẫu (Esc)"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 pr-1 font-sans">
                    {PEDAGOGICAL_SNIPPET_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="bg-white/85 hover:bg-white border border-amber-200/80 hover:border-amber-400 rounded-md p-2 transition-all shadow-xs flex flex-col justify-between space-y-1.5 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-800 text-xs group-hover:text-amber-900 transition-colors">
                              {tmpl.title}
                            </span>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-medium">
                              {tmpl.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.desc}</p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-amber-100/60">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tmpl.snippet.trim().split("\n").length} dòng mã
                          </span>
                          <button
                            onClick={() => {
                              handleInsertMathSnippet(tmpl.snippet);
                              showToast(`Đã chèn khối "${tmpl.title}" vào vị trí con trỏ!`, "success");
                            }}
                            className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium shadow-xs transition-colors flex items-center space-x-1"
                          >
                            <span>Chèn mẫu</span>
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* In-Editor Outline Tree Navigator Drawer */}
              {isEditorOutlineOpen && (() => {
                const outline = extractLatexOutline();
                return (
                  <div className="bg-sky-50/90 border-b border-sky-200 p-2 text-xs shrink-0 animate-in fade-in duration-150 shadow-inner max-h-56 flex flex-col">
                    <div className="flex items-center justify-between pb-1.5 border-b border-sky-200 mb-1 px-1">
                      <div className="flex items-center space-x-1.5">
                        <ListTree className="w-3.5 h-3.5 text-sky-700" />
                        <span className="font-semibold text-sky-950">
                          Mục lục cấu trúc đề thi (Outline Navigation)
                        </span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-200 text-sky-800">
                          {outline.length} phần tử
                        </span>
                      </div>
                      <button
                        onClick={() => setIsEditorOutlineOpen(false)}
                        className="text-sky-600 hover:text-sky-900 px-1.5 py-0.5 rounded hover:bg-sky-100 font-bold"
                        title="Đóng bảng mục lục (Esc)"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-sans">
                      {outline.length === 0 ? (
                        <div className="py-3 text-center text-slate-500 text-[11px] italic">
                          Chưa tìm thấy phần tử cấu trúc (section, câu hỏi, bài tập, hình vẽ TikZ) nào trong tài liệu.
                        </div>
                      ) : (
                        outline.map((item) => {
                          let badgeBg = "bg-slate-200 text-slate-700";
                          let icon = <Bookmark className="w-3 h-3 text-slate-500" />;
                          if (item.type === "section") {
                            badgeBg = "bg-indigo-600 text-white font-bold";
                          } else if (item.type === "subsection") {
                            badgeBg = "bg-indigo-100 text-indigo-700 font-medium";
                          } else if (item.type === "question") {
                            badgeBg = "bg-emerald-600 text-white font-bold";
                          } else if (item.type === "theorem") {
                            badgeBg = "bg-amber-600 text-white font-semibold";
                          } else if (item.type === "figure") {
                            badgeBg = "bg-purple-100 text-purple-700 font-medium";
                          } else if (item.type === "table") {
                            badgeBg = "bg-teal-100 text-teal-700 font-medium";
                          }

                          return (
                            <button
                              key={item.id}
                              onClick={() => handleJumpToOutlineLine(item.lineNum)}
                              className={`w-full text-left flex items-center justify-between px-2 py-1 rounded hover:bg-sky-100 transition-colors text-[11px] ${
                                item.level === 1
                                  ? "font-bold text-slate-900 bg-white/70 shadow-xs"
                                  : item.level === 2
                                  ? "pl-4 text-slate-800"
                                  : "pl-6 text-slate-600 italic"
                              }`}
                            >
                              <div className="flex items-center space-x-1.5 truncate">
                                {icon}
                                <span className="truncate">{item.label}</span>
                              </div>
                              <span className="ml-2 shrink-0 font-mono text-[10px] text-sky-700 bg-sky-200/70 px-1.5 py-0.5 rounded">
                                L{item.lineNum}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* In-Editor Jump to Line Bar (Ctrl+G) */}
              {isEditorGotoLineOpen && (
                <div className="bg-indigo-50/95 border-b border-indigo-200 px-4 py-2 flex items-center justify-between text-xs shrink-0 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-semibold text-slate-700">Nhảy đến dòng:</span>
                    <input
                      type="number"
                      min={1}
                      max={rawLatexCode.split("\n").length}
                      value={gotoLineInput}
                      onChange={(e) => setGotoLineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleGotoLineInEditor();
                        } else if (e.key === "Escape") {
                          setIsEditorGotoLineOpen(false);
                        }
                      }}
                      placeholder={`1 - ${rawLatexCode.split("\n").length}`}
                      className="w-24 px-2 py-0.5 border border-indigo-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => handleGotoLineInEditor()}
                      className="flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-xs transition-colors"
                    >
                      <span>Đi tới</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-500">
                      (Tổng cộng: {rawLatexCode.split("\n").length} dòng)
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditorGotoLineOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded hover:bg-indigo-100"
                    title="Đóng thanh nhảy dòng (Esc)"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* In-Editor Diff Inspector Bar (Modal Drawer) */}
              {isEditorDiffOpen && (() => {
                const diffData = computeLatexDiff();
                return (
                  <div className="bg-slate-900 border-b border-slate-700 p-3 text-xs shrink-0 animate-in fade-in duration-150 shadow-md max-h-72 flex flex-col">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <div className="flex items-center space-x-2">
                        <GitCompare className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold text-slate-100">
                          So sánh thay đổi mã nguồn LaTeX (Diff Inspector)
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                          +{diffData.stats.addedCount} thêm
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800">
                          -{diffData.stats.removedCount} xóa
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-400 border border-amber-800">
                          ~{diffData.stats.modifiedCount} sửa
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (lastSavedLatexSnapshot) {
                              setRawLatexCode(lastSavedLatexSnapshot);
                              pushToLatexHistory(lastSavedLatexSnapshot);
                              setIsDirty(false);
                              showToast("Đã khôi phục về bản lưu gần nhất!", "info");
                            }
                          }}
                          className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600 transition-colors"
                          title="Hoàn tác toàn bộ các thay đổi chưa lưu"
                        >
                          Khôi phục bản lưu
                        </button>
                        <button
                          onClick={() => setIsEditorDiffOpen(false)}
                          className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 font-bold"
                          title="Đóng bảng so sánh (Esc)"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-0.5 font-mono text-[11px] select-text">
                      {!diffData.hasChanges ? (
                        <div className="py-4 text-center text-slate-400 flex items-center justify-center space-x-2">
                          <FileCheck2 className="w-4 h-4 text-emerald-400" />
                          <span>Mã nguồn hiện tại trùng khớp hoàn toàn với bản lưu / biên dịch gần nhất. Chưa có thay đổi nào!</span>
                        </div>
                      ) : (
                        diffData.diffRows.map((row, idx) => {
                          if (row.type === "unchanged") return null; // Only show changes to keep clean
                          if (row.type === "added") {
                            return (
                              <div key={idx} className="bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded flex items-start space-x-2 border-l-2 border-emerald-500">
                                <span className="w-8 shrink-0 text-slate-500 text-right">L{row.currLineNum}</span>
                                <span className="font-bold text-emerald-400 shrink-0">+</span>
                                <span className="break-all">{row.currText}</span>
                              </div>
                            );
                          }
                          if (row.type === "removed") {
                            return (
                              <div key={idx} className="bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded flex items-start space-x-2 border-l-2 border-rose-500 line-through">
                                <span className="w-8 shrink-0 text-slate-500 text-right">L{row.origLineNum}</span>
                                <span className="font-bold text-rose-400 shrink-0">-</span>
                                <span className="break-all">{row.origText}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={idx} className="bg-amber-950/50 text-amber-200 px-2 py-0.5 rounded flex flex-col space-y-0.5 border-l-2 border-amber-500">
                              <div className="flex items-start space-x-2 opacity-75 line-through text-rose-300">
                                <span className="w-8 shrink-0 text-slate-500 text-right">L{row.origLineNum}</span>
                                <span className="font-bold text-rose-400 shrink-0">-</span>
                                <span className="break-all">{row.origText}</span>
                              </div>
                              <div className="flex items-start space-x-2 text-emerald-300">
                                <span className="w-8 shrink-0 text-slate-500 text-right">L{row.currLineNum}</span>
                                <span className="font-bold text-emerald-400 shrink-0">+</span>
                                <span className="break-all">{row.currText}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* In-Editor Search & Replace Bar (Ctrl+F / Ctrl+H) */}
              {isEditorSearchOpen && (
                <div className="bg-indigo-50/95 border-b border-indigo-200 px-4 py-2 flex flex-col space-y-1.5 text-xs shrink-0 animate-in fade-in duration-150">
                  {/* Row 1: Search */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsEditorReplaceMode(!isEditorReplaceMode)}
                        className={`p-1 rounded hover:bg-indigo-200/60 transition-colors ${
                          isEditorReplaceMode ? "text-indigo-700 bg-indigo-100 font-bold" : "text-slate-400"
                        }`}
                        title="Mở rộng / Thu gọn chế độ Thay thế (Ctrl+H)"
                      >
                        <Replace className="w-3.5 h-3.5" />
                      </button>
                      <Search className="w-3.5 h-3.5 text-indigo-600" />
                      <input
                        type="text"
                        value={editorSearchTerm}
                        onChange={(e) => setEditorSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleFindNextInEditor(!e.shiftKey);
                          } else if (e.key === "Escape") {
                            setIsEditorSearchOpen(false);
                          }
                        }}
                        placeholder="Tìm từ khóa LaTeX... (Enter: tiếp, Shift+Enter: trước)"
                        autoFocus
                        className="px-2 py-0.5 text-xs bg-white border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 text-slate-800"
                      />
                      {/* Search Options: Case Sensitive, Whole Word, Regex */}
                      <div className="flex items-center space-x-1 border border-indigo-200 rounded bg-white px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => setEditorSearchCaseSensitive(!editorSearchCaseSensitive)}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors ${
                            editorSearchCaseSensitive
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                          title="Khớp chữ hoa/chữ thường (Match Case: Aa)"
                        >
                          Aa
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorSearchWholeWord(!editorSearchWholeWord)}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors ${
                            editorSearchWholeWord
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                          title="Khớp toàn bộ từ (Match Whole Word: [ab])"
                        >
                          \b
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorSearchRegex(!editorSearchRegex)}
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors ${
                            editorSearchRegex
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                          title="Biểu thức chính quy (Use Regular Expression: .*)"
                        >
                          .*
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleFindNextInEditor(false)}
                          className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-indigo-200 rounded text-slate-700 text-[10px] font-semibold"
                          title="Tìm mục trước đó (Shift+Enter)"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleFindNextInEditor(true)}
                          className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-indigo-200 rounded text-slate-700 text-[10px] font-semibold"
                          title="Tìm mục tiếp theo (Enter)"
                        >
                          ▼
                        </button>
                      </div>
                      <span className="text-[11px] text-indigo-700 font-medium">
                        {editorSearchTerm ? (
                          editorSearchMatches > 0 ? (
                            `${editorSearchMatches} kết quả`
                          ) : (
                            <span className="text-rose-600">Không tìm thấy</span>
                          )
                        ) : (
                          "Nhập từ khóa"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsEditorReplaceMode(!isEditorReplaceMode)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                          isEditorReplaceMode
                            ? "bg-indigo-600 text-white border-indigo-600 font-semibold"
                            : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        }`}
                        title="Bật tính năng thay thế (Ctrl+H)"
                      >
                        {isEditorReplaceMode ? "Thu gọn Thay thế" : "Thay thế →"}
                      </button>
                      <button
                        onClick={() => setIsEditorSearchOpen(false)}
                        className="text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded text-xs"
                        title="Đóng tìm kiếm (Esc)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Replace controls (when open) */}
                  {isEditorReplaceMode && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-indigo-100/70 animate-in fade-in slide-in-from-top-1 duration-150">
                      <span className="w-4 flex justify-center text-slate-400">↳</span>
                      <Replace className="w-3.5 h-3.5 text-indigo-600" />
                      <input
                        type="text"
                        value={editorReplaceTerm}
                        onChange={(e) => setEditorReplaceTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleReplaceOneInEditor();
                          } else if (e.key === "Escape") {
                            setIsEditorSearchOpen(false);
                          }
                        }}
                        placeholder="Chuỗi thay thế mới..."
                        className="px-2 py-0.5 text-xs bg-white border border-indigo-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 text-slate-800"
                      />
                      <button
                        onClick={handleReplaceOneInEditor}
                        disabled={!editorSearchTerm || editorSearchMatches === 0}
                        className="px-2 py-0.5 bg-white hover:bg-indigo-50 disabled:opacity-40 border border-indigo-200 rounded text-indigo-700 text-[11px] font-semibold transition-colors"
                        title="Thay thế kết quả đang chọn hoặc tiếp theo"
                      >
                        Thay thế
                      </button>
                      <button
                        onClick={handleReplaceAllInEditor}
                        disabled={!editorSearchTerm || editorSearchMatches === 0}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded text-[11px] font-semibold transition-colors shadow-xs"
                        title="Thay thế toàn bộ các kết quả trong mã LaTeX"
                      >
                        Thay thế tất cả ({editorSearchMatches})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Fast Math Snippets & Formulas Quick Toolbar */}
              <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-1.5 flex items-center space-x-1.5 overflow-x-auto text-xs shrink-0 select-none scrollbar-thin">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center space-x-1">
                  <span>Toán nhanh:</span>
                </span>
                
                {/* Math Formulas Snippets */}
                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\dfrac{}{}", -3)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[11px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn phân số \dfrac{tử}{mẫu}"
                >
                  <span className="font-semibold">\dfrac&#123;&#125;&#123;&#125;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\sqrt{}", -1)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[11px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn căn bậc hai \sqrt{x}"
                >
                  <span className="font-semibold">\sqrt&#123;&#125;</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\int_{}^{} \\, \\mathrm{d}x", -17)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[11px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn tích phân \int_{a}^{b} f(x) dx"
                >
                  <span className="font-semibold">\int</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\lim_{x \\to } ", -1)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[11px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn giới hạn \lim_{x \to x_0}"
                >
                  <span className="font-semibold">\lim</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\sum_{i=1}^{n} ", 0)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[11px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn tổng xích-ma \sum"
                >
                  <span className="font-semibold">\sum</span>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

                {/* Common Symbols */}
                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\alpha ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn ký hiệu alpha"
                >
                  α
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\beta ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn ký hiệu beta"
                >
                  β
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\pi ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn ký hiệu số pi"
                >
                  π
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\infty ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn vô cùng \infty"
                >
                  ∞
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\in ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn thuộc \in"
                >
                  ∈
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\subset ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn tập con \subset"
                >
                  ⊂
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\le ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn nhỏ hơn hoặc bằng \le"
                >
                  ≤
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\ge ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn lớn hơn hoặc bằng \ge"
                >
                  ≥
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\neq ", 0)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn khác \neq"
                >
                  ≠
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\vec{}", -1)}
                  className="px-1.5 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-serif text-[12px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn vector \vec{u}"
                >
                  vec
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

                {/* Exam Environment Snippets */}
                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("\\begin{cases}\n  \n\\end{cases}", -13)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[10px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn hệ phương trình hoặc ngoặc nhọn \begin{cases}"
                >
                  cases
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertMathSnippet("$$\n  \n$$", -3)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded font-mono text-[10px] text-slate-700 hover:text-indigo-600 transition-colors shrink-0 shadow-2xs"
                  title="Chèn khối công thức hiển thị riêng dòng $$"
                >
                  $$...$$
                </button>
              </div>

              {/* Code Editor Body */}
              <div className="flex-1 flex overflow-hidden">
                <textarea
                  ref={editorTextareaRef}
                  value={rawLatexCode}
                  onChange={(e) => {
                    const newVal = e.target.value;
                    setRawLatexCode(newVal);
                    pushToLatexHistory(newVal, true);
                    setIsDirty(true);
                    updateCursorStats();
                  }}
                  onKeyDown={handleEditorKeyDownAutoPair}
                  onKeyUp={updateCursorStats}
                  onClick={updateCursorStats}
                  onSelect={updateCursorStats}
                  placeholder="% Mã nguồn LaTeX của đề thi... Thầy cô có thể click sửa trực tiếp bất kỳ công thức toán hay câu từ nào và nhấn Ctrl+S để biên dịch!"
                  spellCheck={false}
                  style={{
                    fontSize: `${editorFontSize}pt`,
                    whiteSpace: isWordWrap ? "pre-wrap" : "pre",
                    wordBreak: isWordWrap ? "break-word" : "normal",
                  }}
                  className="flex-1 h-full bg-white text-slate-900 p-4 font-mono leading-relaxed resize-none focus:outline-none border-none selection:bg-indigo-100 selection:text-indigo-900 overflow-y-auto"
                />
              </div>

              {/* Footer status */}
              <div className="h-7 bg-slate-50 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
                <div className="flex items-center space-x-3">
                  <span>LaTeX 2e • UTF-8 • pdfTeX Engine • {rawLatexCode.split("\n").length} dòng • {rawLatexCode.length} ký tự</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-indigo-600 font-semibold bg-indigo-50/70 px-1.5 py-0.5 rounded border border-indigo-100">
                    Dòng {editorCursorInfo.line}, Cột {editorCursorInfo.col}
                    {editorCursorInfo.selectedChars > 0 && ` (${editorCursorInfo.selectedChars} đã chọn)`}
                  </span>
                </div>
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
              {/* Thanh công cụ Sắp xếp chuẩn Sư phạm & Tác vụ hàng loạt */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs mb-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sắp xếp sư phạm:</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => autoReorderPedagogical("difficulty")}
                      className="px-2 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-all flex items-center space-x-1"
                      title="Tự động xếp theo mức độ nhận thức: Nhận biết -> Thông hiểu -> Vận dụng -> Vận dụng cao"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Theo Độ khó</span>
                    </button>
                    <button
                      onClick={() => autoReorderPedagogical("points")}
                      className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-all flex items-center space-x-1"
                      title="Tự động xếp theo thang điểm tăng dần"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Theo Điểm</span>
                    </button>
                  </div>
                </div>

                {/* Batch Selection Action Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (selectedItemIds.length === items.length) {
                          setSelectedItemIds([]);
                        } else {
                          setSelectedItemIds(items.map((it) => it.id));
                        }
                      }}
                      className="font-bold text-slate-600 hover:text-indigo-600 flex items-center space-x-1"
                    >
                      <span>{selectedItemIds.length === items.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}</span>
                    </button>
                    {selectedItemIds.length > 0 && (
                      <span className="text-slate-400">|</span>
                    )}
                    {selectedItemIds.length > 0 && (
                      <span className="font-semibold text-indigo-700">
                        Đã chọn <strong>{selectedItemIds.length}</strong> / {items.length} câu
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {selectedItemIds.length > 0 && (
                      <button
                        onClick={() => setIsBatchActionModalOpen(true)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-xs flex items-center space-x-1"
                      >
                        <span>⚡ Tác vụ hàng loạt</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsAddQuestionModalOpen(true)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all shadow-xs flex items-center space-x-1 text-[11px]"
                      title="Thêm câu hỏi mới vào đề thi"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Câu</span>
                    </button>
                  </div>
                </div>
              </div>

              {items.map((it, idx) => {
                const snap = it.problem_snapshot || {};
                const rubric = it.rubric_data || {};
                const steps = rubric.steps || [];
                const isChecked = selectedItemIds.includes(it.id);

                return (
                  <div
                    key={it.id}
                    className={`p-4 bg-white rounded-2xl border transition-all text-xs ${
                      isChecked
                        ? "border-indigo-500 shadow-indigo-100/50 shadow-md ring-1 ring-indigo-400 bg-indigo-50/20"
                        : "border-slate-200/90 shadow-sm hover:border-indigo-300"
                    } space-y-2.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItemIds([...selectedItemIds, it.id]);
                            } else {
                              setSelectedItemIds(selectedItemIds.filter((id) => id !== it.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span className="font-extrabold text-sm text-indigo-900">
                          {it.display_label}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {it.max_points} điểm
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {TOPIC_VI_MAP[snap.main_topic] || snap.main_topic || "Đại số"}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenStudioSwap(it)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Đổi câu hỏi tương đương từ ngân hàng"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>
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

                    <div className="text-slate-800 leading-relaxed font-serif line-clamp-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <MathRenderer content={snap.content_latex || "..."} />
                    </div>

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
              {/* Quick Pedagogical Presets for Layout */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Mẫu Bố Cục Nhanh (Layout Presets)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tự động cấu hình</span>
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "standard",
                      title: "Chuẩn Bộ GD",
                      desc: "12pt, lề 2cm, Times",
                      color: "hover:border-indigo-500 hover:bg-indigo-50/50",
                      knobs: {
                        font_family: "times" as const,
                        font_size_pt: 12,
                        line_spread: 1.15,
                        item_gap_pt: 8,
                        margin_top_cm: 2.0,
                        margin_bottom_cm: 2.0,
                        margin_left_cm: 2.5,
                        margin_right_cm: 2.0,
                      },
                    },
                    {
                      id: "compact",
                      title: "Tiết Kiệm Giấy",
                      desc: "11pt, lề hẹp 1.5cm",
                      color: "hover:border-emerald-500 hover:bg-emerald-50/50",
                      knobs: {
                        font_family: "times" as const,
                        font_size_pt: 11,
                        line_spread: 1.05,
                        item_gap_pt: 5,
                        margin_top_cm: 1.5,
                        margin_bottom_cm: 1.5,
                        margin_left_cm: 1.8,
                        margin_right_cm: 1.5,
                      },
                    },
                    {
                      id: "spacious",
                      title: "Thoáng / Tự Luận",
                      desc: "12pt, giãn 1.25x, lề rộng",
                      color: "hover:border-amber-500 hover:bg-amber-50/50",
                      knobs: {
                        font_family: "times" as const,
                        font_size_pt: 12,
                        line_spread: 1.25,
                        item_gap_pt: 12,
                        margin_top_cm: 2.2,
                        margin_bottom_cm: 2.2,
                        margin_left_cm: 2.8,
                        margin_right_cm: 2.0,
                      },
                    },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        const updated = { ...layoutKnobs, ...preset.knobs };
                        setLayoutKnobs(updated);
                        compileLivePreview(items, updated, activeMode);
                        showToast(`Đã áp dụng mẫu bố cục: ${preset.title}`, "info");
                      }}
                      className={`p-2.5 rounded-xl border border-slate-200 text-left transition-all ${preset.color} group`}
                    >
                      <span className="font-bold text-slate-800 text-[11px] block group-hover:text-indigo-700">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        {preset.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark & Security Stamping Knobs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dấu Bản Quyền / Chống Sao Chép</span>
                  </h4>
                  {headerConfig.watermark_text && headerConfig.watermark_text.trim() && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Đang bật
                    </span>
                  )}
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px]">Nội dung Watermark (chữ in chìm nghiêng 35°):</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      placeholder="VD: TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN"
                      value={headerConfig.watermark_text || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHeaderConfig((prev: any) => ({ ...prev, watermark_text: val }));
                        setIsDirty(true);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {headerConfig.watermark_text && (
                      <button
                        onClick={() => {
                          setHeaderConfig((prev: any) => ({ ...prev, watermark_text: "" }));
                          setIsDirty(true);
                          showToast("Đã tắt dấu bản quyền Watermark!", "info");
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg font-bold"
                        title="Xóa watermark"
                      >
                        Tắt
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500">Mẫu nhanh:</span>
                  <button
                    onClick={() => {
                      setHeaderConfig((prev: any) => ({ ...prev, watermark_text: "TRUNG TÂM GIÁO DỤC VINH PHÁT" }));
                      setIsDirty(true);
                      showToast("Đã chọn watermark: TRUNG TÂM GIÁO DỤC VINH PHÁT", "success");
                    }}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-md border border-slate-200 font-medium"
                  >
                    VINH PHÁT
                  </button>
                  <button
                    onClick={() => {
                      setHeaderConfig((prev: any) => ({ ...prev, watermark_text: "ĐỀ THI THỬ - LƯU HÀNH NỘI BỘ" }));
                      setIsDirty(true);
                      showToast("Đã chọn watermark: ĐỀ THI THỬ - LƯU HÀNH NỘI BỘ", "success");
                    }}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-md border border-slate-200 font-medium"
                  >
                    Nội Bộ
                  </button>
                  <button
                    onClick={() => {
                      setHeaderConfig((prev: any) => ({ ...prev, watermark_text: "BẢN GỐC - CHÍNH THỨC" }));
                      setIsDirty(true);
                      showToast("Đã chọn watermark: BẢN GỐC - CHÍNH THỨC", "success");
                    }}
                    className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200 font-medium"
                  >
                    Chính Thức
                  </button>
                </div>
              </div>

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
                    <span>Phông chữ đề thi:</span>
                    <span className="font-bold text-slate-900">{layoutKnobs.font_family === "sans" ? "Arial / Helvetica" : "Times New Roman"}</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { id: "times", label: "Times New Roman (Truyền thống)" },
                      { id: "sans", label: "Arial / Sans (Hiện đại)" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          const updated = { ...layoutKnobs, font_family: f.id as "times" | "sans" };
                          setLayoutKnobs(updated);
                          compileLivePreview(items, updated, activeMode);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all ${
                          layoutKnobs.font_family === f.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

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

          {/* TAB 5: MA TRẬN & PHỔ ĐIỂM SƯ PHẠM */}
          {sidebarTab === "matrix" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Thống kê Tổng quan */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-indigo-200">Tổng Quan Khảo Thí</span>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[11px] font-semibold">{items.length} câu hỏi</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold">{currentTotalScore.toFixed(2)}</span>
                    <span className="text-sm text-indigo-200 font-medium">điểm</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setIsExamPassportModalOpen(true)}
                      className="px-2 py-1 bg-amber-400/90 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
                      title="Xem và in Hồ sơ kỹ thuật / Phiếu thẩm định sư phạm đề thi"
                    >
                      <ScrollText className="w-3.5 h-3.5" />
                      <span>Hồ sơ đề thi</span>
                    </button>
                    <button
                      onClick={() => setIsScaleScoreModalOpen(true)}
                      className="px-2.5 py-1 bg-white/20 hover:bg-white text-white hover:text-indigo-800 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1"
                      title="Mở công cụ quy đổi điểm thang 10, 20 hoặc tự chọn"
                    >
                      <span>⚖️ Quy đổi</span>
                    </button>
                  </div>
                </div>
                <div className="mt-3 text-[11px] text-indigo-100 flex items-center justify-between border-t border-white/20 pt-2">
                  <span>Trắc nghiệm / Tự luận phối hợp</span>
                  <span>Chuẩn Bộ GD&ĐT</span>
                </div>
              </div>

              {/* Phân bố 4 Cấp Độ Nhận Thức */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Cấp Độ Nhận Thức</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tỷ lệ điểm</span>
                </h4>
                {(() => {
                  const levels = [
                    { key: "NB", label: "Nhận biết", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-800" },
                    { key: "TH", label: "Thông hiểu", color: "bg-blue-500", light: "bg-blue-50 text-blue-800" },
                    { key: "VD", label: "Vận dụng", color: "bg-amber-500", light: "bg-amber-50 text-amber-800" },
                    { key: "VDC", label: "Vận dụng cao", color: "bg-rose-500", light: "bg-rose-50 text-rose-800" },
                  ];
                  return (
                    <div className="space-y-2.5">
                      {levels.map((lvl) => {
                        const count = items.filter((it: any) => it.difficulty === lvl.key).length;
                        const pts = items
                          .filter((it: any) => it.difficulty === lvl.key)
                          .reduce((s: number, it: any) => s + (parseFloat(it.max_points) || 0), 0);
                        const pct = currentTotalScore > 0 ? (pts / currentTotalScore) * 100 : 0;
                        return (
                          <div key={lvl.key}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${lvl.light}`}>
                                  {lvl.key}
                                </span>
                                <span>{lvl.label}</span>
                              </span>
                              <span className="font-mono text-slate-600 font-medium">
                                {count} câu ({pts.toFixed(1)}đ - {pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${lvl.color} transition-all duration-300`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Phân bố Chủ Đề / Mạch Kiến Thức */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Mạch Kiến Thức Khảo Thí
                </h4>
                {(() => {
                  const topicCounts: Record<string, { count: number; pts: number }> = {};
                  items.forEach((it: any) => {
                    const top = it.topic || "OTHER";
                    if (!topicCounts[top]) topicCounts[top] = { count: 0, pts: 0 };
                    topicCounts[top].count += 1;
                    topicCounts[top].pts += parseFloat(it.max_points) || 0;
                  });

                  return (
                    <div className="space-y-2">
                      {Object.entries(topicCounts).map(([top, data]) => {
                        const label = TOPIC_VI_MAP[top] || top;
                        const pct = currentTotalScore > 0 ? (data.pts / currentTotalScore) * 100 : 0;
                        return (
                          <div key={top} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                            <span className="text-slate-700 font-medium">{label}</span>
                            <span className="font-mono text-slate-500 font-medium">
                              {data.count} câu | {data.pts.toFixed(1)}đ ({pct.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                ⚖️ <span className="font-bold">Khuyến nghị sư phạm:</span> Đề thi đạt chuẩn phân hóa học sinh tốt khi tỷ lệ điểm Vận dụng & Vận dụng cao (VD + VDC) chiếm khoảng 30% - 40% tổng điểm toàn bài.
              </div>
            </div>
          )}
        </div>
        )}

        {/* DRAGGABLE RESIZABLE SPLIT RESIZER */}
        {!isEditorCollapsed && (
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
        )}

        {/* RIGHT LIVE A4 PDF CANVAS (WIDTH: remaining % or 100%) */}
        <div
          style={{ width: isEditorCollapsed ? "100%" : `${100 - splitRatio}%` }}
          className="bg-slate-200/70 flex flex-col h-full overflow-hidden shrink-0 flex-1"
        >
          {/* Canvas Toolbar */}
          <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-600 shrink-0 shadow-sm">
            <div className="flex items-center space-x-2">
              {isEditorCollapsed && (
                <button
                  onClick={() => setIsEditorCollapsed(false)}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all flex items-center space-x-1 mr-2 shadow-sm"
                  title="Mở lại Sidebar Biên tập"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                  <span>Hiện Biên Tập</span>
                </button>
              )}
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
              {!compiling && lastCompileStats && (
                <span
                  className="text-[11px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1 ml-2 font-mono transition-colors cursor-help"
                  title={`Biên dịch hoàn tất lúc ${lastCompileStats.timeStr}. Thời gian xử lý: ${lastCompileStats.durationMs}ms`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  <span>{lastCompileStats.durationMs >= 1000 ? (lastCompileStats.durationMs / 1000).toFixed(1) + 's' : lastCompileStats.durationMs + 'ms'}</span>
                </span>
              )}
              {previewError && (
                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center space-x-1 font-medium ml-2">
                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="truncate max-w-[280px]" title={previewError}>{previewError}</span>
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
                <button
                  onClick={() => setViewerMode("html")}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-all ${
                    viewerMode === "html"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Chế độ DOM Sư phạm (Client Fallback an toàn, MathJax sắc nét)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem DOM A4</span>
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
                  <button
                    onClick={handleAutoFitWidth}
                    className="px-1.5 py-0.5 hover:bg-white rounded text-indigo-700 hover:text-indigo-900 transition-all font-sans font-bold text-[10px] bg-indigo-50/70 border border-indigo-200 ml-1"
                    title="Căn vừa vặn bề ngang màn hình (Fit Width)"
                  >
                    Fit Vừa
                  </button>
                  <button
                    onClick={() => setIsDualSpreadMode((prev) => !prev)}
                    className={`px-1.5 py-0.5 rounded transition-all font-sans font-bold text-[10px] border ml-1 flex items-center space-x-1 ${
                      isDualSpreadMode
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-white border-slate-200"
                    }`}
                    title={isDualSpreadMode ? "Chuyển về xem 1 trang dọc đơn" : "Xem 2 trang song song (Trang đôi A4)"}
                  >
                    <Columns className="w-3 h-3" />
                    <span>{isDualSpreadMode ? "2 Trang" : "1 Trang"}</span>
                  </button>
                  <button
                    onClick={() => setIsProofreadingRulerActive((prev) => !prev)}
                    className={`px-1.5 py-0.5 rounded transition-all font-sans font-bold text-[10px] border ml-1 flex items-center space-x-1 ${
                      isProofreadingRulerActive
                        ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-white border-slate-200"
                    }`}
                    title={isProofreadingRulerActive ? "Tắt thước đọc dò dòng" : "Bật thước đọc dò lỗi đề thi (Focus Reading Ruler)"}
                  >
                    <Glasses className="w-3 h-3" />
                    <span>{isProofreadingRulerActive ? "Thước: Bật" : "Thước"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Viewer Area with Smooth Continuous Scroll */}
          {viewerMode === "html" || (!previewData?.pdf_key && !previewData?.page_keys && !compiling) ? (
            <div
              ref={canvasAreaRef}
              onMouseMove={(e) => {
                if (isProofreadingRulerActive && canvasAreaRef.current) {
                  const rect = canvasAreaRef.current.getBoundingClientRect();
                  setRulerTopY(e.clientY - rect.top);
                }
              }}
              className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-slate-200/70 relative"
            >
              {/* Focus Reading Proofreading Ruler Guide for HTML Mode */}
              {isProofreadingRulerActive && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-30 transition-all duration-75 flex items-center justify-between px-6"
                  style={{ top: `${rulerTopY}px`, transform: "translateY(-50%)" }}
                >
                  <div className="w-full h-8 bg-amber-500/15 border-y-2 border-amber-500/70 backdrop-blur-[0.5px] shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-between px-4">
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded shadow-xs">
                      🔍 THƯỚC DÒ LỖI BẢN IN
                    </span>
                    <span className="text-[9px] font-mono font-medium text-amber-700">
                      Rê chuột để di chuyển thước đọc
                    </span>
                  </div>
                </div>
              )}
              <div
                style={{
                  width: `${(595 * zoomScale) / 100}px`,
                  minHeight: "842px",
                  padding: `${layoutKnobs.margin_top_cm || 1.8}cm ${layoutKnobs.margin_right_cm || 1.8}cm ${layoutKnobs.margin_bottom_cm || 1.8}cm ${layoutKnobs.margin_left_cm || 2.0}cm`,
                  fontSize: `${layoutKnobs.font_size_pt || 12}pt`,
                  lineHeight: layoutKnobs.line_spread || 1.15,
                }}
                className={`bg-white rounded-[2px] shadow-2xl border border-slate-300 text-slate-900 relative overflow-hidden a4-print-target ${
                  layoutKnobs.font_family === "sans" ? "font-sans" : "font-serif"
                }`}
              >
                {/* Watermark Overlay in DOM Mode */}
                {headerConfig.watermark_text && headerConfig.watermark_text.trim() && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none overflow-hidden">
                    <span
                      className="text-slate-900/10 font-bold uppercase tracking-widest text-center whitespace-nowrap transform -rotate-35"
                      style={{ fontSize: "2.8rem" }}
                    >
                      {headerConfig.watermark_text.trim()}
                    </span>
                  </div>
                )}
                {/* Header Form */}
                <div className="border-b-2 border-slate-800 pb-3 text-center space-y-1 mb-6">
                  <div className="flex justify-between items-start text-[11px] font-bold uppercase tracking-wider text-slate-800">
                    <div className="text-left">
                      <p>{headerConfig.governing_body || "SỞ GIÁO DỤC VÀ ĐÀO TẠO"}</p>
                      <p className="font-extrabold text-indigo-900">{headerConfig.department_or_school || "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN"}</p>
                      <p className="text-[10px] text-slate-400 font-normal">-----------------</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-700">{headerConfig.exam_code || "ĐỀ CHÍNH THỨC"}</p>
                      <p>{headerConfig.academic_year || "NĂM HỌC 2026 - 2027"}</p>
                      <p className="text-[10px] text-slate-500 font-normal">Thời gian: {headerConfig.duration_minutes || 120} phút</p>
                    </div>
                  </div>
                  <h1 className="text-sm font-black text-slate-900 tracking-tight pt-1">
                    {(headerConfig.exam_name || "KỲ THI CHỌN HỌC SINH GIỎI").toUpperCase()}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700">MÔN THI: {headerConfig.subject_title || "TOÁN 9"}</p>
                  {activeMode === "EXAM" && headerConfig.show_sbd_box && (
                    <div className="mt-2 p-1.5 border border-dashed border-slate-300 rounded flex justify-between text-[10px] text-slate-600 font-medium">
                      <span>Họ và tên thí sinh: ................................................................</span>
                      <span>Số báo danh: ........................</span>
                    </div>
                  )}
                </div>

                {/* View Mode Switching: EXAM / RUBRIC vs OMR SHEET */}
                {activeMode === "OMR" ? (
                  /* GIAO DIỆN PHIẾU TÔ TRẮC NGHIỆM OMR SƯ PHẠM CHUẨN A4 */
                  <div className="space-y-6">
                    <div className="border-2 border-slate-900 p-3 rounded bg-slate-50/50 flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <p className="font-black text-indigo-900 uppercase">HƯỚNG DẪN TÔ PHIẾU OMR CHUẨN:</p>
                        <p className="text-[11px] text-slate-700">1. Dùng bút chì 2B để tô kín vòng tròn đáp án đúng [ ● ].</p>
                        <p className="text-[11px] text-slate-700">2. Không gạch chéo [ X ] hoặc đánh dấu tick [ ✓ ].</p>
                      </div>
                      <div className="flex items-center space-x-2 border border-slate-300 p-2 bg-white rounded">
                        <span className="text-[11px] font-bold text-slate-500">Mã đề:</span>
                        <div className="flex space-x-1">
                          {["1", "0", "2"].map((d, i) => (
                            <div key={i} className="w-5 h-6 border border-slate-800 text-center font-mono font-bold leading-6 text-xs">
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lưới câu trả lời trắc nghiệm OMR */}
                    <div>
                      <h3 className="font-black text-center text-xs tracking-wider uppercase text-slate-800 mb-3 border-b pb-1">
                        PHẦN TRẢ LỜI TRẮC NGHIỆM (4 LỰA CHỌN A, B, C, D)
                      </h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {items.map((it, idx) => (
                          <div
                            key={it.id || idx}
                            className="flex items-center justify-between border-b border-slate-100 py-1 text-xs"
                          >
                            <span className="font-bold text-slate-800 w-16">
                              Câu {idx + 1}:
                            </span>
                            <div className="flex items-center space-x-4">
                              {["A", "B", "C", "D"].map((opt) => (
                                <div key={opt} className="flex items-center space-x-1 cursor-pointer">
                                  <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[10px] text-slate-600 hover:border-indigo-600 hover:text-indigo-600">
                                    {opt}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-slate-300 rounded p-3 text-center text-[11px] text-slate-500 italic">
                      Giám thị số 1: ....................................... Giám thị số 2: .......................................
                    </div>
                  </div>
                ) : (
                  /* Question List */
                  <div className="space-y-4">
                    {items.map((it, idx) => {
                      const snap = it.problem_snapshot || {};
                      const rubric = it.rubric_data || {};
                      return (
                        <div key={it.id || idx} className="space-y-1 text-xs">
                          <p className="font-bold text-slate-900">
                            Câu {idx + 1}. ({it.max_points || 2.0} điểm)
                          </p>
                          <div className="pl-3 leading-relaxed text-slate-800">
                            <MathRenderer
                              content={
                                activeMode === "RUBRIC"
                                  ? (rubric.pedagogical_analysis || it.solution_latex || snap.content_latex || "")
                                  : (snap.content_latex || it.content_latex || "")
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Optional Student Pledge & Examination Proctor Signatures */}
                {includeStudentPledge && (
                  <div className="mt-6 pt-3 border-t-2 border-dashed border-slate-300 text-[11px] text-slate-700">
                    <div className="flex justify-between items-start italic mb-2">
                      <span>* Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.</span>
                      <span>Họ và tên thí sinh: .............................................................. SBD: ......................</span>
                    </div>
                    <div className="flex justify-around text-center pt-2 font-bold text-slate-800">
                      <div>
                        <div>CÁN BỘ COI THI 1</div>
                        <div className="text-[10px] font-normal italic text-slate-400 mt-8">(Ký và ghi rõ họ tên)</div>
                      </div>
                      <div>
                        <div>CÁN BỘ COI THI 2</div>
                        <div className="text-[10px] font-normal italic text-slate-400 mt-8">(Ký và ghi rõ họ tên)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Compact Answer Key at the end */}
                {includeAnswerKeyInPrint && (
                  <div className="mt-8 pt-4 border-t-2 border-slate-800 break-before-page">
                    <div className="text-center font-bold text-xs uppercase tracking-wider mb-2 text-slate-800">
                      BẢNG ĐÁP ÁN THAM KHẢO DÀNH CHO CÁN BỘ CHẤM THI
                    </div>
                    <div className="grid grid-cols-10 gap-1 text-[10px] text-center border border-slate-300 p-2 rounded-sm bg-slate-50/50">
                      {examAnswerKeyMatrix.map((item) => (
                        <div key={item.questionNumber} className="border border-slate-200 bg-white p-1 rounded-xs">
                          <div className="font-semibold text-slate-500 text-[9px]">Câu {item.questionNumber}</div>
                          <div className="font-bold text-slate-900 text-xs">{item.correctAnswer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
                  <span>-- HẾT -- (Đề thi gồm có {items.length} câu)</span>
                  {printPageNumbering && (
                    <span className="font-medium font-mono text-[9px] text-slate-500">
                      Hệ thống Khảo thí VINH PHÁT Platform
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : viewerMode === "pdf" && previewData?.pdf_key ? (
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
              onMouseMove={(e) => {
                if (isProofreadingRulerActive && canvasScrollRef.current) {
                  const rect = canvasScrollRef.current.getBoundingClientRect();
                  setRulerTopY(e.clientY - rect.top);
                }
              }}
              className={`flex-1 overflow-y-auto overflow-x-hidden p-8 flex scroll-smooth bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-200/70 relative ${
                isDualSpreadMode
                  ? "flex-row flex-wrap justify-center items-start gap-8"
                  : "flex-col items-center space-y-8"
              }`}
              style={{ scrollBehavior: "smooth" }}
            >
              {/* Focus Reading Proofreading Ruler Guide */}
              {isProofreadingRulerActive && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-30 transition-all duration-75 flex items-center justify-between px-6"
                  style={{ top: `${rulerTopY}px`, transform: "translateY(-50%)" }}
                >
                  <div className="w-full h-8 bg-amber-500/15 border-y-2 border-amber-500/70 backdrop-blur-[0.5px] shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-between px-4">
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded shadow-xs">
                      🔍 THƯỚC DÒ LỖI BẢN IN
                    </span>
                    <span className="text-[9px] font-mono font-medium text-amber-700">
                      Rê chuột để di chuyển thước đọc
                    </span>
                  </div>
                </div>
              )}
              {previewData?.page_keys && previewData.page_keys.length > 0 ? (
                previewData.page_keys.map((pageKey: string, pIdx: number) => (
                  <div
                    key={`${pIdx}-${canvasKey}`}
                    id={`pdf-page-${pIdx + 1}`}
                    style={{ width: `${(595 * zoomScale) / (isDualSpreadMode ? 140 : 100)}px` }}
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

      {/* QUESTION EDIT MODAL */}
      <QuestionEditModal
        question={editingQuestion}
        isOpen={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        onSaveSuccess={(updatedQ) => {
          loadExamItems();
        }}
      />

      {/* QUESTION SWAP MODAL IN STUDIO */}
      {swappingItemId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Đổi câu hỏi tương đương từ Ngân hàng</h3>
                  <p className="text-[11px] text-slate-300">
                    Chọn câu hỏi cùng chủ đề & độ khó để thay thế trực tiếp vào đề thi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSwappingItemId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidates List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingSwap ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <p className="text-xs text-slate-500 font-medium">Đang tìm kiếm câu hỏi phù hợp từ kho 1,900+ câu...</p>
                </div>
              ) : swapCandidates.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Không tìm thấy câu hỏi tương đương khả dụng trong ngân hàng.
                </div>
              ) : (
                swapCandidates.map((cand: any, idx: number) => (
                  <div
                    key={cand.id || idx}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all bg-white flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-700">Mã #{cand.id?.slice(0, 8)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                          {TOPIC_VI_MAP[cand.main_topic] || cand.main_topic || "Chủ đề"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          {cand.difficulty || "Thông hiểu"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSelectStudioReplacement(cand)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Chọn câu này</span>
                      </button>
                    </div>

                    <div className="text-slate-800 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 font-serif leading-relaxed">
                      <MathRenderer content={cand.content_latex || "..."} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timing Budget Estimation Modal */}
      {isTimingBudgetModalOpen && (() => {
        const totalDuration = parseInt(String(headerConfig.duration_minutes || "90"), 10) || 90;
        
        // Calculate recommended time per question based on points and cognitive level
        const timingDetails = items.map((q, idx) => {
          const pts = parseFloat(String(q.points || "1")) || 1;
          const level = (q.level || "vd").toLowerCase();
          
          // Weight factors per cognitive level
          let weight = 1.0;
          if (level === "nb") weight = 0.6;
          else if (level === "th") weight = 0.9;
          else if (level === "vd") weight = 1.3;
          else if (level === "vdc") weight = 1.8;
          
          const rawScore = pts * weight;
          return {
            id: q.id,
            index: idx + 1,
            title: q.title || `Câu ${idx + 1}`,
            points: pts,
            level: level.toUpperCase(),
            rawScore
          };
        });
        
        const sumRawScore = timingDetails.reduce((sum, d) => sum + d.rawScore, 0) || 1;
        // Allocate buffer (10% of total time for review and checking answers)
        const reviewBufferMinutes = Math.max(5, Math.round(totalDuration * 0.1));
        const availableExamMinutes = Math.max(10, totalDuration - reviewBufferMinutes);
        
        const allocatedDetails = timingDetails.map(d => {
          const estimatedMinutes = Math.max(1, Math.round((d.rawScore / sumRawScore) * availableExamMinutes));
          return {
            ...d,
            estimatedMinutes
          };
        });
        
        const totalEstimatedTime = allocatedDetails.reduce((sum, d) => sum + d.estimatedMinutes, 0) + reviewBufferMinutes;
        
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5">
                  <Timer className="w-5 h-5 text-indigo-200" />
                  <div>
                    <h3 className="font-bold text-base tracking-wide flex items-center space-x-2">
                      <span>Phân Bổ Ngân Sách Thời Gian Làm Bài</span>
                      <span className="text-[10px] bg-indigo-500/40 text-indigo-100 px-2 py-0.5 rounded-full font-normal">
                        VINH PHÁT Studio
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-100/80">
                      Tính toán thời lượng làm bài tối ưu theo điểm số & độ khó sư phạm (Tổng: {totalDuration} phút)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTimingBudgetModalOpen(false)}
                  className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* KPI Summary Cards */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">Tổng thời lượng đề</span>
                  <span className="text-lg font-bold text-indigo-700 font-mono">{totalDuration} phút</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block">Thời gian giải đề</span>
                  <span className="text-lg font-bold text-slate-800 font-mono">{availableExamMinutes} phút</span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[11px] font-medium text-emerald-600 block">Dự phòng soát bài</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{reviewBufferMinutes} phút</span>
                </div>
              </div>

              {/* Table list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Khuyến nghị thời gian cho từng câu hỏi:</span>
                  <span className="text-[10px] text-slate-400">Trọng số: NB (0.6x) • TH (0.9x) • VD (1.3x) • VDC (1.8x)</span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  {allocatedDetails.map((q) => {
                    let badgeColor = "bg-slate-100 text-slate-700";
                    if (q.level === "NB") badgeColor = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                    else if (q.level === "TH") badgeColor = "bg-blue-50 text-blue-700 border border-blue-200";
                    else if (q.level === "VD") badgeColor = "bg-amber-50 text-amber-700 border border-amber-200";
                    else if (q.level === "VDC") badgeColor = "bg-rose-50 text-rose-700 border border-rose-200";

                    const percentageOfTotal = Math.round((q.estimatedMinutes / totalDuration) * 100);

                    return (
                      <div key={q.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                            {q.index}
                          </span>
                          <div>
                            <span className="font-semibold text-xs text-slate-800 block line-clamp-1">{q.title}</span>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">{q.points} điểm</span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${badgeColor}`}>
                                {q.level}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-1.5 justify-end">
                            <span className="font-bold text-sm text-indigo-900 font-mono">
                              ~{q.estimatedMinutes}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">phút</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({percentageOfTotal}% quỹ thời gian)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 italic">
                  💡 Giúp giáo viên in barem có hướng dẫn phân bổ thời gian cho học sinh làm bài thi hiệu quả.
                </span>
                <button
                  onClick={() => setIsTimingBudgetModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Đóng Hộp Thoại
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LaTeX Math Formula Cheat Sheet Modal */}
      {isFormulaCheatSheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <FileCode className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-bold text-base tracking-wide flex items-center space-x-2">
                    <span>Sổ Tay Tra Cứu Công Thức LaTeX Toán Học</span>
                    <span className="text-[10px] bg-amber-500/40 text-amber-100 px-2 py-0.5 rounded-full font-normal">
                      VINH PHÁT Studio
                    </span>
                  </h3>
                  <p className="text-xs text-amber-100/80">
                    Tra cứu và sao chép nhanh các cấu trúc cú pháp toán học thường dùng trong đề thi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormulaCheatSheetOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Tìm công thức (vd: phân số, tích phân, vector, cases, alpha)..."
                  value={formulaSearchQuery}
                  onChange={(e) => setFormulaSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formulaSearchQuery && (
                  <button
                    onClick={() => setFormulaSearchQuery("")}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-200 rounded-lg"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: "all", label: "Tất Cả" },
                  { id: "algebra", label: "Đại Số & PT" },
                  { id: "calculus", label: "Giải Tích & Vi Phân" },
                  { id: "geometry", label: "Hình Học & Vector" },
                  { id: "logic", label: "Logic & Tập Hợp" },
                  { id: "matrix", label: "Ma Trận & Định Thức" },
                  { id: "greek", label: "Ký Tự Hy Lạp" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormulaCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                      formulaCategoryFilter === cat.id
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Grid */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {LATEX_FORMULA_CHEAT_SHEET.filter((item) => {
                const matchCat = formulaCategoryFilter === "all" || item.category === formulaCategoryFilter;
                const matchQuery =
                  !formulaSearchQuery ||
                  item.name.toLowerCase().includes(formulaSearchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(formulaSearchQuery.toLowerCase()) ||
                  item.code.toLowerCase().includes(formulaSearchQuery.toLowerCase());
                return matchCat && matchQuery;
              }).map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between gap-4 group">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-xs">{item.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{item.description}</div>
                    <div className="bg-slate-900 text-amber-200 font-mono text-[11px] p-2 rounded-lg border border-slate-800 select-all overflow-x-auto whitespace-pre">
                      {item.code}
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5 shrink-0 pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.code);
                        showToast(`Đã sao chép cú pháp "${item.name}"!`, "success");
                      }}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold flex items-center space-x-1 transition-colors"
                      title="Sao chép vào khay nhớ tạm"
                    >
                      <Copy className="w-3 h-3 text-amber-600" />
                      <span>Chép</span>
                    </button>
                    {sidebarTab === "editor" && (
                      <button
                        onClick={() => {
                          handleInsertMathSnippet(item.code);
                          showToast(`Đã chèn "${item.name}" vào vị trí con trỏ TeX!`, "success");
                          setIsFormulaCheatSheetOpen(false);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-xs font-semibold flex items-center space-x-1 transition-colors"
                        title="Chèn trực tiếp vào vị trí con trỏ trong trình soạn thảo TeX"
                      >
                        <Plus className="w-3 h-3 text-indigo-600" />
                        <span>Chèn TeX</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Tiêu chuẩn ký hiệu khảo thí VINH PHÁT (Tương thích Word OMML & PDF TeX Live)</span>
              </span>
              <button
                onClick={() => setIsFormulaCheatSheetOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat-sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Command className="w-5 h-5 text-indigo-300" />
                <h3 className="font-bold text-base tracking-wide">Bảng Phím Tắt Khảo Thí VINH PHÁT</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-white/10 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Thao Tác Soạn Thảo & Biên Dịch</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Biên dịch tức thì (Preview / TeX)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + S</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bật / Tắt Trợ lý AI Khảo thí</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + K</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bật / Tắt chú thích dòng % (Toggle Comment)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + /</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Tự động đóng cặp ngoặc & bọc chọn</span>
                    <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{}, [], (), $$, ""</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bảng nghiệm thu xuất bản (Preflight QA)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Alt + P</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bọc vùng chọn vào môi trường LaTeX (Env Wrapper)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Shift + E</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Ma trận đáp án & Lời giải (Answer Key Matrix)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Shift + A</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Lịch sử hoàn tác & Các mốc Snapshot (Undo/Redo)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Shift + H</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Đánh dấu / Gỡ Bookmark dòng</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + B</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Nhảy tới Bookmark kế tiếp / trước</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">F2 / Shift + F2</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bảng ký hiệu toán & Hy Lạp (Palette)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + K</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Kiểm tra cú pháp & Linter LaTeX</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + L</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bảng phân tích định lượng sư phạm (Telemetry)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + I</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Thư viện mẫu đề thi BGD & Snippets</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + M</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Mục lục cấu trúc đề thi (Outline Tree Navigator)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + O</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Nhân đôi dòng hiện tại / khối chọn (Duplicate Line)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Shift + Alt + ↓ / ↑</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Di chuyển dòng lên / xuống (Move Line Up / Down)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Alt + ↑ / ↓</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">So sánh thay đổi mã nguồn LaTeX (Diff Inspector)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + D</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Định dạng & Căn lề mã nguồn LaTeX</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Alt + F</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Nhảy đến dòng chỉ định (Go to Line)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + G</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Tìm kiếm nâng cao (Aa, \b, .*)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + F</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Tìm & Thay thế từ khóa (Replace All)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + H</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Hoàn tác thao tác soạn thảo (Undo)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Z</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Làm lại thao tác soạn thảo (Redo)</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + Y / Ctrl+Shift+Z</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Mở hộp thoại phím tắt này</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">?</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Xuất Bản & In Ấn A4</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">In Ngay ra máy in / Xuất PDF trình duyệt</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + P</kbd>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Tự động căn vừa màn hình Canvas (Fit Width)</span>
                    <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Nút "Fit Vừa"</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Phóng to / Thu nhỏ trang A4 Canvas</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + +/-</kbd>
                      <span className="text-xs text-slate-400">hoặc</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Ctrl + 0</kbd>
                      <span className="text-xs text-slate-400">(về 100%)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Bật / Tắt chế độ toàn màn hình Studio</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">F11</kbd>
                      <span className="text-xs text-slate-400">hoặc biểu tượng</span>
                      <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Toàn màn hình</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-700 font-medium">Đóng cửa sổ / Hộp thoại đang mở</span>
                    <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800">Esc</kbd>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 leading-relaxed">
                💡 <span className="font-semibold">Mẹo sư phạm:</span> Bạn có thể thu gọn thanh soạn thảo bằng nút <strong>Thu gọn</strong> để đọc toàn màn hình trước khi nhấn <strong>In Ngay</strong>.
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-version Exam Variants Shuffle Modal */}
      {isVariantsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-md">
                  <Shuffle className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">
                    Tạo Nhiều Mã Đề Thi Hoán Vị (Exam Variants Generator)
                  </h3>
                  <p className="text-xs text-purple-200">
                    Xáo trộn ngẫu nhiên thứ tự câu hỏi và tự động gán mã đề khảo thí chuẩn sư phạm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVariantsModalOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-xs">
                <div>
                  <label className="block font-semibold text-purple-950 mb-1">
                    Số lượng mã đề cần tạo:
                  </label>
                  <select
                    value={variantCount}
                    onChange={(e) => setVariantCount(Number(e.target.value))}
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[2, 3, 4, 6, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} mã đề thi
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-purple-950 mb-1">
                    Mã đề bắt đầu (ví dụ: 101, 201, 357...):
                  </label>
                  <input
                    type="text"
                    value={variantPrefix}
                    onChange={(e) => setVariantPrefix(e.target.value)}
                    placeholder="101"
                    className="w-full bg-white border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Phát hiện câu hỏi: <span className="font-mono font-bold text-slate-800">{(rawLatexCode?.match(/\\begin\{ex\}/g) || []).length}</span> câu trong đề gốc
                </div>
                <button
                  onClick={handleGenerateExamVariants}
                  disabled={isGeneratingVariants}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>{isGeneratingVariants ? "Đang xáo đề..." : "Tiến Hành Trộn Đề"}</span>
                </button>
              </div>

              {/* Generated Variants List */}
              {generatedVariants.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      Danh sách các mã đề đã tạo ({generatedVariants.length}):
                    </span>
                    <button
                      onClick={() => {
                        // Download all variants as zip or individual tex
                        generatedVariants.forEach((v) => {
                          const blob = new Blob([v.latex], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${(headerConfig?.exam_name || "de_thi").replace(/[/\\?%*:|"<>]/g, "_")}_Ma_${v.code}.tex`;
                          a.click();
                          URL.revokeObjectURL(url);
                        });
                        showToast(`Đã xuất ${generatedVariants.length} file .tex cho toàn bộ mã đề!`, "success");
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về tất cả ({generatedVariants.length} file .tex)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {generatedVariants.map((v, i) => (
                      <div
                        key={v.code}
                        onClick={() => setSelectedVariantPreview(i)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedVariantPreview === i
                            ? "border-purple-600 bg-purple-50 shadow-sm ring-2 ring-purple-400"
                            : "border-slate-200 bg-slate-50 hover:bg-white hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-purple-900 text-sm">
                            Mã {v.code}
                          </span>
                          {i === 0 && (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-medium">
                              Gốc
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {v.questionsCount} câu hỏi
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Variant Detail Actions */}
                  {selectedVariantPreview !== null && generatedVariants[selectedVariantPreview] && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-800">
                          Đang chọn xem: <span className="font-mono text-purple-700 font-bold">Mã đề {generatedVariants[selectedVariantPreview].code}</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              const targetLatex = generatedVariants[selectedVariantPreview].latex;
                              pushToLatexHistory(targetLatex);
                              setRawLatexCode(targetLatex);
                              setIsDirty(true);
                              setHeaderConfig((prev: any) => ({
                                ...prev,
                                exam_code: `Mã đề: ${generatedVariants[selectedVariantPreview].code}`
                              }));
                              setIsVariantsModalOpen(false);
                              showToast(`Đã nạp mã đề ${generatedVariants[selectedVariantPreview].code} vào Studio Editor!`, "success");
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          >
                            Nạp vào Editor để xuất bản
                          </button>
                          <button
                            onClick={() => {
                              const v = generatedVariants[selectedVariantPreview];
                              const blob = new Blob([v.latex], { type: "text/plain;charset=utf-8" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `De_thi_Ma_${v.code}.tex`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải .tex mã này</span>
                          </button>
                        </div>
                      </div>
                      <pre className="text-[10px] font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {generatedVariants[selectedVariantPreview].latex.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setIsVariantsModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Score Rescaling & Rebalance Modal */}
      {isScaleScoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">⚖️</span>
                <div>
                  <h3 className="font-bold text-sm">Quy Đổi & Cân Bằng Thang Điểm Khảo Thí</h3>
                  <p className="text-[11px] text-indigo-200">Chuẩn hóa thang điểm 10, 20 hoặc tự chọn theo tỷ lệ sư phạm</p>
                </div>
              </div>
              <button
                onClick={() => setIsScaleScoreModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Thang điểm mục tiêu:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetScaleScore(val)}
                      className={`py-1.5 rounded-lg border font-bold text-xs transition-all ${
                        targetScaleScore === val
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {val} điểm
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-medium">Hoặc nhập điểm tự chọn:</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.5"
                    value={targetScaleScore}
                    onChange={(e) => setTargetScaleScore(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded-lg font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600 font-bold">điểm</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Phương thức phân bổ điểm:
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setScaleMode("proportional")}
                    className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                      scaleMode === "proportional"
                        ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scaleMode"
                      checked={scaleMode === "proportional"}
                      onChange={() => setScaleMode("proportional")}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2.5 text-left">
                      <span className="font-bold text-slate-800 block text-xs">
                        Tỷ lệ thuận theo điểm hiện tại (Khuyên dùng)
                      </span>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        Giữ nguyên tỷ trọng phân hóa (câu khó nhiều điểm hơn, câu dễ ít điểm hơn).
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setScaleMode("equal")}
                    className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                      scaleMode === "equal"
                        ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scaleMode"
                      checked={scaleMode === "equal"}
                      onChange={() => setScaleMode("equal")}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="ml-2.5 text-left">
                      <span className="font-bold text-slate-800 block text-xs">
                        Chia đều điểm cho mọi câu hỏi
                      </span>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        Mỗi câu hỏi có số điểm bằng nhau ({items.length > 0 ? (targetScaleScore / items.length).toFixed(2) : 0}đ/câu).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status Comparison */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số lượng câu hỏi:</span>
                  <span className="font-bold text-slate-800 font-mono">{items.length} câu</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Tổng điểm hiện tại:</span>
                  <span className="font-bold text-amber-700 font-mono">{currentTotalScore.toFixed(2)} điểm</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-1.5">
                  <span className="font-bold text-indigo-900">Tổng điểm sau quy đổi:</span>
                  <span className="font-extrabold text-indigo-700 font-mono text-sm">{targetScaleScore.toFixed(2)} điểm</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsScaleScoreModalOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200/60"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApplyScoreRescaling}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <span>Áp dụng quy đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Question Modal */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Thêm Câu Hỏi Mới Vào Đề Thi</h3>
              </div>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Question Type & Difficulty & Points */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dạng câu hỏi</label>
                  <select
                    value={newQuestionForm.question_type}
                    onChange={(e: any) => setNewQuestionForm({ ...newQuestionForm, question_type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                  >
                    <option value="mcq">Trắc nghiệm 4 lựa chọn</option>
                    <option value="short_answer">Điền khuyết / Trả lời ngắn</option>
                    <option value="essay">Tự luận / Trình bày giải</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cấp độ nhận thức</label>
                  <select
                    value={newQuestionForm.difficulty}
                    onChange={(e: any) => setNewQuestionForm({ ...newQuestionForm, difficulty: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-medium focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                  >
                    <option value="nb">Nhận biết (NB)</option>
                    <option value="th">Thông hiểu (TH)</option>
                    <option value="vd">Vận dụng (VD)</option>
                    <option value="vdc">Vận dụng cao (VDC)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm số</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="10"
                    value={newQuestionForm.points}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, points: parseFloat(e.target.value) || 0.25 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium focus:ring-emerald-500 focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Question Content */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung câu hỏi (hỗ trợ LaTeX $...$ và $$...$$)</label>
                <textarea
                  rows={4}
                  value={newQuestionForm.content}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, content: e.target.value })}
                  placeholder="Ví dụ: Cho hàm số $y = f(x)$ liên tục trên $\mathbb{R}$..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              {/* MCQ Options */}
              {newQuestionForm.question_type === "mcq" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Các phương án lựa chọn (A, B, C, D)</label>
                    <span className="text-[11px] text-slate-500">Tích chọn đáp án đúng</span>
                  </div>
                  <div className="space-y-1.5">
                    {newQuestionForm.options.map((opt, idx) => (
                      <div key={opt.key} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="correct_answer_choice"
                          checked={newQuestionForm.correct_key === opt.key}
                          onChange={() => setNewQuestionForm({ ...newQuestionForm, correct_key: opt.key })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="font-bold text-xs text-slate-700 w-4">{opt.key}.</span>
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...newQuestionForm.options];
                            newOpts[idx].text = e.target.value;
                            setNewQuestionForm({ ...newQuestionForm, options: newOpts });
                          }}
                          placeholder={`Nội dung phương án ${opt.key}`}
                          className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution / Explanation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lời giải chi tiết / Hướng dẫn chấm (Tùy chọn)</label>
                <textarea
                  rows={2}
                  value={newQuestionForm.solution}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, solution: e.target.value })}
                  placeholder="Hướng dẫn giải chi tiết phục vụ barem đáp án..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-2">
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCustomQuestion}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-200 flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Vào Đề Thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Export Package Modal */}
      {isExportPackageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Package className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-bold text-sm">Xuất Bản Trọn Gói Hồ Sơ Khảo Thí (Exam Package)</h3>
                  <p className="text-[11px] text-indigo-200">Bộ tài liệu hoàn chỉnh cho Hội đồng thi & Giáo viên</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportPackageModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">{headerConfig.exam_name || "Đề Thi Khảo Thí"}</span>
                  <span className="text-[11px] text-slate-500">Mã đề: {headerConfig.exam_code || "101"} • {items.length} câu • {currentTotalScore.toFixed(2)} điểm</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold text-[10px]">VINH PHÁT Edu</span>
              </div>

              <div className="space-y-2.5">
                <label className="font-bold text-slate-700 block">Chọn các tài liệu thành phần cần xuất bản:</label>
                
                <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportPackageOptions.includeDocx}
                    onChange={(e) => setExportPackageOptions({ ...exportPackageOptions, includeDocx: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 block">1. Đề thi Word (.docx) chuẩn OMML</span>
                    <span className="text-slate-500 text-[11px]">Công thức toán tự nhiên Office Math, không vỡ bảng, sẵn sàng chỉnh sửa.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportPackageOptions.includePdf}
                    onChange={(e) => setExportPackageOptions({ ...exportPackageOptions, includePdf: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 block">2. Đề thi PDF in ấn chuẩn A4 (TeX Live)</span>
                    <span className="text-slate-500 text-[11px]">Bản in độ phân giải cao, ngắt trang sư phạm, không phụ thuộc font máy in.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportPackageOptions.includeAnswerKeyDocx}
                    onChange={(e) => setExportPackageOptions({ ...exportPackageOptions, includeAnswerKeyDocx: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 block">3. Bảng đáp án & Lời giải chi tiết (Hướng dẫn chấm)</span>
                    <span className="text-slate-500 text-[11px]">Bảng ma trận phương án đúng và thang điểm từng bước cho giám khảo.</span>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={exportPackageOptions.includePassportDocx}
                    onChange={(e) => setExportPackageOptions({ ...exportPackageOptions, includePassportDocx: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-slate-800 block">4. Hồ sơ kỹ thuật & Phiếu thẩm định sư phạm</span>
                    <span className="text-slate-500 text-[11px]">Biên bản bàn giao chữ ký giám thị và ma trận phân bố 4 cấp độ nhận thức.</span>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
                <span>💡</span>
                <span>Hệ thống tự động đóng gói các tệp được chọn và kích hoạt tải lần lượt về máy của thầy cô.</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center space-x-2">
              <button
                onClick={() => setIsExportPackageModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 font-bold rounded-xl text-xs transition-all"
              >
                Đóng
              </button>
              <button
                onClick={async () => {
                  setIsExportPackageModalOpen(false);
                  showToast("Đang chuẩn bị gói khảo thí...", "info");
                  if (exportPackageOptions.includeDocx) {
                    await handleDownload("docx");
                  }
                  if (exportPackageOptions.includePdf) {
                    await handleDownload("pdf");
                  }
                  if (exportPackageOptions.includePassportDocx) {
                    setIsExamPassportModalOpen(true);
                  }
                }}
                disabled={isExporting !== null || (!exportPackageOptions.includeDocx && !exportPackageOptions.includePdf && !exportPackageOptions.includeAnswerKeyDocx && !exportPackageOptions.includePassportDocx)}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-200 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Bắt Đầu Xuất Trọn Gói</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Passport & Pedagogical Specification Modal */}
      {isExamPassportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ScrollText className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm">Hồ Sơ Kỹ Thuật & Thẩm Định Sư Phạm Đề Thi</h3>
                  <p className="text-[11px] text-amber-200">Biên bản bàn giao và đặc tả ma trận khảo thí VINH PHÁT Platform</p>
                </div>
              </div>
              <button
                onClick={() => setIsExamPassportModalOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Exam Info Card */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block uppercase">Cơ sở / Trường</span>
                  <span className="font-bold text-slate-800">{headerConfig.school_name || "VINH PHÁT Edu"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block uppercase">Môn Khảo Thí</span>
                  <span className="font-bold text-slate-800">{headerConfig.subject || "Toán Học"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block uppercase">Mã Đề Thi</span>
                  <span className="font-bold text-slate-800 font-mono text-indigo-700">{headerConfig.exam_code || "101"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block uppercase">Thời Gian Làm Bài</span>
                  <span className="font-bold text-slate-800">{headerConfig.duration_minutes || 90} phút</span>
                </div>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Tổng Câu Hỏi</span>
                  <span className="text-xl font-extrabold text-slate-800">{items.length}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Thang Điểm Thiết Kế</span>
                  <span className="text-xl font-extrabold text-indigo-700">{currentTotalScore.toFixed(2)}đ</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Tình Trạng Khảo Thí</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    Đạt Chuẩn In A4
                  </span>
                </div>
              </div>

              {/* Cognitive Distribution Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3.5 py-2 font-bold text-slate-800 text-[11px] flex justify-between">
                  <span>Phân Bố Độ Khó / Cấp Độ Nhận Thức</span>
                  <span className="text-slate-500 font-normal">Tỷ trọng khảo thí</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { key: "NB", label: "Nhận biết", color: "text-emerald-700 bg-emerald-50" },
                    { key: "TH", label: "Thông hiểu", color: "text-blue-700 bg-blue-50" },
                    { key: "VD", label: "Vận dụng", color: "text-amber-700 bg-amber-50" },
                    { key: "VDC", label: "Vận dụng cao", color: "text-rose-700 bg-rose-50" },
                  ].map((lvl) => {
                    const count = items.filter((it) => (it.problem_snapshot?.cognitive_level || "TH") === lvl.key).length;
                    const score = items
                      .filter((it) => (it.problem_snapshot?.cognitive_level || "TH") === lvl.key)
                      .reduce((sum, it) => sum + (it.points || 0), 0);
                    const pct = currentTotalScore > 0 ? ((score / currentTotalScore) * 100).toFixed(1) : "0";
                    return (
                      <div key={lvl.key} className="px-3.5 py-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${lvl.color}`}>{lvl.key}</span>
                          <span className="font-semibold text-slate-700">{lvl.label}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-600 font-medium">{count} câu ({score.toFixed(2)}đ)</span>
                          <span className="w-12 text-right font-bold text-slate-800">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality & Security Assurance Check */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                <span className="font-bold text-emerald-900 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cam Kết Kiểm Duyệt & Bản Quyền Sư Phạm</span>
                </span>
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  Đề thi được biên soạn và kiểm duyệt theo quy chuẩn sư phạm hệ thống VINH PHÁT. Đảm bảo cấu trúc trắc nghiệm khách quan chuẩn OMML, công thức LaTeX đồng nhất và sẵn sàng cho công tác in ấn nhân bản.
                </p>
              </div>

              {/* Proctor & Review Signatures */}
              <div className="pt-2 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <span className="font-bold text-slate-800 text-[11px] block">Người Thẩm Định Chuyên Môn</span>
                  <span className="text-[10px] text-slate-400 italic block mb-8">(Ký và ghi rõ họ tên)</span>
                  <div className="border-t border-slate-300 mx-6 pt-1 text-[10px] text-slate-500">Giáo viên phụ trách môn</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <span className="font-bold text-slate-800 text-[11px] block">Lãnh Đạo Hội Đồng Thi</span>
                  <span className="text-[10px] text-slate-400 italic block mb-8">(Ký và đóng dấu duyệt in)</span>
                  <div className="border-t border-slate-300 mx-6 pt-1 text-[10px] text-slate-500">Ban Giám Hiệu / TT Khảo Thí</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all text-xs flex items-center space-x-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Hồ Sơ Kỹ Thuật</span>
              </button>
              <button
                onClick={() => setIsExamPassportModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Actions Modal */}
      {isBatchActionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-bold text-sm">Tác Vụ Hàng Loạt ({selectedItemIds.length} câu đã chọn)</h3>
                  <p className="text-[11px] text-indigo-200">Áp dụng thay đổi đồng thời cho nhiều câu hỏi</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchActionModalOpen(false)}
                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-xs text-slate-700">
              {/* Option 1: Batch Set Difficulty */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>🎯 1. Đồng bộ mức độ nhận thức / độ khó:</span>
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: "NB", label: "Nhận biết", color: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100" },
                    { key: "TH", label: "Thông hiểu", color: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100" },
                    { key: "VD", label: "Vận dụng", color: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100" },
                    { key: "VDC", label: "VDC", color: "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100" },
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      onClick={() => handleApplyBatchDifficulty(lvl.key)}
                      className={`px-2 py-1.5 rounded-lg border text-center font-bold transition-all ${lvl.color}`}
                    >
                      {lvl.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Batch Set Points */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>⚖️ 2. Gán điểm số đồng loạt:</span>
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="10"
                    value={batchPointsDelta}
                    onChange={(e) => setBatchPointsDelta(parseFloat(e.target.value) || 0.25)}
                    className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <span className="text-slate-500 font-semibold">điểm / câu</span>
                  <button
                    onClick={() => handleApplyBatchPoints(batchPointsDelta)}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-xs"
                  >
                    Áp dụng
                  </button>
                </div>
                <div className="flex items-center space-x-1.5 pt-1">
                  {[0.2, 0.25, 0.5, 1.0].map((pt) => (
                    <button
                      key={pt}
                      onClick={() => {
                        setBatchPointsDelta(pt);
                        handleApplyBatchPoints(pt);
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 font-semibold text-[10px] transition-all"
                    >
                      {pt}đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Batch Delete */}
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800 flex items-center space-x-1">
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>3. Xóa các câu đã chọn khỏi đề thi</span>
                  </span>
                  <button
                    onClick={handleApplyBatchDelete}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all shadow-xs text-xs"
                  >
                    Xóa {selectedItemIds.length} câu
                  </button>
                </div>
                <p className="text-[10px] text-rose-600">
                  Lưu ý: Thao tác sẽ gỡ bỏ {selectedItemIds.length} câu hỏi ra khỏi đề thi hiện tại.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedItemIds([])}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-bold transition-all text-xs"
              >
                Hủy chọn tất cả
              </button>
              <button
                onClick={() => setIsBatchActionModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-all text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Print Preflight & Options Modal */}
      {isPrintConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">Thiết Lập In Đề Thi Chuẩn Sư Phạm A4</h3>
                  <p className="text-[11px] text-emerald-200">Tối ưu bản in cho máy in trường học & phòng thi khảo thí</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintConfigModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              {/* Exam Info Card */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-900 font-bold block text-xs">
                    {headerConfig.school_name || "Trường THPT"} — {headerConfig.subject || "Môn thi"}
                  </span>
                  <span className="text-[11px] text-emerald-700 block">
                    Mã đề: <strong className="font-mono">{headerConfig.exam_code || "101"}</strong> | Thời gian: {headerConfig.duration_minutes || "90"} phút
                  </span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-800 font-bold text-[11px]">
                    {items.length} câu hỏi
                  </span>
                </div>
              </div>

              {/* Print Preferences */}
              <div className="space-y-3">
                <label className="block text-slate-700 font-bold">Tùy chọn bổ trợ phòng thi:</label>

                <label
                  onClick={() => setIncludeStudentPledge((prev) => !prev)}
                  className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    includeStudentPledge
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeStudentPledge}
                    onChange={(e) => setIncludeStudentPledge(e.target.checked)}
                    className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-2.5 text-left">
                    <span className="font-bold text-slate-800 block text-xs">
                      Cam kết kỷ luật phòng thi & chữ ký giám thị
                    </span>
                    <span className="text-[11px] text-slate-500 leading-normal block">
                      In thêm dòng: &quot;Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm&quot; kèm ô ký nhận.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setIncludeAnswerKeyInPrint((prev) => !prev)}
                  className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    includeAnswerKeyInPrint
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includeAnswerKeyInPrint}
                    onChange={(e) => setIncludeAnswerKeyInPrint(e.target.checked)}
                    className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-2.5 text-left">
                    <span className="font-bold text-slate-800 block text-xs">
                      Đính kèm Bảng đáp án thu nhỏ ở trang cuối
                    </span>
                    <span className="text-[11px] text-slate-500 leading-normal block">
                      Dành riêng cho giáo viên phục vụ việc chấm thi nhanh (không in cho học sinh).
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setPrintPageNumbering((prev) => !prev)}
                  className={`flex items-start p-2.5 rounded-xl border cursor-pointer transition-all ${
                    printPageNumbering
                      ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={printPageNumbering}
                    onChange={(e) => setPrintPageNumbering(e.target.checked)}
                    className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="ml-2.5 text-left">
                    <span className="font-bold text-slate-800 block text-xs">
                      Đánh số trang khảo thí chuẩn (Trang X / Y)
                    </span>
                    <span className="text-[11px] text-slate-500 leading-normal block">
                      Tự động gán footer chân trang kiểm soát số trang in, tránh thất lạc trang thi.
                    </span>
                  </div>
                </label>
              </div>

              {/* Print Instruction notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <span>💡 Khuyến nghị khi bấm lệnh In:</span>
                </div>
                <p>
                  1. Chọn kích thước giấy: <strong>Khổ A4</strong>.<br />
                  2. Lề trang (Margins): Chọn <strong>Tối thiểu (Minimum)</strong> hoặc <strong>Mặc định (Default)</strong>.<br />
                  3. Bật tùy chọn: <strong>In đồ họa nền (Background graphics)</strong> để hiển thị watermark và khung đề đầy đủ.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Nhấn <strong>Enter</strong> hoặc nút xanh để mở trình in
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPrintConfigModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-200/60"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrintConfigModalOpen(false);
                    // Open browser native print dialog
                    setTimeout(() => {
                      window.print();
                    }, 200);
                  }}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Xác Nhận & In Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <ExamSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        headerConfig={headerConfig}
        setHeaderConfig={setHeaderConfig}
        layoutKnobs={layoutKnobs}
        setLayoutKnobs={setLayoutKnobs}
        onSaveAndApply={(h, k) => {
          setHeaderConfig(h);
          setLayoutKnobs(k);
          compileLivePreview(items, k, activeMode, h);
        }}
        applyPresetHeader={(key) => {
          if (key === "vinhphat") {
            setHeaderConfig((prev: any) => ({
              ...prev,
              governing_body: "TRUNG TÂM GIÁO DỤC VINH PHÁT",
              department_or_school: "BAN CHUYÊN MÔN TOÁN KHẢO THÍ",
              exam_name: "KỲ THI CHỌN HỌC SINH GIỎI TOÁN THCS CẤP TỈNH",
              subject_title: "Môn thi: TOÁN HỌC",
              academic_year: "Năm học: 2026 - 2027",
              duration_minutes: 150,
              exam_code: "ĐỀ CHÍNH THỨC - MÃ 101",
              show_sbd_box: true,
            }));
          }
        }}
      />
    </div>
  );
}
