# RPC 函数说明

## 什么是 RPC 函数？

RPC（Remote Procedure Call，远程过程调用）函数是存储在数据库中的函数，可以在数据库层面执行复杂的业务逻辑。

在你的项目中，RPC 函数用于**原子性地检查和扣减配额**。

## check_and_increment_quota 函数的作用

### 核心功能

这个函数做了三件事（原子性执行）：

1. **检查配额**：从 `plans.limits` 读取配额上限，从 `usages` 表读取已使用量
2. **判断是否足够**：计算剩余配额是否足够本次使用
3. **扣减配额**：如果足够，原子性地增加使用量；如果不够，返回 false

### 为什么需要这个函数？

#### 问题场景

假设没有 RPC 函数，在 Python 代码中这样写：

```python
# ❌ 错误的方式（有并发问题）
# 1. 查询配额
quota = supabase.table("usages").select("used").eq("user_id", user_id).execute()
used = quota.data[0]["used"]
total = 100  # 从 plans 读取

# 2. 检查是否足够
if total - used >= 1:
    # 3. 更新使用量
    supabase.table("usages").update({"used": used + 1}).execute()
    return True
else:
    return False
```

**问题**：在高并发情况下，两个请求可能同时执行步骤1，都看到相同的 `used` 值，然后都通过检查，导致配额超支！

#### 解决方案：RPC 函数

RPC 函数在数据库层面**原子性**执行所有操作，确保并发安全：

```python
# ✅ 正确的方式（原子性操作）
response = supabase.rpc(
    'check_and_increment_quota',
    {
        'p_user_id': user_id,
        'p_feature_key': 'quota_ai_text_generation',
        'p_delta': 1
    }
).execute()

if response.data:
    # 配额足够，已成功扣减
    return True
else:
    # 配额不足
    return False
```

## 工作流程

```
用户请求 AI 功能
    ↓
后端调用 verify_ai_quota_by_type()
    ↓
调用 RPC 函数 check_and_increment_quota()
    ↓
【数据库内部原子性执行】
    1. 获取用户套餐
    2. 从 plans.limits 读取配额上限
    3. 从 usages 表读取已使用量
    4. 检查配额是否足够
    5. 如果足够，更新 usages 表（原子性）
    ↓
返回结果
    ├─ True: 配额足够，已扣减
    └─ False: 配额不足
```

## RPC 函数 vs 视图的区别

### v_user_entitlements 视图
- **作用**：查询配额信息（只读）
- **用途**：显示给用户看，不修改数据
- **特点**：可以随时查询，不影响配额

### check_and_increment_quota RPC 函数
- **作用**：检查并扣减配额（写操作）
- **用途**：在用户使用 AI 功能时调用
- **特点**：原子性操作，保证并发安全

## 函数实现

### 当前使用的表结构

根据你的系统，RPC 函数应该使用 `usages` 表（而不是 `user_quota_usage`）：

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
    -- 1. 获取用户当前套餐（从 subscriptions 表）
    SELECT plan_id INTO v_plan_id
    FROM subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
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
        -- 更新使用量（用于统计）
        INSERT INTO usages (user_id, feature_key, count, updated_at)
        VALUES (p_user_id, p_feature_key, p_delta, NOW())
        ON CONFLICT (user_id, feature_key)
        DO UPDATE SET 
            count = usages.count + p_delta,
            updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- 4. 获取当前已使用量（从 usages 表）
    SELECT COALESCE(count, 0) INTO v_used
    FROM usages
    WHERE user_id = p_user_id AND feature_key = p_feature_key;
    
    -- 5. 检查配额是否足够
    v_remaining := v_total - v_used;
    
    IF v_remaining < p_delta THEN
        RETURN FALSE;  -- 配额不足
    END IF;
    
    -- 6. 原子性地增加使用量
    INSERT INTO usages (user_id, feature_key, count, updated_at)
    VALUES (p_user_id, p_feature_key, v_used + p_delta, NOW())
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET 
        count = usages.count + p_delta,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;
```

## 在代码中的使用

### 后端代码（已实现）

在 `apps/api-gateway/core/ai/dependencies.py` 中：

```python
async def verify_ai_quota_by_type(
    ai_type: str,
    current_user: Dict,
    supabase: Client
) -> bool:
    # 获取对应的配额 Key
    feature_key = AI_QUOTA_MAPPING.get(ai_type)
    
    # 调用 RPC 函数，原子性地检查并扣减配额
    response = supabase.rpc(
        'check_and_increment_quota',
        {
            'p_user_id': user_id,
            'p_feature_key': feature_key,
            'p_delta': 1
        }
    ).execute()
    
    # 如果返回 False，说明配额不足
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"AI {ai_type} quota exceeded."
        )
    
    return True
```

## 为什么需要更新 RPC 函数？

当前的 RPC 函数可能：
1. 只支持 `quota_ai_generations`（旧的统一配额）
2. 使用 `user_quota_usage` 表（如果不存在会报错）

需要更新为：
1. 支持所有新的 `feature_key`（如 `quota_ai_text_generation`）
2. 使用正确的表名（`usages` 而不是 `user_quota_usage`）
3. 从 `plans.limits` JSONB 字段读取配额上限

## 总结

| 组件 | 作用 | 何时使用 |
|------|------|---------|
| **v_user_entitlements 视图** | 查询配额信息（只读） | 显示给用户看剩余配额 |
| **check_and_increment_quota RPC** | 检查并扣减配额（写操作） | 用户使用 AI 功能时 |
| **plans.limits** | 存储配额上限配置 | 套餐配置 |
| **usages 表** | 存储已使用量 | 记录用户实际使用情况 |

**关键点**：RPC 函数保证了**并发安全**，即使多个用户同时使用 AI 功能，也不会出现配额超支的问题。

