"""
活动创建和更新路由
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import Dict, Any, Optional
from pydantic import BaseModel, ValidationError
from datetime import datetime
from supabase import Client
import re
import json
import logging
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()


def generate_slug(title: str) -> str:
    """
    从标题生成友好的 URL slug
    例如: "Product Launch 2025" -> "product-launch-2025"
    """
    slug = title.lower()
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    if not slug:
        slug = f"event-{int(datetime.now().timestamp())}"
    return slug


class EventCreateRequest(BaseModel):
    """创建活动的请求模型"""
    eventName: str
    coverImage: str = ""
    startDate: str
    startTime: str
    endDate: str
    endTime: str
    location: str = ""
    locationCoordinates: Optional[Dict[str, Any]] = None
    description: str = ""
    tickets: list = []
    questions: list = []
    host: Dict[str, Any] = {}
    coHosts: list = []
    selectedTheme: Dict[str, Any] = {}
    selectedEffect: str = "none"
    selectedTimezone: Dict[str, Any] = {}
    visibility: str = "public"
    isVirtual: bool = False
    meetingLink: str = ""
    requireApproval: bool = False
    isLocationPublic: bool = False


@router.post("/events")
async def create_event(
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    创建新活动
    需要认证
    """
    # 手动解析请求体
    try:
        body = await request.json()
        event_data = EventCreateRequest(**body)
    except ValidationError as e:
        errors = []
        for error in e.errors():
            field = " -> ".join(str(x) for x in error.get("loc", []))
            message = error.get("msg", "验证失败")
            errors.append(f"{field}: {message}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"data validation failed: {', '.join(errors)}"
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="request body format error, need valid JSON"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"parse request failed: {str(e)}"
        )
    
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    # 验证必填字段
    if not event_data.eventName or not event_data.eventName.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="event name cannot be empty"
        )
    
    if not event_data.startDate or not event_data.startTime:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="please select event start time"
        )
    
    if not event_data.endDate or not event_data.endTime:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="please select event end time"
        )
    
    if not event_data.isVirtual and not event_data.location:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="please input event location or select virtual event"
        )
    
    if event_data.isVirtual and not event_data.meetingLink:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="virtual event needs to provide meeting link"
        )
    
    try:
        # 生成 slug
        slug = generate_slug(event_data.eventName)
        
        existing = supabase.table("events_v1").select("id").eq("slug", slug).execute()
        if existing.data:
            slug = f"{slug}-{int(datetime.now().timestamp())}"
        
        # 组合开始和结束时间
        start_time_str = event_data.startTime
        if len(start_time_str.split(":")) == 2:
            start_time_str = f"{start_time_str}:00"
        
        end_time_str = event_data.endTime
        if len(end_time_str.split(":")) == 2:
            end_time_str = f"{end_time_str}:00"
        
        start_datetime_str = f"{event_data.startDate}T{start_time_str}"
        end_datetime_str = f"{event_data.endDate}T{end_time_str}"
        
        timezone_str = event_data.selectedTimezone.get("id", "UTC")
        
        # 验证时间格式
        try:
            datetime.fromisoformat(start_datetime_str.replace("Z", "+00:00"))
            datetime.fromisoformat(end_datetime_str.replace("Z", "+00:00"))
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"time format error: {str(e)}"
            )
        
        # 构建 location_info JSONB
        if event_data.isVirtual:
            location_info = {
                "type": "virtual",
                "link": event_data.meetingLink
            }
        else:
            location_info = {
                "type": "offline",
                "name": event_data.location,
                "isPublic": event_data.isLocationPublic if hasattr(event_data, 'isLocationPublic') else False
            }
            
            # 添加坐标信息（如果有）
            if event_data.locationCoordinates:
                coords = event_data.locationCoordinates
                if isinstance(coords, dict):
                    # 提取坐标
                    if "lat" in coords and "lng" in coords:
                        location_info["coordinates"] = {
                            "lat": float(coords["lat"]),
                            "lng": float(coords["lng"])
                        }
                    # 提取 place_id
                    if "placeId" in coords and coords["placeId"]:
                        location_info["place_id"] = str(coords["placeId"])
        
        # 构建 style_config JSONB
        style_config = {
            "themeId": event_data.selectedTheme.get("id", ""),
            "effect": event_data.selectedEffect,
            "colors": {
                "bg": event_data.selectedTheme.get("bg", ""),
                "contentBg": event_data.selectedTheme.get("contentBg", ""),
                "text": event_data.selectedTheme.get("text", ""),
                "button": event_data.selectedTheme.get("button", "")
            }
        }
        
        # 构建 registration_fields JSONB
        registration_fields = [
            {
                "id": q.get("id", ""),
                "label": q.get("label", ""),
                "required": q.get("required", False),
                "fixed": q.get("fixed", False)
            }
            for q in event_data.questions
        ]
        
        # 构建 ticket_config JSONB
        ticket_config = {
            "tickets": [
                {
                    "id": t.get("id", ""),
                    "name": t.get("name", ""),
                    "type": t.get("type", "free"),
                    "price": t.get("price", ""),
                    "quantity": t.get("quantity", ""),
                    "requireApproval": t.get("requireApproval", False)
                }
                for t in event_data.tickets
            ]
        }
        
        co_hosts = event_data.coHosts if event_data.coHosts else []
        
        # 获取 host_id
        host_id = event_data.host.get("id")
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
        
        if not host_id or not uuid_pattern.match(str(host_id)):
            user_id = current_user.get("sub")
            if user_id:
                user_id_str = str(user_id)
                if uuid_pattern.match(user_id_str):
                    host_id = user_id_str
                else:
                    host_id = user_id_str
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="cannot determine event host. please ensure you are logged in, and the JWT token contains the user ID (sub field)."
                )
        
        if not host_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cannot determine event host, please ensure you are logged in or provide a valid host ID"
            )
        
        # 验证 host_id 是否存在于 profiles 表中
        try:
            profile_check = supabase.table("profiles").select("id").eq("id", host_id).execute()
            if not profile_check.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"host ID {host_id} does not exist in the system, please create a personal profile first"
                )
        except HTTPException:
            raise
        except Exception as profile_error:
            print(f"error checking profiles table (maybe table does not exist): {profile_error}")
        
        # 准备插入数据
        insert_data = {
            "title": event_data.eventName,
            "slug": slug,
            "description": event_data.description,
            "cover_image_url": event_data.coverImage,
            "start_at": start_datetime_str,
            "end_at": end_datetime_str,
            "timezone": timezone_str,
            "location_info": location_info,
            "visibility": event_data.visibility,
            "require_approval": event_data.requireApproval,
            "host_id": host_id,
            "style_config": style_config,
            "registration_fields": registration_fields,
            "ticket_config": ticket_config,
            "co_hosts": co_hosts
        }
        
        # 插入数据库
        try:
            result = supabase.table("events_v1").insert(insert_data).execute()
            
            if not result.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="create event failed, database did not return data"
                )
            
            created_event = result.data[0]
            
            return {
                "success": True,
                "data": {
                    "id": created_event["id"],
                    "slug": created_event["slug"],
                    "title": created_event["title"]
                }
            }
        except Exception as db_error:
            error_detail = str(db_error)
            error_type = type(db_error).__name__
            error_lower = error_detail.lower()
            
            if any(keyword in error_lower for keyword in ["foreign key", "violates foreign key constraint", "referenced", "does not exist"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"host ID {host_id} is invalid or does not exist, please ensure the user has created a personal profile (profiles table)"
                )
            
            if any(keyword in error_lower for keyword in ["unique", "duplicate", "already exists"]):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="event already exists, please use a different event name"
                )
            
            if any(keyword in error_lower for keyword in ["invalid input", "invalid syntax", "type uuid", "type timestamptz"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"data format error: {error_detail}"
                )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"database operation failed: {error_detail}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"create event failed: {e}\nerror trace: {error_trace}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"create event failed: {str(e)}"
        )


@router.patch("/events/{event_id}")
async def update_event(
    event_id: str,
    request: Request,
    current_user: Dict = Depends(get_current_user)
):
    """
    通用更新活动信息接口
    支持更新多个字段：description, co_hosts, title, cover_image_url 等
    需要认证，且只能更新自己创建的活动
    """
    try:
        supabase = get_supabase()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"database connection failed: {str(e)}"
        )
    
    try:
        # check if event exists
        event_result = supabase.table("events_v1").select("id, host_id").eq("id", event_id).execute()
        
        if not event_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="event not found"
            )
        
        # check if user is event host
        event_data = event_result.data[0]
        user_id = current_user.get("sub")
        if event_data.get("host_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="no permission to update this event"
            )
        
        # parse request body
        body = await request.json()
        
        # define allowed fields list
        allowed_fields = {
            "description": str,
            "title": str,
            "cover_image_url": str,
            "co_hosts": list,
            "location_info": dict,
            "style_config": dict,
            "ticket_config": dict,
            "registration_fields": list,
            "visibility": str,
            "meeting_link": str,
            "is_location_public": bool,
            "start_at": str,  
            "end_at": str,   
            "timezone": str,
        }
        
        # build update data
        update_data = {}
        
        for field, field_type in allowed_fields.items():
            if field in body:
                value = body[field]
                
                # type validation
                if not isinstance(value, field_type):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"field {field} has incorrect type, expected {field_type.__name__}"
                    )
                
                # special handling for location_info: ensure coordinates are properly formatted
                if field == "location_info" and isinstance(value, dict):
                    # 如果包含 coordinates，确保格式正确
                    if "coordinates" in value:
                        coords = value["coordinates"]
                        if isinstance(coords, dict) and "lat" in coords and "lng" in coords:
                            # 确保坐标是数字类型
                            value["coordinates"] = {
                                "lat": float(coords["lat"]),
                                "lng": float(coords["lng"])
                            }
                
                # special handling for co_hosts
                if field == "co_hosts":
                    if not isinstance(value, list):
                        raise HTTPException(
                            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="co_hosts must be an array"
                        )
                    for co_host in value:
                        if not isinstance(co_host, dict):
                            raise HTTPException(
                                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="each element of co_hosts must be a dictionary"
                            )
                        has_id = "id" in co_host
                        has_name_email = "name" in co_host and "email" in co_host
                        
                        if not (has_id or has_name_email):
                            raise HTTPException(
                                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                detail="each element of co_hosts must contain either 'id' field or both 'name' and 'email' fields"
                            )
                
                if field_type == str and value == "":
                    update_data[field] = value
                elif value is not None:
                    update_data[field] = value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="no fields to update, or fields not in allowed list"
            )
        
        # update event
        result = supabase.table("events_v1").update(update_data).eq("id", event_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="更新活动失败"
            )
        
        # return updated event data
        updated_event = result.data[0]
        host_id = updated_event.get("host_id")
        
        # query host info
        host_info = None
        if host_id:
            try:
                profile_result = supabase.table("profiles").select(
                    "id, full_name, email, avatar_url"
                ).eq("id", host_id).execute()
                
                if profile_result.data:
                    host_info = profile_result.data[0]
            except Exception as e:
                logger.warning(f"query host info failed: {str(e)}")
        
        # query co-hosts info
        co_hosts_info = []
        co_hosts = updated_event.get("co_hosts", [])
        if co_hosts:
            try:
                # 过滤掉非 UUID 格式的 id（如临时 id）
                import uuid
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
                logger.warning(f"query co-hosts info failed: {str(e)}")
        
        updated_event["host"] = host_info
        updated_event["co_hosts_info"] = co_hosts_info
        
        return {
            "success": True,
            "data": updated_event,
            "message": "event updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update event failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"update event failed: {str(e)}"
        )

