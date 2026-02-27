# AI 模块说明

## 概述

本模块实现了基于 OpenRouter 的 AI 服务集成，包括：
- AI 内容生成（文本、图片、对话等）
- 配额验证和管理
- 多种 AI 功能类型支持

## 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# OpenRouter API 配置
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_HTTP_REFERER=https://your-domain.com  # 可选，用于 OpenRouter 统计
```

### 获取 OpenRouter API Key

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册/登录账号
3. 在 Dashboard 中创建 API Key
4. 将 API Key 添加到环境变量

## 功能类型

### 1. text_generation (文本生成)
- **用途**: 生成或编辑事件描述
- **模型**: `google/gemini-2.0-flash-exp:free`
- **配额Key**: `quota_ai_text_generation`

### 2. image_generation (图片生成)
- **用途**: 生成活动封面图片
- **模型**: `black-forest-labs/flux-pro` (提示词优化)
- **配额Key**: `quota_ai_image_generation`
- **注意**: 实际图片生成需要集成其他服务（如 Stability AI）

### 3. chat (对话聊天)
- **用途**: AI 助手对话
- **模型**: `anthropic/claude-3.5-sonnet`
- **配额Key**: `quota_ai_chat`

### 4. planning (活动规划)
- **用途**: 生成活动规划建议
- **模型**: `openai/gpt-4o-mini`
- **配额Key**: `quota_ai_planning`

### 5. import (事件导入)
- **用途**: 从 URL/文本/图片提取事件信息
- **模型**: `google/gemini-2.0-flash-exp:free`
- **配额Key**: `quota_ai_import`

## API 使用示例

### 生成文本内容

```python
POST /api/v1/ai/generate
{
    "type": "text_generation",
    "prompt": "写一个关于产品发布会的活动描述",
    "context": {
        "eventName": "产品发布会",
        "startDate": "2025-11-19"
    },
    "options": {
        "temperature": 0.7,
        "max_tokens": 2000
    }
}
```

### 查询配额

```python
GET /api/v1/ai/quota
```

响应：
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
        }
        // ... 其他配额
    }
}
```

## 配额管理

配额验证在路由处理前自动执行：
1. 验证用户身份（JWT Token）
2. 检查配额是否足够
3. 原子性地扣减配额
4. 如果配额不足，返回 403 错误

配额信息从数据库查询，支持：
- `v_user_entitlements` 视图（推荐）
- `user_quotas` 表（备用）

## 错误处理

- **401 Unauthorized**: 用户未认证或 Token 无效
- **403 Forbidden**: 配额不足
- **400 Bad Request**: 无效的 AI 类型或参数
- **500 Internal Server Error**: AI 生成失败或数据库错误

## 扩展说明

### 添加新的 AI 功能类型

1. 在 `dependencies.py` 的 `AI_QUOTA_MAPPING` 中添加映射
2. 在 `openrouter_service.py` 的 `MODEL_CONFIG` 中添加模型配置
3. 在 `openrouter_service.py` 的 `_build_system_prompt` 中添加系统提示词
4. 更新 `AIGenerateRequest` 的 `type` 字段类型

### 更换 AI 服务提供商

修改 `openrouter_service.py` 中的 API 调用逻辑，替换为其他服务（如 OpenAI、Anthropic 等）。

