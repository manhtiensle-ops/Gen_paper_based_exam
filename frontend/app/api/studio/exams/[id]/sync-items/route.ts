import { NextRequest, NextResponse } from "next/server";
import { getStoredExam, convertExamSlotsToStudioItems } from "@/lib/examStorage";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const examId = params.id;
  const stored = getStoredExam(examId);

  if (!stored) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const items = convertExamSlotsToStudioItems(stored);
  return NextResponse.json(items);
}
