"""
seed_blueprints.py
Khởi tạo và nạp sẵn 4 khung ma trận chuẩn quốc gia (HSG Tỉnh, Tự luận truyền thống, Chuyên Toán 10, Đội tuyển 8).
"""
import uuid
from app.database import SessionLocal
from app.models.models import ExamBlueprint

PRESET_BLUEPRINTS = [
    {
        "name": "Khung Ma Trận 1: HSG Lớp 9 Chuẩn Mới (10 TN Điền Đáp Số + 5 Tự Luận - 20đ)",
        "description": "Cấu trúc đề thi chọn học sinh giỏi cấp tỉnh mới (Hà Tĩnh, Nghệ An, Vĩnh Phúc...). Gồm 10 câu điền kết quả ngắn và 5 bài tự luận chuyên sâu.",
        "grade": 9,
        "is_preset": True,
        "target_total_score": 20.00,
        "duration_minutes": 150,
        "sections_config": [
            {
                "section_id": "sec_part1",
                "section_title": "I. PHẦN GHI KẾT QUẢ (5,0 điểm)",
                "section_type": "SHORT_ANSWER",
                "section_points": 5.0,
                "slots": [
                    {"slot_index": 1, "points": 0.5, "main_topic": "ALGEBRA", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Biến đổi căn thức & rút gọn"},
                    {"slot_index": 2, "points": 0.5, "main_topic": "ALGEBRA", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Đa thức & giá trị nguyên"},
                    {"slot_index": 3, "points": 0.5, "main_topic": "NUMBER_THEORY", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Số chính phương & số nguyên tố"},
                    {"slot_index": 4, "points": 0.5, "main_topic": "INEQUALITY_EXTREMA", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Bất đẳng thức đại số cơ bản"},
                    {"slot_index": 5, "points": 0.5, "main_topic": "NUMBER_THEORY", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Phương trình nghiệm nguyên"},
                    {"slot_index": 6, "points": 0.5, "main_topic": "COORDINATE_GEOMETRY", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Tọa độ mặt phẳng & đường thẳng"},
                    {"slot_index": 7, "points": 0.5, "main_topic": "PROBABILITY_STATISTICS", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Xác suất cổ điển & thẻ số"},
                    {"slot_index": 8, "points": 0.5, "main_topic": "PRACTICAL_MATH", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Toán thực tế chuyển động / năng suất"},
                    {"slot_index": 9, "points": 0.5, "main_topic": "PLANE_GEOMETRY", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Tỉ số lượng giác / tam giác đồng dạng"},
                    {"slot_index": 10, "points": 0.5, "main_topic": "COMBINATORICS", "difficulty": "MEDIUM", "structure_type": "SINGLE", "title_hint": "Tổ hợp đếm số & chọn phần tử"}
                ]
            },
            {
                "section_id": "sec_part2",
                "section_title": "II. PHẦN TỰ LUẬN (15,0 điểm)",
                "section_type": "ESSAY",
                "section_points": 15.0,
                "slots": [
                    {"slot_index": 11, "points": 3.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Dãy số quy nạp / Tối ưu hóa thực tế"},
                    {"slot_index": 12, "points": 4.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Phương trình vô tỷ & Hệ phương trình phi tuyến"},
                    {"slot_index": 13, "points": 2.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Đại số đối xứng / Đẳng thức có điều kiện"},
                    {"slot_index": 14, "points": 4.0, "main_topic": "PLANE_GEOMETRY", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Hình học phẳng: Tứ giác nội tiếp & tiếp tuyến đường tròn"},
                    {"slot_index": 15, "points": 2.0, "main_topic": "INEQUALITY_EXTREMA", "difficulty": "OLYMPIAD", "structure_type": "SINGLE", "title_hint": "Bất đẳng thức cực trị HSG / Nguyên lý Dirichlet"}
                ]
            }
        ]
    },
    {
        "name": "Khung Ma Trận 2: HSG Lớp 9 Truyền Thống (5 Bài Tự Luận Tích Hợp - 20đ)",
        "description": "Cấu trúc truyền thống lâu đời của các kỳ thi HSG cấp Quận/Huyện/Tỉnh (Hà Nội, Nam Định, Hải Phòng...). 5 bài tự luận với bài hình 3 ý nguyên khối.",
        "grade": 9,
        "is_preset": True,
        "target_total_score": 20.00,
        "duration_minutes": 150,
        "sections_config": [
            {
                "section_id": "sec_part2",
                "section_title": "BÀI THI TỰ LUẬN (20,0 điểm)",
                "section_type": "ESSAY",
                "section_points": 20.0,
                "slots": [
                    {"slot_index": 1, "points": 4.0, "main_topic": "ALGEBRA", "difficulty": "MEDIUM", "structure_type": "MULTI_PART", "title_hint": "Bài 1: Rút gọn biểu thức chứa căn & giá trị nguyên"},
                    {"slot_index": 2, "points": 4.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Bài 2: Phương trình vô tỷ & Hệ phương trình đối xứng"},
                    {"slot_index": 3, "points": 3.0, "main_topic": "NUMBER_THEORY", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Bài 3: Số học (Chia hết, số chính phương, nghiệm nguyên)"},
                    {"slot_index": 4, "points": 6.0, "main_topic": "PLANE_GEOMETRY", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Bài 4: Hình học phẳng nguyên khối (Bài hình 3 ý a, b, c)"},
                    {"slot_index": 5, "points": 3.0, "main_topic": "INEQUALITY_EXTREMA", "difficulty": "OLYMPIAD", "structure_type": "SINGLE", "title_hint": "Bài 5: Bất đẳng thức Cauchy / Cauchy-Schwarz cực trị"}
                ]
            }
        ]
    },
    {
        "name": "Khung Ma Trận 3: Đề Thi Vào Lớp 10 Chuyên Toán (5 Bài Tự Luận - 10đ)",
        "description": "Cấu trúc đề tuyển sinh vào lớp 10 Chuyên Toán (Chuyên Sư Phạm, Chuyên KHTN, Chuyên Lam Sơn, Chuyên Lê Hồng Phong...). Thang 10 điểm, phân hóa sâu sắc.",
        "grade": 9,
        "is_preset": True,
        "target_total_score": 10.00,
        "duration_minutes": 150,
        "sections_config": [
            {
                "section_id": "sec_part2",
                "section_title": "BÀI THI VÀO LỚP 10 CHUYÊN (10,0 điểm)",
                "section_type": "ESSAY",
                "section_points": 10.0,
                "slots": [
                    {"slot_index": 1, "points": 2.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Bài 1: Phương trình / Bất phương trình vô tỷ"},
                    {"slot_index": 2, "points": 2.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Bài 2: Hệ phương trình phi tuyến chứa căn / tham số"},
                    {"slot_index": 3, "points": 2.0, "main_topic": "NUMBER_THEORY", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Bài 3: Số học (Định lý Fermat, số chính phương, cấp số)"},
                    {"slot_index": 4, "points": 3.0, "main_topic": "PLANE_GEOMETRY", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Bài 4: Hình học phẳng (Tiếp tuyến, tứ giác nội tiếp, cát tuyến)"},
                    {"slot_index": 5, "points": 1.0, "main_topic": "COMBINATORICS", "difficulty": "OLYMPIAD", "structure_type": "SINGLE", "title_hint": "Bài 5: Nguyên lý Dirichlet / Bất biến tổ hợp"}
                ]
            }
        ]
    },
    {
        "name": "Khung Ma Trận 4: Khảo Sát Đội Tuyển Học Sinh Giỏi Lớp 8 (5 Bài Tự Luận - 20đ)",
        "description": "Dành riêng cho bồi dưỡng và khảo sát đội tuyển học sinh giỏi Toán 8. Tập trung đa thức, phân thức, tam giác đồng dạng và định lý Thales.",
        "grade": 8,
        "is_preset": True,
        "target_total_score": 20.00,
        "duration_minutes": 120,
        "sections_config": [
            {
                "section_id": "sec_part2",
                "section_title": "BÀI THI KHẢO SÁT TOÁN 8 (20,0 điểm)",
                "section_type": "ESSAY",
                "section_points": 20.0,
                "slots": [
                    {"slot_index": 1, "points": 4.0, "main_topic": "ALGEBRA", "difficulty": "MEDIUM", "structure_type": "MULTI_PART", "title_hint": "Bài 1: Phân tích đa thức thành nhân tử & Rút gọn phân thức"},
                    {"slot_index": 2, "points": 4.0, "main_topic": "ALGEBRA", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Bài 2: Phương trình bậc cao & Phương trình nghiệm nguyên"},
                    {"slot_index": 3, "points": 3.0, "main_topic": "INEQUALITY_EXTREMA", "difficulty": "HARD", "structure_type": "SINGLE", "title_hint": "Bài 3: Bất đẳng thức đại số lớp 8 (Hằng đẳng thức mở rộng)"},
                    {"slot_index": 4, "points": 6.0, "main_topic": "PLANE_GEOMETRY", "difficulty": "HARD", "structure_type": "MULTI_PART", "title_hint": "Bài 4: Hình học 8: Định lý Thales, tam giác đồng dạng & diện tích"},
                    {"slot_index": 5, "points": 3.0, "main_topic": "NUMBER_THEORY", "difficulty": "OLYMPIAD", "structure_type": "SINGLE", "title_hint": "Bài 5: Cực trị hình học hoặc số học tính chất chia hết"}
                ]
            }
        ]
    }
]

def seed_presets():
    db = SessionLocal()
    try:
        # Đánh dấu các preset cũ
        existing = db.query(ExamBlueprint).filter(ExamBlueprint.is_preset == True).all()
        existing_names = {b.name for b in existing}

        added_count = 0
        for p in PRESET_BLUEPRINTS:
            if p["name"] not in existing_names:
                bp = ExamBlueprint(
                    id=uuid.uuid4(),
                    name=p["name"],
                    description=p["description"],
                    grade=p["grade"],
                    is_preset=p["is_preset"],
                    target_total_score=p["target_total_score"],
                    duration_minutes=p["duration_minutes"],
                    sections_config=p["sections_config"]
                )
                db.add(bp)
                added_count += 1
        
        # Cập nhật blueprint cũ đầu tiên nếu có
        first_bp = db.query(ExamBlueprint).filter(ExamBlueprint.is_preset == False).first()
        if first_bp and "Hà Tĩnh" in first_bp.name:
            first_bp.is_preset = True
            first_bp.duration_minutes = 150
            first_bp.target_total_score = 20.00

        db.commit()
        print(f"[Seed Blueprint] Successfully seeded {added_count} preset blueprints!")
    except Exception as e:
        db.rollback()
        print(f"[Seed Blueprint] Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_presets()
