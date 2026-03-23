-- HereNow 活动资源和相册表
-- 基于现有前端代码要求的表结构

-- 1. 创建活动资源表 (event_resources)
CREATE TABLE IF NOT EXISTS public.event_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,

    -- 资源信息
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INT, -- bytes

    -- 访问控制
    require_registration BOOLEAN DEFAULT FALSE, -- 是否需要报名才能下载

    -- 上传者
    uploaded_by UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event resources are viewable by everyone" ON public.event_resources
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage resources" ON public.event_resources
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
    );
CREATE POLICY "Authenticated users can upload resources" ON public.event_resources
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_resources_event ON public.event_resources(event_id);

-- 2. 创建活动相册照片表 (event_gallery_photos)
CREATE TABLE IF NOT EXISTS public.event_gallery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,

    -- 照片信息
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,

    -- 互动统计
    likes_count INT DEFAULT 0,
    liked_by UUID REFERENCES profiles(id), -- 点赞用户

    -- 上传者
    uploaded_by UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery photos are viewable by everyone" ON public.event_gallery_photos
    FOR SELECT USING (true);
CREATE POLICY "Event hosts can manage photos" ON public.event_gallery_photos
    FOR ALL USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
    );
CREATE POLICY "Authenticated users can upload photos" ON public.event_gallery_photos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_gallery_photos_event ON public.event_gallery_photos(event_id);

-- 3. 创建点赞表 (event_photo_likes) - 用于追踪谁点赞了照片
CREATE TABLE IF NOT EXISTS public.event_photo_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID NOT NULL REFERENCES event_gallery_photos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, user_id)
);

-- RLS
ALTER TABLE public.event_photo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own likes" ON public.event_photo_likes
    FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.event_photo_likes
    FOR ALL USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_photo_likes_photo ON public.event_photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_event_photo_likes_user ON public.event_photo_likes(user_id);

COMMENT ON TABLE public.event_resources IS '活动课件资料表';
COMMENT ON TABLE public.event_gallery_photos IS '活动相册照片表';
COMMENT ON TABLE public.event_photo_likes IS '活动照片点赞表';