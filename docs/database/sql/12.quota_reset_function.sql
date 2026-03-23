-- 配额重置函数
-- 用于定期重置用户的配额（例如每月重置）
-- 可以通过 PostgreSQL 的 pg_cron 扩展或外部定时任务调用

create or replace function public.reset_user_quota(
  p_user_id uuid,
  p_feature_key text default 'quota_ai_generations'
)
returns void
language plpgsql
security definer
as $$
begin
  -- 重置指定用户的指定功能配额
  update public.usages
  set count = 0,
      updated_at = now()
  where user_id = p_user_id
    and feature_key = p_feature_key;
end;
$$;

-- 批量重置所有用户的配额（用于定期任务）
-- 只重置那些订阅周期已结束的用户
create or replace function public.reset_expired_quotas()
returns int
language plpgsql
security definer
as $$
declare
  reset_count int;
begin
  -- 重置所有订阅周期已结束的用户的配额
  update public.usages u
  set count = 0,
      updated_at = now()
  from public.subscriptions s
  where u.user_id = s.user_id
    and s.status = 'active'
    and s.current_period_end is not null
    and s.current_period_end < now()
    and u.feature_key = 'quota_ai_generations';
  
  get diagnostics reset_count = row_count;
  
  -- 更新订阅的周期结束时间（如果需要）
  -- 这里假设是月度订阅，实际应该根据套餐类型设置
  update public.subscriptions
  set current_period_end = current_period_end + interval '1 month'
  where status = 'active'
    and current_period_end is not null
    and current_period_end < now();
  
  return reset_count;
end;
$$;

