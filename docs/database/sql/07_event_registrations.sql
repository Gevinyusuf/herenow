CREATE TABLE event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 关联关系
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id), -- 报名的用户
    
    -- 核心状态管理
    -- 状态枚举建议：'pending'(待审核), 'confirmed'(已报名/已通过), 'rejected'(已拒绝), 'cancelled'(用户自行取消), 'waitlist'(候补)
    status TEXT NOT NULL DEFAULT 'confirmed', 
    
    -- 动态表单回答 (核心设计)
    -- 对应 events_v1 中的 registration_fields
    -- 结构建议: { "question_slug_1": "Answer", "company": "OpenAI", "is_vegetarian": true }
    form_answers JSONB DEFAULT '{}'::jsonb,

    -- 票务与核销信息
    ticket_code TEXT UNIQUE NOT NULL, -- 生成一个短码(如 6位随机字符)用于生成二维码/核销
    checked_in_at TIMESTAMPTZ, -- 签到时间，如果不为 NULL 则表示已签到
    
    -- 冗余用户信息 (快照)
    -- 为什么存冗余？因为用户 Profile 可能会改名/改邮箱，但历史报名记录最好保留当时的快照
    -- 同时也方便导出 Excel 名单，不用每次都 Join profiles 表
    email TEXT NOT NULL, 
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,

    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- 约束：同一个用户对同一个活动只能报一次名 (防止重复提交)
    UNIQUE(event_id, user_id)
);

-- 索引优化
-- 1. 查找某用户的所有报名记录 (用户中心-我的活动)
CREATE INDEX idx_registrations_user ON event_registrations(user_id);
-- 2. 查找某活动的所有报名者 (主办方后台-报名管理)
CREATE INDEX idx_registrations_event ON event_registrations(event_id);
-- 3. 按照状态筛选 (例如：只看待审核的人)
CREATE INDEX idx_registrations_status ON event_registrations(event_id, status);
-- 4. 签到时根据票码查询
CREATE INDEX idx_registrations_ticket ON event_registrations(ticket_code);