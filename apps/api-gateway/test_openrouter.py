"""
OpenRouter AI 功能测试脚本
直接调用 OpenRouter 服务，绕过认证和配额验证
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.ai.openrouter_service import get_openrouter_service


async def test_text_generation():
    """测试文本生成功能"""
    print("\n" + "="*60)
    print("📝 测试文本生成功能 (text_generation)")
    print("="*60)
    
    openrouter_service = get_openrouter_service()
    
    prompt = "请为一场科技主题的聚会活动写一段简短的活动描述，大约100字。"
    
    try:
        result = await openrouter_service.generate_text(
            prompt=prompt,
            ai_type="text_generation"
        )
        print(f"✅ 文本生成成功！")
        print(f"输入: {prompt}")
        print(f"输出: {result}")
        return True
    except Exception as e:
        print(f"❌ 文本生成失败: {str(e)}")
        return False


async def test_chat():
    """测试对话功能"""
    print("\n" + "="*60)
    print("💬 测试对话功能 (chat)")
    print("="*60)
    
    openrouter_service = get_openrouter_service()
    
    prompt = "你好！请用一句话介绍一下你自己。"
    
    try:
        result = await openrouter_service.generate_text(
            prompt=prompt,
            ai_type="chat"
        )
        print(f"✅ 对话功能成功！")
        print(f"输入: {prompt}")
        print(f"输出: {result}")
        return True
    except Exception as e:
        print(f"❌ 对话功能失败: {str(e)}")
        return False


async def test_planning():
    """测试规划功能"""
    print("\n" + "="*60)
    print("📋 测试规划功能 (planning)")
    print("="*60)
    
    openrouter_service = get_openrouter_service()
    
    prompt = "请为一场 50 人的科技聚会活动提供 5 个活动建议。"
    
    try:
        result = await openrouter_service.generate_text(
            prompt=prompt,
            ai_type="planning"
        )
        print(f"✅ 规划功能成功！")
        print(f"输入: {prompt}")
        print(f"输出: {result}")
        return True
    except Exception as e:
        print(f"❌ 规划功能失败: {str(e)}")
        return False


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
        print(f"输出: {result}")
        return True
    except Exception as e:
        print(f"❌ 图片生成失败: {str(e)}")
        return False


async def test_import():
    """测试导入功能"""
    print("\n" + "="*60)
    print("📥 测试导入功能 (import)")
    print("="*60)
    
    openrouter_service = get_openrouter_service()
    
    prompt = "请从以下文本中提取活动信息：\n'2024年3月15日下午2点，在科技园举办AI技术交流会，邀请行业专家分享最新技术趋势。'"
    
    try:
        result = await openrouter_service.generate_text(
            prompt=prompt,
            ai_type="import"
        )
        print(f"✅ 导入功能成功！")
        print(f"输入: {prompt}")
        print(f"输出: {result}")
        return True
    except Exception as e:
        print(f"❌ 导入功能失败: {str(e)}")
        return False


async def main():
    """主测试函数"""
    print("\n" + "🚀"*30)
    print("开始测试 OpenRouter AI 功能")
    print("🚀"*30)
    
    results = {}
    
    results["text_generation"] = await test_text_generation()
    results["chat"] = await test_chat()
    results["planning"] = await test_planning()
    results["image_generation"] = await test_image_generation()
    results["import"] = await test_import()
    
    print("\n" + "="*60)
    print("📊 测试结果汇总")
    print("="*60)
    
    for test_name, success in results.items():
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{test_name:20s}: {status}")
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    print(f"\n总计: {passed_tests}/{total_tests} 测试通过")
    
    if passed_tests == total_tests:
        print("\n🎉 所有测试通过！OpenRouter AI 功能正常工作！")
    else:
        print(f"\n⚠️  有 {total_tests - passed_tests} 个测试失败，请检查配置。")


if __name__ == "__main__":
    asyncio.run(main())
