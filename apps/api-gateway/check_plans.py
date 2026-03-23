"""
查看 plans 表的实际数据
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


def check_plans():
    """检查 plans 表的数据"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("查询 plans 表的所有数据...")

        response = supabase.table("plans").select("*").execute()

        if response.data:
            logger.info(f"\n找到 {len(response.data)} 条记录：")
            for plan in response.data:
                logger.info(f"\n套餐 ID: {plan['id']}")
                logger.info(f"套餐名称: {plan['name']}")
                logger.info(f"配额配置: {plan['limits']}")
        else:
            logger.info("plans 表中没有数据")

        return True

    except Exception as e:
        logger.error(f"❌ 查询 plans 表失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = check_plans()
    sys.exit(0 if success else 1)
