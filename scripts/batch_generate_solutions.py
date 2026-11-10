#!/usr/bin/env python3
"""
Batch AI Solution Generator for HSG Math Questions
- Connects directly to PostgreSQL
- Detects all questions lacking solution_latex or sub-questions solutions
- Uses OmniRoute with Gemini 3.8 Flash Tiered
- High concurrency with resilient retry
- Updates database in real time
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
import psycopg2
from psycopg2.extras import RealDictCursor
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@192.168.1.229:5432/hsg_math")
OMNIROUTE_URL = os.getenv("OMNIROUTE_BASE_URL", "http://127.0.0.1:20128/v1/chat/completions")
OMNIROUTE_KEY = (os.getenv("OMNIROUTE_API_KEY") or "").strip(' "\'')
MODEL_NAME = os.getenv("OMNIROUTE_MODEL", "antigravity/gemini-3.8-flash-tiered")
MAX_WORKERS = int(os.getenv("MAX_WORKERS", "4"))

def get_db_connection():
    return psycopg2.connect(DB_URL)

def solve_question(q, attempt=1):
    qid = str(q['id'])
    content = q.get('content_latex') or ''
    topic = q.get('main_topic') or 'TOÁN HỌC'
    difficulty = q.get('difficulty') or 'MEDIUM'
    subs = q.get('sub_questions') or []
    if isinstance(subs, str):
        try:
            subs = json.loads(subs)
        except Exception:
            subs = []

    prompt = (
        "Bạn là Chuyên gia Khảo thí và Giáo viên Chuyên Toán THCS Việt Nam phụ trách đề thi Học sinh giỏi.\n"
        "Hãy giải chi tiết bài toán sau theo chuẩn sư phạm Việt Nam, sử dụng ngôn ngữ học thuật chuẩn mực, "
        "công thức toán học dùng mã LaTeX rõ ràng, đẹp mắt ($...$, $$...$$, \\begin{cases}, \\triangle, \\widehat{...}, v.v.).\n\n"
        f"Chủ đề: {topic}\n"
        f"Mức độ: {difficulty}\n"
        f"Đề bài chính: {content}\n"
    )

    if subs:
        prompt += "\nCác câu hỏi thành phần:\n"
        for idx, sq in enumerate(subs):
            label = sq.get('label') or f"{idx + 1})"
            sub_c = sq.get('content_latex') or ''
            prompt += f"- Ý {label}: {sub_c}\n"
        prompt += (
            "\nYêu cầu trả về JSON chính xác cấu trúc:\n"
            "{\n"
            '  "solution_latex": "Toàn bộ bài giải chi tiết tuần tự...",\n'
            '  "final_answer": "Kết luận hoặc đáp số ngắn gọn cuối cùng",\n'
            '  "sub_solutions": [\n'
        )
        for idx, sq in enumerate(subs):
            label = sq.get('label') or f"{idx + 1})"
            comma = "," if idx < len(subs) - 1 else ""
            prompt += f'    {{"label": "{label}", "solution_latex": "...", "final_answer": "..."}}{comma}\n'
        prompt += "  ]\n}\n"
    else:
        prompt += (
            "\nYêu cầu trả về JSON chính xác cấu trúc:\n"
            "{\n"
            '  "solution_latex": "Nội dung lời giải chi tiết từng bước theo chuẩn sư phạm...",\n'
            '  "final_answer": "Đáp số ngắn gọn hoặc kết luận (VD: x = 2; P_min = 3...)"\n'
            "}\n"
        )

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": "Bạn là hệ thống AI Chuyên gia Khảo thí Toán học. Luôn trả về định dạng JSON hợp lệ theo yêu cầu, không kèm markdown code block hoặc lời giải thích bên ngoài."
            },
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1
    }

    req = urllib.request.Request(
        OMNIROUTE_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Bearer {OMNIROUTE_KEY}",
            "Content-Type": "application/json"
        }
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            t1 = time.time()
            content_str = data['choices'][0]['message']['content']
            parsed = json.loads(content_str)
            sol = parsed.get("solution_latex", "")
            ans = parsed.get("final_answer", "")
            sub_sols = parsed.get("sub_solutions", [])

            updated_subs = subs
            if subs and isinstance(sub_sols, list):
                updated_subs = []
                for sq in subs:
                    item_label = sq.get('label', '')
                    matched = next((s for s in sub_sols if s.get('label') == item_label or (sq.get('part_id') and sq['part_id'] in s.get('label', ''))), None)
                    if matched:
                        updated_subs.append({
                            **sq,
                            "solution_latex": matched.get("solution_latex") or sq.get("solution_latex", ""),
                            "final_answer": matched.get("final_answer") or sq.get("final_answer", "")
                        })
                    else:
                        updated_subs.append(sq)

            return {
                "success": True,
                "question_id": qid,
                "solution_latex": sol,
                "final_answer": ans,
                "sub_questions": updated_subs,
                "duration": t1 - t0,
                "topic": topic
            }
    except Exception as e:
        if attempt < 3:
            time.sleep(2 * attempt)
            return solve_question(q, attempt + 1)
        return {
            "success": False,
            "question_id": qid,
            "error": str(e),
            "topic": topic
        }

def save_solution(conn, result):
    if not result.get("success"):
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE questions 
                SET solution_latex = %s,
                    final_answer = %s,
                    sub_questions = %s,
                    last_edited_at = NOW()
                WHERE id = %s
            """, (
                result["solution_latex"],
                result["final_answer"],
                json.dumps(result["sub_questions"]),
                result["question_id"]
            ))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error saving {result['question_id']}: {e}", file=sys.stderr)
        return False

def main():
    limit_arg = None
    if len(sys.argv) > 1:
        try:
            limit_arg = int(sys.argv[1])
        except ValueError:
            pass

    conn = get_db_connection()
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = """
            SELECT id, main_topic, difficulty, content_latex, sub_questions, figures_meta
            FROM questions
            WHERE (solution_latex IS NULL OR TRIM(solution_latex) = '')
            ORDER BY created_at ASC
        """
        if limit_arg:
            query += f" LIMIT {limit_arg}"
        cur.execute(query)
        questions = cur.fetchall()

    total_tasks = len(questions)
    print(f"🚀 [AI Solution Engine] Đã tìm thấy {total_tasks} câu hỏi cần sinh lời giải.")
    if total_tasks == 0:
        print("✅ Tất cả câu hỏi trong hệ thống đã có lời giải hoàn chỉnh!")
        return

    completed = 0
    failed = 0
    t_start = time.time()

    # Worker pool for AI generation
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_q = {executor.submit(solve_question, q): q for q in questions}
        for future in as_completed(future_to_q):
            res = future.result()
            if res.get("success"):
                save_conn = get_db_connection()
                saved = save_solution(save_conn, res)
                save_conn.close()
                if saved:
                    completed += 1
                    ans_preview = (res.get('final_answer') or 'Đã giải')[:30]
                    log_line = f"[{completed}/{total_tasks}] ✅ QID: {res['question_id'][:8]}.. | Topic: {res['topic'][:15]} | Time: {res['duration']:.1f}s | Đáp số: {ans_preview}"
                    print(log_line, flush=True)
                else:
                    failed += 1
                    print(f"[{completed + failed}/{total_tasks}] ❌ DB Save Error: {res['question_id']}", flush=True)
            else:
                failed += 1
                print(f"[{completed + failed}/{total_tasks}] ⚠️ AI Error: {res['question_id'][:8]}.. - {res.get('error')}", flush=True)

    total_time = time.time() - t_start
    print("=" * 60, flush=True)
    print(f"🎉 Hoàn tất đợt sinh lời giải AI!", flush=True)
    print(f"Tổng số xử lý: {completed + failed}/{total_tasks}", flush=True)
    print(f"Thành công: {completed} câu", flush=True)
    print(f"Lỗi: {failed} câu", flush=True)
    print(f"Tổng thời gian: {total_time:.1f}s (Trung bình: {total_time / max(completed, 1):.1f}s/câu)", flush=True)

if __name__ == "__main__":
    main()
