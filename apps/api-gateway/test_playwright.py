"""
验证 Playwright 安装状态
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_playwright_installation():
    """测试 Playwright 是否正确安装"""
    print("\n" + "="*60)
    print("🔍 检查 Playwright 安装状态")
    print("="*60)

    try:
        from playwright.sync_api import sync_playwright

        print("\n✅ Playwright Python 包已安装")

        # 尝试启动 Playwright
        with sync_playwright() as p:
            print("✅ Playwright 可以正常启动")

            # 检查 Chromium 是否已安装
            try:
                browser = p.chromium.launch(headless=True)
                print("✅ Chromium 浏览器已安装")
                browser.close()
            except Exception as e:
                print(f"❌ Chromium 浏览器未安装或无法启动")
                print(f"错误: {str(e)}")
                return False

        print("\n" + "="*60)
        print("🎉 Playwright 安装成功！")
        print("="*60)
        return True

    except ImportError as e:
        print(f"❌ Playwright Python 包未安装")
        print(f"错误: {str(e)}")
        print("\n请运行: pip install playwright")
        return False
    except Exception as e:
        print(f"❌ Playwright 安装失败")
        print(f"错误: {str(e)}")
        return False


if __name__ == "__main__":
    success = test_playwright_installation()
    sys.exit(0 if success else 1)
