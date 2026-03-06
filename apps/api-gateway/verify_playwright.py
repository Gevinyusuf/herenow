"""
验证 Playwright 安装状态
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_playwright_installation():
    """验证 Playwright 安装"""
    try:
        logger.info("="*60)
        logger.info("验证 Playwright 安装状态")
        logger.info("="*60)

        logger.info("\n尝试启动 Playwright...")
        
        with sync_playwright() as p:
            # 尝试启动 Chromium 浏览器
            logger.info("启动 Chromium 浏览器...")
            browser = p.chromium.launch(headless=True)
            logger.info("✅ Chromium 浏览器启动成功！")
            
            # 创建页面
            page = browser.new_page()
            logger.info("✅ 创建新页面成功！")
            
            # 访问测试页面
            logger.info("访问测试页面...")
            page.goto("https://example.com")
            logger.info("✅ 页面加载成功！")
            
            # 关闭浏览器
            browser.close()
            logger.info("✅ 浏览器关闭成功！")

        logger.info("\n" + "="*60)
        logger.info("🎉 Playwright 安装验证成功！")
        logger.info("="*60)

        logger.info("\n✅ Playwright 已正确安装并可以正常使用")
        logger.info("✅ 爬虫功能可以正常工作")

        return True

    except ImportError as e:
        logger.error(f"❌ Playwright Python 包未安装: {str(e)}")
        logger.error("\n请运行: pip install playwright")
        return False
    except Exception as e:
        logger.error(f"❌ Playwright 浏览器未安装或无法启动: {str(e)}")
        logger.error("\n请运行: playwright install chromium")
        return False


if __name__ == "__main__":
    success = verify_playwright_installation()
    sys.exit(0 if success else 1)
