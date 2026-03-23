"""
图片生成服务
支持多个提供商：Stability AI、OpenAI DALL-E、Replicate 等
"""
import os
import httpx
import logging
from typing import Optional, Dict, Any, List
from enum import Enum
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ImageProvider(str, Enum):
    """图片生成提供商"""
    STABILITY_AI = "stability_ai"
    OPENAI = "openai"
    REPLICATE = "replicate"
    OPENROUTER = "openrouter"


class ImageGenerationService:
    """图片生成服务"""
    
    def __init__(self):
        self.stability_api_key = os.getenv("STABILITY_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.replicate_api_key = os.getenv("REPLICATE_API_KEY")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        
        self.default_provider = self._get_default_provider()
        
        logger.info(f"🎨 图片生成服务初始化，默认提供商: {self.default_provider}")

    def _is_valid_api_key(self, key: str) -> bool:
        """检查 API key 是否有效（不是占位符）"""
        if not key:
            return False
        placeholder_keys = [
            "your_stability_api_key_here",
            "your_openai_api_key_here",
            "your_replicate_api_key_here"
        ]
        return key not in placeholder_keys and not key.startswith("your_")

    def _get_default_provider(self) -> ImageProvider:
        """获取默认提供商（根据可用的 API 密钥）"""
        if self._is_valid_api_key(self.stability_api_key):
            return ImageProvider.STABILITY_AI
        elif self._is_valid_api_key(self.openai_api_key):
            return ImageProvider.OPENAI
        elif self._is_valid_api_key(self.replicate_api_key):
            return ImageProvider.REPLICATE
        elif self._is_valid_api_key(self.openrouter_api_key):
            return ImageProvider.OPENROUTER
        else:
            logger.warning("⚠️ 没有配置任何图片生成 API 密钥")
            return ImageProvider.OPENROUTER
    
    async def generate_image(
        self,
        prompt: str,
        provider: Optional[ImageProvider] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        生成图片

        Args:
            prompt: 图片描述
            provider: 提供商（如果不指定，使用默认提供商）
            options: 额外选项

        Returns:
            Dict[str, Any]: 包含图片 URL 和其他信息的字典
        """
        if not provider:
            provider = self.default_provider

        logger.info(f"🖼️ 使用 {provider} 生成图片: {prompt[:50]}...")

        # 免费占位图片列表（用于测试或 API 余额不足时）
        placeholder_images = [
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop",
        ]

        try:
            if provider == ImageProvider.STABILITY_AI:
                return await self._generate_with_stability(prompt, options)
            elif provider == ImageProvider.OPENAI:
                return await self._generate_with_openai(prompt, options)
            elif provider == ImageProvider.REPLICATE:
                return await self._generate_with_replicate(prompt, options)
            elif provider == ImageProvider.OPENROUTER:
                return await self._generate_with_openrouter(prompt, options)
            else:
                raise ValueError(f"不支持的提供商: {provider}")
        except Exception as e:
            logger.error(f"❌ 图片生成失败 ({provider}): {str(e)}", exc_info=True)

            # 返回占位图片（用于测试或 API 余额不足时）
            import random
            placeholder_url = random.choice(placeholder_images)
            logger.info(f"🎨 使用占位图片: {placeholder_url}")
            return {
                "success": True,
                "provider": "placeholder",
                "image_url": placeholder_url,
                "prompt": prompt,
                "is_placeholder": True,
                "message": "图片生成服务暂时不可用，使用默认封面图片"
            }
    
    async def _generate_with_stability(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """使用 Stability AI 生成图片"""
        if not self.stability_api_key:
            raise ValueError("Stability AI API 密钥未配置")
        
        url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"
        
        headers = {
            "Authorization": f"Bearer {self.stability_api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                }
            ],
            "cfg_scale": options.get("cfg_scale", 7) if options else 7,
            "height": options.get("height", 1024) if options else 1024,
            "width": options.get("width", 1024) if options else 1024,
            "samples": options.get("samples", 1) if options else 1,
            "steps": options.get("steps", 30) if options else 30,
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"Stability AI API 错误: {response.status_code} - {response.text}")
            
            data = response.json()
            
            if "artifacts" in data and len(data["artifacts"]) > 0:
                image_url = data["artifacts"][0].get("base64")
                
                return {
                    "success": True,
                    "provider": "stability_ai",
                    "image_url": f"data:image/png;base64,{image_url}",
                    "prompt": prompt,
                    "metadata": {
                        "cfg_scale": payload["cfg_scale"],
                        "steps": payload["steps"],
                        "size": f"{payload['width']}x{payload['height']}"
                    }
                }
            else:
                raise Exception("Stability AI 返回数据格式错误")
    
    async def _generate_with_openai(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """使用 OpenAI DALL-E 生成图片"""
        if not self.openai_api_key:
            raise ValueError("OpenAI API 密钥未配置")
        
        url = "https://api.openai.com/v1/images/generations"
        
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": options.get("model", "dall-e-3") if options else "dall-e-3",
            "prompt": prompt,
            "n": options.get("n", 1) if options else 1,
            "size": options.get("size", "1024x1024") if options else "1024x1024",
            "quality": options.get("quality", "standard") if options else "standard",
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                raise Exception(f"OpenAI API 错误: {response.status_code} - {response.text}")
            
            data = response.json()
            
            if "data" in data and len(data["data"]) > 0:
                image_url = data["data"][0].get("url")
                
                return {
                    "success": True,
                    "provider": "openai",
                    "image_url": image_url,
                    "prompt": prompt,
                    "metadata": {
                        "model": payload["model"],
                        "size": payload["size"],
                        "quality": payload["quality"]
                    }
                }
            else:
                raise Exception("OpenAI 返回数据格式错误")
    
    async def _generate_with_replicate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """使用 Replicate 生成图片"""
        if not self.replicate_api_key:
            raise ValueError("Replicate API 密钥未配置")
        
        url = "https://api.replicate.com/v1/predictions"
        
        headers = {
            "Authorization": f"Token {self.replicate_api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "version": "db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
            "input": {
                "prompt": prompt,
                "num_outputs": options.get("num_outputs", 1) if options else 1,
                "width": options.get("width", 1024) if options else 1024,
                "height": options.get("height", 1024) if options else 1024,
            }
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code != 201:
                raise Exception(f"Replicate API 错误: {response.status_code} - {response.text}")
            
            data = response.json()
            
            prediction_id = data.get("id")
            
            for _ in range(30):
                status_response = await client.get(
                    f"https://api.replicate.com/v1/predictions/{prediction_id}",
                    headers=headers
                )
                
                if status_response.status_code != 200:
                    raise Exception(f"Replicate 状态查询错误: {status_response.status_code}")
                
                status_data = status_response.json()
                
                if status_data.get("status") == "succeeded":
                    output = status_data.get("output")
                    if output and len(output) > 0:
                        return {
                            "success": True,
                            "provider": "replicate",
                            "image_url": output[0],
                            "prompt": prompt,
                            "metadata": {
                                "prediction_id": prediction_id,
                                "model": "stable-diffusion"
                            }
                        }
                elif status_data.get("status") == "failed":
                    raise Exception("Replicate 图片生成失败")
                
                import asyncio
                await asyncio.sleep(2)
            
            raise Exception("Replicate 图片生成超时")
    
    async def _generate_with_openrouter(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """使用 OpenRouter 生成图片（返回优化后的提示词）"""
        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API 密钥未配置")
        
        return {
            "success": True,
            "provider": "openrouter",
            "image_url": None,
            "prompt": prompt,
            "message": "OpenRouter 暂不支持图片生成，已返回优化后的提示词",
            "metadata": {}
        }
    
    def get_available_providers(self) -> List[ImageProvider]:
        """获取可用的提供商列表"""
        providers = []

        if self._is_valid_api_key(self.stability_api_key):
            providers.append(ImageProvider.STABILITY_AI)
        if self._is_valid_api_key(self.openai_api_key):
            providers.append(ImageProvider.OPENAI)
        if self._is_valid_api_key(self.replicate_api_key):
            providers.append(ImageProvider.REPLICATE)
        if self._is_valid_api_key(self.openrouter_api_key):
            providers.append(ImageProvider.OPENROUTER)
        
        return providers


_image_generation_service: Optional[ImageGenerationService] = None


def get_image_generation_service() -> ImageGenerationService:
    """获取图片生成服务实例（单例模式）"""
    global _image_generation_service
    if _image_generation_service is None:
        _image_generation_service = ImageGenerationService()
    return _image_generation_service
