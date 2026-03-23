"""
报名相关路由
基于 AGENTS.md PRD v2.3
支持免费报名 + 人数上限 + 候补名单 + 自定义字段 + 报名审核
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from core.auth.dependencies import get_current_user, get_current_user_optional
from core.supabase_client import get_supabase_client
from typing import Dict, Any, Optional
from pydantic import BaseModel
from supabase import Client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    return get_supabase_client()


class RegistrationCreateRequest(BaseModel):
    event_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    form_answers: Dict[str, Any] = {}


@router.post("/events/{event_id}/register")
async def register_for_event(
    event_id: str,
    request: Request,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    报名活动（Guest 或已登录用户）
    基于 AGENTS.md: 零注册摩擦，Guest 可直接报名
    """
    try:
        body = await request.json()
        registration_data = RegistrationCreateRequest(**body)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"invalid request data: {str(e)}"
        )

    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )

    try:
        # 获取活动信息
        event_result = supabase.table("events_v1").select(
            "id, title, start_at, require_approval, ticket_config"
        ).eq("id", event_id).execute()

        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )

        event = event_result.data[0]
        user_id = current_user.get("sub") if current_user else None

        # 如果用户已登录，检查是否已经报名
        if user_id:
            existing = supabase.table("event_registrations").select("id, status").eq(
                "event_id", event_id
            ).eq("user_id", user_id).execute()

            if existing.data:
                existing_reg = existing.data[0]
                if existing_reg["status"] == "cancelled":
                    # 之前取消过，重新报名
                    pass
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="you have already registered for this event"
                    )

        # 检查是否使用 RPC 函数
        try:
            result = supabase.rpc(
                'process_registration',
                {
                    'p_event_id': event_id,
                    'p_email': registration_data.email,
                    'p_form_answers': registration_data.form_answers,
                    'p_first_name': registration_data.first_name,
                    'p_last_name': registration_data.last_name,
                    'p_user_id': user_id
                }
            ).execute()

            if result.data:
                return {
                    "success": True,
                    "data": result.data[0]
                }
        except Exception as rpc_error:
            logger.warning(f"RPC process_registration not available: {rpc_error}")

        # 备用方案：直接创建报名记录
        from datetime import datetime
        import random
        import string

        ticket_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

        # 检查活动是否需要审核
        require_approval = event.get("require_approval", False)

        # 获取 ticket_config 中的总票数
        ticket_config = event.get("ticket_config", {})
        total_slots = 100  # 默认100
        if ticket_config and "totalSlots" in ticket_config:
            total_slots = int(ticket_config["totalSlots"])

        # 检查当前报名人数
        confirmed_count_result = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event_id).eq("status", "confirmed").execute()

        confirmed_count = confirmed_count_result.count if hasattr(confirmed_count_result, 'count') else 0

        # 确定状态
        if require_approval:
            reg_status = "pending"
        elif confirmed_count >= total_slots:
            reg_status = "waitlist"
        else:
            reg_status = "confirmed"

        # 创建报名记录
        insert_data = {
            "event_id": event_id,
            "user_id": user_id,
            "email": registration_data.email,
            "first_name": registration_data.first_name,
            "last_name": registration_data.last_name,
            "form_answers": registration_data.form_answers,
            "status": reg_status,
            "ticket_code": ticket_code
        }

        result = supabase.table("event_registrations").insert(insert_data).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="registration failed"
            )

        registration = result.data[0]

        return {
            "success": True,
            "data": {
                "status": registration["status"],
                "registration_id": registration["id"],
                "ticket_code": registration["ticket_code"],
                "message": "Registration successful" if registration["status"] == "confirmed" else "Registration is pending approval"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"register for event failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"registration failed: {str(e)}"
        )


@router.get("/events/{event_id}/registration-status")
async def get_registration_status(
    event_id: str,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取当前用户对特定活动的报名状态
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub") if current_user else None

        if not user_id:
            return {
                "success": True,
                "data": {
                    "is_registered": False,
                    "status": None
                }
            }

        result = supabase.table("event_registrations").select(
            "id, status, ticket_code, created_at"
        ).eq("event_id", event_id).eq("user_id", user_id).execute()

        if result.data:
            return {
                "success": True,
                "data": {
                    "is_registered": True,
                    "status": result.data[0]["status"],
                    "ticket_code": result.data[0]["ticket_code"],
                    "registered_at": result.data[0]["created_at"]
                }
            }

        return {
            "success": True,
            "data": {
                "is_registered": False,
                "status": None
            }
        }

    except Exception as e:
        logger.error(f"get registration status failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get registration status: {str(e)}"
        )


@router.post("/events/{event_id}/cancel-registration")
async def cancel_registration(
    event_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    取消报名
    会自动触发候补递补流程
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        # 检查报名是否存在
        result = supabase.table("event_registrations").select(
            "id, status"
        ).eq("event_id", event_id).eq("user_id", user_id).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="registration not found"
            )

        registration = result.data[0]

        if registration["status"] == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="registration already cancelled"
            )

        # 更新状态为 cancelled
        update_result = supabase.table("event_registrations").update(
            {"status": "cancelled"}
        ).eq("id", registration["id"]).execute()

        # 尝试触发候补递补（通过 RPC 或直接处理）
        try:
            supabase.rpc('process_waitlist_promotion', {'p_event_id': event_id}).execute()
        except Exception as e:
            logger.warning(f"waitlist promotion RPC failed: {e}")

        return {
            "success": True,
            "message": "registration cancelled successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"cancel registration failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to cancel registration: {str(e)}"
        )


@router.get("/events/{event_id}/availability")
async def get_event_availability(
    event_id: str
):
    """
    获取活动的报名可用性（名额/候补状态）
    """
    try:
        supabase = get_supabase()

        # 尝试使用 RPC
        try:
            result = supabase.rpc('check_registration_availability', {
                'p_event_id': event_id
            }).execute()

            if result.data:
                return {
                    "success": True,
                    "data": result.data[0]
                }
        except Exception as rpc_error:
            logger.warning(f"RPC check_registration_availability not available: {rpc_error}")

        # 备用方案
        event_result = supabase.table("events_v1").select(
            "enable_waitlist, waitlist_capacity, ticket_config"
        ).eq("id", event_id).execute()

        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )

        event = event_result.data[0]
        ticket_config = event.get("ticket_config", {})
        total_slots = ticket_config.get("totalSlots", 100)

        confirmed_count_result = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event_id).eq("status", "confirmed").execute()

        confirmed_count = confirmed_count_result.count if hasattr(confirmed_count_result, 'count') else 0

        spots_remaining = max(0, total_slots - confirmed_count)

        return {
            "success": True,
            "data": {
                "available": spots_remaining > 0,
                "type": "confirmed" if spots_remaining > 0 else "waitlist",
                "spots_remaining": spots_remaining,
                "total_slots": total_slots,
                "confirmed_count": confirmed_count
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get event availability failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get availability: {str(e)}"
        )
