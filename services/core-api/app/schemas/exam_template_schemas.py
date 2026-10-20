from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any

class GradingStep(BaseModel):
    """Một bước chấm nguyên tử trong bảng hướng dẫn chấm"""
    step_id: str = Field(description="Mã bước, VD: '14a-1', '14a-2'")
    latex_content: str = Field(description="Nội dung bước giải. Công thức bọc $..$ hoặc $$..$$")
    points: Optional[float] = Field(
        default=None,
        description="Điểm bước này (0.25, 0.5, 0.75, 1.0) hoặc null nếu bước chuyển tiếp"
    )
    milestone_tag: Optional[str] = Field(
        default=None,
        description="Tiêu đề mốc chấm, VD: 'Điều kiện', 'Biến đổi', 'Nghiệm'"
    )
    tikz_code: Optional[str] = Field(
        default=None,
        description="Mã TikZ nếu bước này kèm hình vẽ hình học (đặt bên phải)"
    )

class EssayQuestion(BaseModel):
    """Một câu/ý tự luận trong bảng hướng dẫn chấm"""
    sub_label: str = Field(description="Nhãn cột 1, VD: 'Câu 14a\\n(2,0 điểm)'")
    total_points: float = Field(description="Tổng điểm câu/ý này")
    prompt_latex: str = Field(description="Đề bài (LaTeX)")
    grading_steps: List[GradingStep] = Field(min_length=1)

    @field_validator("grading_steps")
    @classmethod
    def validate_points_sum(cls, steps, info):
        total = info.data.get("total_points", 0)
        actual = sum(s.points or 0 for s in steps)
        if abs(actual - total) > 0.05:
            # Cho phép dung sai nhỏ làm tròn nếu cần, nhưng cảnh báo
            pass
        return steps

class ShortAnswerQuestion(BaseModel):
    """Một câu trắc nghiệm/điền khuyết trong Phần I"""
    number: int
    prompt_latex: str = Field(description="Đề bài câu ghi kết quả")
    short_answer_latex: str = Field(description="Đáp số ngắn gọn, VD: '$P = 2025$'")
    solution_hint_latex: Optional[str] = Field(
        default=None, description="HD: hướng dẫn giải tóm tắt"
    )

class ExamMetadata(BaseModel):
    exam_title: str = "KỲ THI THỬ HỌC SINH GIỎI TỈNH"
    grade_and_year: str = "LỚP 9 NĂM HỌC 2026 - 2027"
    subject: str = "TOÁN"
    duration_minutes: int = 120
    exam_code: Optional[str] = "ĐỀ CHÍNH THỨC"
    governing_body: str = "SỞ GIÁO DỤC VÀ ĐÀO TẠO"
    department_or_school: str = ""

class Part1Config(BaseModel):
    section_title: str = "I. PHẦN GHI KẾT QUẢ (6,0 điểm)"
    section_note: str = "(Thí sinh chỉ cần ghi kết quả vào tờ giấy thi)"
    points_per_question: float = 0.5
    questions: List[ShortAnswerQuestion] = Field(default_factory=list)

class Part2Config(BaseModel):
    section_title: str = "II. PHẦN TỰ LUẬN (14,0 điểm)"
    section_note: str = "(Thí sinh trình bày lời giải vào tờ giấy thi)"
    questions: List[EssayQuestion] = Field(default_factory=list)

class ExamDocument(BaseModel):
    """Schema đầy đủ cho toàn bộ đề thi + hướng dẫn chấm theo khung chuẩn"""
    metadata: ExamMetadata
    part1_short_answer: Optional[Part1Config] = None
    part2_essay: Part2Config
