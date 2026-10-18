import os
import json
import logging
import requests
from typing import List, Dict, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from openai import OpenAI

from app.database import get_db
from app.models.models import GeneratedExam, ExamItem, Question
from app.schemas.schemas import (
    ExamItemResponse,
    UpdateExamHeaderRequest,
    ReorderExamItemsRequest,
    AutoSplitRubricRequest,
    GenerateVariantRequest,
    GeneratedExamResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/studio", tags=["Exam Studio"])

def get_omniroute_client():
    api_key = os.getenv("OMNIROUTE_API_KEY", "dummy-key")
    base_url = os.getenv("OMNIROUTE_BASE_URL", "http://192.168.1.117:20128/v1")
    return OpenAI(base_url=base_url, api_key=api_key, timeout=120.0)


# ==================== SYNC EXAM TO STUDIO ITEMS ====================

@router.post("/exams/{exam_id}/sync-items", response_model=List[ExamItemResponse])
def sync_exam_slots_to_items(exam_id: UUID, db: Session = Depends(get_db)):
    """Chuyển đổi slots_state của generated_exams thành các ExamItem Snapshot độc lập"""
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

    # Kiểm tra xem đã có items chưa
    existing_items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
    if existing_items:
        return existing_items

    # Duyệt qua slots_state để tạo snapshots
    new_items = []
    slots = exam.slots_state or []
    for idx, slot in enumerate(slots):
        q_data = slot.get("question")
        if not q_data:
            continue

        q_id = q_data.get("id")
        points = float(slot.get("points") or q_data.get("default_points") or 3.0)
        display_label = f"Câu {idx + 1}"

        # Mặc định cấu trúc barem ban đầu từ solution
        sol_text = q_data.get("solution_latex") or ""
        sub_questions = q_data.get("sub_questions") or []

        rubric_data = {
            "target_total_quanta": int(points * 4),
            "pedagogical_analysis": "Barem sơ bộ khởi tạo từ dữ liệu câu hỏi",
            "steps": [
                {
                    "step_order": 1,
                    "milestone_tag": "Lời giải & Biến đổi",
                    "latex_content": sol_text or "*(Chưa có lời giải chi tiết)*",
                    "allocated_quanta": int(points * 4),
                    "points": points,
                    "is_locked": False
                }
            ],
            "sub_parts": []
        }

        # Nếu có các ý con a, b, c
        if sub_questions:
            rubric_data["sub_parts"] = []
            for sq in sub_questions:
                sub_pts = float(sq.get("points") or 1.0)
                rubric_data["sub_parts"].append({
                    "part_id": sq.get("part_id", "a"),
                    "part_label": sq.get("label", "a)"),
                    "part_title": sq.get("content_latex", "")[:80],
                    "sub_max_points": sub_pts,
                    "steps": [
                        {
                            "step_order": 1,
                            "milestone_tag": "Chứng minh / Tính toán",
                            "latex_content": sq.get("solution_latex") or sq.get("content_latex") or "",
                            "allocated_quanta": int(sub_pts * 4),
                            "points": sub_pts,
                            "is_locked": False
                        }
                    ]
                })

        item = ExamItem(
            exam_id=exam.id,
            source_question_id=UUID(q_id) if q_id else None,
            order_index=idx,
            display_label=display_label,
            max_points=points,
            problem_snapshot=q_data,
            rubric_data=rubric_data,
            is_ai_variant=False
        )
        db.add(item)
        new_items.append(item)

    db.commit()
    for item in new_items:
        db.refresh(item)
    return new_items


@router.get("/exams/{exam_id}/items", response_model=List[ExamItemResponse])
def get_exam_items(exam_id: UUID, db: Session = Depends(get_db)):
    items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
    if not items:
        # Tự động sync nếu chưa có
        return sync_exam_slots_to_items(exam_id, db)
    return items


# ==================== HEADER CONFIG ====================

@router.patch("/exams/{exam_id}/header")
def update_exam_header(exam_id: UUID, req: UpdateExamHeaderRequest, db: Session = Depends(get_db)):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")
    exam.header_config = req.header_config
    db.commit()
    return {"status": "success", "header_config": exam.header_config}


# ==================== DRAG & DROP REORDER ====================

@router.patch("/exams/{exam_id}/reorder")
def reorder_exam_items(exam_id: UUID, req: ReorderExamItemsRequest, db: Session = Depends(get_db)):
    items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).all()
    item_map = {str(item.id): item for item in items}

    for order_info in req.item_orders:
        i_id = str(order_info.get("item_id"))
        idx = order_info.get("order_index")
        if i_id in item_map:
            item_map[i_id].order_index = idx
            item_map[i_id].display_label = f"Câu {idx + 1}"

    db.commit()
    return {"status": "success", "reordered_count": len(req.item_orders)}


# ==================== UPDATE SINGLE ITEM / RUBRIC ====================

@router.put("/items/{item_id}", response_model=ExamItemResponse)
def update_exam_item(item_id: UUID, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    item = db.query(ExamItem).filter(ExamItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi trong đề")

    if "display_label" in payload:
        item.display_label = payload["display_label"]
    if "max_points" in payload:
        item.max_points = float(payload["max_points"])
    if "problem_snapshot" in payload:
        item.problem_snapshot = payload["problem_snapshot"]
    if "rubric_data" in payload:
        item.rubric_data = payload["rubric_data"]

    db.commit()
    db.refresh(item)
    return item


# ==================== AI: AUTO-SPLIT RUBRIC 0.25 QUANTA ====================

@router.post("/items/{item_id}/rubric/auto-split", response_model=ExamItemResponse)
def auto_split_rubric(item_id: UUID, req: AutoSplitRubricRequest, db: Session = Depends(get_db)):
    item = db.query(ExamItem).filter(ExamItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")

    points = req.max_points or float(item.max_points or 3.0)
    target_quanta = int(round(points * 4)) # 1 quantum = 0.25đ

    snapshot = item.problem_snapshot or {}
    content_latex = snapshot.get("content_latex", "")
    solution_latex = snapshot.get("solution_latex", "")

    if not solution_latex:
        raise HTTPException(status_code=400, detail="Câu hỏi chưa có lời giải để AI phân rã barem")

    client = get_omniroute_client()
    vision_model = os.getenv("OMNIROUTE_VISION_MODEL", "antigravity/gemini-3.8-flash-tiered")

    prompt = f"""Bạn là Chuyên gia Khảo thí Toán THCS & Chuyên Toán tại Việt Nam.
Nhiệm vụ: Phân rã lời giải bài toán thành Biểu điểm chấm thi (Barem) chi tiết theo chuẩn Sở GD&ĐT.

QUY TẮC BẮT BUỘC (QUANTA SYSTEM):
1. Đơn vị nguyên "quanta": 1 quantum = 0.25 điểm.
2. Tổng số quanta bắt buộc của bài: target_total_quanta = {target_quanta} ({points} điểm).
3. Mỗi bước chấm (steps) gán `allocated_quanta` là số nguyên (1 = 0.25đ, 2 = 0.50đ, 3 = 0.75đ, 4 = 1.00đ).
4. Phải tính `cumulative_quanta` tăng dần từ bước 1. Ở bước cuối cùng, `cumulative_quanta` BẮT BUỘC bằng chính xác {target_quanta}.

QUY TẮC SƯ PHẠM:
- Luôn tách riêng mốc "ĐKXĐ" hoặc "Vẽ hình / Giả thiết kết luận" (thường 1 quantum = 0.25đ).
- Các bước biến đổi tương đương then chốt hoặc chứng minh nhận 2 - 3 quanta (0.50đ - 0.75đ).
- Bước "Kết luận tập nghiệm / Kết luận" nhận 1 quantum (0.25đ).
- Giữ nguyên công thức toán học trong dấu $...$.

THÔNG TIN BÀI TOÁN:
Đề bài: {content_latex}
Lời giải hiện có: {solution_latex}

Trả về DUY NHẤT một JSON hợp lệ tuân thủ cấu trúc sau:
{{
  "target_total_quanta": {target_quanta},
  "pedagogical_analysis": "Phân tích chốt chặn sư phạm ăn điểm của bài toán...",
  "steps": [
    {{
      "step_order": 1,
      "milestone_tag": "ĐKXĐ / Vẽ hình",
      "latex_content": "Nội dung bước 1...",
      "allocated_quanta": 1,
      "cumulative_quanta": 1
    }}
  ]
}}"""

    try:
        response = client.chat.completions.create(
            model=vision_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        raw_json = response.choices[0].message.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0].strip()
        data = json.loads(raw_json)

        # Tính lại trường points (float) cho mỗi step để frontend render
        steps = data.get("steps", [])
        for s in steps:
            q = int(s.get("allocated_quanta", 1))
            s["points"] = round(q * 0.25, 2)
            s["is_locked"] = False

        item.rubric_data = {
            "target_total_quanta": target_quanta,
            "pedagogical_analysis": data.get("pedagogical_analysis", ""),
            "steps": steps,
            "sub_parts": item.rubric_data.get("sub_parts", []) if isinstance(item.rubric_data, dict) else []
        }
        item.max_points = points
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        logger.error(f"Error auto splitting rubric: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi AI phân rã barem: {str(e)}")


# ==================== AI: VARIANT GENERATION (REVERSE CONSTRUCT) ====================

@router.post("/items/{item_id}/variant", response_model=ExamItemResponse)
def generate_clean_variant(item_id: UUID, req: GenerateVariantRequest, db: Session = Depends(get_db)):
    item = db.query(ExamItem).filter(ExamItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy câu hỏi")

    snapshot = item.problem_snapshot or {}
    content_latex = snapshot.get("content_latex", "")
    solution_latex = snapshot.get("solution_latex", "")

    client = get_omniroute_client()
    vision_model = os.getenv("OMNIROUTE_VISION_MODEL", "antigravity/gemini-3.8-flash-tiered")

    prompt = f"""Bạn là Chuyên gia Ra đề thi Học sinh giỏi Toán THCS & Tuyển sinh Lớp 10 Chuyên.
Nhiệm vụ: Tạo một BÀI TOÁN BIẾN THỂ (Đề A / Đề B / Chống lộ đề) từ bài toán gốc dưới đây.

NGUYÊN TẮC BẮT BUỘC (REVERSE-CONSTRUCT FROM CLEAN ROOTS):
1. GIỮ NGUYÊN BẢN CHẤT PHƯƠNG PHÁP & ĐỘ KHÓ.
2. NGHIỆM PHẢI LÀ SỐ NGUYÊN ĐẸP HOẶC PHÂN SỐ TỐI GIẢN (ZERO-UGLY NUMBERS). Không được làm phát sinh nghiệm vô tỉ xấu.
3. Thay ngược nghiệm đẹp vào khung đại số để tính toán các hệ số mới của bài toán. Thử lại trực tiếp để đảm bảo không sinh thêm nghiệm ngoại lai không mong muốn.
4. Yêu cầu bổ sung của giáo viên: {req.instructions}

BÀI TOÁN GỐC:
Đề bài: {content_latex}
Lời giải: {solution_latex}

Trả về DUY NHẤT một JSON hợp lệ:
{{
  "change_summary": "Tóm tắt thay đổi số liệu...",
  "variant_content_latex": "Đề bài biến thể mới...",
  "variant_solution_latex": "Lời giải hoàn chỉnh mới...",
  "final_answer": "Đáp số ngắn mới..."
}}"""

    try:
        response = client.chat.completions.create(
            model=vision_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        raw_json = response.choices[0].message.content
        if "```json" in raw_json:
            raw_json = raw_json.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_json:
            raw_json = raw_json.split("```")[1].split("```")[0].strip()
        data = json.loads(raw_json)

        # Cập nhật snapshot mới
        new_snapshot = dict(snapshot)
        new_snapshot["content_latex"] = data.get("variant_content_latex", content_latex)
        new_snapshot["solution_latex"] = data.get("variant_solution_latex", solution_latex)
        new_snapshot["final_answer"] = data.get("final_answer", "")

        item.problem_snapshot = new_snapshot
        item.is_ai_variant = True
        item.variant_metadata = {
            "change_summary": data.get("change_summary", "Sinh biến thể nghiệm đẹp qua AI"),
            "original_content_latex": content_latex
        }

        # Reset sơ bộ barem theo lời giải mới
        pts = float(item.max_points or 3.0)
        item.rubric_data = {
            "target_total_quanta": int(pts * 4),
            "pedagogical_analysis": f"Biến thể: {data.get('change_summary', '')}",
            "steps": [
                {
                    "step_order": 1,
                    "milestone_tag": "Lời giải biến thể",
                    "latex_content": data.get("variant_solution_latex", ""),
                    "allocated_quanta": int(pts * 4),
                    "points": pts,
                    "is_locked": False
                }
            ],
            "sub_parts": []
        }

        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        logger.error(f"Error generating variant: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi AI tạo biến thể: {str(e)}")


# ==================== AI: EXAM HEALTH-CHECK ====================

@router.post("/exams/{exam_id}/health-check")
def run_exam_health_check(exam_id: UUID, db: Session = Depends(get_db)):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

    items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
    if not items:
        raise HTTPException(status_code=400, detail="Đề thi chưa có câu hỏi nào để thẩm định")

    exam_content_summary = []
    total_score = 0.0
    for it in items:
        snap = it.problem_snapshot or {}
        pts = float(it.max_points or 0.0)
        total_score += pts
        exam_content_summary.append({
            "label": it.display_label,
            "topic": snap.get("main_topic", "ALGEBRA"),
            "points": pts,
            "content": snap.get("content_latex", "")[:200]
        })

    client = get_omniroute_client()
    vision_model = os.getenv("OMNIROUTE_VISION_MODEL", "antigravity/gemini-3.8-flash-tiered")

    prompt = f"""Bạn là Trưởng Ban Đề Thi Olympic Toán THCS Việt Nam.
Nhiệm vụ: Thẩm định sức khỏe sư phạm toàn diện của đề thi HSG 9 (150 phút, thang điểm {total_score}đ).

TIÊU CHÍ THẨM ĐỊNH:
1. Trùng lặp kỹ thuật giải: Có câu nào cùng dùng chung một mẹo hoặc kỹ thuật biến đổi không?
2. Độ cân bằng chuyên đề: Đã phủ đủ các trụ cột (Đại số, Số học, Hình học phẳng, Bất đẳng thức/Cực trị, Tổ hợp/Rời rạc) chưa?
3. Tải thời gian: Học sinh có đủ 150 phút để hoàn thành không (có quá dài hoặc quá ngắn không)?
4. Bẫy tư duy & Chặt chẽ: Có bài nào dễ sót điều kiện xác định hoặc nghiệm ngoại lai không?

DANH SÁCH CÁC CÂU TRONG ĐỀ:
{json.dumps(exam_content_summary, ensure_ascii=False, indent=2)}

Trả về DUY NHẤT một JSON hợp lệ:
{{
  "overall_rating": "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT",
  "score_balance": {{
    "total_score": {total_score},
    "is_standard_20": {str(total_score == 20.0).lower()}
  }},
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "warnings": ["Cảnh báo rủi ro 1", "Cảnh báo trùng lặp 2"],
  "recommendations": ["Đề xuất tinh chỉnh 1", "Đề xuất tinh chỉnh 2"]
}}"""

    try:
        response = client.chat.completions.create(
            model=vision_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        report = json.loads(raw_text)
        exam.health_check_report = report
        db.commit()
        return {"status": "success", "health_check_report": report}
    except Exception as e:
        logger.error(f"Error running health check: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi AI thẩm định đề thi: {str(e)}")


# ==================== LIVE LATEX PREVIEW & AI LAYOUT AGENT ====================

EXPORT_SERVICE_URL = os.getenv("EXPORT_SERVICE_URL", "http://export-service:8001")

@router.post("/exams/{exam_id}/preview")
def get_exam_latex_preview(
    exam_id: UUID,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

    items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
    if not items:
        items = sync_exam_slots_to_items(exam_id, db)

    items_payload = [{
        "id": str(it.id),
        "display_label": it.display_label,
        "max_points": float(it.max_points or 1.0),
        "problem_snapshot": it.problem_snapshot,
        "rubric_data": it.rubric_data
    } for it in items]

    header_cfg = payload.get("header_config") or exam.header_config or {}
    layout_knobs = payload.get("layout_knobs") or {
        "margin_top_cm": 1.8,
        "margin_bottom_cm": 1.8,
        "margin_left_cm": 2.0,
        "margin_right_cm": 1.8,
        "font_size_pt": 12,
        "line_spread": 1.15,
        "item_gap_pt": 10,
        "math_skip_pt": 6
    }
    mode = payload.get("mode", "EXAM")

    try:
        resp = requests.post(
            f"{EXPORT_SERVICE_URL}/api/export/latex/preview",
            json={
                "exam_id": str(exam.id),
                "title": exam.title,
                "header_config": header_cfg,
                "layout_knobs": layout_knobs,
                "items": items_payload,
                "mode": mode
            },
            timeout=45
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            raise HTTPException(status_code=502, detail=f"Export service error: {resp.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi kết nối dịch vụ biên dịch LaTeX: {str(e)}")


@router.post("/exams/{exam_id}/layout-agent")
def run_layout_agent(
    exam_id: UUID,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

    user_message = payload.get("user_message", "")
    image_data = payload.get("image_data") # Optional base64 data URL from screenshot upload/paste
    current_knobs = payload.get("current_layout_knobs") or {
        "margin_top_cm": 1.8,
        "margin_bottom_cm": 1.8,
        "margin_left_cm": 2.0,
        "margin_right_cm": 1.8,
        "font_size_pt": 12,
        "line_spread": 1.15,
        "item_gap_pt": 10,
        "math_skip_pt": 6
    }
    header_cfg = payload.get("header_config") or exam.header_config or {}
    mode = payload.get("mode", "EXAM")

    items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
    questions_summary = []
    for it in items:
        snap = it.problem_snapshot or {}
        questions_summary.append({
            "item_id": str(it.id),
            "display_label": it.display_label,
            "topic": snap.get("main_topic", ""),
            "content_latex": snap.get("content_latex", "")[:150]
        })

    client = get_omniroute_client()
    vision_model = os.getenv("OMNIROUTE_VISION_MODEL", "antigravity/gemini-3.8-flash-tiered")

    prompt = f"""Bạn là Kỹ sư Chế bản LaTeX & Trợ lý Dàn trang Đề thi Toán học (Actionable Multimodal Layout Agent).
Nhiệm vụ: Nhận lệnh từ giáo viên (kèm ảnh chụp màn hình ghi chú / khoanh tròn nếu có) và điều chỉnh các tham số bố cục (layout_knobs), hoặc sửa trực tiếp nội dung/công thức câu hỏi theo chỉ định của giáo viên.

CÁC NGUYÊN TẮC DÀN TRANG TOÁN:
1. "Dồn trang / ép vào vừa 1 trang": Giảm margin (xuống 1.4-1.6cm), giảm line_spread (1.05-1.10), giảm item_gap_pt (4-6pt), giảm math_skip_pt (3-4pt).
2. "Thưa dòng / giãn dòng": Tăng line_spread (1.20-1.25), tăng item_gap_pt (12-14pt).
3. "Chữ nhỏ lại": font_size_pt = 11. "Chữ to chuẩn": font_size_pt = 12.
4. "Thu nhỏ lề": margin_left_cm = 1.6, margin_right_cm = 1.4, margin_top_cm = 1.4, margin_bottom_cm = 1.4.
5. "Chuyển câu hình sang 2 cột": đặt layout_knobs["geometry_layout"] = {{"mode": "two_column_fig_right"}}.
6. NẾU CÓ ẢNH ĐÍNH KÈM: Quan sát vùng khoanh tròn, ghi chú viết tay hoặc mũi tên chỉ định của giáo viên để sửa chính xác câu hỏi hoặc chỉnh bố cục tương ứng.

THAM SỐ BỐ CỤC HIỆN TẠI:
{json.dumps(current_knobs, indent=2)}

DANH SÁCH CÁC CÂU TRONG ĐỀ:
{json.dumps(questions_summary, ensure_ascii=False, indent=2)}

LỆNH CỦA GIÁO VIÊN:
"{user_message}"

Trả về DUY NHẤT một JSON hợp lệ:
{{
  "ui_status_message": "Mô tả ngắn gọn hành động vừa thực hiện (dưới 30 từ, ví dụ: 'Đã giảm lề trang và co khoảng cách để dồn vừa vặn trang 1.')",
  "updated_layout_knobs": {{
    "margin_top_cm": 1.8,
    "margin_bottom_cm": 1.8,
    "margin_left_cm": 2.0,
    "margin_right_cm": 1.8,
    "font_size_pt": 12,
    "line_spread": 1.15,
    "item_gap_pt": 10,
    "math_skip_pt": 6
  }},
  "question_patch": null
}}
(Lưu ý: Nếu giáo viên yêu cầu sửa nội dung/công thức câu hỏi cụ thể, điền question_patch: {{"item_id": "UUID-của-câu", "field": "content_latex", "new_content": "nội dung mới"}} hoặc null nếu không có)."""

    try:
        if image_data:
            user_content = [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data}}
            ]
        else:
            user_content = prompt

        response = client.chat.completions.create(
            model=vision_model,
            messages=[{"role": "user", "content": user_content}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()
        data = json.loads(raw_text)

        ui_status = data.get("ui_status_message", "Đã cập nhật bố cục theo yêu cầu.")
        new_knobs = data.get("updated_layout_knobs", current_knobs)

        # Áp dụng question_patch nếu có
        patch_info = data.get("question_patch")
        if patch_info and isinstance(patch_info, dict):
            p_id = patch_info.get("item_id")
            p_field = patch_info.get("field", "content_latex")
            p_val = patch_info.get("new_content")
            if p_id and p_val:
                target_item = db.query(ExamItem).filter(ExamItem.id == p_id).first()
                if target_item:
                    snap = dict(target_item.problem_snapshot or {})
                    snap[p_field] = p_val
                    target_item.problem_snapshot = snap
                    db.commit()

        # Re-fetch items for preview
        items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
        items_payload = [{
            "id": str(it.id),
            "display_label": it.display_label,
            "max_points": float(it.max_points or 1.0),
            "problem_snapshot": it.problem_snapshot,
            "rubric_data": it.rubric_data
        } for it in items]

        preview_res = requests.post(
            f"{EXPORT_SERVICE_URL}/api/export/latex/preview",
            json={
                "exam_id": str(exam.id),
                "title": exam.title,
                "header_config": header_cfg,
                "layout_knobs": new_knobs,
                "items": items_payload,
                "mode": mode
            },
            timeout=45
        ).json()

        return {
            "status": "success",
            "ui_status_message": ui_status,
            "updated_layout_knobs": new_knobs,
            "preview_data": preview_res
        }
    except Exception as e:
        logger.error(f"Error in layout agent: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi AI Layout Agent: {str(e)}")
