import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

const OMNIROUTE_URL = process.env.OMNIROUTE_BASE_URL
  ? `${process.env.OMNIROUTE_BASE_URL}/chat/completions`
  : "http://127.0.0.1:20128/v1/chat/completions";
const OMNIROUTE_KEY = process.env.OMNIROUTE_API_KEY || "";
const MODELS_CASCADE = ["antigravity/gemini-3.8-flash-tiered", "ddgw/gpt-5.4-mini", "antigravity/gemini-3.1-flash-lite"];

async function callAiWithFallback(promptText: string, preferredModel?: string) {
  const models = preferredModel
    ? [preferredModel, ...MODELS_CASCADE.filter((m) => m !== preferredModel)]
    : MODELS_CASCADE;

  let lastError: any = null;
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const aiResp = await fetch(OMNIROUTE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OMNIROUTE_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Bạn là hệ thống AI Chuyên gia Khảo thí Toán học. Luôn trả về định dạng JSON hợp lệ theo yêu cầu, không kèm markdown code block hoặc lời giải thích bên ngoài.",
            },
            {
              role: "user",
              content: promptText,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const contentStr = aiData.choices?.[0]?.message?.content || "{}";
        return JSON.parse(contentStr);
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Mọi mô hình AI đều không phản hồi");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const questionId = params.id;
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const force = Boolean(body.force);
    const model = body.model || MODELS_CASCADE[0];

    // 1. Fetch question from DB
    const res = await pool.query(
      `SELECT id, content_latex, main_topic, difficulty, sub_questions, solution_latex, final_answer, figures_meta 
       FROM questions WHERE id = $1`,
      [questionId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy câu hỏi" }, { status: 404 });
    }

    const q = res.rows[0];

    // If solution already exists and not force, return existing
    if (!force && q.solution_latex && q.solution_latex.trim().length > 10) {
      return NextResponse.json({
        success: true,
        already_existed: true,
        question_id: questionId,
        solution_latex: q.solution_latex,
        final_answer: q.final_answer || "",
        sub_questions: q.sub_questions || [],
      });
    }

    // 2. Build prompt
    const subs = Array.isArray(q.sub_questions) ? q.sub_questions : [];
    let promptText = `Bạn là Chuyên gia Khảo thí và Giáo viên Chuyên Toán THCS Việt Nam phụ trách đề thi Học sinh giỏi.\n`;
    promptText += `Hãy giải chi tiết bài toán sau theo chuẩn sư phạm Việt Nam, sử dụng ngôn ngữ học thuật chuẩn mực, công thức toán học dùng mã LaTeX rõ ràng, đẹp mắt ($...$, $$...$$, \\begin{cases}, \\triangle, \\widehat{...}, v.v.).\n\n`;
    promptText += `Chủ đề: ${q.main_topic || "TOÁN HỌC"}\n`;
    promptText += `Mức độ: ${q.difficulty || "MEDIUM"}\n`;
    promptText += `Đề bài chính: ${q.content_latex || ""}\n`;

    if (subs.length > 0) {
      promptText += `\nCác câu hỏi thành phần:\n`;
      subs.forEach((sq: any, idx: number) => {
        promptText += `- Ý ${sq.label || `${idx + 1})`}: ${sq.content_latex || ""}\n`;
      });
      promptText += `\nYêu cầu trả về JSON chính xác cấu trúc:\n`;
      promptText += `{\n`;
      promptText += `  "solution_latex": "Toàn bộ bài giải tổng thể chi tiết, trình bày tuần tự theo từng ý a), b)...",\n`;
      promptText += `  "final_answer": "Kết luận hoặc đáp số ngắn gọn cuối cùng",\n`;
      promptText += `  "sub_solutions": [\n`;
      subs.forEach((sq: any, idx: number) => {
        promptText += `    {"label": "${sq.label || `${idx + 1})`}", "solution_latex": "Lời giải riêng cho ý này", "final_answer": "Đáp số ý này"}${idx < subs.length - 1 ? "," : ""}\n`;
      });
      promptText += `  ]\n`;
      promptText += `}\n`;
    } else {
      promptText += `\nYêu cầu trả về JSON chính xác cấu trúc:\n`;
      promptText += `{\n`;
      promptText += `  "solution_latex": "Nội dung lời giải chi tiết từng bước theo chuẩn sư phạm...",\n`;
      promptText += `  "final_answer": "Đáp số ngắn gọn hoặc kết luận (VD: x = 2; P_min = 3...)"\n`;
      promptText += `}\n`;
    }

    // 3. Call OmniRoute AI with Fallback Cascade
    const parsed = await callAiWithFallback(promptText, model);

    const newSolutionLatex = parsed.solution_latex || "";
    const newFinalAnswer = parsed.final_answer || "";
    let updatedSubs = subs;

    if (Array.isArray(parsed.sub_solutions) && subs.length > 0) {
      updatedSubs = subs.map((sq: any) => {
        const found = parsed.sub_solutions.find(
          (sub: any) =>
            sub.label === sq.label ||
            (sq.part_id && sub.label?.includes(sq.part_id))
        );
        if (found) {
          return {
            ...sq,
            solution_latex: found.solution_latex || sq.solution_latex || "",
            final_answer: found.final_answer || sq.final_answer || "",
          };
        }
        return sq;
      });
    }

    // 4. Update Database
    await pool.query(
      `UPDATE questions 
       SET solution_latex = $1, final_answer = $2, sub_questions = $3, last_edited_at = NOW() 
       WHERE id = $4`,
      [newSolutionLatex, newFinalAnswer, JSON.stringify(updatedSubs), questionId]
    );

    return NextResponse.json({
      success: true,
      question_id: questionId,
      solution_latex: newSolutionLatex,
      final_answer: newFinalAnswer,
      sub_questions: updatedSubs,
    });
  } catch (err: any) {
    console.error("Generate solution error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý tạo lời giải" },
      { status: 500 }
    );
  }
}
