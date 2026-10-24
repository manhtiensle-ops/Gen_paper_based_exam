import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import Header, Cookie, HTTPException, status, Depends
from sqlalchemy.orm import Session
import redis

from app.database import get_db
from app.models.models import User

# Kết nối Redis dùng quản lý Quota & Rate Limit
REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://redis-broker:6379/0")
try:
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

# Định mức số lần gọi AI / ngày theo từng Role
ROLE_AI_DAILY_QUOTA = {
    "GUEST": 0,
    "NORMAL": 100,
    "VIP": 500,
    "PRO": 999999,
    "ADMIN": 999999,
}

def get_current_user_optional(
    cf_access_email: Optional[str] = Header(None, alias="cf-access-authenticated-user-email"),
    app_user_email: Optional[str] = Cookie(None, alias="hsg_user_email"),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Nhận diện user qua:
    1. Header Cloudflare Access (cf-access-authenticated-user-email)
    2. Cookie phiên trực tiếp (hsg_user_email) cấp từ Google OAuth trực tiếp
    Nếu chưa đăng nhập -> trả về None (GUEST).
    """
    effective_email = cf_access_email or app_user_email
    if not effective_email or not effective_email.strip():
        return None

    email = effective_email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Tự động khởi tạo tài khoản NORMAL khi đăng nhập Google lần đầu
        full_name = email.split("@")[0].replace(".", " ").title()
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name,
            role="NORMAL",
            subscription_tier="NORMAL",
            tenant_id="thcs_le_quy_don"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Kiểm tra thời hạn VIP / PRO (nếu hết hạn thì hạ về NORMAL)
    now = datetime.now(timezone.utc)
    updated = False
    if user.role == "VIP" and user.vip_expires_at and user.vip_expires_at < now:
        user.role = "NORMAL"
        user.subscription_tier = "NORMAL"
        updated = True
    elif user.role == "PRO" and user.pro_expires_at and user.pro_expires_at < now:
        user.role = "NORMAL"
        user.subscription_tier = "NORMAL"
        updated = True
    if updated:
        db.commit()
        db.refresh(user)

    return user

def require_authenticated_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Bắt buộc người dùng phải đăng nhập Google qua Cloudflare Access."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tính năng này yêu cầu đăng nhập tài khoản Google."
        )
    return user

def get_user_ai_quota_info(user: Optional[User]) -> Dict[str, Any]:
    """Tính toán hạn mức sử dụng AI trong ngày của User theo giờ Việt Nam (UTC+7)."""
    if not user:
        return {
            "role": "GUEST",
            "tier": "GUEST",
            "daily_quota": 0,
            "used_today": 0,
            "remaining": 0,
            "is_unlimited": False
        }

    role = (user.role or "NORMAL").upper()
    quota = ROLE_AI_DAILY_QUOTA.get(role, 100)
    is_unlimited = role in ("PRO", "ADMIN")

    used_today = 0
    if redis_client:
        # Tính ngày theo múi giờ Việt Nam (UTC+7)
        now_vn = datetime.now(timezone.utc) + timedelta(hours=7)
        date_str = now_vn.strftime("%Y-%m-%d")
        key = f"ai_quota:{user.id}:{date_str}"
        try:
            val = redis_client.get(key)
            used_today = int(val) if val else 0
        except Exception:
            used_today = 0

    remaining = max(0, quota - used_today) if not is_unlimited else 999999

    return {
        "role": role,
        "tier": user.subscription_tier or role,
        "daily_quota": quota,
        "used_today": used_today,
        "remaining": remaining,
        "is_unlimited": is_unlimited
    }

def consume_ai_quota(user: User, cost: int = 1) -> Dict[str, Any]:
    """Trừ lượt dùng AI. Báo lỗi 403 (GUEST) hoặc 429 (Hết lượt) nếu vượt quota."""
    quota_info = get_user_ai_quota_info(user)
    
    if quota_info["role"] == "GUEST" or quota_info["daily_quota"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản Khách (GUEST) không được phép dùng tính năng AI. Vui lòng đăng nhập Google để nhận 100 lượt miễn phí mỗi ngày."
        )

    if not quota_info["is_unlimited"]:
        if quota_info["used_today"] + cost > quota_info["daily_quota"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Bạn đã dùng hết {quota_info['daily_quota']} lượt AI trong ngày hôm nay. Hạn mức sẽ được làm mới vào 00:00 (giờ VN). Vui lòng nâng cấp VIP hoặc PRO để tiếp tục."
            )

    # Tăng biến đếm trong Redis (hết hạn sau 28 giờ để đảm bảo qua ngày mới)
    if redis_client:
        now_vn = datetime.now(timezone.utc) + timedelta(hours=7)
        date_str = now_vn.strftime("%Y-%m-%d")
        key = f"ai_quota:{user.id}:{date_str}"
        try:
            pipe = redis_client.pipeline()
            pipe.incrby(key, cost)
            pipe.expire(key, 28 * 3600)
            pipe.execute()
        except Exception as e:
            print(f"[Redis Quota Warning] Không thể tăng lượt dùng: {e}")

    quota_info["used_today"] += cost
    quota_info["remaining"] = max(0, quota_info["daily_quota"] - quota_info["used_today"])
    return quota_info
