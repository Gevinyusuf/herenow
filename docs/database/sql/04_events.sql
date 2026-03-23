CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 归属关系
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
    organizer_id UUID REFERENCES profiles(id) NOT NULL, -- 冗余字段，方便 RLS 和查询
    
    -- 核心内容
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL: herenow.com/event/meetup-2025
    description JSONB, -- 建议用 JSONB 存储富文本结构，比纯 TEXT 更灵活
    cover_image_url TEXT,
    
    -- 时间
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    
    -- 状态
    -- 'DRAFT', 'PUBLISHED', 'CANCELED', 'ENDED'
    status TEXT DEFAULT 'DRAFT',
    is_public BOOLEAN DEFAULT TRUE,
    
    -- 核心配置 (JSONB 是最佳实践)
    -- location: {"type": "offline", "address": "...", "lat": 0, "lng": 0}
    location_config JSONB DEFAULT '{}'::jsonb,
    
    -- 票务简要配置 (复杂票务建议分表，简单版可用 JSONB)
    -- tickets: [{"name": "Early Bird", "price": 10, "limit": 100}]
    ticket_config JSONB DEFAULT '{}'::jsonb,
    
    -- 报名限制
    capacity INT DEFAULT 100,
    registrations_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束：结束时间必须晚于开始时间
    CONSTRAINT check_event_dates CHECK (end_at > start_at)
);

-- 索引优化
CREATE INDEX idx_events_community ON events(community_id);
CREATE INDEX idx_events_start_at ON events(start_at); -- 发现页按时间排序
CREATE INDEX idx_events_status ON events(status) WHERE status = 'PUBLISHED'; -- 仅索引已发布活动