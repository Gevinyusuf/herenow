"""
活动内容沉淀路由
基于 AGENTS.md PRD v2.3
支持活动后的照片、回顾、课件、视频、评分
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from starlette.requests import Request
from core.auth.dependencies import get_current_user, get_current_user_optional
from core.supabase_client import get_supabase_client
from core.r2_client import R2Client
from typing import Dict, Any, Optional
from supabase import Client
import logging
import uuid
import io

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    return get_supabase_client()


@router.get("/events/{event_id}/contents")
async def get_event_contents(
    event_id: str,
    content_type: Optional[str] = None,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取活动的沉淀内容
    content_type: album | review | materials | video | rating
    """
    try:
        supabase = get_supabase()

        query = supabase.table("event_contents").select("*").eq("event_id", event_id)

        if content_type:
            query = query.eq("content_type", content_type)

        result = query.eq("is_published", True).order("created_at", desc=True).execute()

        return {
            "success": True,
            "data": result.data or []
        }

    except Exception as e:
        logger.error(f"get event contents failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get contents: {str(e)}"
        )


@router.post("/events/{event_id}/contents/review")
async def create_or_update_event_review(
    event_id: str,
    title: str = Form(...),
    content: str = Form(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    创建或更新活动回顾
    一个活动只能有一个回顾（由主办方创作）
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        # 检查权限（必须是活动主办方或联合主办方）
        event_result = supabase.table("events_v1").select("host_id, co_hosts").eq("id", event_id).execute()

        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )

        event = event_result.data[0]
        is_host = event.get("host_id") == user_id

        co_hosts = event.get("co_hosts", [])
        is_cohost = any(
            (isinstance(ch, dict) and ch.get("id") == user_id) or
            (isinstance(ch, str) and ch == user_id)
            for ch in co_hosts
        ) if co_hosts else False

        if not (is_host or is_cohost):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="only event host or co-host can create review"
            )

        # 检查是否已存在回顾
        existing = supabase.table("event_contents").select("id").eq(
            "event_id", event_id
        ).eq("content_type", "review").eq("author_id", user_id).execute()

        if existing.data:
            # 更新现有回顾
            result = supabase.table("event_contents").update({
                "title": title,
                "content_data": {"content": content},
                "is_published": True
            }).eq("id", existing.data[0].get("id")).execute()
            return {
                "success": True,
                "data": result.data[0] if result.data else None,
                "action": "updated"
            }
        else:
            # 创建新回顾
            result = supabase.table("event_contents").insert({
                "event_id": event_id,
                "content_type": "review",
                "title": title,
                "content_data": {"content": content},
                "author_id": user_id,
                "is_published": True
            }).execute()
            return {
                "success": True,
                "data": result.data[0] if result.data else None,
                "action": "created"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create/update event review failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to save review: {str(e)}"
        )


@router.get("/events/{event_id}/contents/stats")
async def get_event_content_stats(
    event_id: str
):
    """
    获取活动的内容统计
    """
    try:
        supabase = get_supabase()

        try:
            result = supabase.rpc('get_event_content_stats', {
                'p_event_id': event_id
            }).execute()

            if result.data:
                return {
                    "success": True,
                    "data": result.data[0]
                }
        except Exception as rpc_error:
            logger.warning(f"RPC not available: {rpc_error}")

        # 备用方案：手动统计
        event_result = supabase.table("events_v1").select("title, start_at, host_id").eq("id", event_id).execute()

        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )

        # 统计照片
        photos_count_result = supabase.table("event_photos").select("id", count="exact").execute()
        photos_count = photos_count_result.count if hasattr(photos_count_result, 'count') else 0

        # 统计评分
        ratings_result = supabase.table("event_ratings").select("score").eq("event_id", event_id).execute()

        ratings = ratings_result.data or []
        avg_rating = 0.0
        if ratings:
            avg_rating = sum(r["score"] for r in ratings) / len(ratings)

        return {
            "success": True,
            "data": {
                "photo_count": photos_count,
                "review_count": 0,
                "material_count": 0,
                "video_count": 0,
                "avg_rating": round(avg_rating, 2),
                "rating_count": len(ratings)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get event content stats failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get stats: {str(e)}"
        )


@router.post("/events/{event_id}/contents/rating")
async def create_event_rating(
    event_id: str,
    request: Request,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    为活动创建评分
    已参与活动的用户可以评分（Guest 也可以）
    """
    try:
        body = await request.json()
        score = body.get("score")
        comment = body.get("comment", "")
        is_anonymous = body.get("is_anonymous", False)

        if not score or not (1 <= score <= 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="score must be between 1 and 5"
            )

        supabase = get_supabase()

        # 获取用户信息
        user_id = current_user.get("sub") if current_user else None
        email = body.get("email") or (current_user.get("email") if current_user else None)

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="email is required for rating"
            )

        # 检查用户是否参与了活动（使用邮箱或用户ID检查）
        registration_result = supabase.table("event_registrations").select("id").eq(
            "event_id", event_id
        ).eq("status", "confirmed").execute()

        has_attended = False
        if user_id:
            user_registrations = [r for r in registration_result.data if r.get("user_id") == user_id]
            has_attended = len(user_registrations) > 0
        else:
            email_registrations = [r for r in registration_result.data if r.get("email") == email]
            has_attended = len(email_registrations) > 0

        # 如果是活动主办方，也可以评分
        event_result = supabase.table("events_v1").select("host_id").eq("id", event_id).execute()
        if event_result.data and event_result.data[0].get("host_id") == user_id:
            has_attended = True

        if not has_attended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="you can only rate events you have attended"
            )

        # 检查是否已经评分
        existing_rating = None
        if user_id:
            existing_result = supabase.table("event_ratings").select("id").eq(
                "event_id", event_id
            ).eq("user_id", user_id).execute()
            if existing_result.data:
                existing_rating = existing_result.data[0]

        if not user_id:
            existing_result = supabase.table("event_ratings").select("id").eq(
                "event_id", event_id
            ).eq("email", email).execute()
            if existing_result.data:
                existing_rating = existing_result.data[0]

        if existing_rating:
            # 更新评分
            result = supabase.table("event_ratings").update({
                "score": score,
                "comment": comment,
                "is_anonymous": is_anonymous
            }).eq("id", existing_rating["id"]).execute()
        else:
            # 创建新评分
            result = supabase.table("event_ratings").insert({
                "event_id": event_id,
                "user_id": user_id,
                "email": email,
                "score": score,
                "comment": comment,
                "is_anonymous": is_anonymous
            }).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to save rating"
            )

        return {
            "success": True,
            "data": result.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"create event rating failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to create rating: {str(e)}"
        )


@router.get("/events/{event_id}/ratings")
async def get_event_ratings(
    event_id: str,
    page: int = 1,
    limit: int = 20
):
    """
    获取活动的评分列表
    """
    try:
        supabase = get_supabase()
        offset = (page - 1) * limit

        result = supabase.table("event_ratings").select(
            "id, score, comment, is_anonymous, created_at"
        ).eq("event_id", event_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        # 获取总数
        count_result = supabase.table("event_ratings").select("id", count="exact").eq("event_id", event_id).execute()
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

    except Exception as e:
        logger.error(f"get event ratings failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get ratings: {str(e)}"
        )


@router.get("/events/{event_id}/can-rate")
async def check_can_rate_event(
    event_id: str,
    request: Request,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    检查当前用户是否可以对活动评分
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub") if current_user else None
        email = current_user.get("email") if current_user else request.query_params.get("email")

        if not user_id and not email:
            return {
                "success": True,
                "data": {
                    "can_rate": False,
                    "reason": "authentication_required"
                }
            }

        # 检查是否参与了活动
        query = supabase.table("event_registrations").select("id").eq(
            "event_id", event_id
        ).eq("status", "confirmed")

        if user_id:
            query = query.eq("user_id", user_id)
        else:
            query = query.eq("email", email)

        registration_result = query.execute()
        has_attended = len(registration_result.data) > 0

        # 检查是否是主办方
        event_result = supabase.table("events_v1").select("host_id").eq("id", event_id).execute()
        is_host = event_result.data and event_result.data[0].get("host_id") == user_id

        # 检查是否已经评分
        rating_query = supabase.table("event_ratings").select("id").eq("event_id", event_id)
        if user_id:
            rating_query = rating_query.eq("user_id", user_id)
        else:
            rating_query = rating_query.eq("email", email)

        has_rated = len(rating_query.execute().data) > 0

        return {
            "success": True,
            "data": {
                "can_rate": (has_attended or is_host) and not has_rated,
                "has_attended": has_attended,
                "is_host": is_host,
                "has_rated": has_rated
            }
        }

    except Exception as e:
        logger.error(f"check can rate event failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to check: {str(e)}"
        )


@router.get("/events/{event_id}/photos")
async def get_event_photos(
    event_id: str
):
    """
    获取活动的照片列表
    通过 event_contents 的 album 类型关联查询
    """
    try:
        supabase = get_supabase()

        # 先获取活动的相册内容记录
        album_result = supabase.table("event_contents").select(
            "id, content_data"
        ).eq("event_id", event_id).eq("content_type", "album").eq("is_published", True).execute()

        if not album_result.data:
            return {
                "success": True,
                "data": []
            }

        content_id = album_result.data[0].get("id")

        # 获取照片列表
        result = supabase.table("event_photos").select(
            "id, url, thumbnail_url, caption, width, height, created_at"
        ).eq("event_content_id", content_id).order("created_at", desc=True).execute()

        return {
            "success": True,
            "data": result.data or []
        }

    except Exception as e:
        logger.error(f"get event photos failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get photos: {str(e)}"
        )


@router.post("/events/{event_id}/photos")
async def upload_event_photo(
    event_id: str,
    file: Optional[UploadFile] = File(None),
    caption: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user)
):
    """
    上传活动照片（简化版）
    自动创建/获取相册内容记录
    支持文件上传或 URL 下载
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")

        # 检查权限
        event_result = supabase.table("events_v1").select("host_id, co_hosts").eq("id", event_id).execute()

        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )

        event = event_result.data[0]
        is_host = event.get("host_id") == user_id

        co_hosts = event.get("co_hosts", [])
        is_cohost = any(
            (isinstance(ch, dict) and ch.get("id") == user_id) or
            (isinstance(ch, str) and ch == user_id)
            for ch in co_hosts
        ) if co_hosts else False

        if not (is_host or is_cohost):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="only event host or co-host can upload photos"
            )

        # 1. 查找或创建相册内容记录
        album_content = supabase.table("event_contents").select("id").eq(
            "event_id", event_id
        ).eq("content_type", "album").eq("author_id", user_id).execute()

        content_id = None
        if album_content.data:
            content_id = album_content.data[0].get("id")
        else:
            # 创建新相册
            new_content = supabase.table("event_contents").insert({
                "event_id": event_id,
                "content_type": "album",
                "title": "Event Photos",
                "content_data": {"photos": []},
                "author_id": user_id,
                "is_published": True
            }).execute()
            if new_content.data:
                content_id = new_content.data[0].get("id")

        if not content_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to create album"
            )

        file_url = None

        if image_url:
            # URL 模式：直接使用传入的 URL
            file_url = image_url
        elif file:
            # 文件模式：上传到 R2
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="only image files are allowed"
                )

            file_content = await file.read()

            # 限制文件大小（10MB）
            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="image size cannot exceed 10MB"
                )

            # 上传到 R2
            file_ext = "." + file.content_type.split("/")[-1]
            if file_ext == ".jpeg":
                file_ext = ".jpg"

            r2_key = f"event-photos/{event_id}/{uuid.uuid4()}{file_ext}"
            r2_client = R2Client()

            upload_success = r2_client.upload_fileobj(
                io.BytesIO(file_content),
                r2_key,
                content_type=file.content_type
            )

            if not upload_success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="failed to upload image"
                )

            file_url = f"https://{r2_client.account_id}.r2.cloudflarestorage.com/{r2_client.bucket_name}/{r2_key}"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="either file or image_url must be provided"
            )

        # 保存照片到 event_photos 表
        result = supabase.table("event_photos").insert({
            "event_content_id": content_id,
            "url": file_url,
            "uploaded_by": user_id,
            "caption": caption
        }).execute()

        # 更新 event_contents 的 content_data（添加照片引用）
        photo_data = {
            "url": file_url,
            "caption": caption,
            "id": str(result.data[0].get("id")) if result.data else None
        }

        existing_data = supabase.table("event_contents").select("content_data").eq("id", content_id).execute()
        if existing_data.data:
            old_photos = existing_data.data[0].get("content_data", {}).get("photos", [])
            new_photos = old_photos + [photo_data]
            supabase.table("event_contents").update({
                "content_data": {"photos": new_photos}
            }).eq("id", content_id).execute()

        return {
            "success": True,
            "data": result.data[0] if result.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upload event photo failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to upload photo: {str(e)}"
        )
