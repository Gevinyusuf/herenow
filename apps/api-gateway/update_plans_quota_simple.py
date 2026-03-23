"""
直接使用 Supabase RPC 更新 plans 表的配额配置
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


def main():
    """主函数"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("开始更新 plans 表的配额配置...")

        # 更新 Free 套餐
        logger.info("更新 Free 套餐...")
        response = supabase.table("plans").update({
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
        logger.info(f"Free 套餐更新结果: {response}")

        # 更新 Pro 套餐
        logger.info("更新 Pro 套餐...")
        response = supabase.table("plans").update({
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
        logger.info(f"Pro 套餐更新结果: {response}")

        # 更新 Beta 套餐
        logger.info("更新 Beta 套餐...")
        response = supabase.table("plans").update({
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
        logger.info(f"Beta 套餐更新结果: {response}")

        logger.info("✅ 配额配置更新成功！")

        # 验证更新结果
        logger.info("\n验证更新结果...")
        response = supabase.table("plans").select("*").execute()

        if response.data:
            logger.info("\n当前套餐配置：")
            for plan in response.data:
                logger.info(f"\n套餐 ID: {plan['id']}")
                logger.info(f"套餐名称: {plan['name']}")
                logger.info(f"配额配置: {plan['limits']}")

        return True

    except Exception as e:
        logger.error(f"❌ 更新配额配置失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
