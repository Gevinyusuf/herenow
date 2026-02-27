# RPC 函数创建和配置 - 一步一步操作指南

## 📋 操作步骤总览

1. ✅ 检查现有表结构
2. ✅ 检查是否已有 RPC 函数
3. ✅ 创建/更新 RPC 函数
4. ✅ 验证函数创建成功
5. ✅ 配置套餐配额
6. ✅ 测试函数功能

---

## 步骤 1: 检查现有表结构

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 1.1 检查 usages 表
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'usages'
ORDER BY ordinal_position;

-- 应该看到：
-- id (bigint)
-- user_id (uuid)
-- feature_key (text)
-- count (integer)
-- updated_at (timestamptz)
```

```sql
-- 1.2 检查 subscriptions 表
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 应该看到：
-- user_id (uuid)
-- plan_id (text)
-- status (text)
-- created_at (timestamptz)
-- current_period_end (timestamptz)
```

```sql
-- 1.3 检查 plans 表
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'plans'
ORDER BY ordinal_position;

-- 应该看到：
-- id (text)
-- name (text)
-- limits (jsonb)
```

**如果表不存在，需要先创建表。**（通常这些表应该已经存在）

---

## 步骤 2: 检查是否已有 RPC 函数

```sql
-- 检查是否已存在 check_and_increment_quota 函数
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_and_increment_quota';
```

**结果说明**：
- 如果返回空：需要创建新函数
- 如果返回一行：需要更新现有函数（使用 `CREATE OR REPLACE`）

---

## 步骤 3: 创建/更新 RPC 函数

### 方式 A: 如果函数不存在（创建新函数）

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
CREATE FUNCTION public.check_and_increment_quota(
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
  ORDER BY created_at DESC
  LIMIT 1;

  IF user_plan_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- 2. 从 plans.limits JSONB 读取配额上限
  SELECT (limits->>p_feature_key)::int INTO feature_limit 
  FROM plans 
  WHERE id = user_plan_id;
  
  -- 如果 limits 中没有该字段，返回 false
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

### 方式 B: 如果函数已存在（更新函数）

使用 `CREATE OR REPLACE`（推荐，更安全）：

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
  -- 1. 获取用户当前的 Plan ID
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

  -- 5. 锁定行并获取当前使用量
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

---

## 步骤 4: 配置函数权限

执行以下 SQL 允许后端调用：

```sql
-- 允许认证用户调用
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO authenticated;

-- 允许服务角色调用（后端使用）
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO service_role;
```

---

## 步骤 5: 验证函数创建成功

```sql
-- 5.1 检查函数是否存在
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_and_increment_quota';

-- 应该返回一行记录

-- 5.2 查看函数定义（可选）
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'check_and_increment_quota';
```

---

## 步骤 6: 配置套餐配额

确保 plans 表的 limits 字段包含所有 AI 功能的配额：

```sql
-- 6.1 查看当前套餐
SELECT id, name, limits FROM plans;

-- 6.2 更新套餐配额（替换 'your-plan-id' 为实际套餐 ID）
-- 示例：更新免费套餐
UPDATE plans
SET limits = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(limits, '{}'::jsonb),
          '{quota_ai_text_generation}',
          '10'
        ),
        '{quota_ai_image_generation}',
        '5'
      ),
      '{quota_ai_chat}',
      '20'
    ),
    '{quota_ai_planning}',
    '5'
  ),
  '{quota_ai_import}',
  '2'
)
WHERE id = 'free';  -- 替换为你的套餐 ID

-- 6.3 验证更新
SELECT id, name, limits FROM plans WHERE id = 'free';
```

---

## 步骤 7: 测试 RPC 函数

### 7.1 准备测试数据

```sql
-- 获取一个测试用户 ID 和套餐
SELECT 
  s.user_id,
  s.plan_id,
  p.name as plan_name
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
LIMIT 1;

-- 记录下 user_id 和 plan_id，用于后续测试
```

### 7.2 测试函数调用

```sql
-- 替换 'your-user-id' 为真实的用户 UUID
-- 测试扣减文本生成配额
SELECT check_and_increment_quota(
  'your-user-id'::uuid,  -- 替换为真实用户 ID
  'quota_ai_text_generation',
  1
) as result;

-- 结果说明：
-- true: 配额足够，已成功扣减 ✅
-- false: 配额不足或用户没有套餐 ❌
```

### 7.3 验证配额扣减

```sql
-- 查看使用量是否增加
SELECT 
  user_id,
  feature_key,
  count,
  updated_at
FROM usages
WHERE user_id = 'your-user-id'::uuid
  AND feature_key = 'quota_ai_text_generation';

-- count 应该增加了 1
```

### 7.4 测试配额不足的情况

```sql
-- 手动设置使用量接近上限
UPDATE usages
SET count = 9  -- 假设上限是 10
WHERE user_id = 'your-user-id'::uuid
  AND feature_key = 'quota_ai_text_generation';

-- 再次调用（应该返回 false）
SELECT check_and_increment_quota(
  'your-user-id'::uuid,
  'quota_ai_text_generation',
  1
) as result;  -- 应该返回 false

-- 恢复使用量
UPDATE usages
SET count = 0
WHERE user_id = 'your-user-id'::uuid
  AND feature_key = 'quota_ai_text_generation';
```

---

## 步骤 8: 测试所有 AI 功能类型

```sql
-- 测试所有 AI 功能类型的配额扣减
SELECT 
  check_and_increment_quota('your-user-id'::uuid, 'quota_ai_text_generation', 1) as text_gen,
  check_and_increment_quota('your-user-id'::uuid, 'quota_ai_image_generation', 1) as image_gen,
  check_and_increment_quota('your-user-id'::uuid, 'quota_ai_chat', 1) as chat,
  check_and_increment_quota('your-user-id'::uuid, 'quota_ai_planning', 1) as planning,
  check_and_increment_quota('your-user-id'::uuid, 'quota_ai_import', 1) as import;

-- 查看所有使用量
SELECT feature_key, count 
FROM usages 
WHERE user_id = 'your-user-id'::uuid
  AND feature_key LIKE 'quota_ai%'
ORDER BY feature_key;
```

---

## 完整操作清单

- [ ] **步骤 1**: 检查现有表结构（usages, subscriptions, plans）
- [ ] **步骤 2**: 检查是否已有 RPC 函数
- [ ] **步骤 3**: 创建/更新 RPC 函数
- [ ] **步骤 4**: 配置函数权限
- [ ] **步骤 5**: 验证函数创建成功
- [ ] **步骤 6**: 在 plans 表中配置配额
- [ ] **步骤 7**: 测试 RPC 函数功能
- [ ] **步骤 8**: 测试所有 AI 功能类型

---

## 快速执行（一键完成）

如果你想快速完成，可以直接执行以下完整 SQL：

```sql
-- ============================================
-- 一键创建/更新 RPC 函数
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
  SELECT plan_id INTO user_plan_id 
  FROM subscriptions 
  WHERE user_id = p_user_id 
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF user_plan_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT (limits->>p_feature_key)::int INTO feature_limit 
  FROM plans 
  WHERE id = user_plan_id;
  
  IF feature_limit IS NULL THEN
    RETURN false;
  END IF;
  
  IF feature_limit = -1 THEN
    INSERT INTO usages (user_id, feature_key, count, updated_at)
    VALUES (p_user_id, p_feature_key, p_delta, NOW())
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET 
      count = usages.count + p_delta,
      updated_at = NOW();
    RETURN true;
  END IF;

  INSERT INTO usages (user_id, feature_key, count, updated_at)
  VALUES (p_user_id, p_feature_key, 0, NOW())
  ON CONFLICT (user_id, feature_key) DO NOTHING;

  SELECT count INTO current_usage 
  FROM usages 
  WHERE user_id = p_user_id 
    AND feature_key = p_feature_key 
  FOR UPDATE;

  IF current_usage + p_delta > feature_limit THEN
    RETURN false;
  END IF;

  UPDATE usages 
  SET count = count + p_delta,
      updated_at = NOW()
  WHERE user_id = p_user_id 
    AND feature_key = p_feature_key;

  RETURN true;
END;
$$;

-- 配置权限
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO authenticated, service_role;
```

---

## 常见问题

### Q1: 函数返回 false，但配额应该足够

**检查**：
```sql
-- 1. 用户是否有活跃订阅？
SELECT * FROM subscriptions 
WHERE user_id = 'your-user-id'::uuid AND status = 'active';

-- 2. 套餐中是否有该配额配置？
SELECT id, limits->'quota_ai_text_generation' 
FROM plans 
WHERE id = 'your-plan-id';
```

### Q2: 函数执行报错

**检查**：
- 表是否存在（usages, subscriptions, plans）
- 字段名是否正确（count 不是 used）
- 用户 ID 格式是否正确（UUID 格式）

### Q3: 如何重置配额使用量？

```sql
-- 重置单个用户的配额
UPDATE usages 
SET count = 0 
WHERE user_id = 'your-user-id'::uuid;

-- 重置所有用户的配额
UPDATE usages 
SET count = 0 
WHERE feature_key LIKE 'quota_ai%';
```

---

## 完成后的验证

执行以下测试确保一切正常：

```sql
-- 1. 函数存在
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'check_and_increment_quota';

-- 2. 可以调用
SELECT check_and_increment_quota(
  'your-user-id'::uuid,
  'quota_ai_text_generation',
  1
);

-- 3. 使用量更新
SELECT * FROM usages 
WHERE user_id = 'your-user-id'::uuid;
```

完成以上步骤后，RPC 函数就可以正常工作了！🎉

