"""
Data models for user service
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserProfile(BaseModel):
    """用户资料模型"""
    id: str
    full_name: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None

class UserProfileUpdate(BaseModel):
    """用户资料更新模型"""
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserEvent(BaseModel):
    """用户活动模型"""
    id: str
    title: str
    slug: str
    cover_image_url: Optional[str] = None
    start_at: str
    end_at: str
    timezone: str
    location_info: Optional[dict] = None
    visibility: str
    is_created: bool = False
    is_registered: bool = False
    registration_count: int = 0

class UserCommunity(BaseModel):
    """用户社群模型"""
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    member_count: int = 0
    is_joined: bool = False
    is_owner: bool = False

class UserEventsResponse(BaseModel):
    """用户活动列表响应"""
    events: List[UserEvent]
    total: int

class UserCommunitiesResponse(BaseModel):
    """用户社群列表响应"""
    communities: List[UserCommunity]
    total: int
