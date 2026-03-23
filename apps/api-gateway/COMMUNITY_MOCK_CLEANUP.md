# 后端 Mock 数据清理 - 社群功能

## 📋 清理内容

### 1. 创建社群成员表 (community_members)

**文件**: [community_members.sql](file:///f:\herenow\apps\api-gateway\community_members.sql)

**功能**:
- 管理用户与社群的关系
- 支持成员角色（owner/admin/member）
- 支持成员状态（active/pending/banned）
- 自动更新社群成员数（通过触发器）

**表结构**:
```sql
community_members (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    community_id UUID REFERENCES communities(id),
    role VARCHAR(20) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, community_id)
)
```

**辅助函数**:
- `get_user_communities(p_user_id)` - 获取用户的所有社群
- `get_community_details(p_community_id)` - 获取社群详情

**触发器**:
- `trigger_update_community_members_count` - 自动更新社群的 members_count 字段

### 2. 修改后端 API

**文件**: [routes/home.py](file:///f:\herenow\apps\api-gateway\routes\home.py)

**修改内容**:

#### 新增函数
- `get_user_communities_from_db(user_id)` - 从数据库获取用户的社群数据

#### 修改的端点
- `GET /home/communities` - 从 mock 数据改为真实数据库查询
- `GET /home/all` - 从 mock 数据改为真实数据库查询

#### 删除的函数
- `generate_mock_communities()` - 已删除，不再使用

### 3. API 返回数据结构

```json
{
  "success": true,
  "data": {
    "myCommunities": [
      {
        "id": "uuid",
        "name": "社群名称",
        "members": 100,
        "avatar": "🎨",
        "color": "bg-purple-100",
        "role": "Owner",
        "isPinned": false,
        "createdAt": "2024-01-01"
      }
    ],
    "joinedCommunities": [
      {
        "id": "uuid",
        "name": "社群名称",
        "members": 100,
        "avatar": "🤖",
        "color": "bg-blue-100",
        "role": "member",
        "isPinned": false,
        "joinedAt": "2024-01-01",
        "newPosts": 0
      }
    ]
  }
}
```

## 🔧 执行步骤

### 第 1 步：在 Supabase 中执行 SQL

1. 打开 [community_members.sql](file:///f:\herenow\apps\api-gateway\community_members.sql)
2. 复制所有内容
3. 粘贴到 Supabase SQL Editor
4. 点击 **Run** 执行

### 第 2 步：验证 API

```bash
cd apps/api-gateway
python test_community_api.py
```

### 第 3 步：测试前端

1. 启动前端开发服务器（如果还没启动）
2. 访问首页 `/home`
3. 检查社群部分是否正常显示

## 📊 数据库表关系

```
profiles (用户表)
    ↓ (1:N)
communities (社群表)
    ↓ (1:N)
community_members (社群成员表)
    ↓ (N:1)
profiles (用户表)
```

## ✅ 完成状态

| 项目 | 状态 |
|------|------|
| community_members 表创建 | ✅ SQL 已准备 |
| RLS 策略配置 | ✅ 已包含 |
| 触发器配置 | ✅ 已包含 |
| 辅助函数创建 | ✅ 已包含 |
| 后端 API 修改 | ✅ 已完成 |
| Mock 数据删除 | ✅ 已完成 |
| 测试脚本 | ✅ 已创建 |

## 🎯 后续优化建议

1. **头像和颜色**: 目前使用默认值，可以从 `settings` 字段读取
2. **新帖子数**: 目前设置为 0，后续可以从 `posts` 表获取
3. **分页**: 如果社群很多，需要添加分页功能
4. **缓存**: 可以添加 Redis 缓存提高性能
5. **搜索**: 可以添加社群搜索功能

## 📝 注意事项

- `community_members` 表使用 `UNIQUE(user_id, community_id)` 约束，确保一个用户在一个社群中只有一条记录
- 触发器会自动维护 `communities.members_count` 字段，无需手动更新
- RLS 策略确保用户只能操作自己的成员记录
- 删除用户或社群时，相关记录会级联删除
