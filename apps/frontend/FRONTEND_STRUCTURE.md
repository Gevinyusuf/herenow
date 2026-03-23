# HereNow 前端项目结构文档

## 📋 项目概述

HereNow 前端是一个基于 **Next.js 14+ (App Router)** 的现代化 Web 应用，采用 TypeScript 开发，使用 Tailwind CSS 进行样式管理。

## 🗂️ 目录结构

```
apps/frontend/
├── app/                          # Next.js App Router 核心目录
│   ├── (public)/                 # 公开页面路由组（无需登录）
│   ├── (main)/                   # 主应用路由组（需要登录）
│   ├── (detail)/                 # 详情页路由组（活动/社群详情）
│   ├── api/                      # API 路由（Next.js API Routes）
│   ├── auth/                     # 认证相关页面
│   ├── globals.css               # 全局样式文件
│   ├── layout.tsx                # 根布局组件
│   └── ROUTE_STRUCTURE.md         # 路由结构说明文档
│
├── components/                    # 可复用组件目录
│   ├── create/                   # 创建页面相关组件
│   ├── detail/                   # 详情页相关组件
│   ├── home/                     # 首页相关组件
│   ├── landing/                  # 落地页相关组件
│   ├── layout/                   # 布局相关组件
│   ├── manager/                  # 管理页面相关组件
│   └── ui/                       # 通用 UI 组件
│
├── hooks/                        # 自定义 React Hooks
├── middleware/                    # Next.js 中间件
├── public/                       # 静态资源文件
├── styles/                       # 样式文件
├── types/                        # TypeScript 类型定义
├── utils/                        # 工具函数
│
├── gemini-demo/                  # Gemini 演示代码（原型/参考）
│
├── next.config.js                # Next.js 配置文件
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目依赖配置
└── postcss.config.js             # PostCSS 配置
```

---

## 📁 详细模块说明

### 1. `app/` - Next.js App Router 核心目录

#### 1.1 `(public)/` - 公开页面路由组
**功能**: 未登录用户可以访问的公开页面

**路径映射**:
- `(public)/page.tsx` → `/` (官网首页)
- `(public)/about/page.tsx` → `/about` (关于我们)

**主要功能**:
- 官网首页展示
- 产品介绍
- 关于我们页面
- 等待列表注册

**关键文件**:
- `layout.tsx` - 公开页面布局（官网风格）
- `page.tsx` - 官网首页，包含 Hero、Features、Pricing、CTA 等模块

---

#### 1.2 `(main)/` - 主应用路由组
**功能**: 登录后用户的主要功能页面

**路径映射**:
- `(main)/home/page.tsx` → `/home` (用户首页)
- `(main)/create/event/page.tsx` → `/create/event` (创建活动)
- `(main)/create/community/page.tsx` → `/create/community` (创建社群)
- `(main)/home/page.tsx` → `/home` (用户首页，包含 Events 和 Communities 视图)
- `(main)/manager/event/page.tsx` → `/manager/event` (活动管理)
- `(main)/manager/community/page.tsx` → `/manager/community` (社群管理)

**主要功能**:
- **首页 (`/home`)**: 
  - 活动列表展示（即将到来/已过去）
  - 活动搜索和筛选
  - 活动导入功能
  - 分页功能

- **创建活动 (`/create`)**:
  - 活动信息填写（名称、时间、地点等）
  - 封面图片选择
  - 票务管理（免费/付费票）
  - 主题和效果选择
  - AI 辅助创建
  - 设计预览

- **社群管理 (`/manager/community`)**:
  - 社群信息管理
  - 成员管理
  - 活动管理

- **活动管理 (`/manager/event`)**:
  - 活动概览
  - 嘉宾管理
  - 内容管理（照片、资源）
  - 规划工具
  - 数据洞察

**关键文件**:
- `layout.tsx` - 主应用布局（带导航栏）

---

#### 1.3 `(detail)/` - 详情页路由组
**功能**: 活动/社群的详情展示页面

**路径映射**:
- `(detail)/event-detail/page.tsx` → `/event-detail` (活动详情)
- `(detail)/community-detail/page.tsx` → `/community-detail` (社群详情)

**主要功能**:
- **活动详情页**:
  - 活动信息展示
  - 注册功能
  - 讨论区（评论、点赞、回复）
  - 标签切换（Overview/Moments/Resources）
  - 位置地图
  - 认证模态框

- **社群详情页**:
  - 社群信息展示
  - 加入/离开社群
  - 活动历史展示
  - 社群墙（讨论区）
  - 成员统计

**关键文件**:
- `layout.tsx` - 详情页布局

---

#### 1.4 `api/` - API 路由
**功能**: Next.js API Routes，处理服务端逻辑

**路径映射**:
- `api/waiting-list/route.ts` → `/api/waiting-list` (等待列表 API)

**主要功能**:
- **等待列表 API**:
  - 用户注册等待列表
  - 邮件发送（Google Sheets 集成）
  - 速率限制
  - 数据验证

**技术栈**:
- Vercel KV (Redis) - 速率限制
- Google APIs - 邮件发送和表格集成

---

#### 1.5 `auth/` - 认证页面
**功能**: 用户认证相关页面（登录、注册等）

**当前状态**: 目录存在，待实现

---

#### 1.6 根文件
- `layout.tsx` - 根布局组件，包含全局字体配置
- `globals.css` - 全局样式，包含：
  - Tailwind CSS 基础样式
  - 自定义字体（Plus Jakarta Sans, Inter, Lalezar）
  - 自定义工具类（glass-panel, glass-card）
  - 动画效果

---

### 2. `components/` - 可复用组件目录

#### 2.1 `components/create/` - 创建页面组件
**功能**: 活动/社群创建相关的组件

**组件列表**:
- `DesignStudio.tsx` - 设计工作室组件（主题预览）
- `EffectLayer.tsx` - 效果层组件（视觉效果选择）
- `ImagePickerModal.tsx` - 图片选择模态框
- `constants.ts` - 创建页面相关常量（主题选项、效果选项、时区等）

---

#### 2.2 `components/detail/` - 详情页组件
**功能**: 活动/社群详情页相关组件

**组件列表**:
- `AuthModal.tsx` - 认证模态框（登录提示）
- `DetailNavbar.tsx` - 详情页导航栏（活动详情页使用）
- `CommunityNavbar.tsx` - 社群详情页导航栏
- `DiscussionSection.tsx` - 讨论区组件（活动详情页）
- `CommunityWall.tsx` - 社群墙组件（社群详情页）
- `EventCard.tsx` - 活动卡片组件
- `LeaveModal.tsx` - 离开社群确认模态框

---

#### 2.3 `components/home/` - 首页组件
**功能**: 用户首页相关组件

**组件列表**:
- `Navbar.tsx` - 首页导航栏
- `Footer.tsx` - 页脚组件
- `CommunityCard.tsx` - 社群卡片组件
- `ImportModal.tsx` - 导入活动模态框
- `Toast.tsx` - 提示消息组件
- `UserMenu.tsx` - 用户菜单组件
- `NavLink.tsx` - 导航链接组件
- `BgBlobs.tsx` - 背景装饰组件

---

#### 2.4 `components/landing/` - 落地页组件
**功能**: 官网首页相关组件

**组件列表**:
- `Navbar.tsx` - 官网导航栏
- `Hero.tsx` - 首页 Hero 区域
- `Features.tsx` - 功能特性展示
- `Pricing.tsx` - 价格方案展示
- `CTA.tsx` - 行动号召组件
- `Footer.tsx` - 页脚组件
- `WaitingListModal.tsx` - 等待列表注册模态框

---

#### 2.5 `components/manager/` - 管理页面组件
**功能**: 活动/社群管理相关组件

**组件列表**:
- `AIModal.tsx` - AI 辅助模态框
- `ConfirmModal.tsx` - 确认操作模态框
- `CouponModal.tsx` - 优惠券管理模态框
- `InviteModal.tsx` - 邀请管理模态框
- `PhotoModal.tsx` - 照片管理模态框
- `ResourceModal.tsx` - 资源管理模态框

---

#### 2.6 `components/layout/` - 布局组件
**功能**: 通用布局组件

**当前状态**: 目录存在，待实现

---

#### 2.7 `components/ui/` - 通用 UI 组件
**功能**: 可复用的 UI 基础组件

**当前状态**: 目录存在，待实现

---

### 3. 其他目录

#### 3.1 `hooks/` - 自定义 Hooks
**功能**: 可复用的 React Hooks

**当前状态**: 目录存在，待实现

---

#### 3.2 `middleware/` - Next.js 中间件
**功能**: 请求拦截和路由保护

**当前状态**: 目录存在，待实现

---

#### 3.3 `public/` - 静态资源
**功能**: 存放静态文件（图片、字体等）

**当前状态**: 目录存在，暂无文件

---

#### 3.4 `styles/` - 样式文件
**功能**: 额外的样式文件

**当前状态**: 目录存在，待实现

---

#### 3.5 `types/` - TypeScript 类型定义
**功能**: 全局类型定义

**当前状态**: 目录存在，待实现

---

#### 3.6 `utils/` - 工具函数
**功能**: 可复用的工具函数

**当前状态**: 目录存在，待实现

---

#### 3.7 `gemini-demo/` - Gemini 演示代码
**功能**: 原型代码和参考实现

**说明**: 这些是使用 Gemini 生成的演示代码，作为参考和原型使用

**文件列表**:
- `community` - 社群页面原型
- `community-detail` - 社群详情页原型
- `create` - 创建页面原型
- `event-detail` - 活动详情页原型
- `home` - 首页原型
- `manager_community` - 社群管理原型
- `manager_event` - 活动管理原型

---

## 🔄 路由映射表

| 文件路径 | URL 路径 | 功能说明 | 需要登录 |
|---------|---------|---------|---------|
| `(public)/page.tsx` | `/` | 官网首页 | ❌ |
| `(public)/about/page.tsx` | `/about` | 关于我们 | ❌ |
| `(main)/home/page.tsx` | `/home` | 用户首页 | ✅ |
| `(main)/create/event/page.tsx` | `/create/event` | 创建活动 | ✅ |
| `(main)/create/community/page.tsx` | `/create/community` | 创建社群 | ✅ |
| `(main)/home/page.tsx` | `/home` | 用户首页（Events/Communities） | ✅ |
| `(main)/manager/event/page.tsx` | `/manager/event` | 活动管理 | ✅ |
| `(main)/manager/community/page.tsx` | `/manager/community` | 社群管理 | ✅ |
| `(detail)/event-detail/page.tsx` | `/event-detail` | 活动详情 | ❌ |
| `(detail)/community-detail/page.tsx` | `/community-detail` | 社群详情 | ❌ |
| `api/waiting-list/route.ts` | `/api/waiting-list` | 等待列表 API | ❌ |

---

## 🎨 样式系统

### Tailwind CSS 配置
- **配置文件**: `tailwind.config.js`
- **自定义颜色**: `brand: #FF6B3D`
- **自定义字体**: `font-lalezar` (Lalezar)

### 全局样式 (`globals.css`)
- **字体导入**: Plus Jakarta Sans, Inter, Lalezar
- **自定义工具类**:
  - `.font-brand` - 品牌字体（Plus Jakarta Sans）
  - `.font-logo` - Logo 字体（Lalezar）
  - `.glass-panel` - 毛玻璃效果面板
  - `.glass-card` - 毛玻璃效果卡片
- **动画效果**: shimmer, fadeInUp, float, pulse-slow 等

---

## 📦 主要依赖

### 核心依赖
- **next**: ^14.0.0 - Next.js 框架
- **react**: ^18.2.0 - React 库
- **react-dom**: ^18.2.0 - React DOM
- **typescript**: ^5.3.0 - TypeScript

### UI 库
- **lucide-react**: ^0.294.0 - 图标库
- **tailwindcss**: ^3.3.0 - CSS 框架

### 服务端功能
- **@vercel/kv**: ^0.2.4 - Vercel KV (Redis) 客户端
- **googleapis**: ^128.0.0 - Google APIs 客户端

---

## 🚀 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

---

## 📝 开发规范

### 1. 路由组织
- 使用 Next.js App Router 的文件系统路由
- 使用路由组 `(public)`, `(main)`, `(detail)` 组织代码
- 路由组名称不会出现在 URL 中

### 2. 组件组织
- 页面级组件放在 `app/` 目录
- 可复用组件放在 `components/` 目录
- 按功能模块组织组件（create, detail, home, landing, manager）

### 3. 样式规范
- 优先使用 Tailwind CSS 工具类
- 自定义样式放在 `globals.css` 的 `@layer utilities` 中
- 使用 `font-brand` 和 `font-logo` 类名应用品牌字体

### 4. 类型定义
- 使用 TypeScript 进行类型检查
- 接口定义放在组件文件内或 `types/` 目录

### 5. 客户端组件
- 使用 `'use client'` 标记需要客户端交互的组件
- 服务端组件默认，无需标记

---

## 🔐 认证与权限

### 路由保护
- `(public)/` - 公开访问，无需认证
- `(main)/` - 需要登录，通过中间件或布局保护
- `(detail)/` - 公开访问，但某些操作需要登录

### 认证状态
- 当前使用模拟认证状态（`isLoggedIn`）
- 待集成 Supabase 认证

---

## 📊 数据流

### 客户端数据
- 当前使用 Mock 数据
- 状态管理使用 React `useState` 和 `useEffect`

### API 调用
- 等待列表 API 已实现（`/api/waiting-list`）
- 其他 API 待实现

---

## 🎯 待实现功能

### 认证系统
- [ ] Supabase 认证集成
- [ ] 登录/注册页面
- [ ] 路由保护中间件

### 数据层
- [ ] API 客户端封装
- [ ] 数据获取 Hooks
- [ ] 状态管理（可选：Zustand/Redux）

### UI 组件库
- [ ] 通用 UI 组件（Button, Input, Modal 等）
- [ ] 表单组件
- [ ] 数据展示组件

### 功能完善
- [ ] 活动 CRUD 操作
- [ ] 社群 CRUD 操作
- [ ] 文件上传功能
- [ ] 实时通知系统

---

## 📚 相关文档

- `ROUTE_STRUCTURE.md` - 路由结构详细说明
- `MIGRATION_NOTES.md` - 迁移说明
- `WAITING_LIST_SETUP.md` - 等待列表设置说明

---

**最后更新**: 2025年
**维护者**: HereNow 开发团队

