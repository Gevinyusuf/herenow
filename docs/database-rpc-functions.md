# 数据库 RPC 函数说明

## check_and_increment_quota

用于原子性地检查并扣减用户配额。

### 函数签名

```sql
CREATE OR REPLACE FUNCTION check_and_increment_quota(
    p_user_id UUID,
    p_feature_key TEXT,
    p_delta INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_plan_id TEXT;
    v_limits JSONB;
    v_total INTEGER;
    v_used INTEGER;
    v_remaining INTEGER;
BEGIN
    -- 1. 获取用户当前套餐
    SELECT plan_id INTO v_plan_id
    FROM user_subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 如果没有找到，尝试从 users 表查询
    IF v_plan_id IS NULL THEN
        SELECT plan_id INTO v_plan_id
        FROM users
        WHERE id = p_user_id;
    END IF;
    
    -- 如果没有套餐，返回 false
    IF v_plan_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 2. 从 plans 表读取配额上限
    SELECT limits INTO v_limits
    FROM plans
    WHERE id = v_plan_id;
    
    IF v_limits IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 3. 获取该功能的配额上限
    v_total := COALESCE((v_limits->>p_feature_key)::INTEGER, 0);
    
    -- 如果配额为 -1，表示无限配额，直接允许
    IF v_total = -1 THEN
        -- 更新使用量（可选，用于统计）
        INSERT INTO user_quota_usage (user_id, feature_key, used, updated_at)
        VALUES (p_user_id, p_feature_key, p_delta, NOW())
        ON CONFLICT (user_id, feature_key)
        DO UPDATE SET 
            used = user_quota_usage.used + p_delta,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- 4. 获取当前已使用量
    SELECT COALESCE(used, 0) INTO v_used
    FROM user_quota_usage
    WHERE user_id = p_user_id AND feature_key = p_feature_key;
    
    -- 5. 检查配额是否足够
    v_remaining := v_total - v_used;
    
    IF v_remaining < p_delta THEN
        RETURN FALSE;  -- 配额不足
    END IF;
    
    -- 6. 原子性地增加使用量
    INSERT INTO user_quota_usage (user_id, feature_key, used, updated_at)
    VALUES (p_user_id, p_feature_key, v_used + p_delta, NOW())
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET 
        used = user_quota_usage.used + p_delta,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;
```

### 使用示例

```sql
-- 检查并扣减配额
SELECT check_and_increment_quota(
    'user-uuid'::UUID,
    'quota_ai_text_generation',
    1
);
```

### 注意事项

1. **原子性**：函数使用数据库事务保证原子性操作
2. **并发安全**：使用 `ON CONFLICT` 处理并发更新
3. **无限配额**：如果 `total = -1`，直接允许并更新使用量（用于统计）
4. **套餐变更**：如果用户更换套餐，需要重置使用量或按周期重置

## 创建 user_quota_usage 表

如果还没有创建配额使用记录表，可以使用以下 SQL：

```sql
CREATE TABLE IF NOT EXISTS public.user_quota_usage (
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_user_quota_usage_user_id 
ON public.user_quota_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_user_quota_usage_feature_key 
ON public.user_quota_usage(feature_key);
```

## 配额重置函数

如果需要按周期重置配额，可以创建以下函数：

```sql
CREATE OR REPLACE FUNCTION reset_user_quotas_by_cycle(
    p_cycle_type TEXT DEFAULT 'monthly'  -- monthly, weekly, daily
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_reset_date TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    -- 根据周期类型计算重置日期
    IF p_cycle_type = 'monthly' THEN
        v_reset_date := DATE_TRUNC('month', CURRENT_DATE);
    ELSIF p_cycle_type = 'weekly' THEN
        v_reset_date := DATE_TRUNC('week', CURRENT_DATE);
    ELSIF p_cycle_type = 'daily' THEN
        v_reset_date := DATE_TRUNC('day', CURRENT_DATE);
    ELSE
        RAISE EXCEPTION 'Invalid cycle type: %', p_cycle_type;
    END IF;
    
    -- 重置所有用户的配额使用量
    UPDATE user_quota_usage
    SET used = 0,
        updated_at = NOW()
    WHERE updated_at < v_reset_date;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$;
```

## 迁移现有数据

如果之前使用其他方式存储配额，可以使用以下 SQL 迁移：

```sql
-- 从 user_quotas 表迁移到 user_quota_usage 表
INSERT INTO user_quota_usage (user_id, feature_key, used)
SELECT user_id, feature_key, used
FROM user_quotas
WHERE feature_key LIKE 'quota_ai_%'
ON CONFLICT (user_id, feature_key) DO NOTHING;
```

