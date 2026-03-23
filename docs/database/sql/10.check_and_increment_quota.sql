create or replace function public.check_and_increment_quota(
  p_user_id uuid,
  p_feature_key text,
  p_delta int default 1
)
returns boolean
language plpgsql
security definer -- 拥有绕过 RLS 的权限
as $$
declare
  user_plan_id text;
  feature_limit int;
  current_usage int;
begin
  -- 1. 获取用户当前的 Plan ID
  select plan_id into user_plan_id 
  from subscriptions 
  where user_id = p_user_id and status = 'active';

  if user_plan_id is null then
    return false; -- 无有效订阅
  end if;
  
  -- 2. 获取该 Plan 对该功能的限制 (从 JSONB 解析)
  -- 注意：我们约定 -1 代表无限
  select (limits->>p_feature_key)::int into feature_limit 
  from plans where id = user_plan_id;
  
  -- 3. 处理“无限额度”或“无限制”的情况
  if feature_limit is null or feature_limit = -1 then
    return true; 
  end if;

  -- 4. 确保 Usages 表有记录 (Upsert)
  insert into usages (user_id, feature_key, count)
  values (p_user_id, p_feature_key, 0)
  on conflict (user_id, feature_key) do nothing;

  -- 5. 锁定当前行并获取用量 (关键的一步：防止并发超卖)
  select count into current_usage 
  from usages 
  where user_id = p_user_id and feature_key = p_feature_key 
  for update; 

  -- 6. 核心校验
  if current_usage + p_delta > feature_limit then
    return false; -- 额度不足
  end if;

  -- 7. 扣费
  update usages set count = count + p_delta 
  where user_id = p_user_id and feature_key = p_feature_key;

  return true;
end;
$$;