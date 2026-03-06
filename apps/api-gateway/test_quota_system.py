"""
测试配额系统功能
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


def test_quota_system():
    """测试配额系统"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("="*60)
        logger.info("测试配额系统")
        logger.info("="*60)

        # 1. 查看当前套餐配置
        logger.info("\n1. 查看当前套餐配置...")
        response = supabase.table("plans").select("*").execute()

        if response.data:
            logger.info("\n当前套餐配置：")
            for plan in response.data:
                logger.info(f"\n套餐 ID: {plan['id']}")
                logger.info(f"套餐名称: {plan['name']}")
                logger.info(f"配额配置: {plan['limits']}")

        # 2. 查看用户订阅
        logger.info("\n2. 查看用户订阅...")
        response = supabase.table("subscriptions").select("*").execute()

        if response.data:
            logger.info(f"\n找到 {len(response.data)} 个订阅记录")
            for sub in response.data:
                logger.info(f"用户 ID: {sub['user_id']}")
                logger.info(f"套餐 ID: {sub['plan_id']}")
                logger.info(f"状态: {sub['status']}")
        else:
            logger.info("没有找到订阅记录")

        # 3. 查看配额使用情况
        logger.info("\n3. 查看配额使用情况...")
        response = supabase.table("usages").select("*").execute()

        if response.data:
            logger.info(f"\n找到 {len(response.data)} 条使用记录")
            for usage in response.data:
                logger.info(f"用户 ID: {usage['user_id']}")
                logger.info(f"功能 Key: {usage['feature_key']}")
                logger.info(f"使用次数: {usage['count']}")
                logger.info(f"更新时间: {usage['updated_at']}")
        else:
            logger.info("没有找到使用记录")

        # 4. 测试 check_and_increment_quota 函数
        logger.info("\n4. 测试 check_and_increment_quota 函数...")
        test_user_id = "178f1f37-34f9-4bb3-a1ca-570e5e7af3bc"
        test_feature_key = "quota_ai_text_generation"

        response = supabase.rpc(
            'check_and_increment_quota',
            {
                'p_user_id': test_user_id,
                'p_feature_key': test_feature_key,
                'p_delta': 1
            }
        ).execute()

        logger.info(f"配额检查结果: {response.data}")

        # 5. 查询配额信息
        logger.info("\n5. 查询配额信息...")
        response = supabase.rpc(
            'get_quota_info',
            {
                'p_user_id': test_user_id,
                'p_feature_key': test_feature_key
            }
        ).execute()

        logger.info(f"配额信息: {response.data}")

        logger.info("\n" + "="*60)
        logger.info("✅ 配额系统测试完成！")
        logger.info("="*60)

        return True

    except Exception as e:
        logger.error(f"❌ 测试配额系统失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = test_quota_system()
    sys.exit(0 if success else 1)
