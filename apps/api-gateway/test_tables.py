"""
测试查询不同的表
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


def test_tables():
    """测试查询不同的表"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        # 测试查询不同的表
        tables_to_test = [
            "plans",
            "subscriptions",
            "usages",
            "profiles",
            "users",
            "auth.users",
            "events",
            "communities"
        ]

        for table_name in tables_to_test:
            try:
                response = supabase.table(table_name).select("*").limit(1).execute()
                if response.data is not None:
                    logger.info(f"✅ 表 '{table_name}' 存在，有 {len(response.data)} 条记录")
                else:
                    logger.info(f"⚠️  表 '{table_name}' 存在但没有数据")
            except Exception as e:
                logger.info(f"❌ 表 '{table_name}' 不存在或无法访问")

        return True

    except Exception as e:
        logger.error(f"❌ 测试表失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = test_tables()
    sys.exit(0 if success else 1)
