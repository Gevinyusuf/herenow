"""
社群成员管理路由
提供成员列表、角色管理、移除成员等功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import List, Dict, Any, Optional
from supabase import Client
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_supabase() -> Client:
    return get_supabase_client()


class RoleUpdate(BaseModel):
    role: str


def check_admin_permission(community_id: str, user_id: str) -> tuple:
    """
    检查用户是否有管理员权限
    返回: (has_permission, error_message, user_role)
    """
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


@router.get("/communities/{community_id}/members")
async def get_members(
    community_id: str,
    role: Optional[str] = None,
    status: Optional[str] = "active",
    page: int = 1,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    获取社群成员列表
    需要是社群成员
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    supabase = get_supabase()
    
    member_check = supabase.table("community_members").select("role").eq(
        "community_id", community_id
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="你不是该社群的成员")
    
    try:
        offset = (page - 1) * limit
        
        result = supabase.rpc(
            'get_community_members',
            {
                'p_community_id': community_id,
                'p_role': role,
                'p_status': status,
                'p_limit': limit,
                'p_offset': offset
            }
        ).execute()
        
        count_result = supabase.table("community_members").select("id", count="exact").eq(
            "community_id", community_id
        )
        if status:
            count_result = count_result.eq("status", status)
        if role:
            count_result = count_result.eq("role", role)
        count_result = count_result.execute()
        
        total = count_result.count if hasattr(count_result, 'count') else len(result.data) if result.data else 0
        
        return {
            "success": True,
            "data": {
                "members": result.data if result.data else [],
                "total": total,
                "page": page,
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"获取成员列表失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取成员列表失败: {str(e)}"
        )


@router.put("/communities/{community_id}/members/{target_user_id}/role")
async def update_member_role(
    community_id: str,
    target_user_id: str,
    role_data: RoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    更新成员角色
    需要 owner 权限才能设置 admin
    需要 admin 权限才能设置 member
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    valid_roles = ["member", "admin", "owner"]
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"无效的角色，有效值: {valid_roles}")
    
    supabase = get_supabase()
    
    has_perm, error, user_role = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    if role_data.role == "owner" and user_role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有所有者可以设置新的所有者")
    
    if role_data.role == "admin" and user_role not in ["owner", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有所有者或管理员可以设置管理员")
    
    if target_user_id == user_id and role_data.role != "owner":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能修改自己的角色")
    
    try:
        target_member = supabase.table("community_members").select("role").eq(
            "community_id", community_id
        ).eq("user_id", target_user_id).execute()
        
        if not target_member.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="该用户不是社群成员")
        
        result = supabase.table("community_members").update({
            "role": role_data.role
        }).eq("community_id", community_id).eq("user_id", target_user_id).execute()
        
        logger.info(f"✅ 更新成员角色成功: community={community_id}, user={target_user_id}, role={role_data.role}")
        return {
            "success": True,
            "message": f"角色已更新为 {role_data.role}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新成员角色失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新成员角色失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/members/{target_user_id}")
async def remove_member(
    community_id: str,
    target_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    移除成员
    需要 admin 权限
    owner 不能被移除
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    supabase = get_supabase()
    
    has_perm, error, user_role = check_admin_permission(community_id, user_id)
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    if target_user_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能移除自己，请使用离开功能")
    
    try:
        target_member = supabase.table("community_members").select("role").eq(
            "community_id", community_id
        ).eq("user_id", target_user_id).execute()
        
        if not target_member.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="该用户不是社群成员")
        
        if target_member.data[0]["role"] == "owner":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不能移除社群所有者")
        
        supabase.table("community_members").delete().eq(
            "community_id", community_id
        ).eq("user_id", target_user_id).execute()
        
        logger.info(f"✅ 移除成员成功: community={community_id}, user={target_user_id}")
        return {
            "success": True,
            "message": "成员已移除"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"移除成员失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"移除成员失败: {str(e)}"
        )


@router.post("/communities/{community_id}/transfer-ownership")
async def transfer_ownership(
    community_id: str,
    data: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    转让社群所有权
    只有 owner 可以操作
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    new_owner_id = data.get("new_owner_id")
    if not new_owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请指定新的所有者")
    
    supabase = get_supabase()
    
    community = supabase.table("communities").select("owner_id").eq("id", community_id).execute()
    if not community.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="社群不存在")
    
    if community.data[0]["owner_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有所有者可以转让社群")
    
    try:
        new_owner_member = supabase.table("community_members").select("role, status").eq(
            "community_id", community_id
        ).eq("user_id", new_owner_id).execute()
        
        if not new_owner_member.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="新所有者必须是社群成员")
        
        if new_owner_member.data[0]["status"] != "active":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="新所有者状态异常")
        
        supabase.table("community_members").update({"role": "owner"}).eq(
            "community_id", community_id
        ).eq("user_id", new_owner_id).execute()
        
        supabase.table("community_members").update({"role": "admin"}).eq(
            "community_id", community_id
        ).eq("user_id", user_id).execute()
        
        supabase.table("communities").update({"owner_id": new_owner_id}).eq("id", community_id).execute()
        
        logger.info(f"✅ 转让所有权成功: community={community_id}, new_owner={new_owner_id}")
        return {
            "success": True,
            "message": "社群所有权已转让"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"转让所有权失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"转让所有权失败: {str(e)}"
        )


@router.get("/communities/search")
async def search_communities(
    q: str = "",
    location: str = "",
    sort: str = "members",
    page: int = 1,
    limit: int = 20,
    current_user: Optional[dict] = Depends(get_current_user)
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
        
        return {
            "success": True,
            "data": {
                "communities": result.data if result.data else [],
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


@router.put("/communities/{community_id}/profile")
async def update_member_profile(
    community_id: str,
    profile_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    更新用户在社群中的个人资料
    设置昵称、简介等
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    supabase = get_supabase()
    
    member_check = supabase.table("community_members").select("id").eq(
        "community_id", community_id
    ).eq("user_id", user_id).execute()
    
    if not member_check.data:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="你不是该社群的成员")
    
    allowed_fields = ["nickname", "bio", "muted"]
    update_data = {}
    for field in allowed_fields:
        if field in profile_data:
            update_data[field] = profile_data[field]
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="没有有效的更新字段")
    
    try:
        result = supabase.table("community_members").update(update_data).eq(
            "community_id", community_id
        ).eq("user_id", user_id).execute()
        
        logger.info(f"✅ 更新社群个人资料成功: community={community_id}, user={user_id}")
        return {
            "success": True,
            "message": "个人资料已更新"
        }
    except Exception as e:
        logger.error(f"更新社群个人资料失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新社群个人资料失败: {str(e)}"
        )
