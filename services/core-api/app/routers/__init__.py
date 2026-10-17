from .exams import router as exams_router
from .questions import router as questions_router
from .generator import router as generator_router

__all__ = ["exams_router", "questions_router", "generator_router"]
