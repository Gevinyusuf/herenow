# 路由结构说明

## 📁 文件夹组织方式

本项目使用 **Next.js App Router** 的路由组（Route Groups）来区分不同类型的页面。

### 路由组说明

在 Next.js 中，使用括号包裹的文件夹名（如 `(public)` 和 `(dashboard)`）是**路由组**，它们：
- ✅ **不会影响 URL 路径**（括号中的名称不会出现在 URL 中）
- ✅ **可以有自己的布局文件**（layout.tsx）
- ✅ **帮助组织代码结构**

## 🗂️ 目录结构

```
apps/frontend/app/
├── (public)/              # 未登录用户的公开页面
│   ├── layout.tsx        # 公开页面的布局（官网样式）
│   ├── page.tsx          # 首页 (/) - 官网首页
│   ├── about/            # 关于我们 (/about)
│   │   └── page.tsx
│   ├── products/         # 产品介绍 (/products)
│   │   └── page.tsx
│   └── contact/          # 联系我们 (/contact)
│       └── page.tsx
│
├── (dashboard)/          # 登录后用户的页面
│   ├── layout.tsx        # 登录后页面的布局（带导航栏、侧边栏）
│   ├── page.tsx          # Dashboard 首页 (/dashboard)
│   ├── profile/          # 个人资料 (/profile)
│   │   └── page.tsx
│   ├── settings/         # 设置 (/settings)
│   │   └── page.tsx
│   └── ...               # 其他需要认证的页面
│
├── auth/                 # 认证相关页面（登录、注册等）
│   ├── login/            # 登录页面 (/auth/login)
│   │   └── page.tsx
│   └── register/         # 注册页面 (/auth/register)
│       └── page.tsx
│
└── api/                  # API 路由（Next.js API Routes）
    └── ...
```

## 🔐 页面类型说明

### 1. 公开页面 `(public)/`
- **用途**：未登录用户可以看到的页面
- **特点**：
  - 不需要认证
  - 使用官网风格的布局
  - 包含：首页、关于我们、产品介绍、联系方式等
- **URL 示例**：
  - `/` - 官网首页
  - `/about` - 关于我们
  - `/products` - 产品介绍

### 2. 登录后页面 `(dashboard)/`
- **用途**：需要登录才能访问的页面
- **特点**：
  - 需要认证保护（通过中间件或组件级保护）
  - 使用 Dashboard 风格的布局（带导航、侧边栏等）
  - 包含：仪表板、个人资料、设置、订单等
- **URL 示例**：
  - `/dashboard` - 仪表板首页
  - `/profile` - 个人资料
  - `/settings` - 设置

### 3. 认证页面 `auth/`
- **用途**：登录、注册等认证流程页面
- **特点**：
  - 未登录用户访问
  - 登录成功后重定向到 Dashboard
- **URL 示例**：
  - `/auth/login` - 登录
  - `/auth/register` - 注册

## 🛡️ 路由保护

### 方式 1: 使用中间件（推荐）
在 `apps/frontend/middleware.ts` 中配置：

```typescript
export function middleware(request: NextRequest) {
  // 检查需要认证的路由
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // 验证用户是否登录
    // 未登录则重定向到 /auth/login
  }
}
```

### 方式 2: 在布局或页面组件中保护
在 `(dashboard)/layout.tsx` 中：

```typescript
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase';

export default async function DashboardLayout({ children }) {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/login');
  }
  
  return <div>{children}</div>;
}
```

## 📝 开发建议

1. **官网首页开发**：在 `(public)/page.tsx` 中开发
2. **登录后页面**：在 `(dashboard)/` 下创建对应的页面
3. **共享组件**：放在 `components/` 目录下
4. **布局组件**：每个路由组有自己的 `layout.tsx`，可以共享通用布局组件

## 🔄 路由示例

| 文件路径 | URL 路径 | 说明 |
|---------|---------|------|
| `(public)/page.tsx` | `/` | 官网首页 |
| `(public)/about/page.tsx` | `/about` | 关于我们 |
| `(dashboard)/page.tsx` | `/dashboard` | Dashboard 首页 |
| `(dashboard)/profile/page.tsx` | `/profile` | 个人资料 |
| `auth/login/page.tsx` | `/auth/login` | 登录页面 |

注意：括号 `()` 中的名称不会出现在 URL 中！

