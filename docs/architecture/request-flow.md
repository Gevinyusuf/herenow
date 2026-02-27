# 用户前端到后端请求流程

本文档详细描述了从用户前端发起请求到后端处理并返回响应的完整流程。

## 📋 目录

1. [整体架构概览](#整体架构概览)
2. [详细请求流程](#详细请求流程)
3. [代码示例](#代码示例)
4. [关键组件说明](#关键组件说明)
5. [错误处理机制](#错误处理机制)

---

## 整体架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     用户浏览器 (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js 前端应用 (apps/frontend)              │   │
│  │  ┌──────────────┐  ┌──────────────┐                 │   │
│  │  │  React 组件  │  │  API Client  │                 │   │
│  │  │  (Pages)    │→ │  (client.ts) │                 │   │
│  │  └──────────────┘  └──────┬───────┘                 │   │
│  │                           │                          │   │
│  │  ┌──────────────┐         │                          │   │
│  │  │  Supabase    │─────────┘                          │   │
│  │  │  Client      │  (获取 JWT Token)                  │   │
│  │  └──────────────┘                                    │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS + JWT Token
                          │ Authorization: Bearer <token>
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              API 网关 (apps/api-gateway)                     │
│              FastAPI Application                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  1. CORS 中间件处理                                     │ │
│  │  2. JWT Token 验证 (get_current_user)                 │ │
│  │  3. 路由分发 (根据 URL 路径)                            │ │
│  │  4. 请求参数验证 (Pydantic)                            │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────┴─────────────────────────────────┐ │
│  │  路由处理器 (routes/*.py)                              │ │
│  │  - /api/v1/auth/*    → auth.py                        │ │
│  │  - /api/v1/home/*    → home.py                        │ │
│  │  - /api/v1/events/*  → events.py                      │ │
│  │  - /api/v1/ai/*      → ai.py                          │ │
│  └──────────────────────┬─────────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase 数据库 (PostgreSQL)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - profiles (用户资料)                                 │  │
│  │  - events_v1 (活动数据)                               │  │
│  │  - communities (社群数据)                              │  │
│  │  - subscriptions (订阅信息)                            │  │
│  │  - ... (其他表)                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 详细请求流程

### 阶段 1: 用户操作触发请求

**位置**: 前端 React 组件

**示例场景**: 用户点击"创建活动"按钮

```typescript
// apps/frontend/app/(main)/create/event/page.tsx
const handleSubmit = async () => {
  try {
    const result = await createEvent(eventData);
    // 处理成功响应
  } catch (error) {
    // 处理错误
  }
};
```

---

### 阶段 2: 前端 API 客户端处理

**位置**: `apps/frontend/lib/api/client.ts`

**流程步骤**:

1. **获取认证 Token**
   ```typescript
   async function getAuthToken(): Promise<string | null> {
     const supabase = createClient();
     const { data: { session } } = await supabase.auth.getSession();
     return session?.access_token || null;
   }
   ```

2. **构建认证请求**
   ```typescript
   async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
     const token = await getAuthToken();
     
     if (!token) {
       throw new Error('未登录，请先登录');
     }

     const url = `${API_GATEWAY_URL}${endpoint}`;
     
     const response = await fetch(url, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`,  // 关键：携带 JWT Token
         ...options.headers,
       },
     });
     
     // 处理响应...
   }
   ```

3. **调用具体 API 函数**
   ```typescript
   export async function createEvent(eventData: any) {
     const response = await authenticatedFetch('/api/v1/events', {
       method: 'POST',
       body: JSON.stringify(eventData),
     });
     return await response.json();
   }
   ```

**关键点**:
- ✅ 从 Supabase 客户端获取当前会话的 `access_token`
- ✅ 在请求头中添加 `Authorization: Bearer <token>`
- ✅ 请求发送到 API Gateway (`http://localhost:8000`)

---

### 阶段 3: API Gateway 接收请求

**位置**: `apps/api-gateway/main.py`

**流程步骤**:

1. **CORS 中间件处理**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **路由匹配**
   - 根据 URL 路径匹配对应的路由
   - 例如: `POST /api/v1/events` → `routes/events.py`

---

### 阶段 4: JWT Token 验证

**位置**: `apps/api-gateway/core/auth/dependencies.py`

**流程步骤**:

1. **提取 Token**
   ```python
   def get_current_user(
       credentials: HTTPAuthorizationCredentials = Depends(security)
   ) -> Dict:
       token = credentials.credentials  # 从 Authorization 头提取
   ```

2. **验证 Token**
   ```python
   try:
       payload = jwt.decode(
           token,
           SUPABASE_JWT_SECRET,  # 使用 Supabase JWT Secret
           algorithms=["HS256"],
           audience="authenticated"
       )
       return {
           "sub": payload.get("sub"),      # 用户 ID (UUID)
           "role": payload.get("role"),    # "authenticated"
           "email": payload.get("email"),  # 用户邮箱
       }
   except jwt.ExpiredSignatureError:
       raise HTTPException(status_code=401, detail="Token expired")
   except jwt.InvalidTokenError:
       raise HTTPException(status_code=401, detail="Invalid token")
   ```

**验证结果**:
- ✅ **成功**: 返回用户信息字典，包含 `sub` (用户ID)、`role`、`email`
- ❌ **失败**: 抛出 `HTTPException` (401 Unauthorized)

---

### 阶段 5: 路由处理器执行

**位置**: `apps/api-gateway/routes/events.py`

**流程步骤** (以创建活动为例):

1. **依赖注入获取用户信息**
   ```python
   @router.post("/events")
   async def create_event(
       request: Request,
       current_user: Dict = Depends(get_current_user)  # 自动验证 Token
   ):
   ```

2. **解析和验证请求体**
   ```python
   body = await request.json()
   event_data = EventCreateRequest(**body)  # Pydantic 验证
   ```

3. **业务逻辑验证**
   ```python
   if not event_data.eventName or not event_data.eventName.strip():
       raise HTTPException(status_code=422, detail="活动名称不能为空")
   ```

4. **数据转换**
   ```python
   # 将前端格式转换为数据库格式
   insert_data = {
       "title": event_data.eventName,
       "slug": generate_slug(event_data.eventName),
       "start_at": f"{event_data.startDate}T{event_data.startTime}",
       "host_id": current_user.get("sub"),  # 使用验证后的用户 ID
       # ... 其他字段转换
   }
   ```

---

### 阶段 6: 数据库操作

**位置**: `apps/api-gateway/routes/events.py`

**流程步骤**:

1. **获取 Supabase 客户端**
   ```python
   supabase = get_supabase_client()  # 单例模式，优化性能
   ```

2. **执行数据库操作**
   ```python
   result = supabase.table("events_v1").insert(insert_data).execute()
   ```

3. **处理响应**
   ```python
   if not result.data:
       raise HTTPException(status_code=500, detail="创建活动失败")
   
   created_event = result.data[0]
   return {
       "success": True,
       "data": {
           "id": created_event["id"],
           "slug": created_event["slug"],
           "title": created_event["title"]
       }
   }
   ```

---

### 阶段 7: 响应返回前端

**流程步骤**:

1. **API Gateway 返回 JSON 响应**
   ```json
   {
     "success": true,
     "data": {
       "id": "uuid-here",
       "slug": "event-slug",
       "title": "活动名称"
     }
   }
   ```

2. **前端 API 客户端处理响应**
   ```typescript
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.detail || '请求失败');
   }
   
   const result = await response.json();
   return result.data || result;  // 提取 data 字段
   ```

3. **React 组件更新 UI**
   ```typescript
   const result = await createEvent(eventData);
   // 使用 result 更新界面
   router.push(`/event-detail/${result.id}`);
   ```

---

## 代码示例

### 完整请求示例：创建活动

#### 1. 前端发起请求

```typescript
// apps/frontend/lib/api/client.ts
export async function createEvent(eventData: any) {
  const response = await authenticatedFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify({
      eventName: "产品发布会",
      startDate: "2025-01-15",
      startTime: "14:00",
      endDate: "2025-01-15",
      endTime: "18:00",
      location: "北京国际会议中心",
      // ... 其他字段
    }),
  });
  return await response.json();
}
```

#### 2. API Gateway 处理

```python
# apps/api-gateway/routes/events.py
@router.post("/events")
async def create_event(
    request: Request,
    current_user: Dict = Depends(get_current_user)  # JWT 验证
):
    body = await request.json()
    event_data = EventCreateRequest(**body)
    
    # 使用验证后的用户 ID
    host_id = current_user.get("sub")
    
    # 插入数据库
    result = supabase.table("events_v1").insert({
        "title": event_data.eventName,
        "host_id": host_id,
        # ... 其他字段
    }).execute()
    
    return {"success": True, "data": result.data[0]}
```

---

## 关键组件说明

### 1. 前端 API 客户端 (`apps/frontend/lib/api/client.ts`)

**职责**:
- 统一管理所有 API 请求
- 自动添加认证 Token
- 统一错误处理
- 请求/响应日志记录

**关键函数**:
- `getAuthToken()`: 从 Supabase 会话获取 Token
- `authenticatedFetch()`: 创建带认证的 fetch 请求
- `createEvent()`, `getHomeData()` 等: 具体业务 API

---

### 2. Supabase 客户端 (`apps/frontend/lib/supabase/client.ts`)

**职责**:
- 创建 Supabase 浏览器客户端
- 管理用户会话
- 提供认证功能

**关键点**:
- 使用 `@supabase/ssr` 包
- 从环境变量读取 Supabase URL 和 Anon Key

---

### 3. API Gateway (`apps/api-gateway/main.py`)

**职责**:
- 统一入口点
- CORS 处理
- 路由分发
- 全局异常处理

**关键配置**:
- CORS 允许前端域名 (`http://localhost:3000`)
- 路由前缀: `/api/v1`
- 自动生成 API 文档 (`/docs`)

---

### 4. JWT 验证依赖 (`apps/api-gateway/core/auth/dependencies.py`)

**职责**:
- 验证 Supabase JWT Token
- 提取用户信息
- 处理 Token 过期/无效情况

**关键函数**:
- `get_current_user()`: 必需认证，Token 无效时抛出 401
- `get_current_user_optional()`: 可选认证，用于公开接口
- `verify_ai_quota()`: 验证并扣减 AI 配额

---

### 5. 路由处理器 (`apps/api-gateway/routes/*.py`)

**职责**:
- 处理具体业务逻辑
- 请求参数验证 (Pydantic)
- 数据库操作
- 响应格式化

**路由文件**:
- `auth.py`: 认证相关 (`/api/v1/auth/*`)
- `home.py`: 首页数据 (`/api/v1/home/*`)
- `events.py`: 活动管理 (`/api/v1/events/*`)
- `ai.py`: AI 功能 (`/api/v1/ai/*`)

---

### 6. Supabase 数据库客户端 (`apps/api-gateway/core/supabase_client.py`)

**职责**:
- 创建 Supabase 服务端客户端
- 单例模式优化性能
- 数据库连接管理

**关键点**:
- 使用 Service Role Key (拥有完整权限)
- 支持高并发场景

---

## 错误处理机制

### 前端错误处理

```typescript
// apps/frontend/lib/api/client.ts
try {
  const response = await authenticatedFetch('/api/v1/events', {...});
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    throw new Error(error.detail || `请求失败: ${response.status}`);
  }
  
  return await response.json();
} catch (error) {
  console.error('API 请求失败:', error);
  throw error;  // 向上抛出，由组件处理
}
```

**错误类型**:
- ❌ **401 Unauthorized**: Token 无效或过期 → 提示用户重新登录
- ❌ **422 Unprocessable Entity**: 数据验证失败 → 显示具体错误字段
- ❌ **500 Internal Server Error**: 服务器错误 → 显示通用错误信息

---

### 后端错误处理

```python
# apps/api-gateway/main.py
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理 Pydantic 验证错误"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error.get("loc", [])),
            "message": error.get("msg", "验证失败"),
            "type": error.get("type", "unknown")
        })
    
    return JSONResponse(
        status_code=422,
        content={"detail": errors, "message": "数据验证失败"}
    )
```

**错误类型**:
- ❌ **401**: JWT Token 验证失败
- ❌ **422**: 请求参数验证失败 (Pydantic)
- ❌ **404**: 资源不存在
- ❌ **500**: 数据库操作失败或其他服务器错误

---

## 请求流程图

```
用户操作
    ↓
React 组件调用 API 函数
    ↓
API Client (client.ts)
    ├─ 从 Supabase 获取 JWT Token
    ├─ 构建请求 (URL + Headers + Body)
    └─ 发送 HTTP 请求
    ↓
API Gateway (main.py)
    ├─ CORS 中间件处理
    ├─ 路由匹配
    └─ JWT Token 验证 (get_current_user)
    ↓
路由处理器 (routes/*.py)
    ├─ 请求参数验证 (Pydantic)
    ├─ 业务逻辑处理
    ├─ 数据格式转换
    └─ 数据库操作 (Supabase)
    ↓
Supabase 数据库
    ├─ 执行 SQL 操作
    └─ 返回数据
    ↓
路由处理器
    ├─ 格式化响应
    └─ 返回 JSON
    ↓
API Gateway
    └─ 返回 HTTP 响应
    ↓
前端 API Client
    ├─ 检查响应状态
    ├─ 解析 JSON
    └─ 返回数据
    ↓
React 组件
    └─ 更新 UI
```

---

## 安全机制

### 1. 认证流程

```
用户登录
    ↓
Supabase Auth API
    ↓
返回 JWT Token (包含用户信息)
    ↓
前端存储 Token (localStorage/cookie)
    ↓
后续请求携带 Token
    ↓
API Gateway 验证 Token
    ↓
验证通过 → 继续处理
验证失败 → 返回 401
```

### 2. Token 验证

- **算法**: HS256
- **Secret**: Supabase JWT Secret (从环境变量读取)
- **Audience**: "authenticated"
- **过期处理**: 自动返回 401，前端提示重新登录

### 3. 数据验证

- **前端**: TypeScript 类型检查
- **后端**: Pydantic 模型验证
- **数据库**: PostgreSQL 约束 (外键、唯一性等)

---

## 性能优化

### 1. Supabase 客户端单例

```python
# apps/api-gateway/core/supabase_client.py
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(...)
    return _supabase_client
```

**优势**: 避免重复创建连接，支持高并发

### 2. 启动时预初始化

```python
# apps/api-gateway/main.py
@app.on_event("startup")
async def startup_event():
    initialize_client()  # 预热连接
```

**优势**: 提前发现配置错误，避免第一个请求延迟

---

## 总结

### 关键要点

1. **统一入口**: 所有前端请求都通过 API Gateway
2. **认证机制**: 使用 Supabase JWT Token，在 Gateway 层统一验证
3. **数据转换**: 前端格式 ↔ 数据库格式的转换在 Gateway 层完成
4. **错误处理**: 前后端都有完善的错误处理机制
5. **类型安全**: TypeScript (前端) + Pydantic (后端) 双重验证

### 请求路径

```
前端组件
  → API Client (client.ts)
    → HTTP Request (带 JWT Token)
      → API Gateway (main.py)
        → JWT 验证 (dependencies.py)
          → 路由处理器 (routes/*.py)
            → Supabase 数据库
              → 返回响应
                → 前端组件更新 UI
```

---

**文档版本**: 1.0.0  
**最后更新**: 2025-01-XX  
**维护者**: HereNow 开发团队

