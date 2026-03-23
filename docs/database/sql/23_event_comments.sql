-- HereNow 活动评论表
-- 用于活动详情页的评论功能

-- 1. 创建活动评论表
CREATE TABLE IF NOT EXISTS public.event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events_v1(id) ON DELETE CASCADE,

    -- 评论内容
    content TEXT NOT NULL,
    parent_id UUID REFERENCES event_comments(id) ON DELETE CASCADE, -- 用于回复

    -- 评论者信息
    user_id UUID REFERENCES profiles(id), -- 可以为空（游客评论）
    author_name TEXT,
    author_email TEXT,
    author_avatar TEXT,

    -- 统计
    likes_count INT DEFAULT 0,

    -- 状态
    is_pinned BOOLEAN DEFAULT FALSE, -- 策展人置顶
    is_hidden BOOLEAN DEFAULT FALSE, -- 被隐藏

    -- 时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看评论
CREATE POLICY "Event comments are viewable by everyone" ON public.event_comments
    FOR SELECT USING (true);

-- 策展人可以删除评论
CREATE POLICY "Event hosts can delete comments" ON public.event_comments
    FOR DELETE USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
    );

-- 策展人可以隐藏评论
CREATE POLICY "Event hosts can update comments" ON public.event_comments
    FOR UPDATE USING (
        auth.uid() = (SELECT host_id FROM events_v1 WHERE id = event_id)
    );

-- 登录用户可以发表评论
CREATE POLICY "Authenticated users can insert comments" ON public.event_comments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL OR author_email IS NOT NULL
    );

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_comments_event ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_parent ON public.event_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created ON public.event_comments(created_at DESC);

-- 2. 创建评论点赞表
CREATE TABLE IF NOT EXISTS public.event_comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- RLS
ALTER TABLE public.event_comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own likes" ON public.event_comment_likes
    FOR ALL USING (auth.uid() = user_id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_event_comment_likes_comment ON public.event_comment_likes(comment_id);

-- 3. 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_comments_updated_at ON public.event_comments;
CREATE TRIGGER update_event_comments_updated_at
    BEFORE UPDATE ON public.event_comments
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

COMMENT ON TABLE public.event_comments IS '活动评论表，支持回复和点赞';
COMMENT ON TABLE public.event_comment_likes IS '活动评论点赞表';