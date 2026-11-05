import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, convertExamSlotsToStudioItems } from "@/lib/examStorage";

const CORE_API_URL = process.env.CORE_API_URL || "http://192.168.1.229:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const examId = params.id;
  const stored = getStoredExam(examId);

  if (stored && stored.slots_state && stored.slots_state.some((s) => Boolean(s.question))) {
    const items = convertExamSlotsToStudioItems(stored);
    const templateDoc = {
      exam_id: examId,
      title: stored.title || "Đề Thi Khảo Sát Toán 9",
      header: stored.header_config || {
        province: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
        school: "TRUNG TÂM GIÁO DỤC VINH PHÁT",
        exam_name: "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9",
        subject: "MÔN THI: TOÁN HỌC",
        duration_minutes: 150,
        paper_code: "101",
      },
      layout_knobs: stored.layout_knobs || {
        margin_top_cm: 1.8,
        margin_bottom_cm: 1.8,
        margin_left_cm: 2.0,
        margin_right_cm: 1.8,
        font_size_pt: 12,
        line_spread: 1.15,
        item_gap_pt: 10,
        math_skip_pt: 6,
      },
      items: items,
      total_points: items.reduce((acc, it) => acc + (it.max_points || 0), 0),
    };
    return NextResponse.json(templateDoc);
  }

  // Fallback proxy sang Core API
  try {
    const res = await fetch(`${CORE_API_URL}/api/studio/exams/${examId}/template-document`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e: any) {
    console.warn("Proxy template-document failed:", e.message);
  }

  return NextResponse.json({ error: "Template document not found" }, { status: 404 });
}
