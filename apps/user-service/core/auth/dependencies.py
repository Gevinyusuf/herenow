"""
Authentication dependencies for user service
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict
import os
import base64
import json
import time

security = HTTPBearer()
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def get_supabase():
    from core.supabase_client import get_supabase_client
    return get_supabase_client()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    验证 Supabase JWT Token 并返回用户信息
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET not configured"
        )

    token = credentials.credentials

    try:
        # JWT 格式: header.payload.signature
        parts = token.split('.')
        if len(parts) != 3:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )

        # 解码 payload
        payload_part = parts[1]
        # 添加 padding 如果需要
        padding = 4 - len(payload_part) % 4
        if padding != 4:
            payload_part += '=' * padding

        payload = json.loads(base64.urlsafe_b64decode(payload_part))

        # 验证过期时间
        if payload.get('exp', 0) < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired"
            )

        # 验证用户 ID
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user id"
            )

        print(f"✅ Token decoded successfully, user_id: {user_id}, email: {payload.get('email')}")

        return {
            "sub": user_id,
            "role": payload.get("role", "authenticated"),
            "email": payload.get("email"),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}"
        )
