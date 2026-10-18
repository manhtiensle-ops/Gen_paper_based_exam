from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from .compiler import compile_exam_document, get_minio_client
from .latex_engine import compile_latex_to_preview

app = FastAPI(
    title="HSG Math Exam Export Service",
    description="Microservice for compiling exams into Word OMML (.docx) and printable PDF",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExportRequest(BaseModel):
    exam_id: str
    title: str
    slots_state: List[Dict[str, Any]]
    export_type: Optional[str] = "docx"

class LatexPreviewRequest(BaseModel):
    exam_id: str
    title: str = "ĐỀ THI HỌC SINH GIỎI"
    header_config: Dict[str, Any] = {}
    layout_knobs: Dict[str, Any] = {}
    items: List[Dict[str, Any]] = []
    mode: str = "EXAM"

@app.on_event("startup")
def on_startup():
    try:
        get_minio_client()
    except Exception as e:
        print(f"[Export MinIO Warning] {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "export-service"}

@app.post("/api/export")
def export_exam(payload: ExportRequest):
    try:
        file_key = compile_exam_document(
            exam_id=payload.exam_id,
            title=payload.title,
            slots_state=payload.slots_state,
            export_type=payload.export_type or "docx"
        )
        return {
            "status": "SUCCESS",
            "file_key": file_key,
            "export_type": payload.export_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/export/latex/preview")
def preview_latex_exam(payload: LatexPreviewRequest):
    try:
        result = compile_latex_to_preview(
            exam_id=payload.exam_id,
            title=payload.title,
            header_config=payload.header_config,
            layout_knobs=payload.layout_knobs,
            items=payload.items,
            mode=payload.mode
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
