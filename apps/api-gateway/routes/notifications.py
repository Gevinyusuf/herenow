"""
通知相关路由
基于 AGENTS.md PRD v2.3
支持报名确认、活动提醒、候补递补、回顾发布通知
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from core.auth.dependencies import get_current_user, get_current_user_optional
from core.supabase_client import get_supabase_client
from typing import Dict, Any, Optional, List
from supabase import Client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    return get_supabase_client()


@router.get("/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户的通知列表
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        offset = (page - 1) * limit

        query = supabase.table("notifications").select("*").eq("user_id", user_id)

        if unread_only:
            query = query.eq("is_read", False)

        result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        # 获取总数
        count_query = supabase.table("notifications").select("id", count="exact").eq("user_id", user_id)
        if unread_only:
            count_query = count_query.eq("is_read", False)

        count_result = count_query.execute()
        total = count_result.count if hasattr(count_result, 'count') else 0

        return {
            "success": True,
            "data": result.data or [],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit if total > 0 else 0
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get notifications failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get notifications: {str(e)}"
        )


@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户的未读通知数量
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            return {
                "success": True,
                "data": {"count": 0}
            }

        # 尝试使用 RPC
        try:
            result = supabase.rpc('get_unread_notification_count', {
                'p_user_id': user_id
            }).execute()

            if result.data:
                return {
                    "success": True,
                    "data": {"count": result.data[0]}
                }
        except Exception as rpc_error:
            logger.warning(f"RPC not available: {rpc_error}")

        # 备用方案
        count_result = supabase.table("notifications").select(
            "id", count="exact"
        ).eq("user_id", user_id).eq("is_read", False).execute()

        count = count_result.count if hasattr(count_result, 'count') else 0

        return {
            "success": True,
            "data": {"count": count}
        }

    except Exception as e:
        logger.error(f"get unread count failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get unread count: {str(e)}"
        )


@router.post("/notifications/mark-read")
async def mark_notifications_read(
    notification_ids: List[str],
    current_user: Dict = Depends(get_current_user)
):
    """
    批量标记通知为已读
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        # 更新通知状态
        result = supabase.table("notifications").update({
            "is_read": True,
            "read_at": "now()"
        }).in_("id", notification_ids).eq("user_id", user_id).execute()

        return {
            "success": True,
            "data": {
                "marked_count": len(result.data) if result.data else len(notification_ids)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"mark notifications read failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to mark as read: {str(e)}"
        )


@router.post("/notifications/read-all")
async def mark_all_read(
    current_user: Dict = Depends(get_current_user)
):
    """
    标记所有通知为已读
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        result = supabase.table("notifications").update({
            "is_read": True,
            "read_at": "now()"
        }).eq("user_id", user_id).eq("is_read", False).execute()

        return {
            "success": True,
            "message": "all notifications marked as read"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"mark all read failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to mark all as read: {str(e)}"
        )


@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    删除单条通知
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        result = supabase.table("notifications").delete().eq(
            "id", notification_id
        ).eq("user_id", user_id).execute()

        return {
            "success": True,
            "message": "notification deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete notification failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to delete: {str(e)}"
        )


@router.get("/notification-preferences")
async def get_notification_preferences(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取用户的通知偏好设置
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        result = supabase.table("notification_preferences").select("*").eq(
            "user_id", user_id
        ).execute()

        if result.data:
            return {
                "success": True,
                "data": result.data[0]
            }

        # 如果没有偏好设置，返回默认值
        default_preferences = {
            "email_registration": True,
            "email_reminder": True,
            "email_event_changes": True,
            "email_waitlist": True,
            "email_review_published": True,
            "email_organizer_updates": False,
            "email_marketing": False,
            "push_enabled": True,
            "push_registration": True,
            "push_reminder": True,
            "push_event_changes": True
        }

        return {
            "success": True,
            "data": default_preferences
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get notification preferences failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get preferences: {str(e)}"
        )


@router.put("/notification-preferences")
async def update_notification_preferences(
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    更新用户的通知偏好设置
    """
    try:
        body = await request.json()
        supabase = get_supabase()
        user_id = current_user.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="authentication required"
            )

        # 允许更新的字段
        allowed_fields = [
            "email_registration", "email_reminder", "email_event_changes",
            "email_waitlist", "email_review_published", "email_organizer_updates",
            "email_marketing", "push_enabled", "push_registration",
            "push_reminder", "push_event_changes", "do_not_disturb_start",
            "do_not_disturb_end", "timezone"
        ]

        update_data = {}
        for field in allowed_fields:
            if field in body:
                update_data[field] = body[field]

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="no valid fields to update"
            )

        # 检查是否已存在偏好设置
        existing = supabase.table("notification_preferences").select("id").eq(
            "user_id", user_id
        ).execute()

        if existing.data:
            # 更新
            result = supabase.table("notification_preferences").update(
                update_data
            ).eq("user_id", user_id).execute()
        else:
            # 创建
            update_data["user_id"] = user_id
            result = supabase.table("notification_preferences").insert(
                update_data
            ).execute()

        return {
            "success": True,
            "data": result.data[0] if result.data else update_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update notification preferences failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to update preferences: {str(e)}"
        )
