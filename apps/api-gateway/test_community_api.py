"""
测试社群 API
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


def test_community_api():
    """测试社群 API"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("开始测试社群 API...")

        # 1. 测试 communities 表
        logger.info("\n1. 测试 communities 表...")
        try:
            result = supabase.table("communities").select("*").limit(5).execute()
            if result.data:
                logger.info(f"✅ communities 表查询成功")
                logger.info(f"   找到 {len(result.data)} 个社群")
                for community in result.data[:2]:
                    logger.info(f"   - {community.get('name')} (ID: {community.get('id')})")
            else:
                logger.info("ℹ️ communities 表为空")
        except Exception as e:
            logger.error(f"❌ communities 表查询失败: {str(e)}")

        # 2. 测试 community_members 表
        logger.info("\n2. 测试 community_members 表...")
        try:
            result = supabase.table("community_members").select("*").limit(5).execute()
            if result.data:
                logger.info(f"✅ community_members 表查询成功")
                logger.info(f"   找到 {len(result.data)} 条成员记录")
                for member in result.data[:2]:
                    logger.info(f"   - 用户 {member.get('user_id')} 在社群 {member.get('community_id')}")
            else:
                logger.info("ℹ️ community_members 表为空")
        except Exception as e:
            logger.error(f"❌ community_members 表查询失败: {str(e)}")

        # 3. 测试 get_user_communities 函数
        logger.info("\n3. 测试 get_user_communities 函数...")
        try:
            # 先获取一个用户 ID
            users_result = supabase.table('profiles').select('id').limit(1).execute()
            if users_result.data:
                user_id = users_result.data[0]['id']
                logger.info(f"   使用用户 ID: {user_id}")

                result = supabase.rpc('get_user_communities', {'p_user_id': user_id}).execute()
                if result.data:
                    logger.info(f"✅ get_user_communities() 执行成功")
                    logger.info(f"   返回 {len(result.data)} 个社群")
                    for community in result.data[:2]:
                        logger.info(f"   - {community.get('community_name')} (角色: {community.get('member_role')})")
                else:
                    logger.warning("⚠️ get_user_communities() 返回空数据")
            else:
                logger.warning("⚠️ 没有找到用户，跳过测试")
        except Exception as e:
            logger.error(f"❌ get_user_communities() 执行失败: {str(e)}")

        # 4. 测试 get_community_details 函数
        logger.info("\n4. 测试 get_community_details 函数...")
        try:
            # 先获取一个社群 ID
            communities_result = supabase.table('communities').select('id').limit(1).execute()
            if communities_result.data:
                community_id = communities_result.data[0]['id']
                logger.info(f"   使用社群 ID: {community_id}")

                result = supabase.rpc('get_community_details', {'p_community_id': community_id}).execute()
                if result.data:
                    logger.info(f"✅ get_community_details() 执行成功")
                    for detail in result.data:
                        logger.info(f"   - {detail.get('community_name')} (所有者: {detail.get('owner_name')})")
                else:
                    logger.warning("⚠️ get_community_details() 返回空数据")
            else:
                logger.warning("⚠️ 没有找到社群，跳过测试")
        except Exception as e:
            logger.error(f"❌ get_community_details() 执行失败: {str(e)}")

        logger.info("\n✅ 社群 API 测试完成！")
        return True

    except Exception as e:
        logger.error(f"❌ 测试社群 API 失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = test_community_api()
    sys.exit(0 if success else 1)
