# RPC 函数快速设置指南

## 一键执行（推荐）

直接在 Supabase Dashboard 的 SQL Editor 中执行以下完整 SQL：

```sql
-- ============================================
-- 步骤 1: 创建/更新 RPC 函数
-- ============================================

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
  -- 1. 获取用户当前的 Plan ID
  SELECT plan_id INTO user_plan_id 
  FROM subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active'
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

-- ============================================
-- 步骤 2: 配置函数权限
-- ============================================

GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO service_role;
```

## 验证函数

执行以下 SQL 验证：

```sql
-- 1. 检查函数是否存在
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_and_increment_quota';

-- 2. 测试函数（需要替换为真实的用户 ID）
SELECT check_and_increment_quota(
  'your-user-id'::uuid,
  'quota_ai_text_generation',
  1
);
```

## 配置套餐配额

确保 plans 表的 limits 字段包含配额配置：

```sql
-- 查看当前套餐
SELECT id, name, limits FROM plans;

-- 更新套餐配额（示例）
UPDATE plans
SET limits = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(limits, '{}'::jsonb),
          '{quota_ai_text_generation}',
          '100'
        ),
        '{quota_ai_image_generation}',
        '50'
      ),
      '{quota_ai_chat}',
      '200'
    ),
    '{quota_ai_planning}',
    '50'
  ),
  '{quota_ai_import}',
  '20'
)
WHERE id = 'your-plan-id';
```

完成！RPC 函数已配置好，可以开始使用了。

