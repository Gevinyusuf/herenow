# 快速开始指南

## 前置要求

### 必需软件
- **Node.js** 18+ 和 pnpm/npm/yarn
- **Python** 3.11+
- **Git**
- **Docker** (可选，用于容器化部署)

### 推荐工具
- **VS Code** 或 **WebStorm**
- **Postman** 或 **Insomnia** (API 测试)
- **Docker Desktop** (本地开发)

## 环境设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd herenow-v1.0
```

### 2. 安装依赖

#### 安装前端依赖
```bash
cd apps/frontend
pnpm install  # 或 npm install / yarn install
```

#### 安装后端依赖
```bash
# API 网关
cd apps/api-gateway
pip install -r requirements.txt

# 各个服务
cd apps/user-service
pip install -r requirements.txt

cd apps/product-service
pip install -r requirements.txt

cd apps/order-service
pip install -r requirements.txt
```

### 3. 配置环境变量

#### 前端环境变量 (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
```

#### 后端环境变量

**API 网关** (`apps/api-gateway/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_GATEWAY_PORT=8000
USER_SERVICE_URL=http://localhost:8001
PRODUCT_SERVICE_URL=http://localhost:8002
ORDER_SERVICE_URL=http://localhost:8003
```

**服务环境变量** (各服务目录下的 `.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url
```

## 本地开发

### 启动前端

```bash
cd apps/frontend
pnpm dev  # 或 npm run dev
```

前端将在 `http://localhost:3000` 运行

### 启动后端服务

#### 启动 API 网关
```bash
cd apps/api-gateway
uvicorn main:app --reload --port 8000
```

#### 启动用户服务
```bash
cd apps/user-service
uvicorn main:app --reload --port 8001
```

#### 启动产品服务
```bash
cd apps/product-service
uvicorn main:app --reload --port 8002
```

#### 启动订单服务
```bash
cd apps/order-service
uvicorn main:app --reload --port 8003
```

### 使用 Turborepo 同时启动所有服务

在项目根目录创建 `turbo.json` 配置后：

```bash
# 启动所有前端服务
pnpm turbo dev --filter=frontend

# 启动所有后端服务
pnpm turbo dev --filter=api-gateway --filter=user-service --filter=product-service --filter=order-service
```

## 项目结构说明

### 前端开发 (`apps/frontend`)
- **页面**: `app/` 目录下创建页面
- **组件**: `components/` 目录下创建可复用组件
- **API 调用**: `lib/api/` 目录下封装 API 客户端
- **类型定义**: `types/` 目录下定义 TypeScript 类型

### 后端开发

#### API 网关 (`apps/api-gateway`)
- **路由**: `routes/` 目录下定义路由
- **中间件**: `middleware/` 目录下创建中间件
- **核心逻辑**: `core/` 目录下实现核心功能

#### 服务开发 (`apps/*-service`)
- **API 端点**: `api/` 目录下定义 REST API
- **业务逻辑**: `services/` 目录下实现业务逻辑
- **数据模型**: `models/` 目录下定义 Pydantic 模型

## 开发工作流

### 1. 创建新功能

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 开发代码
# ...

# 提交更改
git add .
git commit -m "feat: add your feature"

# 推送分支
git push origin feature/your-feature-name

# 创建 Pull Request
```

### 2. 运行测试

#### 前端测试
```bash
cd apps/frontend
pnpm test
```

#### 后端测试
```bash
cd apps/api-gateway
pytest

# 或运行所有服务的测试
pnpm turbo test
```

### 3. 代码检查

#### 前端代码检查
```bash
cd apps/frontend
pnpm lint
pnpm type-check
```

#### 后端代码检查
```bash
cd apps/api-gateway
flake8 .
black --check .
mypy .
```

## 常用命令

### Turborepo 命令

```bash
# 构建所有应用
pnpm turbo build

# 构建特定应用
pnpm turbo build --filter=frontend

# 运行所有测试
pnpm turbo test

# 运行所有 lint 检查
pnpm turbo lint

# 清理构建产物
pnpm turbo clean
```

### 前端命令

```bash
cd apps/frontend

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

### 后端命令

```bash
cd apps/api-gateway  # 或其他服务

# 开发模式
uvicorn main:app --reload

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000

# 运行测试
pytest

# 代码格式化
black .

# 类型检查
mypy .
```

## 调试技巧

### 前端调试
- 使用浏览器开发者工具
- React DevTools 扩展
- Next.js 开发模式提供详细错误信息

### 后端调试
- 使用 VS Code Python 调试器
- 添加日志输出
- 使用 FastAPI 自动生成的文档 (`/docs`)

### API 测试
- 访问 `http://localhost:8000/docs` 查看 API 文档
- 使用 Postman 或 Insomnia 测试 API
- 使用 curl 命令测试

## 常见问题

### 1. 端口冲突
如果端口被占用，修改 `.env` 文件中的端口配置

### 2. 依赖安装失败
- 清除缓存后重新安装
- 检查 Node.js/Python 版本
- 使用国内镜像源

### 3. 环境变量未生效
- 确认 `.env` 文件在正确位置
- 重启开发服务器
- 检查环境变量名称是否正确

## 下一步

- 阅读 [架构文档](./architecture/overview.md) 了解系统设计
- 查看 [API 文档](./api/) 了解接口规范
- 阅读 [部署文档](./deployment/ci-cd.md) 了解部署流程

## 获取帮助

- 查看项目文档
- 提交 Issue
- 联系团队

