"""
社群帖子路由
提供帖子的 CRUD 操作、点赞、评论等功能
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


class PostCreate(BaseModel):
    content: str
    images: List[str] = []


class CommentCreate(BaseModel):
    content: str


class PostUpdate(BaseModel):
    content: Optional[str] = None
    images: Optional[List[str]] = None


def check_permission(
    community_id: str, 
    user_id: str, 
    required_role: str = "member"
) -> tuple:
    """
    检查用户在社群中的权限
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
    if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
        return False, f"权限不足，需要 {required_role} 或更高权限", user_role
    
    return True, None, user_role


@router.get("/communities/{community_id}/posts")
async def get_posts(
    community_id: str,
    sort: str = "recent",
    page: int = 1,
    limit: int = 20,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    获取社群帖子列表
    需要是社群成员
    """
    user_id = current_user.get("sub") if current_user else None
    
    has_perm, error, _ = check_permission(community_id, user_id, "member")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        offset = (page - 1) * limit
        
        result = supabase.rpc(
            'get_community_posts',
            {
                'p_community_id': community_id,
                'p_user_id': user_id,
                'p_sort': sort,
                'p_limit': limit,
                'p_offset': offset
            }
        ).execute()
        
        return {
            "success": True,
            "data": {
                "posts": result.data if result.data else [],
                "page": page,
                "limit": limit
            }
        }
    except Exception as e:
        logger.error(f"获取帖子列表失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取帖子列表失败: {str(e)}"
        )


@router.post("/communities/{community_id}/posts")
async def create_post(
    community_id: str,
    post_data: PostCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    创建帖子
    需要是社群成员
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "member")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    if len(post_data.content) < 10:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="帖子内容至少需要10个字符")
    
    try:
        supabase = get_supabase()
        
        result = supabase.table("community_posts").insert({
            "community_id": community_id,
            "author_id": user_id,
            "content": post_data.content,
            "images": post_data.images
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="创建帖子失败")
        
        logger.info(f"✅ 创建帖子成功: {result.data[0]['id']}")
        return {
            "success": True,
            "data": result.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建帖子失败: {str(e)}"
        )


@router.get("/communities/{community_id}/posts/{post_id}")
async def get_post_detail(
    community_id: str,
    post_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    获取帖子详情（含评论）
    需要是社群成员
    """
    user_id = current_user.get("sub") if current_user else None
    
    has_perm, error, _ = check_permission(community_id, user_id, "member")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        post_result = supabase.table("community_posts").select("""
            *,
            author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url)
        """).eq("id", post_id).eq("community_id", community_id).is_("parent_id", "null").execute()
        
        if not post_result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="帖子不存在")
        
        post = post_result.data[0]
        
        comments_result = supabase.rpc(
            'get_post_comments',
            {
                'p_post_id': post_id,
                'p_user_id': user_id,
                'p_limit': 100,
                'p_offset': 0
            }
        ).execute()
        
        post["comments"] = comments_result.data if comments_result.data else []
        
        if user_id:
            like_check = supabase.table("community_post_likes").select("id").eq(
                "post_id", post_id
            ).eq("user_id", user_id).execute()
            post["is_liked"] = bool(like_check.data)
            post["is_owner"] = post["author_id"] == user_id
        else:
            post["is_liked"] = False
            post["is_owner"] = False
        
        return {
            "success": True,
            "data": post
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取帖子详情失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取帖子详情失败: {str(e)}"
        )


@router.put("/communities/{community_id}/posts/{post_id}")
async def update_post(
    community_id: str,
    post_id: str,
    post_data: PostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    更新帖子
    只有作者可以更新
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    try:
        supabase = get_supabase()
        
        post = supabase.table("community_posts").select("author_id").eq("id", post_id).eq("community_id", community_id).execute()
        
        if not post.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="帖子不存在")
        
        if post.data[0]["author_id"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有作者可以编辑帖子")
        
        update_data = {}
        if post_data.content is not None:
            if len(post_data.content) < 10:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="帖子内容至少需要10个字符")
            update_data["content"] = post_data.content
        if post_data.images is not None:
            update_data["images"] = post_data.images
        
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="没有有效的更新字段")
        
        result = supabase.table("community_posts").update(update_data).eq("id", post_id).execute()
        
        logger.info(f"✅ 更新帖子成功: {post_id}")
        return {
            "success": True,
            "data": result.data[0] if result.data else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新帖子失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/posts/{post_id}")
async def delete_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    删除帖子
    作者或管理员可以删除
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    try:
        supabase = get_supabase()
        
        post = supabase.table("community_posts").select("author_id").eq("id", post_id).eq("community_id", community_id).execute()
        
        if not post.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="帖子不存在")
        
        is_author = post.data[0]["author_id"] == user_id
        
        if not is_author:
            has_perm, error, user_role = check_permission(community_id, user_id, "admin")
            if not has_perm:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="只有作者或管理员可以删除帖子")
        
        supabase.table("community_posts").delete().eq("id", post_id).execute()
        
        logger.info(f"✅ 删除帖子成功: {post_id}")
        return {
            "success": True,
            "message": "帖子已删除"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除帖子失败: {str(e)}"
        )


@router.post("/communities/{community_id}/posts/{post_id}/comments")
async def create_comment(
    community_id: str,
    post_id: str,
    comment_data: CommentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    评论帖子
    需要是社群成员
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "member")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    if len(comment_data.content) < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="评论内容不能为空")
    
    try:
        supabase = get_supabase()
        
        post = supabase.table("community_posts").select("id, is_locked").eq("id", post_id).eq("community_id", community_id).is_("parent_id", "null").execute()
        
        if not post.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="帖子不存在")
        
        if post.data[0]["is_locked"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该帖子已锁定，无法评论")
        
        result = supabase.table("community_posts").insert({
            "community_id": community_id,
            "author_id": user_id,
            "parent_id": post_id,
            "content": comment_data.content
        }).execute()
        
        if not result.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="创建评论失败")
        
        logger.info(f"✅ 创建评论成功: {result.data[0]['id']}")
        return {
            "success": True,
            "data": result.data[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建评论失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建评论失败: {str(e)}"
        )


@router.post("/communities/{community_id}/posts/{post_id}/like")
async def like_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    点赞帖子
    需要是社群成员
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "member")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        existing = supabase.table("community_post_likes").select("id").eq("post_id", post_id).eq("user_id", user_id).execute()
        
        if existing.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="你已经点赞过了")
        
        result = supabase.table("community_post_likes").insert({
            "post_id": post_id,
            "user_id": user_id
        }).execute()
        
        logger.info(f"✅ 点赞成功: post={post_id}, user={user_id}")
        return {
            "success": True,
            "message": "点赞成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"点赞失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"点赞失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/posts/{post_id}/like")
async def unlike_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    取消点赞
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_post_likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
        
        logger.info(f"✅ 取消点赞成功: post={post_id}, user={user_id}")
        return {
            "success": True,
            "message": "取消点赞成功"
        }
    except Exception as e:
        logger.error(f"取消点赞失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取消点赞失败: {str(e)}"
        )


@router.post("/communities/{community_id}/posts/{post_id}/pin")
async def pin_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    置顶帖子
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "admin")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_posts").update({"is_pinned": True}).eq("id", post_id).execute()
        
        logger.info(f"✅ 置顶帖子成功: {post_id}")
        return {
            "success": True,
            "message": "帖子已置顶"
        }
    except Exception as e:
        logger.error(f"置顶帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"置顶帖子失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/posts/{post_id}/pin")
async def unpin_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    取消置顶
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "admin")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_posts").update({"is_pinned": False}).eq("id", post_id).execute()
        
        logger.info(f"✅ 取消置顶成功: {post_id}")
        return {
            "success": True,
            "message": "已取消置顶"
        }
    except Exception as e:
        logger.error(f"取消置顶失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"取消置顶失败: {str(e)}"
        )


@router.post("/communities/{community_id}/posts/{post_id}/lock")
async def lock_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    锁定帖子（禁止评论）
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "admin")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_posts").update({"is_locked": True}).eq("id", post_id).execute()
        
        logger.info(f"✅ 锁定帖子成功: {post_id}")
        return {
            "success": True,
            "message": "帖子已锁定"
        }
    except Exception as e:
        logger.error(f"锁定帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"锁定帖子失败: {str(e)}"
        )


@router.delete("/communities/{community_id}/posts/{post_id}/lock")
async def unlock_post(
    community_id: str,
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    解锁帖子
    需要管理员权限
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户信息无效")
    
    has_perm, error, _ = check_permission(community_id, user_id, "admin")
    if not has_perm:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
    
    try:
        supabase = get_supabase()
        
        supabase.table("community_posts").update({"is_locked": False}).eq("id", post_id).execute()
        
        logger.info(f"✅ 解锁帖子成功: {post_id}")
        return {
            "success": True,
            "message": "帖子已解锁"
        }
    except Exception as e:
        logger.error(f"解锁帖子失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"解锁帖子失败: {str(e)}"
        )
