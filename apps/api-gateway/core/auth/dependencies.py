"""
JWT 验证依赖
验证 Supabase JWT Token 并返回用户信息
"""
from dotenv import load_dotenv
import os

# 加载 .env 文件中的环境变量（如果还没有加载）
load_dotenv()

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Optional
from supabase import Client
from core.supabase_client import get_supabase_client

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    验证 Supabase JWT Token 并返回用户信息
    
    使用 Supabase SDK 验证 token，避免手动处理 ES256 算法的复杂性
    
    Args:
        credentials: HTTP Bearer Token
        
    Returns:
        Dict: 包含用户信息的字典
        {
            "sub": user_id (UUID),
            "role": "authenticated",
            "email": user_email
        }
        
    Raises:
        HTTPException: Token 无效或过期
    """
    token = credentials.credentials
    
    try:
        supabase = get_supabase_client()
        
        # 使用 Supabase SDK 验证 token
        # Supabase SDK 会自动处理 ES256 算法验证
        user = supabase.auth.get_user(token)
        
        if user and user.user:
            print(f"✅ Token verified successfully for user: {user.user.email}")
            return {
                "sub": user.user.id,
                "role": user.user.role or "authenticated",
                "email": user.user.email,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: User not found"
            )
            
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[Dict]:
    """
    可选的用户验证（用于公开接口）
    如果提供了 Token 则验证，否则返回 None
    """
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


# Supabase 客户端获取函数已移至 core.supabase_client 模块
# 使用单例模式优化性能，支持高并发场景

# AI 配额验证相关依赖已移至 core.ai.dependencies 模块
# 请使用 from core.ai.dependencies import verify_ai_quota 导入

