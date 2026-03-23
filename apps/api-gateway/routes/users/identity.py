"""
用户身份相关路由
基于 AGENTS.md PRD v2.3
支持 Guest → Lite User → Full User 渐进升级
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import Dict, Any, Optional
from supabase import Client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    return get_supabase_client()


@router.get("/users/me/identity")
async def get_user_identity(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户身份信息
    返回: guest | lite | full
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            return {
                "success": True,
                "data": {
                    "identity": "guest",
                    "is_logged_in": False
                }
            }

        # 查询用户身份
        result = supabase.table("profiles").select("user_identity").eq("id", user_id).execute()

        identity = "guest"
        if result.data and result.data[0].get("user_identity"):
            identity = result.data[0]["user_identity"]

        return {
            "success": True,
            "data": {
                "identity": identity,
                "is_logged_in": True
            }
        }

    except Exception as e:
        logger.error(f"get user identity failed: {str(e)}", exc_info=True)
        return {
            "success": True,
            "data": {
                "identity": "guest",
                "is_logged_in": False
            }
        }


@router.post("/users/me/upgrade-to-lite")
async def upgrade_to_lite(
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    将 Guest 用户升级为 Lite User
    触发场景：报名成功页（30-40%转化率）
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        body = await request.json()
        provider = body.get("provider")  # 'google' | 'apple'
        provider_user_id = body.get("provider_user_id")

        if not provider or not provider_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="provider and provider_user_id are required"
            )

        # 更新用户身份为 lite
        result = supabase.rpc('upgrade_user_identity', {
            'p_user_id': user_id,
            'p_to_identity': 'lite',
            'p_trigger_context': 'registration_success'
        }).execute()

        # 记录绑定信息
        supabase.table("user_auth_bindings").insert({
            "user_id": user_id,
            "provider": provider,
            "provider_user_id": provider_user_id
        }).execute()

        return {
            "success": True,
            "data": {
                "identity": "lite",
                "message": "Successfully upgraded to Lite User"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upgrade to lite failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"upgrade failed: {str(e)}"
        )


@router.post("/users/me/upgrade-to-full")
async def upgrade_to_full(
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    将 Lite User 升级为 Full User
    触发场景：Lite User 深度使用后引导
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        body = await request.json()
        full_name = body.get("full_name")
        primary_intent = body.get("primary_intent", "HYBRID")  # CONSUMER | ORGANIZER | HYBRID

        if not full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="full_name is required"
            )

        # 更新用户资料
        update_data = {
            "full_name": full_name,
            "user_identity": "full",
            "is_onboarded": True
        }

        if primary_intent in ["CONSUMER", "ORGANIZER", "HYBRID"]:
            update_data["primary_intent"] = primary_intent

        result = supabase.table("profiles").update(update_data).eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to update profile"
            )

        # 记录升级事件
        try:
            supabase.table("identity_upgrade_events").insert({
                "user_id": user_id,
                "from_identity": "lite",
                "to_identity": "full",
                "trigger_context": "profile_completion"
            }).execute()
        except Exception as log_error:
            logger.warning(f"failed to log upgrade event: {log_error}")

        return {
            "success": True,
            "data": {
                "identity": "full",
                "message": "Successfully upgraded to Full User"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upgrade to full failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"upgrade failed: {str(e)}"
        )


@router.get("/users/me/upgrade-options")
async def get_upgrade_options(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取用户可用的升级选项
    根据当前身份返回下一步升级建议
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            return {
                "success": True,
                "data": {
                    "current_identity": "guest",
                    "can_upgrade_to_lite": True,
                    "can_upgrade_to_full": False,
                    "upgrade_suggestions": [
                        {
                            "action": "bind_google",
                            "title": "Quick Sign Up",
                            "description": "One-click sign up with Google to access your registration history and get personalized recommendations",
                            "button_text": "Sign up with Google"
                        }
                    ]
                }
            }

        # 查询用户身份
        result = supabase.table("profiles").select("user_identity").eq("id", user_id).execute()

        current_identity = "guest"
        if result.data and result.data[0].get("user_identity"):
            current_identity = result.data[0]["user_identity"]

        suggestions = []

        if current_identity == "guest":
            suggestions = [
                {
                    "action": "bind_google",
                    "title": "One-Click Sign Up",
                    "description": "Sign up with Google or Apple to view your registration history and get personalized event recommendations",
                    "button_text": "Sign Up Now",
                    "trigger_context": "registration_success",
                    "conversion_rate": "30-40%"
                },
                {
                    "action": "bind_apple",
                    "title": "Quick Sign Up with Apple",
                    "description": "Use Apple for instant sign up, no password needed",
                    "button_text": "Sign Up with Apple",
                    "trigger_context": "registration_success",
                    "conversion_rate": "30-40%"
                }
            ]
        elif current_identity == "lite":
            suggestions = [
                {
                    "action": "complete_profile",
                    "title": "Complete Your Profile",
                    "description": "Add your name to unlock full features including creating events and accessing AI assistant",
                    "button_text": "Complete Profile",
                    "trigger_context": "deep_usage",
                    "conversion_rate": "15-25%"
                }
            ]

        return {
            "success": True,
            "data": {
                "current_identity": current_identity,
                "can_upgrade_to_lite": current_identity == "guest",
                "can_upgrade_to_full": current_identity == "lite",
                "upgrade_suggestions": suggestions
            }
        }

    except Exception as e:
        logger.error(f"get upgrade options failed: {str(e)}", exc_info=True)
        return {
            "success": True,
            "data": {
                "current_identity": "guest",
                "can_upgrade_to_lite": True,
                "can_upgrade_to_full": False,
                "upgrade_suggestions": []
            }
        }
