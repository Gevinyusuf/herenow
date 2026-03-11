"""
测试图片生成功能
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from core.ai.image_generation_service import get_image_generation_service, ImageProvider
from core.ai.openrouter_service import get_openrouter_service
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_image_generation():
    """测试图片生成功能"""
    try:
        logger.info("🎨 开始测试图片生成功能...")
        
        # 1. 测试图片生成服务
        logger.info("\n1. 测试图片生成服务...")
        image_service = get_image_generation_service()
        
        # 获取可用的提供商
        available_providers = image_service.get_available_providers()
        logger.info(f"✅ 可用的提供商: {[p.value for p in available_providers]}")
        
        if not available_providers:
            logger.warning("⚠️ 没有可用的图片生成提供商")
            logger.info("请在 .env 文件中配置以下 API 密钥之一：")
            logger.info("  - STABILITY_API_KEY (Stability AI)")
            logger.info("  - OPENAI_API_KEY (OpenAI DALL-E)")
            logger.info("  - REPLICATE_API_KEY (Replicate)")
            return False
        
        # 2. 测试 OpenRouter 提示词优化
        logger.info("\n2. 测试 OpenRouter 提示词优化...")
        openrouter_service = get_openrouter_service()
        
        test_prompt = "一个美丽的日落海滩场景"
        logger.info(f"   原始提示词: {test_prompt}")
        
        optimized_prompt = await openrouter_service.generate_text(
            prompt=test_prompt,
            ai_type="image_generation"
        )
        
        logger.info(f"✅ 优化后的提示词: {optimized_prompt[:100]}...")
        
        # 3. 测试图片生成（使用默认提供商）
        logger.info("\n3. 测试图片生成...")
        
        try:
            result = await image_service.generate_image(
                prompt=test_prompt,
                options={
                    "width": 512,
                    "height": 512
                }
            )
            
            if result.get("success"):
                logger.info(f"✅ 图片生成成功!")
                logger.info(f"   提供商: {result.get('provider')}")
                
                if result.get("image_url"):
                    logger.info(f"   图片 URL: {result.get('image_url')[:100]}...")
                else:
                    logger.info(f"   消息: {result.get('message')}")
                
                logger.info(f"   元数据: {result.get('metadata')}")
            else:
                logger.warning(f"⚠️ 图片生成失败: {result}")
                
        except Exception as e:
            logger.error(f"❌ 图片生成失败: {str(e)}")
            logger.info("这可能是由于：")
            logger.info("  1. API 密钥未配置或无效")
            logger.info("  2. API 配额不足")
            logger.info("  3. 网络连接问题")
            logger.info("  4. 地区限制")
        
        # 4. 测试 OpenRouter 服务集成
        logger.info("\n4. 测试 OpenRouter 服务集成...")
        
        try:
            result = await openrouter_service.generate_image(
                prompt=test_prompt,
                options={
                    "width": 512,
                    "height": 512
                }
            )
            
            if result.get("success"):
                logger.info(f"✅ OpenRouter 集成测试成功!")
                logger.info(f"   提供商: {result.get('provider')}")
                
                if result.get("image_url"):
                    logger.info(f"   图片 URL: {result.get('image_url')[:100]}...")
                else:
                    logger.info(f"   消息: {result.get('message')}")
            else:
                logger.warning(f"⚠️ OpenRouter 集成测试失败: {result}")
                
        except Exception as e:
            logger.error(f"❌ OpenRouter 集成测试失败: {str(e)}")
        
        logger.info("\n✅ 图片生成功能测试完成!")
        return True
        
    except Exception as e:
        logger.error(f"❌ 测试失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_image_generation())
    sys.exit(0 if success else 1)
