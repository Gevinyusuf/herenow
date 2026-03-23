"""
测试更新后的图片生成模型配置
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.ai.openrouter_service import get_openrouter_service


async def test_image_generation():
    """测试图片生成功能"""
    print("\n" + "="*60)
    print("🖼️  测试图片生成功能 (image_generation)")
    print("="*60)
    
    openrouter_service = get_openrouter_service()
    
    prompt = "科技聚会活动海报，现代简约风格，蓝色和橙色配色"
    
    try:
        result = await openrouter_service.generate_image(
            prompt=prompt
        )
        print(f"✅ 图片生成成功！")
        print(f"输入: {prompt}")
        print(f"\n输出:\n{result}")
        return True
    except Exception as e:
        print(f"❌ 图片生成失败: {str(e)}")
        return False


async def main():
    """主测试函数"""
    print("\n" + "🚀"*30)
    print("测试更新后的图片生成模型配置")
    print("🚀"*30)
    
    success = await test_image_generation()
    
    print("\n" + "="*60)
    print("📊 测试结果")
    print("="*60)
    
    if success:
        print("✅ 图片生成模型配置成功！")
    else:
        print("❌ 图片生成模型配置失败")


if __name__ == "__main__":
    asyncio.run(main())
