-- HereNow 通知与沟通系统
-- 基于 AGENTS.md PRD v2.3
-- 报名确认 → 活动提醒 → 变更通知 → 候补递补 → 回顾发布

-- 1. 创建通知类型枚举
CREATE TYPE notification_type AS ENUM (
    'registration_confirmed',      -- 报名成功
    'registration_pending',        -- 待审核
    'registration_waitlist',       -- 进入候补
    'registration_rejected',        -- 审核被拒绝
    'event_reminder_24h',          -- 活动前24小时提醒
    'event_reminder_1h',           -- 活动前1小时提醒
    'event_changed',                -- 活动信息变更
    'event_cancelled',             -- 活动取消
    'waitlist_promoted',           -- 候补递补成功
    'event_review_published',      -- 活动回顾发布
    'organizer_new_event',         -- 关注的策展人新活动
    'rating_received'              -- 收到新评价
);

-- 2. 创建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 通知类型
    type notification_type NOT NULL,

    -- 接收者
    user_id UUID REFERENCES profiles(id), -- 可以为 NULL（Guest 用户）
    email TEXT NOT NULL,

    -- 关联实体
    event_id UUID REFERENCES events_v1(id), -- 活动相关
    registration_id UUID REFERENCES event_registrations(id), -- 报名相关
    community_id UUID, -- 社群相关

    -- 通知内容
    title TEXT NOT NULL,
    body TEXT NOT NULL,

    -- 偏好设置（JSONB 存储不同渠道的发送状态）
    -- {"email": {"sent": true, "sent_at": "...", "delivered": false}, "push": {...}}
    delivery_status JSONB DEFAULT '{}'::jsonb,

    -- 打开/点击状态
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,

    -- 优先级
    priority INT DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
    -- 0: 低优先级（如营销推送）1-5: 普通优先级 6-10: 高优先级（如活动取消）

    -- 过期时间（用于活动提醒等有时效性的通知）
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看通知（但只能查看自己的）
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 系统可以创建通知
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 用户可以更新自己的通知（已读状态等）
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(email);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_event ON public.notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 3. 创建用户通知偏好设置表
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- 邮件通知偏好
    email_registration BOOLEAN DEFAULT TRUE,
    email_reminder BOOLEAN DEFAULT TRUE,
    email_event_changes BOOLEAN DEFAULT TRUE,
    email_waitlist BOOLEAN DEFAULT TRUE,
    email_review_published BOOLEAN DEFAULT TRUE,
    email_organizer_updates BOOLEAN DEFAULT FALSE,
    email_marketing BOOLEAN DEFAULT FALSE,

    -- 推送通知偏好
    push_enabled BOOLEAN DEFAULT TRUE,
    push_registration BOOLEAN DEFAULT TRUE,
    push_reminder BOOLEAN DEFAULT TRUE,
    push_event_changes BOOLEAN DEFAULT TRUE,

    -- 免打扰模式
    do_not_disturb_start TIME,
    do_not_disturb_end TIME,
    timezone TEXT DEFAULT 'UTC',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- 4. 创建通知模板表（用于存储邮件/推送模板）
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type notification_type NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
    language TEXT DEFAULT 'en',

    -- 模板内容
    subject TEXT, -- 邮件主题
    title TEXT, -- 推送标题
    body_template TEXT NOT NULL, -- 支持变量替换的模板
    -- 变量格式：{{event_title}}, {{user_name}}, {{event_date}}, etc.

    -- 模板配置
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 默认通知模板
INSERT INTO public.notification_templates (type, channel, title, body_template) VALUES
-- 报名确认
('registration_confirmed', 'email', 'You''re in! {{event_title}}',
 'Hi {{user_name}},

Your registration for {{event_title}} is confirmed!

📅 Date: {{event_date}}
📍 Location: {{event_location}}
🎫 Ticket: {{ticket_code}}

We''ll send you a reminder before the event starts.

See you there!'),

('registration_confirmed', 'push', 'You''re registered!',
 'Your spot for {{event_title}} is confirmed!'),

-- 候补
('registration_waitlist', 'email', 'You''re on the waitlist for {{event_title}}',
 'Hi {{user_name}},

You''ve been added to the waitlist for {{event_title}}.

📍 Position: #{{waitlist_position}}

We''ll notify you immediately if a spot opens up.

Good luck!'),

-- 候补递补
('waitlist_promoted', 'email', 'Great news! You got a spot for {{event_title}}!',
 'Hi {{user_name}},

A spot has opened up and you''re now registered for {{event_title}}!

🎫 Ticket: {{ticket_code}}

See you there!'),

-- 活动前24小时提醒
('event_reminder_24h', 'email', 'Tomorrow: {{event_title}}',
 'Hi {{user_name}},

Just a friendly reminder that {{event_title}} is happening tomorrow!

📅 Date: {{event_date}}
📍 Location: {{event_location}}

Don''t forget to add this to your calendar!'),

-- 活动前1小时提醒
('event_reminder_1h', 'push', '{{event_title}} starts in 1 hour!',
 '{{event_title}} starts at {{event_time}}. See you soon!'),

-- 活动变更
('event_changed', 'email', 'Update: {{event_title}} has changed',
 'Hi {{user_name}},

Important update for {{event_title}}:

{{change_description}}

Check the event page for the latest details.'),

-- 活动回顾发布
('event_review_published', 'email', 'See what happened at {{event_title}}!',
 'Hi {{user_name}},

The event has ended and the organizer has shared photos and reflections!

📸 View the event recap: {{review_link}}

Don''t forget to leave your rating!');

-- 5. 创建发送通知的函数
CREATE OR REPLACE FUNCTION public.send_notification(
    p_type notification_type,
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_event_id UUID DEFAULT NULL,
    p_registration_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT NULL,
    p_body TEXT DEFAULT NULL,
    p_priority INT DEFAULT 5,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        type,
        email,
        user_id,
        event_id,
        registration_id,
        title,
        body,
        priority,
        expires_at
    ) VALUES (
        p_type,
        p_email,
        p_user_id,
        p_event_id,
        p_registration_id,
        p_title,
        p_body,
        p_priority,
        p_expires_at
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建函数：获取用户未读通知数
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(
    p_user_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM notifications
        WHERE user_id = p_user_id AND is_read = FALSE;
    ELSIF p_email IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM notifications
        WHERE email = p_email AND user_id IS NULL AND is_read = FALSE;
    ELSE
        RETURN 0;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建函数：批量标记通知为已读
CREATE OR REPLACE FUNCTION public.mark_notifications_read(
    p_notification_ids UUID[],
    p_user_id UUID
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE notifications
    SET is_read = TRUE,
        read_at = NOW()
    WHERE id = ANY(p_notification_ids)
        AND user_id = p_user_id
        AND is_read = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建函数：创建活动前24小时提醒任务（定时任务调用）
CREATE OR REPLACE FUNCTION public.schedule_24h_reminders()
RETURNS VOID AS $$
DECLARE
    v_event RECORD;
    v_registration RECORD;
BEGIN
    -- 查找所有在24小时内的活动及其报名者
    FOR v_event IN
        SELECT e.id, e.title, e.start_at, e.timezone
        FROM events_v1 e
        WHERE e.start_at > NOW()
            AND e.start_at <= NOW() + INTERVAL '25 hours'
            AND e.start_at > NOW() + INTERVAL '23 hours'
    LOOP
        FOR v_registration IN
            SELECT er.email, er.user_id, er.ticket_code
            FROM event_registrations er
            WHERE er.event_id = v_event.id
                AND er.status = 'confirmed'
        LOOP
            PERFORM send_notification(
                'event_reminder_24h',
                v_registration.email,
                v_registration.user_id,
                v_event.id,
                NULL,
                'Tomorrow: ' || v_event.title,
                'Your event "' || v_event.title || '" is happening tomorrow at ' || v_event.start_at,
                5,
                v_event.start_at + INTERVAL '2 days' -- 2天后过期
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建函数：创建活动前1小时提醒任务（定时任务调用）
CREATE OR REPLACE FUNCTION public.schedule_1h_reminders()
RETURNS VOID AS $$
DECLARE
    v_event RECORD;
    v_registration RECORD;
BEGIN
    -- 查找所有在1小时内的活动及其报名者
    FOR v_event IN
        SELECT e.id, e.title, e.start_at, e.timezone
        FROM events_v1 e
        WHERE e.start_at > NOW()
            AND e.start_at <= NOW() + INTERVAL '70 minutes'
            AND e.start_at > NOW() + INTERVAL '50 minutes'
    LOOP
        FOR v_registration IN
            SELECT er.email, er.user_id, er.ticket_code
            FROM event_registrations er
            WHERE er.event_id = v_event.id
                AND er.status = 'confirmed'
        LOOP
            PERFORM send_notification(
                'event_reminder_1h',
                v_registration.email,
                v_registration.user_id,
                v_event.id,
                NULL,
                v_event.title || ' starts in 1 hour!',
                'Your event "' || v_event.title || '" starts at ' || v_event.start_at || '. See you there!',
                7,
                v_event.start_at + INTERVAL '2 days'
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建触发器：自动发送报名确认通知
CREATE OR REPLACE FUNCTION public.handle_registration_created()
RETURNS TRIGGER AS $$
DECLARE
    v_event RECORD;
    v_user_name TEXT;
BEGIN
    -- 获取活动信息
    SELECT title, start_at, timezone INTO v_event
    FROM events_v1
    WHERE id = NEW.event_id;

    -- 获取用户名称
    IF NEW.user_id IS NOT NULL THEN
        SELECT full_name INTO v_user_name
        FROM profiles
        WHERE id = NEW.user_id;
        v_user_name := COALESCE(v_user_name, 'Attendee');
    ELSE
        v_user_name := COALESCE(NEW.first_name, 'Attendee');
    END IF;

    -- 根据状态发送不同通知
    IF NEW.status = 'confirmed' THEN
        PERFORM send_notification(
            'registration_confirmed',
            NEW.email,
            NEW.user_id,
            NEW.event_id,
            NEW.id,
            'You''re in! ' || v_event.title,
            'Your registration for "' || v_event.title || '" is confirmed! See you there!',
            8,
            v_event.start_at + INTERVAL '7 days'
        );
    ELSIF NEW.status = 'pending' THEN
        PERFORM send_notification(
            'registration_pending',
            NEW.email,
            NEW.user_id,
            NEW.event_id,
            NEW.id,
            'Your registration is pending approval',
            'Your registration for "' || v_event.title || '" is awaiting organizer approval.',
            6,
            v_event.start_at + INTERVAL '7 days'
        );
    ELSIF NEW.status = 'waitlist' THEN
        DECLARE
            v_position INT;
        BEGIN
            SELECT COUNT(*) + 1 INTO v_position
            FROM event_registrations
            WHERE event_id = NEW.event_id AND status = 'waitlist';

            PERFORM send_notification(
                'registration_waitlist',
                NEW.email,
                NEW.user_id,
                NEW.event_id,
                NEW.id,
                'You''re on the waitlist for ' || v_event.title,
                'You''ve been added to the waitlist for "' || v_event.title || '" at position #' || v_position || '. We''ll notify you if a spot opens up!',
                6,
                v_event.start_at + INTERVAL '7 days'
            );
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_created_notify ON public.event_registrations;
CREATE TRIGGER on_registration_created_notify
    AFTER INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_registration_created();

-- 11. 创建触发器：候补递补通知
CREATE OR REPLACE FUNCTION public.handle_waitlist_promotion()
RETURNS TRIGGER AS $$
DECLARE
    v_event RECORD;
BEGIN
    -- 只在状态从 waitlist 变为 confirmed 时发送
    IF OLD.status = 'waitlist' AND NEW.status = 'confirmed' THEN
        SELECT title INTO v_event
        FROM events_v1
        WHERE id = NEW.event_id;

        PERFORM send_notification(
            'waitlist_promoted',
            NEW.email,
            NEW.user_id,
            NEW.event_id,
            NEW.id,
            'Great news! You got a spot for ' || v_event.title || '!',
            'A spot has opened up and you''re now registered for "' || v_event.title || '"! Your ticket code is: ' || NEW.ticket_code,
            9,
            NEW.event_id IN (SELECT id FROM events_v1 WHERE start_at > NOW()) -- 如果活动还没开始
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_waitlist_promoted_notify ON public.event_registrations;
CREATE TRIGGER on_waitlist_promoted_notify
    AFTER UPDATE ON public.event_registrations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_waitlist_promotion();

COMMENT ON TABLE public.notifications IS '通知消息存储：报名确认、活动提醒、候补递补等';
COMMENT ON TABLE public.notification_preferences IS '用户通知偏好设置';
COMMENT ON TABLE public.notification_templates IS '通知模板，支持多语言和多渠道';
COMMENT ON FUNCTION public.send_notification IS '发送通知的入口函数';
COMMENT ON FUNCTION public.schedule_24h_reminders IS '定时任务：为24小时内的活动创建提醒';
COMMENT ON FUNCTION public.schedule_1h_reminders IS '定时任务：为1小时内的活动创建提醒';
COMMENT ON FUNCTION public.handle_registration_created IS '触发器：自动发送报名确认/待审核/候补通知';