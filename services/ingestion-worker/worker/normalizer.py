import re
import hashlib

def normalize_math_text(text: str) -> str:
    """
    Standardizes LaTeX notations:
    - Replaces \( ... \) with $ ... $
    - Replaces \[ ... \] with $$ ... $$
    - Fixes degree notations like ^0 to ^\circ
    - Cleans up irregular whitespace
    """
    if not text:
        return ""
    text = re.sub(r"\\\((.*?)\\\)", r"$\1$", text, flags=re.DOTALL)
    text = re.sub(r"\\\[(.*?)\\\]", r"$$\1$$", text, flags=re.DOTALL)
    # Fix degrees: e.g. 75^0 -> 75^\circ
    text = re.sub(r"(\d+)\^0", r"\1^\\circ", text)
    # Fix angle: convert raw unicode or plain angle markers
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text

def compute_deduplication_hash(content_latex: str, sub_questions_latex: list[str]) -> str:
    """
    Computes a deterministic SHA-256 hash over normalized mathematical text
    to identify identical problems across different exams.
    """
    combined = content_latex + "".join(sub_questions_latex)
    # Strip all whitespace and lowercase to compare semantic core
    cleaned = re.sub(r"\s+", "", combined).lower()
    return hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

def validate_latex_integrity(text: str) -> tuple[bool, str]:
    """
    Verifies bracket and dollar sign balance in LaTeX formulas.
    """
    if not text:
        return True, "Valid"
    stripped = text.replace(r"\$", "")
    no_double = stripped.replace("$$", "")
    if no_double.count("$") % 2 != 0:
        return False, "Unbalanced inline math delimiter '$'"
    if stripped.count("{") != stripped.count("}"):
        return False, "Mismatched curly braces '{' and '}'"
    return True, "Valid"
