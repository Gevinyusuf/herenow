# AI 接口整合计划

## 📋 概述

本文档规划了在 `apps/frontend/app/(main)/create/event/page.tsx` 中整合多个AI接口的实现方案，包括配额管理和错误处理。

## 🎯 目标

1. 将所有AI功能统一通过API网关调用
2. 实现配额限制和检查机制
3. 提供良好的用户体验和错误提示
4. 支持多种AI功能类型，每种功能有独立的配额

## 🔍 现有AI功能分析

根据代码分析，当前页面包含以下AI功能：

### 1. **AI Writer** (文本生成)
- **位置**: `handleAIWrite` 函数 (line 283)
- **当前实现**: 直接调用 Gemini API (`NEXT_PUBLIC_GEMINI_API_KEY`)
- **功能**: 根据提示词生成/编辑事件描述（HTML格式）
- **配额类型**: `quota_ai_text_generation`

### 2. **AI Chat** (对话助手)
- **位置**: `handleAIChatSend` 函数 (line 388)
- **当前实现**: 模拟响应（setTimeout）
- **功能**: AI助手对话，帮助优化事件描述、建议主题等
- **配额类型**: `quota_ai_chat`

### 3. **AI Image Generation** (图片生成)
- **位置**: `ImagePickerModal` 组件中的AI标签页
- **当前实现**: 模拟生成（setTimeout）
- **功能**: 根据提示词生成活动封面图片
- **配额类型**: `quota_ai_image_generation`

### 4. **AI Planning** (活动规划)
- **位置**: AI Assistant的Planning标签页 (line 1276)
- **当前实现**: 本地状态管理
- **功能**: 根据活动类型、受众、氛围生成活动规划建议
- **配额类型**: `quota_ai_planning`

### 5. **AI Event Import** (事件导入)
- **位置**: AI Chat中的快速操作按钮
- **当前实现**: 未实现
- **功能**: 从URL、文本或图片中提取事件信息并自动填充表单
- **配额类型**: `quota_ai_import`

## 🏗️ 架构设计

### 后端API设计

#### 1. 统一AI接口

```
POST /api/v1/ai/generate
```

**请求体**:
```json
{
  "type": "text_generation" | "image_generation" | "chat" | "planning" | "import",
  "prompt": "用户输入的提示词",
  "context": {
    // 可选的上下文信息，如当前事件数据
    "eventName": "...",
    "description": "...",
    // 其他相关上下文
  },
  "options": {
    // 功能特定的选项
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    // ...
  }
}
```

**响应体**:
```json
{
  "success": true,
  "data": {
    "content": "生成的文本内容",
    "metadata": {
      // 额外的元数据
    }
  },
  "quota": {
    "remaining": 10,
    "used": 90,
    "total": 100
  }
}
```

#### 2. 配额查询接口

```
GET /api/v1/ai/quota
```

**响应体**:
```json
{
  "success": true,
  "data": {
    "quota_ai_text_generation": {
      "used": 5,
      "total": 100,
      "remaining": 95
    },
    "quota_ai_chat": {
      "used": 10,
      "total": 200,
      "remaining": 190
    },
    "quota_ai_image_generation": {
      "used": 2,
      "total": 50,
      "remaining": 48
    },
    "quota_ai_planning": {
      "used": 1,
      "total": 50,
      "remaining": 49
    },
    "quota_ai_import": {
      "used": 0,
      "total": 20,
      "remaining": 20
    }
  }
}
```

### 配额类型映射

| AI功能 | 配额Key | 说明 |
|--------|---------|------|
| 文本生成 | `quota_ai_text_generation` | AI Writer生成事件描述 |
| 对话聊天 | `quota_ai_chat` | AI Chat助手对话 |
| 图片生成 | `quota_ai_image_generation` | 生成活动封面图 |
| 活动规划 | `quota_ai_planning` | 生成活动规划建议 |
| 事件导入 | `quota_ai_import` | 从URL/文本/图片导入事件信息 |

### 前端服务层设计

创建统一的AI服务层 `apps/frontend/lib/api/ai.ts`:

```typescript
// AI功能类型
export type AIFunctionType = 
  | 'text_generation'
  | 'image_generation' 
  | 'chat'
  | 'planning'
  | 'import';

// AI请求选项
export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

// AI请求上下文
export interface AIContext {
  eventName?: string;
  description?: string;
  [key: string]: any;
}

// AI生成请求
export interface AIGenerateRequest {
  type: AIFunctionType;
  prompt: string;
  context?: AIContext;
  options?: AIGenerateOptions;
}

// AI生成响应
export interface AIGenerateResponse {
  success: boolean;
  data: {
    content: string;
    metadata?: any;
  };
  quota?: {
    remaining: number;
    used: number;
    total: number;
  };
  message?: string;
}

// 配额信息
export interface QuotaInfo {
  used: number;
  total: number;
  remaining: number;
}

export interface AllQuotas {
  quota_ai_text_generation: QuotaInfo;
  quota_ai_chat: QuotaInfo;
  quota_ai_image_generation: QuotaInfo;
  quota_ai_planning: QuotaInfo;
  quota_ai_import: QuotaInfo;
}
```

## 📝 实现步骤

### 阶段1: 后端扩展

1. **扩展AI路由** (`apps/api-gateway/routes/ai.py`)
   - 支持多种AI功能类型
   - 根据类型调用不同的配额检查
   - 实现实际的AI生成逻辑（调用Gemini API等）

2. **扩展配额验证** (`apps/api-gateway/core/auth/dependencies.py`)
   - 创建通用的配额验证函数，支持不同的feature_key
   - 为每种AI功能创建专门的依赖函数

3. **实现配额查询** (`apps/api-gateway/routes/ai.py`)
   - 实现 `/api/v1/ai/quota` 端点
   - 查询用户所有AI功能的配额信息

### 阶段2: 前端服务层

1. **创建AI服务模块** (`apps/frontend/lib/api/ai.ts`)
   - 实现 `generateAI` 函数
   - 实现 `getAIQuota` 函数
   - 统一的错误处理

2. **创建配额Hook** (`apps/frontend/hooks/useAIQuota.ts`)
   - 实时查询和更新配额信息
   - 提供配额检查辅助函数

### 阶段3: 前端集成

1. **替换AI Writer**
   - 移除直接调用Gemini API的代码
   - 使用新的AI服务层

2. **实现AI Chat**
   - 连接真实的AI接口
   - 实现对话历史管理

3. **实现AI Image Generation**
   - 连接图片生成接口
   - 处理图片URL返回

4. **实现AI Planning**
   - 连接规划接口
   - 格式化返回结果

5. **实现AI Import**
   - 实现URL导入
   - 实现文本导入
   - 实现图片导入（OCR）

### 阶段4: 用户体验优化

1. **配额显示**
   - 在AI功能按钮旁显示剩余配额
   - 配额不足时禁用按钮并提示

2. **错误处理**
   - 友好的错误提示
   - 配额不足时的升级提示

3. **加载状态**
   - 统一的加载动画
   - 进度提示

## 🔒 配额管理策略

### 配额检查流程

```
用户触发AI功能
    ↓
前端检查本地缓存的配额（可选，减少请求）
    ↓
调用后端API
    ↓
后端验证JWT Token
    ↓
后端检查并扣减配额（原子操作）
    ↓
配额足够？
    ├─ 是 → 执行AI生成 → 返回结果和更新后的配额
    └─ 否 → 返回403错误，提示配额不足
```

### 配额扣减时机

- **成功时扣减**: 只有在AI生成成功后才扣减配额
- **失败时回滚**: 如果AI生成失败，可以考虑回滚配额（可选）

## 🎨 UI/UX 设计建议

### 配额显示位置

1. **AI功能按钮旁**: 显示剩余配额徽章
2. **AI面板顶部**: 显示所有功能的配额概览
3. **配额不足提示**: 模态框或Toast提示

### 配额不足处理

- 禁用相关按钮
- 显示友好的提示信息
- 提供升级链接或购买配额选项

## 📊 监控和日志

- 记录每次AI调用
- 记录配额使用情况
- 监控API响应时间
- 记录错误和异常

## 🚀 后续优化

1. **缓存机制**: 缓存常用AI生成结果
2. **批量处理**: 支持批量AI生成请求
3. **流式响应**: 支持流式返回（SSE/WebSocket）
4. **多模型支持**: 支持切换不同的AI模型
5. **成本优化**: 根据功能选择成本更低的模型

