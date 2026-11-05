import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const EXAMS_FILE = path.join(DATA_DIR, "persisted_exams.json");

export interface ExamSlot {
  slot_index: number;
  section_type?: string;
  main_topic?: string;
  difficulty?: string;
  points?: number;
  score?: number;
  question?: any;
}

export interface StoredExam {
  id: string;
  title: string;
  blueprint_id?: string;
  folder_id?: string | null;
  slots_state: ExamSlot[];
  header_config?: any;
  layout_knobs?: any;
  template_document?: any;
  updated_at?: string;
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(EXAMS_FILE)) {
    fs.writeFileSync(EXAMS_FILE, JSON.stringify({}, null, 2), "utf-8");
  }
}

export function getAllStoredExams(): Record<string, StoredExam> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(EXAMS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading persisted exams:", e);
    return {};
  }
}

export function getStoredExam(examId: string): StoredExam | null {
  const all = getAllStoredExams();
  return all[examId] || null;
}

export function saveStoredExam(exam: StoredExam): void {
  ensureDataFile();
  const all = getAllStoredExams();
  all[exam.id] = {
    ...exam,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(EXAMS_FILE, JSON.stringify(all, null, 2), "utf-8");
}

export function convertExamSlotsToStudioItems(exam: StoredExam) {
  const slots = exam.slots_state || [];
  const items: any[] = [];
  let order = 1;

  for (const slot of slots) {
    const q = slot.question;
    if (!q) continue;

    const points = Number(slot.points || slot.score || q.default_points || 3.0);
    const itemId = q.id || `item-${exam.id}-${order}`;

    // Tạo rubric steps mặc định từ solution hoặc sub_questions
    const rubricSteps: any[] = [];
    if (q.sub_questions && Array.isArray(q.sub_questions) && q.sub_questions.length > 0) {
      const stepPoints = Number((points / q.sub_questions.length).toFixed(2));
      q.sub_questions.forEach((sub: any, sIdx: number) => {
        rubricSteps.push({
          step_id: `s${sIdx + 1}`,
          milestone_tag: `Ý ${String.fromCharCode(97 + sIdx)})`,
          latex_content: sub.solution_latex || sub.content_latex || `Hoàn thành ý ${String.fromCharCode(97 + sIdx)})`,
          points: stepPoints,
        });
      });
    } else {
      // Chia 2 mốc mặc định
      const p1 = Number((points * 0.5).toFixed(2));
      const p2 = Number((points - p1).toFixed(2));
      rubricSteps.push({
        step_id: "s1",
        milestone_tag: "Thiết lập & Biến đổi cơ bản",
        latex_content: "Điều kiện xác định và các bước lập luận dẫn xuất ban đầu.",
        points: p1,
      });
      rubricSteps.push({
        step_id: "s2",
        milestone_tag: "Lời giải & Kết luận",
        latex_content: q.solution_latex || "Hoàn thành chứng minh hoặc tìm nghiệm chính xác.",
        points: p2,
      });
    }

    items.push({
      id: itemId,
      exam_id: exam.id,
      order_index: order,
      display_label: `Câu ${order}`,
      max_points: points,
      problem_snapshot: {
        id: q.id,
        content_latex: q.content_latex || "",
        solution_latex: q.solution_latex || "",
        final_answer: q.final_answer || "",
        sub_questions: q.sub_questions || [],
        has_figure: Boolean(q.has_figure),
        figures_meta: q.figures_meta || [],
        main_topic: slot.main_topic || q.main_topic || "ALGEBRA",
        difficulty: slot.difficulty || q.difficulty || "MEDIUM",
        section_type: slot.section_type || "ESSAY",
        default_points: points,
      },
      rubric_data: {
        steps: rubricSteps,
      },
    });

    order++;
  }

  return items;
}
