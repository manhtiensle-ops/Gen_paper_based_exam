from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid

from ..database import get_db
from ..models.models import User
from ..services.quota_service import (
    require_authenticated_user,
    get_user_ai_quota_info,
    consume_ai_quota,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Multi-tenancy"])

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: str
    subscription_tier: str
    tenant_id: str
    daily_quota: int
    used_today: int
    remaining_quota: int
    is_unlimited: bool

class SwitchTenantRequest(BaseModel):
    tenant_id: str

@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    user: User = Depends(require_authenticated_user)
):
    """Lấy thông tin tài khoản hiện tại cùng định mức Quota AI hôm nay."""
    quota = get_user_ai_quota_info(user)
    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name or "Thầy/Cô Giáo",
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        tenant_id=user.tenant_id,
        daily_quota=quota["daily_quota"],
        used_today=quota["used_today"],
        remaining_quota=quota["remaining"],
        is_unlimited=quota["is_unlimited"]
    )

class UpdateProfileRequest(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    tenant_id: Optional[str] = None

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UpdateProfileRequest,
    cf_access_email: Optional[str] = Header(None, alias="cf-access-authenticated-user-email"),
    db: Session = Depends(get_db)
):
    """Cập nhật thông tin profile của giáo viên."""
    effective_email = cf_access_email or payload.email
    if not effective_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác thực người dùng")
    user = db.query(User).filter(User.email == effective_email).first()
    if not user:
        # Nếu chưa có thì khởi tạo user với email tương ứng
        full_name = payload.full_name or effective_email.split("@")[0].replace(".", " ").title()
        user = User(
            id=uuid.uuid4(),
            email=effective_email,
            full_name=full_name,
            role="TEACHER",
            subscription_tier="PRO",
            tenant_id=payload.tenant_id or "thcs_le_quy_don"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip()
    if payload.tenant_id is not None:
        user.tenant_id = payload.tenant_id.strip()

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name or "Thầy/Cô Giáo",
        avatar_url=user.avatar_url,
        role=user.role,
        subscription_tier=user.subscription_tier,
        tenant_id=user.tenant_id
    )

@router.post("/switch-tenant")
def switch_tenant(
    payload: SwitchTenantRequest,
    cf_access_email: Optional[str] = Header(None, alias="cf-access-authenticated-user-email"),
    db: Session = Depends(get_db)
):
    """Cho phép giáo viên / nhà trường chuyển đổi không gian làm việc (Tenant)."""
    effective_email = cf_access_email
    if not effective_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác thực người dùng")
    user = db.query(User).filter(User.email == effective_email).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    user.tenant_id = payload.tenant_id
    db.commit()
    return {"status": "SUCCESS", "current_tenant": user.tenant_id}
