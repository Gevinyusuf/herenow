"""
查看 auth.users 表中的用户
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


def check_auth_users():
    """检查 auth.users 表中的用户"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("查询 auth.users 表中的用户...")

        # 尝试查询 auth.users
        try:
            users_response = supabase.table("users").select("id, email").execute()
            if users_response.data:
                logger.info(f"✅ 从 users 表找到 {len(users_response.data)} 个用户")
                for user in users_response.data:
                    logger.info(f"  用户 ID: {user['id']}, 邮箱: {user.get('email', 'N/A')}")
            else:
                logger.info("users 表中没有数据")
        except Exception as e:
            logger.info(f"users 表无法访问: {str(e)}")

        # 检查测试用户是否存在
        test_user_id = "178f1f37-34f9-4bb3-a1ca-570e5e7af3bc"
        logger.info(f"\n检查测试用户 {test_user_id} 是否存在...")

        # 尝试直接查询这个用户
        try:
            test_user_response = supabase.table("users").select("id").eq("id", test_user_id).execute()
            if test_user_response.data:
                logger.info(f"✅ 测试用户存在")
            else:
                logger.info(f"❌ 测试用户不存在")
                logger.info("\n建议：")
                logger.info("1. 在 Supabase Dashboard 中创建一个测试用户")
                logger.info("2. 或者使用已有的用户 ID")
                logger.info("3. 或者修改 subscriptions 表的外键约束，引用 profiles 表")
        except Exception as e:
            logger.info(f"查询测试用户失败: {str(e)}")

        return True

    except Exception as e:
        logger.error(f"❌ 检查 auth.users 失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = check_auth_users()
    sys.exit(0 if success else 1)
