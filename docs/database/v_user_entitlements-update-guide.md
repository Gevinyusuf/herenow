# v_user_entitlements 视图更新指南

## 概述

`v_user_entitlements` 视图用于记录和查询用户的配额使用情况。现在需要更新它以支持所有 AI 功能类型的独立配额。

## 当前视图结构

当前视图只支持统一的 `quota_ai_generations` 配额，需要扩展以支持：
- `quota_ai_text_generation` - 文本生成
- `quota_ai_image_generation` - 图片生成
- `quota_ai_chat` - 对话聊天
- `quota_ai_planning` - 活动规划
- `quota_ai_import` - 事件导入

## 更新方案

### 方案 1: 扩展现有视图（保持向后兼容）

在现有视图中添加所有新字段，保持旧的 `quota_ai_generations` 字段以向后兼容。

**优点**：
- 向后兼容，不影响现有代码
- 所有配额信息在一行中

**缺点**：
- 视图字段较多
- 查询特定功能时需要过滤

**SQL 文件**: `docs/database/sql/11.v_user_entitlements_updated.sql`

### 方案 2: 创建新视图（推荐）

创建一个新的视图 `v_user_entitlements_by_feature`，每个 AI 功能类型返回一行记录。

**优点**：
- 结构清晰，易于查询
- 便于扩展新功能类型
- 查询特定功能更方便

**缺点**：
- 需要更新使用该视图的代码

**SQL 文件**: `docs/database/sql/11.v_user_entitlements_by_feature.sql`

## 前提条件

视图依赖以下表结构：

### 1. subscriptions 表

```sql
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. plans 表

```sql
CREATE TABLE public.plans (
  id text NOT NULL PRIMARY KEY,
  name text NULL,
  limits jsonb NULL  -- 存储配额配置
);
```

### 3. usages 表（记录使用量）

```sql
CREATE TABLE public.usages (
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, feature_key)
);
```

## 更新步骤

### 步骤 1: 备份现有视图

```sql
-- 备份现有视图定义
CREATE VIEW v_user_entitlements_backup AS
SELECT * FROM v_user_entitlements;
```

### 步骤 2: 选择更新方案

#### 使用方案 1（扩展现有视图）

```sql
-- 执行更新脚本
\i docs/database/sql/11.v_user_entitlements_updated.sql
```

#### 使用方案 2（创建新视图）

```sql
-- 创建新视图
\i docs/database/sql/11.v_user_entitlements_by_feature.sql
```

### 步骤 3: 验证更新

```sql
-- 测试查询
SELECT * FROM v_user_entitlements WHERE user_id = 'your-user-id';

-- 或使用新视图
SELECT * FROM v_user_entitlements_by_feature WHERE user_id = 'your-user-id';
```

### 步骤 4: 更新相关代码

如果使用方案 2，需要更新以下代码：

1. **后端代码** (`apps/api-gateway/core/ai/dependencies.py`)
   - 已自动支持从 `plans.limits` 读取，无需修改

2. **前端代码** (`apps/frontend/hooks/useEntitlements.ts`)
   - 如果使用新视图，需要更新查询逻辑

## 使用示例

### 查询用户所有配额（方案 1）

```sql
SELECT 
  user_id,
  plan_name,
  quota_ai_text_generation_limit,
  quota_ai_text_generation_used,
  quota_ai_text_generation_remaining,
  quota_ai_chat_limit,
  quota_ai_chat_used,
  quota_ai_chat_remaining
FROM v_user_entitlements
WHERE user_id = 'user-uuid';
```

### 查询用户所有配额（方案 2 - 推荐）

```sql
SELECT 
  feature_key,
  feature_name,
  quota_limit,
  quota_used,
  quota_remaining,
  is_unlimited
FROM v_user_entitlements_by_feature
WHERE user_id = 'user-uuid'
ORDER BY feature_key;
```

### 查询特定功能的配额

```sql
SELECT 
  quota_limit,
  quota_used,
  quota_remaining,
  is_unlimited
FROM v_user_entitlements_by_feature
WHERE user_id = 'user-uuid' 
  AND feature_key = 'quota_ai_text_generation';
```

## 注意事项

1. **日期重置逻辑**：视图中的 `updated_at::date < CURRENT_DATE` 用于每日重置配额。如果需要按月重置，需要修改为：
   ```sql
   WHEN DATE_TRUNC('month', u.updated_at) < DATE_TRUNC('month', CURRENT_DATE) THEN 0
   ```

2. **无限配额**：`-1` 表示无限配额，视图中返回 `999999` 作为剩余配额显示。

3. **性能优化**：如果 `usages` 表数据量大，建议添加索引：
   ```sql
   CREATE INDEX idx_usages_user_feature ON usages(user_id, feature_key);
   CREATE INDEX idx_usages_updated_at ON usages(updated_at);
   ```

4. **向后兼容**：方案 1 保留了 `quota_ai_generations` 字段，确保现有代码继续工作。

## 迁移检查清单

- [ ] 备份现有视图定义
- [ ] 确认所有依赖表存在
- [ ] 执行视图更新 SQL
- [ ] 验证视图查询结果
- [ ] 更新相关代码（如果使用方案 2）
- [ ] 测试配额查询功能
- [ ] 测试配额扣减功能
- [ ] 更新文档

