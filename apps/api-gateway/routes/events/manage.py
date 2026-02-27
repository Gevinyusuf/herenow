"""
活动管理路由（guests、resources等）
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query, Request
from core.auth.dependencies import get_current_user, get_current_user_optional
from core.supabase_client import get_supabase_client
from core.r2_client import R2Client
from typing import Dict, Any, Optional
from supabase import Client
import logging
import uuid
from pathlib import Path
import io

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()


@router.get("/events/{event_id}/guests")
async def get_event_guests(
    event_id: str,
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    limit: int = Query(20, ge=1, le=100, description="Number of items per page (max 100)"),
    current_user: Dict = Depends(get_current_user)
):
    """
    获取活动的注册用户列表（用于管理页面的 Guests 标签页）
    支持分页查询
    需要认证，只有活动主办方可以查看
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
        
        event_result = supabase.table("events_v1").select("host_id, ticket_config").eq("id", event_id).execute()
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event_host_id = event_result.data[0].get("host_id")
        if event_host_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="only event host can view guests list"
            )
        
        ticket_config = event_result.data[0].get("ticket_config", {})
        tickets_map = {}
        if ticket_config and ticket_config.get("tickets"):
            for ticket in ticket_config.get("tickets", []):
                ticket_id = str(ticket.get("id", ""))
                if ticket_id:
                    tickets_map[ticket_id] = ticket
        
        # 计算分页偏移量
        offset = (page - 1) * limit
        
        # 获取总数
        count_result = supabase.table("event_registrations").select(
            "id", count="exact"
        ).eq("event_id", event_id).execute()
        total_count = count_result.count if hasattr(count_result, 'count') else 0
        
        # 分页查询注册记录
        registrations_result = supabase.table("event_registrations").select(
            "id, user_id, email, first_name, last_name, avatar_url, status, ticket_code, created_at, checked_in_at"
        ).eq("event_id", event_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        guests = []
        if registrations_result.data:
            for reg in registrations_result.data:
                created_at = reg.get("created_at", "")
                if created_at:
                    try:
                        from datetime import datetime
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        formatted_date = dt.strftime("%b %d, %I:%M %p")
                    except:
                        formatted_date = created_at
                else:
                    formatted_date = "N/A"
                
                ticket_code = reg.get("ticket_code")
                ticket_type = "General"
                amt = 0
                
                if ticket_code and ticket_code in tickets_map:
                    ticket_info = tickets_map[ticket_code]
                    ticket_type = ticket_info.get("name", "General")
                    if ticket_info.get("type") == "paid":
                        price = ticket_info.get("price", 0)
                        if isinstance(price, (int, float)):
                            amt = float(price)
                        elif isinstance(price, str):
                            try:
                                amt = float(price)
                            except:
                                amt = 0
                elif ticket_code:
                    ticket_type = str(ticket_code)
                
                checked_in = reg.get("checked_in_at") is not None
                
                guest = {
                    "id": reg.get("id"),
                    "name": f"{reg.get('first_name', '')} {reg.get('last_name', '')}".strip() or reg.get("email", "Unknown").split("@")[0],
                    "email": reg.get("email", ""),
                    "date": formatted_date,
                    "created_at": created_at,
                    "amt": amt,
                    "checkedIn": checked_in,
                    "ticket": ticket_type,
                    "status": reg.get("status", "pending"),
                    "avatar_url": reg.get("avatar_url")
                }
                guests.append(guest)
        
        # 计算总页数
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        
        return {
            "success": True,
            "data": guests,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_more": page < total_pages
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get event guests failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get event guests failed: {str(e)}"
        )


@router.get("/events/{event_id}/guests/export")
async def export_event_guests(
    event_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    导出活动的所有注册用户（用于 CSV 导出）
    需要认证，只有活动主办方可以导出
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
        
        event_result = supabase.table("events_v1").select("host_id, ticket_config").eq("id", event_id).execute()
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event_host_id = event_result.data[0].get("host_id")
        if event_host_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="only event host can export guests list"
            )
        
        ticket_config = event_result.data[0].get("ticket_config", {})
        tickets_map = {}
        if ticket_config and ticket_config.get("tickets"):
            for ticket in ticket_config.get("tickets", []):
                ticket_id = str(ticket.get("id", ""))
                if ticket_id:
                    tickets_map[ticket_id] = ticket
        
        # 获取所有注册记录（不分页）
        registrations_result = supabase.table("event_registrations").select(
            "id, user_id, email, first_name, last_name, avatar_url, status, ticket_code, created_at, checked_in_at"
        ).eq("event_id", event_id).order("created_at", desc=True).execute()
        
        guests = []
        if registrations_result.data:
            for reg in registrations_result.data:
                created_at = reg.get("created_at", "")
                if created_at:
                    try:
                        from datetime import datetime
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        formatted_date = dt.strftime("%b %d, %I:%M %p")
                    except:
                        formatted_date = created_at
                else:
                    formatted_date = "N/A"
                
                ticket_code = reg.get("ticket_code")
                ticket_type = "General"
                amt = 0
                
                if ticket_code and ticket_code in tickets_map:
                    ticket_info = tickets_map[ticket_code]
                    ticket_type = ticket_info.get("name", "General")
                    if ticket_info.get("type") == "paid":
                        price = ticket_info.get("price", 0)
                        if isinstance(price, (int, float)):
                            amt = float(price)
                        elif isinstance(price, str):
                            try:
                                amt = float(price)
                            except:
                                amt = 0
                elif ticket_code:
                    ticket_type = str(ticket_code)
                
                checked_in = reg.get("checked_in_at") is not None
                
                guest = {
                    "id": reg.get("id"),
                    "name": f"{reg.get('first_name', '')} {reg.get('last_name', '')}".strip() or reg.get("email", "Unknown").split("@")[0],
                    "email": reg.get("email", ""),
                    "date": formatted_date,
                    "created_at": created_at,
                    "amt": amt,
                    "checkedIn": checked_in,
                    "ticket": ticket_type,
                    "status": reg.get("status", "pending"),
                    "avatar_url": reg.get("avatar_url")
                }
                guests.append(guest)
        
        return {
            "success": True,
            "data": guests
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"export event guests failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"export event guests failed: {str(e)}"
        )


@router.post("/events/{event_id}/resources")
async def upload_event_resource(
    event_id: str,
    file: UploadFile = File(...),
    require_registration: bool = Form(False),
    current_user: Dict = Depends(get_current_user)
):
    """
    上传活动资源文件到 R2
    需要认证，且用户必须是活动的创建者或联合主办方
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")
        
        event_result = supabase.table("events_v1").select("id, host_id, co_hosts").eq("id", event_id).single().execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="活动不存在"
            )
        
        event = event_result.data
        has_permission = False
        if event.get("host_id") == user_id:
            has_permission = True
        elif event.get("co_hosts"):
            co_hosts = event.get("co_hosts", [])
            if isinstance(co_hosts, list):
                for co_host in co_hosts:
                    if isinstance(co_host, dict) and co_host.get("id") == user_id:
                        has_permission = True
                        break
                    elif isinstance(co_host, str) and co_host == user_id:
                        has_permission = True
                        break
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="you don't have permission to upload resources for this event"
            )
        
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="file size cannot exceed 50MB"
            )
        
        file_ext = Path(file.filename).suffix if file.filename else ""
        r2_key = f"event-resources/{event_id}/{uuid.uuid4()}{file_ext}"
        
        r2_client = R2Client()
        file_obj = io.BytesIO(file_content)
        
        upload_success = r2_client.upload_fileobj(
            file_obj,
            r2_key,
            content_type=file.content_type
        )
        
        if not upload_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="文件上传失败"
            )
        
        file_url = r2_client.get_file_url(r2_key) if hasattr(r2_client, 'get_file_url') else f"https://{r2_client.account_id}.r2.cloudflarestorage.com/{r2_client.bucket_name}/{r2_key}"
        
        resource_data = {
            "event_id": event_id,
            "file_name": file.filename or "unknown",
            "file_size": file_size,
            "file_type": file.content_type or "application/octet-stream",
            "file_url": file_url,
            "r2_key": r2_key,
            "require_registration": require_registration,
            "uploaded_by": user_id
        }
        
        result = supabase.table("event_resources").insert(resource_data).execute()
        
        if not result.data:
            r2_client.delete_file(r2_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to save resource information"
            )
        
        return {
            "success": True,
            "data": result.data[0] if result.data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload event resource failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"upload event resource failed: {str(e)}"
        )


@router.get("/events/{event_id}/resources")
async def get_event_resources(
    event_id: str,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取活动的资源列表
    如果 require_registration=True，需要验证用户是否已注册
    活动主办方和联合主办方可以看到所有资源
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub") if current_user else None
        
        result = supabase.table("event_resources").select("*").eq("event_id", event_id).order("created_at", desc=True).execute()
        
        resources = result.data or []
        
        # 检查用户是否是活动主办方或联合主办方
        is_host_or_cohost = False
        if user_id:
            try:
                event_result = supabase.table("events_v1").select("host_id, co_hosts").eq("id", event_id).execute()
                if event_result.data:
                    event = event_result.data[0]
                    host_id = event.get("host_id")
                    co_hosts = event.get("co_hosts", [])
                    
                    # 检查是否是主办方
                    if host_id == user_id:
                        is_host_or_cohost = True
                    # 检查是否是联合主办方
                    elif co_hosts:
                        for co_host in co_hosts:
                            if isinstance(co_host, dict) and co_host.get("id") == user_id:
                                is_host_or_cohost = True
                                break
                            elif isinstance(co_host, str) and co_host == user_id:
                                is_host_or_cohost = True
                                break
            except Exception as e:
                logger.warning(f"check host permission failed: {str(e)}")
        
        # 如果是主办方或联合主办方，返回所有资源
        if is_host_or_cohost:
            return {
                "success": True,
                "data": resources
            }
        
        # 否则，根据注册状态过滤资源
        if user_id:
            registration_result = supabase.table("event_registrations").select("id").eq("event_id", event_id).eq("user_id", user_id).limit(1).execute()
            is_registered = len(registration_result.data or []) > 0
            
            filtered_resources = []
            for resource in resources:
                if resource.get("require_registration") and not is_registered:
                    continue
                filtered_resources.append(resource)
            resources = filtered_resources
        
        return {
            "success": True,
            "data": resources
        }
        
    except Exception as e:
        logger.error(f"Get event resources failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get event resources failed: {str(e)}"
        )


@router.delete("/events/{event_id}/resources/{resource_id}")
async def delete_event_resource(
    event_id: str,
    resource_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    删除活动资源
    需要认证，且用户必须是活动的创建者或联合主办方
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")
        
        resource_result = supabase.table("event_resources").select("*").eq("id", resource_id).eq("event_id", event_id).single().execute()
        
        if not resource_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="resource not found"
            )
        
        resource = resource_result.data
        
        event_result = supabase.table("events_v1").select("id, host_id, co_hosts").eq("id", event_id).single().execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event = event_result.data
        has_permission = False
        if event.get("host_id") == user_id:
            has_permission = True
        elif event.get("co_hosts"):
            co_hosts = event.get("co_hosts", [])
            if isinstance(co_hosts, list):
                for co_host in co_hosts:
                    if isinstance(co_host, dict) and co_host.get("id") == user_id:
                        has_permission = True
                        break
                    elif isinstance(co_host, str) and co_host == user_id:
                        has_permission = True
                        break
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="you don't have permission to delete this resource"
            )
        
        r2_key = resource.get("r2_key")
        if r2_key:
            r2_client = R2Client()
            r2_client.delete_file(r2_key)
        
        delete_result = supabase.table("event_resources").delete().eq("id", resource_id).execute()
        
        return {
            "success": True,
            "message": "resource deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete event resource failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"delete event resource failed: {str(e)}"
        )


@router.get("/events/{event_id}/gallery/photos")
async def get_gallery_photos(
    event_id: str,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    获取活动的相册图片列表
    """
    try:
        supabase = get_supabase()
        # 获取用户标识（已登录用户用 user_id，未登录用户用 None）
        user_identifier = current_user.get("sub") if current_user else None
        
        # 获取所有图片
        result = supabase.table("event_gallery_photos").select(
            "id, image_url, uploaded_by, likes_count, created_at"
        ).eq("event_id", event_id).order("created_at", desc=True).execute()
        
        photos = result.data or []
        
        # 如果用户已登录，检查哪些图片被该用户点赞
        user_liked_photo_ids = set()
        if user_identifier:
            photo_ids = [photo.get("id") for photo in photos]
            if photo_ids:
                likes_result = supabase.table("event_gallery_likes").select(
                    "photo_id"
                ).eq("user_identifier", user_identifier).in_("photo_id", photo_ids).execute()
                
                if likes_result.data:
                    user_liked_photo_ids = {like.get("photo_id") for like in likes_result.data}
        
        # 添加是否点赞的标记
        for photo in photos:
            photo["liked"] = photo.get("id") in user_liked_photo_ids
        
        return {
            "success": True,
            "data": photos
        }
        
    except Exception as e:
        logger.error(f"get gallery photos failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"get gallery photos failed: {str(e)}"
        )


@router.post("/events/{event_id}/gallery/photos")
async def upload_gallery_photo(
    event_id: str,
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user)
):
    """
    上传活动相册图片到 R2
    支持两种方式：
    1. 文件上传：通过 file 参数上传文件
    2. URL 上传：通过 image_url 参数提供图片 URL，后端会下载并上传到 R2
    需要认证，且用户必须是活动的创建者或联合主办方
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user is not logged in"
            )
        
        # 验证活动存在和权限
        event_result = supabase.table("events_v1").select("id, host_id, co_hosts").eq("id", event_id).single().execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event = event_result.data
        has_permission = False
        if event.get("host_id") == user_id:
            has_permission = True
        elif event.get("co_hosts"):
            co_hosts = event.get("co_hosts", [])
            if isinstance(co_hosts, list):
                for co_host in co_hosts:
                    if isinstance(co_host, dict) and co_host.get("id") == user_id:
                        has_permission = True
                        break
                    elif isinstance(co_host, str) and co_host == user_id:
                        has_permission = True
                        break
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="you don't have permission to upload photos for this event"
            )
        
        file_content = None
        content_type = None
        file_ext = ".jpg"
        
        # 处理文件上传
        if file:
            # 验证文件类型（只允许图片）
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="only image files are allowed"
                )
            
            file_content = await file.read()
            content_type = file.content_type
            file_ext = Path(file.filename).suffix if file.filename else ".jpg"
        
        # 处理 URL 上传
        elif image_url:
            try:
                import aiohttp
                import mimetypes
                
                # 验证 URL 格式
                from urllib.parse import urlparse
                parsed_url = urlparse(image_url)
                if not parsed_url.scheme or not parsed_url.netloc:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="invalid image URL"
                    )
                
                # 下载图片
                async with aiohttp.ClientSession() as session:
                    async with session.get(image_url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                        if response.status != 200:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"failed to download image from URL: HTTP {response.status}"
                            )
                        
                        # 验证内容类型
                        content_type = response.headers.get('Content-Type', '')
                        if not content_type.startswith('image/'):
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="URL does not point to an image file"
                            )
                        
                        file_content = await response.read()
                        
                        # 根据内容类型确定文件扩展名
                        ext = mimetypes.guess_extension(content_type)
                        if ext:
                            file_ext = ext
                        else:
                            # 从 URL 中提取扩展名
                            path = parsed_url.path
                            if '.' in path:
                                file_ext = Path(path).suffix
                            else:
                                file_ext = ".jpg"
                
            except aiohttp.ClientError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"failed to download image from URL: {str(e)}"
                )
            except Exception as e:
                logger.error(f"Error downloading image from URL: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"failed to process image URL: {str(e)}"
                )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="either file or image_url must be provided"
            )
        
        # 验证文件大小（10MB）
        file_size = len(file_content)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image size cannot exceed 10MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="image file is empty"
            )
        
        # 生成 R2 key
        r2_key = f"event-gallery/{event_id}/{uuid.uuid4()}{file_ext}"
        
        # 上传到 R2
        r2_client = R2Client()
        file_obj = io.BytesIO(file_content)
        
        upload_success = r2_client.upload_fileobj(
            file_obj,
            r2_key,
            content_type=content_type or "image/jpeg"
        )
        
        if not upload_success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="image upload failed"
            )
        
        # 获取图片 URL
        file_url = r2_client.get_file_url(r2_key) if hasattr(r2_client, 'get_file_url') else f"https://{r2_client.account_id}.r2.cloudflarestorage.com/{r2_client.bucket_name}/{r2_key}"
        
        # 保存到数据库
        photo_data = {
            "event_id": event_id,
            "image_url": file_url,
            "r2_key": r2_key,
            "uploaded_by": user_id,
            "likes_count": 0
        }
        
        result = supabase.table("event_gallery_photos").insert(photo_data).execute()
        
        if not result.data:
            r2_client.delete_file(r2_key)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to save photo information"
            )
        
        return {
            "success": True,
            "data": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"upload gallery photo failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"upload gallery photo failed: {str(e)}"
        )


@router.post("/events/gallery/photos/{photo_id}/like")
async def toggle_gallery_photo_like(
    photo_id: str,
    request: Request,
    current_user: Optional[Dict] = Depends(get_current_user_optional)
):
    """
    点赞/取消点赞相册图片
    支持匿名点赞（未登录用户也可以点赞）
    """
    try:
        supabase = get_supabase()
        
        # 获取用户标识：已登录用户用 user_id，未登录用户用 IP 地址
        if current_user and current_user.get("sub"):
            user_identifier = current_user.get("sub")
        else:
            # 未登录用户使用 IP 地址作为标识
            client_ip = request.client.host if request.client else None
            if not client_ip:
                # 尝试从 X-Forwarded-For 获取真实 IP
                forwarded_for = request.headers.get("X-Forwarded-For")
                if forwarded_for:
                    client_ip = forwarded_for.split(",")[0].strip()
                else:
                    client_ip = "anonymous"
            user_identifier = f"ip:{client_ip}"
        
        # 检查图片是否存在
        photo_result = supabase.table("event_gallery_photos").select(
            "id, likes_count"
        ).eq("id", photo_id).single().execute()
        
        if not photo_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="photo not found"
            )
        
        photo = photo_result.data
        current_likes = photo.get("likes_count", 0)
        
        # 检查是否已点赞
        like_result = supabase.table("event_gallery_likes").select(
            "id"
        ).eq("photo_id", photo_id).eq("user_identifier", user_identifier).execute()
        
        if like_result.data:
            # 已点赞，取消点赞
            supabase.table("event_gallery_likes").delete().eq("photo_id", photo_id).eq("user_identifier", user_identifier).execute()
            new_likes_count = max(0, current_likes - 1)
            supabase.table("event_gallery_photos").update({
                "likes_count": new_likes_count
            }).eq("id", photo_id).execute()
            
            return {
                "success": True,
                "data": {
                    "liked": False,
                    "likes_count": new_likes_count
                }
            }
        else:
            # 未点赞，添加点赞
            supabase.table("event_gallery_likes").insert({
                "photo_id": photo_id,
                "user_identifier": user_identifier
            }).execute()
            new_likes_count = current_likes + 1
            supabase.table("event_gallery_photos").update({
                "likes_count": new_likes_count
            }).eq("id", photo_id).execute()
            
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
        logger.error(f"toggle gallery photo like failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"toggle gallery photo like failed: {str(e)}"
        )


@router.delete("/events/gallery/photos/{photo_id}")
async def delete_gallery_photo(
    photo_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    删除相册图片
    需要认证，且用户必须是活动的创建者或联合主办方
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user is not logged in"
            )
        
        # 检查图片是否存在
        photo_result = supabase.table("event_gallery_photos").select(
            "id, event_id, r2_key"
        ).eq("id", photo_id).single().execute()
        
        if not photo_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="photo not found"
            )
        
        photo = photo_result.data
        event_id = photo.get("event_id")
        
        # 检查权限：用户必须是活动的创建者或联合主办方
        event_result = supabase.table("events_v1").select("id, host_id, co_hosts").eq("id", event_id).single().execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event = event_result.data
        has_permission = False
        if event.get("host_id") == user_id:
            has_permission = True
        elif event.get("co_hosts"):
            co_hosts = event.get("co_hosts", [])
            if isinstance(co_hosts, list):
                for co_host in co_hosts:
                    if isinstance(co_host, dict) and co_host.get("id") == user_id:
                        has_permission = True
                        break
                    elif isinstance(co_host, str) and co_host == user_id:
                        has_permission = True
                        break
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="you don't have permission to delete this photo"
            )
        
        # 删除 R2 文件
        r2_key = photo.get("r2_key")
        if r2_key:
            try:
                r2_client = R2Client()
                r2_client.delete_file(r2_key)
            except Exception as e:
                logger.warning(f"delete R2 file failed: {str(e)}")
        
        # 删除点赞记录
        try:
            supabase.table("event_gallery_likes").delete().eq("photo_id", photo_id).execute()
        except Exception as e:
            logger.warning(f"delete gallery likes failed: {str(e)}")
        
        # 删除图片记录
        delete_result = supabase.table("event_gallery_photos").delete().eq("id", photo_id).execute()
        
        return {
            "success": True,
            "message": "photo deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete gallery photo failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"delete gallery photo failed: {str(e)}"
        )


@router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    删除活动
    需要认证，且用户必须是活动的创建者
    同时会删除相关的注册记录、评论、资源、相册等
    """
    try:
        supabase = get_supabase()
        user_id = current_user.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user is not logged in"
            )
        
        # 检查活动是否存在
        event_result = supabase.table("events_v1").select("id, host_id").eq("id", event_id).single().execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        event = event_result.data
        event_host_id = event.get("host_id")
        
        # 检查权限：只有活动创建者可以删除
        if event_host_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="only event host can delete this event"
            )
        
        # 删除相关的数据（级联删除）
        # 注意：如果数据库有外键约束，可能需要先删除子表数据
        
        # 1. 删除活动注册记录
        try:
            supabase.table("event_registrations").delete().eq("event_id", event_id).execute()
        except Exception as e:
            logger.warning(f"delete event registrations failed: {str(e)}")
        
        # 2. 删除活动评论
        try:
            supabase.table("event_comments").delete().eq("event_id", event_id).execute()
        except Exception as e:
            logger.warning(f"delete event comments failed: {str(e)}")
        
        # 3. 删除活动资源（包括 R2 文件）
        try:
            resources_result = supabase.table("event_resources").select("r2_key").eq("event_id", event_id).execute()
            if resources_result.data:
                r2_client = R2Client()
                for resource in resources_result.data:
                    r2_key = resource.get("r2_key")
                    if r2_key:
                        try:
                            r2_client.delete_file(r2_key)
                        except Exception as e:
                            logger.warning(f"delete R2 file failed: {str(e)}")
                supabase.table("event_resources").delete().eq("event_id", event_id).execute()
        except Exception as e:
            logger.warning(f"delete event resources failed: {str(e)}")
        
        # 4. 删除活动相册（包括 R2 文件）
        try:
            photos_result = supabase.table("event_gallery_photos").select("r2_key").eq("event_id", event_id).execute()
            if photos_result.data:
                r2_client = R2Client()
                for photo in photos_result.data:
                    r2_key = photo.get("r2_key")
                    if r2_key:
                        try:
                            r2_client.delete_file(r2_key)
                        except Exception as e:
                            logger.warning(f"delete R2 photo failed: {str(e)}")
                # 删除点赞记录
                photo_ids = [photo.get("id") for photo in photos_result.data if photo.get("id")]
                if photo_ids:
                    supabase.table("event_gallery_likes").delete().in_("photo_id", photo_ids).execute()
                supabase.table("event_gallery_photos").delete().eq("event_id", event_id).execute()
        except Exception as e:
            logger.warning(f"delete event gallery failed: {str(e)}")
        
        # 5. 删除活动本身
        delete_result = supabase.table("events_v1").delete().eq("id", event_id).execute()
        
        if not delete_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="failed to delete event"
            )
        
        return {
            "success": True,
            "message": "event deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"delete event failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"delete event failed: {str(e)}"
        )


