create or replace view public.v_user_entitlements as
select 
  s.user_id,
  p.name as plan_name,
  p.id as plan_id,
  s.status as subscription_status,
  s.current_period_end,
  -- 1. 简单的功能开关 (Feature Flags)
  coalesce((p.limits->>'feature_community')::boolean, false) as can_access_community,
  coalesce((p.limits->>'feature_discover')::boolean, false) as can_access_discover,
  
  -- 2. AI 生成额度计算
  coalesce((p.limits->>'quota_ai_generations')::int, 0) as quota_ai_limit,
  coalesce(u_ai.count, 0) as quota_ai_used,
  case 
    when (p.limits->>'quota_ai_generations')::int = -1 then -1 -- 统一使用 -1 表示无限
    else greatest(0, (p.limits->>'quota_ai_generations')::int - coalesce(u_ai.count, 0))
  end as quota_ai_remaining

from subscriptions s
join plans p on s.plan_id = p.id
-- 关联用量表 (Left Join，因为用户可能还没用过)
left join usages u_ai on s.user_id = u_ai.user_id and u_ai.feature_key = 'quota_ai_generations'
-- 只返回活跃的订阅，且周期未过期
where s.status = 'active'
  and (s.current_period_end is null or s.current_period_end > now());