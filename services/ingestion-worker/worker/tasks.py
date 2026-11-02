import os
import io
import tempfile
from .celery_app import celery_app
from .converter import convert_document_to_pngs
from .vision_ocr import extract_exam_from_images
from .image_cropper import crop_figure_box
from .normalizer import normalize_math_text, compute_deduplication_hash, infer_topic_and_subtopics
from .embedder import generate_embedding
from .minio_helper import download_file, upload_file, upload_bytes
from .db_helper import update_exam_status, insert_extracted_question

def get_sq_attr(sq, attr, default=None):
    if hasattr(sq, attr):
        val = getattr(sq, attr)
        return val if val is not None else default
    elif isinstance(sq, dict):
        return sq.get(attr, default)
    return default

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
            
            # Step 2: Multi-page Vision OCR (Two-pass with Page-by-page Flash)
            extracted = extract_exam_from_images(page_pngs)
            
            # Step 3: Process questions with Deduplication & Atomic Bundling
            seen_hashes = set()
            saved_count = 0
            
            for q in extracted.questions:
                norm_content = normalize_math_text(q.content_latex or "")
                structure_type_val = q.structure_type.value if hasattr(q.structure_type, "value") else str(q.structure_type)
                
                # --- YÊU CẦU 1A: CÂU HỎI INDEPENDENT_PARTS (như Bài 1, Bài 2) ---
                # Khi tách từng ý trong sub_questions thành câu hỏi độc lập,
                # phải lấy sq.content_latex gán vào content_latex (tuyệt đối không để rỗng).
                if structure_type_val == "INDEPENDENT_PARTS" and q.sub_questions:
                    for sq_idx, sq in enumerate(q.sub_questions, start=1):
                        raw_sq_content = get_sq_attr(sq, "content_latex", "")
                        sq_content = normalize_math_text(raw_sq_content)
                        if not sq_content:
                            continue
                            
                        sq_label = get_sq_attr(sq, "label", f"{sq_idx})")
                        # If a shared instruction/premise exists, prefix it cleanly
                        if norm_content and norm_content.strip():
                            final_q_content = f"{norm_content}\n\n{sq_label} {sq_content}"
                        else:
                            final_q_content = sq_content
                            
                        dedup_hash = compute_deduplication_hash(final_q_content, [])
                        if dedup_hash in seen_hashes:
                            continue
                        seen_hashes.add(dedup_hash)
                        
                        raw_sq_sol = get_sq_attr(sq, "solution_latex", "")
                        sq_solution = normalize_math_text(raw_sq_sol or "")
                        sq_answer = get_sq_attr(sq, "final_answer", "")
                        sq_points = get_sq_attr(sq, "points")
                        sq_pts = sq_points if sq_points is not None else round(q.points / len(q.sub_questions), 2)
                        
                        raw_main = get_sq_attr(sq, "main_topic") or q.main_topic
                        sq_main = raw_main.value if hasattr(raw_main, "value") else str(raw_main)
                        
                        raw_subs = get_sq_attr(sq, "sub_topics") or q.sub_topics
                        sq_subs = [st.value if hasattr(st, "value") else str(st) for st in raw_subs]
                        
                        raw_diff = get_sq_attr(sq, "difficulty") or q.difficulty
                        sq_diff = raw_diff.value if hasattr(raw_diff, "value") else str(raw_diff)
                        
                        # Infer/refine topics
                        sq_main, sq_subs = infer_topic_and_subtopics(final_q_content, sq_main, sq_subs)
                        sq_summary = get_sq_attr(sq, "semantic_summary") or final_q_content[:200]
                        emb = generate_embedding(sq_summary)
                        
                        insert_extracted_question(
                            source_exam_id=source_exam_id,
                            original_question_number=q.question_number,
                            section_type=q.section_type.value if hasattr(q.section_type, "value") else str(q.section_type),
                            structure_type="SINGLE",
                            default_points=sq_pts,
                            content_latex=final_q_content,
                            normalized_hash=dedup_hash,
                            sub_questions=[],
                            solution_latex=sq_solution,
                            final_answer=sq_answer,
                            has_figure=False,
                            figures_meta=[],
                            grade=9,
                            main_topic=sq_main,
                            sub_topics=sq_subs,
                            solution_methods=get_sq_attr(sq, "solution_methods") or q.solution_methods,
                            difficulty=sq_diff,
                            semantic_summary=sq_summary,
                            embedding=emb
                        )
                        saved_count += 1
                        
                # --- YÊU CẦU 1B: CÂU HỎI SHARED_STEM (như Bài 5 Hình học) ---
                # Giữ nguyên thành 1 câu hỏi hoàn chỉnh nguyên khối, không tách rời làm mất ngữ cảnh.
                else:
                    sub_q_dicts = []
                    sub_q_texts = []
                    for sq in q.sub_questions:
                        raw_sq_content = get_sq_attr(sq, "content_latex", "")
                        norm_sq_content = normalize_math_text(raw_sq_content)
                        sub_q_texts.append(norm_sq_content)
                        
                        raw_sq_sol = get_sq_attr(sq, "solution_latex", "")
                        raw_main = get_sq_attr(sq, "main_topic") or q.main_topic
                        sq_main = raw_main.value if hasattr(raw_main, "value") else str(raw_main)
                        raw_subs = get_sq_attr(sq, "sub_topics") or q.sub_topics
                        sq_subs = [st.value if hasattr(st, "value") else str(st) for st in raw_subs]
                        raw_diff = get_sq_attr(sq, "difficulty") or q.difficulty
                        sq_diff = raw_diff.value if hasattr(raw_diff, "value") else str(raw_diff)

                        sub_q_dicts.append({
                            "part_id": get_sq_attr(sq, "part_id", "a"),
                            "label": get_sq_attr(sq, "label", "a)"),
                            "points": get_sq_attr(sq, "points"),
                            "content_latex": norm_sq_content,
                            "solution_latex": normalize_math_text(raw_sq_sol or ""),
                            "final_answer": get_sq_attr(sq, "final_answer", ""),
                            "main_topic": sq_main,
                            "sub_topics": sq_subs,
                            "solution_methods": get_sq_attr(sq, "solution_methods") or [],
                            "difficulty": sq_diff,
                            "semantic_summary": get_sq_attr(sq, "semantic_summary", "")
                        })
                        
                    # If content_latex was empty but sub-questions exist, fallback to premise or first sub-question
                    if not norm_content:
                        if sub_q_texts:
                            norm_content = sub_q_texts[0]
                        else:
                            norm_content = "Nội dung câu hỏi đang được cập nhật."
                            
                    dedup_hash = compute_deduplication_hash(norm_content, sub_q_texts)
                    if dedup_hash in seen_hashes:
                        continue
                    seen_hashes.add(dedup_hash)
                    
                    # --- YÊU CẦU 3: Crop hình học với padding_px = 5 khử méo ---
                    figures_meta = []
                    has_figure = bool(q.figures)
                    for fig_idx, fig in enumerate(q.figures, start=1):
                        if 1 <= fig.page_number <= len(page_pngs):
                            target_page_png = page_pngs[fig.page_number - 1]
                            cropped_img = crop_figure_box(target_page_png, fig.box_2d, padding_px=5)
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

                    main_topic_val = q.main_topic.value if hasattr(q.main_topic, "value") else str(q.main_topic)
                    sub_topics_val = [st.value if hasattr(st, "value") else str(st) for st in q.sub_topics]
                    main_topic_val, sub_topics_val = infer_topic_and_subtopics(norm_content, main_topic_val, sub_topics_val)
                    
                    emb = generate_embedding(q.semantic_summary or norm_content[:200])
                    
                    insert_extracted_question(
                        source_exam_id=source_exam_id,
                        original_question_number=q.question_number,
                        section_type=q.section_type.value if hasattr(q.section_type, "value") else str(q.section_type),
                        structure_type=structure_type_val,
                        default_points=q.points,
                        content_latex=norm_content,
                        normalized_hash=dedup_hash,
                        sub_questions=sub_q_dicts,
                        solution_latex=normalize_math_text(q.solution_latex or ""),
                        final_answer=q.final_answer or "",
                        has_figure=has_figure,
                        figures_meta=figures_meta,
                        grade=9,
                        main_topic=main_topic_val,
                        sub_topics=sub_topics_val,
                        solution_methods=q.solution_methods,
                        difficulty=q.difficulty.value if hasattr(q.difficulty, "value") else str(q.difficulty),
                        semantic_summary=q.semantic_summary or norm_content[:200],
                        embedding=emb
                    )
                    saved_count += 1
                
            update_exam_status(
                source_exam_id,
                "REVIEW_NEEDED",
                log_entry=f"Successfully extracted and normalized {saved_count} questions."
            )
            return {"status": "SUCCESS", "questions_count": saved_count}

    except Exception as exc:
        update_exam_status(source_exam_id, "FAILED", log_entry=f"Error: {str(exc)}")
        raise exc
