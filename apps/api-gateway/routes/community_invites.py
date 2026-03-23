"""
社群搜索和邀请路由
提供社群搜索、邀请链接、邮件邀请等功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import List, Dict, Any, Optional
from supabase import Client
from pydantic import BaseModel
import logging
import secrets
import uuid
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()


def get_supabase() -> Client:
    return get_supabase_client()


class InviteLinkCreate(BaseModel):
    expires_in_days: int = 7


class EmailInviteCreate(BaseModel):
    emails: List[str]


def check_admin_permission(community_id: str, user_id: str) -> tuple:
    """检查管理员权限"""
    role_hierarchy = {"member": 1, "admin": 2, "owner": 3}
    
    supabase = get_supabase()
    member = supabase.table("community_members").select("role, status").eq(
        "community_id", community_id
    ).eq("user_id", user_id).execute()
    
    if not member.data:
        return False, "你不是该社群的成员", None
    
    if member.data[0]["status"] != "active":
        return False, "你的成员状态异常", None
    
    user_role = member.data[0]["role"]
    if role_hierarchy.get(user_role, 0) < 2:
        return False, "权限不足，需要管理员权限", user_role
    
    return True, None, user_role


@router.get("/communities/search")
async def search_communities(
    q: str = "",
    location: str = "",
    sort: str = "members",
    page: int = 1,
    limit: int = 20
):
    """
    搜索社群
    公开接口，不需要认证
    """
    try:
        supabase = get_supabase()
        offset = (page - 1) * limit
        
        result = supabase.rpc(
            'search_communities',
            {
                'p_query': q,
                'p_location': location,
                'p_sort': sort,
                'p_limit': limit,
                'p_offset': offset
            }
        ).execute()
        
        count_query = supabase.table("communities").select("id", count="exact")
        if q:
            count_query = count_query.or_(f"name.ilike.%{q}%,description.ilike.%{q}%")
        count_result = count_query.execute()
        
        return {
            "success": True,
            "data": {
                "communities": result.data if result.data else [],
                "total": count_result.count if hasattr(count_result, 'count') else 0,
                "page": page,
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"搜索社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"搜索社群失败: {str(e)}"
        )


@router.post("/communities/{community_id}/invites/link")
async def create_invite_link(
    community_id: str,
    invite_data: InviteLinkCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    创建邀请链接
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        invite_code = secrets.token_urlsafe(8)
        expires_at = datetime.utcnow() + timedelta(days=invite_data.expires_in_days)
        
        result = supabase.table("community_invites").insert({
            "community_id": community_id,
            "inviter_id": user_id,
            "invite_type": "link",
            "invite_code": invite_code,
            "expires_at": expires_at.isoformat()
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="创建邀请链接失败")
        
        invite_url = f"https://herenow.com/invite/{invite_code}"
        
        logger.info(f"✅ 创建邀请链接成功: community={community_id}, code={invite_code}")
        return {
            "success": True,
            "data": {
                "invite_code": invite_code,
                "invite_url": invite_url,
                "expires_at": expires_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建邀请链接失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建邀请链接失败: {str(e)}"
        )


@router.post("/communities/{community_id}/invites/email")
async def send_email_invites(
    community_id: str,
    invite_data: EmailInviteCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    发送邮件邀请
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    if len(invite_data.emails) > 50:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="一次最多邀请50人")
    
    try:
        supabase = get_supabase()
        
        community = supabase.table("communities").select("name").eq("id", community_id).execute()
        if not community.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="社群不存在")
        
        community_name = community.data[0]["name"]
        
        invites_to_create = []
        for email in invite_data.emails:
            invites_to_create.append({
                "community_id": community_id,
                "inviter_id": user_id,
                "invite_type": "email",
                "invite_email": email.lower(),
                "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
            })
        
        result = supabase.table("community_invites").insert(invites_to_create).execute()
        
        logger.info(f"✅ 发送邮件邀请成功: community={community_id}, count={len(invite_data.emails)}")
        return {
            "success": True,
            "message": f"已发送 {len(invite_data.emails)} 封邀请邮件"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送邮件邀请失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"发送邮件邀请失败: {str(e)}"
        )


@router.get("/communities/{community_id}/invites")
async def get_invites(
    community_id: str,
    status: str = "pending",
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    获取邀请列表
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        offset = (page - 1) * limit
        
        result = supabase.table("community_invites").select("""
            *,
            inviter:profiles!community_invites_inviter_id_fkey(id, full_name, avatar_url)
        """).eq("community_id", community_id).eq("status", status).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "success": True,
            "data": {
                "invites": result.data if result.data else [],
                "page": page,
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"获取邀请列表失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邀请列表失败: {str(e)}"
        )


@router.post("/communities/join-by-invite")
async def join_by_invite(
    data: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    通过邀请加入社群
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    invite_code = data.get("invite_code")
    if not invite_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请提供邀请码")
    
    try:
        supabase = get_supabase()
        
        invite = supabase.table("community_invites").select("*").eq("invite_code", invite_code).execute()
        
        if not invite.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请码无效")
        
        invite_record = invite.data[0]
        
        if invite_record["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已使用或已过期")
        
        if invite_record["expires_at"]:
            expires_at = datetime.fromisoformat(invite_record["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                supabase.table("community_invites").update({"status": "expired"}).eq("id", invite_record["id"]).execute()
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已过期")
        
        community_id = invite_record["community_id"]
        
        existing_member = supabase.table("community_members").select("id").eq(
            "community_id", community_id
        ).eq("user_id", user_id).execute()
        
        if existing_member.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="你已经是该社群的成员")
        
        member_result = supabase.table("community_members").insert({
            "user_id": user_id,
            "community_id": community_id,
            "role": "member",
            "status": "active"
        }).execute()
        
        if not member_result.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="加入社群失败")
        
        supabase.table("community_invites").update({
            "status": "accepted",
            "used_by": user_id
        }).eq("id", invite_record["id"]).execute()
        
        community = supabase.table("communities").select("id, name, slug").eq("id", community_id).execute()
        
        logger.info(f"✅ 通过邀请加入社群成功: community={community_id}, user={user_id}")
        return {
            "success": True,
            "message": "成功加入社群",
            "data": community.data[0] if community.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"通过邀请加入社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"通过邀请加入社群失败: {str(e)}"
        )


@router.get("/invites/{invite_code}/info")
async def get_invite_info(invite_code: str):
    """
    获取邀请信息
    公开接口，用于显示邀请预览
    """
    try:
        supabase = get_supabase()
        
        invite = supabase.table("community_invites").select("""
            *,
            community:communities(id, name, description, logo_url, members_count)
        """).eq("invite_code", invite_code).execute()
        
        if not invite.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请码无效")
        
        invite_record = invite.data[0]
        
        if invite_record["status"] != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已使用或已过期")
        
        if invite_record["expires_at"]:
            expires_at = datetime.fromisoformat(invite_record["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow() > expires_at.replace(tzinfo=None):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="邀请码已过期")
        
        return {
            "success": True,
            "data": {
                "community": invite_record["community"],
                "expires_at": invite_record["expires_at"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取邀请信息失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取邀请信息失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/invites/{invite_id}")
async def revoke_invite(
    community_id: str,
    invite_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    撤销邀请
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_invites").delete().eq("id", invite_id).eq("community_id", community_id).execute()
        
        logger.info(f"✅ 撤销邀请成功: invite={invite_id}")
        return {
            "success": True,
            "message": "邀请已撤销"
        }
    except Exception as e:
        logger.error(f"撤销邀请失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"撤销邀请失败: {str(e)}"
        )
