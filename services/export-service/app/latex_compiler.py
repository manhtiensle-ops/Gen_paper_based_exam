import os
import re
import time
import subprocess
import tempfile
import unicodedata
from typing import Dict, Any, List, Optional
from minio import Minio

def get_minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio-storage:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    
    return Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=use_ssl
    )

def sanitize_latex(text: str) -> str:
    """Sanitize raw text for LaTeX, keeping valid $...$ formulas intact."""
    if not text:
        return ""
    # Ensure line breaks \\ are preserved
    # Fix common unicode quotation marks
    text = text.replace("“", "``").replace("”", "''").replace("‘", "`").replace("’", "'")
    return text

def build_latex_exam_source(exam_data: Dict[str, Any], layout_knobs: Optional[Dict[str, Any]] = None, mode: str = "EXAM") -> str:
    """
    Builds production-grade Vietnamese Math Exam LaTeX document with Times New Roman font (mathptmx)
    and full Ministry of Education and Training (Bộ GD&ĐT) standards.
    """
    knobs = layout_knobs or {}
    font_size = knobs.get("font_size_pt", 12)
    line_spread = knobs.get("line_spread", 1.15)
    margin_top = knobs.get("margin_top_cm", 1.8)
    margin_bottom = knobs.get("margin_bottom_cm", 1.8)
    margin_left = knobs.get("margin_left_cm", 2.0)
    margin_right = knobs.get("margin_right_cm", 1.8)
    item_gap = knobs.get("item_gap_pt", 8)
    math_skip = knobs.get("math_skip_pt", 6)

    header = exam_data.get("header_config") or {}
    governing_body = header.get("governing_body", "SỞ GIÁO DỤC VÀ ĐÀO TẠO")
    school_name = header.get("department_or_school", "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN")
    exam_name = header.get("exam_name", exam_data.get("title", "KỲ THI CHỌN HỌC SINH GIỎI TOÁN LỚP 9"))
    school_year = header.get("academic_year", "NĂM HỌC 2026 - 2027")
    subject_title = header.get("subject_title", "TOÁN 9")
    exam_code = header.get("exam_code", "ĐỀ CHÍNH THỨC")
    duration = header.get("duration_minutes", 150)
    show_sbd = header.get("show_sbd_box", True)

    slots = exam_data.get("slots_state") or []
    geometry_layout = knobs.get("geometry_layout", {})

    tex = []
    # 1. Preamble
    tex.append(f"\\documentclass[{font_size}pt,a4paper]{{article}}")
    tex.append("\\usepackage[utf8]{inputenc}")
    tex.append("\\usepackage[T5]{fontenc}")
    tex.append("\\usepackage{mathptmx}") # Times New Roman math font
    tex.append("\\usepackage{amsmath,amssymb,amsfonts}")
    tex.append("\\usepackage{geometry}")
    tex.append(f"\\geometry{{a4paper, top={margin_top}cm, bottom={margin_bottom}cm, left={margin_left}cm, right={margin_right}cm}}")
    tex.append(f"\\linespread{{{line_spread}}}\\selectfont")
    tex.append("\\usepackage{graphicx}")
    tex.append("\\usepackage{array,tabularx,longtable}")
    tex.append("\\usepackage{fancyhdr}")
    tex.append("\\pagestyle{fancy}")
    tex.append("\\fancyhf{}")
    tex.append(f"\\cfoot{{\\fontsize{{9pt}}{{11pt}}\\selectfont Trang \\thepage\\ / \\pageref{{LastPage}}}}")
    tex.append("\\renewcommand{\\headrulewidth}{0pt}")
    tex.append("\\setlength{\\parindent}{0pt}")
    tex.append("\\setlength{\\parskip}{2.5pt plus 1pt minus 0.5pt}")
    tex.append(f"\\AtBeginDocument{{\\setlength{{\\abovedisplayskip}}{{{math_skip}pt plus 1pt minus 1pt}}\\setlength{{\\belowdisplayskip}}{{{math_skip}pt plus 1pt minus 1pt}}}}")

    tex.append("\\begin{document}")

    # 2. Header
    tex.append("\\noindent")
    tex.append("\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}} c c @{}}")
    tex.append("  \\begin{minipage}[t]{0.44\\textwidth}")
    tex.append("    \\centering")
    tex.append(f"    \\fontsize{{10pt}}{{12pt}}\\selectfont \\MakeUppercase{{{governing_body}}}\\\\[1pt]")
    tex.append(f"    \\textbf{{\\MakeUppercase{{{school_name}}}}}\\\\[2pt]")
    tex.append("    \\rule{3.2cm}{0.5pt}\\\\[4pt]")
    tex.append(f"    \\textbf{{{exam_code}}}\\\\[1pt]")
    tex.append("    \\textit{(Đề thi gồm \\pageref{LastPage} trang)}")
    tex.append("  \\end{minipage}")
    tex.append("  &")
    tex.append("  \\begin{minipage}[t]{0.53\\textwidth}")
    tex.append("    \\centering")
    tex.append(f"    \\fontsize{{10pt}}{{12pt}}\\selectfont \\textbf{{\\MakeUppercase{{{exam_name}}}}}\\\\[1pt]")
    tex.append(f"    \\textbf{{{school_year}}}\\\\[2pt]")
    tex.append("    \\rule{3.8cm}{0.5pt}\\\\[4pt]")
    tex.append(f"    \\textbf{{Môn thi: {subject_title}}}\\\\[1pt]")
    tex.append(f"    \\textit{{Thời gian làm bài: {duration} phút (không kể thời gian phát đề)}}")
    tex.append("  \\end{minipage}")
    tex.append("\\end{tabular*}")
    tex.append("\\vspace{6pt}")

    # 3. Candidate Info Box (For Exam Mode)
    if mode == "EXAM" and show_sbd:
        tex.append("\\noindent")
        tex.append("\\begin{tabular}{|p{0.63\\textwidth}|p{0.32\\textwidth}|}")
        tex.append("  \\hline")
        tex.append("  \\fontsize{10pt}{12pt}\\selectfont Họ và tên thí sinh: \\dotfill & \\fontsize{10pt}{12pt}\\selectfont Số báo danh: \\dotfill \\\\")
        tex.append("  \\hline")
        tex.append("\\end{tabular}")
        tex.append("\\vspace{8pt}")

    tex.append("\\hrule")
    tex.append("\\vspace{8pt}")

    if mode == "EXAM":
        # Render Exam Questions
        for idx, slot in enumerate(slots):
            q_num = slot.get("slot_index", idx + 1)
            pts = slot.get("points", 1.0)
            q = slot.get("question") or {}
            content = sanitize_latex(q.get("content_latex", ""))
            sub_qs = q.get("sub_questions") or []
            figures = q.get("figures_meta") or []
            topic = q.get("main_topic", "")

            # Check if this question is plane geometry with side-by-side mode
            is_geom_side_by_side = (
                topic == "PLANE_GEOMETRY" and 
                len(figures) > 0 and 
                geometry_layout.get("mode", "two_column_fig_right") == "two_column_fig_right"
            )

            tex.append(f"\\vspace{{{item_gap}pt}}")
            tex.append(f"\\noindent\\textbf{{Câu {q_num}.}} \\textit{{({pts} điểm)}} ")

            if is_geom_side_by_side:
                fig_key = figures[0].get("figure_key", "figure.png")
                # Minipage side by side
                tex.append("\\par\\noindent")
                tex.append("\\begin{minipage}[t]{0.67\\textwidth}")
                tex.append("  \\vspace{0pt}")
                tex.append(f"  {content}")
                if sub_qs:
                    for sq in sub_qs:
                        sq_lbl = sq.get("label", "a)")
                        sq_pts = sq.get("points")
                        pts_str = f" \\textit{{({sq_pts} điểm)}}" if sq_pts else ""
                        sq_content = sanitize_latex(sq.get("content_latex", ""))
                        tex.append(f"\\par\\textbf{{{sq_lbl}}}{pts_str} {sq_content}")
                tex.append("\\end{minipage}\\hfill")
                tex.append("\\begin{minipage}[t]{0.30\\textwidth}")
                tex.append("  \\vspace{0pt}\\centering")
                tex.append(f"  \\includegraphics[width=0.98\\textwidth]{{{fig_key}}}")
                tex.append("\\end{minipage}\\par")
            else:
                tex.append(f"{content}")
                if figures:
                    for fig in figures:
                        fig_key = fig.get("figure_key", "figure.png")
                        tex.append(f"\\par\\begin{{center}}\\includegraphics[max width=0.45\\textwidth, height=4.5cm, keepaspectratio]{{{fig_key}}}\\end{{center}}")
                if sub_qs:
                    for sq in sub_qs:
                        sq_lbl = sq.get("label", "a)")
                        sq_pts = sq.get("points")
                        pts_str = f" \\textit{{({sq_pts} điểm)}}" if sq_pts else ""
                        sq_content = sanitize_latex(sq.get("content_latex", ""))
                        tex.append(f"\\par\\textbf{{{sq_lbl}}}{pts_str} {sq_content}")

        tex.append("\\vspace{12pt}")
        tex.append("\\centerline{--- HẾT ---}")
        tex.append("\\centerline{\\textit{Cán bộ coi thi không giải thích gì thêm.}}")

    else:
        # MODE == "RUBRIC": Hướng Dẫn Chấm & Biểu Điểm 2 Cột
        tex.append("\\begin{center}")
        tex.append("  \\textbf{\\fontsize{12pt}{14pt}\\selectfont HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM CHI TIẾT}\\\\")
        tex.append("  \\textit{\\fontsize{10pt}{12pt}\\selectfont (Thang điểm 20.0 - Chuẩn Sở Giáo dục và Đào tạo)}")
        tex.append("\\end{center}")
        tex.append("\\vspace{4pt}")
        tex.append("\\noindent\\textit{Lưu ý: Thí sinh giải theo cách khác nếu đúng vẫn cho điểm tối đa tương ứng từng phần.}")
        tex.append("\\vspace{6pt}")

        # 2-column tabular
        tex.append("\\noindent")
        tex.append("\\begin{longtable}{|p{0.14\\textwidth}|p{0.70\\textwidth}|p{0.08\\textwidth}|}")
        tex.append("  \\hline")
        tex.append("  \\textbf{Câu / Ý} & \\centering\\textbf{Nội dung lập luận & Các bước giải chi tiết} & \\centering\\textbf{Điểm} \\\\")
        tex.append("  \\hline")
        tex.append("  \\endhead")

        for idx, slot in enumerate(slots):
            q_num = slot.get("slot_index", idx + 1)
            pts = slot.get("points", 1.0)
            q = slot.get("question") or {}
            rubric = slot.get("rubric_data") or {}
            steps = rubric.get("steps") or []
            sol = sanitize_latex(q.get("solution_latex", ""))

            if steps:
                first_st = steps[0]
                tag = first_st.get("milestone_tag", "")
                st_txt = sanitize_latex(first_st.get("latex_content", ""))
                st_pts = first_st.get("points", 0.25)

                tex.append(f"  \\textbf{{Câu {q_num}}} ({pts}đ) & \\textbf{{{tag}:}} {st_txt} & \\centering\\textbf{{{st_pts}}} \\\\")
                tex.append("  \\cline{2-3}")
                for st in steps[1:]:
                    s_tag = st.get("milestone_tag", "")
                    s_txt = sanitize_latex(st.get("latex_content", ""))
                    s_pts = st.get("points", 0.25)
                    tex.append(f"  & \\textbf{{{s_tag}:}} {s_txt} & \\centering {s_pts} \\\\")
                    tex.append("  \\cline{2-3}")
                tex.append("  \\hline")
            else:
                tex.append(f"  \\textbf{{Câu {q_num}}} ({pts}đ) & {sol or '*(Chưa có lời giải chi tiết)*'} & \\centering\\textbf{{{pts}}} \\\\")
                tex.append("  \\hline")

        tex.append("\\end{longtable}")

    tex.append("\\label{LastPage}")
    tex.append("\\end{document}")
    return "\n".join(tex)


def compile_exam_latex(exam_data: Dict[str, Any], layout_knobs: Optional[Dict[str, Any]] = None, mode: str = "EXAM") -> Dict[str, Any]:
    """
    Compiles LaTeX to PDF and generates 150 DPI page preview images via pdftoppm.
    Uploads results to MinIO and returns public asset keys.
    """
    exam_id = str(exam_data.get("id", "preview_exam"))
    latex_source = build_latex_exam_source(exam_data, layout_knobs, mode)
    minio_client = get_minio_client()
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")

    start_time = time.time()

    with tempfile.TemporaryDirectory() as td:
        tex_path = os.path.join(td, "exam.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(latex_source)

        # Download figures from MinIO if any
        slots = exam_data.get("slots_state") or []
        for slot in slots:
            q = slot.get("question") or {}
            figures = q.get("figures_meta") or []
            for fig in figures:
                fig_key = fig.get("figure_key")
                if fig_key:
                    local_fig = os.path.join(td, os.path.basename(fig_key))
                    try:
                        minio_client.fget_object(bucket_name, fig_key, local_fig)
                    except Exception as e:
                        print(f"[Warning] Failed to fetch figure {fig_key}: {e}")

        # Run pdflatex 2 passes to resolve \pageref{LastPage}
        cmd = ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "exam.tex"]
        res1 = subprocess.run(cmd, cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res1.returncode != 0:
            print("[LaTeX Error]:", res1.stdout[-600:])
            # Fallback compile without halt-on-error
            res1 = subprocess.run(["pdflatex", "-interaction=nonstopmode", "exam.tex"], cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Pass 2 for references
        subprocess.run(cmd, cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        pdf_path = os.path.join(td, "exam.pdf")
        if not os.path.exists(pdf_path):
            raise RuntimeError(f"LaTeX compilation failed to produce PDF: {res1.stdout[-800:]}")

        # Render Page Images with pdftoppm
        cmd_ppm = ["pdftoppm", "-png", "-r", "150", "exam.pdf", "page"]
        subprocess.run(cmd_ppm, cwd=td, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Upload PDF to MinIO
        pdf_s3_key = f"exports/{exam_id}/latex_{mode}.pdf"
        minio_client.fput_object(bucket_name, pdf_s3_key, pdf_path, content_type="application/pdf")

        # Upload Page Images to MinIO
        img_files = sorted([f for f in os.listdir(td) if f.startswith("page-") and f.endswith(".png")])
        page_image_keys = []
        for idx, img_name in enumerate(img_files):
            img_path = os.path.join(td, img_name)
            img_s3_key = f"exports/{exam_id}/previews/{mode}_page_{idx + 1}.png"
            minio_client.fput_object(bucket_name, img_s3_key, img_path, content_type="image/png")
            page_image_keys.append(img_s3_key)

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "SUCCESS",
            "pdf_key": pdf_s3_key,
            "page_count": len(page_image_keys),
            "page_image_keys": page_image_keys,
            "latex_source": latex_source,
            "compile_time_ms": elapsed_ms
        }
