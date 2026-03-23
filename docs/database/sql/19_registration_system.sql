-- HereNow 报名管理系统增强
-- 基于 AGENTS.md PRD v2.3
-- 免费报名 + 人数上限 + 候补名单 + 自定义字段 + 报名审核

-- 1. 创建报名状态变更日志表
CREATE TABLE IF NOT EXISTS public.registration_status_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id), -- 谁做的变更（策展人或系统）
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_status_log_registration ON public.registration_status_log(registration_id);

-- 2. 为 events_v1 添加候补名单配置
ALTER TABLE public.events_v1
ADD COLUMN IF NOT EXISTS enable_waitlist BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS waitlist_capacity INT DEFAULT 10;

COMMENT ON COLUMN public.events_v1.enable_waitlist IS '是否启用候补名单';
COMMENT ON COLUMN public.events_v1.waitlist_capacity IS '候补名单容量';

-- 3. 创建候补递补记录表
CREATE TABLE IF NOT EXISTS public.waitlist_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id), -- 可以是 NULL（Guest 用户用邮箱）
    email TEXT NOT NULL,
    position INT NOT NULL, -- 候补位置
    notified_at TIMESTAMPTZ, -- 通知时间
    converted_at TIMESTAMPTZ, -- 转为正式报名时间
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_notifications_event ON public.waitlist_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_notifications_user ON public.waitlist_notifications(user_id);

-- 4. 创建活动统计视图（用于实时显示报名人数）
DROP VIEW IF EXISTS public.v_event_registration_stats CASCADE;

CREATE VIEW public.v_event_registration_stats AS
SELECT
    e.id AS event_id,
    e.title,
    e.start_at,
    e.enable_waitlist,
    e.waitlist_capacity,
    COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END)::int AS confirmed_count,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END)::int AS pending_count,
    COUNT(CASE WHEN r.status = 'waitlist' THEN 1 END)::int AS waitlist_count,
    COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)::int AS rejected_count,
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END)::int AS cancelled_count,
    COUNT(CASE WHEN r.checked_in_at IS NOT NULL THEN 1 END)::int AS checked_in_count
FROM events_v1 e
LEFT JOIN event_registrations r ON e.id = r.event_id
GROUP BY e.id, e.title, e.start_at, e.enable_waitlist, e.waitlist_capacity;

-- 5. 创建函数：检查活动是否还有名额
CREATE OR REPLACE FUNCTION public.check_registration_availability(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_event RECORD;
    v_confirmed_count INT;
    v_result JSONB;
BEGIN
    SELECT
        enable_waitlist,
        waitlist_capacity
    INTO v_event
    FROM events_v1
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'event_not_found'
        );
    END IF;

    SELECT COUNT(*)::int INTO v_confirmed_count
    FROM event_registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- 检查是否有名额
    IF v_confirmed_count < (SELECT COALESCE((ticket_config->>'totalSlots')::int, 100) FROM events_v1 WHERE id = p_event_id) THEN
        RETURN jsonb_build_object(
            'available', true,
            'type', 'confirmed',
            'spots_remaining', (SELECT COALESCE((ticket_config->>'totalSlots')::int, 100) FROM events_v1 WHERE id = p_event_id) - v_confirmed_count
        );
    ELSIF v_event.enable_waitlist THEN
        -- 名额已满，检查候补是否有空位
        IF (SELECT COUNT(*)::int FROM event_registrations WHERE event_id = p_event_id AND status = 'waitlist') < v_event.waitlist_capacity THEN
            RETURN jsonb_build_object(
                'available', true,
                'type', 'waitlist',
                'spots_remaining', v_event.waitlist_capacity - (SELECT COUNT(*)::int FROM event_registrations WHERE event_id = p_event_id AND status = 'waitlist')
            );
        ELSE
            RETURN jsonb_build_object(
                'available', false,
                'reason', 'event_full_waitlist_full'
            );
        END IF;
    ELSE
        RETURN jsonb_build_object(
            'available', false,
            'reason', 'event_full'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建函数：处理报名（自动判断是确认还是候补）
CREATE OR REPLACE FUNCTION public.process_registration(
    p_event_id UUID,
    p_email TEXT,
    p_form_answers JSONB DEFAULT '{}'::jsonb,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL -- 如果已登录用户
)
RETURNS JSONB AS $$
DECLARE
    v_availability JSONB;
    v_registration_id UUID;
    v_ticket_code TEXT;
    v_status TEXT;
BEGIN
    -- 检查报名资格
    v_availability := check_registration_availability(p_event_id);

    IF NOT (v_availability->>'available')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_availability->>'reason'
        );
    END IF;

    -- 确定状态
    IF (v_availability->>'type') = 'confirmed' THEN
        v_status := 'confirmed';
    ELSE
        v_status := 'waitlist';
    END IF;

    -- 生成票码
    v_ticket_code := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);

    -- 创建报名记录
    INSERT INTO event_registrations (
        event_id,
        user_id,
        email,
        first_name,
        last_name,
        form_answers,
        status,
        ticket_code
    ) VALUES (
        p_event_id,
        p_user_id,
        p_email,
        p_first_name,
        p_last_name,
        p_form_answers,
        v_status,
        v_ticket_code
    ) RETURNING id INTO v_registration_id;

    -- 记录状态变更
    INSERT INTO registration_status_log (registration_id, old_status, new_status, changed_by, change_reason)
    VALUES (v_registration_id, NULL, v_status, p_user_id, 'Initial registration');

    -- 如果是候补，记录候补通知
    IF v_status = 'waitlist' THEN
        DECLARE
            v_position INT;
        BEGIN
            SELECT COUNT(*)::int + 1 INTO v_position
            FROM event_registrations
            WHERE event_id = p_event_id AND status = 'waitlist';

            INSERT INTO waitlist_notifications (event_id, user_id, email, position, status)
            VALUES (p_event_id, p_user_id, p_email, v_position, 'waiting');
        END;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'status', v_status,
        'registration_id', v_registration_id,
        'ticket_code', v_ticket_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建函数：处理候补递补（当有人取消时）
CREATE OR REPLACE FUNCTION public.process_waitlist_promotion(p_event_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_waitlist_entry RECORD;
    v_registration_id UUID;
BEGIN
    -- 获取最早的候补 entry
    SELECT * INTO v_waitlist_entry
    FROM waitlist_notifications
    WHERE event_id = p_event_id
        AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'No waitlist entries'
        );
    END IF;

    -- 更新候补状态
    UPDATE waitlist_notifications
    SET status = 'notified',
        notified_at = NOW()
    WHERE id = v_waitlist_entry.id;

    -- 更新报名状态为 confirmed
    UPDATE event_registrations
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE event_id = p_event_id
        AND email = v_waitlist_entry.email
        AND status = 'waitlist';

    -- 记录状态变更
    SELECT id INTO v_registration_id
    FROM event_registrations
    WHERE event_id = p_event_id
        AND email = v_waitlist_entry.email
        AND status = 'confirmed';

    INSERT INTO registration_status_log (registration_id, old_status, new_status, change_reason)
    VALUES (v_registration_id, 'waitlist', 'confirmed', 'Waitlist promotion - spot available');

    -- 更新候补通知
    UPDATE waitlist_notifications
    SET status = 'converted',
        converted_at = NOW()
    WHERE id = v_waitlist_entry.id;

    RETURN jsonb_build_object(
        'success', true,
        'notified_email', v_waitlist_entry.email,
        'position', v_waitlist_entry.position
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建触发器：自动处理候补递补（当取消报名时）
CREATE OR REPLACE FUNCTION public.handle_registration_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        -- 尝试从候补中递补
        PERFORM process_waitlist_promotion(OLD.event_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_cancelled ON public.event_registrations;
CREATE TRIGGER on_registration_cancelled
    AFTER UPDATE ON public.event_registrations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled')
    EXECUTE PROCEDURE public.handle_registration_cancellation();

COMMENT ON FUNCTION public.process_registration IS '处理报名，根据名额情况自动判断是确认还是候补';
COMMENT ON FUNCTION public.process_waitlist_promotion IS '处理候补递补，通知下一位候补人员';
COMMENT ON FUNCTION public.handle_registration_cancellation IS '当报名被取消时，自动触发候补递补';