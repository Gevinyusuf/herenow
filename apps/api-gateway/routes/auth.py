"""
认证相关路由
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from pydantic import BaseModel
from supabase import Client
from typing import Optional

router = APIRouter()

# 使用统一的单例客户端（优化性能，支持高并发）
def get_supabase_admin() -> Client:
    """获取 Supabase 管理员客户端（单例）"""
    return get_supabase_client()


class ActivateRequest(BaseModel):
    """Request model for invite code activation"""
    code: str


@router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current logged-in user information
    """
    return {
        "user_id": current_user["sub"],
        "email": current_user["email"],
        "role": current_user["role"]
    }


@router.post("/auth/activate")
async def activate_user(
    req: ActivateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Activate user with invite code
    Uses atomic operation to claim the invite code
    """
    try:
        supabase_admin = get_supabase_admin()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {str(e)}"
        )
    
    # Get user ID from JWT token
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    clean_code = req.code.strip()
    if not clean_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite code cannot be empty"
        )
    
    # Atomic operation: Try to claim the invite code
    # Logic: Update invite_codes table where code matches AND used_by is NULL
    try:
        claim_res = supabase_admin.table("invite_codes")\
            .update({"used_by": user_id, "used_at": "now()"})\
            .eq("code", clean_code)\
            .is_("used_by", "null")\
            .execute()
        
        if not claim_res.data:
            # If no data returned, the code doesn't exist or has been claimed by someone else
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invite code"
            )
        
        # Successfully claimed, activate user status
        # Note: If invited_by_code field doesn't exist in profiles table, this will fail
        # You may need to add this field to the profiles table first
        try:
            supabase_admin.table("profiles")\
                .update({"status": "active"})\
                .eq("id", user_id)\
                .execute()
        except Exception as profile_error:
            # If updating profile fails (e.g., field doesn't exist), log but don't fail
            # The invite code has already been claimed successfully
            print(f"⚠️  Warning: Failed to update profile status: {profile_error}")
            # You can uncomment the line below if you add invited_by_code field to profiles table
            # .update({"status": "active", "invited_by_code": clean_code})\
        
        return {
            "status": "success",
            "message": "Invite code activated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error activating invite code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate invite code: {str(e)}"
        )

