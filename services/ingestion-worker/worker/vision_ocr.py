import os
import json
from PIL import Image
from .vision_schema import (
    LLMExamExtractionOutput,
    LLMExtractedQuestion,
    SectionTypeEnum,
    StructureTypeEnum,
    DifficultyEnum,
    MainTopicEnum,
    SubTopicEnum
)

SYSTEM_INSTRUCTION = """
You are a lead Vietnamese Mathematics Olympiad digitizer and LaTeX typesetting specialist.
Your mission is to read all provided exam page images and extract every problem, solution, and geometric diagram into strict JSON.

CRITICAL VIETNAMESE MATH RULES:
1. STRICT LATEX ENCLOSURE:
  - Every single mathematical expression, variable ($x, y, n, p$), metric ($14\\text{ cm}$), equation, and system MUST be enclosed in `$ ... $` (inline) or `$$ ... $$` (display).
  - Use `\\begin{cases} ... \\end{cases}` for systems. Use `\\left[ \\begin{array}{l} ... \\end{array} \\right.` for multi-case brackets.
  - Fix OCR artifacts from Word documents: Convert `Sin 75^0` to `$\\sin 75^\\circ$`. If sets show broken box characters like `n \\in []`, reconstruct them based on context to `$n \\in \\mathbb{N}$`.
  - Never embed prefixes like "Câu 1:", "Giải:" inside `content_latex` or `solution_latex`.

2. MULTI-PAGE STITCHING:
  - When a problem or solution spans across page boundaries, automatically merge them into a single continuous question record.

3. STRUCTURE DISCRIMINATION:
  - Mark as `SINGLE` if it is a standalone question.
  - Mark as `INDEPENDENT_PARTS` if items a) and b) are completely unrelated problems bundled under one number (e.g., a) Solve equation, b) Solve system).
  - Mark as `SHARED_STEM` if a common premise precedes sub-questions a) and b) (e.g., Geometry proof on parallelogram ABCD).

4. BOUNDING BOX LOCALIZATION:
  - For all geometric or technical diagrams, record `box_2d` as `[ymin, xmin, ymax, xmax]` normalized on a 0-1000 scale enclosing the entire drawing and vertex labels ($A, B, C, H, G, 60^\\circ$).
"""

def extract_exam_from_images(image_paths: list[str]) -> LLMExamExtractionOutput:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    if api_key and api_key not in ["your_gemini_api_key_here", "mock_or_dev_key"]:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            contents = []
            for idx, img_path in enumerate(image_paths, start=1):
                img = Image.open(img_path)
                contents.append(f"--- TRANG ẢNH SỐ {idx} ---")
                contents.append(img)
                
            contents.append("Hãy trích xuất toàn bộ câu hỏi và lời giải từ các trang ảnh trên theo đúng JSON Schema đã quy định.")

            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.5-pro"),
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=LLMExamExtractionOutput,
                ),
            )
            if hasattr(response, "parsed") and response.parsed:
                return response.parsed
            elif hasattr(response, "text"):
                data = json.loads(response.text)
                return LLMExamExtractionOutput.model_validate(data)
        except Exception as e:
            print(f"[Vision OCR Warning] Gemini Vision call failed: {e}. Falling back to default mock extraction.")

    # Fallback default extraction for testing / dev when real API is not accessible
    return LLMExamExtractionOutput(
        exam_title="Đề thi chọn học sinh giỏi Toán THCS (Mẫu Khởi tạo)",
        school_or_province="Sở GD&ĐT",
        academic_year="2025-2026",
        duration_minutes=120,
        questions=[
            LLMExtractedQuestion(
                question_number=1,
                section_type=SectionTypeEnum.SHORT_ANSWER,
                structure_type=StructureTypeEnum.SINGLE,
                points=1.0,
                content_latex="Cho biểu thức $P = \\sqrt{9 - \\sqrt{5\\sqrt{3} + 5\\sqrt{48 - 10\\sqrt{7 + 4\\sqrt{3}}}}}$. Tính giá trị của $P$.",
                solution_latex="Ta có $7 + 4\\sqrt{3} = (2 + \\sqrt{3})^2$. Khai căn và rút gọn tuần tự từ trong ra ngoài ta được $P = \\sqrt{3} - 1$.",
                final_answer="\\sqrt{3} - 1",
                main_topic=MainTopicEnum.ALGEBRA,
                sub_topics=[SubTopicEnum.ALG_RADICAL_SIMPLIFY],
                solution_methods=["Biến đổi căn thức bậc hai lồng nhau"],
                difficulty=DifficultyEnum.MEDIUM,
                semantic_summary="Bài toán rút gọn biểu thức chứa căn bậc hai lồng nhau, nhận diện hằng đẳng thức đáng nhớ để triệt tiêu căn."
            ),
            LLMExtractedQuestion(
                question_number=2,
                section_type=SectionTypeEnum.ESSAY,
                structure_type=StructureTypeEnum.SINGLE,
                points=2.0,
                content_latex="Giải phương trình: $x^2 + 4x + 7 = (x + 4)\\sqrt{x^2 + 7}$.",
                solution_latex="Đặt $t = \\sqrt{x^2 + 7} > 0$. Phương trình trở thành $t^2 - (x + 4)t + 4x = 0 \\iff (t - 4)(t - x) = 0$.",
                final_answer="x = 3 \\text{ hoặc } x = -3",
                main_topic=MainTopicEnum.ALGEBRA,
                sub_topics=[SubTopicEnum.ALG_IRRATIONAL_EQ],
                solution_methods=["Đặt ẩn phụ đưa về phương trình tích"],
                difficulty=DifficultyEnum.HARD,
                semantic_summary="Giải phương trình vô tỉ bậc hai bằng phương pháp đặt ẩn phụ không hoàn toàn, phân tích thành nhân tử dạng tích bậc nhất."
            )
        ]
    )
