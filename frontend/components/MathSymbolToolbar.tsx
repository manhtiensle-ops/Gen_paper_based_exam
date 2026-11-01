"use client";

import React, { useState } from "react";
import {
  Calculator,
  Sigma,
  Shapes,
  Grid3X3,
  Sparkles,
  ChevronDown
} from "lucide-react";

interface MathSymbolItem {
  label: string;
  latex: string;
  display?: string;
  description?: string;
}

interface MathSymbolGroup {
  id: string;
  name: string;
  icon: React.ReactNode;
  symbols: MathSymbolItem[];
}

interface Props {
  onInsert: (latexSnippet: string) => void;
  className?: string;
}

const SYMBOL_GROUPS: MathSymbolGroup[] = [
  {
    id: "algebra",
    name: "Đại số & Phép tính",
    icon: <Calculator className="w-3.5 h-3.5" />,
    symbols: [
      { label: "a/b", latex: "\\\\frac{a}{b}", display: "a/b", description: "Phân số" },
      { label: "√x", latex: "\\\\sqrt{x}", display: "√x", description: "Căn bậc 2" },
      { label: "ⁿ√x", latex: "\\\\sqrt[n]{x}", display: "ⁿ√x", description: "Căn bậc n" },
      { label: "xⁿ", latex: "x^{n}", display: "xⁿ", description: "Lũy thừa" },
      { label: "xₙ", latex: "x_{n}", display: "xₙ", description: "Chỉ số dưới" },
      { label: "±", latex: "\\\\pm ", display: "±", description: "Cộng trừ" },
      { label: "≠", latex: "\\\\neq ", display: "≠", description: "Khác" },
      { label: "≤", latex: "\\\\le ", display: "≤", description: "Nhỏ hơn hoặc bằng" },
      { label: "≥", latex: "\\\\ge ", display: "≥", description: "Lớn hơn hoặc bằng" },
      { label: "≈", latex: "\\\\approx ", display: "≈", description: "Xấp xỉ" },
      { label: "×", latex: "\\\\times ", display: "×", description: "Nhân" },
      { label: "÷", latex: "\\\\div ", display: "÷", description: "Chia" },
      { label: "|x|", latex: "|x|", display: "|x|", description: "Trị tuyệt đối" },
    ]
  },
  {
    id: "calculus",
    name: "Giải tích & Giới hạn",
    icon: <Sigma className="w-3.5 h-3.5" />,
    symbols: [
      { label: "∫ f(x)dx", latex: "\\\\int f(x)\\\\,dx", display: "∫", description: "Tích phân bất định" },
      { label: "∫ₐᵇ f(x)dx", latex: "\\\\int_{a}^{b} f(x)\\\\,dx", display: "∫ₐᵇ", description: "Tích phân xác định" },
      { label: "lim", latex: "\\\\lim_{x \\\\to x_0} f(x)", display: "lim", description: "Giới hạn hàm số" },
      { label: "∑", latex: "\\\\sum_{i=1}^{n}", display: "∑", description: "Tổng sigma" },
      { label: "∏", latex: "\\\\prod_{i=1}^{n}", display: "∏", description: "Tích số" },
      { label: "df/dx", latex: "\\\\frac{df}{dx}", display: "df/dx", description: "Đạo hàm" },
      { label: "f'(x)", latex: "f'(x)", display: "f'", description: "Đạo hàm cấp 1" },
      { label: "f''(x)", latex: "f''(x)", display: "f''", description: "Đạo hàm cấp 2" },
      { label: "∞", latex: "\\\\infty", display: "∞", description: "Vô cực" },
      { label: "ln(x)", latex: "\\\\ln(x)", display: "ln", description: "Logarit tự nhiên" },
      { label: "logₐ(b)", latex: "\\\\log_{a}(b)", display: "log", description: "Logarit cơ số a" },
    ]
  },
  {
    id: "trigonometry",
    name: "Lượng giác",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    symbols: [
      { label: "sin", latex: "\\\\sin(x)", display: "sin", description: "Sin" },
      { label: "cos", latex: "\\\\cos(x)", display: "cos", description: "Cos" },
      { label: "tan", latex: "\\\\tan(x)", display: "tan", description: "Tan" },
      { label: "cot", latex: "\\\\cot(x)", display: "cot", description: "Cotang" },
      { label: "π", latex: "\\\\pi", display: "π", description: "Pi" },
      { label: "°", latex: "^{\\\\circ}", display: "°", description: "Độ" },
      { label: "arcsin", latex: "\\\\arcsin(x)", display: "arcsin", description: "Hàm ngược sin" },
      { label: "arccos", latex: "\\\\arccos(x)", display: "arccos", description: "Hàm ngược cos" },
      { label: "arctan", latex: "\\\\arctan(x)", display: "arctan", description: "Hàm ngược tan" },
    ]
  },
  {
    id: "geometry",
    name: "Hình học & Ký hiệu",
    icon: <Shapes className="w-3.5 h-3.5" />,
    symbols: [
      { label: "u⃗", latex: "\\\\vec{u}", display: "u⃗", description: "Vector đơn" },
      { label: "AB⃗", latex: "\\\\overrightarrow{AB}", display: "AB⃗", description: "Vector 2 điểm" },
      { label: "ABĈ", latex: "\\\\widehat{ABC}", display: "ABĈ", description: "Góc ABC" },
      { label: "Δ", latex: "\\\\Delta", display: "Δ", description: "Tam giác hoặc Delta" },
      { label: "∥", latex: "\\\\parallel", display: "∥", description: "Song song" },
      { label: "⊥", latex: "\\\\perp", display: "⊥", description: "Vuông góc" },
      { label: "∈", latex: "\\\\in", display: "∈", description: "Thuộc" },
      { label: "∉", latex: "\\\\notin", display: "∉", description: "Không thuộc" },
      { label: "⊂", latex: "\\\\subset", display: "⊂", description: "Tập con" },
      { label: "∪", latex: "\\\\cup", display: "∪", description: "Hợp" },
      { label: "∩", latex: "\\\\cap", display: "∩", description: "Giao" },
      { label: "∅", latex: "\\\\emptyset", display: "∅", description: "Tập rỗng" },
      { label: "α", latex: "\\\\alpha", display: "α", description: "Alpha" },
      { label: "β", latex: "\\\\beta", display: "β", description: "Beta" },
      { label: "θ", latex: "\\\\theta", display: "θ", description: "Theta" },
    ]
  },
  {
    id: "systems",
    name: "Hệ & Ma trận",
    icon: <Grid3X3 className="w-3.5 h-3.5" />,
    symbols: [
      {
        label: "Hệ 2 PT",
        latex: "\\\\begin{cases} a_1 x + b_1 y = c_1 \\\\\\\\ a_2 x + b_2 y = c_2 \\\\end{cases}",
        display: "{ 2 PT",
        description: "Hệ 2 phương trình bậc nhất"
      },
      {
        label: "Hệ 3 PT",
        latex: "\\\\begin{cases} a_1 x + b_1 y + c_1 z = d_1 \\\\\\\\ a_2 x + b_2 y + c_2 z = d_2 \\\\\\\\ a_3 x + b_3 y + c_3 z = d_3 \\\\end{cases}",
        display: "{ 3 PT",
        description: "Hệ 3 phương trình"
      },
      {
        label: "Ma trận 2x2",
        latex: "\\\\begin{pmatrix} a & b \\\\\\\\ c & d \\\\end{pmatrix}",
        display: "[2x2]",
        description: "Ma trận vuông cấp 2"
      },
      {
        label: "Ma trận 3x3",
        latex: "\\\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\\\\\ a_{21} & a_{22} & a_{23} \\\\\\\\ a_{31} & a_{32} & a_{33} \\\\end{pmatrix}",
        display: "[3x3]",
        description: "Ma trận vuông cấp 3"
      },
    ]
  }
];

export default function MathSymbolToolbar({ onInsert, className = "" }: Props) {
  const [activeGroup, setActiveGroup] = useState<string>("algebra");

  const currentGroup = SYMBOL_GROUPS.find((g) => g.id === activeGroup) || SYMBOL_GROUPS[0];

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs select-none ${className}`}>
      {/* Category selector pills */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-2 border-b border-slate-200">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
          Ký hiệu Toán:
        </span>
        {SYMBOL_GROUPS.map((group) => {
          const isActive = group.id === activeGroup;
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroup(group.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {group.icon}
              <span>{group.name}</span>
            </button>
          );
        })}
      </div>

      {/* Symbol buttons grid */}
      <div className="flex flex-wrap items-center gap-1.5">
        {currentGroup.symbols.map((sym, idx) => (
          <button
            key={idx}
            type="button"
            title={`${sym.description || sym.label} - Click để chèn`}
            onClick={() => onInsert(sym.latex)}
            className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded text-slate-800 font-mono text-[11px] shadow-2xs transition-all active:scale-95 flex items-center justify-center min-w-[28px] h-7"
          >
            {sym.display || sym.label}
          </button>
        ))}

        {/* Quick inline delimiter wrapper */}
        <div className="ml-auto flex items-center gap-1 border-l border-slate-200 pl-2">
          <button
            type="button"
            title="Bọc công thức trong dấu $ $ (Inline Math)"
            onClick={() => onInsert("$x$")}
            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-medium transition-all shadow-2xs"
          >
            $ Inline $
          </button>
          <button
            type="button"
            title="Bọc công thức khối $$ $$ (Block Math)"
            onClick={() => onInsert("$$\\\\begin{aligned}\\n\\\\end{aligned}$$")}
            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium transition-all shadow-2xs"
          >
            $$ Block $$
          </button>
        </div>
      </div>
    </div>
  );
}
