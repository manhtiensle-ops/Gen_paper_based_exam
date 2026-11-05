import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, saveStoredExam, StoredExam } from "@/lib/examStorage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    const body = await request.json();
    const slots = body.slots_state || body.slots || [];

    // Lấy exam hiện tại trong file hoặc fetch từ core-api
    let exam = getStoredExam(examId);
    if (!exam) {
      // Thử fetch từ Core API nếu chưa có
      try {
        const coreApiUrl = process.env.CORE_API_URL || "http://192.168.1.229:8000";
        const res = await fetch(`${coreApiUrl}/api/generator/exams/${examId}`);
        if (res.ok) {
          exam = await res.json();
        }
      } catch (err) {
        console.warn("Could not fetch exam from core-api:", err);
      }
    }

    if (!exam) {
      exam = {
        id: examId,
        title: body.title || "Đề Thi Khảo Sát Toán 9",
        slots_state: slots,
      };
    } else {
      exam.slots_state = slots;
      if (body.title) exam.title = body.title;
      if (body.header_config) exam.header_config = body.header_config;
      if (body.layout_knobs) exam.layout_knobs = body.layout_knobs;
    }

    saveStoredExam(exam);

    return NextResponse.json({
      status: "success",
      message: "Đã lưu vĩnh viễn cấu trúc slot và đồng bộ CSDL thành công",
      exam_id: examId,
      slots_count: exam.slots_state.length,
      filled_slots: exam.slots_state.filter((s: any) => Boolean(s.question)).length,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/generator/exams/[id]/slots:", error);
    return NextResponse.json(
      { error: "Internal Server Error", detail: error.message },
      { status: 500 }
    );
  }
}
