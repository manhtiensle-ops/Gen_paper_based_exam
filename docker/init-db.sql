CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_type_enum') THEN
        CREATE TYPE section_type_enum AS ENUM ('SHORT_ANSWER', 'ESSAY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'structure_type_enum') THEN
        CREATE TYPE structure_type_enum AS ENUM ('SINGLE', 'INDEPENDENT_PARTS', 'SHARED_STEM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_enum') THEN
        CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD', 'OLYMPIAD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'main_topic_enum') THEN
        CREATE TYPE main_topic_enum AS ENUM (
            'ALGEBRA',
            'NUMBER_THEORY',
            'PLANE_GEOMETRY',
            'SOLID_GEOMETRY',
            'INEQUALITY_EXTREMA',
            'COMBINATORICS_PROBABILITY',
            'REAL_WORLD_MATH'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingestion_status_enum') THEN
        CREATE TYPE ingestion_status_enum AS ENUM (
            'UPLOADED',
            'CONVERTING_IMAGES',
            'OCR_PROCESSING',
            'REVIEW_NEEDED',
            'PUBLISHED',
            'FAILED'
        );
    END IF;
END $$;

-- 1. SOURCE EXAM PAPERS
CREATE TABLE IF NOT EXISTS source_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    exam_level VARCHAR(100) DEFAULT 'HSG_TINH',
    grade INT NOT NULL DEFAULT 9,
    school_or_province VARCHAR(255),
    academic_year VARCHAR(20),
    duration_minutes INT DEFAULT 120,
    original_file_key TEXT NOT NULL,
    page_image_keys JSONB DEFAULT '[]'::jsonb,
    status ingestion_status_enum DEFAULT 'UPLOADED',
    processing_logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. QUESTION BANK
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
    original_question_number INT NOT NULL,
    
    section_type section_type_enum NOT NULL,
    structure_type structure_type_enum NOT NULL DEFAULT 'SINGLE',
    default_points NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    
    content_latex TEXT NOT NULL,
    normalized_hash VARCHAR(64) NOT NULL,
    sub_questions JSONB DEFAULT '[]'::jsonb,
    solution_latex TEXT,
    final_answer TEXT,
    
    has_figure BOOLEAN DEFAULT FALSE,
    figures_meta JSONB DEFAULT '[]'::jsonb,
    
    grade INT NOT NULL DEFAULT 9,
    main_topic main_topic_enum NOT NULL,
    sub_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    solution_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
    difficulty difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    
    semantic_summary TEXT NOT NULL,
    embedding vector(768),
    usage_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_q_lookup ON questions (grade, section_type, main_topic, difficulty, structure_type) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_q_subtopics_gin ON questions USING GIN (sub_topics);
CREATE INDEX IF NOT EXISTS idx_q_hash ON questions (normalized_hash);
CREATE INDEX IF NOT EXISTS idx_q_embedding_hnsw ON questions USING hnsw (embedding vector_cosine_ops);

-- 3. EXAM BLUEPRINTS
CREATE TABLE IF NOT EXISTS exam_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    grade INT NOT NULL DEFAULT 9,
    source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
    sections_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSEMBLED EXAMS
CREATE TABLE IF NOT EXISTS generated_exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    blueprint_id UUID REFERENCES exam_blueprints(id) ON DELETE SET NULL,
    slots_state JSONB NOT NULL,
    exported_docx_key TEXT,
    exported_pdf_key TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
