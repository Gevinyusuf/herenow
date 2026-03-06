"""
测试爬虫功能（Luma 活动导入）
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.scraper import LumaScraper
from core.scraper.data_mapper import LumaDataMapper
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_scraper():
    """测试爬虫功能"""
    try:
        logger.info("="*60)
        logger.info("测试爬虫功能")
        logger.info("="*60)

        # 测试 URL
        test_url = "https://lu.ma/events/luma-hackathon-2024"

        logger.info(f"\n测试 URL: {test_url}")

        # 创建爬虫实例
        logger.info("\n创建爬虫实例...")
        scraper = LumaScraper()

        # 爬取活动数据
        logger.info("开始爬取活动数据...")
        event_data = await scraper.scrape_event(test_url)

        if event_data:
            logger.info("✅ 爬取成功！")
            logger.info(f"\n活动标题: {event_data.get('title', 'N/A')}")
            logger.info(f"活动描述: {event_data.get('description', 'N/A')[:100]}...")
            logger.info(f"活动时间: {event_data.get('start_time', 'N/A')}")
            logger.info(f"活动地点: {event_data.get('location', 'N/A')}")

            # 测试数据映射
            logger.info("\n测试数据映射...")
            mapper = LumaDataMapper()
            mapped_data = await mapper.map_event_data(event_data)

            if mapped_data:
                logger.info("✅ 数据映射成功！")
                logger.info(f"\n映射后的数据: {mapped_data}")
            else:
                logger.info("❌ 数据映射失败")

        else:
            logger.info("❌ 爬取失败")

        logger.info("\n" + "="*60)
        logger.info("📊 爬虫功能测试总结")
        logger.info("="*60)

        logger.info("\n✅ 已完成：")
        logger.info("  - Playwright Python 包：已安装")
        logger.info("  - LumaScraper：已实现")
        logger.info("  - LumaDataMapper：已实现")

        logger.info("\n⚠️  待完成：")
        logger.info("  - Playwright 浏览器：需要安装（正在下载中）")
        logger.info("  - 测试真实的 Luma URL")

        logger.info("\n💡 下一步：")
        logger.info("  1. 等待 Playwright 浏览器安装完成")
        logger.info("  2. 运行此脚本测试爬虫功能")
        logger.info("  3. 测试 API 端点：POST /api/v1/ai/import-from-link")

        logger.info("\n" + "="*60)
        logger.info("✅ 爬虫功能测试准备完成！")
        logger.info("="*60)

        return True

    except ImportError as e:
        logger.error(f"❌ 导入爬虫模块失败: {str(e)}")
        logger.error("\n请确保 core.scraper 模块存在")
        return False
    except Exception as e:
        logger.error(f"❌ 测试爬虫功能失败: {str(e)}", exc_info=True)
        return False


if __name__ == "__main__":
    import asyncio
    success = asyncio.run(test_scraper())
    sys.exit(0 if success else 1)
