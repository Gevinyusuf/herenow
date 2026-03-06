"""
社群路由
提供社群的 CRUD 操作
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import List, Dict, Any, Optional
from supabase import Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()


@router.post("/communities")
async def create_community(
    community_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    创建社群
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    try:
        supabase = get_supabase()
        logger.info(f"用户 {user_id} 创建社群: {community_data.get('name')}")

        # 检查 slug 是否已存在
        slug = community_data.get("slug", "").lower().replace(" ", "-")
        existing = supabase.table("communities").select("id").eq("slug", slug).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该 URL 已被使用，请选择其他名称"
            )

        # 创建社群
        community_result = supabase.table("communities").insert({
            "owner_id": user_id,
            "name": community_data.get("name"),
            "slug": slug,
            "description": community_data.get("description", ""),
            "logo_url": community_data.get("logo_url"),
            "cover_image_url": community_data.get("cover_image_url"),
            "settings": {
                "theme_color": community_data.get("theme_color", "#FF6B3D"),
                "privacy": community_data.get("privacy", "public"),
                "location_type": community_data.get("location_type", "global"),
                "location": community_data.get("location", ""),
                "city": community_data.get("city", ""),
                "invite_link": community_data.get("invite_link", True),
                "invite_email": community_data.get("invite_email", True)
            },
            "members_count": 1,  # 创建者自动成为成员
            "events_count": 0
        }).execute()

        if not community_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建社群失败"
            )

        community_id = community_result.data[0]["id"]

        # 创建者自动加入社群（作为 owner）
        member_result = supabase.table("community_members").insert({
            "user_id": user_id,
            "community_id": community_id,
            "role": "owner",
            "status": "active"
        }).execute()

        logger.info(f"✅ 社群创建成功: {community_id}")
        return {
            "success": True,
            "data": community_result.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 创建社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建社群失败: {str(e)}"
        )


@router.post("/communities/{community_id}/join")
async def join_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    加入社群
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    try:
        supabase = get_supabase()
        logger.info(f"用户 {user_id} 加入社群: {community_id}")

        # 检查是否已经是成员
        existing = supabase.table("community_members").select("*").eq("user_id", user_id).eq("community_id", community_id).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="你已经是该社群的成员"
            )

        # 加入社群
        member_result = supabase.table("community_members").insert({
            "user_id": user_id,
            "community_id": community_id,
            "role": "member",
            "status": "active"
        }).execute()

        if not member_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="加入社群失败"
            )

        logger.info(f"✅ 加入社群成功: {community_id}")
        return {
            "success": True,
            "message": "成功加入社群"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 加入社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"加入社群失败: {str(e)}"
        )


@router.post("/communities/{community_id}/leave")
async def leave_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    离开社群
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    try:
        supabase = get_supabase()
        logger.info(f"用户 {user_id} 离开社群: {community_id}")

        # 检查是否是成员
        existing = supabase.table("community_members").select("*").eq("user_id", user_id).eq("community_id", community_id).execute()
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="你不在该社群中"
            )

        # 检查是否是 owner（owner 不能离开，只能删除社群）
        if existing.data[0]["role"] == "owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="社群所有者不能离开社群，请删除社群"
            )

        # 离开社群（删除成员记录）
        supabase.table("community_members").delete().eq("user_id", user_id).eq("community_id", community_id).execute()

        logger.info(f"✅ 离开社群成功: {community_id}")
        return {
            "success": True,
            "message": "成功离开社群"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 离开社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"离开社群失败: {str(e)}"
        )


@router.put("/communities/{community_id}")
async def update_community(
    community_id: str,
    community_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    更新社群信息
    需要认证
    只有 owner 可以更新
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    try:
        supabase = get_supabase()
        logger.info(f"用户 {user_id} 更新社群: {community_id}")

        # 检查是否是 owner
        community = supabase.table("communities").select("*").eq("id", community_id).execute()
        if not community.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="社群不存在"
            )

        if community.data[0]["owner_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有社群所有者可以更新社群信息"
            )

        # 更新社群
        update_data = {}
        if "name" in community_data:
            update_data["name"] = community_data["name"]
        if "description" in community_data:
            update_data["description"] = community_data["description"]
        if "logo_url" in community_data:
            update_data["logo_url"] = community_data["logo_url"]
        if "cover_image_url" in community_data:
            update_data["cover_image_url"] = community_data["cover_image_url"]
        if "settings" in community_data:
            update_data["settings"] = community_data["settings"]

        result = supabase.table("communities").update(update_data).eq("id", community_id).execute()

        logger.info(f"✅ 更新社群成功: {community_id}")
        return {
            "success": True,
            "data": result.data[0] if result.data else community.data[0]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 更新社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新社群失败: {str(e)}"
        )


@router.delete("/communities/{community_id}")
async def delete_community(
    community_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    删除社群
    需要认证
    只有 owner 可以删除
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    try:
        supabase = get_supabase()
        logger.info(f"用户 {user_id} 删除社群: {community_id}")

        # 检查是否是 owner
        community = supabase.table("communities").select("*").eq("id", community_id).execute()
        if not community.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="社群不存在"
            )

        if community.data[0]["owner_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="只有社群所有者可以删除社群"
            )

        # 删除社群（会级联删除所有成员和活动）
        supabase.table("communities").delete().eq("id", community_id).execute()

        logger.info(f"✅ 删除社群成功: {community_id}")
        return {
            "success": True,
            "message": "社群已删除"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 删除社群失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除社群失败: {str(e)}"
        )


@router.get("/communities/{community_id}")
async def get_community_detail(
    community_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    获取社群详情
    不需要认证（公开社群）
    """
    try:
        supabase = get_supabase()
        logger.info(f"获取社群详情: {community_id}")

        # 调用数据库函数获取详情
        result = supabase.rpc('get_community_details', {'p_community_id': community_id}).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="社群不存在"
            )

        # 如果用户已登录，检查是否是成员
        is_member = False
        member_role = None
        if current_user:
            user_id = current_user.get("sub")
            if user_id:
                member_check = supabase.table("community_members").select("role").eq("user_id", user_id).eq("community_id", community_id).execute()
                if member_check.data:
                    is_member = True
                    member_role = member_check.data[0]["role"]

        community_detail = result.data[0]
        community_detail["is_member"] = is_member
        community_detail["member_role"] = member_role

        logger.info(f"✅ 获取社群详情成功: {community_id}")
        return {
            "success": True,
            "data": community_detail
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取社群详情失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取社群详情失败: {str(e)}"
        )
