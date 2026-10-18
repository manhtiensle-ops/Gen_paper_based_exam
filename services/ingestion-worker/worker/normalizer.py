import re
import hashlib

def normalize_math_text(text: str) -> str:
    """
    Python-first LaTeX normalizer:
    - Standardizes inline/display math delimiters
    - Fixes degree notations (75^0 -> 75^\circ)
    - Fixes broken box characters from Word OCR (e.g., n \in [] -> n \in \mathbb{N})
    - Fixes angle notations (angle ABC -> \widehat{ABC})
    - Cleans irregular whitespace
    """
    if not text:
        return ""
    # Convert \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
    text = re.sub(r"\\\((.*?)\\\)", r"$\1$", text, flags=re.DOTALL)
    text = re.sub(r"\\\[(.*?)\\\]", r"$$\1$$", text, flags=re.DOTALL)
    
    # Fix degree notation: 60^0 or 60° -> 60^\circ
    text = re.sub(r"(\d+)\s*\^0", r"\1^\\circ", text)
    text = re.sub(r"(\d+)\s*°", r"\1^\\circ", text)
    
    # Fix broken OCR set characters
    text = re.sub(r"\\in\s*\[\s*\]", r"\\in \\mathbb{N}", text)
    text = re.sub(r"\\in\s*□", r"\\in \\mathbb{N}", text)

    # Ensure angle notation: \angle ABC -> \widehat{ABC}
    text = re.sub(r"\\angle\s+([A-Z]{3})", r"\\widehat{\1}", text)

    # Clean redundant whitespace
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text

def infer_topic_and_subtopics(content: str, current_main_topic: str, current_sub_topics: list) -> tuple[str, list]:
    """
    Infers or corrects topic classification if Flash produced generic or empty tags.
    """
    c_lower = content.lower()
    sub_topics = list(current_sub_topics) if current_sub_topics else []
    main_topic = current_main_topic

    if "\\sqrt" in content or "căn thức" in c_lower or "rút gọn" in c_lower:
        if not sub_topics:
            sub_topics.append("ALG_RADICAL_SIMPLIFY")
        if not main_topic:
            main_topic = "ALGEBRA"
    elif "\\begin{cases}" in content or "hệ phương trình" in c_lower:
        if not sub_topics:
            sub_topics.append("ALG_SYSTEM_OF_EQ")
        if not main_topic:
            main_topic = "ALGEBRA"
    elif "nghiệm nguyên" in c_lower or "số nguyên tố" in c_lower or "chia hết" in c_lower:
        if not main_topic:
            main_topic = "NUMBER_THEORY"
        if "nghiệm nguyên" in c_lower and not sub_topics:
            sub_topics.append("NUM_DIOPHANTINE_EQ")
        elif not sub_topics:
            sub_topics.append("NUM_PRIME_DIVISIBILITY")
    elif "đường tròn" in c_lower or "tam giác" in c_lower or "\\triangle" in content or "\\widehat" in content:
        if not main_topic:
            main_topic = "PLANE_GEOMETRY"
        if "đường tròn" in c_lower and not sub_topics:
            sub_topics.append("GEO_CIRCLE_INSCRIBED")
        elif not sub_topics:
            sub_topics.append("GEO_TRIANGLE_METRIC")
    elif "bất đẳng thức" in c_lower or "giá trị lớn nhất" in c_lower or "giá trị nhỏ nhất" in c_lower or "gtnn" in c_lower or "gtln" in c_lower:
        if not main_topic:
            main_topic = "INEQUALITY_EXTREMA"
        if not sub_topics:
            sub_topics.append("INEQ_ALGEBRAIC")

    if not main_topic:
        main_topic = "ALGEBRA"
    if not sub_topics:
        sub_topics = ["ALG_RADICAL_SIMPLIFY"]

    return main_topic, sub_topics

def compute_deduplication_hash(content_latex: str, sub_questions_latex: list[str]) -> str:
    combined = content_latex + "".join(sub_questions_latex)
    cleaned = re.sub(r"\s+", "", combined).lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def validate_latex_integrity(text: str) -> tuple[bool, str]:
    if not text:
        return True, "Valid"
    stripped = text.replace(r"\$", "")
    no_double = stripped.replace("$$", "")
    if no_double.count("$") % 2 != 0:
        return False, "Unbalanced inline math delimiter '$'"
    if stripped.count("{") != stripped.count("}"):
        return False, "Mismatched curly braces '{' and '}'"
    return True, "Valid"
