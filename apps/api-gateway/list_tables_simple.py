"""
直接查询数据库中的表
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


def list_tables():
    """列出所有表"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("查询数据库中的所有表...")

        # 直接查询 information_schema
        response = supabase.table("information_schema.tables").select("table_name").eq("table_schema", "public").execute()

        if response.data:
            logger.info(f"\n找到 {len(response.data)} 个表：")
            for table in response.data:
                logger.info(f"  - {table['table_name']}")
        else:
            logger.info("没有找到表")

        return True

    except Exception as e:
        logger.error(f"❌ 查询表失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = list_tables()
    sys.exit(0 if success else 1)
