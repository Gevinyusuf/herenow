# AI 配额配置说明

## 概述

系统支持为不同的 AI 功能类型设置独立的配额限制。每种 AI 功能都有自己独立的配额计数器，互不影响。

## 配额类型映射

当前系统定义了以下 AI 功能类型及其对应的配额 Key：

| AI 功能类型 | 配额 Key | 说明 |
|------------|---------|------|
| `text_generation` | `quota_ai_text_generation` | 文本生成（事件描述等） |
| `image_generation` | `quota_ai_image_generation` | 图片生成（活动封面图） |
| `chat` | `quota_ai_chat` | 对话聊天（AI 助手） |
| `planning` | `quota_ai_planning` | 活动规划建议 |
| `import` | `quota_ai_import` | 事件导入（从 URL/文本/图片） |

## 配额工作原理

### 1. 配额验证流程

```
用户请求 AI 功能
    ↓
根据 AI 类型获取对应的配额 Key
    ↓
调用数据库 RPC 函数 check_and_increment_quota
    ↓
原子性地检查并扣减配额
    ↓
配额足够？
    ├─ 是 → 执行 AI 生成
    └─ 否 → 返回 403 错误
```

### 2. 配额存储

配额信息存储在数据库中，支持两种方式：

#### 方式 1: 使用 `v_user_entitlements` 视图（推荐）

```sql
-- 视图结构示例
CREATE VIEW v_user_entitlements AS
SELECT 
    user_id,
    feature_key,
    used,
    total,
    (total - used) as remaining
FROM user_quotas
WHERE ...
```

#### 方式 2: 直接查询 `user_quotas` 表

```sql
-- 表结构示例
CREATE TABLE user_quotas (
    user_id UUID NOT NULL,
    feature_key VARCHAR(255) NOT NULL,
    used INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, feature_key)
);
```

## 配置不同 AI 类型的配额

### 方法 1: 通过数据库直接设置

为不同用户设置不同的配额值：

```sql
-- 为新用户设置配额
INSERT INTO user_quotas (user_id, feature_key, used, total)
VALUES 
    ('user-uuid-1', 'quota_ai_text_generation', 0, 100),
    ('user-uuid-1', 'quota_ai_image_generation', 0, 50),
    ('user-uuid-1', 'quota_ai_chat', 0, 200),
    ('user-uuid-1', 'quota_ai_planning', 0, 50),
    ('user-uuid-1', 'quota_ai_import', 0, 20);

-- 更新现有用户的配额
UPDATE user_quotas 
SET total = 200 
WHERE user_id = 'user-uuid-1' 
  AND feature_key = 'quota_ai_text_generation';
```

### 方法 2: 通过订阅计划设置

根据用户的订阅计划自动分配配额：

```sql
-- 示例：根据订阅计划设置配额
CREATE OR REPLACE FUNCTION set_user_quotas_by_plan(
    p_user_id UUID,
    p_plan_type VARCHAR
)
RETURNS VOID AS $$
BEGIN
    -- 免费计划
    IF p_plan_type = 'free' THEN
        INSERT INTO user_quotas (user_id, feature_key, used, total)
        VALUES 
            (p_user_id, 'quota_ai_text_generation', 0, 10),
            (p_user_id, 'quota_ai_image_generation', 0, 5),
            (p_user_id, 'quota_ai_chat', 0, 20),
            (p_user_id, 'quota_ai_planning', 0, 5),
            (p_user_id, 'quota_ai_import', 0, 2)
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET total = EXCLUDED.total;
    
    -- 专业计划
    ELSIF p_plan_type = 'pro' THEN
        INSERT INTO user_quotas (user_id, feature_key, used, total)
        VALUES 
            (p_user_id, 'quota_ai_text_generation', 0, 100),
            (p_user_id, 'quota_ai_image_generation', 0, 50),
            (p_user_id, 'quota_ai_chat', 0, 200),
            (p_user_id, 'quota_ai_planning', 0, 50),
            (p_user_id, 'quota_ai_import', 0, 20)
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET total = EXCLUDED.total;
    
    -- 企业计划
    ELSIF p_plan_type = 'enterprise' THEN
        INSERT INTO user_quotas (user_id, feature_key, used, total)
        VALUES 
            (p_user_id, 'quota_ai_text_generation', 0, -1),  -- -1 表示无限
            (p_user_id, 'quota_ai_image_generation', 0, 500),
            (p_user_id, 'quota_ai_chat', 0, -1),
            (p_user_id, 'quota_ai_planning', 0, 200),
            (p_user_id, 'quota_ai_import', 0, 100)
        ON CONFLICT (user_id, feature_key) 
        DO UPDATE SET total = EXCLUDED.total;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 方法 3: 通过管理后台 API

创建管理 API 来设置配额（需要管理员权限）：

```python
@router.post("/admin/users/{user_id}/quotas")
async def set_user_quotas(
    user_id: str,
    quotas: Dict[str, int],
    admin_user: Dict = Depends(verify_admin)
):
    """管理员设置用户配额"""
    for feature_key, total in quotas.items():
        # 更新或插入配额记录
        supabase.table("user_quotas").upsert({
            "user_id": user_id,
            "feature_key": feature_key,
            "total": total,
            "used": 0  # 重置已使用量
        }).execute()
```

## 配额查询

### 查询单个功能的配额

```python
from core.ai.dependencies import get_ai_quota_info

quota_info = await get_ai_quota_info(
    user_id="user-uuid",
    supabase=supabase,
    feature_key="quota_ai_text_generation"
)
# 返回: {"used": 5, "total": 100, "remaining": 95}
```

### 查询所有 AI 功能的配额

```python
from core.ai.dependencies import get_all_ai_quotas

quotas = await get_all_ai_quotas(user_id, supabase)
# 返回: {
#     "quota_ai_text_generation": {"used": 5, "total": 100, "remaining": 95},
#     "quota_ai_chat": {"used": 10, "total": 200, "remaining": 190},
#     ...
# }
```

### 通过 API 查询

```bash
GET /api/v1/ai/quota
Authorization: Bearer <token>
```

## 配额限制说明

### 无限配额

设置 `total = -1` 表示无限配额，系统会跳过配额检查：

```sql
UPDATE user_quotas 
SET total = -1 
WHERE user_id = 'user-uuid' 
  AND feature_key = 'quota_ai_text_generation';
```

### 配额重置

定期重置配额（例如每月重置）：

```sql
-- 每月重置所有用户的配额使用量
UPDATE user_quotas 
SET used = 0 
WHERE feature_key LIKE 'quota_ai_%';
```

或者按用户订阅周期重置：

```sql
-- 根据用户的订阅周期重置
UPDATE user_quotas uq
SET used = 0
FROM user_subscriptions us
WHERE uq.user_id = us.user_id
  AND us.plan_type = 'pro'
  AND us.billing_cycle = 'monthly'
  AND DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', us.renewal_date);
```

## 添加新的 AI 功能类型

如果需要添加新的 AI 功能类型：

1. **在 `dependencies.py` 中添加映射**：

```python
AI_QUOTA_MAPPING = {
    # ... 现有映射
    "new_feature": "quota_ai_new_feature",
}
```

2. **在数据库中创建配额记录**：

```sql
INSERT INTO user_quotas (user_id, feature_key, used, total)
SELECT user_id, 'quota_ai_new_feature', 0, 50
FROM users;
```

3. **更新路由类型定义**：

```python
type: Literal["text_generation", "image_generation", "chat", "planning", "import", "new_feature"]
```

## 最佳实践

1. **配额分配建议**：
   - 文本生成：常用功能，配额可以设置较高（100-500）
   - 图片生成：成本较高，配额设置较低（20-100）
   - 对话聊天：高频使用，配额设置较高（200-1000）
   - 活动规划：低频使用，配额设置中等（50-200）
   - 事件导入：低频使用，配额设置较低（10-50）

2. **配额监控**：
   - 定期检查配额使用情况
   - 设置配额使用率告警（如 >80%）
   - 记录配额使用日志

3. **配额升级**：
   - 提供配额购买/升级功能
   - 支持临时增加配额
   - 支持配额转移（企业账户）

## 示例配置

### 免费用户配额

```json
{
  "quota_ai_text_generation": {"total": 10},
  "quota_ai_image_generation": {"total": 5},
  "quota_ai_chat": {"total": 20},
  "quota_ai_planning": {"total": 5},
  "quota_ai_import": {"total": 2}
}
```

### 专业用户配额

```json
{
  "quota_ai_text_generation": {"total": 100},
  "quota_ai_image_generation": {"total": 50},
  "quota_ai_chat": {"total": 200},
  "quota_ai_planning": {"total": 50},
  "quota_ai_import": {"total": 20}
}
```

### 企业用户配额

```json
{
  "quota_ai_text_generation": {"total": -1},  // 无限
  "quota_ai_image_generation": {"total": 500},
  "quota_ai_chat": {"total": -1},  // 无限
  "quota_ai_planning": {"total": 200},
  "quota_ai_import": {"total": 100}
}
```

