# subscriptions 表添加 created_at 字段指南

## 操作步骤

### 步骤 1: 添加 created_at 字段

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 为 subscriptions 表添加 created_at 字段
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW();

-- 为已有数据设置默认值
UPDATE public.subscriptions
SET created_at = NOW()
WHERE created_at IS NULL;

-- 创建索引以提高查询性能（可选）
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at 
ON public.subscriptions(created_at);
```

### 步骤 2: 验证字段添加成功

```sql
-- 检查字段是否存在
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name = 'created_at';

-- 应该返回：
-- created_at | timestamp with time zone | now()
```

### 步骤 3: 更新 RPC 函数（使用 created_at）

现在可以更新 RPC 函数，使用 `ORDER BY created_at DESC` 来选择最新的订阅：

```sql
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
  -- 1. 获取用户当前的 Plan ID（选择最新的订阅）
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
```

## 优势

添加 `created_at` 字段的好处：

1. **支持多个订阅**：如果用户有多个订阅记录，可以选择最新的
2. **便于查询和排序**：可以按创建时间排序
3. **便于调试**：可以看到订阅的创建时间
4. **便于统计**：可以分析订阅趋势

## 验证

```sql
-- 查看 subscriptions 表结构
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 查看现有数据
SELECT user_id, plan_id, status, created_at
FROM subscriptions
LIMIT 5;
```

## 注意事项

- `IF NOT EXISTS` 确保如果字段已存在不会报错
- `DEFAULT NOW()` 确保新插入的记录自动设置时间
- 已有数据会设置为当前时间（NOW()）

完成！现在 RPC 函数可以使用 `ORDER BY created_at DESC` 了。

