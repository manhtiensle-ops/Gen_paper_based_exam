from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import os
from .routers import exams_router, questions_router, generator_router
from .services.minio_client import get_minio_client

app = FastAPI(
    title="HSG Math Exam Core API",
    description="Backend API for Vietnamese Secondary School Gifted Mathematics Exam Generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exams_router)
app.include_router(questions_router)
app.include_router(generator_router)

@app.on_event("startup")
def on_startup():
    try:
        get_minio_client()
    except Exception as e:
        print(f"[MinIO Startup Warning] {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "core-api"}

@app.get("/api/assets/{object_key:path}")
def get_asset(object_key: str):
    try:
        client = get_minio_client()
        bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")
        obj = client.get_object(bucket_name, object_key)
        content_type = "image/png"
        if object_key.endswith(".pdf"):
            content_type = "application/pdf"
        elif object_key.endswith(".docx"):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        return StreamingResponse(obj, media_type=content_type)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

