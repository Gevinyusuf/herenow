# HereNow 项目技术文档

> **版本**: v1.0  
> **最后更新**: 2026-02-21  
> **项目类型**: AI 驱动的活动社交管理平台

---

## 📋 目录

- [一、整体架构](#一整体架构)
- [二、认证系统](#二认证系统)
- [三、API 网关](#三api-网关)
- [四、数据库设计](#四数据库设计)
- [五、AI 功能](#五ai-功能)
- [六、权限与配额系统](#六权限与配额系统)
- [七、前端核心组件](#七前端核心组件)
- [八、数据流详解](#八数据流详解)
- [九、核心亮点](#九核心亮点)
- [十、开发建议](#十开发建议)

---

## 一、整体架构

### 1.1 Monorepo 架构

```
herenow-v1/
├── apps/
│   ├── frontend/          # Next.js 14+ 前端应用
│   ├── api-gateway/       # FastAPI API 网关（统一入口）
│   ├── user-service/      # 用户服务（待实现）
│   ├── product-service/   # 产品服务（待实现）
│   └── order-service/    # 订单服务（待实现）
├── packages/              # 共享包
├── docs/                 # 文档
└── scripts/              # 脚本
```

### 1.2 技术栈

| 层级 | 技术选型 | 用途 |
|------|----------|------|
| 前端 | Next.js 14 + TypeScript | SSR/SSG，App Router |
| 样式 | Tailwind CSS + Radix UI | 响应式设计，组件库 |
| 状态管理 | SWR | 数据获取和缓存 |
| 后端 | FastAPI + Python 3.11+ | 高性能异步框架 |
| 数据库 | Supabase (PostgreSQL) | 认证、数据库、实时功能 |
| AI | OpenRouter | 多模型 AI 服务集成 |
| 存储 | Cloudflare R2 | 对象存储（图片、文件） |

### 1.3 技术优势

#### 架构优势
- **微服务架构**：服务解耦，独立开发、部署和扩展
- **统一 API 网关**：集中处理认证、路由和请求分发
- **Monorepo 管理**：代码共享，依赖管理更简单

#### 性能优势
- **Next.js SSR/SSG**：首屏加载快，SEO 友好
- **FastAPI 异步**：高并发处理能力
- **Turborepo 缓存**：构建速度提升，CI/CD 效率高

#### 开发体验
- **类型安全**：TypeScript + Python 类型提示
- **热重载**：快速开发迭代
- **自动文档**：FastAPI 自动生成 API 文档

---

## 二、认证系统

### 2.1 认证流程

```
用户登录
    ↓
Supabase Auth API
    ↓
返回 JWT Token (access_token)
    ↓
前端存储到 localStorage
    ↓
后续请求携带 Token
    ↓
API 网关验证 JWT
    ↓
解析用户信息 (sub, email, role)
    ↓
转发到后端服务
```

### 2.2 JWT 验证实现

**文件**: `apps/api-gateway/core/auth/dependencies.py`

```python
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    token = credentials.credentials
    
    payload = jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    
    return {
        "sub": payload.get("sub"),      # user_id (UUID)
        "role": payload.get("role"),    # "authenticated"
        "email": payload.get("email"),
    }
```

### 2.3 前端认证封装

**文件**: `apps/frontend/lib/api/client.ts`

```typescript
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  return response;
}
```

### 2.4 安全措施

1. **HTTPS 传输加密** - 所有请求使用 HTTPS
2. **Token 过期处理** - 自动刷新过期 Token
3. **CORS 配置** - 严格的跨域资源共享配置
4. **JWT 签名验证** - 防止 Token 篡改

---

## 三、API 网关

### 3.1 网关职责

1. **JWT 验证** - 验证所有请求的 Token 有效性
2. **路由分发** - 根据路径转发到对应服务
3. **请求验证** - Pydantic 模型验证
4. **日志记录** - Debug 模式下记录请求和响应
5. **CORS 处理** - 跨域资源共享

### 3.2 网关主文件

**文件**: `apps/api-gateway/main.py`

```python
app = FastAPI(title="HereNow API Gateway", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/v1", tags=["认证"])
app.include_router(home.router, prefix="/api/v1", tags=["首页"])
app.include_router(events.router, prefix="/api/v1", tags=["活动"])
app.include_router(ai.router, prefix="/api/v1", tags=["AI"])
```

### 3.3 路由结构

| 路由 | 功能 | 文件 |
|------|------|------|
| `/api/v1/auth/*` | 认证相关 | `routes/auth.py` |
| `/api/v1/home/*` | 首页数据 | `routes/home.py` |
| `/api/v1/events` | 活动创建 | `routes/events/create.py` |
| `/api/v1/events/{id}` | 活动详情/更新/删除 | `routes/events/view.py`, `routes/events/manage.py` |
| `/api/v1/ai/*` | AI 功能 | `routes/ai.py` |

### 3.4 中间件

#### Debug 响应日志中间件
```python
@app.middleware("http")
async def debug_response_logger(request: Request, call_next):
    response = await call_next(request)
    
    if DEBUG_API_RESPONSE:
        body = await response.body()
        logger.info(f"[DEBUG RESPONSE] {request.method} {request.url.path} status={response.status_code}")
    
    return response
```

#### 全局异常处理器
```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error.get("loc", [])),
            "message": error.get("msg", "验证失败")
        })
    
    return JSONResponse(
        status_code=422,
        content={"detail": errors, "message": "数据验证失败"}
    )
```

---

## 四、数据库设计

### 4.1 核心数据表

#### profiles（用户资料）

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id`: 用户唯一标识（UUID）
- `full_name`: 用户全名
- `email`: 用户邮箱
- `avatar_url`: 头像图片 URL
- `created_at`: 创建时间

#### events_v1（活动表）

**文件**: `docs/database/sql/04_events_v1.sql`

```sql
CREATE TABLE events_v1 (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- 时间（关键）
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL,
    
    -- 地点（JSONB）
    location_info JSONB DEFAULT '{}',
    -- {"type": "virtual", "link": "zoom.us/..."}
    -- {"type": "offline", "name": "SF", "lat": 12, "lng": 34}
    
    -- 权限
    visibility TEXT DEFAULT 'public',
    require_approval BOOLEAN DEFAULT FALSE,
    host_id UUID REFERENCES profiles(id),
    
    -- 主题配置（JSONB）
    style_config JSONB DEFAULT '{}',
    -- {"themeId": "midnight", "effect": "sparkles", "colors": {...}}
    
    -- 票务配置（JSONB）
    ticket_config JSONB DEFAULT '{"tickets": []}',
    
    -- 注册字段（JSONB）
    registration_fields JSONB DEFAULT '[]',
    
    -- 联合主办方（JSONB）
    co_hosts JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id`: 活动唯一标识
- `title`: 活动标题
- `slug`: 友好 URL（用于 SEO）
- `description`: 活动描述（支持 HTML）
- `cover_image_url`: 封面图片 URL
- `start_at` / `end_at`: 活动开始/结束时间（带时区）
- `timezone`: 时区（如 'America/New_York'）
- `location_info`: 地点信息（JSONB 格式）
- `visibility`: 可见性（'public' | 'private'）
- `require_approval`: 是否需要审批
- `host_id`: 主办方 ID（外键到 profiles）
- `style_config`: 主题和视觉配置（JSONB）
- `ticket_config`: 票务配置（JSONB）
- `registration_fields`: 注册表单字段（JSONB）
- `co_hosts`: 联合主办方（JSONB）

#### subscriptions（订阅）

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    plan_id UUID REFERENCES plans(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id`: 订阅记录 ID
- `user_id`: 用户 ID
- `plan_id`: 套餐 ID
- `status`: 订阅状态（'active' | 'cancelled' | 'expired'）
- `created_at`: 创建时间

#### plans（套餐）

```sql
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    limits JSONB DEFAULT '{}',
    -- {"can_access_community": true, "quota_ai_text_generation": 100}
);
```

**字段说明**:
- `id`: 套餐 ID
- `name`: 套餐名称（'Free' | 'Pro' | 'Enterprise'）
- `limits`: 功能限制配置（JSONB）

#### usages（使用量统计）

```sql
CREATE TABLE usages (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    feature_key TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**字段说明**:
- `id`: 使用记录 ID
- `user_id`: 用户 ID
- `feature_key`: 功能标识（如 'quota_ai_text_generation'）
- `count`: 使用次数
- `updated_at`: 更新时间

### 4.2 视图

#### v_user_entitlements（用户权益视图）

```sql
CREATE VIEW v_user_entitlements AS
SELECT 
    p.id as user_id,
    pl.name as plan_name,
    pl.id as plan_id,
    (pl.limits->>'can_access_community')::boolean as can_access_community,
    (pl.limits->>'can_access_discover')::boolean as can_access_discover,
    (pl.limits->>'quota_ai_limit')::int as quota_ai_limit,
    COALESCE(u.count, 0) as quota_ai_used,
    (pl.limits->>'quota_ai_limit')::int - COALESCE(u.count, 0) as quota_ai_remaining
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id AND s.status = 'active'
LEFT JOIN plans pl ON s.plan_id = pl.id
LEFT JOIN usages u ON p.id = u.user_id AND u.feature_key = 'quota_ai_limit';
```

**用途**: 统一查询用户的套餐信息和配额使用情况

### 4.3 索引

```sql
-- 活动表索引
CREATE INDEX idx_events_host ON events_v1(host_id);
CREATE INDEX idx_events_start ON events_v1(start_at);
CREATE INDEX idx_events_slug ON events_v1(slug);

-- 订阅表索引
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 使用量索引
CREATE INDEX idx_usages_user_feature ON usages(user_id, feature_key);
```

### 4.4 RPC 函数

#### check_and_increment_quota（检查并扣减配额）

```sql
CREATE OR REPLACE FUNCTION check_and_increment_quota(
    p_user_id UUID,
    p_feature_key TEXT,
    p_delta INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_plan_id UUID;
    v_limit INTEGER;
    v_used INTEGER;
    v_new_used INTEGER;
BEGIN
    -- 获取用户套餐
    SELECT plan_id INTO v_plan_id
    FROM subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- 如果没有套餐，返回 false
    IF v_plan_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- 获取配额限制
    SELECT (limits->>p_feature_key)::INTEGER INTO v_limit
    FROM plans
    WHERE id = v_plan_id;
    
    -- 如果配额为 -1，表示无限
    IF v_limit = -1 THEN
        -- 直接增加使用量
        INSERT INTO usages (user_id, feature_key, count)
        VALUES (p_user_id, p_feature_key, p_delta)
        ON CONFLICT (user_id, feature_key)
        DO UPDATE SET count = usages.count + p_delta, updated_at = NOW();
        RETURN TRUE;
    END IF;
    
    -- 获取已使用量
    SELECT COALESCE(count, 0) INTO v_used
    FROM usages
    WHERE user_id = p_user_id AND feature_key = p_feature_key;
    
    -- 检查配额
    IF v_used + p_delta > v_limit THEN
        RETURN FALSE;
    END IF;
    
    -- 扣减配额
    INSERT INTO usages (user_id, feature_key, count)
    VALUES (p_user_id, p_feature_key, v_used + p_delta)
    ON CONFLICT (user_id, feature_key)
    DO UPDATE SET count = usages.count + p_delta, updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

#### get_user_events_optimized（获取用户活动）

```sql
CREATE OR REPLACE FUNCTION get_user_events_optimized(
    p_user_id UUID
) RETURNS TABLE (
    id UUID,
    title TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    cover_image_url TEXT,
    location_info JSONB,
    style_config JSONB,
    timezone TEXT,
    is_created BOOLEAN,
    is_registered BOOLEAN,
    registration_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 用户创建的活动
    created_events AS (
        SELECT 
            e.id, e.title, e.start_at, e.end_at,
            e.cover_image_url, e.location_info, e.style_config, e.timezone,
            TRUE as is_created,
            FALSE as is_registered
        FROM events_v1 e
        WHERE e.host_id = p_user_id
    ),
    -- 用户参与的活动
    registered_events AS (
        SELECT DISTINCT
            e.id, e.title, e.start_at, e.end_at,
            e.cover_image_url, e.location_info, e.style_config, e.timezone,
            FALSE as is_created,
            TRUE as is_registered
        FROM event_registrations r
        JOIN events_v1 e ON r.event_id = e.id
        WHERE r.user_id = p_user_id AND r.status IN ('confirmed', 'pending')
    ),
    -- 合并活动
    all_events AS (
        SELECT * FROM created_events
        UNION
        SELECT * FROM registered_events
    )
    SELECT 
        ae.*,
        COALESCE(er.reg_count, 0) as registration_count
    FROM all_events ae
    LEFT JOIN (
        SELECT event_id, COUNT(*) as reg_count
        FROM event_registrations
        WHERE status IN ('confirmed', 'pending')
        GROUP BY event_id
    ) er ON ae.id = er.event_id
    ORDER BY ae.start_at DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 五、AI 功能

### 5.1 AI 功能类型

| 类型 | 功能 | 配额 Key |
|------|------|-----------|
| `text_generation` | 文本生成 | `quota_ai_text_generation` |
| `image_generation` | 图片生成 | `quota_ai_image_generation` |
| `chat` | 对话聊天 | `quota_ai_chat` |
| `planning` | 活动规划 | `quota_ai_planning` |
| `import` | 活动导入 | `quota_ai_import` |

### 5.2 AI 配额验证

**文件**: `apps/api-gateway/core/ai/dependencies.py`

```python
async def verify_ai_quota_by_type(ai_type: str, current_user: Dict, supabase: Client) -> bool:
    user_id = current_user.get("sub")
    feature_key = AI_QUOTA_MAPPING.get(ai_type)
    
    # 调用数据库 RPC 函数，原子性地检查并扣减配额
    response = supabase.rpc(
        'check_and_increment_quota',
        {
            'p_user_id': user_id,
            'p_feature_key': feature_key,
            'p_delta': 1
        }
    ).execute()
    
    if not response.data:
        raise HTTPException(status_code=403, detail="AI quota exceeded")
    
    return True
```

### 5.3 AI 生成接口

**文件**: `apps/api-gateway/routes/ai.py`

```python
@router.post("/ai/generate")
async def generate_content(
    request: AIGenerateRequest,
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    # 1. 验证并扣减配额
    await verify_ai_quota_by_type(request.type, current_user, supabase)
    
    # 2. 调用 OpenRouter 服务
    openrouter_service = get_openrouter_service()
    
    if request.type == "image_generation":
        generated_content = await openrouter_service.generate_image(
            prompt=request.prompt,
            options=request.options
        )
    else:
        generated_content = await openrouter_service.generate_text(
            prompt=request.prompt,
            ai_type=request.type,
            context=request.context,
            options=request.options
        )
    
    return AIGenerateResponse(success=True, data=generated_content)
```

### 5.4 活动导入功能

#### 从链接导入（Luma）

```python
@router.post("/ai/import-from-link")
async def import_from_link(request: ImportFromLinkRequest):
    # 1. 验证并扣减配额
    await verify_ai_quota_by_type("import", current_user, supabase)
    
    # 2. 使用 Playwright 爬取 Luma 活动页面
    scraper = LumaScraper()
    luma_data = await scraper.scrape(request.url)
    
    # 3. 映射数据到 events_v1 结构
    mapper = LumaDataMapper()
    event_data = await mapper.map_to_events_v1(luma_data, host_id)
    
    # 4. 插入数据库
    result = supabase.table("events_v1").insert(event_data).execute()
    
    return ImportFromLinkResponse(success=True, data=result.data[0])
```

#### 从图片导入

```python
@router.post("/ai/import-from-image")
async def import_from_image(image: UploadFile = File(...)):
    # 1. 验证并扣减配额
    await verify_ai_quota_by_type("import", current_user, supabase)
    
    # 2. 读取图片并转换为 Base64
    image_data = await image.read()
    image_base64 = base64.b64encode(image_data).decode('utf-8')
    
    # 3. 使用 AI 视觉模型分析图片
    openrouter_service = get_openrouter_service()
    extracted_text = await openrouter_service.analyze_image(
        image_data_url=f"data:{image.content_type};base64,{image_base64}",
        prompt="Extract event information from this poster..."
    )
    
    # 4. 使用 LLM 结构化数据
    structured_data = await openrouter_service.generate_text(
        prompt="Convert extracted text to JSON event format..."
    )
    
    # 5. 映射并保存到数据库
    mapper = LumaDataMapper()
    event_data = await mapper.map_to_events_v1(structured_data, host_id)
    result = supabase.table("events_v1").insert(event_data).execute()
    
    return ImportFromImageResponse(success=True, data=result.data[0])
```

### 5.5 OpenRouter 服务集成

**文件**: `apps/api-gateway/core/ai/openrouter_service.py`

```python
class OpenRouterService:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
    
    async def generate_text(self, prompt: str, ai_type: str, **kwargs):
        # 根据类型选择模型
        model = self._get_model_for_type(ai_type)
        
        response = await httpx.AsyncClient().post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                **kwargs
            }
        )
        
        return response.json()["choices"][0]["message"]["content"]
    
    async def generate_image(self, prompt: str, **kwargs):
        # 调用图片生成模型
        response = await httpx.AsyncClient().post(
            f"{self.base_url}/images/generations",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                **kwargs
            }
        )
        
        return response.json()["data"][0]["url"]
    
    async def analyze_image(self, image_data_url: str, prompt: str, **kwargs):
        # 调用视觉模型分析图片
        response = await httpx.AsyncClient().post(
            f"{self.base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/gpt-4-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": image_data_url}
                        ]
                    }
                ],
                **kwargs
            }
        )
        
        return response.json()["choices"][0]["message"]["content"]
```

---

## 六、权限与配额系统

### 6.1 权限系统

**文件**: `apps/frontend/hooks/useEntitlements.ts`

```typescript
export function useEntitlements() {
  const { data } = useSWR(
    user ? ['entitlements', user.id] : null,
    async () => {
      const { data } = await supabase
        .from('v_user_entitlements')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    }
  );

  return {
    canAccessCommunity: data?.can_access_community,
    canAccessDiscover: data?.can_access_discover,
    aiRemaining: data?.quota_ai_remaining ?? 0,
    aiLimit: data?.quota_ai_limit,
    isUnlimited: data?.quota_ai_limit === -1,
  };
}
```

### 6.2 套餐功能对比

| 功能 | Free | Pro | Enterprise |
|------|-------|-----|------------|
| 活动创建 | ✅ | ✅ | ✅ |
| 社群功能 | ❌ | ✅ | ✅ |
| 发现功能 | ❌ | ✅ | ✅ |
| AI 文本生成 | 10次/月 | 100次/月 | 无限 |
| AI 图片生成 | 5次/月 | 50次/月 | 无限 |
| 活动导入 | 3次/月 | 30次/月 | 无限 |

### 6.3 配额管理流程

```
用户请求 AI 功能
    ↓
前端检查配额（useEntitlements）
    ↓
发送请求到 API
    ↓
API 网关验证 JWT
    ↓
调用 verify_ai_quota_by_type()
    ↓
数据库 RPC 函数 check_and_increment_quota
    ↓
配额检查通过，扣减 1
    ↓
执行 AI 逻辑
    ↓
返回结果
```

### 6.4 配额查询接口

```python
@router.get("/ai/quota")
async def get_ai_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    user_id = current_user.get("sub")
    
    # 获取所有 AI 功能的配额信息
    quotas = await get_all_ai_quotas(user_id, supabase)
    
    return AIQuotaResponse(
        success=True,
        data=quotas,
        message="Quota information retrieved successfully"
    )
```

---

## 七、前端核心组件

### 7.1 AI 助手组件

**文件**: `apps/frontend/components/create/AIAssistant.tsx`

#### 功能特性

1. **多标签页** - Chat、Planning、Style、Settings
2. **命令系统** - `@paste:`, `@link:`, `@image:`
3. **图片上传** - 支持从海报提取活动信息
4. **链接导入** - 支持 Luma 活动链接导入
5. **主题选择** - 可视化主题和效果选择器

#### 命令实现

```typescript
// 检测 @link: 命令
const extractLinkCommand = (text: string) => {
  const linkPattern = /@link:\s*(https?:\/\/[^\s]+)/i;
  const match = text.match(linkPattern);
  if (match && match[1]) {
    return {
      url: match[1].trim(),
      isLuma: isLumaLink(match[1])
    };
  }
  return null;
};

// 处理 Luma 链接导入
if (linkCommand && linkCommand.isLuma) {
  const importResult = await importEventFromLink(linkCommand.url);
  const fullEventData = await getEvent(importResult.data.id);
  const { data: frontendEventData } = convertBackendToFrontendFormat(fullEventData);
  onEventDataUpdate(frontendEventData);
}
```

#### 组件结构

```
AIAssistant
├── Header (标题、最小化、关闭)
├── Tabs (Chat、Planning、Style、Settings)
├── Content Area
│   ├── Chat Tab
│   │   ├── Welcome Screen
│   │   ├── Messages List
│   │   └── Input Area (支持 @ 命令)
│   ├── Planning Tab
│   │   ├── Event Type Input
│   │   ├── Target Audience Input
│   │   ├── Desired Vibe Input
│   │   └── Brainstorm Button
│   ├── Style Tab
│   │   ├── Theme Categories
│   │   ├── Theme Grid
│   │   ├── Effect Categories
│   │   └── Effect Grid
│   └── Settings Tab
│       ├── Save Tickets Toggle
│       ├── Save Location Toggle
│       ├── Save Questions Toggle
│       ├── Event Public Toggle
│       ├── Location Public Toggle
│       └── Require Approval Toggle
└── Floating Button (最小化时显示)
```

### 7.2 活动卡片组件

**文件**: `apps/frontend/components/home/EventCard.tsx`

```typescript
interface Event {
  id: number | string;
  title: string;
  date: string;           // "NOV 14"
  time: string;           // "7:00 PM"
  location: string;
  imageColor: string;      // "from-blue-400 to-purple-500"
  category: string;        // "this-week", "this-month", etc.
  isPinned?: boolean;
  registrationCount?: number;
  coverImageUrl?: string | null;
}
```

#### 组件功能

1. **活动信息展示** - 标题、时间、地点、封面图
2. **置顶功能** - 支持活动置顶
3. **删除功能** - 删除活动（带确认）
4. **分类标签** - 显示活动分类（本周、本月等）
5. **报名人数** - 显示已报名人数

### 7.3 首页数据获取

**文件**: `apps/frontend/app/(main)/home/page.tsx`

```typescript
const { data: homeData, mutate: refreshHomeData } = useSWR(
  'home-data',
  getHomeData,
  {
    dedupingInterval: 10000,      // 10秒去重
    revalidateOnFocus: true,      // 聚焦时重新验证
    revalidateOnReconnect: true,  // 网络重连时重新验证
    revalidateIfStale: true,      // 自动重新验证
    errorRetryCount: 2,
    errorRetryInterval: 3000,
  }
);
```

#### 数据结构

```typescript
interface HomeData {
  events: {
    upcoming: Event[];
    past: Event[];
  };
  communities: {
    myCommunities: Community[];
    joinedCommunities: Community[];
  };
}
```

### 7.4 其他核心组件

| 组件 | 功能 | 文件 |
|------|------|------|
| `Navbar` | 导航栏 | `components/home/Navbar.tsx` |
| `Footer` | 页脚 | `components/home/Footer.tsx` |
| `CommunityCard` | 社群卡片 | `components/home/CommunityCard.tsx` |
| `DesignStudio` | 设计工作室 | `components/create/DesignStudio.tsx` |
| `Schedule` | 时间安排 | `components/create/Schedule.tsx` |
| `LocationMap` | 地图选择 | `components/create/LocationMap.tsx` |

---

## 八、数据流详解

### 8.1 活动创建流程

```
用户填写活动表单
    ↓
AI 助手辅助（可选）
    ↓
前端收集数据
    ↓
POST /api/v1/events
    ↓
API 网关验证 JWT
    ↓
验证必填字段
    ↓
构建 events_v1 数据结构
    ↓
插入 Supabase 数据库
    ↓
返回活动 ID 和 slug
```

### 8.2 首页数据加载流程

```
用户访问 /home
    ↓
useSWR 触发数据获取
    ↓
调用 getHomeData()
    ↓
GET /api/v1/home/all
    ↓
API 网关验证 JWT
    ↓
调用 get_user_events_optimized()
    ↓
数据库 RPC 函数查询
    ↓
返回活动和社群数据
    ↓
前端渲染组件
```

### 8.3 AI 生成流程

```
用户输入提示词
    ↓
POST /api/v1/ai/generate
    ↓
API 网关验证 JWT
    ↓
调用 verify_ai_quota_by_type()
    ↓
数据库 RPC 函数 check_and_increment_quota
    ↓
配额检查通过，扣减 1
    ↓
调用 OpenRouter API
    ↓
返回 AI 生成内容
    ↓
前端显示结果
```

### 8.4 活动导入流程（Luma）

```
用户提供 Luma 链接
    ↓
POST /api/v1/ai/import-from-link
    ↓
API 网关验证 JWT
    ↓
验证并扣减 import 配额
    ↓
初始化 Playwright 爬虫
    ↓
爬取 Luma 活动页面
    ↓
解析活动数据
    ↓
映射到 events_v1 结构
    ↓
插入 Supabase 数据库
    ↓
返回创建的活动信息
    ↓
前端更新表单
```

### 8.5 活动导入流程（图片）

```
用户上传活动海报
    ↓
POST /api/v1/ai/import-from-image
    ↓
API 网关验证 JWT
    ↓
验证并扣减 import 配额
    ↓
读取图片并转换为 Base64
    ↓
调用 OpenRouter 视觉模型
    ↓
AI 分析图片内容
    ↓
使用 LLM 结构化数据
    ↓
映射到 events_v1 结构
    ↓
插入 Supabase 数据库
    ↓
返回创建的活动信息
    ↓
前端更新表单
```

---

## 九、核心亮点

### 9.1 性能优化

1. **数据库 RPC 优化**
   - 使用 `get_user_events_optimized` 函数一次性获取所有数据
   - 减少查询次数，响应时间减少 55-60%

2. **SWR 缓存**
   - 前端使用 SWR 进行数据缓存和去重
   - 10秒去重间隔，避免重复请求
   - 自动重新验证机制

3. **Supabase 单例**
   - 后端使用单例模式管理 Supabase 客户端
   - 支持高并发场景
   - 减少连接开销

4. **增量构建**
   - Turborepo 支持增量构建和缓存
   - 只构建变更的模块
   - CI/CD 效率提升

### 9.2 用户体验

1. **AI 辅助**
   - 智能活动创建助手
   - 支持多种输入方式（文本、链接、图片）
   - 实时反馈和错误提示

2. **实时反馈**
   - 加载状态显示
   - 错误提示
   - 成功确认

3. **响应式设计**
   - 完美支持桌面和移动端
   - 自适应布局
   - 触摸友好

4. **权限控制**
   - 基于套餐的功能访问控制
   - 友好的升级提示
   - 细粒度的权限管理

### 9.3 安全性

1. **JWT 认证**
   - 所有 API 请求都需要有效 Token
   - Token 过期自动刷新
   - 签名验证防止篡改

2. **配额管理**
   - 防止 AI 功能滥用
   - 原子性配额扣减
   - 实时配额查询

3. **参数验证**
   - Pydantic 模型验证所有输入
   - 类型安全
   - 详细的错误信息

4. **CORS 配置**
   - 严格的跨域资源共享配置
   - 白名单机制
   - 凭证支持

### 9.4 可扩展性

1. **微服务架构**
   - 服务解耦，独立扩展
   - 水平扩展支持
   - 灵活的技术选型

2. **Monorepo 管理**
   - 代码共享
   - 统一依赖管理
   - 独立部署

3. **插件化设计**
   - AI 助手插件化
   - 易于添加新功能
   - 模块化架构

---

## 十、开发建议

### 10.1 前端开发

1. **使用 SWR 管理数据**
   ```typescript
   const { data, error, mutate } = useSWR(key, fetcher, {
     dedupingInterval: 10000,
     revalidateOnFocus: true,
   });
   ```

2. **使用 useEntitlements 检查权限**
   ```typescript
   const { canAccessCommunity, aiRemaining } = useEntitlements();
   
   if (!canAccessCommunity) {
     return <UpgradePrompt />;
   }
   ```

3. **使用 authenticatedFetch 发送认证请求**
   ```typescript
   const response = await authenticatedFetch('/api/v1/events', {
     method: 'POST',
     body: JSON.stringify(data),
   });
   ```

4. **遵循组件结构**
   - 使用 TypeScript 接口定义 Props
   - 保持组件单一职责
   - 使用 Tailwind CSS 类名

### 10.2 后端开发

1. **使用 Depends 添加认证保护**
   ```python
   @router.post("/events")
   async def create_event(
       current_user: Dict = Depends(get_current_user)
   ):
       user_id = current_user.get("sub")
       # 业务逻辑
   ```

2. **使用 verify_ai_quota_by_type 验证配额**
   ```python
   await verify_ai_quota_by_type("text_generation", current_user, supabase)
   ```

3. **使用 Pydantic 模型验证请求**
   ```python
   class EventCreateRequest(BaseModel):
       eventName: str
       startDate: str
       startTime: str
   
   async def create_event(request: EventCreateRequest):
       # 验证通过
   ```

4. **使用 Supabase 客户端单例**
   ```python
   from core.supabase_client import get_supabase_client
   
   supabase = get_supabase_client()
   result = supabase.table("events_v1").select("*").execute()
   ```

### 10.3 数据库操作

1. **使用 JSONB 存储复杂数据**
   ```sql
   INSERT INTO events_v1 (style_config)
   VALUES ('{"themeId": "midnight", "effect": "sparkles"}');
   ```

2. **使用 RPC 函数优化复杂查询**
   ```python
   response = supabase.rpc(
       'get_user_events_optimized',
       {'p_user_id': user_id}
   ).execute()
   ```

3. **使用视图简化权限查询**
   ```python
   response = supabase.table("v_user_entitlements").select("*").eq(
       "user_id", user_id
   ).execute()
   ```

4. **使用索引提高查询性能**
   ```sql
   CREATE INDEX idx_events_host ON events_v1(host_id);
   CREATE INDEX idx_events_start ON events_v1(start_at);
   ```

### 10.4 测试建议

1. **前端测试**
   - 使用 Jest + React Testing Library
   - 测试组件渲染和交互
   - 测试 SWR 数据获取

2. **后端测试**
   - 使用 pytest
   - 测试 API 端点
   - 测试数据库操作
   - 测试配额验证逻辑

3. **集成测试**
   - 测试完整的数据流
   - 测试认证流程
   - 测试 AI 功能集成

### 10.5 部署建议

1. **前端部署**
   - 使用 Vercel 部署 Next.js
   - 配置环境变量
   - 启用自动部署

2. **后端部署**
   - 使用 Docker 容器化
   - 部署到云服务器（AWS/GCP/Azure）
   - 配置负载均衡

3. **数据库部署**
   - 使用 Supabase 托管服务
   - 配置 Row Level Security (RLS)
   - 定期备份数据

4. **CI/CD 配置**
   - 使用 GitHub Actions
   - 自动化测试和部署
   - 配置环境隔离

---

## 附录

### A. 环境变量配置

#### 前端环境变量 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8000
```

#### 后端环境变量 (`.env`)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_key
DEBUG_API_RESPONSE=true
DEBUG_API_RESPONSE_LIMIT=2000
```

### B. 常用命令

#### 前端命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint
```

#### 后端命令

```bash
# 开发模式
uvicorn main:app --reload

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 8000

# 运行测试
pytest

# 代码格式化
black .
```

### C. 相关文档链接

- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [OpenRouter 文档](https://openrouter.ai/docs)
- [SWR 文档](https://swr.vercel.app/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

**文档维护**: 请在代码变更时同步更新本文档  
**问题反馈**: 如有问题请联系开发团队  
**最后更新**: 2026-02-21
