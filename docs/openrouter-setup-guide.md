# OpenRouter API 配置指南

## 什么是 OpenRouter？

OpenRouter 是一个 AI 模型聚合服务，提供统一的 API 接口访问多个 AI 模型（如 GPT-4、Claude、Gemini 等）。

## 配置步骤

### 1. 获取 OpenRouter API Key

1. 访问 [OpenRouter 官网](https://openrouter.ai/)
2. 注册账号并登录
3. 进入 [API Keys 页面](https://openrouter.ai/keys)
4. 点击 "Create Key" 创建新的 API Key
5. 复制生成的 API Key（格式类似：`sk-or-v1-xxxxx...`）

### 2. 配置环境变量

在 `apps/api-gateway` 目录下创建 `.env` 文件（如果不存在）：

```bash
cd apps/api-gateway
touch .env
```

编辑 `.env` 文件，添加以下配置：

```env
# OpenRouter AI 配置
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
OPENROUTER_HTTP_REFERER=https://your-domain.com  # 可选
```

**重要提示**：
- 将 `sk-or-v1-your-actual-api-key-here` 替换为你从 OpenRouter 获取的真实 API Key
- `OPENROUTER_HTTP_REFERER` 是可选的，用于 OpenRouter 的统计功能

### 3. 验证配置

启动 API Gateway 服务：

```bash
cd apps/api-gateway
uvicorn main:app --reload --port 8000
```

如果配置正确，启动时不会看到警告信息。如果看到以下警告，说明 API Key 未配置：

```
WARNING:core.ai.openrouter_service:OPENROUTER_API_KEY not set, AI features will not work
```

### 4. 测试 AI 功能

使用以下命令测试 AI 生成功能：

```bash
# 获取你的 JWT Token（从浏览器开发者工具中获取）
TOKEN="your_jwt_token"

# 测试文本生成
curl -X POST http://localhost:8000/api/v1/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text_generation",
    "prompt": "写一个产品发布会的活动描述",
    "context": {
      "eventName": "产品发布会",
      "startDate": "2025-01-20"
    }
  }'
```

## 模型配置

系统已经为不同的 AI 功能类型配置了默认模型：

| AI 功能类型 | 默认模型 | 说明 |
|------------|---------|------|
| text_generation | `google/gemini-2.0-flash-exp:free` | 文本生成（免费） |
| image_generation | `black-forest-labs/flux-pro` | 图片生成 |
| chat | `anthropic/claude-3.5-sonnet` | 对话聊天 |
| planning | `openai/gpt-4o-mini` | 活动规划 |
| import | `google/gemini-2.0-flash-exp:free` | 事件导入 |

### 修改模型配置

如果需要修改模型，编辑 `apps/api-gateway/core/ai/openrouter_service.py` 文件中的 `MODEL_CONFIG`：

```python
MODEL_CONFIG = {
    "text_generation": {
        "model": "google/gemini-2.0-flash-exp:free",  # 修改这里
        "temperature": 0.7,
        "max_tokens": 2000,
    },
    # ... 其他配置
}
```

### 可用的模型列表

访问 [OpenRouter 模型列表](https://openrouter.ai/models) 查看所有可用的模型。

常用模型推荐：
- **免费模型**：
  - `google/gemini-2.0-flash-exp:free` - Google Gemini（免费）
  - `meta-llama/llama-3.2-3b-instruct:free` - Meta Llama（免费）
  
- **付费模型**：
  - `openai/gpt-4o-mini` - OpenAI GPT-4o Mini（便宜）
  - `anthropic/claude-3.5-sonnet` - Anthropic Claude（高质量）
  - `openai/gpt-4o` - OpenAI GPT-4o（最强）

## 费用说明

- **免费模型**：OpenRouter 提供一些免费模型，但有限制
- **付费模型**：按使用量付费，价格因模型而异
- **查看费用**：在 OpenRouter Dashboard 中查看使用量和费用

## 故障排查

### 问题 1: API Key 未配置

**错误信息**：
```
WARNING:core.ai.openrouter_service:OPENROUTER_API_KEY not set
ERROR: OpenRouter API key not configured
```

**解决方法**：
1. 检查 `.env` 文件是否存在
2. 确认 `OPENROUTER_API_KEY` 已正确设置
3. 重启 API Gateway 服务

### 问题 2: API Key 无效

**错误信息**：
```
OpenRouter API error: 401 - Unauthorized
```

**解决方法**：
1. 检查 API Key 是否正确复制（不要有多余的空格）
2. 确认 API Key 在 OpenRouter Dashboard 中仍然有效
3. 检查 API Key 是否有足够的权限

### 问题 3: 配额不足

**错误信息**：
```
OpenRouter API error: 429 - Too Many Requests
```

**解决方法**：
1. 检查 OpenRouter 账户余额
2. 等待一段时间后重试
3. 考虑升级到付费计划

### 问题 4: 模型不可用

**错误信息**：
```
OpenRouter API error: 404 - Model not found
```

**解决方法**：
1. 检查模型名称是否正确
2. 确认模型在 OpenRouter 中可用
3. 查看 [OpenRouter 模型列表](https://openrouter.ai/models) 确认模型状态

## 安全建议

1. **不要提交 `.env` 文件到 Git**：
   - 确保 `.env` 在 `.gitignore` 中
   - 使用 `.env.example` 作为模板

2. **使用环境变量管理**：
   - 生产环境使用环境变量管理服务（如 AWS Secrets Manager）
   - 不要在代码中硬编码 API Key

3. **定期轮换 API Key**：
   - 定期更新 API Key
   - 如果 API Key 泄露，立即在 OpenRouter Dashboard 中撤销

## 相关文档

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [OpenRouter 模型列表](https://openrouter.ai/models)
- [API Gateway README](../apps/api-gateway/README.md)

