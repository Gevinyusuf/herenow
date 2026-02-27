# 用户套餐、权限、配额、视图、触发器关系说明

## 📋 核心概念

### 1. **套餐 (Plans)** - 定义"能做什么"
- **表名**: `plans`
- **作用**: 定义不同的服务套餐，包含功能权限和配额上限
- **核心字段**:
  - `id`: 套餐标识（如 'free', 'pro_monthly'）
  - `name`: 套餐名称
  - `limits`: JSONB 字段，存储所有权限和配额配置

**示例**:
```sql
{
  "quota_ai_text_generation": 100,    -- 文本生成配额
  "quota_ai_image_generation": 50,     -- 图片生成配额
  "feature_community": true,           -- 功能权限：能否访问社区
  "feature_discover": false            -- 功能权限：能否访问发现页
}
```

### 2. **订阅 (Subscriptions)** - 记录"用户买了什么套餐"
- **表名**: `subscriptions`
- **作用**: 记录用户当前使用的套餐
- **核心字段**:
  - `user_id`: 用户ID（外键关联 `auth.users`）
  - `plan_id`: 套餐ID（外键关联 `plans`）
  - `status`: 订阅状态（'active', 'trailing', 'canceled'）
  - `current_period_end`: 订阅到期时间（用于配额重置）
  - `created_at`: 订阅创建时间

**关系**: 一个用户对应一个订阅，一个订阅对应一个套餐

### 3. **配额使用量 (Usages)** - 记录"用户用了多少"
- **表名**: `usages`
- **作用**: 记录用户对各项功能的使用量
- **核心字段**:
  - `user_id`: 用户ID
  - `feature_key`: 功能标识（如 'quota_ai_text_generation'）
  - `count`: 已使用次数
  - `updated_at`: 最后更新时间

**关系**: 一个用户可以有多个使用量记录（每个功能一条）

### 4. **视图 (View)** - 统一查询"用户能做什么，还剩多少"
- **视图名**: `v_user_entitlements`
- **作用**: 将套餐、订阅、使用量整合成一张"虚拟表"，方便查询
- **包含信息**:
  - 用户当前套餐信息
  - 各项功能的配额上限（来自 `plans.limits`）
  - 各项功能的已使用量（来自 `usages`）
  - 各项功能的剩余配额（计算得出）

**优势**: 
- 简化查询：一次查询获取所有信息
- 实时计算：剩余配额自动计算
- 统一接口：前端/后端统一使用

### 5. **触发器 (Trigger)** - 自动执行"用户注册时做什么"
- **触发器名**: `on_auth_user_created_beta`
- **作用**: 当新用户注册时，自动创建订阅记录
- **触发时机**: `auth.users` 表插入新记录后
- **执行逻辑**: 
  1. 检测到新用户注册
  2. 自动在 `subscriptions` 表中创建记录
  3. 默认分配 'beta_early_access' 套餐
  4. 状态设为 'active'

## 🔗 关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      auth.users                             │
│                  (Supabase 用户表)                          │
│                                                             │
│  id (UUID)                                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 1:1
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  subscriptions                              │
│              (用户订阅记录表)                                │
│                                                             │
│  user_id (FK) ────────────┐                                │
│  plan_id (FK) ────────────┼──┐                             │
│  status                    │  │                             │
│  current_period_end        │  │                             │
│  created_at                │  │                             │
└────────────────────────────┼──┼─────────────────────────────┘
                             │  │
                             │  │ N:1
                             │  ▼
                             │ ┌─────────────────────────────┐
                             │ │         plans                │
                             │ │      (套餐定义表)            │
                             │ │                             │
                             │ │  id (PK)                    │
                             │ │  name                       │
                             │ │  limits (JSONB) ◄───────────┼── 配额上限配置
                             │ │                             │
                             │ └─────────────────────────────┘
                             │
                             │ 1:N
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      usages                                 │
│                  (配额使用量表)                              │
│                                                             │
│  user_id (FK) ────────────┐                                │
│  feature_key               │                                │
│  count ◄───────────────────┼── 已使用量                     │
│  updated_at                │                                │
└────────────────────────────┼───────────────────────────────┘
                              │
                              │ 通过 JOIN 整合
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              v_user_entitlements (视图)                      │
│                                                             │
│  user_id                                                    │
│  plan_name                                                  │
│  plan_id                                                    │
│  subscription_status                                        │
│  quota_ai_text_generation_limit  ◄── 来自 plans.limits     │
│  quota_ai_text_generation_used    ◄── 来自 usages.count    │
│  quota_ai_text_generation_remaining ◄── 自动计算          │
│  ... (其他配额字段)                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 数据流转过程

### 场景 1: 新用户注册

```
1. 用户在 Supabase Auth 注册
   ↓
2. auth.users 表插入新记录
   ↓
3. 触发器 on_auth_user_created_beta 自动触发
   ↓
4. 在 subscriptions 表创建记录
   - user_id: 新用户的 UUID
   - plan_id: 'beta_early_access' (默认套餐)
   - status: 'active'
   ↓
5. 用户现在有了套餐，但 usages 表还没有记录
   (首次使用时才会创建)
```

### 场景 2: 用户使用 AI 功能

```
1. 用户调用 AI 接口（如文本生成）
   ↓
2. 后端调用 RPC 函数 check_and_increment_quota
   ↓
3. RPC 函数执行流程：
   a. 从 subscriptions 获取用户的 plan_id
   b. 从 plans.limits 读取配额上限
   c. 从 usages 读取已使用量
   d. 检查：已使用量 + 1 ≤ 配额上限？
   e. 如果通过，更新 usages.count + 1
   f. 返回 true/false
   ↓
4. 如果配额足够：
   - 执行 AI 功能
   - usages 表更新（count + 1）
   ↓
5. 如果配额不足：
   - 返回错误，不执行 AI 功能
```

### 场景 3: 查询用户配额

```
1. 前端/后端需要查询用户配额
   ↓
2. 直接查询 v_user_entitlements 视图
   ↓
3. 视图自动执行：
   - JOIN subscriptions 和 plans（获取套餐信息）
   - LEFT JOIN usages（获取使用量）
   - 计算剩余配额 = 上限 - 已使用
   ↓
4. 返回完整信息：
   {
     user_id: "...",
     plan_name: "Pro Plan",
     quota_ai_text_generation_limit: 100,
     quota_ai_text_generation_used: 45,
     quota_ai_text_generation_remaining: 55
   }
```

## 📊 核心表结构

### plans 表
```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,           -- 'free', 'pro_monthly'
  name TEXT,                      -- 'Free Plan', 'Pro Plan'
  limits JSONB                    -- 所有配额和权限配置
);
```

### subscriptions 表
```sql
CREATE TABLE subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  plan_id TEXT REFERENCES plans(id),
  status TEXT,                    -- 'active', 'trailing', 'canceled'
  current_period_end TIMESTAMPTZ, -- 订阅到期时间
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### usages 表
```sql
CREATE TABLE usages (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  feature_key TEXT,               -- 'quota_ai_text_generation'
  count INT DEFAULT 0,            -- 已使用次数
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key)    -- 每个用户每个功能一条记录
);
```

## 🎯 关键设计点

### 1. **权限 vs 配额**
- **权限 (Feature Flags)**: 布尔值，表示"能不能用"
  - 例如: `feature_community: true` 表示可以访问社区
- **配额 (Quotas)**: 数值，表示"能用多少次"
  - 例如: `quota_ai_text_generation: 100` 表示可以用 100 次
  - `-1` 表示无限

### 2. **JSONB 的灵活性**
- `plans.limits` 使用 JSONB 存储，可以：
  - 轻松添加新功能配额
  - 不同套餐有不同配置
  - 不需要频繁修改表结构

### 3. **视图的便利性**
- `v_user_entitlements` 视图将复杂的 JOIN 操作封装
- 前端/后端只需查询一个视图，就能获取所有信息
- 自动计算剩余配额，保证数据一致性

### 4. **触发器的自动化**
- 新用户注册时自动创建订阅
- 减少手动操作，避免遗漏
- 确保每个用户都有套餐

### 5. **RPC 函数的原子性**
- `check_and_increment_quota` 函数确保：
  - 检查配额和扣减配额是原子操作
  - 使用 `FOR UPDATE` 行锁防止并发问题
  - 不会出现超卖情况

## 🔍 实际查询示例

### 查询用户的所有配额信息
```sql
SELECT * FROM v_user_entitlements 
WHERE user_id = 'your-user-id';
```

### 查询特定功能的配额
```sql
SELECT 
  quota_ai_text_generation_limit,
  quota_ai_text_generation_used,
  quota_ai_text_generation_remaining
FROM v_user_entitlements 
WHERE user_id = 'your-user-id';
```

### 检查用户是否有权限
```sql
SELECT can_access_community, can_access_discover
FROM v_user_entitlements 
WHERE user_id = 'your-user-id';
```

## 📝 总结

1. **plans** = 套餐模板（定义能做什么）
2. **subscriptions** = 用户订阅记录（记录买了什么）
3. **usages** = 使用量统计（记录用了多少）
4. **v_user_entitlements** = 统一视图（方便查询）
5. **触发器** = 自动化流程（注册时自动创建订阅）
6. **RPC 函数** = 原子操作（安全地扣减配额）

整个系统的核心思想：
- **套餐定义能力** → **订阅记录关系** → **使用量记录消耗** → **视图统一展示**

