"""
验证配额重置函数
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


def test_quota_functions():
    """测试配额重置函数"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("开始测试配额重置函数...")

        # 1. 测试 get_quota_statistics
        logger.info("\n1. 测试 get_quota_statistics()...")
        try:
            result = supabase.rpc('get_quota_statistics').execute()
            if result.data:
                logger.info("✅ get_quota_statistics() 执行成功")
                logger.info(f"   返回数据: {result.data}")
            else:
                logger.warning("⚠️ get_quota_statistics() 返回空数据")
        except Exception as e:
            logger.error(f"❌ get_quota_statistics() 执行失败: {str(e)}")

        # 2. 测试 reset_all_quotas_monthly
        logger.info("\n2. 测试 reset_all_quotas_monthly()...")
        try:
            result = supabase.rpc('reset_all_quotas_monthly').execute()
            if result.data is not None:
                logger.info(f"✅ reset_all_quotas_monthly() 执行成功")
                logger.info(f"   重置了 {result.data} 条记录")
            else:
                logger.warning("⚠️ reset_all_quotas_monthly() 返回 None")
        except Exception as e:
            logger.error(f"❌ reset_all_quotas_monthly() 执行失败: {str(e)}")

        # 3. 测试 reset_quotas_by_plan
        logger.info("\n3. 测试 reset_quotas_by_plan('free')...")
        try:
            result = supabase.rpc('reset_quotas_by_plan', {'p_plan_id': 'free'}).execute()
            if result.data is not None:
                logger.info(f"✅ reset_quotas_by_plan('free') 执行成功")
                logger.info(f"   重置了 {result.data} 条记录")
            else:
                logger.warning("⚠️ reset_quotas_by_plan('free') 返回 None")
        except Exception as e:
            logger.error(f"❌ reset_quotas_by_plan('free') 执行失败: {str(e)}")

        # 4. 测试 reset_user_quota
        logger.info("\n4. 测试 reset_user_quota()...")
        try:
            # 先获取一个用户 ID
            users_result = supabase.table('profiles').select('id').limit(1).execute()
            if users_result.data:
                user_id = users_result.data[0]['id']
                logger.info(f"   使用用户 ID: {user_id}")

                result = supabase.rpc('reset_user_quota', {'p_user_id': user_id}).execute()
                if result.data:
                    logger.info(f"✅ reset_user_quota() 执行成功")
                    logger.info(f"   返回: {result.data}")
                else:
                    logger.warning("⚠️ reset_user_quota() 返回 False")
            else:
                logger.warning("⚠️ 没有找到用户，跳过 reset_user_quota() 测试")
        except Exception as e:
            logger.error(f"❌ reset_user_quota() 执行失败: {str(e)}")

        # 5. 再次测试 get_quota_statistics
        logger.info("\n5. 再次测试 get_quota_statistics()...")
        try:
            result = supabase.rpc('get_quota_statistics').execute()
            if result.data:
                logger.info("✅ get_quota_statistics() 执行成功")
                logger.info(f"   当前配额统计: {result.data}")
            else:
                logger.warning("⚠️ get_quota_statistics() 返回空数据")
        except Exception as e:
            logger.error(f"❌ get_quota_statistics() 执行失败: {str(e)}")

        logger.info("\n✅ 配额重置函数测试完成！")
        return True

    except Exception as e:
        logger.error(f"❌ 测试配额重置函数失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = test_quota_functions()
    sys.exit(0 if success else 1)
