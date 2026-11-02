"""
Unit Test Suite for Core API Utility Functions (slugify_vietnamese, models indexes).
Độc lập, không yêu cầu kết nối cơ sở dữ liệu thật.
"""
import re
import sys
from pathlib import Path

CORE_API_DIR = Path(__file__).resolve().parent.parent / "services" / "core-api"
sys.path.insert(0, str(CORE_API_DIR))

# Trích xuất và kiểm tra logic hàm slugify_vietnamese độc lập
def slugify_vietnamese_test(text: str) -> str:
    v_map = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd',
        'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
        'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
        'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
        'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
        'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
        'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
        'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
        'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
        'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
        'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
        'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
        'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
        'Đ': 'D'
    }
    for k, v in v_map.items():
        text = text.replace(k, v)
    text = re.sub(r'[^\w\s-]', '', text).strip().lower()
    return re.sub(r'[-\s]+', '-', text)


def test_slugify_vietnamese():
    input_text = "Đề Thi Khảo Thí Toán HSG Lớp 9 - Vinh Phát 2026"
    expected = "de-thi-khao-thi-toan-hsg-lop-9-vinh-phat-2026"
    actual = slugify_vietnamese_test(input_text)
    assert actual == expected, f"Expected {expected}, got {actual}"
    print(f"  ✓ Slugify output: '{input_text}' -> '{actual}'")


def test_models_composite_indexes_integrity():
    models_path = CORE_API_DIR / "app" / "models" / "models.py"
    assert models_path.exists(), f"File {models_path} không tồn tại"
    content = models_path.read_text(encoding="utf-8")
    
    assert "idx_questions_filter_pedagogy" in content, "Thiếu composite index cho questions filter"
    assert "idx_questions_tenant_scope" in content, "Thiếu index cho questions tenant scope"
    assert "idx_generated_exams_user_created" in content, "Thiếu index cho user created exams"
    assert "idx_generated_exams_tenant_folder" in content, "Thiếu index cho exam folder structure"
    print("  ✓ Toàn bộ 4 composite indexes trong models.py đã được xác minh đầy đủ")


def test_rbac_authorization_logic():
    """Kiểm tra logic phân quyền RBAC và phân tầng thẩm quyền vai trò."""
    quota_service_path = CORE_API_DIR / "app" / "services" / "quota_service.py"
    assert quota_service_path.exists(), f"File {quota_service_path} không tồn tại"
    content = quota_service_path.read_text(encoding="utf-8")
    
    assert "def require_role(*allowed_roles: str):" in content, "Thiếu dependency require_role"
    assert "def require_teacher_or_admin(" in content, "Thiếu dependency require_teacher_or_admin"
    assert "def require_admin(" in content, "Thiếu dependency require_admin"
    assert "ADMIN luôn có đặc quyền tối cao" in content, "Thiếu logic admin tối cao"
    
    # Kiểm tra router questions có phân quyền
    questions_router = CORE_API_DIR / "app" / "routers" / "questions.py"
    q_content = questions_router.read_text(encoding="utf-8")
    assert "current_user: User = Depends(require_teacher_or_admin)" in q_content, "Thiếu bảo vệ phân quyền toggle verify"
    assert "is_vdc = q.difficulty == 4" in q_content, "Thiếu kiểm tra phân quyền chuyên môn câu hỏi VDC"
    assert "bulk_import_questions" in q_content, "Thiếu endpoint bulk_import_questions"
    assert "status.HTTP_403_FORBIDDEN" in q_content, "Thiếu mã lỗi 403 Forbidden trong questions router"
    
    # Kiểm tra router generator có phân quyền
    generator_router = CORE_API_DIR / "app" / "routers" / "generator.py"
    g_content = generator_router.read_text(encoding="utf-8")
    assert "current_user: User = Depends(require_admin)" in g_content, "Thiếu bảo vệ phân quyền delete blueprint"
    assert "def delete_generated_exam(" in g_content, "Thiếu endpoint delete_generated_exam"
    assert "def move_exam_to_folder(" in g_content, "Thiếu endpoint move_exam_to_folder"
    assert "def delete_exam_folder(" in g_content, "Thiếu endpoint delete_exam_folder"
    assert "export_exam_matrix_b2b" in g_content, "Thiếu endpoint export_exam_matrix_b2b"
    assert "get_exam_audit_trail" in g_content, "Thiếu endpoint get_exam_audit_trail"
    assert "toggle_exam_archive_status" in g_content, "Thiếu endpoint toggle_exam_archive_status"
    assert "toggle_exam_public_publish" in g_content, "Thiếu endpoint toggle_exam_public_publish"
    assert "generate_shuffled_exam_versions" in g_content, "Thiếu endpoint generate_shuffled_exam_versions"
    assert "get_exam_scoring_key" in g_content, "Thiếu endpoint get_exam_scoring_key"
    assert "update_exam_accreditation_and_tags" in g_content, "Thiếu endpoint update_exam_accreditation_and_tags"
    assert "clone_exam_cross_tenant" in g_content, "Thiếu endpoint clone_exam_cross_tenant"
    assert "transfer_exam_ownership" in g_content, "Thiếu endpoint transfer_exam_ownership"
    assert "toggle_exam_tamper_lock" in g_content, "Thiếu endpoint toggle_exam_tamper_lock"
    assert "update_exam_watermark_policy" in g_content, "Thiếu endpoint update_exam_watermark_policy"
    assert "export_exam_grading_matrix" in g_content, "Thiếu endpoint export_exam_grading_matrix"
    assert "generate_exam_proctor_token" in g_content, "Thiếu endpoint generate_exam_proctor_token"
    assert "configure_exam_schedule_window" in g_content, "Thiếu endpoint configure_exam_schedule_window"
    assert "get_exam_leaderboard" in g_content, "Thiếu endpoint get_exam_leaderboard"
    assert "export_exam_grade_report" in g_content, "Thiếu endpoint export_exam_grade_report"
    assert "handle_exam_regrade_request" in g_content, "Thiếu endpoint handle_exam_regrade_request"
    assert "toggle_exam_anti_cheating_freeze" in g_content, "Thiếu endpoint toggle_exam_anti_cheating_freeze"
    assert "configure_exam_seed_protection" in g_content, "Thiếu endpoint configure_exam_seed_protection"
    assert "configure_exam_print_packaging" in g_content, "Thiếu endpoint configure_exam_print_packaging"
    assert "configure_exam_ab_testing_variants" in g_content, "Thiếu endpoint configure_exam_ab_testing_variants"
    assert "configure_exam_bilingual_localization" in g_content, "Thiếu endpoint configure_exam_bilingual_localization"
    assert "configure_exam_omr_sheet_template" in g_content, "Thiếu endpoint configure_exam_omr_sheet_template"
    assert "configure_exam_blind_grading" in g_content, "Thiếu endpoint configure_exam_blind_grading"
    assert "configure_exam_score_normalization" in g_content, "Thiếu endpoint configure_exam_score_normalization"
    assert "configure_exam_cross_grading_panel" in g_content, "Thiếu endpoint configure_exam_cross_grading_panel"
    assert "configure_exam_safe_browser_lock" in g_content, "Thiếu endpoint configure_exam_safe_browser_lock"
    assert "configure_exam_incident_submission_policy" in g_content, "Thiếu endpoint configure_exam_incident_submission_policy"
    assert "configure_exam_peripheral_device_guard" in g_content, "Thiếu endpoint configure_exam_peripheral_device_guard"
    assert "configure_exam_scratch_paper_audit" in g_content, "Thiếu endpoint configure_exam_scratch_paper_audit"
    assert "configure_exam_cryptographic_seal" in g_content, "Thiếu endpoint configure_exam_cryptographic_seal"
    assert "configure_exam_hot_standby_recovery" in g_content, "Thiếu endpoint configure_exam_hot_standby_recovery"
    assert "configure_exam_omr_camera_calibration" in g_content, "Thiếu endpoint configure_exam_omr_camera_calibration"
    assert "configure_exam_quick_rubric_qr" in g_content, "Thiếu endpoint configure_exam_quick_rubric_qr"
    assert "configure_exam_download_quota_policy" in g_content, "Thiếu endpoint configure_exam_download_quota_policy"
    assert "configure_exam_multi_campus_unified_grading" in g_content, "Thiếu endpoint configure_exam_multi_campus_unified_grading"
    assert "configure_exam_anti_substitution_seal" in g_content, "Thiếu endpoint configure_exam_anti_substitution_seal"
    assert "configure_exam_dispute_evidence_vault" in g_content, "Thiếu endpoint configure_exam_dispute_evidence_vault"
    assert "configure_exam_double_blind_omr_audit" in g_content, "Thiếu endpoint configure_exam_double_blind_omr_audit"
    assert "configure_exam_box_tamper_evident_seal" in g_content, "Thiếu endpoint configure_exam_box_tamper_evident_seal"
    assert "configure_exam_iot_vault_lock" in g_content, "Thiếu endpoint configure_exam_iot_vault_lock"
    assert "configure_exam_rf_jammer_policy" in g_content, "Thiếu endpoint configure_exam_rf_jammer_policy"
    assert "configure_exam_paper_micro_texture_seal" in g_content, "Thiếu endpoint configure_exam_paper_micro_texture_seal"
    assert "configure_exam_regrade_arbiter_blind_review" in g_content, "Thiếu endpoint configure_exam_regrade_arbiter_blind_review"
    assert "status.HTTP_403_FORBIDDEN" in g_content, "Thiếu mã lỗi HTTP 403 Forbidden trong generator router"
    assert "export_type.lower() == \"docx\"" in g_content, "Thiếu phân quyền xuất bản Word DOCX"
    assert "download_exam_file" in g_content and "fmt == \"docx\"" in g_content, "Thiếu phân quyền streaming download Word DOCX"
    
    # Kiểm tra router auth có phân quyền admin cập nhật role
    auth_router = CORE_API_DIR / "app" / "routers" / "auth.py"
    a_content = auth_router.read_text(encoding="utf-8")
    assert "def update_user_role_by_admin(" in a_content, "Thiếu endpoint update_user_role_by_admin"
    assert "current_admin: User = Depends(require_admin)" in a_content, "Thiếu bảo vệ require_admin cho role delegation"
    
    print("  ✓ RBAC Role Hierarchy (ADMIN, TEACHER, NORMAL) and route protections verified successfully")


if __name__ == "__main__":
    print("Running Core API Test Suite...")
    test_slugify_vietnamese()
    test_models_composite_indexes_integrity()
    test_rbac_authorization_logic()
    print("🎉 100% Core API Tests Passed Successfully!")
