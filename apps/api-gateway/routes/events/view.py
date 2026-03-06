"""
活动查看、注册、评论相关路由
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends, Query
from core.auth.dependencies import get_current_user, get_current_user_optional
from core.supabase_client import get_supabase_client
from typing import Dict, Any, Optional
from supabase import Client
import logging
from urllib.parse import quote
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()


def _format_time_ago(timestamp_str: str) -> str:
    """
    格式化时间为相对时间（如 "2h ago"）
    """
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if isinstance(timestamp_str, str):
            dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        else:
            dt = timestamp_str
        
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "just now"
    except:
        return "just now"


@router.get("/events/{event_id}")
async def get_event(
    event_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    获取活动详情
    需要认证
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库连接失败: {str(e)}"
        )
    
    try:
        result = supabase.table("events_v1").select("*").eq("id", event_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="活动不存在"
            )
        
        event_data = result.data[0]
        host_id = event_data.get("host_id")
        
        # 查询主办方信息
        host_info = None
        if host_id:
            try:
                profile_result = supabase.table("profiles").select(
                    "id, full_name, email, avatar_url"
                ).eq("id", host_id).execute()
                
                if profile_result.data:
                    host_info = profile_result.data[0]
            except Exception as e:
                logger.error(f"⚠️ query host info failed: {e}")
        
        # 查询联合主办方信息
        co_hosts_info = []
        co_hosts = event_data.get("co_hosts", [])
        if co_hosts:
            try:
                # 过滤掉非 UUID 格式的 id（如临时 id）
                co_host_ids = []
                for ch in co_hosts:
                    ch_id = ch.get("id")
                    if ch_id:
                        try:
                            # 尝试解析为 UUID，如果成功则添加到列表
                            uuid.UUID(str(ch_id))
                            co_host_ids.append(str(ch_id))
                        except (ValueError, TypeError):
                            # 不是有效的 UUID，跳过
                            logger.debug(f"Skipping invalid UUID: {ch_id}")
                            continue
                
                if co_host_ids:
                    co_hosts_result = supabase.table("profiles").select(
                        "id, full_name, email, avatar_url"
                    ).in_("id", co_host_ids).execute()
                    
                    if co_hosts_result.data:
                        co_hosts_info = co_hosts_result.data
            except Exception as e:
                logger.error(f"⚠️ query co hosts info failed: {e}")
        
        event_data["host"] = host_info
        event_data["co_hosts_info"] = co_hosts_info
        
        return {
            "success": True,
            "data": event_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get event failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get event failed: {str(e)}"
        )


@router.post("/events/register")
async def register_for_event(
    request: Request,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    Register for an event
    Supports both logged-in and non-logged-in users
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        body = await request.json()
        event_id = body.get("event_id")
        form_answers = body.get("form_answers", {})
        ticket_code = body.get("ticket_code")
        
        if not event_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="event id is required"
            )
        
        user_id = current_user.get("sub") if current_user else None

        if not user_id:
            user_id = str(uuid.uuid4())
            logger.info(f"Generated temporary user_id for anonymous registration: {user_id}")

        event_result = supabase.table("events_v1").select("id, require_approval").eq("id", event_id).execute()
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event = event_result.data[0]
        require_approval = event.get("require_approval", False)
        
        email = ""
        first_name = ""
        last_name = ""
        avatar_url = None
        
        if form_answers:
            email = form_answers.get("email", "").strip() if form_answers.get("email") else ""
            name = form_answers.get("name", "").strip() if form_answers.get("name") else ""
            if name:
                name_parts = name.split(" ", 1)
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        if current_user and (not email or not first_name):
            try:
                profile_result = supabase.table("profiles").select(
                    "email, full_name, avatar_url"
                ).eq("id", user_id).execute()
                
                if profile_result.data:
                    profile = profile_result.data[0]
                    if not email:
                        email = profile.get("email") or email
                    
                    if not first_name:
                        full_name = profile.get("full_name", "")
                        if full_name:
                            name_parts = full_name.strip().split(" ", 1)
                            first_name = name_parts[0] if name_parts else ""
                            last_name = name_parts[1] if len(name_parts) > 1 else ""
                    
                    if not avatar_url:
                        avatar_url = profile.get("avatar_url")
            except Exception as e:
                logger.warning(f"get user info failed: {str(e)}")
        
        if not email and current_user:
            email = current_user.get("email", "")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="email is required. Please provide email in form_answers or login first"
            )
        
        if not first_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="name is required. Please provide name in form_answers or login first"
            )
        
        existing_reg = supabase.table("event_registrations").select("id").eq("event_id", event_id).eq("user_id", user_id).execute()
        if existing_reg.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="you have already registered for this event"
            )
        
        registration_status = "pending" if require_approval else "confirmed"
        
        insert_data = {
            "event_id": event_id,
            "user_id": user_id,
            "status": registration_status,
            "form_answers": form_answers,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "avatar_url": avatar_url,
        }
        
        if ticket_code:
            insert_data["ticket_code"] = ticket_code
        else:
            insert_data["ticket_code"] = ""
        
        result = supabase.table("event_registrations").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="register failed"
            )
        
        return {
            "success": True,
            "data": {
                "id": result.data[0].get("id"),
                "status": registration_status,
                "message": "pending" if require_approval else "registration successful"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"register failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"register failed: {str(e)}"
        )


@router.get("/events/{event_id}/registrations")
async def get_event_registrations(
    event_id: str,
    limit: int = Query(5, ge=1, le=5, description="返回的头像数量，最多5个"),
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取活动的注册用户列表（用于显示头像和总数）
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        count_result = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event_id).in_("status", ["confirmed", "pending"]).execute()
        
        total_count = count_result.count if hasattr(count_result, 'count') else 0
        
        registrations_result = supabase.table("event_registrations").select(
            "user_id, avatar_url, first_name, last_name, email, created_at"
        ).eq("event_id", event_id).in_("status", ["confirmed", "pending"]).order("created_at", desc=True).limit(limit).execute()
        
        avatars = []
        if registrations_result.data:
            for reg in registrations_result.data:
                avatar_url = reg.get("avatar_url")
                if not avatar_url:
                    name = ""
                    if reg.get("first_name") or reg.get("last_name"):
                        name = f"{reg.get('first_name', '')} {reg.get('last_name', '')}".strip()
                    elif reg.get("email"):
                        name = reg.get("email").split("@")[0]
                    
                    if name:
                        avatar_url = f"https://ui-avatars.com/api/?name={quote(name)}&background=random"
                    else:
                        avatar_url = "https://ui-avatars.com/api/?name=U&background=random"
                
                avatars.append(avatar_url)
        
        return {
            "success": True,
            "data": {
                "total": total_count,
                "avatars": avatars
            }
        }
        
    except Exception as e:
        logger.error(f"get event registrations failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get event registrations failed: {str(e)}"
        )


@router.get("/events/{event_id}/comments")
async def get_event_comments(
    event_id: str,
    page: int = Query(1, ge=1, description="页码，从1开始"),
    limit: int = Query(10, ge=1, le=50, description="每页数量，最大50"),
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取活动的评论列表（包括回复）
    支持分页查询
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        offset = (page - 1) * limit
        
        count_result = supabase.table("event_comments").select(
            "id", count="exact"
        ).eq("event_id", event_id).is_("parent_id", "null").execute()
        
        total_count = count_result.count if hasattr(count_result, 'count') else 0
        
        comments_result = supabase.table("event_comments").select(
            "id, user_id, content, likes_count, created_at, parent_id"
        ).eq("event_id", event_id).is_("parent_id", "null").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        if not comments_result.data:
            return {
                "success": True,
                "data": [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total_count,
                    "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 0,
                    "has_more": False
                }
            }
        
        user_ids = set()
        for comment in comments_result.data:
            user_ids.add(comment.get("user_id"))
        
        all_comment_ids = [c.get("id") for c in comments_result.data]
        replies_result = supabase.table("event_comments").select(
            "id, user_id, content, likes_count, created_at, parent_id"
        ).eq("event_id", event_id).in_("parent_id", all_comment_ids).order("created_at", desc=False).execute()
        
        if replies_result.data:
            for reply in replies_result.data:
                user_ids.add(reply.get("user_id"))
        
        users_result = supabase.table("profiles").select(
            "id, full_name, email, avatar_url"
        ).in_("id", list(user_ids)).execute()
        
        users_map = {}
        if users_result.data:
            for user in users_result.data:
                users_map[user.get("id")] = user
        
        user_liked_comment_ids = set()
        if current_user:
            user_id = current_user.get("sub")
            if user_id:
                all_ids = all_comment_ids + [r.get("id") for r in (replies_result.data or [])]
                if all_ids:
                    likes_result = supabase.table("event_comment_likes").select(
                        "comment_id"
                    ).eq("user_id", user_id).in_("comment_id", all_ids).execute()
                    
                    if likes_result.data:
                        user_liked_comment_ids = {like.get("comment_id") for like in likes_result.data}
        
        comments_map = {}
        for comment in comments_result.data:
            comment_id = comment.get("id")
            user = users_map.get(comment.get("user_id"), {})
            
            comments_map[comment_id] = {
                "id": comment_id,
                "user": user.get("full_name") or user.get("email") or "Unknown",
                "avatar": user.get("avatar_url") or f"https://ui-avatars.com/api/?name={quote(user.get('full_name') or user.get('email') or 'U')}&background=random",
                "content": comment.get("content"),
                "likes": comment.get("likes_count", 0),
                "isLiked": comment_id in user_liked_comment_ids,
                "time": _format_time_ago(comment.get("created_at")),
                "replies": []
            }
        
        if replies_result.data:
            for reply in replies_result.data:
                parent_id = reply.get("parent_id")
                if parent_id in comments_map:
                    reply_id = reply.get("id")
                    user = users_map.get(reply.get("user_id"), {})
                    
                    comments_map[parent_id]["replies"].append({
                        "id": reply_id,
                        "user": user.get("full_name") or user.get("email") or "Unknown",
                        "avatar": user.get("avatar_url") or f"https://ui-avatars.com/api/?name={quote(user.get('full_name') or user.get('email') or 'U')}&background=random",
                        "content": reply.get("content"),
                        "likes": reply.get("likes_count", 0),
                        "isLiked": reply_id in user_liked_comment_ids,
                        "time": _format_time_ago(reply.get("created_at")),
                    })
        
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        has_more = page < total_pages
        
        return {
            "success": True,
            "data": list(comments_map.values()),
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_more": has_more
            }
        }
        
    except Exception as e:
        logger.error(f"get comments failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get comments failed: {str(e)}"
        )


@router.post("/events/{event_id}/comments")
async def create_event_comment(
    event_id: str,
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    创建评论或回复
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        body = await request.json()
        content = body.get("content", "").strip()
        parent_id = body.get("parent_id")
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="comment content cannot be empty"
            )
        
        user_id = current_user.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user is not logged in"
            )
        
        event_result = supabase.table("events_v1").select("id").eq("id", event_id).execute()
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        if parent_id:
            parent_result = supabase.table("event_comments").select("id").eq("id", parent_id).eq("event_id", event_id).execute()
            if not parent_result.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="parent comment not found"
                )
        
        insert_data = {
            "event_id": event_id,
            "user_id": user_id,
            "content": content,
            "likes_count": 0,
        }
        
        if parent_id:
            insert_data["parent_id"] = parent_id
        
        result = supabase.table("event_comments").insert(insert_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="create comment failed"
            )
        
        user_result = supabase.table("profiles").select(
            "id, full_name, email, avatar_url"
        ).eq("id", user_id).execute()
        
        user = user_result.data[0] if user_result.data else {}

        comment_data = result.data[0]
        return {
            "success": True,
            "data": {
                "id": comment_data.get("id"),
                "user": user.get("full_name") or user.get("email") or "Unknown",
                "avatar": user.get("avatar_url") or f"https://ui-avatars.com/api/?name={quote(user.get('full_name') or user.get('email') or 'U')}&background=random",
                "content": comment_data.get("content"),
                "likes": 0,
                "isLiked": False,
                "time": "just now",
                "replies": []
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create comment failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"create comment failed: {str(e)}"
        )


@router.post("/events/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    点赞/取消点赞评论
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
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user is not logged in"
            )
        
        comment_result = supabase.table("event_comments").select("id, likes_count").eq("id", comment_id).execute()
        if not comment_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="comment not found"
            )
        
        like_result = supabase.table("event_comment_likes").select("id").eq("comment_id", comment_id).eq("user_id", user_id).execute()
        
        if like_result.data:
            supabase.table("event_comment_likes").delete().eq("comment_id", comment_id).eq("user_id", user_id).execute()
            
            new_likes_count = max(0, comment_result.data[0].get("likes_count", 0) - 1)
            supabase.table("event_comments").update({"likes_count": new_likes_count}).eq("id", comment_id).execute()
            
            return {
                "success": True,
                "data": {
                    "liked": False,
                    "likes_count": new_likes_count
                }
            }
        else:
            supabase.table("event_comment_likes").insert({
                "comment_id": comment_id,
                "user_id": user_id
            }).execute()
            
            new_likes_count = comment_result.data[0].get("likes_count", 0) + 1
            supabase.table("event_comments").update({"likes_count": new_likes_count}).eq("id", comment_id).execute()
            
            return {
                "success": True,
                "data": {
                    "liked": True,
                    "likes_count": new_likes_count
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"like operation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"like operation failed: {str(e)}"
        )

@router.get("/events/{event_id}/registration-status")
async def get_registration_status(
    event_id: str,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    检查当前用户对指定活动的注册状态
    返回用户是否已注册、注册状态和注册详情
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        user_id = current_user.get("sub") if current_user else None
        
        if not user_id:
            return {
                "success": True,
                "data": {
                    "is_registered": False,
                    "status": None,
                    "registration": None
                }
            }
        
        registration_result = supabase.table("event_registrations").select(
            "id, status, form_answers, ticket_code, checked_in_at, email, first_name, last_name, avatar_url, created_at"
        ).eq("event_id", event_id).eq("user_id", user_id).execute()
        
        if not registration_result.data:
            return {
                "success": True,
                "data": {
                    "is_registered": False,
                    "status": None,
                    "registration": None
                }
            }
        
        registration = registration_result.data[0]
        
        return {
            "success": True,
            "data": {
                "is_registered": True,
                "status": registration.get("status"),
                "registration": {
                    "id": registration.get("id"),
                    "status": registration.get("status"),
                    "form_answers": registration.get("form_answers"),
                    "ticket_code": registration.get("ticket_code"),
                    "checked_in_at": registration.get("checked_in_at"),
                    "email": registration.get("email"),
                    "first_name": registration.get("first_name"),
                    "last_name": registration.get("last_name"),
                    "avatar_url": registration.get("avatar_url"),
                    "created_at": registration.get("created_at")
                }
            }
        }
        
    except Exception as e:
        logger.error(f"get registration status failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get registration status failed: {str(e)}"
        )


