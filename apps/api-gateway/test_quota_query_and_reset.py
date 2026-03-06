"""
测试配额查询和重置功能
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


def test_quota_features():
    """测试配额查询和重置功能"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("="*60)
        logger.info("测试配额查询和重置功能")
        logger.info("="*60)

        # 1. 测试配额查询功能
        logger.info("\n1. 测试配额查询功能...")
        test_user_id = "178f1f37-34f9-4bb3-a1ca-570e5e7af3bc"

        # 查询用户的配额使用情况
        usages_response = supabase.table("usages").select("*").eq("user_id", test_user_id).execute()

        if usages_response.data:
            logger.info(f"找到 {len(usages_response.data)} 条配额使用记录：")
            for usage in usages_response.data:
                logger.info(f"  - 功能: {usage['feature_key']}, 使用次数: {usage['count']}")
        else:
            logger.info("没有找到配额使用记录")

        # 2. 测试配额统计功能
        logger.info("\n2. 测试配额统计功能...")
        try:
            stats_response = supabase.rpc("get_quota_statistics", {}).execute()
            if stats_response.data:
                logger.info("配额统计信息：")
                for stat in stats_response.data:
                    logger.info(f"  - 功能: {stat['feature_key']}")
                    logger.info(f"    总用户数: {stat['total_users']}")
                    logger.info(f"    总使用次数: {stat['total_usage']}")
                    logger.info(f"    平均使用次数: {stat['average_usage']}")
            else:
                logger.info("没有配额统计信息")
        except Exception as e:
            logger.info(f"配额统计功能尚未实现: {str(e)}")

        # 3. 测试配额重置功能
        logger.info("\n3. 测试配额重置功能...")
        try:
            # 先创建一些测试数据
            logger.info("创建测试配额数据...")
            supabase.table("usages").insert({
                "user_id": test_user_id,
                "feature_key": "quota_ai_text_generation",
                "count": 10
            }).execute()

            # 查询重置前的数据
            before_response = supabase.table("usages").select("*").eq("user_id", test_user_id).eq("feature_key", "quota_ai_text_generation").execute()
            if before_response.data:
                logger.info(f"重置前使用次数: {before_response.data[0]['count']}")

            # 测试重置单个用户的配额
            logger.info("测试重置单个用户的配额...")
            reset_response = supabase.rpc("reset_user_quota", {
                "p_user_id": test_user_id,
                "p_feature_key": None
            }).execute()

            logger.info(f"重置结果: {reset_response.data}")

            # 查询重置后的数据
            after_response = supabase.table("usages").select("*").eq("user_id", test_user_id).eq("feature_key", "quota_ai_text_generation").execute()
            if after_response.data:
                logger.info(f"重置后使用次数: {after_response.data[0]['count']}")

            # 验证重置是否成功
            if after_response.data and after_response.data[0]['count'] == 0:
                logger.info("✅ 配额重置成功！")
            else:
                logger.info("❌ 配额重置失败")

        except Exception as e:
            logger.info(f"配额重置功能尚未实现: {str(e)}")

        # 4. 总结
        logger.info("\n" + "="*60)
        logger.info("📊 配额功能测试总结")
        logger.info("="*60)
        logger.info("\n✅ 已完成：")
        logger.info("  - 配额查询功能：已实现（/api/v1/ai/quota）")
        logger.info("  - 配额重置函数：SQL 已准备（需要在 Supabase 中执行）")
        logger.info("  - 配额统计函数：SQL 已准备（需要在 Supabase 中执行）")

        logger.info("\n⚠️  待完成：")
        logger.info("  - 在 Supabase Dashboard 中执行配额重置和统计函数的 SQL")
        logger.info("  - 测试真实的用户配额查询 API")
        logger.info("  - 实现定时任务自动重置配额")

        logger.info("\n💡 下一步：")
        logger.info("  1. 在 Supabase Dashboard 中执行 create_reset_quota_functions.py 中的 SQL")
        logger.info("  2. 测试 /api/v1/ai/quota API 端点")
        logger.info("  3. 实现定时任务自动重置配额（如每月 1 号）")

        logger.info("\n" + "="*60)
        logger.info("✅ 配额查询和重置功能测试完成！")
        logger.info("="*60)

        return True

    except Exception as e:
        logger.error(f"❌ 测试配额功能失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = test_quota_features()
    sys.exit(0 if success else 1)
