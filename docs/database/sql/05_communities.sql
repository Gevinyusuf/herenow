CREATE TABLE communities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 所有者 (通常是创建者)
    owner_id UUID REFERENCES profiles(id) NOT NULL,
    
    -- 基础信息
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- 用于 URL: herenow.com/community/react-lovers
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    
    -- 配置 (你的设计保留)
    -- {"social_links": [], "contact_email": "...", "color_theme": "#ff0000"}
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- 统计字段 (建议由定时任务或触发器维护，避免实时 count)
    members_count INT DEFAULT 0,
    events_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
-- 所有人可看
CREATE POLICY "Communities are viewable by everyone" ON communities FOR SELECT USING (true);
-- 只有 Owner 可改
CREATE POLICY "Owners can update communities" ON communities FOR UPDATE USING (auth.uid() = owner_id);