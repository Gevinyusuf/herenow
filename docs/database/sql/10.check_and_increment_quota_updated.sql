-- 更新后的 check_and_increment_quota RPC 函数
-- 支持从 plans.limits JSONB 读取所有 AI 功能类型的配额配置
-- 支持无限配额（-1）

CREATE OR REPLACE FUNCTION public.check_and_increment_quota(
  p_user_id uuid,
  p_feature_key text,
  p_delta int DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- 拥有绕过 RLS 的权限
AS $$
DECLARE
  user_plan_id text;
  feature_limit int;
  current_usage int;
BEGIN
  -- 1. 获取用户当前的 Plan ID（从 subscriptions 表）
  -- 如果有多个订阅，选择最新的（按 created_at 排序）
  SELECT plan_id INTO user_plan_id 
  FROM subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 如果没有找到，返回 false
  IF user_plan_id IS NULL THEN
    RETURN false;  -- 无有效订阅
  END IF;
  
  -- 2. 从 plans 表读取 limits JSONB，并获取该功能的配额上限
  SELECT (limits->>p_feature_key)::int INTO feature_limit 
  FROM plans 
  WHERE id = user_plan_id;
  
  -- 如果 limits 中没有该字段，返回 false
  IF feature_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- 3. 处理"无限额度"的情况（-1 代表无限）
  IF feature_limit = -1 THEN
    -- 无限配额，直接允许，但更新使用量用于统计
    INSERT INTO usages (user_id, feature_key, count, updated_at)
    VALUES (p_user_id, p_feature_key, p_delta, NOW())
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET 
      count = usages.count + p_delta,
      updated_at = NOW();
    RETURN true;
  END IF;

  -- 4. 确保 usages 表有记录（如果不存在则创建）
  INSERT INTO usages (user_id, feature_key, count, updated_at)
  VALUES (p_user_id, p_feature_key, 0, NOW())
  ON CONFLICT (user_id, feature_key) DO NOTHING;

  -- 5. 锁定当前行并获取用量（关键：防止并发超卖）
  SELECT count INTO current_usage 
  FROM usages 
  WHERE user_id = p_user_id 
    AND feature_key = p_feature_key 
  FOR UPDATE;  -- 行级锁，防止并发问题

  -- 6. 核心校验：检查配额是否足够
  IF current_usage + p_delta > feature_limit THEN
    RETURN false;  -- 额度不足
  END IF;

  -- 7. 扣减配额（原子性更新）
  UPDATE usages 
  SET count = count + p_delta,
      updated_at = NOW()
  WHERE user_id = p_user_id 
    AND feature_key = p_feature_key;

  RETURN true;
END;
$$;

-- 配置函数权限
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO service_role;

