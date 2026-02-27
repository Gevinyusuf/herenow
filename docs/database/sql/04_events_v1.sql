CREATE TABLE events_v1 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 基础信息
    title TEXT NOT NULL, -- 对应 eventName
    slug TEXT UNIQUE NOT NULL, -- 用于生成友好 URL
    description TEXT, -- 存 HTML 字符串
    cover_image_url TEXT,
    
    -- 时间 (关键)
    -- 建议前端把 startDate + startTime 组合成 ISO 字符串存入这里
    start_at TIMESTAMPTZ NOT NULL, 
    end_at TIMESTAMPTZ NOT NULL,
    -- 必须存时区，否则跨国用户看时间会乱
    timezone TEXT NOT NULL, -- 例如 'America/New_York'
    
    -- 地点/虚拟 (利用 JSONB 的多态性)
    -- 对应前端 logic: isVirtual ? meetingLink : location
    -- 存: {"type": "virtual", "link": "zoom.us/..."} 
    -- 或: {"type": "offline", "name": "San Francisco", "lat": 12, "lng": 34}
    location_info JSONB DEFAULT '{}'::jsonb,
    
    -- 可见性 & 权限
    visibility TEXT DEFAULT 'public', -- 'public' | 'private'
    require_approval BOOLEAN DEFAULT FALSE,
    host_id UUID REFERENCES profiles(id), -- 对应 host
    
    -- ★★★ 你的核心问题：主题与视觉配置 ★★★
    -- 这里存 theme 和 effect
    -- 建议结构: { "themeId": "midnight", "effect": "sparkles", "colors": { "bg": "...", "text": "..." } }
    style_config JSONB DEFAULT '{}'::jsonb,
    
    -- 报名表单配置
    -- 对应 questions 数组
    registration_fields JSONB DEFAULT '[]'::jsonb,
    
    -- 票务配置
    -- 对应 tickets 数组，存储票种、价格、数量等信息
    ticket_config JSONB DEFAULT '{"tickets": []}'::jsonb,
    
    -- 联合主办方
    -- 对应 coHosts 数组，存储联合主办方ID和相关信息
    co_hosts JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_events_host ON events_v1(host_id);
CREATE INDEX idx_events_start ON events_v1(start_at);