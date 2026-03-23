-- 修复后的 check_and_increment_quota RPC 函数
-- 已移除不存在的 created_at 字段引用

CREATE OR REPLACE FUNCTION public.check_and_increment_quota(
  p_user_id uuid,
  p_feature_key text,
  p_delta int DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

  IF user_plan_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- 2. 从 plans.limits JSONB 读取配额上限
  SELECT (limits->>p_feature_key)::int INTO feature_limit 
  FROM plans 
  WHERE id = user_plan_id;
  
  IF feature_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- 3. 处理无限配额（-1）
  IF feature_limit = -1 THEN
    INSERT INTO usages (user_id, feature_key, count, updated_at)
    VALUES (p_user_id, p_feature_key, p_delta, NOW())
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET 
      count = usages.count + p_delta,
      updated_at = NOW();
    RETURN true;
  END IF;

  -- 4. 确保 usages 表有记录
  INSERT INTO usages (user_id, feature_key, count, updated_at)
  VALUES (p_user_id, p_feature_key, 0, NOW())
  ON CONFLICT (user_id, feature_key) DO NOTHING;

  -- 5. 锁定行并获取当前使用量（防止并发）
  SELECT count INTO current_usage 
  FROM usages 
  WHERE user_id = p_user_id 
    AND feature_key = p_feature_key 
  FOR UPDATE;

  -- 6. 检查配额是否足够
  IF current_usage + p_delta > feature_limit THEN
    RETURN false;
  END IF;

  -- 7. 扣减配额
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
TO authenticated, service_role;

