# HereNow v1.0

## 📋 项目概述

HereNow 是一个基于现代微服务架构的全栈应用项目，采用 Monorepo 架构管理，支持独立模块部署和高效的 CI/CD 流程。

## 🛠️ 技术栈

### 前端技术栈
- **Next.js 14+** (App Router)
  - 服务端渲染 (SSR) 和静态生成 (SSG)
  - 内置 API 路由支持
  - 优化的性能和 SEO
- **TypeScript**
  - 类型安全
  - 更好的开发体验和代码质量
- **Supabase**
  - 身份认证和授权
  - JWT Token 管理
  - 实时数据库

### 后端技术栈
- **Python FastAPI**
  - 高性能异步框架
  - 自动 API 文档生成
  - 类型提示和验证
- **API 网关架构**
  - 统一入口点
  - JWT 验证和路由分发
  - 请求转发和负载均衡

### 开发工具
- **Turborepo**
  - Monorepo 管理
  - 增量构建和缓存
  - 并行任务执行
- **GitHub Actions**
  - CI/CD 自动化
  - 独立模块部署

## ✨ 技术优势

### 1. 架构优势
- **微服务架构**：服务解耦，独立开发、部署和扩展
- **统一 API 网关**：集中处理认证、路由和请求分发
- **Monorepo 管理**：代码共享，依赖管理更简单

### 2. 性能优势
- **Next.js SSR/SSG**：首屏加载快，SEO 友好
- **FastAPI 异步**：高并发处理能力
- **Turborepo 缓存**：构建速度提升，CI/CD 效率高

### 3. 开发体验
- **类型安全**：TypeScript + Python 类型提示
- **热重载**：快速开发迭代
- **自动文档**：FastAPI 自动生成 API 文档

### 4. 安全性
- **JWT 认证**：Supabase 统一身份管理
- **API 网关验证**：统一的安全入口
- **环境隔离**：开发、测试、生产环境分离

## 📁 项目结构

```
herenow-v1.0/
├── apps/                        # 应用程序（可独立部署）
│   ├── frontend/                # Next.js 前端应用
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API 路由（Next.js API Routes）
│   │   │   └── auth/            # 认证相关页面（登录、注册等）
│   │   ├── components/          # React 组件
│   │   │   ├── ui/              # 通用 UI 组件（按钮、输入框等）
│   │   │   └── layout/          # 布局组件（头部、侧边栏、页脚等）
│   │   ├── hooks/               # 自定义 React Hooks
│   │   ├── lib/                 # 库文件和工具
│   │   │   ├── api/             # API 客户端封装（与后端通信）
│   │   │   └── supabase/        # Supabase 客户端配置和工具
│   │   ├── middleware/          # Next.js 中间件（路由保护、重定向等）
│   │   ├── public/              # 静态资源（图片、字体等）
│   │   ├── styles/              # 样式文件（CSS、SCSS 等）
│   │   ├── types/               # TypeScript 类型定义
│   │   └── utils/               # 工具函数
│   │
│   ├── api-gateway/             # API 网关（FastAPI）
│   │   ├── core/                # 核心功能模块
│   │   │   ├── auth/            # JWT 验证逻辑（验证 Supabase Token）
│   │   │   ├── routing/         # 路由分发逻辑（转发到对应服务）
│   │   │   └── validation/      # 请求验证（参数校验、数据格式检查）
│   │   ├── middleware/          # 网关中间件（日志、错误处理、限流等）
│   │   ├── routes/              # 网关路由定义
│   │   └── tests/               # 网关测试文件
│   │
│   ├── user-service/            # 用户服务（FastAPI）
│   │   ├── api/                 # API 端点（用户相关的 REST API）
│   │   ├── models/              # 数据模型（Pydantic 模型）
│   │   ├── services/            # 业务逻辑层（用户管理、权限等）
│   │   └── tests/               # 单元测试和集成测试
│   │
│   ├── product-service/         # 产品服务（FastAPI）
│   │   ├── api/                 # 产品相关的 API 端点
│   │   ├── models/              # 产品数据模型
│   │   ├── services/            # 产品业务逻辑
│   │   └── tests/               # 测试文件
│   │
│   └── order-service/           # 订单服务（FastAPI）
│       ├── api/                 # 订单相关的 API 端点
│       ├── models/              # 订单数据模型
│       ├── services/            # 订单业务逻辑
│       └── tests/               # 测试文件
│
├── packages/                     # 共享包（可被多个应用引用）
│   ├── shared/                  # 共享代码
│   │   ├── config/              # 共享配置（数据库连接、环境变量等）
│   │   ├── database/            # 数据库连接和操作（Supabase 客户端）
│   │   ├── models/              # 共享数据模型（跨服务使用的模型）
│   │   └── utils/               # 共享工具函数（日志、错误处理等）
│   │
│   ├── config/                  # 配置包
│   │   ├── development/         # 开发环境配置
│   │   ├── production/         # 生产环境配置
│   │   └── testing/             # 测试环境配置
│   │
│   ├── types/                   # 共享类型定义（TypeScript/Python）
│   ├── utils/                   # 共享工具函数
│   └── database/                # 数据库相关共享代码
│
├── docs/                        # 项目文档
│   ├── api/                     # API 文档（接口说明、参数等）
│   ├── architecture/            # 架构文档（系统设计、流程图等）
│   └── deployment/              # 部署文档（部署流程、环境配置等）
│
└── scripts/                     # 脚本文件
    ├── setup/                   # 初始化脚本（环境设置、依赖安装等）
    ├── deploy/                  # 部署脚本（自动化部署）
    └── migration/               # 数据库迁移脚本
```

## 🔄 工作流程

### 请求流程

```
用户请求
    ↓
Next.js 前端 (apps/frontend)
    ↓
Supabase 身份验证 (获取 JWT Token)
    ↓
API 网关 (apps/api-gateway)
    ├── 验证 JWT Token
    ├── 路由分发
    └── 转发请求
    ↓
后端服务 (apps/*-service)
    ├── user-service
    ├── product-service
    └── order-service
    ↓
Supabase 数据库
```

### 开发流程

1. **前端开发**：在 `apps/frontend` 中开发 Next.js 应用
2. **后端开发**：在对应的服务目录中开发 FastAPI 服务
3. **共享代码**：在 `packages/` 中创建可复用的代码
4. **测试**：每个服务都有独立的测试目录
5. **构建**：使用 Turborepo 进行增量构建

## 🚀 CI/CD 部署策略

### GitHub Actions 工作流

#### 1. 变更检测策略
- 使用 `paths` 过滤器检测文件变更
- 只构建和部署变更的模块
- 共享包变更时，自动触发依赖该包的所有应用

#### 2. 独立部署流程

**前端部署** (`apps/frontend`)
```yaml
触发条件: apps/frontend/** 或 packages/** 变更
构建步骤:
  1. 安装依赖
  2. 类型检查
  3. 构建 Next.js 应用
  4. 运行测试
  5. 部署到 Vercel/其他平台
```

**API 网关部署** (`apps/api-gateway`)
```yaml
触发条件: apps/api-gateway/** 或 packages/shared/** 变更
构建步骤:
  1. 安装 Python 依赖
  2. 代码检查 (linting)
  3. 运行测试
  4. 构建 Docker 镜像
  5. 部署到云服务器/容器平台
```

**服务部署** (`apps/*-service`)
```yaml
触发条件: apps/{service-name}/** 或 packages/shared/** 变更
构建步骤:
  1. 安装 Python 依赖
  2. 代码检查
  3. 运行单元测试和集成测试
  4. 构建 Docker 镜像
  5. 部署到容器编排平台 (Kubernetes/Docker Swarm)
```

#### 3. 缓存策略
- **Turborepo 缓存**：构建产物缓存，加速 CI/CD
- **Docker 层缓存**：优化镜像构建速度
- **依赖缓存**：缓存 npm/pip 依赖

#### 4. 环境管理
- **开发环境**：自动部署到开发服务器
- **测试环境**：PR 合并前自动部署测试
- **生产环境**：主分支合并后自动部署

#### 5. 回滚机制
- 保留历史版本镜像
- 支持快速回滚到上一版本
- 健康检查失败时自动回滚

## 📦 依赖管理

### 前端依赖
- 通过 `package.json` 管理
- 使用 npm/yarn/pnpm 安装
- 共享包通过 Turborepo workspace 引用

### 后端依赖
- 通过 `requirements.txt` 或 `pyproject.toml` 管理
- 使用 pip 或 poetry 安装
- 共享包通过相对路径或私有包仓库引用

## 🔐 环境变量管理

### 前端环境变量
- `.env.local` - 本地开发
- `.env.development` - 开发环境
- `.env.production` - 生产环境

### 后端环境变量
- 使用 `packages/config/` 中的配置文件
- 通过环境变量注入敏感信息
- 使用密钥管理服务 (如 AWS Secrets Manager)

## 🧪 测试策略

### 前端测试
- 单元测试：组件和工具函数
- 集成测试：API 调用和用户流程
- E2E 测试：关键用户路径

### 后端测试
- 单元测试：业务逻辑和工具函数
- 集成测试：API 端点和数据库交互
- 性能测试：负载和压力测试

## 📊 监控和日志

### 监控指标
- API 响应时间
- 错误率
- 服务健康状态
- 资源使用情况

### 日志管理
- 结构化日志输出
- 集中式日志收集
- 日志级别管理 (DEBUG, INFO, WARNING, ERROR)

## 🔄 版本管理

### 语义化版本
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### Git 工作流
- 主分支：`main` - 生产环境代码
- 开发分支：`develop` - 开发环境代码
- 功能分支：`feature/*` - 新功能开发
- 修复分支：`fix/*` - 问题修复

## 📝 开发规范

### 代码规范
- **前端**：ESLint + Prettier
- **后端**：Black + Flake8 + mypy
- **提交信息**：遵循 Conventional Commits

### 代码审查
- 所有 PR 必须经过代码审查
- 至少一名审查者批准
- 通过所有测试和检查后才能合并

## 🛡️ 安全措施

1. **身份认证**：Supabase JWT 统一管理
2. **API 安全**：API 网关统一验证
3. **数据加密**：传输和存储加密
4. **依赖安全**：定期更新依赖，扫描漏洞
5. **访问控制**：基于角色的访问控制 (RBAC)

## 📚 相关文档

- [API 文档](./docs/api/) - 详细的 API 接口说明
- [架构文档](./docs/architecture/) - 系统架构设计
- [部署文档](./docs/deployment/) - 部署指南和配置

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

[在此添加许可证信息]

## 👥 团队

[在此添加团队成员信息]

---

**最后更新**: 2025年11月

