-- ============================================
-- 配额重置函数 SQL
-- 请在 Supabase SQL 编辑器中执行以下 SQL
-- ============================================

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

-- 2. 重置所有用户的配额（按月）
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
  GET DIAGNOSTICS reset_count = ROW_COUNT;
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

-- ============================================
-- 函数说明
-- ============================================
-- 1. reset_user_quota(p_user_id, p_feature_key)
--    - 重置单个用户的配额
--    - 如果指定 feature_key，只重置该功能
--    - 否则重置所有 AI 功能的配额
--
-- 2. reset_all_quotas_monthly()
--    - 重置所有用户的配额
--    - 可以设置为定时任务，每月自动执行
--
-- 3. reset_quotas_by_plan(p_plan_id)
--    - 重置指定套餐的所有用户配额
--    - 用于批量管理
--
-- 4. get_quota_statistics()
--    - 获取配额统计信息
--    - 用于监控和分析

-- ============================================
-- 使用示例
-- ============================================
-- 重置单个用户的所有配额
-- select public.reset_user_quota('user-uuid-here', null);

-- 重置单个用户的特定功能配额
-- select public.reset_user_quota('user-uuid-here', 'quota_ai_text_generation');

-- 重置所有用户的配额
-- select public.reset_all_quotas_monthly();

-- 重置指定套餐的所有用户配额
-- select public.reset_quotas_by_plan('pro');

-- 获取配额统计信息
-- select * from public.get_quota_statistics();
