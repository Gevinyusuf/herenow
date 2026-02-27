"""
AI 配额验证依赖
处理各种 AI 功能的配额验证和扣减
"""
import logging
from fastapi import Depends, HTTPException, status
from typing import Dict, Optional
from supabase import Client
from core.supabase_client import get_supabase_client
from core.auth.dependencies import get_current_user

logger = logging.getLogger(__name__)

# AI 功能类型到配额 Key 的映射
AI_QUOTA_MAPPING = {
    "text_generation": "quota_ai_text_generation",
    "image_generation": "quota_ai_image_generation",
    "chat": "quota_ai_chat",
    "planning": "quota_ai_planning",
    "import": "quota_ai_import",
}

# 默认配额 Key（向后兼容）
DEFAULT_AI_QUOTA_KEY = "quota_ai_generations"


async def verify_ai_quota_by_type(
    ai_type: str,
    current_user: Dict,
    supabase: Client
) -> bool:
    """
    根据 AI 功能类型验证并扣减配额（通用函数）
    
    Args:
        ai_type: AI 功能类型，可选值：
            - "text_generation": 文本生成
            - "image_generation": 图片生成
            - "chat": 对话聊天
            - "planning": 活动规划
            - "import": 事件导入
        current_user: 当前用户信息（从 JWT Token 解析）
        supabase: Supabase 客户端
        
    Returns:
        bool: 如果配额足够并成功扣减，返回 True
        
    Raises:
        HTTPException: 如果配额不足或类型无效，抛出相应错误
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    # 获取对应的配额 Key
    feature_key = AI_QUOTA_MAPPING.get(ai_type)
    if not feature_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid AI type: {ai_type}. Valid types: {list(AI_QUOTA_MAPPING.keys())}"
        )
    
    try:
        # 调用数据库 RPC 函数，原子性地检查并扣减配额
        response = supabase.rpc(
            'check_and_increment_quota',
            {
                'p_user_id': user_id,
                'p_feature_key': feature_key,
                'p_delta': 1
            }
        ).execute()
        
        # 如果返回 False，说明配额不足
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"AI {ai_type} quota exceeded. Please upgrade your plan."
            )
        
        return True
        
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        # 处理其他异常（如数据库连接错误等）
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify AI quota: {str(e)}"
        )


async def verify_ai_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """
    验证并扣减 AI 生成配额（默认/通用配额）
    这是一个依赖函数，会在路由处理函数执行前自动调用
    
    注意：此函数使用默认配额 Key，建议使用具体功能的配额验证函数
    
    Args:
        current_user: 当前用户信息（从 JWT Token 解析）
        supabase: Supabase 客户端
        
    Returns:
        bool: 如果配额足够并成功扣减，返回 True
        
    Raises:
        HTTPException: 如果配额不足，抛出 403 错误
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    try:
        # 调用数据库 RPC 函数，原子性地检查并扣减配额
        response = supabase.rpc(
            'check_and_increment_quota',
            {
                'p_user_id': user_id,
                'p_feature_key': DEFAULT_AI_QUOTA_KEY,
                'p_delta': 1
            }
        ).execute()
        
        # 如果返回 False，说明配额不足
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="AI generation quota exceeded. Please upgrade your plan."
            )
        
        return True
        
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        # 处理其他异常（如数据库连接错误等）
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify AI quota: {str(e)}"
        )


# 为每种 AI 功能创建专门的依赖函数

async def verify_ai_text_generation_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """验证并扣减文本生成配额"""
    return await verify_ai_quota_by_type("text_generation", current_user, supabase)


async def verify_ai_image_generation_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """验证并扣减图片生成配额"""
    return await verify_ai_quota_by_type("image_generation", current_user, supabase)


async def verify_ai_chat_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """验证并扣减对话聊天配额"""
    return await verify_ai_quota_by_type("chat", current_user, supabase)


async def verify_ai_planning_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """验证并扣减活动规划配额"""
    return await verify_ai_quota_by_type("planning", current_user, supabase)


async def verify_ai_import_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
) -> bool:
    """验证并扣减事件导入配额"""
    return await verify_ai_quota_by_type("import", current_user, supabase)


async def get_user_plan_id(
    user_id: str,
    supabase: Client
) -> Optional[str]:
    """
    获取用户当前订阅的套餐 ID
    
    从 subscriptions 表查询用户的活跃订阅
    
    Args:
        user_id: 用户 ID
        supabase: Supabase 客户端
        
    Returns:
        Optional[str]: 套餐 ID，如果用户没有套餐则返回 None
    """
    try:
        # 从 subscriptions 表查询（正确的表名）
        # 查询条件：user_id 匹配，status 为 'active'，按 created_at 降序排列，取第一条
        response = supabase.table("subscriptions").select("plan_id").eq("user_id", user_id).eq("status", "active").order("created_at", desc=True).limit(1).execute()
        
        if response.data and len(response.data) > 0:
            plan_id = response.data[0].get("plan_id")
            if plan_id:
                logger.debug(f"Found plan_id {plan_id} for user {user_id}")
                return plan_id
        
        logger.warning(f"No active subscription found for user {user_id}")
        return None
        
    except Exception as e:
        logger.error(f"Failed to get user plan for {user_id}: {str(e)}", exc_info=True)
        return None


async def get_ai_quota_info(
    user_id: str,
    supabase: Client,
    feature_key: str
) -> Optional[Dict]:
    """
    获取指定功能的配额信息（不扣减）
    从 plans 表的 limits 字段读取配额配置
    
    Args:
        user_id: 用户 ID
        supabase: Supabase 客户端
        feature_key: 配额功能 Key
        
    Returns:
        Optional[Dict]: 配额信息字典，格式：
        {
            "used": int,
            "total": int,
            "remaining": int
        }
        如果查询失败，返回 None
    """
    try:
        # 1. 获取用户当前套餐
        plan_id = await get_user_plan_id(user_id, supabase)
        
        if not plan_id:
            # 如果没有套餐，返回默认值（免费配额）
            logger.warning(f"User {user_id} has no active plan, using default quotas")
            return {
                "used": 0,
                "total": 0,  # 无套餐，无配额
                "remaining": 0
            }
        
        # 2. 从 plans 表读取套餐的 limits 配置
        plan_response = supabase.table("plans").select("limits").eq("id", plan_id).execute()
        
        if not plan_response.data or len(plan_response.data) == 0:
            logger.warning(f"Plan {plan_id} not found")
            return {
                "used": 0,
                "total": 0,
                "remaining": 0
            }
        
        limits = plan_response.data[0].get("limits", {})
        
        # 3. 从 limits JSONB 中读取对应功能的配额上限
        total = limits.get(feature_key, 0)
        
        # 如果 total 为 -1，表示无限配额
        if total == -1:
            return {
                "used": 0,
                "total": -1,
                "remaining": -1
            }
        
        # 4. 查询用户已使用的配额
        # 从 usages 表查询（正确的表名）
        used = 0
        try:
            usage_response = supabase.table("usages").select("count").eq("user_id", user_id).eq("feature_key", feature_key).execute()
            if usage_response.data and len(usage_response.data) > 0:
                used = usage_response.data[0].get("count", 0)
        except Exception as e:
            logger.warning(f"Failed to get usage from usages table: {str(e)}")
            # 如果查询失败，used 保持为 0
        
        # 计算剩余配额
        remaining = max(0, total - used) if total >= 0 else -1
        
        return {
            "used": used,
            "total": total,
            "remaining": remaining
        }
        
    except Exception as e:
        # 记录错误但不抛出异常，允许继续执行
        logger.error(f"Failed to get quota info for {feature_key}: {str(e)}", exc_info=True)
        # 返回默认值
        return {
            "used": 0,
            "total": -1,
            "remaining": -1
        }


async def get_all_ai_quotas(
    user_id: str,
    supabase: Client
) -> Dict[str, Dict]:
    """
    获取用户所有 AI 功能的配额信息
    
    Args:
        user_id: 用户 ID
        supabase: Supabase 客户端
        
    Returns:
        Dict[str, Dict]: 所有配额信息的字典，key 为 feature_key
    """
    quotas = {}
    
    # 查询所有 AI 相关的配额
    for ai_type, feature_key in AI_QUOTA_MAPPING.items():
        quota_info = await get_ai_quota_info(user_id, supabase, feature_key)
        if quota_info:
            quotas[feature_key] = quota_info
    
    return quotas

