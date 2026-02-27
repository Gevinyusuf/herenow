"""
Luma 数据映射器
将 Luma 爬取的数据映射到 events_v1 表结构
"""
import re
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from .exceptions import ParseError

logger = logging.getLogger(__name__)

# 延迟导入 AI 服务，避免循环依赖
_openrouter_service = None


def get_openrouter_service():
    """获取 OpenRouter 服务实例（延迟导入）"""
    global _openrouter_service
    if _openrouter_service is None:
        from core.ai.openrouter_service import get_openrouter_service as _get_service
        _openrouter_service = _get_service()
    return _openrouter_service


class LumaDataMapper:
    """Luma 数据到 events_v1 的映射器"""
    
    @staticmethod
    def generate_slug(title: str) -> str:
        """
        从标题生成友好的 URL slug
        
        Args:
            title: 活动标题
            
        Returns:
            slug 字符串
        """
        if not title:
            return f"event-{int(datetime.now().timestamp())}"
        
        # 转换为小写
        slug = title.lower()
        # 替换空格为连字符
        slug = re.sub(r'\s+', '-', slug)
        # 移除所有非字母数字和连字符的字符
        slug = re.sub(r'[^a-z0-9\-]', '', slug)
        # 移除连续的连字符
        slug = re.sub(r'-+', '-', slug)
        # 移除开头和结尾的连字符
        slug = slug.strip('-')
        # 如果为空，使用时间戳
        if not slug:
            slug = f"event-{int(datetime.now().timestamp())}"
        return slug
    
    @staticmethod
    def parse_datetime(datetime_str: str, timezone: Optional[str] = None) -> str:
        """
        解析日期时间字符串并格式化为 ISO 格式
        
        Args:
            datetime_str: 日期时间字符串（ISO 格式或 Luma 格式）
            timezone: 时区字符串（如 "America/New_York"）
            
        Returns:
            ISO 格式的日期时间字符串
        """
        if not datetime_str:
            return None
        
        try:
            # 如果已经是 ISO 格式，直接返回
            if 'T' in datetime_str and ('Z' in datetime_str or '+' in datetime_str or '-' in datetime_str[-6:]):
                # 移除时区信息，统一处理
                dt_str = datetime_str.replace('Z', '+00:00')
                # 尝试解析
                dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                return dt.isoformat()
            else:
                # 尝试解析其他格式
                dt = datetime.fromisoformat(datetime_str)
                return dt.isoformat()
        except Exception as e:
            logger.warning(f"解析日期时间失败: {datetime_str}, 错误: {str(e)}")
            return datetime_str  # 返回原始字符串
    
    @staticmethod
    def map_location_info(luma_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        映射地点信息
        
        Args:
            luma_data: Luma 原始数据
            
        Returns:
            location_info 字典
        """
        location_type = luma_data.get("location_type", "offline")
        
        if location_type == "virtual":
            # 虚拟活动
            virtual_info = luma_data.get("virtual_info", {})
            meeting_link = virtual_info.get("link") or virtual_info.get("url") or ""
            
            return {
                "type": "virtual",
                "link": meeting_link
            }
        else:
            # 线下活动
            geo_address_info = luma_data.get("geo_address_info", {})
            
            location_info = {
                "type": "offline",
                "isPublic": True  # 默认公开
            }
            
            # 提取地址信息
            if geo_address_info:
                if "name" in geo_address_info:
                    location_info["name"] = geo_address_info["name"]
                elif "full_address" in geo_address_info:
                    location_info["name"] = geo_address_info["full_address"]
                elif "address" in geo_address_info:
                    location_info["name"] = geo_address_info["address"]
                
                # 提取坐标
                coordinate = luma_data.get("coordinate")
                if coordinate:
                    if "latitude" in coordinate:
                        location_info["lat"] = float(coordinate["latitude"])
                    if "longitude" in coordinate:
                        location_info["lng"] = float(coordinate["longitude"])
                elif "geo_latitude" in luma_data and "geo_longitude" in luma_data:
                    try:
                        location_info["lat"] = float(luma_data["geo_latitude"])
                        location_info["lng"] = float(luma_data["geo_longitude"])
                    except (ValueError, TypeError):
                        pass
                
                # 提取详细地址信息
                if "city" in geo_address_info:
                    location_info["city"] = geo_address_info["city"]
                if "region" in geo_address_info:
                    location_info["region"] = geo_address_info["region"]
                if "country" in geo_address_info:
                    location_info["country"] = geo_address_info["country"]
            
            # 如果没有提取到名称，尝试从其他字段获取
            if "name" not in location_info:
                location_name = luma_data.get("location_name") or luma_data.get("location")
                if location_name:
                    location_info["name"] = location_name
            
            return location_info
    
    @staticmethod
    def map_ticket_config(luma_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        映射票务配置
        
        Args:
            luma_data: Luma 原始数据
            
        Returns:
            ticket_config 字典
        """
        ticket_types = luma_data.get("ticket_types", [])
        
        tickets = []
        for ticket in ticket_types:
            if not isinstance(ticket, dict):
                continue
            
            ticket_info = {
                "id": ticket.get("id", ""),
                "name": ticket.get("name", "General"),
                "type": "free" if ticket.get("price", 0) == 0 else "paid",
                "price": str(ticket.get("price", 0)),
                "quantity": str(ticket.get("quantity", "")) if ticket.get("quantity") else "",
                "requireApproval": ticket.get("require_approval", False)
            }
            tickets.append(ticket_info)
        
        return {
            "tickets": tickets
        }
    
    @staticmethod
    def map_co_hosts(luma_data: Dict[str, Any]) -> list:
        """
        映射联合主办方
        
        Args:
            luma_data: Luma 原始数据
            
        Returns:
            co_hosts 列表
        """
        hosts = luma_data.get("hosts", [])
        
        co_hosts = []
        for host in hosts:
            if not isinstance(host, dict):
                continue
            
            # 提取主办方信息
            host_info = {}
            
            # 尝试获取 ID
            host_id = host.get("id") or host.get("api_id") or host.get("user_api_id")
            if host_id:
                host_info["id"] = host_id
            
            # 提取名称和邮箱（如果 ID 不存在）
            if "id" not in host_info:
                host_name = host.get("name") or host.get("full_name") or host.get("display_name")
                host_email = host.get("email")
                
                if host_name:
                    host_info["name"] = host_name
                if host_email:
                    host_info["email"] = host_email
            
            if host_info:
                co_hosts.append(host_info)
        
        return co_hosts
    
    @staticmethod
    async def format_description(description: str) -> str:
        """
        使用 AI 格式化活动描述，增加 HTML 结构但保持原文不变
        
        Args:
            description: 原始描述文本
            
        Returns:
            格式化后的 HTML 描述
        """
        if not description or not description.strip():
            return ""
        
        try:
            # 获取 AI 服务
            openrouter_service = get_openrouter_service()
            
            # 构建提示词 - 与前端 AI Magic 保持一致
            # 使用与 text_generation 相同的格式要求，但保持原文不变
            prompt = f"""You are a professional event description formatting assistant. Format the following event description into well-structured HTML while keeping ALL original content unchanged.

CRITICAL REQUIREMENTS:
1. Keep ALL original text content EXACTLY as is - do NOT add, remove, or modify any words
2. Only add HTML structure (tags) to organize the existing content
3. Use HTML format, but keep it simple
4. Only use basic HTML tags: <p>, <h1>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, etc.
5. Do NOT use complex styles or CSS
6. Create clear hierarchy with headings (<h2>, <h3>) and paragraphs (<p>)
7. Convert plain text lists into <ul><li> format
8. Use <strong> for important text, <em> for subtle emphasis
9. Make it engaging, professional and accurate
10. Preserve the original meaning and flow

Original description to format:
{description}

Return only the formatted HTML code, no explanations or markdown code blocks."""

            # 调用 AI 格式化 - 使用与前端 AI Magic 相同的类型和配置
            formatted_description = await openrouter_service.generate_text(
                prompt=prompt,
                ai_type="text_generation",  # 与前端 AI Magic 使用相同的类型
                context={
                    "description": description  # 提供当前描述作为上下文
                },
                options={
                    "temperature": 0.5,  # 与 text_generation 默认温度一致
                    "max_tokens": 2000
                }
            )
            
            # 清理可能的 markdown 格式（如果 AI 返回了 markdown）
            formatted_description = formatted_description.strip()
            
            # 如果 AI 返回的内容包含代码块标记，提取 HTML 部分
            if "```html" in formatted_description:
                formatted_description = re.search(r'```html\s*(.*?)\s*```', formatted_description, re.DOTALL)
                if formatted_description:
                    formatted_description = formatted_description.group(1).strip()
            elif "```" in formatted_description:
                formatted_description = re.search(r'```\s*(.*?)\s*```', formatted_description, re.DOTALL)
                if formatted_description:
                    formatted_description = formatted_description.group(1).strip()
            
            logger.info("Successfully formatted description with AI")
            return formatted_description
            
        except Exception as e:
            logger.warning(f"Failed to format description with AI: {str(e)}, using original text")
            # 如果 AI 格式化失败，返回原始文本（简单包装为段落）
            if description.strip():
                # 简单处理：将换行转换为段落
                paragraphs = [p.strip() for p in description.split('\n') if p.strip()]
                if paragraphs:
                    return '<p>' + '</p><p>'.join(paragraphs) + '</p>'
            return description
    
    @staticmethod
    async def map_to_events_v1(luma_data: Dict[str, Any], host_id: str) -> Dict[str, Any]:
        """
        将 Luma 数据映射到 events_v1 表结构
        
        Args:
            luma_data: Luma 爬取的原始数据
            host_id: 活动主办方 ID（当前用户）
            
        Returns:
            符合 events_v1 表结构的数据字典
            
        Raises:
            ParseError: 如果必填字段缺失
        """
        # 验证必填字段
        if not luma_data.get("name"):
            raise ParseError("活动名称（name）是必填字段")
        
        if not luma_data.get("start_at"):
            raise ParseError("活动开始时间（start_at）是必填字段")
        
        if not luma_data.get("end_at"):
            raise ParseError("活动结束时间（end_at）是必填字段")
        
        # 生成 slug
        title = luma_data.get("name", "")
        slug = LumaDataMapper.generate_slug(title)
        
        # 解析时间
        timezone = luma_data.get("timezone", "UTC")
        start_at = LumaDataMapper.parse_datetime(luma_data.get("start_at"), timezone)
        end_at = LumaDataMapper.parse_datetime(luma_data.get("end_at"), timezone)
        
        # 映射地点信息
        location_info = LumaDataMapper.map_location_info(luma_data)
        
        # 映射票务配置
        ticket_config = LumaDataMapper.map_ticket_config(luma_data)
        
        # 映射联合主办方
        co_hosts = LumaDataMapper.map_co_hosts(luma_data)
        
        # 格式化描述（使用 AI 增加 HTML 结构）
        original_description = luma_data.get("description", "")
        formatted_description = await LumaDataMapper.format_description(original_description)
        
        # 构建 events_v1 数据
        event_data = {
            "title": title,
            "slug": slug,
            "description": formatted_description or original_description,
            "cover_image_url": luma_data.get("cover_url") or luma_data.get("cover_image_url") or "",
            "start_at": start_at,
            "end_at": end_at,
            "timezone": timezone,
            "location_info": location_info,
            "visibility": luma_data.get("visibility", "public"),
            "require_approval": luma_data.get("require_approval", False),
            "host_id": host_id,
            "style_config": {},  # 默认样式配置
            "registration_fields": [],  # 默认注册字段
            "ticket_config": ticket_config,
            "co_hosts": co_hosts
        }
        
        return event_data
