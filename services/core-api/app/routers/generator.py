import os
import uuid
import re
import unicodedata
from typing import List, Optional, Dict, Any
from urllib.parse import quote
import requests
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ExamBlueprint, GeneratedExam, Question, ExamItem
from ..schemas import (
    ExamBlueprintCreate, ExamBlueprintUpdate, ExamBlueprintResponse,
    GenerateExamRequest, SwapQuestionRequest, GeneratedExamResponse,
    QuestionResponse
)
from ..services.hybrid_search import search_candidate_questions
from ..services.minio_client import get_minio_client

router = APIRouter(prefix="/api/generator", tags=["Exam Generator & Blueprints"])

EXPORT_SERVICE_URL = os.getenv("EXPORT_SERVICE_URL", "http://export-service:8001")

def slugify_vietnamese(text: str) -> str:
    v_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
        'Đ': 'D'
    }
    for k, v in v_map.items():
        text = text.replace(k, v)
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '_', text)

# Blueprint endpoints
@router.post("/blueprints", response_model=ExamBlueprintResponse, status_code=status.HTTP_201_CREATED)
def create_blueprint(payload: ExamBlueprintCreate, db: Session = Depends(get_db)):
    bp = ExamBlueprint(
        name=payload.name,
        description=payload.description,
        grade=payload.grade,
        is_preset=payload.is_preset,
        target_total_score=payload.target_total_score,
        duration_minutes=payload.duration_minutes,
        source_exam_id=payload.source_exam_id,
        sections_config=payload.sections_config
    )
    db.add(bp)
    db.commit()
    db.refresh(bp)
    return bp

@router.get("/blueprints", response_model=List[ExamBlueprintResponse])
def list_blueprints(grade: Optional[int] = None, is_preset: Optional[bool] = None, db: Session = Depends(get_db)):
    query = db.query(ExamBlueprint)
    if grade is not None:
        query = query.filter(ExamBlueprint.grade == grade)
    if is_preset is not None:
        query = query.filter(ExamBlueprint.is_preset == is_preset)
    return query.order_by(ExamBlueprint.is_preset.desc(), ExamBlueprint.created_at.desc()).all()

@router.get("/blueprints/{blueprint_id}", response_model=ExamBlueprintResponse)
def get_blueprint(blueprint_id: uuid.UUID, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return bp

@router.put("/blueprints/{blueprint_id}", response_model=ExamBlueprintResponse)
def update_blueprint(blueprint_id: uuid.UUID, payload: ExamBlueprintUpdate, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(bp, field, val)
    
    db.commit()
    db.refresh(bp)
    return bp

@router.post("/blueprints/{blueprint_id}/clone", response_model=ExamBlueprintResponse)
def clone_blueprint(blueprint_id: uuid.UUID, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    
    new_bp = ExamBlueprint(
        name=f"Bản sao - {bp.name}",
        description=bp.description,
        grade=bp.grade,
        is_preset=False,
        target_total_score=bp.target_total_score,
        duration_minutes=bp.duration_minutes,
        sections_config=bp.sections_config
    )
    db.add(new_bp)
    db.commit()
    db.refresh(new_bp)
    return new_bp

@router.delete("/blueprints/{blueprint_id}")
def delete_blueprint(blueprint_id: uuid.UUID, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    if bp.is_preset:
        raise HTTPException(status_code=400, detail="Không thể xóa khung ma trận chuẩn có sẵn của hệ thống")
    db.delete(bp)
    db.commit()
    return {"status": "ok", "message": "Đã xóa khung ma trận thành công"}

# Algorithmic Exam Generation (Zero-hallucination via SQL + pgvector)
@router.post("/generate", response_model=GeneratedExamResponse)
def generate_exam(payload: GenerateExamRequest, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == payload.blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    selected_slots = []
    used_ids = list(payload.exclude_question_ids)

    # Assemble each slot deterministically
    for section in bp.sections_config:
        section_type = section.get("section_type", "ESSAY")
        slots = section.get("slots", [])
        for slot in slots:
            slot_idx = slot.get("slot_index", len(selected_slots) + 1)
            main_topic = slot.get("main_topic")
            difficulty = slot.get("difficulty")
            points = slot.get("points", 1.0)
            structure_type = slot.get("structure_type")
            ref_q_id = slot.get("reference_question_id")

            ref_embedding = None
            if ref_q_id:
                ref_q = db.query(Question).filter(Question.id == ref_q_id).first()
                if ref_q and ref_q.embedding is not None:
                    ref_embedding = ref_q.embedding

            candidates = search_candidate_questions(
                db=db,
                grade=bp.grade,
                section_type=section_type,
                main_topic=main_topic,
                difficulty=difficulty,
                structure_type=structure_type,
                reference_embedding=ref_embedding,
                exclude_ids=used_ids,
                limit=1
            )

            chosen_q = candidates[0] if candidates else None
            if chosen_q:
                used_ids.append(chosen_q.id)
                # increment usage count
                chosen_q.usage_count = (chosen_q.usage_count or 0) + 1
                q_data = {
                    "id": str(chosen_q.id),
                    "content_latex": chosen_q.content_latex,
                    "solution_latex": chosen_q.solution_latex,
                    "final_answer": chosen_q.final_answer,
                    "sub_questions": chosen_q.sub_questions,
                    "has_figure": chosen_q.has_figure,
                    "figures_meta": chosen_q.figures_meta,
                    "main_topic": chosen_q.main_topic,
                    "difficulty": chosen_q.difficulty,
                }
            else:
                q_data = None

            selected_slots.append({
                "slot_index": slot_idx,
                "section_type": section_type,
                "main_topic": main_topic,
                "difficulty": difficulty,
                "points": points,
                "question": q_data
            })

    db.commit()

    generated_exam = GeneratedExam(
        title=payload.title,
        blueprint_id=bp.id,
        folder_id=payload.folder_id,
        slots_state=selected_slots
    )
    db.add(generated_exam)
    db.commit()
    db.refresh(generated_exam)

    return generated_exam

# Slot Swapping: Retrieve alternative questions for a given slot
@router.post("/swap", response_model=List[QuestionResponse])
def swap_question_candidates(payload: SwapQuestionRequest, db: Session = Depends(get_db)):
    current_q = db.query(Question).filter(Question.id == payload.current_question_id).first()
    if not current_q:
        raise HTTPException(status_code=404, detail="Reference question not found")

    main_topic = payload.main_topic or current_q.main_topic
    difficulty = payload.difficulty or current_q.difficulty
    exclude_ids = list(payload.exclude_question_ids) + [current_q.id]

    ref_embedding = current_q.embedding if current_q.embedding is not None else None

    candidates = search_candidate_questions(
        db=db,
        grade=current_q.grade,
        section_type=current_q.section_type,
        main_topic=main_topic,
        difficulty=difficulty,
        structure_type=current_q.structure_type,
        reference_embedding=ref_embedding,
        exclude_ids=exclude_ids,
        limit=5
    )
    return candidates

@router.get("/exams", status_code=status.HTTP_200_OK)
def list_generated_exams(
    tenant_id: Optional[str] = None,
    folder_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lấy danh sách các đề thi đã tạo phục vụ thanh thư mục quản lý đề."""
    query = db.query(GeneratedExam)
    if tenant_id:
        query = query.filter(GeneratedExam.tenant_id == tenant_id)
    if folder_id:
        if folder_id == "root":
            query = query.filter(GeneratedExam.folder_id.is_(None))
        else:
            query = query.filter(GeneratedExam.folder_id == folder_id)
    exams = query.order_by(GeneratedExam.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(e.id),
            "title": e.title,
            "total_target_score": float(e.total_target_score or 20.0),
            "folder_id": str(e.folder_id) if e.folder_id else None,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "slots_count": len(e.slots_state) if isinstance(e.slots_state, list) else 0,
            "has_template": e.template_document is not None
        }
        for e in exams
    ]


@router.get("/folders", status_code=status.HTTP_200_OK)
def list_exam_folders(
    tenant_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Danh sách các thư mục đề thi của giáo viên / trường."""
    from ..models.models import ExamFolder
    query = db.query(ExamFolder)
    if tenant_id:
        query = query.filter(ExamFolder.tenant_id == tenant_id)
    folders = query.order_by(ExamFolder.created_at.asc()).all()
    return [
        {
            "id": str(f.id),
            "name": f.name,
            "parent_id": str(f.parent_id) if f.parent_id else None,
            "color": f.color,
            "tenant_id": f.tenant_id
        }
        for f in folders
    ]


@router.post("/folders", status_code=status.HTTP_201_CREATED)
def create_exam_folder(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Tạo thư mục mới để phân loại đề thi."""
    from ..models.models import ExamFolder
    name = payload.get("name", "Thư mục mới").strip()
    tenant_id = payload.get("tenant_id", "default_school")
    parent_id = payload.get("parent_id")
    folder = ExamFolder(
        id=uuid.uuid4(),
        name=name,
        tenant_id=tenant_id,
        parent_id=uuid.UUID(parent_id) if parent_id else None,
        color=payload.get("color", "#4f46e5")
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return {
        "id": str(folder.id),
        "name": folder.name,
        "parent_id": str(folder.parent_id) if folder.parent_id else None,
        "color": folder.color
    }


@router.patch("/exams/{exam_id}/move", status_code=status.HTTP_200_OK)
def move_exam_to_folder(
    exam_id: uuid.UUID,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Di chuyển đề thi vào thư mục tương ứng."""
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(404, "Không tìm thấy đề thi")
    folder_id = payload.get("folder_id")
    exam.folder_id = uuid.UUID(folder_id) if folder_id else None
    db.commit()
    return {"status": "SUCCESS", "exam_id": str(exam.id), "folder_id": folder_id}


@router.get("/exams/{exam_id}", response_model=GeneratedExamResponse)
def get_generated_exam(exam_id: uuid.UUID, db: Session = Depends(get_db)):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Generated exam not found")
    return exam

# Trigger compilation to Word (.docx) & PDF via export-service
@router.post("/exams/{exam_id}/export")
def trigger_exam_export(exam_id: uuid.UUID, export_type: str = "docx", db: Session = Depends(get_db)):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Generated exam not found")

    try:
        resp = requests.post(
            f"{EXPORT_SERVICE_URL}/api/export",
            json={
                "exam_id": str(exam.id),
                "title": exam.title,
                "slots_state": exam.slots_state,
                "export_type": export_type
            },
            timeout=120
        )
        if resp.status_code == 200:
            data = resp.json()
            if export_type == "docx":
                exam.exported_docx_key = data.get("file_key")
            else:
                exam.exported_pdf_key = data.get("file_key")
            db.commit()
            return data
        else:
            raise HTTPException(status_code=502, detail=f"Export service error: {resp.text}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with export service: {str(exc)}")


# Direct Streaming Download for Client (Option B)
@router.get("/exams/{exam_id}/download")
def download_exam_file(
    exam_id: uuid.UUID,
    format: str = "docx",
    mode: str = "EXAM",
    db: Session = Depends(get_db)
):
    exam = db.query(GeneratedExam).filter(GeneratedExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

    fmt = format.lower()
    if fmt not in ["docx", "pdf"]:
        fmt = "docx"

    mode_str = mode.upper()
    minio_client = get_minio_client()
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")

    file_key = None

    # NẾU TẢI PDF: BẮT BUỘC DÙNG BẢN PDF TEX LIVE CHUẨN ĐỒNG NHẤT VỚI PREVIEW TRÊN MÀN HÌNH
    if fmt == "pdf":
        studio_pdf_key = f"studio/{exam_id}/{mode_str.lower()}/document.pdf"
        try:
            minio_client.stat_object(bucket_name, studio_pdf_key)
            file_key = studio_pdf_key
        except Exception:
            # Biên dịch TeX Live tức thời nếu chưa có
            items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
            items_payload = [{
                "id": str(it.id),
                "display_label": it.display_label,
                "max_points": float(it.max_points or 1.0),
                "problem_snapshot": it.problem_snapshot,
                "rubric_data": it.rubric_data
            } for it in items]

            try:
                resp = requests.post(
                    f"{EXPORT_SERVICE_URL}/api/export/latex/preview",
                    json={
                        "exam_id": str(exam.id),
                        "title": exam.title,
                        "header_config": exam.header_config or {},
                        "layout_knobs": {
                            "margin_top_cm": 1.8,
                            "margin_bottom_cm": 1.8,
                            "margin_left_cm": 2.0,
                            "margin_right_cm": 1.8,
                            "font_size_pt": 12,
                            "line_spread": 1.15,
                            "item_gap_pt": 10,
                            "math_skip_pt": 6
                        },
                        "items": items_payload,
                        "mode": mode_str
                    },
                    timeout=45
                )
                if resp.status_code == 200:
                    data = resp.json()
                    file_key = data.get("pdf_key")
            except Exception:
                pass

        # Fallback nếu vẫn chưa có
        if not file_key:
            file_key = exam.exported_pdf_key

    # NẾU TẢI WORD (.docx): BẮT BUỘC DÙNG NATIVE OMML DOCX BUILDER CHUẨN BỘ GD&ĐT
    else:
        items = db.query(ExamItem).filter(ExamItem.exam_id == exam_id).order_by(ExamItem.order_index).all()
        slots_payload = [{
            "slot_index": it.order_index + 1,
            "points": float(it.max_points or 1.0),
            "question": it.problem_snapshot,
            "rubric_data": it.rubric_data
        } for it in items] if items else exam.slots_state

        try:
            resp = requests.post(
                f"{EXPORT_SERVICE_URL}/api/export/docx/native",
                json={
                    "exam_id": str(exam.id),
                    "title": exam.title,
                    "header_config": exam.header_config or {},
                    "slots_state": slots_payload,
                    "template_document": exam.template_document,
                    "mode": mode_str
                },
                timeout=60
            )
            if resp.status_code == 200:
                data = resp.json()
                file_key = data.get("file_key")
                exam.exported_docx_key = file_key
                db.commit()
            else:
                raise HTTPException(status_code=502, detail=f"Native Word export compilation error: {resp.text}")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Lỗi xuất Word Native: {str(exc)}")

    if not file_key:
        raise HTTPException(status_code=500, detail="Chưa có file để tải về")

    try:
        minio_response = minio_client.get_object(bucket_name, file_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đọc file từ MinIO: {str(e)}")

    slug = slugify_vietnamese(exam.title) or f"de_thi_{str(exam.id)[:8]}"
    if mode_str == "RUBRIC":
        filename = f"huong_dan_cham_{slug}.{fmt}"
    else:
        filename = f"de_thi_{slug}.{fmt}"

    media_types = {
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pdf": "application/pdf"
    }

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"; filename*=UTF-8\'\'{quote(filename)}',
        "Access-Control-Expose-Headers": "Content-Disposition"
    }

    return StreamingResponse(
        minio_response.stream(32 * 1024),
        media_type=media_types.get(fmt, "application/octet-stream"),
        headers=headers
    )
