# v_user_entitlements 视图查询不到数据 - 排查指南

## 问题分析

`v_user_entitlements` 视图查询不到数据，可能有以下几个原因：

## 排查步骤

### 步骤 1: 检查 subscriptions 表是否有数据

```sql
-- 查看 subscriptions 表的所有数据
SELECT * FROM subscriptions;

-- 查看活跃的订阅
SELECT * FROM subscriptions WHERE status = 'active';

-- 统计订阅数量
SELECT 
  status,
  COUNT(*) as count
FROM subscriptions
GROUP BY status;
```

**如果 subscriptions 表为空**：
- 需要先创建订阅记录
- 或者检查是否有触发器自动创建订阅

### 步骤 2: 检查 subscriptions 表的 status 字段

```sql
-- 查看所有不同的 status 值
SELECT DISTINCT status FROM subscriptions;

-- 检查是否有 status = 'active' 的记录
SELECT COUNT(*) 
FROM subscriptions 
WHERE status = 'active';
```

**问题**：如果 status 不是 'active'，视图不会返回数据

**解决**：
```sql
-- 更新 status 为 'active'
UPDATE subscriptions
SET status = 'active'
WHERE status IS NULL OR status != 'active';
```

### 步骤 3: 检查 current_period_end 字段

视图的 WHERE 条件包含：
```sql
WHERE s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
```

如果 `current_period_end` 已过期，视图不会返回数据。

```sql
-- 检查 current_period_end
SELECT 
  user_id,
  plan_id,
  status,
  current_period_end,
  CASE 
    WHEN current_period_end IS NULL THEN '无过期时间'
    WHEN current_period_end > NOW() THEN '未过期'
    ELSE '已过期'
  END as period_status
FROM subscriptions
WHERE status = 'active';

-- 如果有很多已过期的，可以更新
UPDATE subscriptions
SET current_period_end = NULL  -- 或者设置为未来日期
WHERE status = 'active' 
  AND current_period_end < NOW();
```

### 步骤 4: 检查 plans 表是否有对应的套餐

```sql
-- 查看 subscriptions 中的 plan_id
SELECT DISTINCT plan_id FROM subscriptions WHERE status = 'active';

-- 查看 plans 表中的所有套餐
SELECT id, name FROM plans;

-- 检查是否有不匹配的 plan_id
SELECT DISTINCT s.plan_id
FROM subscriptions s
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM plans p WHERE p.id = s.plan_id
  );
```

**如果 plan_id 不匹配**：
- 需要创建对应的套餐
- 或者更新 subscriptions 的 plan_id

### 步骤 5: 简化视图条件进行测试

创建一个简化版本的视图来测试：

```sql
-- 临时测试：查看所有订阅（不限制 status 和 current_period_end）
SELECT 
  s.user_id,
  s.plan_id,
  s.status,
  s.current_period_end,
  p.name as plan_name,
  p.limits
FROM subscriptions s
LEFT JOIN plans p ON s.plan_id = p.id;
```

### 步骤 6: 检查视图定义是否正确

```sql
-- 查看视图定义
SELECT pg_get_viewdef('v_user_entitlements', true);

-- 或者
\d+ v_user_entitlements
```

## 常见问题和解决方案

### 问题 1: subscriptions 表为空

**原因**：用户还没有订阅记录

**解决**：
```sql
-- 为现有用户创建默认订阅
INSERT INTO subscriptions (user_id, plan_id, status, created_at)
SELECT 
  id,
  'free',  -- 或你的默认套餐 ID
  'active',
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;
```

### 问题 2: status 不是 'active'

**解决**：
```sql
-- 更新所有订阅为 active
UPDATE subscriptions
SET status = 'active'
WHERE status IS NULL;
```

### 问题 3: current_period_end 已过期

**解决**：
```sql
-- 清除过期时间或设置为未来
UPDATE subscriptions
SET current_period_end = NULL  -- 或者 NOW() + INTERVAL '1 month'
WHERE status = 'active' 
  AND current_period_end < NOW();
```

### 问题 4: plan_id 在 plans 表中不存在

**解决**：
```sql
-- 创建缺失的套餐
INSERT INTO plans (id, name, limits)
VALUES 
  ('free', '免费套餐', '{"quota_ai_text_generation": 10}'::jsonb),
  ('pro', '专业套餐', '{"quota_ai_text_generation": 100}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 或者更新 subscriptions 的 plan_id
UPDATE subscriptions
SET plan_id = 'free'  -- 替换为存在的套餐 ID
WHERE plan_id NOT IN (SELECT id FROM plans);
```

## 快速诊断 SQL

执行以下 SQL 进行完整诊断：

```sql
-- 完整诊断
SELECT 
  'subscriptions 总数' as check_item,
  COUNT(*) as count
FROM subscriptions

UNION ALL

SELECT 
  'active 订阅数',
  COUNT(*)
FROM subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
  '未过期订阅数',
  COUNT(*)
FROM subscriptions
WHERE status = 'active'
  AND (current_period_end IS NULL OR current_period_end > NOW())

UNION ALL

SELECT 
  '有对应套餐的订阅数',
  COUNT(*)
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW())

UNION ALL

SELECT 
  '视图返回数据数',
  COUNT(*)
FROM v_user_entitlements;
```

## 修复脚本

如果发现问题，可以使用以下脚本修复：

```sql
-- 1. 确保所有用户都有订阅
INSERT INTO subscriptions (user_id, plan_id, status, created_at)
SELECT 
  id,
  'free',  -- 替换为你的默认套餐 ID
  'active',
  NOW()
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. 确保所有订阅都是 active
UPDATE subscriptions
SET status = 'active'
WHERE status IS NULL OR status = '';

-- 3. 清除过期时间（如果需要）
UPDATE subscriptions
SET current_period_end = NULL
WHERE status = 'active' 
  AND current_period_end < NOW();

-- 4. 验证修复结果
SELECT COUNT(*) FROM v_user_entitlements;
```

## 验证修复

修复后，执行以下查询验证：

```sql
-- 应该能看到数据了
SELECT * FROM v_user_entitlements LIMIT 5;

-- 查看特定用户的配额
SELECT 
  user_id,
  plan_name,
  quota_ai_text_generation_limit,
  quota_ai_text_generation_used,
  quota_ai_text_generation_remaining
FROM v_user_entitlements
LIMIT 1;
```

