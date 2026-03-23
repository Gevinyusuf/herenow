-- =====================================================
-- 社群功能扩展表
-- 包含：帖子、点赞、邀请、通知
-- =====================================================

-- 1. 社群帖子表
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) NOT NULL,
    parent_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON community_posts(parent_id);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view posts" ON community_posts 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_posts.community_id 
            AND user_id = auth.uid() 
            AND status = 'active'
        )
    );

CREATE POLICY "Members can create posts" ON community_posts 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_posts.community_id 
            AND user_id = auth.uid() 
            AND status = 'active'
        )
    );

CREATE POLICY "Authors can update own posts" ON community_posts 
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts" ON community_posts 
    FOR DELETE USING (author_id = auth.uid());

-- 2. 帖子点赞表
CREATE TABLE IF NOT EXISTS community_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON community_post_likes(user_id);

ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view likes" ON community_post_likes 
    FOR SELECT USING (true);

CREATE POLICY "Members can like posts" ON community_post_likes 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_members cm
            JOIN community_posts cp ON cp.community_id = cm.community_id
            WHERE cp.id = community_post_likes.post_id
            AND cm.user_id = auth.uid()
            AND cm.status = 'active'
        )
    );

CREATE POLICY "Users can delete own likes" ON community_post_likes 
    FOR DELETE USING (user_id = auth.uid());

-- 3. 社群邀请表
CREATE TABLE IF NOT EXISTS community_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) NOT NULL,
    
    invite_type TEXT NOT NULL CHECK (invite_type IN ('link', 'email')),
    invite_code TEXT UNIQUE,
    invite_email TEXT,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    used_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_community ON community_invites(community_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON community_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_invites_email ON community_invites(invite_email);

ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invites" ON community_invites 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invites.community_id 
            AND user_id = auth.uid() 
            AND status = 'active'
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Admins can create invites" ON community_invites 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_invites.community_id 
            AND user_id = auth.uid() 
            AND status = 'active'
            AND role IN ('owner', 'admin')
        )
    );

-- 4. 社群通知表
CREATE TABLE IF NOT EXISTS community_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN (
        'new_post', 'new_comment', 'new_member', 
        'mentioned', 'invited', 'role_changed'
    )),
    
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON community_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON community_notifications(user_id, is_read);

ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON community_notifications 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON community_notifications 
    FOR UPDATE USING (user_id = auth.uid());

-- 5. 修改 community_members 表（添加新字段）
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS muted BOOLEAN DEFAULT FALSE;

-- 6. 触发器：更新帖子点赞数
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON community_post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON community_post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- 7. 触发器：更新帖子评论数
CREATE OR REPLACE FUNCTION update_post_comments_count_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.parent_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE community_posts 
    SET comments_count = GREATEST(comments_count - 1, 0) 
    WHERE id = OLD.parent_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count_insert ON community_posts;
DROP TRIGGER IF EXISTS trigger_update_post_comments_count_delete ON community_posts;

CREATE TRIGGER trigger_update_post_comments_count_insert
    AFTER INSERT ON community_posts
    FOR EACH ROW 
    WHEN (NEW.parent_id IS NOT NULL)
    EXECUTE FUNCTION update_post_comments_count_insert();

CREATE TRIGGER trigger_update_post_comments_count_delete
    AFTER DELETE ON community_posts
    FOR EACH ROW 
    WHEN (OLD.parent_id IS NOT NULL)
    EXECUTE FUNCTION update_post_comments_count_delete();

-- 8. 函数：获取社群帖子列表
CREATE OR REPLACE FUNCTION get_community_posts(
    p_community_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_sort TEXT DEFAULT 'recent',
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar_url TEXT,
    content TEXT,
    images JSONB,
    likes_count INT,
    comments_count INT,
    is_pinned BOOLEAN,
    is_locked BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_liked BOOLEAN,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.author_id,
        p.full_name as author_name,
        p.avatar_url as author_avatar_url,
        cp.content,
        cp.images,
        cp.likes_count,
        cp.comments_count,
        cp.is_pinned,
        cp.is_locked,
        cp.created_at,
        cp.updated_at,
        EXISTS (
            SELECT 1 FROM community_post_likes 
            WHERE post_id = cp.id AND user_id = p_user_id
        ) as is_liked,
        (cp.author_id = p_user_id) as is_owner
    FROM community_posts cp
    LEFT JOIN profiles p ON cp.author_id = p.id
    WHERE cp.community_id = p_community_id
    AND cp.parent_id IS NULL
    ORDER BY 
        CASE WHEN p_sort = 'popular' THEN cp.likes_count END DESC,
        CASE WHEN p_sort = 'recent' OR p_sort IS NULL THEN cp.created_at END DESC,
        cp.is_pinned DESC,
        cp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 9. 函数：获取帖子评论
CREATE OR REPLACE FUNCTION get_post_comments(
    p_post_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar_url TEXT,
    content TEXT,
    likes_count INT,
    created_at TIMESTAMPTZ,
    is_liked BOOLEAN,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.author_id,
        p.full_name as author_name,
        p.avatar_url as author_avatar_url,
        cp.content,
        cp.likes_count,
        cp.created_at,
        EXISTS (
            SELECT 1 FROM community_post_likes 
            WHERE post_id = cp.id AND user_id = p_user_id
        ) as is_liked,
        (cp.author_id = p_user_id) as is_owner
    FROM community_posts cp
    LEFT JOIN profiles p ON cp.author_id = p.id
    WHERE cp.parent_id = p_post_id
    ORDER BY cp.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 10. 函数：搜索社群
CREATE OR REPLACE FUNCTION search_communities(
    p_query TEXT DEFAULT '',
    p_location TEXT DEFAULT '',
    p_sort TEXT DEFAULT 'members',
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    members_count INT,
    events_count INT,
    settings JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.logo_url,
        c.cover_image_url,
        c.members_count,
        c.events_count,
        c.settings,
        c.created_at
    FROM communities c
    WHERE 
        (p_query = '' OR 
         c.name ILIKE '%' || p_query || '%' OR 
         c.description ILIKE '%' || p_query || '%')
    AND
        (p_location = '' OR 
         c.settings->>'city' ILIKE '%' || p_location || '%' OR
         c.settings->>'location' ILIKE '%' || p_location || '%')
    ORDER BY 
        CASE WHEN p_sort = 'members' THEN c.members_count END DESC,
        CASE WHEN p_sort = 'recent' THEN c.created_at END DESC,
        c.members_count DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 11. 函数：获取社群成员列表
CREATE OR REPLACE FUNCTION get_community_members(
    p_community_id UUID,
    p_role TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'active',
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
) RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    nickname TEXT,
    bio TEXT,
    joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.user_id,
        p.full_name,
        p.avatar_url,
        p.email,
        cm.role,
        cm.status,
        cm.nickname,
        cm.bio,
        cm.created_at as joined_at
    FROM community_members cm
    LEFT JOIN profiles p ON cm.user_id = p.id
    WHERE cm.community_id = p_community_id
    AND (p_role IS NULL OR cm.role = p_role)
    AND (p_status IS NULL OR cm.status = p_status)
    ORDER BY 
        CASE cm.role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'member' THEN 3 
        END,
        cm.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
