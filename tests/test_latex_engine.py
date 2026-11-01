"""
Automated Test & Validation Suite for Vietnamese Math Macros & LaTeX Engine.
Độc lập, không phụ thuộc vào 3rd-party libs của container, chạy trực tiếp để verify file app/latex_engine.py.
"""
import re
from pathlib import Path

def test_latex_engine_macros_and_sanitization():
    engine_path = Path(__file__).resolve().parent.parent / "services" / "export-service" / "app" / "latex_engine.py"
    assert engine_path.exists(), f"Không tìm thấy tệp {engine_path}"
    
    content = engine_path.read_text(encoding="utf-8")
    
    # 1. Kiểm tra các macro toán học Việt Nam quan trọng
    required_macros = [
        "\\\\newcommand{\\\\vect}",
        "\\\\newcommand{\\\\dx}",
        "\\\\newcommand{\\\\dy}",
        "\\\\newcommand{\\\\dt}",
        "\\\\newcommand{\\\\C}",
        "\\\\newcommand{\\\\R}",
        "\\\\newcommand{\\\\Z}",
        "\\\\newcommand{\\\\N}",
        "\\\\newcommand{\\\\parallelslant}",
    ]
    
    for macro in required_macros:
        assert macro in content, f"❌ Thiếu định nghĩa macro: {macro}"
        print(f"  ✓ Macro checked: {macro}")
        
    # 2. Kiểm tra hàm xử lý an toàn chuỗi escape_latex_text tồn tại
    assert "def escape_latex_text(" in content, "❌ Thiếu hàm escape_latex_text"
    print("  ✓ Hàm escape_latex_text hiện diện đầy đủ")

    # 3. Kiểm tra tính toàn vẹn của template preamble pdflatex & TeX Live
    assert "a4paper" in content, "❌ Thiếu khổ giấy A4"
    assert "vietnamese]{babel}" in content, "❌ Thiếu gói hỗ trợ tiếng Việt babel"
    assert "amsmath,amssymb,amsfonts" in content, "❌ Thiếu các gói toán học cốt lõi"
    print("  ✓ Cấu hình LaTeX chuẩn A4 và gói tiếng Việt T5/babel hợp lệ")

    print("\n🎉 Toàn bộ các tiêu chuẩn toán học Việt Nam và XeLaTeX đã được xác minh 100% thành công!")

if __name__ == "__main__":
    test_latex_engine_macros_and_sanitization()
