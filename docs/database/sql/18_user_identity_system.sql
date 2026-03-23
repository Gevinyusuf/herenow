-- HereNow 三层身份系统改造
-- 基于 AGENTS.md PRD v2.3
-- Guest → Lite User → Full User 渐进升级

-- 1. 创建用户身份类型枚举
CREATE TYPE user_identity AS ENUM (
    'guest',      -- 匿名用户：仅填写表单即可报名，无需注册
    'lite',      -- 轻量用户：一键绑定 Google/Apple 账号
    'full'       -- 完整用户：完成注册，解锁所有功能
);

-- 2. 在 profiles 表中添加身份字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_identity user_identity DEFAULT 'guest';

-- 3. 添加 Guest 用户的数据保留策略
-- Guest 用户数据 100% 归策展人，但 Lite/Full 用户保留自己的数据
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS data_retention_policy TEXT DEFAULT 'curator';

-- 4. 创建 Lite User 绑定记录表（用于追踪 Google/Apple 绑定）
CREATE TABLE IF NOT EXISTS public.user_auth_bindings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'google' | 'apple'
    provider_user_id TEXT NOT NULL, -- Google/Apple 返回的用户 ID
    bound_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- RLS for user_auth_bindings
ALTER TABLE public.user_auth_bindings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bindings" ON public.user_auth_bindings
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bindings" ON public.user_auth_bindings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 创建升级触发记录表（用于分析转化率）
CREATE TABLE IF NOT EXISTS public.identity_upgrade_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    from_identity user_identity NOT NULL,
    to_identity user_identity NOT NULL,
    trigger_context TEXT, -- 'registration_success' | 'review_published' | 'new_event_push'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_identity ON public.profiles(user_identity);
CREATE INDEX IF NOT EXISTS idx_user_auth_bindings_user ON public.user_auth_bindings(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_upgrade_events_user ON public.identity_upgrade_events(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_upgrade_events_trigger ON public.identity_upgrade_events(trigger_context);

-- 6. 更新 v_user_entitlements 视图，添加身份系统相关字段
DROP VIEW IF EXISTS public.v_user_entitlements CASCADE;

CREATE VIEW public.v_user_entitlements AS
SELECT
    s.user_id,
    p.name AS plan_name,
    p.id AS plan_id,
    s.status AS subscription_status,
    s.current_period_end,

    -- 身份信息
    COALESCE(prof.user_identity, 'guest'::user_identity) AS user_identity,

    -- 功能开关 (Feature Flags)
    COALESCE((p.limits->>'feature_community')::boolean, false) AS can_access_community,
    COALESCE((p.limits->>'feature_discover')::boolean, false) AS can_access_discover,
    COALESCE((p.limits->>'feature_create_events')::boolean, false) AS can_create_events,
    COALESCE((p.limits->>'feature_ai_assistant')::boolean, false) AS can_use_ai,

    -- 旧版 AI 额度（向后兼容）
    COALESCE((p.limits->>'quota_ai_generations')::int, 0) AS quota_ai_limit,
    COALESCE(u_ai.count, 0) AS quota_ai_used,
    CASE
        WHEN (p.limits->>'quota_ai_generations')::int = -1 THEN -1
        ELSE GREATEST(0, (p.limits->>'quota_ai_generations')::int - COALESCE(u_ai.count, 0))
    END AS quota_ai_remaining

FROM
    subscriptions s
    INNER JOIN plans p ON s.plan_id = p.id
    LEFT JOIN profiles prof ON s.user_id = prof.id
    LEFT JOIN usages u_ai ON s.user_id = u_ai.user_id
        AND u_ai.feature_key = 'quota_ai_generations'
WHERE
    s.status = 'active'
    AND (s.current_period_end IS NULL OR s.current_period_end > NOW());

-- 7. 创建获取用户身份的函数
CREATE OR REPLACE FUNCTION public.get_user_identity(p_user_id UUID)
RETURNS user_identity AS $$
DECLARE
    v_identity user_identity;
BEGIN
    SELECT user_identity INTO v_identity
    FROM profiles
    WHERE id = p_user_id;

    RETURN COALESCE(v_identity, 'guest'::user_identity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建升级用户身份的函数
CREATE OR REPLACE FUNCTION public.upgrade_user_identity(
    p_user_id UUID,
    p_to_identity user_identity,
    p_trigger_context TEXT DEFAULT NULL
)
RETURNS user_identity AS $$
DECLARE
    v_from_identity user_identity;
BEGIN
    -- 获取当前身份
    SELECT user_identity INTO v_from_identity
    FROM profiles
    WHERE id = p_user_id;

    -- 如果已经是更高身份，不做处理
    IF v_from_identity >= p_to_identity THEN
        RETURN v_from_identity;
    END IF;

    -- 更新身份
    UPDATE profiles
    SET user_identity = p_to_identity,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 记录升级事件
    INSERT INTO identity_upgrade_events (user_id, from_identity, to_identity, trigger_context)
    VALUES (p_user_id, v_from_identity, p_to_identity, p_trigger_context);

    RETURN p_to_identity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 注释说明
COMMENT ON TYPE user_identity IS '三层身份系统: guest(匿名)-lite(轻量)-full(完整)';
COMMENT ON COLUMN profiles.user_identity IS '用户身份层级，决定功能访问权限';
COMMENT ON COLUMN profiles.data_retention_policy IS '数据保留策略: curator(策展人拥有) / user(用户拥有)';
COMMENT ON FUNCTION public.upgrade_user_identity IS '升级用户身份并记录触发场景，用于转化率分析';