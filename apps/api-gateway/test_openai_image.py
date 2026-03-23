"""
测试 OpenAI 图片生成模型
"""
import asyncio
import sys
import os
import httpx
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")


async def test_openai_image_models():
    """测试 OpenAI 图片生成模型"""
    print("\n" + "="*60)
    print("🖼️  测试 OpenAI 图片生成模型")
    print("="*60)

    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY 未配置")
        return False

    # 尝试不同的 OpenAI 图片模型
    models_to_test = [
        "openai/gpt-5-image-mini",
        "openai/gpt-5-image",
    ]

    prompt = "请为一张科技聚会活动海报生成详细的提示词，现代简约风格，蓝色和橙色配色。"

    for model in models_to_test:
        print(f"\n📝 测试模型: {model}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://herenow.com",
                        "X-Title": "HereNow Event Platform",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        "temperature": 0.8,
                        "max_tokens": 1000,
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    print(f"✅ 模型 {model} 可用！")
                    print(f"输出: {content[:300]}...")
                    return model
                else:
                    error = response.json()
                    print(f"❌ 模型 {model} 不可用")
                    print(f"错误: {error.get('error', {}).get('message', response.text)}")

        except Exception as e:
            print(f"❌ 测试模型 {model} 时出错: {str(e)}")

    return None


async def main():
    """主测试函数"""
    print("\n" + "🚀"*30)
    print("测试 OpenAI 图片生成模型")
    print("🚀"*30)

    available_model = await test_openai_image_models()

    print("\n" + "="*60)
    print("📊 测试结果")
    print("="*60)

    if available_model:
        print(f"✅ 找到可用的图片生成模型: {available_model}")
        print("\n💡 建议：将 image_generation 模型配置更新为:", available_model)
    else:
        print("❌ 所有图片生成模型都不可用")
        print("\n💡 替代方案：")
        print("1. 暂时使用文本生成模型优化提示词（当前实现）")
        print("2. 集成其他图片生成服务（如 Stability AI、DALL-E 等）")
        print("3. 使用代理或 VPN 访问受限的模型")


if __name__ == "__main__":
    asyncio.run(main())
