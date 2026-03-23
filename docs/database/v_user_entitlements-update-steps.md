# v_user_entitlements 视图更新操作步骤（方案1）

## 概述

方案1是扩展现有视图，添加所有新的 AI 功能类型配额字段，同时保留旧的 `quota_ai_generations` 字段以保持向后兼容。

## 操作步骤

### 步骤 1: 执行视图更新 SQL（已修复）

在 Supabase Dashboard 的 SQL Editor 中，直接执行以下完整 SQL：

```sql
-- 更新后的 v_user_entitlements 视图
-- 支持所有 AI 功能类型的配额查询
-- 保持向后兼容，保留旧的 quota_ai_generations 字段

-- 第一步：删除备份视图（如果存在，因为它依赖原视图）
DROP VIEW IF EXISTS public.v_user_entitlements_backup CASCADE;

-- 第二步：删除旧视图
DROP VIEW IF EXISTS public.v_user_entitlements CASCADE;

-- 第三步：创建新视图
CREATE VIEW
  "public"."v_user_entitlements" AS
SELECT
  s.user_id,
  p.name AS plan_name,
  p.id AS plan_id,
  s.status AS subscription_status,
  s.current_period_end,
  
  -- 1. 功能开关 (Feature Flags)
  COALESCE((p.limits->>'feature_community')::boolean, false) AS can_access_community,
  COALESCE((p.limits->>'feature_discover')::boolean, false) AS can_access_discover,
  
  -- 2. 旧的统一 AI 生成额度（向后兼容）
  COALESCE((p.limits->>'quota_ai_generations')::int, 0) AS quota_ai_limit,
  COALESCE(u_ai.count, 0) AS quota_ai_used,
  CASE
    WHEN (p.limits->>'quota_ai_generations')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_generations')::int - COALESCE(u_ai.count, 0))
  END AS quota_ai_remaining,
  
  -- 3. 文本生成配额
  COALESCE((p.limits->>'quota_ai_text_generation')::int, 0) AS quota_ai_text_generation_limit,
  COALESCE(u_text.count, 0) AS quota_ai_text_generation_used,
  CASE
    WHEN (p.limits->>'quota_ai_text_generation')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_text_generation')::int - COALESCE(u_text.count, 0))
  END AS quota_ai_text_generation_remaining,
  
  -- 4. 图片生成配额
  COALESCE((p.limits->>'quota_ai_image_generation')::int, 0) AS quota_ai_image_generation_limit,
  COALESCE(u_image.count, 0) AS quota_ai_image_generation_used,
  CASE
    WHEN (p.limits->>'quota_ai_image_generation')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_image_generation')::int - COALESCE(u_image.count, 0))
  END AS quota_ai_image_generation_remaining,
  
  -- 5. 对话聊天配额
  COALESCE((p.limits->>'quota_ai_chat')::int, 0) AS quota_ai_chat_limit,
  COALESCE(u_chat.count, 0) AS quota_ai_chat_used,
  CASE
    WHEN (p.limits->>'quota_ai_chat')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_chat')::int - COALESCE(u_chat.count, 0))
  END AS quota_ai_chat_remaining,
  
  -- 6. 活动规划配额
  COALESCE((p.limits->>'quota_ai_planning')::int, 0) AS quota_ai_planning_limit,
  COALESCE(u_planning.count, 0) AS quota_ai_planning_used,
  CASE
    WHEN (p.limits->>'quota_ai_planning')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_planning')::int - COALESCE(u_planning.count, 0))
  END AS quota_ai_planning_remaining,
  
  -- 7. 事件导入配额
  COALESCE((p.limits->>'quota_ai_import')::int, 0) AS quota_ai_import_limit,
  COALESCE(u_import.count, 0) AS quota_ai_import_used,
  CASE
    WHEN (p.limits->>'quota_ai_import')::int = -1 THEN -1
    ELSE GREATEST(0, (p.limits->>'quota_ai_import')::int - COALESCE(u_import.count, 0))
  END AS quota_ai_import_remaining

FROM
  subscriptions s
  INNER JOIN plans p ON s.plan_id = p.id
  -- 旧的统一配额使用量（向后兼容）
  LEFT JOIN usages u_ai ON s.user_id = u_ai.user_id
    AND u_ai.feature_key = 'quota_ai_generations'
  -- 文本生成使用量
  LEFT JOIN usages u_text ON s.user_id = u_text.user_id
    AND u_text.feature_key = 'quota_ai_text_generation'
  -- 图片生成使用量
  LEFT JOIN usages u_image ON s.user_id = u_image.user_id
    AND u_image.feature_key = 'quota_ai_image_generation'
  -- 对话聊天使用量
  LEFT JOIN usages u_chat ON s.user_id = u_chat.user_id
    AND u_chat.feature_key = 'quota_ai_chat'
  -- 活动规划使用量
  LEFT JOIN usages u_planning ON s.user_id = u_planning.user_id
    AND u_planning.feature_key = 'quota_ai_planning'
  -- 事件导入使用量
  LEFT JOIN usages u_import ON s.user_id = u_import.user_id
    AND u_import.feature_key = 'quota_ai_import'
WHERE
  s.status = 'active'
  AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- 第四步：重新创建备份视图（可选）
CREATE OR REPLACE VIEW v_user_entitlements_backup AS
SELECT * FROM v_user_entitlements;
```

### 步骤 2: 验证视图更新

执行以下查询验证视图是否正确更新：

```sql
-- 1. 检查视图是否存在新字段
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'v_user_entitlements'
  AND column_name LIKE 'quota_ai%'
ORDER BY column_name;

-- 应该能看到以下新字段：
-- quota_ai_chat_limit, quota_ai_chat_remaining, quota_ai_chat_used
-- quota_ai_image_generation_limit, quota_ai_image_generation_remaining, quota_ai_image_generation_used
-- quota_ai_import_limit, quota_ai_import_remaining, quota_ai_import_used
-- quota_ai_planning_limit, quota_ai_planning_remaining, quota_ai_planning_used
-- quota_ai_text_generation_limit, quota_ai_text_generation_remaining, quota_ai_text_generation_used

-- 2. 测试查询（使用真实用户 ID）
SELECT 
  user_id,
  plan_name,
  -- 旧的统一配额（向后兼容）
  quota_ai_limit,
  quota_ai_used,
  quota_ai_remaining,
  -- 新的文本生成配额
  quota_ai_text_generation_limit,
  quota_ai_text_generation_used,
  quota_ai_text_generation_remaining,
  -- 新的对话聊天配额
  quota_ai_chat_limit,
  quota_ai_chat_used,
  quota_ai_chat_remaining
FROM v_user_entitlements
LIMIT 1;
```

### 步骤 3: 更新 plans 表的 limits 字段

为每个套餐添加新的配额配置：

```sql
-- 查看当前套餐
SELECT id, name, limits FROM plans;

-- 更新套餐，添加新的配额字段
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
```

## 关键修复说明

### 问题 1: 列顺序错误
**原因**：`CREATE OR REPLACE VIEW` 不能改变列顺序  
**解决**：使用 `DROP VIEW` + `CREATE VIEW`

### 问题 2: 依赖关系错误
**原因**：备份视图依赖原视图  
**解决**：先删除备份视图，使用 `CASCADE` 选项

## 操作清单

- [x] 步骤 1：执行视图更新 SQL（已修复依赖问题）
- [ ] 步骤 2：验证新字段是否存在
- [ ] 步骤 3：更新 plans 表的 limits 字段，添加新配额配置
- [ ] 步骤 4：测试查询功能

## 注意事项

1. **使用 CASCADE**：`DROP VIEW ... CASCADE` 会删除所有依赖该视图的对象，包括备份视图
2. **短暂中断**：删除和重建视图期间，依赖该视图的查询会短暂失败（通常几秒内完成）
3. **备份视图**：更新完成后会重新创建备份视图

## 完整 SQL 文件位置

完整 SQL 已保存在：`docs/database/sql/11.v_user_entitlements_updated.sql`

可以直接复制该文件内容到 Supabase SQL Editor 执行。
