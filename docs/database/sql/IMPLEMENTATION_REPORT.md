# HereNow AGENTS.md 改造完成报告

基于 `docs/AGENTS.md` PRD v2.3 规范，对项目进行了全面改造。

---

## ✅ 已完成的改造

### 1. 数据库层改造

| 文件 | 描述 |
|-----|------|
| `18_user_identity_system.sql` | 三层身份系统 (Guest → Lite → Full) |
| `19_registration_system.sql` | 报名管理系统 (审核/候补/名额控制) |
| `20_content_system.sql` | 内容沉淀系统 (照片/回顾/评价/课件) |
| `21_notification_system.sql` | 通知系统 (邮件/推送/提醒) |

### 2. API 层改造

| 文件 | 描述 |
|-----|------|
| `routes/events/registration.py` | 报名相关 API |
| `routes/events/contents.py` | 活动内容 API |
| `routes/notifications.py` | 通知相关 API |
| `routes/users/identity.py` | 用户身份升级 API |

### 3. 前端层改造

| 文件 | 描述 |
|-----|------|
| `hooks/useEntitlements.ts` | 支持新身份系统 (isGuest/isLite/isFull) |

---

## 📊 改造详情

### 1. 三层身份系统 (Guest → Lite → Full)

#### 数据库变更 (`18_user_identity_system.sql`)

```sql
-- 新增用户身份类型
CREATE TYPE user_identity AS ENUM ('guest', 'lite', 'full');

-- profiles 表新增字段
ALTER TABLE profiles ADD COLUMN user_identity user_identity DEFAULT 'guest';

-- 新增绑定记录表
CREATE TABLE user_auth_bindings (...);

-- 新增升级事件记录表
CREATE TABLE identity_upgrade_events (...);

-- 新增视图字段
CREATE VIEW v_user_entitlements AS
SELECT
    ...,
    COALESCE(prof.user_identity, 'guest') AS user_identity,
    COALESCE((p.limits->>'feature_create_events')::boolean, false) AS can_create_events,
    COALESCE((p.limits->>'feature_ai_assistant')::boolean, false) AS can_use_ai,
    ...
```

#### API 端点 (`routes/users/identity.py`)

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/users/me/identity` | GET | 获取当前用户身份 |
| `/api/v1/users/me/upgrade-to-lite` | POST | 升级到 Lite User |
| `/api/v1/users/me/upgrade-to-full` | POST | 升级到 Full User |
| `/api/v1/users/me/upgrade-options` | GET | 获取升级选项和建议 |

#### 前端 Hook (`hooks/useEntitlements.ts`)

```typescript
// 新增返回值
isGuest: !user || data?.user_identity === 'guest',
isLite: data?.user_identity === 'lite',
isFull: data?.user_identity === 'full',
isLoggedIn: !!user,
canCreateEvents: data?.can_create_events ?? true,
canUseAI: data?.can_use_ai ?? false,
```

### 2. 报名管理系统

#### 数据库变更 (`19_registration_system.sql`)

```sql
-- 候补名单配置
ALTER TABLE events_v1 ADD COLUMN enable_waitlist BOOLEAN DEFAULT TRUE;
ALTER TABLE events_v1 ADD COLUMN waitlist_capacity INT DEFAULT 10;

-- 候补通知表
CREATE TABLE waitlist_notifications (...);

-- 活动统计视图
CREATE VIEW v_event_registration_stats AS ...;

-- 核心函数
process_registration()      -- 自动判断确认/候补
process_waitlist_promotion() -- 候补递补
handle_registration_cancellation() -- 取消时触发递补
```

#### API 端点 (`routes/events/registration.py`)

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/events/{id}/register` | POST | 报名活动 |
| `/api/v1/events/{id}/registration-status` | GET | 获取报名状态 |
| `/api/v1/events/{id}/cancel-registration` | POST | 取消报名 |
| `/api/v1/events/{id}/availability` | GET | 获取名额状态 |

### 3. 内容沉淀系统

#### 数据库变更 (`20_content_system.sql`)

```sql
-- 活动内容表
CREATE TABLE event_contents (
    content_type TEXT CHECK (content_type IN (
        'album',      -- 照片相册
        'review',     -- 文字回顾
        'materials', -- 课件资料
        'video',     -- 视频
        'rating'     -- 评分评价
    )),
    ...
);

-- 照片表
CREATE TABLE event_photos (...);

-- 评分表
CREATE TABLE event_ratings (
    score INT CHECK (score >= 1 AND score <= 5),
    ...
);

-- 课件表
CREATE TABLE event_materials (...);

-- 统计视图
CREATE VIEW v_event_content_stats AS ...;
```

#### API 端点 (`routes/events/contents.py`)

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/events/{id}/contents` | GET | 获取活动内容 |
| `/api/v1/events/{id}/contents/stats` | GET | 获取内容统计 |
| `/api/v1/events/{id}/contents/rating` | POST | 创建评分 |
| `/api/v1/events/{id}/ratings` | GET | 获取评分列表 |
| `/api/v1/events/{id}/can-rate` | GET | 检查是否可以评分 |
| `/api/v1/events/{id}/photos` | GET/POST | 获取/上传照片 |

### 4. 通知系统

#### 数据库变更 (`21_notification_system.sql`)

```sql
-- 通知类型
CREATE TYPE notification_type AS ENUM (
    'registration_confirmed',   -- 报名成功
    'registration_pending',    -- 待审核
    'registration_waitlist',   -- 进入候补
    'registration_rejected',   -- 审核被拒绝
    'event_reminder_24h',      -- 24小时前提醒
    'event_reminder_1h',       -- 1小时前提醒
    'event_changed',            -- 活动变更
    'event_cancelled',         -- 活动取消
    'waitlist_promoted',       -- 候补递补
    'event_review_published',  -- 回顾发布
    'organizer_new_event',     -- 策展人新活动
    'rating_received'           -- 收到评价
);

-- 通知表
CREATE TABLE notifications (...);

-- 通知偏好表
CREATE TABLE notification_preferences (...);

-- 通知模板表
CREATE TABLE notification_templates (...);

-- 核心函数
send_notification()           -- 发送通知
get_unread_notification_count() -- 未读数量
mark_notifications_read()      -- 标记已读
schedule_24h_reminders()       -- 24小时提醒任务
schedule_1h_reminders()       -- 1小时提醒任务
```

#### API 端点 (`routes/notifications.py`)

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/api/v1/notifications` | GET | 获取通知列表 |
| `/api/v1/notifications/unread-count` | GET | 未读数量 |
| `/api/v1/notifications/mark-read` | POST | 标记已读 |
| `/api/v1/notifications/read-all` | POST | 全部标记已读 |
| `/api/v1/notifications/{id}` | DELETE | 删除通知 |
| `/api/v1/notification-preferences` | GET/PUT | 获取/更新偏好设置 |

---

## 🔄 AGENTS.md 核心流程对应

### 流程一：策展人创建活动旅程 ✅

| 步骤 | 实现状态 |
|-----|---------|
| 01 首页展示活动模板画廊 + AI 创建入口 | ✅ 已有 |
| 02 一句话描述 / 选择模板 / 上传海报 | ✅ 已有 |
| 03 AI 解析与生成 | ✅ 已有 |
| 04 对话式修改 | ⚠️ 待完善 |
| 05 预览与微调 | ✅ 已有 |
| 06 设置报名规则 (人数上限/审核/候补) | ✅ 本次新增 |
| 07 一键发布 | ✅ 已有 |
| 08 分享传播 | ⚠️ 待完善 |

### 流程二：参与者报名旅程 ✅

| 步骤 | 实现状态 |
|-----|---------|
| 01 收到活动链接 | ✅ 已有 |
| 02 无需登录，页面加载 | ✅ 已有 |
| 03 浏览活动详情 | ✅ 已有 |
| 04 点击"立即报名" | ✅ 已有 |
| 05 填写报名表单 (自定义字段) | ✅ 已有 |
| 06 判断报名状态 (确认/审核/候补) | ✅ 本次新增 |
| 07 报名成功页 + 升级引导 | ⚠️ 待完善 |
| 08 发送确认邮件 (.ics) | ⚠️ 待完善 |

### 流程三：活动页面生命周期 ⚠️ 部分

| 阶段 | 实现状态 |
|-----|---------|
| 活动前·报名阶段 | ✅ |
| 活动中·进行阶段 | ⚠️ 签到功能待完善 |
| 活动后·内容沉淀 | ✅ 本次新增 |

### 流程四：用户身份渐进升级 ✅

| 身份 | 权益 | 实现状态 |
|-----|------|---------|
| Guest | 仅填写表单报名 | ✅ |
| Lite | 绑定 Google/Apple | ✅ 本次新增 |
| Full | 完整注册/创建活动/AI | ✅ 本次新增 |

---

## 📝 待完善功能

### P0 优先级

1. **AI 对话式修改完善**
   - 支持自然语言指令："标题太正式了" → 自动更新
   - 支持内容插入："加一句新手友好"
   - 支持样式调整："配色更温暖"

2. **报名成功页升级引导**
   - 一键绑定 Google/Apple 账号
   - 转化率 30-40%

3. **邮件通知服务**
   - 报名确认邮件
   - .ics 日历文件
   - 活动前 24h/1h 提醒

4. **SEO 基建**
   - Schema.org 结构化数据
   - 自动生成 sitemap
   - Open Graph 标签

---

## 🚀 如何应用数据库变更

需要在 Supabase SQL Editor 中按顺序执行以下文件：

```bash
# 1. 三层身份系统
18_user_identity_system.sql

# 2. 报名管理系统
19_registration_system.sql

# 3. 内容沉淀系统
20_content_system.sql

# 4. 通知系统
21_notification_system.sql
```

---

## 📋 版本信息

- 文档版本: v1.0
- 基于规范: AGENTS.md (PRD v2.3)
- 更新日期: 2026-03-21
