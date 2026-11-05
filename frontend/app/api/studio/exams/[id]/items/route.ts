import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, convertExamSlotsToStudioItems } from "@/lib/examStorage";

const CORE_API_URL = process.env.CORE_API_URL || "http://192.168.1.229:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const examId = params.id;
  const stored = getStoredExam(examId);

  // Nếu local exam có slots_state với câu hỏi
  if (stored && stored.slots_state && stored.slots_state.some((s) => Boolean(s.question))) {
    const items = convertExamSlotsToStudioItems(stored);
    return NextResponse.json(items);
  }

  // Fallback proxy sang Core API
  try {
    const res = await fetch(`${CORE_API_URL}/api/studio/exams/${examId}/items`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (e: any) {
    console.warn("Proxy studio items failed:", e.message);
  }

  if (stored) {
    const items = convertExamSlotsToStudioItems(stored);
    return NextResponse.json(items);
  }

  return NextResponse.json([], { status: 200 });
}
