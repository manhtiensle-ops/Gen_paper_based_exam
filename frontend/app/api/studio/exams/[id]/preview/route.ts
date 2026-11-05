import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, convertExamSlotsToStudioItems } from "@/lib/examStorage";

const EXPORT_SERVICE_URL = process.env.EXPORT_SERVICE_URL || "http://192.168.1.229:8001";
const CORE_API_URL = process.env.CORE_API_URL || "http://192.168.1.229:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    const body = await request.json();
    const stored = getStoredExam(examId);

    // Chuẩn bị items: ưu tiên lấy từ stored exam (có đủ Câu 1, Câu 2 đã lấp)
    let itemsPayload: any[] = [];
    if (stored && stored.slots_state && stored.slots_state.some((s) => Boolean(s.question))) {
      const items = convertExamSlotsToStudioItems(stored);
      itemsPayload = items.map((it) => ({
        id: String(it.id),
        display_label: it.display_label,
        max_points: Number(it.max_points || 3.0),
        problem_snapshot: it.problem_snapshot,
        rubric_data: it.rubric_data,
      }));
    } else {
      // Fallback gọi sang Core API để lấy items
      try {
        const itemRes = await fetch(`${CORE_API_URL}/api/studio/exams/${examId}/items`);
        if (itemRes.ok) {
          const rawItems = await itemRes.json();
          itemsPayload = rawItems.map((it: any) => ({
            id: String(it.id),
            display_label: it.display_label,
            max_points: Number(it.max_points || 3.0),
            problem_snapshot: it.problem_snapshot,
            rubric_data: it.rubric_data,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch items from core-api:", err);
      }
    }

    const headerConfig = body.header_config || stored?.header_config || {
      province: "SỞ GIÁO DỤC VÀ ĐÀO TẠO",
      school: "TRUNG TÂM GIÁO DỤC VINH PHÁT",
      exam_name: "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9",
      subject: "MÔN THI: TOÁN HỌC",
      duration_minutes: 150,
      paper_code: "101",
    };

    const layoutKnobs = body.layout_knobs || stored?.layout_knobs || {
      margin_top_cm: 1.8,
      margin_bottom_cm: 1.8,
      margin_left_cm: 2.0,
      margin_right_cm: 1.8,
      font_size_pt: 12,
      line_spread: 1.15,
      item_gap_pt: 10,
      math_skip_pt: 6,
    };

    const mode = body.mode || "EXAM";

    // Gửi thẳng tới Export Service XeLaTeX
    const exportRes = await fetch(`${EXPORT_SERVICE_URL}/api/export/latex/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: examId,
        title: stored?.title || "Đề Thi Khảo Sát Toán 9",
        header_config: headerConfig,
        layout_knobs: layoutKnobs,
        items: itemsPayload,
        mode: mode,
      }),
    });

    if (exportRes.ok) {
      const exportData = await exportRes.json();
      return NextResponse.json(exportData);
    } else {
      const errText = await exportRes.text();
      console.warn("Export service preview failed, fallback to core-api:", errText);
      // Fallback gọi core-api
      const fallbackRes = await fetch(`${CORE_API_URL}/api/studio/exams/${examId}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const fallbackData = await fallbackRes.json();
      return NextResponse.json(fallbackData, { status: fallbackRes.status });
    }
  } catch (error: any) {
    console.error("Error in POST /api/studio/exams/[id]/preview:", error);
    return NextResponse.json(
      { error: "Preview generation failed", detail: error.message },
      { status: 500 }
    );
  }
}
