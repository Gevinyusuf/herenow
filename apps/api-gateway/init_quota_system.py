"""
执行配额系统初始化 SQL
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from supabase import create_client, Client
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def execute_sql_via_rpc(supabase: Client, sql: str):
    """通过 RPC 执行 SQL"""
    try:
        # 使用 Supabase 的 SQL 执行功能
        # 注意：这需要 service role key
        response = supabase.table("_").rpc("exec_sql", {"sql": sql}).execute()
        logger.info(f"SQL 执行成功: {sql[:100]}...")
        return True
    except Exception as e:
        logger.error(f"SQL 执行失败: {str(e)}")
        return False


def init_quota_system():
    """初始化配额系统"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("="*60)
        logger.info("初始化配额系统")
        logger.info("="*60)

        # 1. 更新 plans 表的配额配置
        logger.info("\n1. 更新 plans 表的配额配置...")

        # 更新 Free 套餐
        logger.info("更新 Free 套餐...")
        supabase.table("plans").update({
            "limits": {
                "quota_ai_text_generation": 10,
                "quota_ai_image_generation": 5,
                "quota_ai_chat": 20,
                "quota_ai_planning": 5,
                "quota_ai_import": 2,
                "feature_community": False,
                "feature_discover": False
            }
        }).eq("id", "free").execute()

        # 更新 Pro 套餐
        logger.info("更新 Pro 套餐...")
        supabase.table("plans").update({
            "limits": {
                "quota_ai_text_generation": 100,
                "quota_ai_image_generation": 50,
                "quota_ai_chat": 200,
                "quota_ai_planning": 50,
                "quota_ai_import": 20,
                "feature_community": True,
                "feature_discover": True
            }
        }).eq("id", "pro_monthly").execute()

        # 更新 Beta 套餐
        logger.info("更新 Beta 套餐...")
        supabase.table("plans").update({
            "limits": {
                "quota_ai_text_generation": 50,
                "quota_ai_image_generation": 25,
                "quota_ai_chat": 100,
                "quota_ai_planning": 25,
                "quota_ai_import": 10,
                "feature_community": False,
                "feature_discover": False
            }
        }).eq("id", "beta_early_access").execute()

        logger.info("✅ plans 表配额配置更新完成")

        # 2. 为现有用户创建订阅记录
        logger.info("\n2. 为现有用户创建订阅记录...")

        # 获取所有用户（从 profiles）
        users_response = supabase.table("profiles").select("id").execute()

        if users_response.data:
            logger.info(f"找到 {len(users_response.data)} 个用户")

            for user in users_response.data:
                user_id = user['id']
                logger.info(f"为用户 {user_id} 创建订阅...")

                # 检查是否已有订阅
                existing_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

                if not existing_sub.data:
                    # 创建订阅记录
                    supabase.table("subscriptions").insert({
                        "user_id": user_id,
                        "plan_id": "beta_early_access",
                        "status": "active",
                        "current_period_end": None
                    }).execute()
                    logger.info(f"✅ 为用户 {user_id} 创建了订阅")
                else:
                    logger.info(f"用户 {user_id} 已有订阅")

        logger.info("✅ 用户订阅记录创建完成")

        # 3. 验证配置
        logger.info("\n3. 验证配置...")

        # 查看套餐配置
        plans_response = supabase.table("plans").select("*").execute()
        logger.info("\n当前套餐配置：")
        for plan in plans_response.data:
            logger.info(f"\n套餐 ID: {plan['id']}")
            logger.info(f"套餐名称: {plan['name']}")
            logger.info(f"配额配置: {plan['limits']}")

        # 查看用户订阅
        subs_response = supabase.table("subscriptions").select("*").execute()
        logger.info(f"\n找到 {len(subs_response.data)} 个订阅记录")

        logger.info("\n" + "="*60)
        logger.info("✅ 配额系统初始化完成！")
        logger.info("="*60)

        return True

    except Exception as e:
        logger.error(f"❌ 初始化配额系统失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = init_quota_system()
    sys.exit(0 if success else 1)
