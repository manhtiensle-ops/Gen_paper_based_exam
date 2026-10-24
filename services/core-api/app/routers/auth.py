from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status, Query
from fastapi.responses import RedirectResponse
import os
import uuid
import requests
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

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

@router.get("/google-login")
def redirect_to_google_oauth():
    """Khởi tạo luồng đăng nhập Google OAuth 2.0 trực tiếp của ứng dụng."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = "https://dethi.ttgdvinhphat.com/api/auth/callback/google"
    scope = "openid email profile"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"prompt=select_account"
    )
    return RedirectResponse(url=auth_url)

@router.get("/callback/google")
def google_oauth_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Tiếp nhận Authorization Code từ Google, lấy token & thông tin người dùng, cấp cookie session."""
    if error or not code:
        return RedirectResponse(url="https://dethi.ttgdvinhphat.com/?login_error=cancelled")

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = "https://dethi.ttgdvinhphat.com/api/auth/callback/google"

    # 1. Đổi code lấy access_token
    token_url = "https://oauth2.googleapis.com/token"
    token_payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    token_res = requests.post(token_url, data=token_payload, timeout=10)
    if not token_res.ok:
        return RedirectResponse(url="https://dethi.ttgdvinhphat.com/?login_error=token_failed")

    token_data = token_res.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(url="https://dethi.ttgdvinhphat.com/?login_error=missing_token")

    # 2. Lấy thông tin userinfo từ Google
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    userinfo_res = requests.get(userinfo_url, headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
    if not userinfo_res.ok:
        return RedirectResponse(url="https://dethi.ttgdvinhphat.com/?login_error=userinfo_failed")

    userinfo = userinfo_res.json()
    email = userinfo.get("email")
    if not email:
        return RedirectResponse(url="https://dethi.ttgdvinhphat.com/?login_error=no_email")

    email = email.strip().lower()
    full_name = userinfo.get("name") or email.split("@")[0].replace(".", " ").title()
    avatar_url = userinfo.get("picture")

    # 3. Tạo hoặc cập nhật người dùng trong DB
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            avatar_url=avatar_url,
            role="NORMAL",
            subscription_tier="NORMAL",
            tenant_id="thcs_le_quy_don"
        )
        db.add(user)
    else:
        if full_name:
            user.full_name = full_name
        if avatar_url:
            user.avatar_url = avatar_url
    db.commit()

    # 4. Gắn Cookie HTTP-Only bảo mật và redirect về trang chủ
    response = RedirectResponse(url="https://dethi.ttgdvinhphat.com/")
    response.set_cookie(
        key="hsg_user_email",
        value=email,
        max_age=7 * 24 * 3600,  # 7 ngày
        path="/",
        domain=".ttgdvinhphat.com",
        secure=True,
        httponly=False,  # Để frontend đọc được trạng thái nếu cần
        samesite="lax"
    )
    return response
