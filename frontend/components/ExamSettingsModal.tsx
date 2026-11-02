import React, { useState } from "react";
import {
  Settings,
  X,
  Sliders,
  ShieldCheck,
  FileText,
  Printer,
  CheckCircle2,
  Columns,
  Type,
  Minimize2,
  Maximize2
} from "lucide-react";

export interface HeaderConfig {
  governing_body?: string;
  department_or_school?: string;
  exam_name?: string;
  subject_title?: string;
  academic_year?: string;
  duration_minutes?: number;
  exam_code?: string;
  show_sbd_box?: boolean;
  watermark_text?: string;
  [key: string]: any;
}

export interface LayoutKnobs {
  font_size_pt: number;
  font_family?: "times" | "sans";
  margin_top_cm: number;
  margin_bottom_cm: number;
  margin_left_cm: number;
  margin_right_cm: number;
  line_spread: number;
  item_gap_pt: number;
  math_skip_pt: number;
  [key: string]: any;
}

interface ExamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerConfig: HeaderConfig;
  setHeaderConfig: (config: HeaderConfig) => void;
  layoutKnobs: LayoutKnobs;
  setLayoutKnobs: (knobs: LayoutKnobs) => void;
  onSaveAndApply: (header: HeaderConfig, knobs: LayoutKnobs) => void;
  applyPresetHeader: (presetKey: "vinhphat" | "hanoi" | "hcm") => void;
}

export default function ExamSettingsModal({
  isOpen,
  onClose,
  headerConfig,
  setHeaderConfig,
  layoutKnobs,
  setLayoutKnobs,
  onSaveAndApply,
  applyPresetHeader,
}: ExamSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"header" | "page" | "governance">("header");
  const [localHeader, setLocalHeader] = useState<HeaderConfig>({ ...headerConfig });
  const [localKnobs, setLocalKnobs] = useState<LayoutKnobs>({ ...layoutKnobs });

  if (!isOpen) return null;

  const handleApplyPreset = (key: "vinhphat" | "hanoi" | "hcm") => {
    applyPresetHeader(key);
    if (key === "vinhphat") {
      setLocalHeader((prev) => ({
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
    } else if (key === "hanoi") {
      setLocalHeader((prev) => ({
        ...prev,
        governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI",
        department_or_school: "TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM",
        exam_name: "KỲ THI THỬ TỐT NGHIỆP THPT QUỐC GIA 2026",
        subject_title: "Môn: TOÁN HỌC (CHUẨN BỘ GD&ĐT)",
        academic_year: "Năm học: 2025 - 2026",
        duration_minutes: 90,
        exam_code: "MÃ ĐỀ 204",
        show_sbd_box: true,
      }));
    } else if (key === "hcm") {
      setLocalHeader((prev) => ({
        ...prev,
        governing_body: "SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH",
        department_or_school: "TRƯỜNG THPT CHUYÊN LÊ HỒNG PHONG",
        exam_name: "KỲ THI HỌC SINH GIỎI THÀNH PHỐ MỞ RỘNG",
        subject_title: "Môn thi: TOÁN KHẢO THÍ",
        academic_year: "Năm học: 2026 - 2027",
        duration_minutes: 120,
        exam_code: "ĐỀ 305",
        show_sbd_box: true,
      }));
    }
  };

  const handleSave = () => {
    setHeaderConfig(localHeader);
    setLayoutKnobs(localKnobs);
    onSaveAndApply(localHeader, localKnobs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cài Đặt & Quy Chuẩn Khảo Thí</h3>
              <p className="text-xs text-slate-500">Cấu hình tiêu đề trường học, căn lề trang A4 và thông số in ấn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-6 pt-2 shrink-0 space-x-2">
          <button
            onClick={() => setActiveTab("header")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "header"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Tiêu Đề Trường & Kỳ Thi</span>
          </button>
          <button
            onClick={() => setActiveTab("page")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "page"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>2. Căn Lề & Bố Cục Trang In A4</span>
          </button>
          <button
            onClick={() => setActiveTab("governance")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "governance"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Bảo Mật & Đề Chính Thức</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "header" && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-indigo-900 shrink-0">Mẫu tiêu đề gợi ý:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("vinhphat")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-2xs transition cursor-pointer"
                >
                  🌟 TTGD VINH PHÁT
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("hanoi")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-2xs transition cursor-pointer"
                >
                  🏛️ Amsterdam Hà Nội
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("hcm")}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold shadow-2xs transition cursor-pointer"
                >
                  🏢 Lê Hồng Phong TP.HCM
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cơ quan chủ quản / Sở</label>
                  <input
                    type="text"
                    value={localHeader.governing_body || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, governing_body: e.target.value })}
                    placeholder="TRUNG TÂM GIÁO DỤC VINH PHÁT..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị / Trường ra đề</label>
                  <input
                    type="text"
                    value={localHeader.department_or_school || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, department_or_school: e.target.value })}
                    placeholder="BAN CHUYÊN MÔN TOÁN KHẢO THÍ..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên kỳ thi</label>
                <input
                  type="text"
                  value={localHeader.exam_name || ""}
                  onChange={(e) => setLocalHeader({ ...localHeader, exam_name: e.target.value })}
                  placeholder="KỲ THI CHỌN HỌC SINH GIỎI TOÁN THCS CẤP TỈNH..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Môn thi</label>
                  <input
                    type="text"
                    value={localHeader.subject_title || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, subject_title: e.target.value })}
                    placeholder="TOÁN HỌC"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={localHeader.academic_year || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, academic_year: e.target.value })}
                    placeholder="2026 - 2027"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={localHeader.duration_minutes || 120}
                    onChange={(e) => setLocalHeader({ ...localHeader, duration_minutes: Number(e.target.value) || 120 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã đề / Nhãn đề</label>
                  <input
                    type="text"
                    value={localHeader.exam_code || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, exam_code: e.target.value })}
                    placeholder="ĐỀ CHÍNH THỨC"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Dấu chìm Watermark (Bảo mật đề thi / Bản quyền):
                  </label>
                  <input
                    type="text"
                    value={localHeader.watermark_text || ""}
                    onChange={(e) => setLocalHeader({ ...localHeader, watermark_text: e.target.value })}
                    placeholder="VD: TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN - ĐỀ THI THỬ"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Để trống nếu không muốn in chìm chữ mờ trên các trang đề thi.</p>
                </div>
                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(localHeader.show_sbd_box)}
                      onChange={(e) => setLocalHeader({ ...localHeader, show_sbd_box: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <span>Hiện khung Họ tên, SBD & Phòng thi</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "page" && (
            <div className="space-y-4">
              {/* Presets Margin */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">Quy chuẩn lề A4 nhanh:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLocalKnobs((prev) => ({
                        ...prev,
                        margin_top_cm: 2.0,
                        margin_bottom_cm: 2.0,
                        margin_left_cm: 3.0,
                        margin_right_cm: 1.5,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      localKnobs.margin_left_cm === 3.0 && localKnobs.margin_top_cm === 2.0
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs ring-1 ring-indigo-200"
                        : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-bold text-xs block text-slate-900">📋 Chuẩn Nghị định 30/2020/NĐ-CP</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Trái 3cm (đóng ghim), Trên/Dưới 2cm, Phải 1.5cm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLocalKnobs((prev) => ({
                        ...prev,
                        margin_top_cm: 1.5,
                        margin_bottom_cm: 1.5,
                        margin_left_cm: 2.0,
                        margin_right_cm: 1.5,
                      }))
                    }
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      localKnobs.margin_left_cm === 2.0 && localKnobs.margin_top_cm === 1.5
                        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs ring-1 ring-indigo-200"
                        : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-bold text-xs block text-slate-900">⚡ Tiết kiệm trang in A4</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Trái 2cm, Trên/Dưới 1.5cm, Phải 1.5cm</span>
                  </button>
                </div>
              </div>

              {/* Slider controls */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-700">
                  <span className="font-bold">Cỡ chữ văn bản:</span>
                  <div className="flex gap-2">
                    {[11, 12].map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setLocalKnobs((prev) => ({ ...prev, font_size_pt: pt }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          localKnobs.font_size_pt === pt
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {pt}pt {pt === 12 ? "(Chuẩn Bộ)" : "(Gọn)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-700 pt-2">
                  <span className="font-bold">Giãn dòng (Line spacing):</span>
                  <span className="font-extrabold text-indigo-600">{localKnobs.line_spread}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.30"
                  step="0.05"
                  value={localKnobs.line_spread}
                  onChange={(e) => setLocalKnobs({ ...localKnobs, line_spread: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <div className="flex justify-between items-center text-xs text-slate-700 pt-2">
                  <span className="font-bold">Khoảng cách giữa các câu:</span>
                  <span className="font-extrabold text-indigo-600">{localKnobs.item_gap_pt}pt</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="18"
                  step="1"
                  value={localKnobs.item_gap_pt}
                  onChange={(e) => setLocalKnobs({ ...localKnobs, item_gap_pt: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === "governance" && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Quy trình bảo mật khảo thí VINH PHÁT</span>
                </div>
                <p className="leading-relaxed">
                  Đề thi được bảo vệ chống lộ đề bằng mã định danh hash và kiểm soát phiên bản. Barem điểm chấm thi tuân thủ bước chia 0.25đ chuẩn Bộ GD&ĐT.
                </p>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Định dạng file Word xuất bản:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[11px]">OMML Native Math</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Engine biên dịch bản in:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold text-[11px]">TeX Live XeLaTeX Engine</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Quy chuẩn giấy in:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-extrabold text-[11px]">ISO 216 A4 (210 x 297 mm)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu & Áp Dụng Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}
