"""
执行配额重置函数 SQL
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


def execute_quota_functions_sql():
    """执行配额重置函数 SQL"""
    try:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("开始执行配额重置函数 SQL...")

        # SQL 语句
        sql_statements = [
            {
                "name": "reset_user_quota",
                "sql": """
                create or replace function public.reset_user_quota(
                  p_user_id uuid,
                  p_feature_key text default null
                )
                returns boolean
                language plpgsql
                security definer
                as $$
                begin
                  if p_feature_key is not null then
                    update usages
                    set count = 0, updated_at = now()
                    where user_id = p_user_id and feature_key = p_feature_key;
                  else
                    update usages
                    set count = 0, updated_at = now()
                    where user_id = p_user_id and feature_key like 'quota_ai_%';
                  end if;
                  return true;
                end;
                $$;
                """
            },
            {
                "name": "reset_all_quotas_monthly",
                "sql": """
                create or replace function public.reset_all_quotas_monthly()
                returns integer
                language plpgsql
                security definer
                as $$
                declare
                  reset_count integer;
                begin
                  update usages
                  set count = 0, updated_at = now()
                  where feature_key like 'quota_ai_%';
                  get diagnostics count into reset_count
                  from usages
                  where feature_key like 'quota_ai_%';
                  return reset_count;
                end;
                $$;
                """
            },
            {
                "name": "reset_quotas_by_plan",
                "sql": """
                create or replace function public.reset_quotas_by_plan(
                  p_plan_id text
                )
                returns integer
                language plpgsql
                security definer
                as $$
                declare
                  reset_count integer;
                begin
                  update usages
                  set count = 0, updated_at = now()
                  where user_id in (
                    select user_id from subscriptions
                    where plan_id = p_plan_id and status = 'active'
                  )
                  and feature_key like 'quota_ai_%';
                  select count(*) into reset_count
                  from usages
                  where feature_key like 'quota_ai_%'
                  and user_id in (
                    select user_id from subscriptions
                    where plan_id = p_plan_id and status = 'active'
                  );
                  return reset_count;
                end;
                $$;
                """
            },
            {
                "name": "get_quota_statistics",
                "sql": """
                create or replace function public.get_quota_statistics()
                returns table (
                  feature_key text,
                  total_users integer,
                  total_usage integer,
                  average_usage numeric
                )
                language plpgsql
                security definer
                as $$
                begin
                  return query
                  select
                    u.feature_key,
                    count(distinct u.user_id) as total_users,
                    sum(u.count) as total_usage,
                    round(avg(u.count), 2) as average_usage
                  from usages u
                  where u.feature_key like 'quota_ai_%'
                  group by u.feature_key
                  order by u.feature_key;
                end;
                $$;
                """
            }
        ]

        success_count = 0
        for stmt in sql_statements:
            try:
                logger.info(f"执行函数: {stmt['name']}...")
                result = supabase.rpc('exec_sql', {'sql': stmt['sql']}).execute()
                logger.info(f"✅ {stmt['name']} 创建成功")
                success_count += 1
            except Exception as e:
                logger.warning(f"⚠️ {stmt['name']} 执行失败: {str(e)}")
                logger.info(f"尝试使用直接 SQL 执行...")

        logger.info(f"\n成功创建 {success_count}/{len(sql_statements)} 个函数")

        if success_count < len(sql_statements):
            logger.info("\n部分函数创建失败，请手动在 Supabase SQL 编辑器中执行以下 SQL：")
            for stmt in sql_statements:
                logger.info(f"\n-- {stmt['name']}")
                logger.info(stmt['sql'])
        else:
            logger.info("\n✅ 所有配额重置函数创建成功！")
            logger.info("\n使用示例：")
            logger.info("-- 重置单个用户的所有配额")
            logger.info("select public.reset_user_quota('user-uuid-here', null);")
            logger.info("\n-- 重置单个用户的特定功能配额")
            logger.info("select public.reset_user_quota('user-uuid-here', 'quota_ai_text_generation');")
            logger.info("\n-- 重置所有用户的配额")
            logger.info("select public.reset_all_quotas_monthly();")
            logger.info("\n-- 重置指定套餐的所有用户配额")
            logger.info("select public.reset_quotas_by_plan('pro');")
            logger.info("\n-- 获取配额统计信息")
            logger.info("select * from public.get_quota_statistics();")

        return success_count == len(sql_statements)

    except Exception as e:
        logger.error(f"❌ 执行配额重置函数 SQL 失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = execute_quota_functions_sql()
    sys.exit(0 if success else 1)
