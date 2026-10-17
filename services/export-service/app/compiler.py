import os
import subprocess
import tempfile
from pathlib import Path
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

def build_markdown_document(title: str, slots_state: list) -> str:
    """
    Builds structured Vietnamese Math Exam Markdown with LaTeX formulas for Pandoc OMML translation.
    """
    md = []
    # Header
    md.append(f"# {title.upper()}\n")
    md.append("**KỲ THI CHỌN HỌC SINH GIỎI TOÁN THCS**  ")
    md.append("**Thời gian làm bài: 120 phút** (Không kể thời gian phát đề)\n")
    md.append("---\n")
    md.append("Họ và tên thí sinh: ................................................................ Số báo danh: ............\n")
    md.append("---\n")
    
    # Partition slots into Section I (Short Answer) and Section II (Essay)
    part_i = [s for s in slots_state if s.get("section_type") == "SHORT_ANSWER"]
    part_ii = [s for s in slots_state if s.get("section_type") != "SHORT_ANSWER"]

    if part_i:
        md.append("## PHẦN I. CÂU HỎI ĐIỀN ĐÁP SỐ\n")
        md.append("*Thí sinh chỉ ghi kết quả, không cần trình bày lời giải chi tiết.*\n")
        for slot in part_i:
            idx = slot.get("slot_index", 1)
            pts = slot.get("points", 1.0)
            q = slot.get("question") or {}
            content = q.get("content_latex", "Đang cập nhật nội dung câu hỏi.")
            md.append(f"**Câu {idx}.** ({pts} điểm) {content}\n")

    if part_ii:
        md.append("## PHẦN II. TỰ LUẬN\n")
        md.append("*Thí sinh trình bày đầy đủ các bước giải vào tờ giấy thi.*\n")
        for slot in part_ii:
            idx = slot.get("slot_index", 1)
            pts = slot.get("points", 1.0)
            q = slot.get("question") or {}
            content = q.get("content_latex", "Đang cập nhật nội dung câu hỏi.")
            md.append(f"**Câu {idx}.** ({pts} điểm) {content}\n")
            
            # Sub-questions if any
            sub_qs = q.get("sub_questions") or []
            for sq in sub_qs:
                sq_label = sq.get("label", "a)")
                sq_pts = sq.get("points")
                pts_str = f" ({sq_pts} điểm)" if sq_pts else ""
                sq_content = sq.get("content_latex", "")
                md.append(f"  {sq_label}{pts_str} {sq_content}\n")
        
    md.append("\n---\n")
    md.append("### HƯỚNG DẪN CHẤM & ĐÁP ÁN CHI TIẾT\n")
    
    for slot in slots_state:
        idx = slot.get("slot_index", 1)
        q = slot.get("question") or {}
        sol = q.get("solution_latex")
        ans = q.get("final_answer")
        
        md.append(f"**Câu {idx}:**")
        if ans:
            md.append(f" - **Đáp số:** ${ans}$" if not ans.startswith("$") else f" - **Đáp số:** {ans}")
        if sol:
            md.append(f"\n*Lời giải chi tiết:*\n\n{sol}\n")
        else:
            md.append("\n*(Lời giải chi tiết đang được cập nhật)*\n")

    return "\n".join(md)

def compile_exam_document(exam_id: str, title: str, slots_state: list, export_type: str = "docx") -> str:
    """
    Compiles exam questions into native Word .docx (with OMML math equations) and printable PDF.
    Uploads to MinIO and returns the object key.
    """
    md_content = build_markdown_document(title, slots_state)

    with tempfile.TemporaryDirectory() as temp_dir:
        md_file = os.path.join(temp_dir, "exam.md")
        docx_file = os.path.join(temp_dir, "exam.docx")
        
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(md_content)

        # 1. Compile Markdown + LaTeX to DOCX using Pandoc with native OMML equations
        cmd_pandoc = [
            "pandoc",
            "-f", "markdown+tex_math_dollars",
            "-t", "docx",
            "-o", docx_file,
            md_file
        ]
        res_pandoc = subprocess.run(cmd_pandoc, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res_pandoc.returncode != 0:
            raise RuntimeError(f"Pandoc compilation failed: {res_pandoc.stderr}")

        minio_client = get_minio_client()
        bucket_name = os.getenv("MINIO_BUCKET_NAME", "hsg-math-assets")

        if export_type == "pdf":
            # Convert DOCX to PDF using LibreOffice Headless with Vietnamese fonts
            cmd_lo = [
                "soffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", temp_dir,
                docx_file
            ]
            res_lo = subprocess.run(cmd_lo, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res_lo.returncode != 0:
                raise RuntimeError(f"LibreOffice PDF export failed: {res_lo.stderr}")
            
            pdf_file = os.path.join(temp_dir, "exam.pdf")
            s3_key = f"exports/{exam_id}/de_thi_{exam_id}.pdf"
            minio_client.fput_object(bucket_name, s3_key, pdf_file, content_type="application/pdf")
            return s3_key
        else:
            s3_key = f"exports/{exam_id}/de_thi_{exam_id}.docx"
            minio_client.fput_object(
                bucket_name,
                s3_key,
                docx_file,
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
            return s3_key
