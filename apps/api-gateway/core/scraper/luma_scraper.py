"""
Luma 活动爬虫
使用 HTTP 请求和 Playwright（备用）从 Luma 活动页面提取数据
"""
import os
import re
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup
from .exceptions import InvalidURLError, NetworkError, ParseError, TimeoutError

# 初始化 logger
logger = logging.getLogger(__name__)

# 尝试导入 Playwright（可选，如果安装失败则使用 HTTP 方式）
try:
    from playwright.async_api import async_playwright, Playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright 未安装，将使用 HTTP 请求方式爬取")

logger = logging.getLogger(__name__)

# 允许的域名白名单
ALLOWED_DOMAINS = ["luma.com", "lu.ma"]
# 默认超时时间（毫秒）
DEFAULT_TIMEOUT = 30000  # 30秒
# HTTP 请求超时时间（秒）
HTTP_TIMEOUT = 30
# 最大重试次数
MAX_RETRIES = 3


class LumaScraper:
    """Luma 活动爬虫类"""
    
    def __init__(self, timeout: int = DEFAULT_TIMEOUT, max_retries: int = MAX_RETRIES):
        """
        初始化爬虫
        
        Args:
            timeout: 页面加载超时时间（毫秒）
            max_retries: 最大重试次数
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.browser: Optional[Browser] = None
        self.playwright: Optional[Playwright] = None
    
    def validate_url(self, url: str) -> str:
        """
        验证和规范化 Luma URL
        
        Args:
            url: 原始 URL
            
        Returns:
            规范化后的 URL
            
        Raises:
            InvalidURLError: 如果 URL 无效
        """
        if not url or not isinstance(url, str):
            raise InvalidURLError("URL 不能为空")
        
        # 移除前后空格
        url = url.strip()
        
        # 如果没有协议，添加 https://
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        
        # 解析 URL
        try:
            parsed = urlparse(url)
        except Exception as e:
            raise InvalidURLError(f"URL 格式无效: {str(e)}")
        
        # 验证域名
        domain = parsed.netloc.lower()
        # 移除 www. 前缀
        if domain.startswith("www."):
            domain = domain[4:]
        
        # 检查是否在允许列表中
        is_allowed = False
        for allowed_domain in ALLOWED_DOMAINS:
            if domain == allowed_domain or domain.endswith(f".{allowed_domain}"):
                is_allowed = True
                break
        
        if not is_allowed:
            raise InvalidURLError(f"不支持的域名: {domain}。仅支持 {', '.join(ALLOWED_DOMAINS)}")
        
        # 规范化 URL（统一使用 lu.ma）
        if "luma.com" in domain:
            domain = "lu.ma"
        
        # 构建规范化 URL
        normalized_url = f"{parsed.scheme}://{domain}{parsed.path}"
        if parsed.query:
            normalized_url += f"?{parsed.query}"
        
        return normalized_url
    
    async def _init_browser(self) -> Optional[Browser]:
        """
        初始化浏览器实例（单例模式）
        
        Returns:
            Browser 实例，如果 Playwright 不可用则返回 None
        """
        if not PLAYWRIGHT_AVAILABLE:
            return None
            
        if self.browser is None:
            try:
                if self.playwright is None:
                    self.playwright = await async_playwright().start()
                # 使用 chromium 浏览器，headless 模式
                self.browser = await self.playwright.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu"
                    ]
                )
            except Exception as e:
                logger.warning(f"Playwright 初始化失败，将使用 HTTP 请求方式: {str(e)}")
                return None
        return self.browser
    
    async def _scrape_with_http(self, url: str) -> Dict[str, Any]:
        """
        使用 HTTP 请求方式爬取页面（备用方案）
        
        Args:
            url: 要爬取的 URL
            
        Returns:
            活动数据字典
        """
        data = {}
        
        try:
            # 使用 httpx 发送请求
            async with httpx.AsyncClient(
                timeout=HTTP_TIMEOUT,
                follow_redirects=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            ) as client:
                logger.info(f"使用 HTTP 请求方式爬取: {url}")
                response = await client.get(url)
                response.raise_for_status()
                
                # 使用 BeautifulSoup 解析 HTML
                soup = BeautifulSoup(response.text, 'lxml')
                
                # 1. 提取 JSON-LD 数据
                json_ld_scripts = soup.find_all('script', type='application/ld+json')
                for script in json_ld_scripts:
                    try:
                        json_data = json.loads(script.string)
                        if isinstance(json_data, dict) and json_data.get("@type") == "Event":
                            if "name" in json_data:
                                data["name"] = json_data["name"]
                            if "description" in json_data:
                                data["description"] = json_data["description"]
                            if "startDate" in json_data:
                                data["start_at"] = json_data["startDate"]
                            if "endDate" in json_data:
                                data["end_at"] = json_data["endDate"]
                            if "image" in json_data:
                                if isinstance(json_data["image"], str):
                                    data["cover_url"] = json_data["image"]
                                elif isinstance(json_data["image"], list) and len(json_data["image"]) > 0:
                                    data["cover_url"] = json_data["image"][0]
                            break
                    except (json.JSONDecodeError, AttributeError):
                        continue
                
                # 2. 提取 meta 标签
                og_title = soup.find('meta', property='og:title')
                og_description = soup.find('meta', property='og:description')
                og_image = soup.find('meta', property='og:image')
                
                if og_title and og_title.get('content') and "name" not in data:
                    data["name"] = og_title.get('content')
                if og_description and og_description.get('content') and "description" not in data:
                    data["description"] = og_description.get('content')
                if og_image and og_image.get('content') and "cover_url" not in data:
                    data["cover_url"] = og_image.get('content')
                
                # 3. 尝试从 script 标签中提取 JavaScript 数据
                scripts = soup.find_all('script')
                for script in scripts:
                    if script.string:
                        script_text = script.string
                        # 查找 window.__INITIAL_STATE__ 或类似的数据
                        patterns = [
                            r'window\.__INITIAL_STATE__\s*=\s*({.+?});',
                            r'window\.__NEXT_DATA__\s*=\s*({.+?});',
                            r'window\.eventData\s*=\s*({.+?});',
                        ]
                        for pattern in patterns:
                            match = re.search(pattern, script_text, re.DOTALL)
                            if match:
                                try:
                                    json_str = match.group(1)
                                    page_data = json.loads(json_str)
                                    if isinstance(page_data, dict):
                                        event_data = page_data.get("event") or page_data.get("eventData") or page_data
                                        if isinstance(event_data, dict):
                                            if "name" in event_data and "name" not in data:
                                                data["name"] = event_data["name"]
                                            if "description" in event_data and "description" not in data:
                                                data["description"] = event_data.get("description") or event_data.get("description_mirror", {}).get("text", "")
                                            if "start_at" in event_data and "start_at" not in data:
                                                data["start_at"] = event_data["start_at"]
                                            if "end_at" in event_data and "end_at" not in data:
                                                data["end_at"] = event_data["end_at"]
                                            if "timezone" in event_data:
                                                data["timezone"] = event_data["timezone"]
                                            if "cover_url" in event_data and "cover_url" not in data:
                                                data["cover_url"] = event_data["cover_url"]
                                            if "location_type" in event_data:
                                                data["location_type"] = event_data["location_type"]
                                            if "geo_address_info" in event_data:
                                                data["geo_address_info"] = event_data["geo_address_info"]
                                            if "virtual_info" in event_data:
                                                data["virtual_info"] = event_data["virtual_info"]
                                            if "hosts" in event_data:
                                                data["hosts"] = event_data["hosts"]
                                            if "ticket_types" in event_data:
                                                data["ticket_types"] = event_data["ticket_types"]
                                            break
                                except (json.JSONDecodeError, KeyError):
                                    continue
                
                # 4. 从 DOM 元素提取（备用）
                if "name" not in data:
                    title_elem = soup.find('h1') or soup.find(attrs={'data-testid': 'event-title'})
                    if title_elem:
                        data["name"] = title_elem.get_text(strip=True)
                
                if "description" not in data:
                    desc_elem = soup.find(attrs={'data-testid': 'event-description'}) or soup.find(class_='description')
                    if desc_elem:
                        data["description"] = desc_elem.get_text(strip=True)
                
        except httpx.HTTPStatusError as e:
            raise NetworkError(f"HTTP {e.response.status_code}: 无法访问页面")
        except httpx.TimeoutException:
            raise TimeoutError("请求超时")
        except Exception as e:
            logger.error(f"HTTP 请求爬取失败: {str(e)}")
            raise NetworkError(f"HTTP 请求失败: {str(e)}")
        
        return data
    
    async def _extract_json_ld(self, page: Page) -> Optional[Dict[str, Any]]:
        """
        提取页面的 JSON-LD 结构化数据
        
        Args:
            page: Playwright Page 对象
            
        Returns:
            JSON-LD 数据字典，如果不存在则返回 None
        """
        try:
            # 查找所有 script[type="application/ld+json"] 标签
            json_ld_scripts = await page.query_selector_all('script[type="application/ld+json"]')
            
            for script in json_ld_scripts:
                content = await script.text_content()
                if content:
                    try:
                        data = json.loads(content)
                        # 检查是否是 Event 类型
                        if isinstance(data, dict) and data.get("@type") == "Event":
                            return data
                        elif isinstance(data, list):
                            # 查找 Event 类型
                            for item in data:
                                if isinstance(item, dict) and item.get("@type") == "Event":
                                    return item
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.warning(f"提取 JSON-LD 数据失败: {str(e)}")
        
        return None
    
    async def _extract_meta_tags(self, page: Page) -> Dict[str, str]:
        """
        提取页面的 meta 标签数据
        
        Args:
            page: Playwright Page 对象
            
        Returns:
            meta 标签数据字典
        """
        meta_data = {}
        
        try:
            # 提取 Open Graph 标签
            og_title = await page.get_attribute('meta[property="og:title"]', "content")
            og_description = await page.get_attribute('meta[property="og:description"]', "content")
            og_image = await page.get_attribute('meta[property="og:image"]', "content")
            
            if og_title:
                meta_data["title"] = og_title
            if og_description:
                meta_data["description"] = og_description
            if og_image:
                meta_data["image"] = og_image
            
            # 提取标准 meta 标签
            title = await page.get_attribute('meta[name="title"]', "content")
            description = await page.get_attribute('meta[name="description"]', "content")
            
            if title and "title" not in meta_data:
                meta_data["title"] = title
            if description and "description" not in meta_data:
                meta_data["description"] = description
        except Exception as e:
            logger.warning(f"提取 meta 标签失败: {str(e)}")
        
        return meta_data
    
    async def _extract_page_data(self, page: Page) -> Dict[str, Any]:
        """
        从页面提取活动数据
        
        Args:
            page: Playwright Page 对象
            
        Returns:
            活动数据字典
        """
        data = {}
        
        try:
            # 等待页面主要内容加载
            await page.wait_for_selector("body", timeout=10000)
            
            # 1. 尝试提取 JSON-LD 数据
            json_ld_data = await self._extract_json_ld(page)
            if json_ld_data:
                logger.info("成功提取 JSON-LD 数据")
                # 映射 JSON-LD 到我们的数据结构
                if "name" in json_ld_data:
                    data["name"] = json_ld_data["name"]
                if "description" in json_ld_data:
                    data["description"] = json_ld_data["description"]
                if "startDate" in json_ld_data:
                    data["start_at"] = json_ld_data["startDate"]
                if "endDate" in json_ld_data:
                    data["end_at"] = json_ld_data["endDate"]
                if "image" in json_ld_data:
                    if isinstance(json_ld_data["image"], str):
                        data["cover_url"] = json_ld_data["image"]
                    elif isinstance(json_ld_data["image"], list) and len(json_ld_data["image"]) > 0:
                        data["cover_url"] = json_ld_data["image"][0]
                if "location" in json_ld_data:
                    location = json_ld_data["location"]
                    if isinstance(location, dict):
                        data["location_name"] = location.get("name", "")
                        if "address" in location:
                            addr = location["address"]
                            if isinstance(addr, dict):
                                data["location_address"] = addr.get("streetAddress", "")
                                data["location_city"] = addr.get("addressLocality", "")
                                data["location_country"] = addr.get("addressCountry", "")
            
            # 2. 提取 meta 标签
            meta_data = await self._extract_meta_tags(page)
            if meta_data:
                if "title" in meta_data and "name" not in data:
                    data["name"] = meta_data["title"]
                if "description" in meta_data and "description" not in data:
                    data["description"] = meta_data["description"]
                if "image" in meta_data and "cover_url" not in data:
                    data["cover_url"] = meta_data["image"]
            
            # 3. 尝试从页面 JavaScript 变量中提取数据
            try:
                # Luma 通常在 window.__INITIAL_STATE__ 或类似变量中存储数据
                page_data = await page.evaluate("""
                    () => {
                        const data = {};
                        // 尝试获取 window.__INITIAL_STATE__
                        if (window.__INITIAL_STATE__) {
                            return window.__INITIAL_STATE__;
                        }
                        // 尝试获取 window.__NEXT_DATA__
                        if (window.__NEXT_DATA__) {
                            return window.__NEXT_DATA__.props?.pageProps || window.__NEXT_DATA__;
                        }
                        // 尝试查找包含 event 数据的全局变量
                        if (window.eventData) {
                            return window.eventData;
                        }
                        return null;
                    }
                """)
                
                if page_data:
                    logger.info("成功从页面 JavaScript 提取数据")
                    # 处理提取的数据
                    if isinstance(page_data, dict):
                        # 查找 event 相关数据
                        event_data = page_data.get("event") or page_data.get("eventData") or page_data
                        if isinstance(event_data, dict):
                            if "name" in event_data and "name" not in data:
                                data["name"] = event_data["name"]
                            if "description" in event_data and "description" not in data:
                                data["description"] = event_data.get("description") or event_data.get("description_mirror", {}).get("text", "")
                            if "start_at" in event_data and "start_at" not in data:
                                data["start_at"] = event_data["start_at"]
                            if "end_at" in event_data and "end_at" not in data:
                                data["end_at"] = event_data["end_at"]
                            if "timezone" in event_data:
                                data["timezone"] = event_data["timezone"]
                            if "cover_url" in event_data and "cover_url" not in data:
                                data["cover_url"] = event_data["cover_url"]
                            if "location_type" in event_data:
                                data["location_type"] = event_data["location_type"]
                            if "geo_address_info" in event_data:
                                data["geo_address_info"] = event_data["geo_address_info"]
                            if "virtual_info" in event_data:
                                data["virtual_info"] = event_data["virtual_info"]
                            if "hosts" in event_data:
                                data["hosts"] = event_data["hosts"]
                            if "ticket_types" in event_data:
                                data["ticket_types"] = event_data["ticket_types"]
            except Exception as e:
                logger.warning(f"从 JavaScript 提取数据失败: {str(e)}")
            
            # 4. 从 DOM 元素提取（备用方案）
            if "name" not in data:
                try:
                    title_elem = await page.query_selector("h1, [data-testid='event-title'], .event-title")
                    if title_elem:
                        title_text = await title_elem.text_content()
                        if title_text:
                            data["name"] = title_text.strip()
                except Exception:
                    pass
            
            if "description" not in data:
                try:
                    desc_elem = await page.query_selector("[data-testid='event-description'], .event-description, .description")
                    if desc_elem:
                        desc_text = await desc_elem.text_content()
                        if desc_text:
                            data["description"] = desc_text.strip()
                except Exception:
                    pass
            
        except Exception as e:
            logger.error(f"提取页面数据时出错: {str(e)}")
            raise ParseError(f"无法解析页面数据: {str(e)}")
        
        return data
    
    async def scrape(self, url: str) -> Dict[str, Any]:
        """
        爬取 Luma 活动页面
        优先使用 HTTP 请求方式，如果失败则尝试 Playwright（如果可用）
        
        Args:
            url: Luma 活动 URL
            
        Returns:
            活动数据字典
            
        Raises:
            InvalidURLError: URL 无效
            NetworkError: 网络错误
            ParseError: 解析错误
            TimeoutError: 超时错误
        """
        # 验证和规范化 URL
        normalized_url = self.validate_url(url)
        logger.info(f"开始爬取 Luma 活动: {normalized_url}")
        
        # 优先尝试 HTTP 请求方式（更简单、更可靠）
        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(f"尝试 HTTP 请求方式 (尝试 {attempt}/{self.max_retries})...")
                data = await self._scrape_with_http(normalized_url)
                data["source_url"] = normalized_url
                logger.info(f"成功爬取活动数据: {data.get('name', 'Unknown')}")
                return data
            except Exception as e:
                last_error = e
                logger.warning(f"HTTP 请求失败 (尝试 {attempt}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries:
                    await asyncio.sleep(2)  # 等待后重试
        
        # 如果 HTTP 请求失败且 Playwright 可用，尝试使用 Playwright（备用方案）
        if PLAYWRIGHT_AVAILABLE:
            logger.info("HTTP 请求失败，尝试使用 Playwright...")
            browser = await self._init_browser()
            if browser:
                try:
                    page = await browser.new_page()
                    try:
                        await page.set_extra_http_headers({
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        })
                        
                        response = await page.goto(
                            normalized_url,
                            wait_until="networkidle",
                            timeout=self.timeout
                        )
                        
                        if response and response.status >= 400:
                            raise NetworkError(f"HTTP {response.status}: 无法访问页面")
                        
                        data = await self._extract_page_data(page)
                        data["source_url"] = normalized_url
                        logger.info(f"使用 Playwright 成功爬取活动数据: {data.get('name', 'Unknown')}")
                        return data
                    finally:
                        await page.close()
                except Exception as e:
                    logger.warning(f"Playwright 爬取也失败: {str(e)}")
        
        # 如果所有方法都失败
        if last_error:
            if isinstance(last_error, (TimeoutError, NetworkError, ParseError)):
                raise last_error
            else:
                raise NetworkError(f"爬取失败: {str(last_error)}")
        else:
            raise NetworkError("爬取失败：未知错误")
    
    async def close(self):
        """关闭浏览器实例和 Playwright"""
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
