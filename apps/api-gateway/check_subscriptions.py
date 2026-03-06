"""
查看 subscriptions 表的结构
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


def check_subscriptions_structure():
    """检查 subscriptions 表的结构"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("查询 subscriptions 表的数据...")

        response = supabase.table("subscriptions").select("*").execute()

        if response.data:
            logger.info(f"\n找到 {len(response.data)} 条记录：")
            for sub in response.data:
                logger.info(f"\n用户 ID: {sub['user_id']}")
                logger.info(f"套餐 ID: {sub['plan_id']}")
                logger.info(f"状态: {sub['status']}")
                logger.info(f"周期结束: {sub.get('current_period_end', 'N/A')}")
        else:
            logger.info("subscriptions 表中没有数据")

        return True

    except Exception as e:
        logger.error(f"❌ 查询 subscriptions 表失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = check_subscriptions_structure()
    sys.exit(0 if success else 1)
