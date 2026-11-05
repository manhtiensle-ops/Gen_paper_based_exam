import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, saveStoredExam } from "@/lib/examStorage";

const CORE_API_URL = process.env.CORE_API_URL || "http://192.168.1.229:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const examId = params.id;
  const stored = getStoredExam(examId);

  // Nếu đã có bản lưu cập nhật có câu hỏi đã lấp thì ưu tiên trả về
  if (stored && stored.slots_state && stored.slots_state.some((s) => Boolean(s.question))) {
    return NextResponse.json(stored);
  }

  // Fallback proxy sang Core API
  try {
    const res = await fetch(`${CORE_API_URL}/api/generator/exams/${examId}`);
    if (res.ok) {
      const data = await res.json();
      // Nếu local chưa có, lưu bản gốc vào
      if (!stored) {
        saveStoredExam(data);
      }
      return NextResponse.json(data);
    }
  } catch (e: any) {
    console.warn("Proxy to core-api failed:", e.message);
  }

  if (stored) {
    return NextResponse.json(stored);
  }

  return NextResponse.json({ error: "Exam not found" }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const examId = params.id;
    const body = await request.json();
    const exam = { ...body, id: examId };
    saveStoredExam(exam);
    return NextResponse.json({ status: "success", exam });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
