# SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION

**Project Name:** HSG Math Exam Library & Algorithmic Generator (Vietnamese Secondary School Olympiad)  
**Architecture Pattern:** Event-Driven Microservices (Docker Compose Local-First)  
**Target User:** Vietnamese Math Teachers (THCS - Grades 8 & 9 gifted exams)

---

## 1. SYSTEM OBJECTIVES & DESIGN PRINCIPLES

1. **Zero-Hallucination Exam Assembly:**
   - LLMs are strictly forbidden from fabricating new math problems directly (Zero-shot / Few-shot generative math leads to unsolvable problems or invalid constraints).
   - Exam generation operates **100% via Deterministic SQL Filtering + Vector Similarity Scoring (Cosine Distance in pgvector)** from a verified database of past official exams.

2. **Vietnamese Math Typography & Language First:**
   - Linux containers must include proper Unicode UTF-8 locales and Vietnamese fonts (`fonts-noto-core`, `fonts-noto-cjk`, `fonts-dejavu`) so that LibreOffice and Pandoc never drop diacritics.
   - Formulas must strictly adopt Vietnamese math conventions (e.g., decimal comma instead of dot: `$235,2\text{ cm}^2$`, angle notations like `$\widehat{ABC}$`, degree `^\circ`, and cases `\begin{cases}`).

3. **Multi-Page Layout & Visual Figure Preservation:**
   - Multi-page exam documents are processed as unified image streams to prevent split solutions.
   - Geometry and real-world figures (e.g., trapezoid gutters, geometric circles) are localized via 2D bounding boxes, automatically cropped with Pillow, and persisted into MinIO object storage.

---

## 2. INFRASTRUCTURE & MICROSERVICES TOPOLOGY

All components are containerized for local Linux deployment via Docker Compose:

1. **`postgres-db` (`pgvector/pgvector:pg16`):**
   - Stores relational metadata, JSONB sub-questions, full-text search indexes, and 768-dimensional vector embeddings with HNSW indexing.
2. **`minio-storage` (`minio/minio`):**
   - S3-compatible local bucket for original DOCX/PDF uploads, rendered 300 DPI page images, and cropped figure assets.
3. **`redis-broker` (`redis:7-alpine`):**
   - Job queue broker for asynchronous exam document ingestion and export rendering.
4. **`core-api` (FastAPI / Python 3.11):**
   - Exam Blueprint configuration, Question Bank CRUD, verification state toggling, and SQL/pgvector hybrid generation engine.
5. **`ingestion-worker` (Celery Worker + LibreOffice Headless + Poppler + Pillow):**
   - Ingests uploaded DOCX/PDF, converts via LibreOffice to high-res PNGs, invokes Gemini Vision API (Structured Outputs), crops figures, normalizes LaTeX, computes SHA-256 deduplication hashes, and seeds embeddings.
6. **`export-service` (FastAPI + Pandoc + XeLaTeX):**
   - Compiles selected exam questions into `.docx` (with native Word OMML equations using `pandoc -f markdown+tex_math_dollars -t docx`) and printable `.pdf`.
7. **`frontend-ui` (Next.js 14 App Router, TypeScript, TailwindCSS, KaTeX):**
   - Web application tailored for Vietnamese teachers with KaTeX equation rendering, question swap controls, and document review queues.

---

## 3. DIRECTORY STRUCTURE

```text
hsg-math-platform/
├── docker-compose.yml
├── .env.example
├── ARCHITECTURE_SPEC.md
├── DATA_STANDARDS_SPEC.md
├── LLM_INGESTION_PIPELINE_SPEC.md
├── services/
│   ├── core-api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app/
│   │       ├── main.py
│   │       ├── database.py
│   │       ├── models/          # SQLAlchemy 2.0 ORM
│   │       ├── schemas/         # Pydantic v2 schemas
│   │       ├── routers/         # exams.py, questions.py, generator.py
│   │       └── services/        # hybrid_search.py, minio_client.py
│   ├── ingestion-worker/
│   │   ├── Dockerfile           # LibreOffice, poppler-utils, fonts-noto
│   │   ├── requirements.txt
│   │   └── worker/
│   │       ├── celery_app.py
│   │       ├── tasks.py
│   │       ├── converter.py     # DOCX -> PDF -> PNG (300 DPI)
│   │       ├── vision_ocr.py    # Gemini Vision API calls
│   │       ├── image_cropper.py # Crop bounding boxes via Pillow
│   │       ├── normalizer.py    # LaTeX cleaning & deduplication hash
│   │       └── embedder.py      # Google text-embedding-004
│   └── export-service/
│       ├── Dockerfile           # Pandoc, XeLaTeX, fonts-dejavu
│       └── app/
│           ├── main.py
│           └── compiler.py      # Pandoc Markdown to Word OMML conversion
└── frontend/                    # Next.js UI with KaTeX
```

---

## 4. DOCKER ENVIRONMENT REQUIREMENTS (LINUX & VIETNAMESE LOCALIZATION)

To ensure that headless LibreOffice conversions do not garble Vietnamese accents (e.g., ệ, ơ, ư, đ), Dockerfiles for ingestion-worker and export-service must include:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    fonts-noto-core \
    fonts-noto-cjk \
    fonts-dejavu-core \
    poppler-utils \
    libreoffice-writer \
    libreoffice-calc \
    && rm -rf /var/lib/apt/lists/*

RUN locale-gen vi_VN.UTF-8
ENV LANG=vi_VN.UTF-8
ENV LANGUAGE=vi_VN:vi
ENV LC_ALL=vi_VN.UTF-8
```

---

## 5. REPOSITORY INITIALIZATION ROADMAP FOR CODING AGENT

- **Milestone 1 (Infrastructure & DB):** Spin up postgres-db, redis-broker, and minio-storage via docker-compose.yml. Initialize PostgreSQL schema and pgvector indexes.
- **Milestone 2 (Ingestion Pipeline):** Build ingestion-worker container. Implement LibreOffice document conversion, Gemini 2.5 Vision API call with strict Pydantic schemas, Pillow image cropping, and vector embedding persistence.
- **Milestone 3 (Algorithmic Generator):** Implement core-api blueprint builder and hybrid SQL scoring queries for template cloning and slot swapping.
- **Milestone 4 (Document Exporter):** Implement export-service with Pandoc OMML translation to export editable .docx test papers and answer keys.
- **Milestone 5 (Frontend Dashboard):** Build Next.js UI displaying KaTeX equations and slot-swapping controls.
