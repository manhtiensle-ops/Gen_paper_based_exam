import React from "react";
import { BarChart3, Layers, Compass, BrainCircuit, Activity } from "lucide-react";

interface Slot {
  slot_index: number;
  points: number;
  main_topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "OLYMPIAD";
  structure_type?: "SINGLE" | "INDEPENDENT_PARTS" | "SHARED_STEM";
  title_hint?: string;
}

interface Section {
  section_id?: string;
  section_title: string;
  section_type: "SHORT_ANSWER" | "ESSAY" | "MULTIPLE_CHOICE";
  section_points?: number;
  slots: Slot[];
}

interface Blueprint {
  id?: string;
  name: string;
  target_total_score: number;
  duration_minutes: number;
  sections_config: Section[];
}

interface Props {
  blueprint: Blueprint | null;
  className?: string;
}

const TOPIC_LABELS: Record<string, string> = {
  ALGEBRA: "Đại số & Căn thức",
  NUMBER_THEORY: "Số học & Số nguyên",
  PLANE_GEOMETRY: "Hình học phẳng",
  SOLID_GEOMETRY: "Hình không gian",
  INEQUALITY_EXTREMA: "Bất đẳng thức & Cực trị",
  COMBINATORICS_PROBABILITY: "Tổ hợp & Dirichlet",
  REAL_WORLD_MATH: "Toán thực tế",
};

const DIFFICULTY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  EASY: { label: "Nhận biết", color: "text-emerald-700", bg: "bg-emerald-500" },
  MEDIUM: { label: "Thông hiểu", color: "text-blue-700", bg: "bg-blue-500" },
  HARD: { label: "Vận dụng", color: "text-amber-700", bg: "bg-amber-500" },
  OLYMPIAD: { label: "Vận dụng cao (HSG)", color: "text-rose-700", bg: "bg-rose-500" },
};

export default function ExamMatrixHeatmap({ blueprint, className = "" }: Props) {
  if (!blueprint || !blueprint.sections_config || blueprint.sections_config.length === 0) {
    return (
      <div className={`p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400 ${className}`}>
        Chưa có dữ liệu ma trận để hiển thị bản đồ nhiệt (Heatmap).
      </div>
    );
  }

  // Thu thập tất cả slot
  const allSlots: Slot[] = [];
  blueprint.sections_config.forEach((s) => {
    if (s.slots) allSlots.push(...s.slots);
  });

  const totalPoints = allSlots.reduce((sum, s) => sum + (Number(s.points) || 0), 0) || blueprint.target_total_score || 20;

  // 1. Phân bố theo chuyên đề (Topic Distribution)
  const topicPoints: Record<string, number> = {};
  allSlots.forEach((s) => {
    const topic = s.main_topic || "ALGEBRA";
    topicPoints[topic] = (topicPoints[topic] || 0) + (Number(s.points) || 0);
  });

  // 2. Phân bố theo độ khó (Difficulty Distribution)
  const difficultyPoints: Record<string, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    OLYMPIAD: 0,
  };
  allSlots.forEach((s) => {
    const diff = s.difficulty || "MEDIUM";
    if (difficultyPoints[diff] !== undefined) {
      difficultyPoints[diff] += Number(s.points) || 0;
    }
  });

  return (
    <div className={`p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Bản Đồ Nhiệt Ma Trận Kiến Thức</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100/70 text-indigo-700">
                Heatmap
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Tổng quan độ phủ {allSlots.length} câu hỏi • Quy mô {totalPoints} điểm
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Cột thống kê trực quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cột 1: Tỷ trọng 4 cấp độ tư duy */}
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              Cấp Độ Tư Duy
            </span>
            <span className="text-[10px] text-slate-400">Tỷ lệ % điểm</span>
          </div>

          <div className="space-y-1.5">
            {Object.entries(DIFFICULTY_MAP).map(([key, meta]) => {
              const pts = difficultyPoints[key] || 0;
              const pct = totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0;
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="font-bold text-slate-600">
                      {pts}đ ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${meta.bg} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột 2: Phân bổ chuyên đề */}
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              Phân Bổ Chuyên Đề
            </span>
            <span className="text-[10px] text-slate-400">Điểm số</span>
          </div>

          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {Object.entries(topicPoints).map(([topic, pts]) => {
              const label = TOPIC_LABELS[topic] || topic;
              const pct = totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0;
              return (
                <div key={topic} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-600 truncate max-w-[150px]">{label}</span>
                    <span className="font-bold text-slate-700">{pts}đ</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
