-- ============================================
-- 社群成员表
-- 用于管理用户与社群的关系
-- ============================================

-- 检查 profiles 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) THEN
        RAISE NOTICE 'profiles 表不存在，请先执行 01_profiles.sql';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- 用户和社群的关联
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,

    -- 成员角色: 'owner', 'admin', 'member'
    role VARCHAR(20) DEFAULT 'member' NOT NULL,

    -- 成员状态: 'active', 'pending', 'banned'
    status VARCHAR(20) DEFAULT 'active' NOT NULL,

    -- 加入时间
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- 唯一约束：一个用户在一个社群中只能有一条记录
    UNIQUE(user_id, community_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON public.community_members(status);

-- RLS (Row Level Security)
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看社群成员列表
CREATE POLICY "Community members are viewable by everyone"
ON public.community_members
FOR SELECT
USING (true);

-- 用户可以查看自己的成员记录
CREATE POLICY "Users can view their own community memberships"
ON public.community_members
FOR SELECT
USING (auth.uid() = user_id);

-- 用户可以加入社群
CREATE POLICY "Users can join communities"
ON public.community_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的成员记录（如退出社群）
CREATE POLICY "Users can update their own community memberships"
ON public.community_members
FOR UPDATE
USING (auth.uid() = user_id);

-- 用户可以删除自己的成员记录（退出社群）
CREATE POLICY "Users can delete their own community memberships"
ON public.community_members
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 触发器：自动更新社群成员数
-- ============================================

CREATE OR REPLACE FUNCTION update_community_members_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE public.communities
        SET members_count = members_count + 1,
            updated_at = NOW()
        WHERE id = NEW.community_id;
    ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status != 'active') THEN
        UPDATE public.communities
        SET members_count = GREATEST(members_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.community_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_community_members_count
AFTER INSERT OR UPDATE OR DELETE ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_members_count();

-- ============================================
-- 辅助函数：获取用户的社群列表
-- ============================================

CREATE OR REPLACE FUNCTION get_user_communities(p_user_id UUID)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    community_slug TEXT,
    community_description TEXT,
    community_logo_url TEXT,
    community_cover_image_url TEXT,
    community_members_count INT,
    community_events_count INT,
    community_settings JSONB,
    community_created_at TIMESTAMPTZ,
    community_updated_at TIMESTAMPTZ,
    member_role VARCHAR(20),
    member_status VARCHAR(20),
    member_joined_at TIMESTAMPTZ,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS community_id,
        c.name AS community_name,
        c.slug AS community_slug,
        c.description AS community_description,
        c.logo_url AS community_logo_url,
        c.cover_image_url AS community_cover_image_url,
        c.members_count AS community_members_count,
        c.events_count AS community_events_count,
        c.settings AS community_settings,
        c.created_at AS community_created_at,
        c.updated_at AS community_updated_at,
        cm.role AS member_role,
        cm.status AS member_status,
        cm.joined_at AS member_joined_at,
        (c.owner_id = p_user_id) AS is_owner
    FROM public.communities c
    INNER JOIN public.community_members cm ON c.id = cm.community_id
    WHERE cm.user_id = p_user_id
      AND cm.status = 'active'
    ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 辅助函数：获取社群详情（包含成员信息）
-- ============================================

CREATE OR REPLACE FUNCTION get_community_details(p_community_id UUID)
RETURNS TABLE (
    community_id UUID,
    community_name TEXT,
    community_slug TEXT,
    community_description TEXT,
    community_logo_url TEXT,
    community_cover_image_url TEXT,
    community_members_count INT,
    community_events_count INT,
    community_settings JSONB,
    community_created_at TIMESTAMPTZ,
    community_updated_at TIMESTAMPTZ,
    owner_id UUID,
    owner_name TEXT,
    owner_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS community_id,
        c.name AS community_name,
        c.slug AS community_slug,
        c.description AS community_description,
        c.logo_url AS community_logo_url,
        c.cover_image_url AS community_cover_image_url,
        c.members_count AS community_members_count,
        c.events_count AS community_events_count,
        c.settings AS community_settings,
        c.created_at AS community_created_at,
        c.updated_at AS community_updated_at,
        c.owner_id,
        p.display_name AS owner_name,
        p.avatar_url AS owner_avatar_url
    FROM public.communities c
    LEFT JOIN public.profiles p ON c.owner_id = p.id
    WHERE c.id = p_community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 注释说明
-- ============================================
-- community_members 表字段说明：
-- - id: 唯一标识符
-- - user_id: 用户 ID
-- - community_id: 社群 ID
-- - role: 成员角色（owner/admin/member）
-- - status: 成员状态（active/pending/banned）
-- - joined_at: 加入时间
--
-- 触发器说明：
-- - trigger_update_community_members_count: 自动更新社群的 members_count 字段
--
-- 辅助函数说明：
-- - get_user_communities(p_user_id): 获取用户的所有社群
-- - get_community_details(p_community_id): 获取社群详情
