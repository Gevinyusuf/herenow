"""
测试 OpenRouter 上可用的图片生成模型
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


async def test_gemini_image_model():
    """测试 Gemini 图片生成模型"""
    print("\n" + "="*60)
    print("🖼️  测试 Gemini 2.5 Flash Image Preview 模型")
    print("="*60)

    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY 未配置")
        return False

    # 尝试不同的模型名称
    models_to_test = [
        "google/gemini-2.5-flash-image-preview",
        "google/gemini-2.5-flash-image-preview:free",
        "google/gemini-2.0-flash-exp",
        "google/gemini-2.0-flash-exp:free",
    ]

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
                                "content": "请为一张科技聚会活动海报生成详细的提示词，现代简约风格，蓝色和橙色配色。"
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
                    print(f"输出: {content[:200]}...")
                    return True
                else:
                    error = response.json()
                    print(f"❌ 模型 {model} 不可用")
                    print(f"错误: {error.get('error', {}).get('message', response.text)}")

        except Exception as e:
            print(f"❌ 测试模型 {model} 时出错: {str(e)}")

    return False


async def list_available_models():
    """列出 OpenRouter 上可用的模型"""
    print("\n" + "="*60)
    print("📋 获取 OpenRouter 上可用的模型列表")
    print("="*60)

    if not OPENROUTER_API_KEY:
        print("❌ OPENROUTER_API_KEY 未配置")
        return

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                }
            )

            if response.status_code == 200:
                result = response.json()
                models = result.get("data", [])

                # 筛选图片生成相关的模型
                image_models = [m for m in models if "image" in m.get("id", "").lower()]

                print(f"\n找到 {len(image_models)} 个图片相关模型：\n")
                for model in image_models[:10]:  # 只显示前10个
                    print(f"  - {model['id']}")
                    print(f"    名称: {model.get('name', 'N/A')}")
                    print(f"    描述: {model.get('description', 'N/A')[:100]}...")
                    print()

                if len(image_models) == 0:
                    print("⚠️  未找到图片生成相关的模型")
                    print("\n以下是所有可用的模型（前20个）：")
                    for model in models[:20]:
                        print(f"  - {model['id']}")

            else:
                print(f"❌ 获取模型列表失败: {response.text}")

    except Exception as e:
        print(f"❌ 获取模型列表时出错: {str(e)}")


async def main():
    """主测试函数"""
    print("\n" + "🚀"*30)
    print("开始测试 OpenRouter 图片生成模型")
    print("🚀"*30)

    # 先列出可用模型
    await list_available_models()

    # 测试 Gemini 模型
    success = await test_gemini_image_model()

    print("\n" + "="*60)
    print("📊 测试结果")
    print("="*60)

    if success:
        print("✅ 找到可用的图片生成模型")
    else:
        print("❌ 未找到可用的图片生成模型")
        print("\n💡 建议：")
        print("1. 使用其他可用的图片生成模型")
        print("2. 集成其他图片生成服务（如 Stability AI、DALL-E 等）")
        print("3. 暂时使用文本生成模型优化提示词")


if __name__ == "__main__":
    asyncio.run(main())
