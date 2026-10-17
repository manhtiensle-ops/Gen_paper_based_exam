import os
import io
import tempfile
from .celery_app import celery_app
from .converter import convert_document_to_pngs
from .vision_ocr import extract_exam_from_images
from .image_cropper import crop_figure_box
from .normalizer import normalize_math_text, compute_deduplication_hash
from .embedder import generate_embedding
from .minio_helper import download_file, upload_file, upload_bytes
from .db_helper import update_exam_status, insert_extracted_question

@celery_app.task(name="worker.tasks.process_exam_document", bind=True)
def process_exam_document(self, source_exam_id: str, original_file_key: str):
    """
    Asynchronous Celery task processing an uploaded exam document (DOCX/PDF).
    """
    try:
        update_exam_status(source_exam_id, "CONVERTING_IMAGES", log_entry="Started document conversion")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            local_input = os.path.join(temp_dir, os.path.basename(original_file_key))
            download_file(original_file_key, local_input)
            
            # Step 1: Convert document to high-res 300 DPI PNG images
            render_dir = os.path.join(temp_dir, "pages")
            page_pngs = convert_document_to_pngs(local_input, render_dir, dpi=300)
            
            # Upload rendered page PNGs to MinIO
            page_image_keys = []
            for idx, page_path in enumerate(page_pngs, start=1):
                s3_key = f"exams/{source_exam_id}/pages/page_{idx}.png"
                upload_file(page_path, s3_key, content_type="image/png")
                page_image_keys.append(s3_key)
                
            update_exam_status(
                source_exam_id,
                "OCR_PROCESSING",
                page_images=page_image_keys,
                log_entry=f"Rendered {len(page_pngs)} high-resolution pages"
            )
            
            # Step 2: Multi-page Vision OCR via Gemini
            extracted = extract_exam_from_images(page_pngs)
            
            # Step 3: Process extracted questions, crop diagrams, normalize and embed
            for q in extracted.questions:
                # Normalize content LaTeX
                norm_content = normalize_math_text(q.content_latex)
                sub_q_dicts = []
                sub_q_texts = []
                
                for sq in q.sub_questions:
                    norm_sq_content = normalize_math_text(sq.content_latex)
                    sub_q_texts.append(norm_sq_content)
                    sub_q_dicts.append({
                        "part_id": sq.part_id,
                        "label": sq.label,
                        "points": sq.points,
                        "content_latex": norm_sq_content,
                        "solution_latex": normalize_math_text(sq.solution_latex or ""),
                        "final_answer": sq.final_answer,
                        "main_topic": sq.main_topic.value if hasattr(sq.main_topic, "value") else str(sq.main_topic),
                        "sub_topics": [st.value if hasattr(st, "value") else str(st) for st in sq.sub_topics],
                        "solution_methods": sq.solution_methods,
                        "difficulty": sq.difficulty.value if hasattr(sq.difficulty, "value") else str(sq.difficulty),
                        "semantic_summary": sq.semantic_summary
                    })
                    
                dedup_hash = compute_deduplication_hash(norm_content, sub_q_texts)
                
                # Crop figures if any
                figures_meta = []
                has_figure = bool(q.figures)
                for fig_idx, fig in enumerate(q.figures, start=1):
                    # page_number is 1-based
                    if 1 <= fig.page_number <= len(page_pngs):
                        target_page_png = page_pngs[fig.page_number - 1]
                        cropped_img = crop_figure_box(target_page_png, fig.box_2d)
                        img_byte_arr = io.BytesIO()
                        cropped_img.save(img_byte_arr, format='PNG')
                        fig_s3_key = f"exams/{source_exam_id}/figures/q{q.question_number}_fig{fig_idx}.png"
                        upload_bytes(img_byte_arr.getvalue(), fig_s3_key, content_type="image/png")
                        figures_meta.append({
                            "figure_key": fig_s3_key,
                            "placement_target": fig.placement_target.value if hasattr(fig.placement_target, "value") else str(fig.placement_target),
                            "position": fig.position.value if hasattr(fig.position, "value") else str(fig.position),
                            "caption": fig.caption,
                            "box_2d": fig.box_2d
                        })

                # Compute semantic vector embedding
                emb = generate_embedding(q.semantic_summary)
                
                # Insert into question bank
                insert_extracted_question(
                    source_exam_id=source_exam_id,
                    original_question_number=q.question_number,
                    section_type=q.section_type.value if hasattr(q.section_type, "value") else str(q.section_type),
                    structure_type=q.structure_type.value if hasattr(q.structure_type, "value") else str(q.structure_type),
                    default_points=q.points,
                    content_latex=norm_content,
                    normalized_hash=dedup_hash,
                    sub_questions=sub_q_dicts,
                    solution_latex=normalize_math_text(q.solution_latex or ""),
                    final_answer=q.final_answer or "",
                    has_figure=has_figure,
                    figures_meta=figures_meta,
                    grade=9,
                    main_topic=q.main_topic.value if hasattr(q.main_topic, "value") else str(q.main_topic),
                    sub_topics=[st.value if hasattr(st, "value") else str(st) for st in q.sub_topics],
                    solution_methods=q.solution_methods,
                    difficulty=q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
                    semantic_summary=q.semantic_summary,
                    embedding=emb
                )
                
            update_exam_status(
                source_exam_id,
                "REVIEW_NEEDED",
                log_entry=f"Successfully extracted {len(extracted.questions)} questions."
            )
            return {"status": "SUCCESS", "questions_count": len(extracted.questions)}

    except Exception as exc:
        update_exam_status(source_exam_id, "FAILED", log_entry=f"Error: {str(exc)}")
        raise exc
