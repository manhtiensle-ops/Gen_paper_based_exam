"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Copy,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  Sliders,
  BookOpen,
} from "lucide-react";

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
  description?: string;
  grade: number;
  is_preset?: boolean;
  target_total_score: number;
  duration_minutes: number;
  sections_config: Section[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueprint: (blueprintId: string) => void;
}

const TOPICS = [
  { value: "ALGEBRA", label: "Đại số & Căn thức" },
  { value: "NUMBER_THEORY", label: "Số học & Số nguyên" },
  { value: "PLANE_GEOMETRY", label: "Hình học phẳng" },
  { value: "SOLID_GEOMETRY", label: "Hình không gian" },
  { value: "INEQUALITY_EXTREMA", label: "Bất đẳng thức & Cực trị" },
  { value: "COMBINATORICS_PROBABILITY", label: "Tổ hợp & Dirichlet" },
  { value: "REAL_WORLD_MATH", label: "Toán thực tế" },
];

const DIFFICULTIES = [
  { value: "EASY", label: "Cơ bản (EASY)" },
  { value: "MEDIUM", label: "Vận dụng (MEDIUM)" },
  { value: "HARD", label: "Vận dụng cao (HARD)" },
  { value: "OLYMPIAD", label: "Học sinh giỏi (OLYMPIAD)" },
];

export default function BlueprintBuilderModal({
  isOpen,
  onClose,
  onSelectBlueprint,
}: Props) {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBpId, setSelectedBpId] = useState<string | null>(null);

  // Form State for editing
  const [editingBp, setEditingBp] = useState<Blueprint | null>(null);
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load blueprints
  const fetchBlueprints = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generator/blueprints");
      if (res.ok) {
        const data = await res.json();
        setBlueprints(data);
        if (data.length > 0 && !selectedBpId) {
          const first = data[0];
          setSelectedBpId(first.id);
          setEditingBp(JSON.parse(JSON.stringify(first)));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBlueprints();
    }
  }, [isOpen]);

  const selectBlueprintToView = (bp: Blueprint) => {
    setSelectedBpId(bp.id || null);
    setEditingBp(JSON.parse(JSON.stringify(bp)));
  };

  // Tính tổng điểm hiện tại của các slot
  const calculateCurrentTotalPoints = () => {
    if (!editingBp) return 0;
    let total = 0;
    editingBp.sections_config.forEach((sec) => {
      sec.slots.forEach((s) => {
        total += parseFloat(String(s.points || 0));
      });
    });
    return Math.round(total * 100) / 100;
  };

  // Thêm slot câu hỏi mới
  const handleAddSlot = (sectionIdx: number) => {
    if (!editingBp) return;
    const clone = { ...editingBp };
    const sec = clone.sections_config[sectionIdx];
    const newIdx = sec.slots.length + 1;
    sec.slots.push({
      slot_index: newIdx,
      points: sec.section_type === "SHORT_ANSWER" ? 0.5 : 2.0,
      main_topic: "ALGEBRA",
      difficulty: "HARD",
      structure_type: "SINGLE",
      title_hint: `Câu ${sec.slots.length + 1}: Bài toán tự chọn`,
    });
    setEditingBp(clone);
  };

  // Xóa slot câu hỏi
  const handleDeleteSlot = (sectionIdx: number, slotIdx: number) => {
    if (!editingBp) return;
    const clone = { ...editingBp };
    const sec = clone.sections_config[sectionIdx];
    if (sec.slots.length <= 1) return;
    sec.slots = sec.slots.filter((_, idx) => idx !== slotIdx);
    // Cập nhật lại slot_index
    sec.slots.forEach((s, idx) => {
      s.slot_index = idx + 1;
    });
    setEditingBp(clone);
  };

  // Đổi thứ tự slot
  const handleMoveSlot = (sectionIdx: number, slotIdx: number, direction: "up" | "down") => {
    if (!editingBp) return;
    const clone = { ...editingBp };
    const sec = clone.sections_config[sectionIdx];
    if (direction === "up" && slotIdx === 0) return;
    if (direction === "down" && slotIdx === sec.slots.length - 1) return;

    const targetIdx = direction === "up" ? slotIdx - 1 : slotIdx + 1;
    const temp = sec.slots[slotIdx];
    sec.slots[slotIdx] = sec.slots[targetIdx];
    sec.slots[targetIdx] = temp;

    // Cập nhật lại slot_index
    sec.slots.forEach((s, idx) => {
      s.slot_index = idx + 1;
    });
    setEditingBp(clone);
  };

  // Nhân bản khung mẫu thành khung cá nhân
  const handleCloneBlueprint = async (bpId?: string) => {
    const idToClone = bpId || selectedBpId;
    if (!idToClone) return;
    try {
      const res = await fetch(`/api/generator/blueprints/${idToClone}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        const cloned = await res.json();
        setSaveMessage(`Đã nhân bản thành công: "${cloned.name}"`);
        await fetchBlueprints();
        selectBlueprintToView(cloned);
        setActiveTab("custom");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (e) {
      alert("Lỗi khi nhân bản khung ma trận");
    }
  };

  // Lưu chỉnh sửa khung ma trận
  const handleSaveBlueprint = async () => {
    if (!editingBp) return;
    setSaving(true);
    try {
      // Nếu là khung preset hoặc chưa có id -> tạo mới khung custom
      if (editingBp.is_preset || !editingBp.id) {
        const res = await fetch("/api/generator/blueprints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingBp.name.includes("Bản sao") ? editingBp.name : `Tùy biến - ${editingBp.name}`,
            description: editingBp.description || "Khung ma trận tùy biến cá nhân",
            grade: editingBp.grade || 9,
            is_preset: false,
            target_total_score: calculateCurrentTotalPoints(),
            duration_minutes: editingBp.duration_minutes || 150,
            sections_config: editingBp.sections_config,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setSaveMessage("Đã lưu khung ma trận tùy biến mới!");
          await fetchBlueprints();
          selectBlueprintToView(created);
          setActiveTab("custom");
        }
      } else {
        // Cập nhật khung custom đang có
        const res = await fetch(`/api/generator/blueprints/${editingBp.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingBp.name,
            description: editingBp.description,
            grade: editingBp.grade,
            target_total_score: calculateCurrentTotalPoints(),
            duration_minutes: editingBp.duration_minutes,
            sections_config: editingBp.sections_config,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setSaveMessage("Đã cập nhật khung ma trận!");
          await fetchBlueprints();
          selectBlueprintToView(updated);
        }
      }
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      alert("Lỗi khi lưu khung ma trận");
    } finally {
      setSaving(false);
    }
  };

  // Xóa khung tùy biến
  const handleDeleteCustomBlueprint = async (bpId: string) => {
    if (!confirm("Thầy cô có chắc muốn xóa khung ma trận tùy biến này?")) return;
    try {
      const res = await fetch(`/api/generator/blueprints/${bpId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchBlueprints();
      }
    } catch (e) {
      alert("Lỗi khi xóa");
    }
  };

  // Tạo khung ma trận trắng hoàn toàn
  const handleCreateBlankBlueprint = () => {
    const blank: Blueprint = {
      name: "Khung Ma Trận Tùy Biến Mới",
      description: "Khung đề thi do giáo viên tự thiết lập",
      grade: 9,
      is_preset: false,
      target_total_score: 20.0,
      duration_minutes: 150,
      sections_config: [
        {
          section_title: "BÀI THI TỰ LUẬN (20,0 điểm)",
          section_type: "ESSAY",
          slots: [
            { slot_index: 1, points: 4.0, main_topic: "ALGEBRA", difficulty: "MEDIUM", title_hint: "Bài 1: Rút gọn biểu thức & căn thức" },
            { slot_index: 2, points: 4.0, main_topic: "ALGEBRA", difficulty: "HARD", title_hint: "Bài 2: Phương trình vô tỷ" },
            { slot_index: 3, points: 3.0, main_topic: "NUMBER_THEORY", difficulty: "HARD", title_hint: "Bài 3: Số học & số chính phương" },
            { slot_index: 4, points: 6.0, main_topic: "PLANE_GEOMETRY", difficulty: "HARD", title_hint: "Bài 4: Hình học phẳng nguyên khối" },
            { slot_index: 5, points: 3.0, main_topic: "INEQUALITY_EXTREMA", difficulty: "OLYMPIAD", title_hint: "Bài 5: Bất đẳng thức cực trị" },
          ],
        },
      ],
    };
    setSelectedBpId(null);
    setEditingBp(blank);
    setActiveTab("custom");
  };

  if (!isOpen) return null;

  const currentTotal = calculateCurrentTotalPoints();
  const targetTotal = editingBp?.target_total_score || 20.0;
  const isMatch = Math.abs(currentTotal - targetTotal) <= 0.01;

  const presets = blueprints.filter((b) => b.is_preset);
  const customs = blueprints.filter((b) => !b.is_preset);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-7xl h-[92vh] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden font-sans">
        {/* HEADER MODAL */}
        <div className="h-14 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Thiết Kế & Tùy Biến Khung Ma Trận Đề Thi
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Chọn mẫu đề thi chuẩn hoặc tự do tùy biến slot câu hỏi, chủ đề và điểm số
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {saveMessage && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-bold flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY (2 COLUMNS) */}
        <div className="flex-1 flex overflow-hidden">
          {/* CỘT TRÁI (320px): DANH SÁCH KHUNG MA TRẬN */}
          <div className="w-80 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
            {/* Tabs chọn Preset vs Custom */}
            <div className="p-3 border-b border-slate-200 flex space-x-1">
              <button
                onClick={() => setActiveTab("preset")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
                  activeTab === "preset"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khung Chuẩn ({presets.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1 ${
                  activeTab === "custom"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cá Nhân ({customs.length})</span>
              </button>
            </div>

            {/* Danh sách các khung */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === "preset" ? (
                presets.map((bp) => {
                  const isSelected = selectedBpId === bp.id;
                  return (
                    <div
                      key={bp.id}
                      onClick={() => selectBlueprintToView(bp)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 shadow-xs text-indigo-950"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {bp.target_total_score || 20}đ • {bp.duration_minutes || 150}p
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          Lớp {bp.grade}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs leading-snug line-clamp-2">
                        {bp.name}
                      </h4>
                      <p className="text-[10.5pt] text-slate-500 line-clamp-2 text-[10px] leading-relaxed">
                        {bp.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <>
                  <button
                    onClick={handleCreateBlankBlueprint}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1 transition-all mb-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo Khung Ma Trận Mới</span>
                  </button>

                  {customs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      Chưa có khung ma trận cá nhân. Hãy bấm nhân bản từ Khung Chuẩn hoặc tạo mới!
                    </div>
                  ) : (
                    customs.map((bp) => {
                      const isSelected = selectedBpId === bp.id;
                      return (
                        <div
                          key={bp.id}
                          onClick={() => selectBlueprintToView(bp)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all space-y-1.5 relative group ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 shadow-xs text-indigo-950"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {bp.target_total_score || 20}đ • {bp.duration_minutes || 150}p
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (bp.id) handleDeleteCustomBlueprint(bp.id);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa khung này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="font-bold text-xs leading-snug line-clamp-2">
                            {bp.name}
                          </h4>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            {/* Footer Cột Trái: Chọn khung này cho đề thi */}
            {editingBp && editingBp.id && (
              <div className="p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => {
                    if (editingBp.id) {
                      onSelectBlueprint(editingBp.id);
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Áp Dụng Khung Này ➔</span>
                </button>
              </div>
            )}
          </div>

          {/* CỘT PHẢI: KHÔNG GIAN TÙY BIẾN CHI TIẾT TỪNG SLOT */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {editingBp ? (
              <>
                {/* Thanh cấu hình thông tin chung + Realtime Auditor */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Tên Khung Ma Trận:
                      </label>
                      <input
                        type="text"
                        value={editingBp.name}
                        onChange={(e) => setEditingBp({ ...editingBp, name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                        placeholder="Nhập tên khung ma trận..."
                      />
                    </div>

                    <div className="w-28 shrink-0">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Khối Lớp:
                      </label>
                      <select
                        value={editingBp.grade}
                        onChange={(e) => setEditingBp({ ...editingBp, grade: parseInt(e.target.value) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        <option value={9}>Toán 9</option>
                        <option value={8}>Toán 8</option>
                        <option value={7}>Toán 7</option>
                      </select>
                    </div>

                    <div className="w-32 shrink-0">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Thời Gian:
                      </label>
                      <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                        <input
                          type="number"
                          value={editingBp.duration_minutes}
                          onChange={(e) => setEditingBp({ ...editingBp, duration_minutes: parseInt(e.target.value) || 120 })}
                          className="w-16 text-xs font-bold text-slate-900 focus:outline-none text-center"
                        />
                        <span className="text-xs text-slate-500 font-semibold">phút</span>
                      </div>
                    </div>
                  </div>

                  {/* THƯỚC ĐO TỔNG ĐIỂM THỜI GIAN THỰC (REAL-TIME POINT AUDITOR) */}
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-600 font-semibold">Tổng điểm hiện tại:</span>
                      <span className="text-sm font-black font-mono text-indigo-700">
                        {currentTotal.toFixed(2)}đ
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-xs text-slate-500 font-semibold">Mục tiêu:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={editingBp.target_total_score}
                        onChange={(e) =>
                          setEditingBp({
                            ...editingBp,
                            target_total_score: parseFloat(e.target.value) || 20.0,
                          })
                        }
                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-900 text-center font-mono"
                      />
                      <span className="text-xs text-slate-500 font-bold">điểm</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isMatch ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Chuẩn điểm 100%</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Lệch {(currentTotal - targetTotal).toFixed(2)}đ</span>
                        </span>
                      )}

                      {/* Nút Clone hoặc Lưu */}
                      <button
                        onClick={() => handleCloneBlueprint()}
                        className="px-3 py-1 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                        title="Tạo bản sao độc lập của khung này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Nhân bản để sửa</span>
                      </button>

                      <button
                        onClick={handleSaveBlueprint}
                        disabled={saving}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? "Đang lưu..." : "Lưu Khung Này"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danh sách các Phần và Slots câu hỏi (Scrollable) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 sm:p-6 space-y-5 bg-slate-100/40">
                  {editingBp.sections_config.map((sec, secIdx) => (
                    <div
                      key={secIdx}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <input
                            type="text"
                            value={sec.section_title}
                            onChange={(e) => {
                              const clone = { ...editingBp };
                              clone.sections_config[secIdx].section_title = e.target.value;
                              setEditingBp(clone);
                            }}
                            className="font-extrabold text-sm text-slate-900 bg-transparent border-none focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={() => handleAddSlot(secIdx)}
                          className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm câu hỏi</span>
                        </button>
                      </div>

                      {/* Các hàng slot câu hỏi */}
                      <div className="space-y-3">
                        {sec.slots.map((slot, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                          >
                            {/* Hàng 1: Số thứ tự + Ghi chú nội dung */}
                            <div className="flex items-center space-x-2.5">
                              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center font-mono text-xs shadow-xs shrink-0">
                                {sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={slot.title_hint || ""}
                                onChange={(e) => {
                                  const clone = { ...editingBp };
                                  clone.sections_config[secIdx].slots[sIdx].title_hint = e.target.value;
                                  setEditingBp(clone);
                                }}
                                placeholder="Ghi chú nội dung câu hỏi (VD: Rút gọn căn thức, PT vô tỉ, Bài hình ý c...)"
                                className="flex-1 bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                              />
                            </div>

                            {/* Hàng 2: Dropdowns Chủ Đề + Độ Khó + Điểm Số + Nút Hành Động */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Dropdown Chủ Đề */}
                                <select
                                  value={slot.main_topic}
                                  onChange={(e) => {
                                    const clone = { ...editingBp };
                                    clone.sections_config[secIdx].slots[sIdx].main_topic = e.target.value;
                                    setEditingBp(clone);
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  {TOPICS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Dropdown Độ Khó */}
                                <select
                                  value={slot.difficulty}
                                  onChange={(e) => {
                                    const clone = { ...editingBp };
                                    clone.sections_config[secIdx].slots[sIdx].difficulty = e.target.value as any;
                                    setEditingBp(clone);
                                  }}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  {DIFFICULTIES.map((d) => (
                                    <option key={d.value} value={d.value}>
                                      {d.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center space-x-3">
                                {/* Điểm Số */}
                                <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    max="10.0"
                                    value={slot.points}
                                    onChange={(e) => {
                                      const clone = { ...editingBp };
                                      clone.sections_config[secIdx].slots[sIdx].points = parseFloat(e.target.value) || 1.0;
                                      setEditingBp(clone);
                                    }}
                                    className="w-12 bg-transparent text-xs font-bold text-indigo-700 text-center font-mono focus:outline-none"
                                  />
                                  <span className="font-bold text-slate-500 text-xs">điểm</span>
                                </div>

                                {/* Nút điều hướng thứ tự & xóa */}
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleMoveSlot(secIdx, sIdx, "up")}
                                    disabled={sIdx === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                    title="Di chuyển lên trên"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveSlot(secIdx, sIdx, "down")}
                                    disabled={sIdx === sec.slots.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                    title="Di chuyển xuống dưới"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(secIdx, sIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer ml-1"
                                    title="Xóa câu hỏi này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-3">
                <Layers className="w-12 h-12 text-slate-300" />
                <p className="text-xs">Chọn một khung ma trận ở cột bên trái để bắt đầu tùy biến</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
