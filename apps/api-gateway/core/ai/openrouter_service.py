"""
OpenRouter AI 服务
封装 OpenRouter API 调用逻辑
"""
import os
import httpx
from typing import Dict, Optional, Any, List
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

# OpenRouter API 配置
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# 不同 AI 功能类型对应的模型配置
MODEL_CONFIG = {
    "text_generation": {
        "model": "meta-llama/llama-3.3-70b-instruct",
        "temperature": 0.7,
        "max_tokens": 2000,
    },
    "image_generation": {
        "model": "meta-llama/llama-3.3-70b-instruct",
        "temperature": 0.8,
        "max_tokens": 1000,
    },
    "chat": {
        "model": "anthropic/claude-3.5-sonnet",
        "temperature": 0.7,
        "max_tokens": 2000,
    },
    "planning": {
        "model": "openai/gpt-4o-mini",
        "temperature": 0.8,
        "max_tokens": 3000,
    },
    "import": {
        "model": "anthropic/claude-haiku-4.5",
        "temperature": 0.5,
        "max_tokens": 2000,
    },
}


class OpenRouterService:
    """OpenRouter AI 服务类"""
    
    def __init__(self):
        if not OPENROUTER_API_KEY:
            logger.warning("OPENROUTER_API_KEY not set, AI features will not work")
        self.api_key = OPENROUTER_API_KEY
        self.api_url = OPENROUTER_API_URL
    
    async def generate_text(
        self,
        prompt: str,
        ai_type: str,
        context: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        生成文本内容

        Args:
            prompt: 用户输入的提示词
            ai_type: AI 功能类型
            context: 上下文信息（如事件数据）
            options: 额外选项（如 temperature, max_tokens 等）
            conversation_history: 对话历史（用于 chat 类型）

        Returns:
            str: 生成的文本内容

        Raises:
            Exception: 如果 API 调用失败
        """
        # 临时跳过 OpenRouter API（用于测试）
        if os.getenv("SKIP_OPENROUTER_API", "false").lower() == "true":
            logger.info("⚠️ 跳过 OpenRouter API，使用模拟响应")
            return self._get_mock_response(ai_type, prompt, context)

        if not self.api_key:
            raise Exception("OpenRouter API key not configured")
        
        # 获取模型配置
        model_config = MODEL_CONFIG.get(ai_type, MODEL_CONFIG["text_generation"])
        
        # 构建系统提示词
        system_prompt = self._build_system_prompt(ai_type, context)
        
        # 构建消息列表
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # 添加对话历史（如果有）
        if conversation_history:
            messages.extend(conversation_history)
        
        # 添加用户提示词
        messages.append({"role": "user", "content": prompt})
        
        # 合并选项
        request_options = {
            "model": options.get("model") if options else model_config["model"],
            "messages": messages,
            "temperature": options.get("temperature", model_config["temperature"]) if options else model_config["temperature"],
            "max_tokens": options.get("max_tokens", model_config["max_tokens"]) if options else model_config["max_tokens"],
        }
        
        # 移除 None 值
        request_options = {k: v for k, v in request_options.items() if v is not None}
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", ""),  # 可选：用于 OpenRouter 统计
                        "X-Title": "HereNow AI",  # 可选：应用名称
                    },
                    json=request_options,
                )
                
                response.raise_for_status()
                data = response.json()
                
                # 提取生成的文本
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0]["message"]["content"]
                    return content
                else:
                    raise Exception("No content in API response")
                    
        except httpx.HTTPStatusError as e:
            error_msg = f"OpenRouter API error: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Failed to call OpenRouter API: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    async def analyze_image(
        self,
        image_data_url: str,
        prompt: str,
        ai_type: str = "import"
    ) -> str:
        """
        分析图片内容（使用视觉模型）
        
        Args:
            image_data_url: 图片的 data URL（base64 编码）
            prompt: 分析提示词
            ai_type: AI 功能类型
            
        Returns:
            str: 从图片中提取的文本信息
            
        Raises:
            Exception: 如果 API 调用失败
        """
        if not self.api_key:
            raise Exception("OpenRouter API key not configured")
        
        # 获取模型配置
        model_config = MODEL_CONFIG.get(ai_type, MODEL_CONFIG["import"])
        
        # 构建消息（包含图片）
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url
                        }
                    }
                ]
            }
        ]
        
        # 构建请求体
        request_data = {
            "model": model_config["model"],
            "messages": messages,
            "temperature": model_config.get("temperature", 0.7),
            "max_tokens": model_config.get("max_tokens", 2000),
        }
        
        # 发送请求
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", ""),
                        "X-Title": os.getenv("OPENROUTER_X_TITLE", "HereNow Event Platform"),
                        "Content-Type": "application/json"
                    },
                    json=request_data
                )
                
                response.raise_for_status()
                data = response.json()
                
                # 提取生成的文本
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0]["message"]["content"]
                    return content
                else:
                    raise Exception("No content in API response")
                    
        except httpx.HTTPStatusError as e:
            error_msg = f"OpenRouter API error: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Failed to call OpenRouter API: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    def _build_system_prompt(self, ai_type: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        根据 AI 类型和上下文构建系统提示词
        
        Args:
            ai_type: AI 功能类型
            context: 上下文信息
            
        Returns:
            str: 系统提示词
        """
        base_prompts = {
            "text_generation": """你是一个专业的事件描述写作助手。请根据用户的要求，生成或编辑活动描述。
要求：
1. 使用 HTML 格式，但保持简洁
2. 只使用基本的 HTML 标签（如 <p>, <h1>, <h2>, <h3>, <strong>, <em>, <ul>, <li> 等）
3. 不要使用复杂的样式或 CSS
4. 内容要吸引人、专业且准确
5. 如果用户提供了上下文信息（如活动名称、日期等），请合理使用这些信息""",
            
            "image_generation": """你是一个专业的图片生成提示词优化助手。请将用户的描述转换为高质量的图片生成提示词。
要求：
1. 提示词要详细、具体
2. 包含风格、色彩、构图等元素
3. 适合活动封面图片的风格
4. 返回优化后的提示词，而不是图片""",
            
            "chat": """You are a friendly and helpful event creation assistant. Your goal is to help users create and optimize their events in a warm, conversational way.

Your personality:
- Friendly, approachable, and enthusiastic
- Use natural, conversational language (not robotic or formal)
- Show genuine interest in helping users
- Be encouraging and supportive
- Use emojis occasionally when appropriate (but don't overdo it)

What you can do:
1. Answer questions about event creation
2. Provide event planning suggestions
3. Help optimize event descriptions and content
4. Suggest event themes and styles
5. Offer creative ideas and inspiration

Always respond in a warm, friendly tone. Make users feel like they're chatting with a helpful friend, not a formal assistant. Keep responses concise but engaging.""",
            
            "planning": """你是一个专业的活动策划专家。请根据用户提供的信息，生成详细的活动规划建议。
要求：
1. 分析活动类型、目标受众和期望氛围
2. 提供具体的活动流程建议
3. 建议亮点环节和互动方式
4. 提供实用的执行建议
5. 格式清晰，易于理解""",
            
            "import": """你是一个专业的信息提取助手。请从用户提供的内容（URL、文本或图片描述）中提取活动相关信息。
要求：
1. 提取活动名称、日期、时间、地点等关键信息
2. 提取活动描述
3. 识别活动类型和主题
4. 以结构化的方式返回信息
5. 如果信息不完整，请明确指出""",
        }
        
        system_prompt = base_prompts.get(ai_type, base_prompts["text_generation"])
        
        # 添加上下文信息
        if context:
            context_str = "\n\n当前上下文信息：\n"
            if context.get("eventName"):
                context_str += f"- 活动名称: {context['eventName']}\n"
            if context.get("description"):
                context_str += f"- 当前描述: {context['description']}\n"
            if context.get("startDate"):
                context_str += f"- 开始日期: {context['startDate']}\n"
            if context.get("location"):
                context_str += f"- 地点: {context['location']}\n"
            system_prompt += context_str
        
        return system_prompt

    def _get_mock_response(self, ai_type: str, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        获取模拟响应（用于测试）

        Args:
            ai_type: AI 功能类型
            prompt: 用户输入的提示词
            context: 上下文信息

        Returns:
            str: 模拟的响应内容
        """
        mock_responses = {
            "text_generation": """<h2>活动描述</h2>
<p>欢迎参加这场精彩的活动！我们为您准备了一个难忘的体验。</p>
<h3>活动亮点</h3>
<ul>
<li>🎯 与行业专家面对面交流</li>
<li>💡 探索创新思维和最佳实践</li>
<li>🤝 建立有价值的专业人脉</li>
</ul>
<p>期待您的参与！</p>""",

            "chat": """Hi there! 👋 Great to have you here!

I can help you with:
• Creating compelling event descriptions
• Planning engaging activities
• Suggesting themes and formats
• Tips to boost attendance

What would you like help with today?""",

            "planning": """# 活动策划建议

## 🎯 活动概念与亮点

根据您的活动类型和目标受众，我建议：

**核心亮点**：设计一个让参与者印象深刻的"签名时刻"

**差异化元素**：
- 独特的破冰环节设计
- 有意义的话题讨论
- 自由交流的优质环境

---

## 📋 推荐活动流程

### 开场 (15分钟)
- 热场游戏或互动问答
- 活动介绍与目标说明

### 主体 (60分钟)
- 核心内容/分享环节
- 分组讨论或工作坊
- 互动游戏或练习

### 收尾 (15分钟)
- 总结要点
- Q&A 环节
- 自由交流 + 合影

---

## 💬 互动策略

1. **座位安排**：采用圆桌或岛屿式布局，促进交流
2. **话题引导**：准备 3-5 个通用话题，避免冷场
3. **激励机制**：设置小奖品或证书，提高参与度

---

## ✅ 执行建议

- 提前测试所有设备
- 准备备用方案（雨天/线上）
- 安排专人负责拍照记录
- 准备茶点，增强体验感

希望这些建议对您的活动有帮助！🎉""",

            "import": """根据提供的信息，我已提取到以下活动内容：

**活动名称**：[待提取]
**日期时间**：[待提取]
**地点**：[待提取]
**活动描述**：[待提取]

请提供更多详细信息或使用有效的活动链接。""",
        }

        return mock_responses.get(ai_type, mock_responses["chat"])

    async def generate_image(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        生成图片（通过文本生成模型优化提示词，然后调用图片生成 API）

        Args:
            prompt: 图片描述
            options: 额外选项，可以包含：
                - provider: 指定提供商 (stability_ai, openai, replicate)
                - 其他提供商特定的选项

        Returns:
            Dict[str, Any]: 包含图片 URL 和其他信息的字典
        """
        from core.ai.image_generation_service import get_image_generation_service, ImageProvider

        # 优化提示词（如果 OpenRouter API 可用）
        optimized_prompt = prompt
        if os.getenv("SKIP_PROMPT_OPTIMIZATION", "false").lower() != "true" and self.api_key:
            try:
                optimized_prompt = await self.generate_text(
                    prompt=prompt,
                    ai_type="image_generation",
                    options=options
                )
            except Exception as e:
                logger.warning(f"提示词优化失败，使用原始提示词: {str(e)}")
                optimized_prompt = prompt
        else:
            logger.info("跳过提示词优化，使用原始提示词")

        # 获取图片生成服务
        image_service = get_image_generation_service()
        
        # 获取提供商配置
        provider = None
        if options and "provider" in options:
            provider_str = options["provider"]
            try:
                provider = ImageProvider(provider_str)
            except ValueError:
                logger.warning(f"⚠️ 无效的提供商: {provider_str}，使用默认提供商")
        
        # 调用图片生成服务
        result = await image_service.generate_image(
            prompt=optimized_prompt,
            provider=provider,
            options=options
        )
        
        return result


# 创建全局服务实例
_openrouter_service: Optional[OpenRouterService] = None


def get_openrouter_service() -> OpenRouterService:
    """获取 OpenRouter 服务实例（单例模式）"""
    global _openrouter_service
    if _openrouter_service is None:
        _openrouter_service = OpenRouterService()
    return _openrouter_service

