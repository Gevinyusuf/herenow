# RPC 函数创建和配置完整指南

## 概述

本指南将一步一步教你如何创建和配置 `check_and_increment_quota` RPC 函数，用于原子性地检查和扣减 AI 配额。

## 前置检查

### 步骤 1: 检查现有表结构

在 Supabase Dashboard 的 SQL Editor 中执行以下查询，确认表结构：

```sql
-- 1. 检查 usages 表是否存在
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usages'
ORDER BY ordinal_position;

-- 应该看到：
-- user_id (uuid)
-- feature_key (text)
-- count (integer)
-- updated_at (timestamptz)

-- 2. 检查 subscriptions 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- 3. 检查 plans 表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plans'
ORDER BY ordinal_position;
```

### 步骤 2: 检查是否已有 RPC 函数

```sql
-- 检查是否已存在 check_and_increment_quota 函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_and_increment_quota';
```

如果已存在，我们需要更新它；如果不存在，我们需要创建它。

## 创建/更新 RPC 函数

### 步骤 3: 创建或更新 RPC 函数

在 Supabase Dashboard 的 SQL Editor 中执行以下完整 SQL：

```sql
-- 创建或更新 check_and_increment_quota RPC 函数
-- 支持从 plans.limits JSONB 读取配额配置

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
```

### 步骤 4: 验证函数创建成功

```sql
-- 检查函数是否创建成功
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'check_and_increment_quota';

-- 应该返回一行记录
```

## 测试 RPC 函数

### 步骤 5: 准备测试数据

在测试前，确保有测试数据：

```sql
-- 1. 查看现有套餐
SELECT id, name, limits FROM plans;

-- 2. 查看现有订阅
SELECT user_id, plan_id, status FROM subscriptions WHERE status = 'active' LIMIT 1;

-- 3. 查看现有使用量
SELECT user_id, feature_key, count FROM usages LIMIT 5;
```

### 步骤 6: 测试 RPC 函数

```sql
-- 测试 1: 使用真实的用户 ID 和 feature_key 测试
-- 替换 'your-user-id' 为真实的用户 UUID
-- 替换 'your-plan-id' 为套餐 ID（如 'free', 'pro'）

-- 首先确保用户有套餐
SELECT user_id, plan_id FROM subscriptions WHERE status = 'active' LIMIT 1;

-- 然后测试 RPC 函数
SELECT check_and_increment_quota(
  'your-user-id'::uuid,  -- 替换为真实用户 ID
  'quota_ai_text_generation',
  1
);

-- 应该返回 true 或 false
-- true: 配额足够，已成功扣减
-- false: 配额不足或用户没有套餐
```

### 步骤 7: 验证配额扣减

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

## 配置套餐配额

### 步骤 8: 在 plans 表中配置配额

确保每个套餐的 `limits` 字段包含所有 AI 功能的配额：

```sql
-- 查看当前套餐配置
SELECT id, name, limits FROM plans;

-- 更新免费套餐（示例）
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

-- 更新专业套餐（示例）
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
WHERE id = 'pro';  -- 替换为你的套餐 ID

-- 验证更新
SELECT id, name, limits FROM plans;
```

## 完整测试流程

### 步骤 9: 端到端测试

```sql
-- 1. 获取一个测试用户 ID
SELECT user_id, plan_id 
FROM subscriptions 
WHERE status = 'active' 
LIMIT 1;

-- 2. 查看该用户的当前配额配置
SELECT 
  p.id as plan_id,
  p.name as plan_name,
  p.limits->'quota_ai_text_generation' as text_gen_limit,
  p.limits->'quota_ai_chat' as chat_limit
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.user_id = 'your-user-id'::uuid
  AND s.status = 'active';

-- 3. 查看当前使用量
SELECT feature_key, count 
FROM usages 
WHERE user_id = 'your-user-id'::uuid
  AND feature_key IN ('quota_ai_text_generation', 'quota_ai_chat');

-- 4. 测试扣减配额
SELECT check_and_increment_quota(
  'your-user-id'::uuid,
  'quota_ai_text_generation',
  1
) as result;

-- 5. 再次查看使用量（应该增加了）
SELECT feature_key, count 
FROM usages 
WHERE user_id = 'your-user-id'::uuid
  AND feature_key = 'quota_ai_text_generation';

-- 6. 测试配额不足的情况
-- 先手动设置使用量接近上限
UPDATE usages
SET count = 99  -- 假设上限是 100
WHERE user_id = 'your-user-id'::uuid
  AND feature_key = 'quota_ai_text_generation';

-- 再次调用（应该返回 false）
SELECT check_and_increment_quota(
  'your-user-id'::uuid,
  'quota_ai_text_generation',
  1
) as result;  -- 应该返回 false
```

## 权限配置

### 步骤 10: 配置函数权限（如果需要）

```sql
-- 允许认证用户调用此函数
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO authenticated;

-- 如果需要服务角色调用（后端使用）
GRANT EXECUTE ON FUNCTION public.check_and_increment_quota(uuid, text, int) 
TO service_role;
```

## 常见问题排查

### 问题 1: 函数返回 false，但配额应该足够

**检查清单**：
```sql
-- 1. 检查用户是否有活跃订阅
SELECT * FROM subscriptions 
WHERE user_id = 'your-user-id'::uuid AND status = 'active';

-- 2. 检查套餐配置中是否有该配额字段
SELECT id, limits->'quota_ai_text_generation' 
FROM plans 
WHERE id = 'your-plan-id';

-- 3. 检查当前使用量
SELECT * FROM usages 
WHERE user_id = 'your-user-id'::uuid 
  AND feature_key = 'quota_ai_text_generation';
```

### 问题 2: 函数执行报错

**检查**：
```sql
-- 查看函数定义
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'check_and_increment_quota';

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('usages', 'subscriptions', 'plans');
```

### 问题 3: 并发测试

```sql
-- 模拟并发请求（在多个 SQL 窗口中同时执行）
-- 窗口 1
SELECT check_and_increment_quota('user-id'::uuid, 'quota_ai_text_generation', 1);

-- 窗口 2（同时执行）
SELECT check_and_increment_quota('user-id'::uuid, 'quota_ai_text_generation', 1);

-- 检查最终使用量（应该只增加 2，不会超支）
SELECT count FROM usages 
WHERE user_id = 'user-id'::uuid 
  AND feature_key = 'quota_ai_text_generation';
```

## 操作清单

- [ ] 步骤 1: 检查现有表结构
- [ ] 步骤 2: 检查是否已有 RPC 函数
- [ ] 步骤 3: 创建/更新 RPC 函数
- [ ] 步骤 4: 验证函数创建成功
- [ ] 步骤 5: 准备测试数据
- [ ] 步骤 6: 测试 RPC 函数
- [ ] 步骤 7: 验证配额扣减
- [ ] 步骤 8: 在 plans 表中配置配额
- [ ] 步骤 9: 端到端测试
- [ ] 步骤 10: 配置函数权限（如果需要）

## 下一步

完成 RPC 函数配置后：
1. 后端代码已经准备好调用这个函数
2. 可以开始测试 AI 功能
3. 可以开始前端集成

## 完整 SQL 文件

所有 SQL 已保存在：`docs/database/sql/10.check_and_increment_quota.sql`

可以直接复制执行。

