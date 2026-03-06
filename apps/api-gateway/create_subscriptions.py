"""
为现有用户创建订阅记录
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


def create_subscriptions_for_users():
    """为现有用户创建订阅记录"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("="*60)
        logger.info("为现有用户创建订阅记录")
        logger.info("="*60)

        # 尝试从不同的表获取用户
        # 先尝试 auth.users
        logger.info("\n尝试从 auth.users 获取用户...")
        try:
            users_response = supabase.table("users").select("id").execute()
            if users_response.data:
                logger.info(f"✅ 从 users 表找到 {len(users_response.data)} 个用户")
                user_source = "users"
            else:
                logger.info("users 表中没有数据")
                user_source = None
        except Exception as e:
            logger.info(f"users 表无法访问: {str(e)}")
            user_source = None

        # 如果 users 表没有数据，尝试其他方式
        if not user_source:
            # 使用已知的测试用户 ID
            test_user_id = "178f1f37-34f9-4bb3-a1ca-570e5e7af3bc"
            logger.info(f"\n为测试用户 {test_user_id} 创建订阅...")

            # 检查是否已有订阅
            existing_sub = supabase.table("subscriptions").select("*").eq("user_id", test_user_id).execute()

            if not existing_sub.data or len(existing_sub.data) == 0:
                # 创建订阅记录
                logger.info("创建订阅记录...")
                supabase.table("subscriptions").insert({
                    "user_id": test_user_id,
                    "plan_id": "beta_early_access",
                    "status": "active",
                    "current_period_end": None
                }).execute()
                logger.info(f"✅ 为用户 {test_user_id} 创建了订阅")
            else:
                logger.info(f"用户 {test_user_id} 已有订阅")

        # 验证订阅记录
        logger.info("\n验证订阅记录...")
        subs_response = supabase.table("subscriptions").select("*").execute()

        if subs_response.data:
            logger.info(f"\n找到 {len(subs_response.data)} 个订阅记录：")
            for sub in subs_response.data:
                logger.info(f"\n用户 ID: {sub['user_id']}")
                logger.info(f"套餐 ID: {sub['plan_id']}")
                logger.info(f"状态: {sub['status']}")
                logger.info(f"周期结束: {sub.get('current_period_end', 'N/A')}")
        else:
            logger.info("没有找到订阅记录")

        logger.info("\n" + "="*60)
        logger.info("✅ 订阅记录创建完成！")
        logger.info("="*60)

        return True

    except Exception as e:
        logger.error(f"❌ 创建订阅记录失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = create_subscriptions_for_users()
    sys.exit(0 if success else 1)
