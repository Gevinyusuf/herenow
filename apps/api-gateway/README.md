# API Gateway

HereNow API 网关，负责 JWT 验证、路由分发和请求转发。

## 功能

- ✅ JWT Token 验证（Supabase）
- ✅ 用户认证接口
- ✅ 首页数据接口（Mock 数据）
- ✅ AI 内容生成接口（基于 OpenRouter）
- ✅ AI 配额管理和验证

## 快速开始

### 1. 安装依赖

```bash
cd apps/api-gateway
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
SUPABASE_JWT_SECRET=your_jwt_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_GATEWAY_PORT=8000

# OpenRouter AI 配置
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_HTTP_REFERER=https://your-domain.com  # 可选
```

**获取 JWT Secret**：
- 登录 Supabase Dashboard
- 进入 Settings → API
- 复制 JWT Secret

### 3. 启动服务

```bash
uvicorn main:app --reload --port 8000
```

或者：

```bash
python main.py
```

服务将在 `http://localhost:8000` 启动。

## API 端点

### 认证相关

- `GET /api/v1/auth/me` - 获取当前用户信息（需要认证）

### 首页数据

- `GET /api/v1/home/events` - 获取活动数据（需要认证）
- `GET /api/v1/home/communities` - 获取社群数据（需要认证）
- `GET /api/v1/home/all` - 获取所有首页数据（需要认证）

### AI 功能

- `POST /api/v1/ai/generate` - 生成 AI 内容（需要认证，会扣减配额）
- `GET /api/v1/ai/quota` - 查询 AI 配额信息（需要认证）

### 健康检查

- `GET /` - API 网关信息
- `GET /health` - 健康检查

## 使用示例

### 获取首页数据

```bash
# 获取 Access Token（从浏览器 Cookie 或 LocalStorage）
TOKEN="your_jwt_token"

# 获取活动数据
curl -X GET http://localhost:8000/api/v1/home/events \
  -H "Authorization: Bearer $TOKEN"

# 获取社群数据
curl -X GET http://localhost:8000/api/v1/home/communities \
  -H "Authorization: Bearer $TOKEN"

# 获取所有数据
curl -X GET http://localhost:8000/api/v1/home/all \
  -H "Authorization: Bearer $TOKEN"
```

## API 文档

启动服务后，访问以下地址查看自动生成的 API 文档：

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 项目结构

```
apps/api-gateway/
├── main.py                 # 主应用入口
├── requirements.txt        # Python 依赖
├── core/                   # 核心功能
│   ├── auth/              # 认证相关
│   │   └── dependencies.py # JWT 验证依赖
│   ├── ai/                # AI 相关
│   │   ├── dependencies.py # AI 配额验证依赖
│   │   ├── openrouter_service.py # OpenRouter 服务
│   │   └── README.md      # AI 模块说明
│   └── supabase_client.py # Supabase 客户端
└── routes/                # 路由定义
    ├── auth.py            # 认证路由
    ├── home.py            # 首页数据路由
    └── ai.py              # AI 生成路由
```

## AI 功能说明

AI 功能基于 OpenRouter 服务，支持多种 AI 模型和功能类型。详细说明请参考 [AI 模块文档](core/ai/README.md)。

