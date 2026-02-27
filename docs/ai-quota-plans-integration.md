# AI 配额与套餐集成说明

## 概述

AI 配额配置存储在 `plans` 表的 `limits` 字段（JSONB 类型）中，用户通过订阅套餐来获得相应的配额。

## 数据库结构

### plans 表

```sql
CREATE TABLE public.plans (
  id text NOT NULL,
  name text NULL,
  limits jsonb NULL
);

ALTER TABLE public.plans
ADD CONSTRAINT plans_pkey PRIMARY KEY (id);
```

### limits 字段结构

`limits` 字段存储 JSON 格式的配额配置，示例：

```json
{
  "quota_ai_text_generation": 100,
  "quota_ai_image_generation": 50,
  "quota_ai_chat": 200,
  "quota_ai_planning": 50,
  "quota_ai_import": 20
}
```

**特殊值说明**：
- 正整数：表示配额上限
- `-1`：表示无限配额
- `0`：表示无配额

### 用户套餐关联

需要建立用户与套餐的关联关系，可以通过以下方式之一：

#### 方式 1: user_subscriptions 表（推荐）

```sql
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  plan_id text NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',  -- active, cancelled, expired
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
```

#### 方式 2: users 表直接关联

```sql
ALTER TABLE public.users 
ADD COLUMN plan_id text REFERENCES public.plans(id);
```

#### 方式 3: profiles 表关联

```sql
ALTER TABLE public.profiles 
ADD COLUMN plan_id text REFERENCES public.plans(id);
```

### 配额使用记录表

需要记录用户已使用的配额，建议创建 `user_quota_usage` 表：

```sql
CREATE TABLE public.user_quota_usage (
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  used integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, feature_key)
);

CREATE INDEX idx_user_quota_usage_user_id ON public.user_quota_usage(user_id);
```

或者使用现有的 `check_and_increment_quota` RPC 函数来管理使用量。

## 套餐配置示例

### 免费套餐

```sql
INSERT INTO public.plans (id, name, limits) VALUES (
  'free',
  '免费套餐',
  '{
    "quota_ai_text_generation": 10,
    "quota_ai_image_generation": 5,
    "quota_ai_chat": 20,
    "quota_ai_planning": 5,
    "quota_ai_import": 2
  }'::jsonb
);
```

### 专业套餐

```sql
INSERT INTO public.plans (id, name, limits) VALUES (
  'pro',
  '专业套餐',
  '{
    "quota_ai_text_generation": 100,
    "quota_ai_image_generation": 50,
    "quota_ai_chat": 200,
    "quota_ai_planning": 50,
    "quota_ai_import": 20
  }'::jsonb
);
```

### 企业套餐

```sql
INSERT INTO public.plans (id, name, limits) VALUES (
  'enterprise',
  '企业套餐',
  '{
    "quota_ai_text_generation": -1,
    "quota_ai_image_generation": 500,
    "quota_ai_chat": -1,
    "quota_ai_planning": 200,
    "quota_ai_import": 100
  }'::jsonb
);
```

## 配额查询流程

```
用户请求配额信息
    ↓
获取用户当前套餐 ID
    ↓
从 plans 表读取 limits JSONB
    ↓
提取对应 feature_key 的配额上限 (total)
    ↓
从 user_quota_usage 表查询已使用量 (used)
    ↓
计算剩余配额 (remaining = total - used)
    ↓
返回配额信息
```

## 配额验证流程

```
用户请求 AI 功能
    ↓
获取用户当前套餐
    ↓
从 plans.limits 读取配额上限
    ↓
查询已使用配额
    ↓
检查配额是否足够
    ↓
调用 check_and_increment_quota RPC
    ↓
原子性地扣减配额
```

## 代码实现

系统已自动支持从 `plans` 表读取配额配置：

1. **自动检测用户套餐**：支持多种表结构（user_subscriptions, users, profiles）
2. **从 limits JSONB 读取**：自动解析 JSON 并提取对应功能的配额
3. **查询使用量**：支持多种方式查询已使用的配额

## 更新套餐配额

### 修改套餐配额

```sql
-- 更新专业套餐的文本生成配额
UPDATE public.plans
SET limits = jsonb_set(
  limits,
  '{quota_ai_text_generation}',
  '200'
)
WHERE id = 'pro';
```

### 添加新的配额类型

```sql
-- 为所有套餐添加新功能配额
UPDATE public.plans
SET limits = jsonb_set(
  limits,
  '{quota_ai_new_feature}',
  '50'
)
WHERE limits IS NOT NULL;
```

## 配额重置

### 按周期重置使用量

```sql
-- 每月重置所有用户的配额使用量
UPDATE public.user_quota_usage
SET used = 0,
    updated_at = now()
WHERE feature_key LIKE 'quota_ai_%';
```

### 按套餐周期重置

```sql
-- 根据用户订阅周期重置
UPDATE public.user_quota_usage uqu
SET used = 0,
    updated_at = now()
FROM public.user_subscriptions us
WHERE uqu.user_id = us.user_id
  AND us.status = 'active'
  AND DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', us.renewal_date);
```

## 迁移现有数据

如果之前使用 `user_quotas` 表存储配额，可以迁移到套餐系统：

```sql
-- 1. 创建默认套餐
INSERT INTO public.plans (id, name, limits)
SELECT 
  'default',
  '默认套餐',
  jsonb_object_agg(feature_key, total)
FROM (
  SELECT DISTINCT feature_key, MAX(total) as total
  FROM user_quotas
  GROUP BY feature_key
) t;

-- 2. 为用户分配默认套餐
UPDATE public.users
SET plan_id = 'default'
WHERE plan_id IS NULL;

-- 3. 迁移使用量数据（如果需要）
INSERT INTO public.user_quota_usage (user_id, feature_key, used)
SELECT user_id, feature_key, used
FROM user_quotas
ON CONFLICT (user_id, feature_key) DO NOTHING;
```

## 最佳实践

1. **套餐设计**：
   - 免费套餐：提供基础配额，吸引用户
   - 专业套餐：提供充足配额，满足日常需求
   - 企业套餐：提供高配额或无限配额

2. **配额分配**：
   - 根据功能成本分配配额
   - 文本生成：成本低，配额可设置较高
   - 图片生成：成本高，配额设置较低
   - 对话聊天：高频使用，配额设置较高

3. **配额监控**：
   - 定期检查配额使用情况
   - 设置使用率告警（>80%）
   - 记录配额使用日志

4. **升级路径**：
   - 提供清晰的套餐对比
   - 支持套餐升级
   - 支持临时增加配额

