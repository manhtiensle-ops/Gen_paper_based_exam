import os
import json
import base64
import re
from PIL import Image
from .vision_schema import (
    LLMExamExtractionOutput,
    LLMPageQuestionsOutput,
    LLMExtractedQuestion,
    LLMFigureBox,
    FigurePlacementEnum,
    FigurePositionEnum,
    SectionTypeEnum,
    StructureTypeEnum,
    DifficultyEnum,
    MainTopicEnum,
    SubTopicEnum
)
from .normalizer import infer_topic_and_subtopics

PAGE_SYSTEM_INSTRUCTION = """
Bạn là chuyên gia số hóa đề thi Toán Học Sinh Giỏi (THCS Việt Nam) sang LaTeX & JSON.
Nhiệm vụ: Đọc duy nhất trang ảnh được cung cấp và bóc tách các câu hỏi / bài toán có trên trang vào định dạng JSON.

QUY TẮC LATEX & ĐỊNH DẠNG:
1. Mọi công thức, biểu thức, biến số ($x, y, n, p$), đơn vị ($cm, kg$) PHẢI được bọc trong $...$ hoặc $$...$$.
2. Hệ phương trình dùng \\begin{cases} ... \\end{cases}. Ký hiệu độ là ^\\circ (VD: 60^\\circ). Ký hiệu góc dùng \\widehat{ABC}.
3. Không chèn các tiền tố "Câu 1:", "Bài 1:" vào bên trong trường content_latex.
4. Với bài hình học có các ý a), b), c) và giả thiết chung:
   - Đặt structure_type = "SHARED_STEM".
   - content_latex = toàn bộ giả thiết chung (VD: "Cho tam giác nhọn ABC...").
   - sub_questions = danh sách các ý a), b), c) với đầy đủ nội dung content_latex của từng ý.
   - Nếu có hình vẽ trên trang, đặt has_figure = true. KHÔNG cần tự bắt tọa độ box_2d ở bước này.
5. Với bài đại số/số học có các ý độc lập 1), 2) hoặc a), b) không chung giả thiết:
   - Đặt structure_type = "INDEPENDENT_PARTS".
   - sub_questions = danh sách từng bài toán độc lập kèm điểm và lời giải riêng.
6. Trả về đúng định dạng JSON theo schema đã chỉ định.
"""

def locate_geometry_diagram_box(img_path: str) -> list[int] | None:
    """
    Pass 2 Figure Grounding:
    Dedicated call with specialized prompt to strictly locate the geometry diagram box [ymin, xmin, ymax, xmax].
    Excludes table borders, score columns, and solution text paragraphs.
    """
    omniroute_key = (os.getenv("OMNIROUTE_API_KEY") or os.getenv("LLM_API_KEY") or "").strip(' "\'')
    omniroute_base_url = (os.getenv("OMNIROUTE_BASE_URL") or os.getenv("LLM_BASE_URL") or "").strip(' "\'')
    model_name = (os.getenv("OMNIROUTE_VISION_MODEL") or os.getenv("LLM_VISION_MODEL") or "antigravity/gemini-3.8-flash-tiered").strip(' "\'')

    if not (omniroute_key and omniroute_key not in ["your_omniroute_key_here", "mock_or_dev_key"]):
        return None

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=omniroute_key,
            base_url=omniroute_base_url if omniroute_base_url else None
        )

        with open(img_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("utf-8")

        prompt = (
            "Locate ONLY the geometric diagram (lines, circles, triangles and vertex labels A, B, C, D, E, F, H, K, I, M, N). "
            "Strictly exclude surrounding table borders, score columns (0,5; 1,5), and solution text paragraphs. "
            "Return exact [ymin, xmin, ymax, xmax] on 0-1000 scale.\n"
            "Format output as strict JSON:\n"
            "{\n"
            '  "has_diagram": true,\n'
            '  "box_2d": [ymin, xmin, ymax, xmax]\n'
            "}"
        )

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                    ]
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content or ""
        clean_json = raw_text.strip()
        if clean_json.startswith("```"):
            clean_json = re.sub(r"^```(?:json)?\s*", "", clean_json)
            clean_json = re.sub(r"\s*```$", "", clean_json)
        data = json.loads(clean_json)
        if data.get("has_diagram") and data.get("box_2d") and len(data["box_2d"]) == 4:
            box = data["box_2d"]
            if box[2] > box[0] and box[3] > box[1]:
                return box
    except Exception as e:
        print(f"[Pass 2 Diagram Grounding Warning] {e}")

    return None

def extract_single_page_questions(img_path: str, page_num: int, total_pages: int) -> list[LLMExtractedQuestion]:
    """
    Pass 1: Text OCR for a single page image.
    """
    omniroute_key = (os.getenv("OMNIROUTE_API_KEY") or os.getenv("LLM_API_KEY") or "").strip(' "\'')
    omniroute_base_url = (os.getenv("OMNIROUTE_BASE_URL") or os.getenv("LLM_BASE_URL") or "").strip(' "\'')
    model_name = (os.getenv("OMNIROUTE_VISION_MODEL") or os.getenv("LLM_VISION_MODEL") or "antigravity/gemini-3.8-flash-tiered").strip(' "\'')

    if omniroute_key and omniroute_key not in ["your_omniroute_key_here", "mock_or_dev_key"]:
        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=omniroute_key,
                base_url=omniroute_base_url if omniroute_base_url else None
            )

            with open(img_path, "rb") as f:
                b64_data = base64.b64encode(f.read()).decode("utf-8")

            schema_str = json.dumps(LLMPageQuestionsOutput.model_json_schema(), ensure_ascii=False)
            prompt_instruction = (
                f"{PAGE_SYSTEM_INSTRUCTION}\n\n"
                f"Đang xử lý trang {page_num}/{total_pages}.\n"
                f"Return JSON strictly adhering to this schema:\n{schema_str}"
            )

            messages = [
                {"role": "system", "content": prompt_instruction},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Trích xuất tất cả câu hỏi và lời giải có trên trang {page_num} này:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}}
                    ]
                }
            ]

            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            raw_text = response.choices[0].message.content or ""
            clean_json = raw_text.strip()
            if clean_json.startswith("```"):
                clean_json = re.sub(r"^```(?:json)?\s*", "", clean_json)
                clean_json = re.sub(r"\s*```$", "", clean_json)
            parsed = LLMPageQuestionsOutput.model_validate_json(clean_json)
            return parsed.questions

        except Exception as e:
            print(f"[OmniRoute Flash Error - Page {page_num}] {e}")

    # Fallback to Google Gemini SDK if configured
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key and gemini_key not in ["your_gemini_api_key_here", "mock_or_dev_key"]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            img = Image.open(img_path)

            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
                contents=[
                    f"--- TRANG {page_num}/{total_pages} ---",
                    img,
                    "Trích xuất toàn bộ câu hỏi trên trang này theo JSON schema."
                ],
                config=types.GenerateContentConfig(
                    system_instruction=PAGE_SYSTEM_INSTRUCTION,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=LLMPageQuestionsOutput,
                ),
            )
            if hasattr(response, "parsed") and response.parsed:
                return response.parsed.questions
            elif hasattr(response, "text"):
                parsed = LLMPageQuestionsOutput.model_validate_json(response.text)
                return parsed.questions
        except Exception as e:
            print(f"[Gemini Flash Error - Page {page_num}] {e}")

    return []

def extract_exam_from_images(image_paths: list[str]) -> LLMExamExtractionOutput:
    """
    Two-Pass Ingestion Pipeline:
    - Pass 1: Page-by-page text OCR.
    - Pass 2: High-precision figure grounding for geometry pages.
    - Python Stitcher: Merges SHARED_STEM geometry problems across pages.
    """
    total_pages = len(image_paths)
    all_extracted_questions: list[LLMExtractedQuestion] = []
    
    print(f"[Ingestion Pipeline] Processing {total_pages} pages using Two-Pass Architecture...")
    
    for idx, img_path in enumerate(image_paths, start=1):
        print(f"[Ingestion Pipeline] Pass 1 (Text OCR) - Page {idx}/{total_pages}...")
        page_questions = extract_single_page_questions(img_path, page_num=idx, total_pages=total_pages)
        
        # Check if this page contains a geometry diagram or question with figure
        needs_figure_grounding = any(
            getattr(q, "has_figure", False) or 
            bool(getattr(q, "figures", None)) or
            q.main_topic in [MainTopicEnum.PLANE_GEOMETRY, MainTopicEnum.SOLID_GEOMETRY]
            for q in page_questions
        )
        
        # Pass 2: Two-Pass Figure Grounding
        if needs_figure_grounding:
            print(f"[Ingestion Pipeline] Pass 2 (Figure Grounding) - Page {idx}/{total_pages}...")
            box_2d = locate_geometry_diagram_box(img_path)
            if box_2d:
                print(f"[Ingestion Pipeline] Located Diagram on Page {idx}: {box_2d}")
                # Assign figure box to the geometry question on this page
                for q in page_questions:
                    if q.main_topic in [MainTopicEnum.PLANE_GEOMETRY, MainTopicEnum.SOLID_GEOMETRY] or getattr(q, "has_figure", False):
                        q.has_figure = True
                        q.figures.append(LLMFigureBox(
                            page_number=idx,
                            box_2d=box_2d,
                            placement_target=FigurePlacementEnum.STEM,
                            position=FigurePositionEnum.RIGHT_FLOAT,
                            caption="Hình vẽ hình học bài toán"
                        ))
                        break

        all_extracted_questions.extend(page_questions)

    # Apply Stitcher: combine SHARED_STEM geometry questions and handle continuation
    if all_extracted_questions:
        stitched_questions: list[LLMExtractedQuestion] = []
        for q in all_extracted_questions:
            # Check if this question is a continuation of the previous question
            is_same_number = stitched_questions and q.question_number == stitched_questions[-1].question_number
            is_geo_continuation = (
                stitched_questions and 
                stitched_questions[-1].structure_type in [StructureTypeEnum.SHARED_STEM, "SHARED_STEM"] and
                (q.main_topic in [MainTopicEnum.PLANE_GEOMETRY, "PLANE_GEOMETRY"] or "chứng minh" in q.content_latex.lower()) and
                (not q.content_latex or q.content_latex.strip().startswith(("Gọi", "Kẻ", "Chứng minh", "c)", "b)", "d)")))
            )

            if is_same_number or is_geo_continuation:
                prev_q = stitched_questions[-1]
                # If q has sub_questions, merge them
                if q.sub_questions:
                    prev_q.sub_questions.extend(q.sub_questions)
                elif q.content_latex and is_geo_continuation:
                    # Append as sub-part c or continuation
                    part_label = f"c)" if len(prev_q.sub_questions) >= 2 else "b)"
                    prev_q.sub_questions.append(LLMSubQuestion(
                        part_id=part_label[0],
                        label=part_label,
                        points=q.points,
                        content_latex=q.content_latex,
                        solution_latex=q.solution_latex or "",
                        final_answer=q.final_answer or "",
                        main_topic=q.main_topic,
                        sub_topics=q.sub_topics,
                        solution_methods=q.solution_methods,
                        difficulty=q.difficulty,
                        semantic_summary=q.semantic_summary or q.content_latex[:200]
                    ))
                if q.solution_latex:
                    prev_q.solution_latex = (prev_q.solution_latex or "") + "\n" + q.solution_latex
                if q.figures:
                    prev_q.figures.extend(q.figures)
                    prev_q.has_figure = True
            else:
                main_topic_val = q.main_topic.value if hasattr(q.main_topic, "value") else str(q.main_topic)
                sub_topics_val = [st.value if hasattr(st, "value") else str(st) for st in q.sub_topics]
                refined_main, refined_subs = infer_topic_and_subtopics(q.content_latex, main_topic_val, sub_topics_val)
                try:
                    q.main_topic = MainTopicEnum(refined_main)
                    q.sub_topics = [SubTopicEnum(st) for st in refined_subs if st in SubTopicEnum.__members__]
                except Exception:
                    pass
                stitched_questions.append(q)

        # Re-index questions sequentially
        for idx, q in enumerate(stitched_questions, start=1):
            q.question_number = idx

        return LLMExamExtractionOutput(
            exam_title="Đề thi chọn học sinh giỏi Toán THCS",
            school_or_province="Sở GD&ĐT",
            academic_year="2025-2026",
            duration_minutes=120,
            questions=stitched_questions
        )

    # Fallback
    return LLMExamExtractionOutput(
        exam_title="Đề thi chọn học sinh giỏi Toán THCS",
        questions=[]
    )
