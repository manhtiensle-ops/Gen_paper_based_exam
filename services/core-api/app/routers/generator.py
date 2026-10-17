import os
import uuid
from typing import List
import requests
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ExamBlueprint, GeneratedExam, Question
from ..schemas import (
    ExamBlueprintCreate, ExamBlueprintResponse,
    GenerateExamRequest, SwapQuestionRequest, GeneratedExamResponse,
    QuestionResponse
)
from ..services.hybrid_search import search_candidate_questions

router = APIRouter(prefix="/api/generator", tags=["Exam Generator & Blueprints"])

EXPORT_SERVICE_URL = os.getenv("EXPORT_SERVICE_URL", "http://export-service:8001")

# Blueprint endpoints
@router.post("/blueprints", response_model=ExamBlueprintResponse, status_code=status.HTTP_201_CREATED)
def create_blueprint(payload: ExamBlueprintCreate, db: Session = Depends(get_db)):
    bp = ExamBlueprint(
        name=payload.name,
        description=payload.description,
        grade=payload.grade,
        source_exam_id=payload.source_exam_id,
        sections_config=payload.sections_config
    )
    db.add(bp)
    db.commit()
    db.refresh(bp)
    return bp

@router.get("/blueprints", response_model=List[ExamBlueprintResponse])
def list_blueprints(db: Session = Depends(get_db)):
    return db.query(ExamBlueprint).order_by(ExamBlueprint.created_at.desc()).all()

@router.get("/blueprints/{blueprint_id}", response_model=ExamBlueprintResponse)
def get_blueprint(blueprint_id: uuid.UUID, db: Session = Depends(get_db)):
    bp = db.query(ExamBlueprint).filter(ExamBlueprint.id == blueprint_id).first()
    if not bp:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return bp

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
