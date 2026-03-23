# 社群功能完善

## 📋 完成内容

### 1. 后端 API 开发

**文件**: [routes/communities.py](file:///f:\herenow\apps\api-gateway\routes\communities.py)

**新增的 API 端点**:

| 端点 | 方法 | 功能 | 认证 |
|--------|------|------|------|
| `/api/v1/communities` | POST | 创建社群 | ✅ 需要 |
| `/api/v1/communities/{community_id}/join` | POST | 加入社群 | ✅ 需要 |
| `/api/v1/communities/{community_id}/leave` | POST | 离开社群 | ✅ 需要 |
| `/api/v1/communities/{community_id}` | PUT | 更新社群信息 | ✅ 需要 |
| `/api/v1/communities/{community_id}` | DELETE | 删除社群 | ✅ 需要 |
| `/api/v1/communities/{community_id}` | GET | 获取社群详情 | ❌ 不需要 |

**API 功能说明**:

#### 创建社群 (POST /api/v1/communities)
- 检查 slug 是否已存在
- 创建社群记录
- 创建者自动成为 owner 成员
- 返回创建的社群信息

**请求体**:
```json
{
  "name": "社群名称",
  "slug": "community-slug",
  "description": "社群描述",
  "theme_color": "#FF6B3D",
  "privacy": "public",
  "location_type": "global",
  "location": "全球",
  "city": "",
  "cover_image_url": "https://...",
  "invite_link": true,
  "invite_email": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "社群名称",
    "slug": "community-slug",
    ...
  }
}
```

#### 加入社群 (POST /api/v1/communities/{community_id}/join)
- 检查是否已经是成员
- 创建成员记录（role: "member", status: "active"）
- 触发器自动更新社群成员数

**响应**:
```json
{
  "success": true,
  "message": "成功加入社群"
}
```

#### 离开社群 (POST /api/v1/communities/{community_id}/leave)
- 检查是否是成员
- owner 不能离开（只能删除社群）
- 删除成员记录
- 触发器自动更新社群成员数

**响应**:
```json
{
  "success": true,
  "message": "成功离开社群"
}
```

#### 更新社群 (PUT /api/v1/communities/{community_id})
- 检查是否是 owner
- 只能更新提供的字段
- 支持更新：name, description, logo_url, cover_image_url, settings

**请求体**:
```json
{
  "name": "新名称",
  "description": "新描述",
  "logo_url": "https://...",
  "cover_image_url": "https://...",
  "settings": {
    "theme_color": "#FF6B3D",
    ...
  }
}
```

#### 删除社群 (DELETE /api/v1/communities/{community_id})
- 检查是否是 owner
- 删除社群（会级联删除所有成员和活动）
- 触发器自动更新社群成员数

**响应**:
```json
{
  "success": true,
  "message": "社群已删除"
}
```

#### 获取社群详情 (GET /api/v1/communities/{community_id})
- 调用数据库函数 `get_community_details`
- 包含社群信息和所有者信息
- 如果用户已登录，返回是否是成员和角色

**响应**:
```json
{
  "success": true,
  "data": {
    "community_id": "uuid",
    "community_name": "社群名称",
    "community_description": "描述",
    "community_logo_url": "https://...",
    "community_cover_image_url": "https://...",
    "community_members_count": 100,
    "community_events_count": 10,
    "community_settings": {...},
    "owner_id": "uuid",
    "owner_name": "所有者名称",
    "owner_avatar_url": "https://...",
    "is_member": true,
    "member_role": "member"
  }
}
```

### 2. 前端集成

**文件**: [app/(main)/create/community/page.tsx](file:///f:\herenow\apps\frontend\app\(main)\create\community\page.tsx)

**修改内容**:

#### 创建社群页面
- 添加 `isCreating` 状态 - 显示创建中状态
- 添加 `error` 状态 - 显示错误信息
- 修改 `handleCreate` 函数 - 调用真实 API
- 添加表单验证 - 检查名称和 slug
- 添加错误提示 - 显示 API 返回的错误
- 添加加载状态 - 创建时显示 "Creating..."

**文件**: [app/(main)/home/page.tsx](file:///f:\herenow\apps\frontend\app\(main)\home\page.tsx)

**修改内容**:

#### 首页社群卡片
- 修改 `handleLeaveJoined` 函数 - 调用离开社群 API
- 修改 `handleDeleteMy` 函数 - 调用删除社群 API
- 添加错误处理 - 显示 API 返回的错误
- 添加确认对话框 - 确认操作

### 3. 路由注册

**文件**: [main.py](file:///f:\herenow\apps\api-gateway\main.py)

**修改内容**:
- 导入 `communities` 路由
- 注册社群路由到应用

```python
from routes import home, auth, events, ai, users, communities

app.include_router(communities.router, prefix="/api/v1", tags=["社群"])
```

### 4. 测试脚本

**文件**: [test_community_crud.py](file:///f:\herenow\apps\api-gateway\test_community_crud.py)

**测试内容**:
- 测试创建社群端点
- 测试获取社群详情端点
- 测试加入社群端点
- 测试离开社群端点
- 测试更新社群端点
- 测试删除社群端点

## 🔧 数据库支持

### community_members 表
- 管理用户与社群的关系
- 支持成员角色（owner/admin/member）
- 支持成员状态（active/pending/banned）
- 自动更新社群成员数（通过触发器）

### 触发器
- `trigger_update_community_members_count` - 自动维护 `communities.members_count` 字段

### 辅助函数
- `get_user_communities(p_user_id)` - 获取用户的所有社群
- `get_community_details(p_community_id)` - 获取社群详情

## 📊 数据流

```
用户创建社群
    ↓
POST /api/v1/communities
    ↓
创建 communities 记录
    ↓
创建 community_members 记录（owner）
    ↓
触发器更新 members_count
```

```
用户加入社群
    ↓
POST /api/v1/communities/{id}/join
    ↓
创建 community_members 记录（member）
    ↓
触发器更新 members_count
```

```
用户离开社群
    ↓
POST /api/v1/communities/{id}/leave
    ↓
删除 community_members 记录
    ↓
触发器更新 members_count
```

## ✅ 完成状态

| 项目 | 状态 |
|------|------|
| 后端 API 开发 | ✅ 已完成 |
| 前端创建社群集成 | ✅ 已完成 |
| 前端首页集成 | ✅ 已完成 |
| 路由注册 | ✅ 已完成 |
| 测试脚本 | ✅ 已创建 |

## 🎯 使用示例

### 前端创建社群

1. 访问 `/create/community`
2. 填写社群信息
3. 点击 "Create Community"
4. 成功后跳转到首页

### 前端加入社群

1. 在首页发现社群
2. 点击加入按钮
3. 确认加入

### 前端离开社群

1. 在首页查看已加入的社群
2. 点击卡片菜单
3. 选择 "Leave Community"
4. 确认离开

### 前端删除社群

1. 在首页查看创建的社群
2. 点击卡片菜单
3. 选择 "Delete Community"
4. 确认删除

## 📝 注意事项

1. **权限控制**:
   - 只有 owner 可以更新和删除社群
   - owner 不能离开社群（只能删除）
   - 成员可以离开社群

2. **数据一致性**:
   - 触发器自动维护 `members_count`
   - 删除社群会级联删除所有成员
   - 删除用户会级联删除所有成员记录

3. **错误处理**:
   - 前端显示友好的错误信息
   - 后端返回详细的错误信息
   - 所有操作都有确认对话框

4. **测试建议**:
   - 运行测试脚本验证 API 端点
   - 在前端测试完整流程
   - 检查数据库触发器是否正常工作

## 🚀 后续优化建议

1. **社群搜索** - 添加搜索和筛选功能
2. **成员管理** - 添加成员列表和管理功能
3. **帖子功能** - 实现社群帖子系统
4. **邀请功能** - 实现邀请链接和邮件邀请
5. **权限管理** - 添加 admin 角色和权限控制
6. **活动关联** - 实现社群活动功能
7. **通知系统** - 添加社群通知
8. **统计功能** - 添加社群统计和分析
