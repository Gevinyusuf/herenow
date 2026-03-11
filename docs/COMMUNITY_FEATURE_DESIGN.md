# 社群功能完整设计文档

> **版本**: v2.0  
> **最后更新**: 2026-03-11  
> **状态**: 设计中

---

## 一、功能概览

### 1.1 已完成功能 ✅

| 功能 | 状态 | 说明 |
|------|------|------|
| 创建社群 | ✅ | 创建社群，创建者自动成为 owner |
| 加入社群 | ✅ | 用户加入社群 |
| 离开社群 | ✅ | 成员离开社群 |
| 更新社群 | ✅ | Owner 更新社群信息 |
| 删除社群 | ✅ | Owner 删除社群 |
| 获取社群详情 | ✅ | 获取社群基本信息 |

### 1.2 待开发功能 ⏳

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 社群搜索 | 🔴 高 | 搜索和筛选社群 |
| 成员管理 | 🔴 高 | 成员列表、角色管理、移除成员 |
| 帖子功能 | 🔴 高 | 社群帖子系统（发帖、评论、点赞） |
| 邀请功能 | 🟡 中 | 邀请链接、邮件邀请 |
| 权限管理 | 🟡 中 | Admin 角色和权限控制 |
| 活动关联 | 🟡 中 | 社群活动功能 |
| 通知系统 | 🟢 低 | 社群通知 |
| 统计功能 | 🟢 低 | 社群统计和分析 |

---

## 二、数据库设计

### 2.1 新增表结构

#### community_posts（社群帖子）

```sql
CREATE TABLE community_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 关联
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES profiles(id) NOT NULL,
    parent_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,  -- 用于评论
    
    -- 内容
    content TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,  -- ["url1", "url2"]
    
    -- 统计
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    
    -- 状态
    is_pinned BOOLEAN DEFAULT FALSE,  -- 是否置顶
    is_locked BOOLEAN DEFAULT FALSE,  -- 是否锁定（禁止评论）
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT valid_post CHECK (
        (parent_id IS NULL AND length(content) >= 10) OR  -- 帖子至少10字
        (parent_id IS NOT NULL AND length(content) >= 1)   -- 评论至少1字
    )
);

-- 索引
CREATE INDEX idx_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX idx_posts_author ON community_posts(author_id);
CREATE INDEX idx_posts_parent ON community_posts(parent_id);

-- RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by community members" ON community_posts 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM community_members 
            WHERE community_id = community_posts.community_id 
            AND user_id = auth.uid() 
            AND status = 'active'
        )
    );
```

#### community_post_likes（帖子点赞）

```sql
CREATE TABLE community_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(post_id, user_id)
);

-- 索引
CREATE INDEX idx_likes_post ON community_post_likes(post_id);
CREATE INDEX idx_likes_user ON community_post_likes(user_id);
```

#### community_invites（社群邀请）

```sql
CREATE TABLE community_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
    inviter_id UUID REFERENCES profiles(id) NOT NULL,  -- 邀请人
    
    -- 邀请方式
    invite_type TEXT NOT NULL CHECK (invite_type IN ('link', 'email')),
    invite_code TEXT UNIQUE,  -- 邀请码（链接邀请）
    invite_email TEXT,        -- 邀请邮箱（邮件邀请）
    
    -- 状态
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    used_by UUID REFERENCES profiles(id),  -- 谁使用了邀请
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_invites_community ON community_invites(community_id);
CREATE INDEX idx_invites_code ON community_invites(invite_code);
CREATE INDEX idx_invites_email ON community_invites(invite_email);
```

#### community_notifications（社群通知）

```sql
CREATE TABLE community_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    
    -- 通知类型
    type TEXT NOT NULL CHECK (type IN (
        'new_post', 'new_comment', 'new_member', 
        'mentioned', 'invited', 'role_changed'
    )),
    
    -- 通知内容
    title TEXT NOT NULL,
    content TEXT,
    data JSONB DEFAULT '{}'::jsonb,  -- 额外数据
    
    -- 状态
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_notifications_user ON community_notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON community_notifications(user_id, is_read);
```

### 2.2 修改现有表

#### community_members（添加更多字段）

```sql
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS
    nickname TEXT,  -- 社群昵称
    bio TEXT,       -- 社群简介
    last_read_at TIMESTAMPTZ,  -- 最后阅读时间
    muted BOOLEAN DEFAULT FALSE;  -- 是否静音
```

---

## 三、API 设计

### 3.1 社群搜索

```
GET /api/v1/communities/search
    ?q=关键词
    &location=城市
    &sort=members|recent
    &page=1
    &limit=20

Response:
{
    "success": true,
    "data": {
        "communities": [...],
        "total": 100,
        "page": 1,
        "limit": 20
    }
}
```

### 3.2 成员管理

```
# 获取成员列表
GET /api/v1/communities/{community_id}/members
    ?role=owner|admin|member
    &status=active|pending|banned
    &page=1
    &limit=50

# 更新成员角色（仅 owner/admin）
PUT /api/v1/communities/{community_id}/members/{user_id}/role
    { "role": "admin" }

# 移除成员（仅 owner/admin）
DELETE /api/v1/communities/{community_id}/members/{user_id}

# 转让所有权（仅 owner）
POST /api/v1/communities/{community_id}/transfer-ownership
    { "new_owner_id": "uuid" }
```

### 3.3 帖子功能

```
# 获取帖子列表
GET /api/v1/communities/{community_id}/posts
    ?sort=recent|popular
    &page=1
    &limit=20

# 创建帖子
POST /api/v1/communities/{community_id}/posts
    {
        "content": "帖子内容",
        "images": ["url1", "url2"]
    }

# 获取帖子详情（含评论）
GET /api/v1/communities/{community_id}/posts/{post_id}

# 更新帖子
PUT /api/v1/communities/{community_id}/posts/{post_id}

# 删除帖子
DELETE /api/v1/communities/{community_id}/posts/{post_id}

# 评论帖子
POST /api/v1/communities/{community_id}/posts/{post_id}/comments
    { "content": "评论内容" }

# 点赞帖子
POST /api/v1/communities/{community_id}/posts/{post_id}/like

# 取消点赞
DELETE /api/v1/communities/{community_id}/posts/{post_id}/like

# 置顶帖子（仅 owner/admin）
POST /api/v1/communities/{community_id}/posts/{post_id}/pin

# 锁定帖子（仅 owner/admin）
POST /api/v1/communities/{community_id}/posts/{post_id}/lock
```

### 3.4 邀请功能

```
# 创建邀请链接
POST /api/v1/communities/{community_id}/invites/link
    { "expires_in_days": 7 }

Response:
{
    "success": true,
    "data": {
        "invite_code": "abc123",
        "invite_url": "https://herenow.com/invite/abc123",
        "expires_at": "2026-03-18T00:00:00Z"
    }
}

# 发送邮件邀请
POST /api/v1/communities/{community_id}/invites/email
    { "emails": ["user1@example.com", "user2@example.com"] }

# 通过邀请加入
POST /api/v1/communities/join-by-invite
    { "invite_code": "abc123" }

# 获取邀请列表
GET /api/v1/communities/{community_id}/invites
```

### 3.5 通知功能

```
# 获取通知列表
GET /api/v1/notifications
    ?type=new_post|new_comment|...
    &is_read=true|false
    &page=1
    &limit=50

# 标记已读
PUT /api/v1/notifications/{notification_id}/read

# 标记全部已读
POST /api/v1/notifications/read-all

# 获取未读数量
GET /api/v1/notifications/unread-count
```

---

## 四、权限设计

### 4.1 角色权限矩阵

| 权限 | Owner | Admin | Member |
|------|-------|-------|--------|
| 查看社群信息 | ✅ | ✅ | ✅ |
| 发帖 | ✅ | ✅ | ✅ |
| 评论 | ✅ | ✅ | ✅ |
| 点赞 | ✅ | ✅ | ✅ |
| 编辑自己的帖子 | ✅ | ✅ | ✅ |
| 删除自己的帖子 | ✅ | ✅ | ✅ |
| 置顶帖子 | ✅ | ✅ | ❌ |
| 锁定帖子 | ✅ | ✅ | ❌ |
| 删除他人帖子 | ✅ | ✅ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ |
| 创建邀请 | ✅ | ✅ | ❌ |
| 更新社群信息 | ✅ | ❌ | ❌ |
| 删除社群 | ✅ | ❌ | ❌ |
| 转让所有权 | ✅ | ❌ | ❌ |

### 4.2 权限检查函数

```python
def check_community_permission(
    community_id: str, 
    user_id: str, 
    required_role: str = "member"
) -> Tuple[bool, Optional[str]]:
    """
    检查用户在社群中的权限
    
    Args:
        community_id: 社群ID
        user_id: 用户ID
        required_role: 需要的最低角色 ("member", "admin", "owner")
    
    Returns:
        (has_permission, error_message)
    """
    role_hierarchy = {"member": 1, "admin": 2, "owner": 3}
    
    # 获取用户角色
    member = supabase.table("community_members").select("role, status").eq(
        "community_id", community_id
    ).eq("user_id", user_id).execute()
    
    if not member.data:
        return False, "你不是该社群的成员"
    
    if member.data[0]["status"] != "active":
        return False, "你的成员状态异常"
    
    user_role = member.data[0]["role"]
    if role_hierarchy.get(user_role, 0) < role_hierarchy.get(required_role, 0):
        return False, f"权限不足，需要 {required_role} 或更高权限"
    
    return True, None
```

---

## 五、前端组件设计

### 5.1 社群详情页

```
CommunityDetailPage
├── CommunityHeader
│   ├── CoverImage
│   ├── Logo
│   ├── Name & Description
│   ├── Stats (members, posts, events)
│   └── ActionButtons (Join/Leave/Settings)
├── CommunityTabs
│   ├── Posts (帖子)
│   ├── Members (成员)
│   ├── Events (活动)
│   └── Settings (设置 - 仅 owner/admin)
└── TabContent
    ├── PostsTab
    │   ├── PostComposer
    │   ├── PostList
    │   │   └── PostCard
    │   │       ├── AuthorInfo
    │   │       ├── Content
    │   │       ├── Images
    │   │       ├── Actions (Like, Comment, Share)
    │   │       └── Comments
    │   └── LoadMore
    ├── MembersTab
    │   ├── MemberSearch
    │   ├── MemberList
    │   │   └── MemberCard
    │   └── ManageActions (仅 owner/admin)
    ├── EventsTab
    │   └── EventList
    └── SettingsTab
        ├── GeneralSettings
        ├── MemberManagement
        ├── InviteSettings
        └── DangerZone (Delete Community)
```

### 5.2 新增组件

| 组件 | 路径 | 功能 |
|------|------|------|
| `CommunitySearch` | `components/discover/CommunitySearch.tsx` | 社群搜索 |
| `PostComposer` | `components/community/PostComposer.tsx` | 发帖编辑器 |
| `PostCard` | `components/community/PostCard.tsx` | 帖子卡片 |
| `CommentSection` | `components/community/CommentSection.tsx` | 评论区 |
| `MemberList` | `components/community/MemberList.tsx` | 成员列表 |
| `MemberCard` | `components/community/MemberCard.tsx` | 成员卡片 |
| `InviteModal` | `components/community/InviteModal.tsx` | 邀请弹窗 |
| `NotificationBell` | `components/layout/NotificationBell.tsx` | 通知铃铛 |

---

## 六、实现计划

### Phase 1: 核心功能（1-2周）

- [ ] 数据库表创建
- [ ] 社群搜索 API
- [ ] 成员管理 API
- [ ] 帖子功能 API
- [ ] 前端社群详情页重构

### Phase 2: 增强功能（1周）

- [ ] 邀请功能 API
- [ ] 通知系统 API
- [ ] 前端邀请组件
- [ ] 前端通知组件

### Phase 3: 优化完善（1周）

- [ ] 性能优化
- [ ] 测试覆盖
- [ ] 文档完善

---

## 七、注意事项

1. **性能考虑**
   - 帖子列表使用分页加载
   - 点赞数使用 Redis 缓存（可选）
   - 通知使用实时推送（可选）

2. **安全考虑**
   - 所有操作都需要权限验证
   - 邀请链接有过期时间
   - 敏感操作需要二次确认

3. **用户体验**
   - 发帖支持图片上传
   - 支持 @提及 成员
   - 支持表情回复

---

**文档维护**: 请在开发时同步更新本文档
