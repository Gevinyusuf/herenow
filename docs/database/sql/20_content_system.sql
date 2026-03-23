-- HereNow 内容沉淀系统
-- 基于 AGENTS.md PRD v2.3
-- 活动结束后补充照片、回顾、课件、视频、评价，形成 SEO 内容资产

-- 1. 创建活动内容表（活动后的内容沉淀）
CREATE TABLE IF NOT EXISTS public.event_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,

    -- 内容类型
    content_type TEXT NOT NULL CHECK (content_type IN (
        'album',      -- 照片相册
        'review',     -- 文字回顾
        'materials', -- 课件资料
        'video',     -- 视频
        'rating'     -- 评分评价
    )),

    -- 标题和描述
    title TEXT,
    description TEXT,

    -- 内容数据（JSONB 存储不同类型的内容）
    content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- album: { "photos": [{"url": "...", "caption": "..."}], "cover_photo": "..." }
    -- review: { "body": "...", "author_name": "...", "author_email": "..." }
    -- materials: { "files": [{"name": "...", "url": "...", "type": "..."}] }
    -- video: { "url": "...", "platform": "youtube|vimeo|other", "embed_id": "..." }
    -- rating: { "score": 1-5, "comment": "...", "author_name": "..." }

    -- 关联用户
    author_id UUID REFERENCES profiles(id),
    author_email TEXT, -- 用于 Guest 用户

    -- 状态
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE, -- 策展人精选

    -- 统计
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event contents are viewable by everyone" ON public.event_contents
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage contents" ON public.event_contents
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
        OR auth.uid() = author_id
    );

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_contents_event ON public.event_contents(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contents_type ON public.event_contents(content_type);
CREATE INDEX IF NOT EXISTS idx_event_contents_author ON public.event_contents(author_id);

-- 2. 创建活动相册照片表
CREATE TABLE IF NOT EXISTS public.event_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_content_id UUID NOT NULL REFERENCES event_contents(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    width INT,
    height INT,
    sort_order INT DEFAULT 0,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event photos are viewable by everyone" ON public.event_photos
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage photos" ON public.event_photos
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = (SELECT event_id FROM event_contents WHERE id = event_content_id))
        OR auth.uid() = uploaded_by
    );

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_photos_content ON public.event_photos(event_content_id);

-- 3. 创建活动评分表（单独存储，便于统计）
CREATE TABLE IF NOT EXISTS public.event_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id), -- 可以是 NULL（Guest 用户）
    email TEXT NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id),
    UNIQUE(event_id, email)
);

-- RLS
ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event ratings are viewable by everyone" ON public.event_ratings
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage ratings" ON public.event_ratings
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
    );
CREATE POLICY "Users can insert own ratings" ON public.event_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR (user_id IS NULL AND auth.uid() IS NULL)
    );
CREATE POLICY "Users can update own ratings" ON public.event_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_ratings_event ON public.event_ratings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ratings_score ON public.event_ratings(score);

-- 4. 创建课件资料表
CREATE TABLE IF NOT EXISTS public.event_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_content_id UUID NOT NULL REFERENCES event_contents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'pdf' | 'ppt' | 'pptx' | 'doc' | 'other'
    file_size INT, -- bytes
    download_count INT DEFAULT 0,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event materials are viewable by everyone" ON public.event_materials
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage materials" ON public.event_materials
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = (SELECT event_id FROM event_contents WHERE id = event_content_id))
        OR auth.uid() = uploaded_by
    );

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_materials_content ON public.event_materials(event_content_id);

-- 5. 创建视图：活动内容统计
DROP VIEW IF EXISTS public.v_event_content_stats CASCADE;

CREATE VIEW public.v_event_content_stats AS
SELECT
    e.id AS event_id,
    e.title,
    e.start_at,
    e.host_id,

    -- 照片统计
    (SELECT COUNT(*) FROM event_photos ep
        JOIN event_contents ec ON ep.event_content_id = ec.id
        WHERE ec.event_id = e.id AND ec.content_type = 'album'
    )::int AS photo_count,

    -- 回顾统计
    (SELECT COUNT(*) FROM event_contents
        WHERE event_id = e.id AND content_type = 'review' AND is_published = TRUE
    )::int AS review_count,

    -- 课件统计
    (SELECT COUNT(*) FROM event_materials em
        JOIN event_contents ec ON em.event_content_id = ec.id
        WHERE ec.event_id = e.id
    )::int AS material_count,

    -- 视频统计
    (SELECT COUNT(*) FROM event_contents
        WHERE event_id = e.id AND content_type = 'video' AND is_published = TRUE
    )::int AS video_count,

    -- 评分统计
    COALESCE((SELECT AVG(score)::numeric(3,2)
        FROM event_ratings
        WHERE event_id = e.id
    ), 0)::numeric(3,2) AS avg_rating,

    (SELECT COUNT(*) FROM event_ratings WHERE event_id = e.id)::int AS rating_count,

    -- 总浏览量
    COALESCE((SELECT SUM(view_count)
        FROM event_contents
        WHERE event_id = e.id
    ), 0)::int AS total_views,

    -- 总点赞数
    COALESCE((SELECT SUM(like_count)
        FROM event_contents
        WHERE event_id = e.id
    ), 0)::int AS total_likes

FROM events_v1 e;

-- 6. 创建函数：更新内容统计
CREATE OR REPLACE FUNCTION public.increment_content_stats(
    p_content_id UUID,
    p_stat_type TEXT -- 'view' | 'like'
)
RETURNS VOID AS $$
BEGIN
    IF p_stat_type = 'view' THEN
        UPDATE event_contents
        SET view_count = view_count + 1
        WHERE id = p_content_id;
    ELSIF p_stat_type = 'like' THEN
        UPDATE event_contents
        SET like_count = like_count + 1
        WHERE id = p_content_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建函数：获取活动已完成状态（用于判断是否可以添加沉淀内容）
CREATE OR REPLACE FUNCTION public.is_event_ended(p_event_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_end_at TIMESTAMPTZ;
BEGIN
    SELECT end_at INTO v_end_at
    FROM events_v1
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    RETURN v_end_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建函数：获取用户报名的活动（用于判断是否可以评分）
CREATE OR REPLACE FUNCTION public.can_rate_event(
    p_event_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
BEGIN
    IF p_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM event_registrations
        WHERE event_id = p_event_id
            AND user_id = p_user_id
            AND status = 'confirmed';
    ELSIF p_email IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM event_registrations
        WHERE event_id = p_event_id
            AND email = p_email
            AND status = 'confirmed';
    ELSE
        RETURN FALSE;
    END IF;

    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_contents_updated_at ON public.event_contents;
CREATE TRIGGER update_event_contents_updated_at
    BEFORE UPDATE ON public.event_contents
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_ratings_updated_at ON public.event_ratings;
CREATE TRIGGER update_event_ratings_updated_at
    BEFORE UPDATE ON public.event_ratings
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

COMMENT ON TABLE public.event_contents IS '活动内容沉淀：照片相册、文字回顾、课件资料、视频、评分';
COMMENT ON TABLE public.event_photos IS '活动相册照片';
COMMENT ON TABLE public.event_ratings IS '活动评分（1-5星）';
COMMENT ON TABLE public.event_materials IS '活动课件资料';
COMMENT ON FUNCTION public.is_event_ended IS '判断活动是否已结束';
COMMENT ON FUNCTION public.can_rate_event IS '判断用户是否可以对活动评分';