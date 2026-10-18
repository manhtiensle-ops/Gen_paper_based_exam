import os
import re
import shutil
import subprocess
import tempfile
from typing import Dict, Any, List
from minio import Minio

def get_minio_client() -> Minio:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio-storage:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    client = Minio(
        endpoint=endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=use_ssl
    )
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
    return client


def generate_latex_source(
    exam_id: str,
    title: str,
    header_config: Dict[str, Any],
    layout_knobs: Dict[str, Any],
    items: List[Dict[str, Any]],
    mode: str = "EXAM",
    temp_dir: str = ""
) -> str:
    """Sinh mã LaTeX hoàn chỉnh cho đề thi hoặc bảng hướng dẫn chấm"""
    font_size = layout_knobs.get("font_size_pt", 12)
    m_top = layout_knobs.get("margin_top_cm", 1.8)
    m_bottom = layout_knobs.get("margin_bottom_cm", 1.8)
    m_left = layout_knobs.get("margin_left_cm", 2.0)
    m_right = layout_knobs.get("margin_right_cm", 1.8)
    line_spread = layout_knobs.get("line_spread", 1.15)
    item_gap = layout_knobs.get("item_gap_pt", 10)
    math_skip = layout_knobs.get("math_skip_pt", 6)

    # Header vars
    gov_body = header_config.get("governing_body", "SỞ GIÁO DỤC VÀ ĐÀO TẠO")
    school = header_config.get("department_or_school", "TRƯỜNG THCS CHUYÊN LÊ QUÝ ĐÔN")
    exam_name = header_config.get("exam_name", title or "KỲ THI CHỌN HỌC SINH GIỎI LỚP 9")
    acad_year = header_config.get("academic_year", "Năm học: 2026 - 2027")
    subj = header_config.get("subject_title", "Môn thi: TOÁN 9")
    code = header_config.get("exam_code", "ĐỀ CHÍNH THỨC")
    duration = header_config.get("duration_minutes", 150)
    show_sbd = header_config.get("show_sbd_box", True)

    minio_client = get_minio_client()
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")

    tex = []
    tex.append(f"\\documentclass[{font_size}pt,a4paper]{{article}}")
    tex.append("\\usepackage[utf8]{inputenc}")
    tex.append("\\usepackage[T5]{fontenc}")
    tex.append("\\usepackage[vietnamese]{babel}")
    tex.append("\\usepackage{amsmath,amssymb,amsfonts}")
    tex.append("\\usepackage{geometry}")
    tex.append("\\usepackage{graphicx}")
    tex.append("\\usepackage{array,longtable,tabularx}")
    tex.append("\\usepackage{fancyhdr}")
    tex.append("\\usepackage{calc}")

    # Geometry & Layout knobs
    tex.append(f"\\geometry{{a4paper, top={m_top}cm, bottom={m_bottom}cm, left={m_left}cm, right={m_right}cm}}")
    tex.append(f"\\linespread{{{line_spread}}}\\selectfont")
    tex.append("\\setlength{\\parindent}{0pt}")
    tex.append("\\setlength{\\parskip}{3pt plus 1pt minus 1pt}")
    tex.append(f"\\setlength{{\\abovedisplayskip}}{{{math_skip}pt plus 2pt minus 2pt}}")
    tex.append(f"\\setlength{{\\belowdisplayskip}}{{{math_skip}pt plus 2pt minus 2pt}}")

    # Macro Telemetry
    tex.append("\\newcommand{\\LogLayoutTelemetry}[2]{%")
    tex.append("  \\par\\write-1{[TELEMETRY] event=#1 id=#2 page=\\thepage\\space used_pt=\\the\\pagetotal\\space max_pt=\\the\\pagegoal}%")
    tex.append("}")

    # Common Vietnamese Math Macros
    tex.append("\\newcommand{\\heva}[1]{\\left\\{\\begin{aligned}#1\\end{aligned}\\right.}")
    tex.append("\\newcommand{\\hoac}[1]{\\left[\\begin{aligned}#1\\end{aligned}\\right.}")

    tex.append("\\begin{document}")

    # HEADER BLOCK (CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO VIỆT NAM)
    tex.append("\\noindent")
    tex.append("\\begin{tabular*}{\\textwidth}{@{\\extracolsep{\\fill}} c c @{}}")
    tex.append("  \\begin{minipage}[t]{0.45\\textwidth}")
    tex.append("    \\centering\\fontsize{10pt}{12pt}\\selectfont")
    tex.append(f"    \\MakeUppercase{{{gov_body}}}\\\\")
    tex.append(f"    \\textbf{{\\MakeUppercase{{{school}}}}}\\\\[2pt]")
    tex.append("    \\rule{3.2cm}{0.5pt}\\\\[4pt]")
    tex.append(f"    \\textbf{{{code}}}")
    tex.append("  \\end{minipage}")
    tex.append("  &")
    tex.append("  \\begin{minipage}[t]{0.52\\textwidth}")
    tex.append("    \\centering\\fontsize{10pt}{12pt}\\selectfont")
    tex.append(f"    \\textbf{{\\MakeUppercase{{{exam_name}}}}}\\\\[2pt]")
    tex.append(f"    \\textbf{{{acad_year}}}\\\\[2pt]")
    tex.append("    \\rule{4cm}{0.5pt}\\\\[4pt]")
    tex.append(f"    \\textbf{{{subj}}}\\\\")
    tex.append(f"    \\textit{{Thời gian làm bài: {duration} phút (không kể phát đề)}}")
    tex.append("  \\end{minipage}")
    tex.append("\\end{tabular*}")
    tex.append("\\vspace{6pt}")

    if mode == "EXAM" and show_sbd:
        tex.append("\\noindent")
        tex.append("\\begin{tabular}{|p{\\textwidth-2\\tabcolsep-2\\arrayrulewidth}|}")
        tex.append("  \\hline")
        tex.append("  \\rule{0pt}{13pt}\\fontsize{10pt}{12pt}\\selectfont Họ và tên thí sinh: \\dotfill \\hspace{0.4cm} Số báo danh: \\dotfill \\\\[3pt]")
        tex.append("  \\hline")
        tex.append("\\end{tabular}")
        tex.append("\\vspace{8pt}")

    tex.append("\\hrule\\vspace{8pt}")

    if mode == "EXAM":
        # 1. RENDER QUESTIONS
        for it in items:
            item_id = str(it.get("id", ""))
            label = it.get("display_label", "Câu")
            pts = it.get("max_points", 1.0)
            snap = it.get("problem_snapshot", {}) or {}
            content = snap.get("content_latex", "")
            sub_qs = snap.get("sub_questions", []) or []
            figures = snap.get("figures_meta", []) or []

            tex.append(f"\\LogLayoutTelemetry{{START}}{{{item_id}}}")
            tex.append(f"\\vspace{{{item_gap}pt plus 2pt minus 2pt}}")

            # Check if geometric side-by-side figure layout
            fig_local_path = None
            if figures and len(figures) > 0 and temp_dir:
                first_fig = figures[0]
                fig_key = first_fig.get("figure_key")
                if fig_key:
                    try:
                        ext = os.path.splitext(fig_key)[1] or ".png"
                        fig_local_path = os.path.join(temp_dir, f"fig_{item_id}{ext}")
                        minio_client.fget_object(bucket_name, fig_key, fig_local_path)
                    except Exception as e:
                        print(f"Error fetching figure from MinIO: {e}")
                        fig_local_path = None

            if fig_local_path and os.path.exists(fig_local_path):
                # 2-column Minipage: Left text (67%), Right figure (30%)
                tex.append("\\noindent")
                tex.append("\\begin{minipage}[t]{0.67\\textwidth}")
                tex.append(f"\\textbf{{{label}}} ({pts} điểm).\\ {content}")
                if sub_qs:
                    for s in sub_qs:
                        s_label = s.get("label", "a)")
                        s_pts = s.get("points")
                        pts_str = f" ({s_pts} điểm)" if s_pts else ""
                        s_content = s.get("content_latex", "")
                        tex.append(f"\\\\\\textbf{{{s_label}}}{pts_str}\\ {s_content}")
                tex.append("\\end{minipage}\\hfill")
                tex.append("\\begin{minipage}[t]{0.30\\textwidth}")
                tex.append("\\centering")
                clean_fig_filename = os.path.basename(fig_local_path)
                tex.append(f"\\includegraphics[width=0.98\\textwidth]{{{clean_fig_filename}}}")
                tex.append("\\end{minipage}\\par")
            else:
                tex.append(f"\\textbf{{{label}}} ({pts} điểm).\\ {content}")
                if sub_qs:
                    for s in sub_qs:
                        s_label = s.get("label", "a)")
                        s_pts = s.get("points")
                        pts_str = f" ({s_pts} điểm)" if s_pts else ""
                        s_content = s.get("content_latex", "")
                        tex.append(f"\\\\\\textbf{{{s_label}}}{pts_str}\\ {s_content}")

            tex.append(f"\\LogLayoutTelemetry{{END}}{{{item_id}}}")
            tex.append("\\par")

        tex.append("\\vspace{14pt}")
        tex.append("\\begin{center}\\textit{--- HẾT ---\\\\Cán bộ coi thi không giải thích gì thêm.}\\end{center}")

    else:
        # 2. RENDER RUBRIC (BẢNG HƯỚNG DẪN CHẤM 2 CỘT CHUẨN SỞ)
        tex.append("\\begin{center}")
        tex.append("{\\large\\bfseries HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM CHI TIẾT}\\\\")
        tex.append("\\textit{(Thang điểm 0,25đ chuẩn - Học sinh làm theo cách khác nếu đúng vẫn cho điểm tối đa)}")
        tex.append("\\end{center}\\vspace{6pt}")

        tex.append("\\noindent")
        tex.append("\\begin{longtable}{|p{0.14\\textwidth}|p{0.70\\textwidth}|p{0.10\\textwidth}|}")
        tex.append("\\hline")
        tex.append("\\textbf{Câu / Ý} & \\centering\\textbf{Nội dung các bước giải và lập luận} & \\centering\\textbf{Điểm} \\\\")
        tex.append("\\hline\\endhead")

        for it in items:
            label = it.get("display_label", "Câu")
            pts = it.get("max_points", 1.0)
            rubric = it.get("rubric_data", {}) or {}
            steps = rubric.get("steps", []) or []

            if steps:
                first_st = steps[0]
                first_tag = first_st.get("milestone_tag", "")
                first_txt = first_st.get("latex_content", "")
                first_pts = first_st.get("points", 0.25)
                tex.append(f"\\textbf{{{label}}} ({pts}đ) & \\textbf{{{first_tag}:}} {first_txt} & \\centering\\textbf{{{first_pts}}} \\\\ \\cline{{2-3}}")

                for st in steps[1:]:
                    s_tag = st.get("milestone_tag", "")
                    s_txt = st.get("latex_content", "")
                    s_pts = st.get("points", 0.25)
                    tex.append(f" & \\textbf{{{s_tag}:}} {s_txt} & \\centering {s_pts} \\\\ \\cline{{2-3}}")
                tex.append("\\hline")
            else:
                snap = it.get("problem_snapshot", {}) or {}
                sol = snap.get("solution_latex", "") or "*(Đang cập nhật lời giải)*"
                tex.append(f"\\textbf{{{label}}} ({pts}đ) & {sol} & \\centering {pts} \\\\")
                tex.append("\\hline")

        tex.append("\\end{longtable}")

    tex.append("\\end{document}")
    return "\n".join(tex)


def compile_latex_to_preview(
    exam_id: str,
    title: str,
    header_config: Dict[str, Any],
    layout_knobs: Dict[str, Any],
    items: List[Dict[str, Any]],
    mode: str = "EXAM"
) -> Dict[str, Any]:
    """Biên dịch mã LaTeX trên RAM Disk và trả về URL ảnh trang A4 cùng telemetry"""
    minio_client = get_minio_client()
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")

    # Dùng /dev/shm nếu có để tăng tốc compile, fallback về tempfile thông thường
    shm_base = "/dev/shm" if os.path.exists("/dev/shm") and os.access("/dev/shm", os.W_OK) else None
    temp_dir = tempfile.mkdtemp(prefix="latex_studio_", dir=shm_base)

    try:
        tex_source = generate_latex_source(
            exam_id=exam_id,
            title=title,
            header_config=header_config,
            layout_knobs=layout_knobs,
            items=items,
            mode=mode,
            temp_dir=temp_dir
        )

        tex_file = os.path.join(temp_dir, "document.tex")
        with open(tex_file, "w", encoding="utf-8") as f:
            f.write(tex_source)

        # Chạy pdflatex (non-stop)
        cmd = ["pdflatex", "-interaction=nonstopmode", "document.tex"]
        run_res = subprocess.run(cmd, cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)

        pdf_file = os.path.join(temp_dir, "document.pdf")
        if not os.path.exists(pdf_file):
            error_log = run_res.stdout[-1000:] if run_res.stdout else run_res.stderr
            raise RuntimeError(f"Lỗi biên dịch LaTeX: {error_log}")

        # Trích xuất telemetry từ stdout
        telemetry = []
        for line in run_res.stdout.splitlines():
            if "[TELEMETRY]" in line:
                telemetry.append(line.strip())

        # Sinh ảnh PNG từng trang A4 (150 DPI) bằng pdftoppm
        cmd_ppm = ["pdftoppm", "-png", "-r", "150", "document.pdf", "page"]
        subprocess.run(cmd_ppm, cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        png_files = sorted([f for f in os.listdir(temp_dir) if f.startswith("page-") and f.endswith(".png")])

        # Upload PDF và PNGs lên MinIO
        prefix = f"studio/{exam_id}/{mode.lower()}"
        pdf_key = f"{prefix}/document.pdf"
        minio_client.fput_object(bucket_name, pdf_key, pdf_file, content_type="application/pdf")

        page_keys = []
        for png in png_files:
            p_path = os.path.join(temp_dir, png)
            p_key = f"{prefix}/{png}"
            minio_client.fput_object(bucket_name, p_key, p_path, content_type="image/png")
            page_keys.append(p_key)

        return {
            "status": "SUCCESS",
            "mode": mode,
            "pdf_key": pdf_key,
            "page_keys": page_keys,
            "total_pages": len(page_keys),
            "telemetry": telemetry,
            "latex_source": tex_source
        }
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
