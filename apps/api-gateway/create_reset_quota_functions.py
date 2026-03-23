"""
创建配额重置函数
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


def create_reset_quota_functions():
    """创建配额重置函数"""
    try:
        # 创建 Supabase 客户端
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            logger.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found")
            return False

        supabase: Client = create_client(supabase_url, supabase_key)

        logger.info("创建配额重置函数...")
        logger.info("请手动在 Supabase SQL 编辑器中执行以下 SQL：")
        logger.info("="*60)

        # SQL 语句
        sql = """
-- 1. 重置单个用户的配额
create or replace function public.reset_user_quota(
  p_user_id uuid,
  p_feature_key text default null
)
returns boolean
language plpgsql
security definer
as $$
begin
  -- 如果指定了 feature_key，只重置该功能的配额
  if p_feature_key is not null then
    update usages
    set count = 0, updated_at = now()
    where user_id = p_user_id and feature_key = p_feature_key;
  else
    -- 否则重置所有 AI 功能的配额
    update usages
    set count = 0, updated_at = now()
    where user_id = p_user_id and feature_key like 'quota_ai_%';
  end if;

  return true;
end;
$$;

-- 2. 重置所有用户的配额（按月）
create or replace function public.reset_all_quotas_monthly()
returns integer
language plpgsql
security definer
as $$
declare
  reset_count integer;
begin
  -- 重置所有用户的 AI 配额
  update usages
  set count = 0, updated_at = now()
  where feature_key like 'quota_ai_%';

  -- 返回重置的记录数
  get diagnostics count into reset_count
  from usages
  where feature_key like 'quota_ai_%';

  return reset_count;
end;
$$;

-- 3. 重置指定套餐的配额
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
  -- 重置指定套餐的所有用户配额
  update usages
  set count = 0, updated_at = now()
  where user_id in (
    select user_id from subscriptions
    where plan_id = p_plan_id and status = 'active'
  )
  and feature_key like 'quota_ai_%';

  -- 返回重置的记录数
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

-- 4. 获取配额统计信息
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

        logger.info(sql)
        logger.info("="*60)

        logger.info("\n函数说明：")
        logger.info("1. reset_user_quota(p_user_id, p_feature_key)")
        logger.info("   - 重置单个用户的配额")
        logger.info("   - 如果指定 feature_key，只重置该功能")
        logger.info("   - 否则重置所有 AI 功能的配额")
        logger.info("")
        logger.info("2. reset_all_quotas_monthly()")
        logger.info("   - 重置所有用户的配额")
        logger.info("   - 可以设置为定时任务，每月自动执行")
        logger.info("")
        logger.info("3. reset_quotas_by_plan(p_plan_id)")
        logger.info("   - 重置指定套餐的所有用户配额")
        logger.info("   - 用于批量管理")
        logger.info("")
        logger.info("4. get_quota_statistics()")
        logger.info("   - 获取配额统计信息")
        logger.info("   - 用于监控和分析")

        logger.info("\n使用示例：")
        logger.info("-- 重置单个用户的所有配额")
        logger.info("select public.reset_user_quota('user-uuid-here', null);")
        logger.info("")
        logger.info("-- 重置单个用户的特定功能配额")
        logger.info("select public.reset_user_quota('user-uuid-here', 'quota_ai_text_generation');")
        logger.info("")
        logger.info("-- 重置所有用户的配额")
        logger.info("select public.reset_all_quotas_monthly();")
        logger.info("")
        logger.info("-- 重置指定套餐的所有用户配额")
        logger.info("select public.reset_quotas_by_plan('pro_monthly');")
        logger.info("")
        logger.info("-- 获取配额统计信息")
        logger.info("select * from public.get_quota_statistics();")

        return True

    except Exception as e:
        logger.error(f"❌ 创建配额重置函数失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = create_reset_quota_functions()
    sys.exit(0 if success else 1)
