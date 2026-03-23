"""
User routes - 用户相关路由
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import Dict, Any
from supabase import Client
import logging
from models.schemas import UserProfile, UserProfileUpdate, UserEvent, UserCommunity, UserEventsResponse, UserCommunitiesResponse

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()

@router.get("/users/me")
async def get_current_user_profile(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户的资料信息
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        user_id = current_user.get("sub")
        
        profile_result = supabase.table("profiles").select(
            "id, full_name, email, avatar_url, created_at"
        ).eq("id", user_id).execute()
        
        if not profile_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="user profile not found"
            )
        
        profile = profile_result.data[0]
        
        return {
            "success": True,
            "data": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get user profile failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get user profile failed: {str(e)}"
        )

@router.patch("/users/me")
async def update_current_user_profile(
    update_data: UserProfileUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    更新当前用户的资料信息
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        user_id = current_user.get("sub")
        
        update_payload = {}
        if update_data.full_name is not None:
            update_payload["full_name"] = update_data.full_name
        if update_data.avatar_url is not None:
            update_payload["avatar_url"] = update_data.avatar_url
        
        if not update_payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="no fields to update"
            )
        
        result = supabase.table("profiles").update(
            update_payload
        ).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="user profile not found"
            )
        
        return {
            "success": True,
            "data": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update user profile failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"update user profile failed: {str(e)}"
        )

@router.get("/users/me/events")
async def get_current_user_events(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户的活动列表（创建的和参与的）
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        user_id = current_user.get("sub")
        
        events = []
        
        # 尝试使用 RPC 函数
        try:
            user_events = supabase.rpc(
                'get_user_events_optimized',
                {'p_user_id': user_id}
            ).execute()
            
            if user_events.data:
                for event in user_events.data:
                    events.append({
                        "id": event.get("id"),
                        "title": event.get("title"),
                        "slug": event.get("slug"),
                        "cover_image_url": event.get("cover_image_url"),
                        "start_at": event.get("start_at"),
                        "end_at": event.get("end_at"),
                        "timezone": event.get("timezone"),
                        "location_info": event.get("location_info"),
                        "visibility": event.get("visibility"),
                        "status": event.get("status"),
                        "is_created": event.get("is_created", False),
                        "is_registered": event.get("is_registered", False),
                        "registration_count": event.get("registration_count", 0)
                    })
        except Exception as rpc_error:
            logger.warning(f"RPC function not available, using fallback query: {rpc_error}")
            
            # 备用方案：直接查询
            # 1. 获取用户创建的活动
            created_events = supabase.table("events_v1").select(
                "id, title, slug, cover_image_url, start_at, end_at, timezone, location_info, visibility, status"
            ).eq("host_id", user_id).execute()
            
            if created_events.data:
                for event in created_events.data:
                    events.append({
                        "id": event.get("id"),
                        "title": event.get("title"),
                        "slug": event.get("slug"),
                        "cover_image_url": event.get("cover_image_url"),
                        "start_at": event.get("start_at"),
                        "end_at": event.get("end_at"),
                        "timezone": event.get("timezone"),
                        "location_info": event.get("location_info"),
                        "visibility": event.get("visibility"),
                        "status": event.get("status"),
                        "is_created": True,
                        "is_registered": False,
                        "registration_count": 0
                    })
            
            # 2. 获取用户参与的活动（通过 event_registrations 表）
            try:
                registrations = supabase.table("event_registrations").select(
                    "event_id, status"
                ).eq("user_id", user_id).eq("status", "confirmed").execute()
                
                if registrations.data:
                    event_ids = [r.get("event_id") for r in registrations.data if r.get("event_id")]
                    
                    if event_ids:
                        registered_events = supabase.table("events_v1").select(
                            "id, title, slug, cover_image_url, start_at, end_at, timezone, location_info, visibility, status"
                        ).in_("id", event_ids).execute()
                        
                        if registered_events.data:
                            for event in registered_events.data:
                                # 避免重复（如果用户既是创建者又是参与者）
                                if not any(e.get("id") == event.get("id") for e in events):
                                    events.append({
                                        "id": event.get("id"),
                                        "title": event.get("title"),
                                        "slug": event.get("slug"),
                                        "cover_image_url": event.get("cover_image_url"),
                                        "start_at": event.get("start_at"),
                                        "end_at": event.get("end_at"),
                                        "timezone": event.get("timezone"),
                                        "location_info": event.get("location_info"),
                                        "visibility": event.get("visibility"),
                                        "status": event.get("status"),
                                        "is_created": False,
                                        "is_registered": True,
                                        "registration_count": 0
                                    })
            except Exception as reg_error:
                logger.warning(f"Failed to get registered events: {reg_error}")
        
        return {
            "success": True,
            "data": {
                "events": events,
                "total": len(events)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get user events failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get user events failed: {str(e)}"
        )

@router.get("/users/me/communities")
async def get_current_user_communities(
    current_user: Dict = Depends(get_current_user)
):
    """
    获取当前用户的社群列表（加入的和创建的）
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        user_id = current_user.get("sub")
        
        communities = []
        
        try:
            user_communities = supabase.rpc(
                'get_user_communities_optimized',
                {'p_user_id': user_id}
            ).execute()
            
            if user_communities.data:
                for community in user_communities.data:
                    communities.append({
                        "id": community.get("id"),
                        "name": community.get("name"),
                        "slug": community.get("slug"),
                        "description": community.get("description"),
                        "cover_image_url": community.get("cover_image_url"),
                        "member_count": community.get("member_count", 0),
                        "is_joined": community.get("is_joined", False),
                        "is_owner": community.get("is_owner", False)
                    })
        except Exception as e:
            logger.warning(f"get user communities via RPC failed: {e}")
        
        return {
            "success": True,
            "data": {
                "communities": communities,
                "total": len(communities)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get user communities failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get user communities failed: {str(e)}"
        )
