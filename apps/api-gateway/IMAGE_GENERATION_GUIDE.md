# 图片生成功能集成指南

## 📋 概述

本项目已集成多个图片生成提供商，支持以下服务：

1. **Stability AI** (Stable Diffusion)
2. **OpenAI** (DALL-E 3)
3. **Replicate** (多种模型)
4. **OpenRouter** (提示词优化)

---

## 🔧 配置步骤

### 第 1 步：选择提供商

根据你的需求和预算，选择一个或多个提供商：

| 提供商 | 模型 | 价格 | 特点 |
|--------|------|------|------|
| Stability AI | Stable Diffusion XL | $0.002-0.02/张 | 高质量、可定制 |
| OpenAI | DALL-E 3 | $0.04-0.12/张 | 简单易用、创意性强 |
| Replicate | 多种模型 | $0.002-0.05/张 | 灵活、模型丰富 |

### 第 2 步：获取 API 密钥

#### Stability AI
1. 访问 [Stability AI Platform](https://platform.stability.ai/)
2. 注册账号
3. 在 API Keys 页面创建密钥
4. 复制 API Key

#### OpenAI
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号
3. 在 API Keys 页面创建密钥
4. 复制 API Key

#### Replicate
1. 访问 [Replicate](https://replicate.com/)
2. 注册账号
3. 在 API Tokens 页面创建密钥
4. 复制 API Token

### 第 3 步：配置环境变量

编辑 `apps/api-gateway/.env` 文件：

```bash
# Stability AI
STABILITY_API_KEY=your_stability_api_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Replicate
REPLICATE_API_KEY=your_replicate_api_key_here
```

**注意**：
- 只需要配置你使用的提供商的密钥
- 系统会自动选择第一个可用的提供商
- 优先级：Stability AI > OpenAI > Replicate > OpenRouter

### 第 4 步：测试功能

运行测试脚本：

```bash
cd apps/api-gateway
python test_image_generation.py
```

---

## 🎯 使用方法

### API 调用

#### 基本用法

```python
from core.ai.openrouter_service import get_openrouter_service

# 获取服务实例
service = get_openrouter_service()

# 生成图片
result = await service.generate_image(
    prompt="一个美丽的日落海滩场景",
    options={
        "width": 1024,
        "height": 1024
    }
)

# 返回结果
{
    "success": True,
    "provider": "stability_ai",
    "image_url": "data:image/png;base64,...",
    "prompt": "优化后的提示词...",
    "metadata": {
        "cfg_scale": 7,
        "steps": 30,
        "size": "1024x1024"
    }
}
```

#### 指定提供商

```python
result = await service.generate_image(
    prompt="一个美丽的日落海滩场景",
    options={
        "provider": "openai",  # 指定使用 OpenAI
        "model": "dall-e-3",
        "size": "1024x1024",
        "quality": "hd"
    }
)
```

### 前端调用

```typescript
// 调用 AI 生成 API
const response = await fetch(`${API_GATEWAY_URL}/api/v1/ai/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: 'image_generation',
    prompt: '一个美丽的日落海滩场景',
    options: {
      width: 1024,
      height: 1024
    }
  }),
});

const data = await response.json();

if (data.success) {
  console.log('图片 URL:', data.data.image_url);
}
```

---

## 📊 提供商详细配置

### Stability AI

**支持的选项**:
```python
{
    "cfg_scale": 7,        # CFG Scale (1-35)
    "height": 1024,        # 图片高度 (512-1024)
    "width": 1024,         # 图片宽度 (512-1024)
    "samples": 1,          # 生成数量 (1-10)
    "steps": 30,           # 步数 (10-150)
}
```

**特点**:
- 高质量 Stable Diffusion 模型
- 支持高度自定义
- 价格相对较低
- 适合需要精确控制的场景

### OpenAI DALL-E

**支持的选项**:
```python
{
    "model": "dall-e-3",        # 模型版本
    "size": "1024x1024",        # 图片尺寸
    "quality": "standard",      # 质量 (standard/hd)
    "n": 1                     # 生成数量
}
```

**特点**:
- 简单易用
- 创意性强
- 自动优化提示词
- 适合快速生成创意图片

### Replicate

**支持的选项**:
```python
{
    "num_outputs": 1,       # 生成数量
    "width": 1024,          # 图片宽度
    "height": 1024,         # 图片高度
}
```

**特点**:
- 支持多种模型
- 灵活性高
- 价格透明
- 适合实验和探索

---

## 🚨 错误处理

### 常见错误

#### 1. API 密钥未配置
```
ValueError: Stability AI API 密钥未配置
```
**解决方案**: 在 `.env` 文件中配置对应的 API 密钥

#### 2. API 配额不足
```
Exception: OpenAI API 错误: 429 - Rate limit exceeded
```
**解决方案**: 
- 检查 API 配额
- 等待配额重置
- 升级 API 套餐

#### 3. 网络连接问题
```
Exception: Failed to connect to api.stability.ai
```
**解决方案**:
- 检查网络连接
- 使用代理或 VPN
- 更换网络环境

#### 4. 地区限制
```
Exception: This model is not available in your region
```
**解决方案**:
- 使用 VPN 切换地区
- 更换其他提供商
- 使用代理服务

---

## 💡 最佳实践

### 1. 提示词优化

**好的提示词**:
```
一个美丽的日落海滩场景，金色阳光洒在平静的海面上，
远处有几只海鸥飞翔，沙滩上有几块礁石，
整体色调温暖柔和，高清摄影风格
```

**不好的提示词**:
```
海滩
```

### 2. 参数选择

**高质量生成**:
```python
{
    "cfg_scale": 12,
    "steps": 50,
    "width": 1024,
    "height": 1024
}
```

**快速生成**:
```python
{
    "cfg_scale": 7,
    "steps": 20,
    "width": 512,
    "height": 512
}
```

### 3. 成本控制

- 使用较小的图片尺寸（512x512）
- 减少生成步数（20-30）
- 使用 Stability AI（价格最低）
- 批量生成时使用 `samples` 参数

### 4. 错误重试

```python
import asyncio

async def generate_with_retry(prompt, max_retries=3):
    for i in range(max_retries):
        try:
            result = await service.generate_image(prompt)
            return result
        except Exception as e:
            if i == max_retries - 1:
                raise
            await asyncio.sleep(2 ** i)  # 指数退避
```

---

## 📈 性能优化

### 1. 缓存优化

```python
# 使用 Redis 缓存生成结果
import redis

redis_client = redis.Redis()

async def generate_with_cache(prompt):
    cache_key = f"image:{hash(prompt)}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    result = await service.generate_image(prompt)
    redis_client.setex(cache_key, 3600, json.dumps(result))
    
    return result
```

### 2. 并发生成

```python
import asyncio

async def generate_batch(prompts):
    tasks = [service.generate_image(prompt) for prompt in prompts]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### 3. 队列处理

```python
# 使用 Celery 异步处理
from celery import Celery

celery_app = Celery('image_generation')

@celery_app.task
def generate_image_task(prompt):
    return asyncio.run(service.generate_image(prompt))
```

---

## 🔒 安全注意事项

### 1. API 密钥保护

- ✅ 不要将 API 密钥提交到 Git
- ✅ 使用环境变量存储密钥
- ✅ 定期轮换 API 密钥
- ✅ 限制 API 密钥的使用范围

### 2. 内容审核

```python
# 检查提示词是否包含敏感内容
def is_safe_prompt(prompt):
    sensitive_words = ["暴力", "色情", "仇恨"]
    return not any(word in prompt for word in sensitive_words)

if not is_safe_prompt(prompt):
    raise ValueError("提示词包含敏感内容")
```

### 3. 使用限制

```python
# 限制用户生成次数
async def check_user_limit(user_id):
    count = await get_user_generation_count(user_id)
    if count > 100:  # 每天最多 100 次
        raise Exception("超过每日生成限制")
```

---

## 📝 总结

图片生成功能已完全集成，支持多个提供商，具有以下特点：

✅ **多提供商支持** - Stability AI、OpenAI、Replicate
✅ **自动选择** - 根据配置自动选择最佳提供商
✅ **提示词优化** - 使用 AI 优化提示词质量
✅ **灵活配置** - 支持各种自定义选项
✅ **错误处理** - 完善的错误处理和重试机制
✅ **成本控制** - 支持多种成本优化策略

---

**配置完成后，运行测试脚本验证功能！** 🎉
