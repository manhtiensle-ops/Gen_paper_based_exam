import os
import subprocess
import glob
from pathlib import Path

def convert_document_to_pngs(file_path: str, output_dir: str, dpi: int = 300) -> list[str]:
    """
    Converts a DOCX or PDF file into a list of 300 DPI PNG images.
    Returns sorted list of file paths to generated page images.
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file_path)[1].lower()

    pdf_path = file_path
    if ext in [".docx", ".doc", ".odt"]:
        # Convert DOCX to PDF using LibreOffice Headless
        cmd_lo = [
            "soffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", output_dir,
            file_path
        ]
        result_lo = subprocess.run(cmd_lo, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result_lo.returncode != 0:
            raise RuntimeError(f"LibreOffice conversion failed: {result_lo.stderr}")
        
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        pdf_path = os.path.join(output_dir, f"{base_name}.pdf")

    # Render PDF pages to 300 DPI PNG images using pdftoppm
    prefix = os.path.join(output_dir, "page")
    cmd_ppm = [
        "pdftoppm",
        "-png",
        "-r", str(dpi),
        pdf_path,
        prefix
    ]
    result_ppm = subprocess.run(cmd_ppm, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result_ppm.returncode != 0:
        raise RuntimeError(f"pdftoppm failed: {result_ppm.stderr}")

    # Collect and sort generated page images
    page_files = sorted(glob.glob(f"{prefix}-*.png"))
    return page_files
