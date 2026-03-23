# HereNow 使用说明文档

## 目录

- [项目介绍](#项目介绍)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [功能说明](#功能说明)
- [数据库配置](#数据库配置)
- [常见问题](#常见问题)

---

## 项目介绍

HereNow 是一个活动管理和社群平台，用户可以创建活动、管理社群、邀请成员参与活动。

### 主要功能

- **活动管理**: 创建、编辑、管理活动
- **社群功能**: 创建社群、发布帖子、成员管理、邀请系统
- **地图集成**: 使用 OpenStreetMap 进行位置搜索和显示
- **用户认证**: 基于 Supabase 的用户认证系统
- **AI 功能**: AI 辅助活动创建

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | 18.x+ | 前端运行环境 |
| Python | 3.12+ | 后端运行环境 |
| npm | 9.x+ | Node 包管理器 |

### 可选软件

| 软件 | 说明 |
|------|------|
| Git | 版本控制 |
| VS Code | 推荐的代码编辑器 |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Gevinyusuf/herenow.git
cd herenow
```

### 2. 安装前端依赖

```bash
cd apps/frontend
npm install
```

### 3. 安装后端依赖

```bash
cd apps/api-gateway
pip install -r requirements.txt
```

### 4. 配置环境变量

复制环境变量模板并填写配置：

```bash
# 前端配置
cp apps/frontend/.env.example apps/frontend/.env.local

# 后端配置
cp apps/api-gateway/.env.example apps/api-gateway/.env
```

### 5. 启动项目

**启动前端**:
```bash
cd apps/frontend
npm run dev
```

**启动后端**:
```bash
cd apps/api-gateway
python run.py
```

### 6. 访问应用

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

---

## 配置说明

### 前端环境变量 (.env.local)

```env
# Supabase 配置 (必需)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API 网关地址
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000

# Google Maps API (已弃用，使用 OpenStreetMap)
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 后端环境变量 (.env)

```env
# Supabase 配置 (必需)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# R2 存储配置 (可选)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name

# AI 服务配置 (可选)
OPENROUTER_API_KEY=your_openrouter_key
```

---

## 功能说明

### 页面路由

| 路由 | 说明 |
|------|------|
| `/` | 首页/落地页 |
| `/home` | 用户主页 |
| `/discover` | 发现页面 |
| `/my-communities` | 我的社群 |
| `/my-events` | 我的活动 |
| `/create/event` | 创建活动 |
| `/create/community` | 创建社群 |
| `/community-detail?id=xxx` | 社群详情 |
| `/event-detail?id=xxx` | 活动详情 |
| `/profile` | 个人资料 |
| `/setting` | 设置 |

### 社群功能

#### 创建社群
1. 访问 `/create/community`
2. 填写社群名称、描述、封面图片
3. 点击创建

#### 社群帖子
- 发布帖子: 在社群详情页使用帖子编辑器
- 点赞/评论: 点击帖子下方的按钮
- 置顶/锁定: 管理员可在帖子菜单中操作

#### 成员管理
- 查看成员: 社群详情页的"成员"标签
- 角色管理: 管理员可更改成员角色
- 移除成员: 管理员可移除成员

#### 邀请系统
- 邀请链接: 生成可分享的邀请链接
- 邮件邀请: 通过邮件邀请用户加入

### 活动功能

#### 创建活动
1. 访问 `/create/event`
2. 填写活动信息:
   - 活动名称
   - 封面图片
   - 时间和时区
   - 地点 (支持地图搜索)
   - 描述
   - 票务设置
   - 报名表单
3. 选择主题和特效
4. 点击发布

#### 地图功能
- 使用 OpenStreetMap 进行位置搜索
- 支持地址、场馆名称、地标搜索
- 自动获取坐标信息

---

## 数据库配置

### Supabase 设置

1. 创建 Supabase 项目: https://supabase.com
2. 获取项目 URL 和 API Keys
3. 配置环境变量

### 数据库表结构

执行以下 SQL 文件初始化数据库:

```bash
# 按顺序执行 docs/database/sql/ 目录下的 SQL 文件
1. 01_profiles.sql        # 用户资料表
2. 02_plans.sql           # 订阅计划表
3. 03_subscriptions.sql   # 订阅表
4. 04_events_v1.sql       # 活动表
5. 05_communities.sql     # 社群表
6. 07_event_registrations.sql  # 活动报名表
7. 17_community_extensions.sql # 社群扩展功能
```

### 创建 profiles 表触发器

在 Supabase SQL Editor 中执行:

```sql
-- 创建枚举类型
CREATE TYPE user_status AS ENUM ('pending', 'active', 'banned');

-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    primary_intent TEXT DEFAULT 'HYBRID',
    billing_customer_id TEXT,
    status user_status DEFAULT 'pending',
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 创建自动创建 profile 的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, status)
    VALUES (
        new.id, 
        new.email, 
        new.raw_user_meta_data->>'full_name', 
        new.raw_user_meta_data->>'avatar_url',
        'pending'::user_status
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 常见问题

### 1. 前端启动失败

**问题**: `npm install` 失败
**解决**: 
```bash
# 清除缓存
npm cache clean --force
# 重新安装
npm install --legacy-peer-deps
```

### 2. 后端启动失败

**问题**: Python 模块找不到
**解决**:
```bash
# 确保使用正确的 Python 版本
python --version  # 应该是 3.12+

# 重新安装依赖
pip install -r requirements.txt
```

### 3. 数据库连接失败

**问题**: `Could not find the table`
**解决**: 
1. 确保 Supabase 项目已创建
2. 检查环境变量配置
3. 执行数据库 SQL 文件

### 4. 用户登录后创建活动失败

**问题**: `host ID does not exist in the system`
**解决**: 
确保 profiles 表和触发器已创建，新用户注册时会自动创建 profile 记录。

对于已存在的用户，手动创建 profile:
```sql
INSERT INTO profiles (id, email, full_name, status)
VALUES ('用户UUID', '用户邮箱', '用户名', 'active')
ON CONFLICT (id) DO NOTHING;
```

### 5. 地图搜索显示 undefined

**问题**: 位置搜索结果显示 undefined
**解决**: 已修复，确保使用最新代码。

### 6. 页面布局重叠

**问题**: 页面头部和内容重叠
**解决**: 已修复，确保使用最新代码。

### 7. Git 推送失败

**问题**: 无法连接到 GitHub
**解决**: 
```bash
# 配置代理 (如果有)
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送
git push origin master
```

---

## 开发命令

### 前端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式运行
npm run start

# 代码检查
npm run lint
```

### 后端

```bash
# 开发模式
python run.py

# 或使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 项目结构

```
herenow/
├── apps/
│   ├── frontend/          # Next.js 前端
│   │   ├── app/           # 页面路由
│   │   ├── components/    # React 组件
│   │   ├── lib/           # 工具库
│   │   └── hooks/         # 自定义 Hooks
│   │
│   └── api-gateway/       # FastAPI 后端
│       ├── routes/        # API 路由
│       ├── core/          # 核心模块
│       └── main.py        # 入口文件
│
├── docs/                  # 文档
│   └── database/sql/      # 数据库 SQL 文件
│
└── packages/              # 共享包
```

---

## 技术支持

如有问题，请提交 Issue: https://github.com/Gevinyusuf/herenow/issues

---

**最后更新**: 2025年3月
