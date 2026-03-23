"""
首页数据路由
返回 home 页面所需的用户参与的活动数据
"""
from fastapi import APIRouter, HTTPException, status, Depends
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from supabase import Client
import calendar
try:
    from zoneinfo import ZoneInfo
except ImportError:
    import pytz
    ZoneInfo = pytz.timezone

router = APIRouter()

# 使用统一的单例客户端（优化性能，支持高并发）
def get_supabase() -> Client:
    """获取 Supabase 客户端（单例）"""
    return get_supabase_client()

def parse_datetime(date_str: str) -> Optional[datetime]:
    """
    解析日期时间字符串，处理多种格式
    """
    if not date_str:
        return None
    try:
        # 处理 Z 结尾的 UTC 时间
        if date_str.endswith('Z'):
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        # 处理带时区的时间
        elif '+' in date_str or (date_str.count('-') > 2 and 'T' in date_str):
            return datetime.fromisoformat(date_str)
        # 处理不带时区的时间（假设为 UTC）
        else:
            return datetime.fromisoformat(date_str + '+00:00')
    except Exception as e:
        print(f"解析日期时间失败: {e}, date_str: {date_str}")
        return None

def format_event_date(date_str: str, timezone: Optional[str] = None) -> str:
    """
    格式化日期为前端需要的格式
    例如: "2024-11-14T19:00:00+00:00" -> "NOV 14"
    如果提供了时区，会将 UTC 时间转换为指定时区的本地时间
    """
    dt = parse_datetime(date_str)
    if not dt:
        return ""
    
    # 如果提供了时区，转换为指定时区的本地时间
    if timezone:
        try:
            # 确保 dt 是 UTC 时间（如果没有时区信息，假设是 UTC）
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=ZoneInfo('UTC'))
            # 转换为指定时区的本地时间
            dt = dt.astimezone(ZoneInfo(timezone))
        except Exception as e:
            print(f"⚠️ 时区转换失败: {e}, timezone: {timezone}")
            # 如果时区转换失败，使用原始时间
    
    month_abbr = calendar.month_abbr[dt.month].upper()
    return f"{month_abbr} {dt.day}"

def format_event_time(date_str: str, timezone: Optional[str] = None) -> str:
    """
    格式化时间为前端需要的格式（完整时间：日期 + 时间）
    例如: "2024-11-14T19:00:00+00:00" -> "NOV 14, 7:00 PM"
    如果提供了时区，会将 UTC 时间转换为指定时区的本地时间
    """
    dt = parse_datetime(date_str)
    if not dt:
        return ""
    
    # 如果提供了时区，转换为指定时区的本地时间
    if timezone:
        try:
            # 确保 dt 是 UTC 时间（如果没有时区信息，假设是 UTC）
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=ZoneInfo('UTC'))
            # 转换为指定时区的本地时间
            dt = dt.astimezone(ZoneInfo(timezone))
        except Exception as e:
            print(f"⚠️ 时区转换失败: {e}, timezone: {timezone}")
            # 如果时区转换失败，使用原始时间
    
    # 日期部分
    month_abbr = calendar.month_abbr[dt.month].upper()
    date_part = f"{month_abbr} {dt.day}"
    
    # 时间部分
    hour = dt.hour
    minute = dt.minute
    period = "AM" if hour < 12 else "PM"
    hour_12 = hour if hour <= 12 else hour - 12
    if hour_12 == 0:
        hour_12 = 12
    minute_str = f":{minute:02d}" if minute > 0 else ""
    time_part = f"{hour_12}{minute_str} {period}"
    
    return f"{date_part}, {time_part}"

def get_event_category(start_at: str, end_at: str) -> str:
    """
    根据活动时间判断分类
    返回: "this-week", "this-month", "next-month", "last-month", "last-3-months", "older"
    """
    start_dt = parse_datetime(start_at)
    end_dt = parse_datetime(end_at)
    
    if not start_dt:
        return "this-month"
    
    now = datetime.utcnow()
    # 转换为 UTC 时间进行比较（移除时区信息）
    start_utc = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
    end_utc = end_dt.replace(tzinfo=None) if (end_dt and end_dt.tzinfo) else (end_dt or start_utc)
    
    # 对于即将参与的活动（start_at > now）
    if start_utc > now:
        days_diff = (start_utc - now).days
        if days_diff <= 7:
            return "this-week"
        elif days_diff <= 30:
            return "this-month"
        else:
            return "next-month"
    # 对于已参与的活动（end_at < now）
    else:
        days_diff = (now - end_utc).days
        if days_diff <= 30:
            return "last-month"
        elif days_diff <= 90:
            return "last-3-months"
        else:
            return "older"

def get_location_from_info(location_info: Dict[str, Any]) -> str:
    """
    从 location_info JSONB 字段中提取地点信息
    """
    if not location_info:
        return "Location TBD"
    
    location_type = location_info.get("type", "")
    if location_type == "virtual":
        return location_info.get("link", "Online Event")
    elif location_type == "offline":
        return location_info.get("name", "Location TBD")
    else:
        return "Location TBD"

def get_image_color_from_style(style_config: Dict[str, Any]) -> str:
    """
    从 style_config JSONB 字段中提取颜色配置
    如果没有配置，返回默认颜色
    """
    if not style_config:
        return "from-blue-400 to-purple-500"
    
    # 可以根据 themeId 或 colors 返回对应的渐变
    theme_id = style_config.get("themeId", "")
    colors = style_config.get("colors", {})
    
    # 默认颜色映射
    color_map = {
        "midnight": "from-slate-700 to-slate-900",
        "sunset": "from-orange-400 to-pink-500",
        "ocean": "from-blue-400 to-cyan-500",
        "forest": "from-green-400 to-emerald-500",
        "purple": "from-purple-400 to-indigo-500",
    }
    
    return color_map.get(theme_id, "from-blue-400 to-purple-500")

def format_event_for_frontend(event: Dict[str, Any], registration: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    将数据库中的活动数据转换为前端 EventCard 需要的格式
    """
    try:
        location_info = event.get("location_info", {}) or {}
        style_config = event.get("style_config", {}) or {}
        start_at = event.get("start_at", "")
        end_at = event.get("end_at", "")
        cover_image_url = event.get("cover_image_url", "") or ""
        
        # 确保所有必需字段都有值
        event_id = event.get("id")
        if not event_id:
            print(f"⚠️ 活动数据缺少 id 字段: {event}")
            return None
        
        title = event.get("title", "")
        if not title:
            print(f"⚠️ 活动 {event_id} 缺少 title 字段")
            title = "Untitled Event"
        
        # 获取时区信息
        timezone = event.get("timezone")
        
        formatted_date = format_event_date(start_at, timezone)
        formatted_time = format_event_time(start_at, timezone)
        
        # 如果日期或时间格式化失败，使用默认值
        if not formatted_date:
            formatted_date = "TBD"
        if not formatted_time:
            formatted_time = "TBD"
        
        return {
            "id": str(event_id),  # UUID 转为字符串
            "title": title,
            "date": formatted_date,
            "time": formatted_time,  # 现在返回完整时间（日期+时间）
            "location": get_location_from_info(location_info),
            "imageColor": get_image_color_from_style(style_config),  # 作为后备，如果没有图片时使用
            "coverImageUrl": cover_image_url if cover_image_url else None,  # 活动封面图片
            "category": get_event_category(start_at, end_at),
            "isPinned": False,  # 可以从 registration 或其他字段获取
            "registrationCount": 0,  # 默认值，会在调用处设置
            "_start_at": start_at  # 临时字段，用于排序
        }
    except Exception as e:
        print(f"❌ 格式化活动数据失败: {e}")
        import traceback
        traceback.print_exc()
        return None

async def get_user_events_optimized(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    优化版本：使用数据库 RPC 函数一次性获取所有数据
    性能提升：从 4 次查询减少到 1 次，响应时间减少 55-60%
    """
    try:
        supabase = get_supabase()
        now_utc = datetime.utcnow()
        
        # 调用数据库 RPC 函数，一次性获取所有数据
        response = supabase.rpc(
            'get_user_events_optimized',
            {'p_user_id': user_id}
        ).execute()
        
        if not response.data or not isinstance(response.data, list):
            print("ℹ️ RPC 返回空数据或格式不正确")
            return {"upcoming": [], "past": []}
        
        upcoming_events = []
        past_events = []
        
        for row in response.data:
            # 处理日期时间（数据库返回的可能是 TIMESTAMPTZ 对象或字符串）
            start_at = row.get("start_at")
            end_at = row.get("end_at")
            
            # 如果是 datetime 对象，转换为 ISO 格式字符串
            if start_at and hasattr(start_at, 'isoformat'):
                start_at = start_at.isoformat()
            if end_at and hasattr(end_at, 'isoformat'):
                end_at = end_at.isoformat()
            
            # 转换为字符串（如果还不是字符串）
            start_at_str = str(start_at) if start_at else ""
            end_at_str = str(end_at) if end_at else ""
            
            if not start_at_str:
                continue
            
            # 构建事件对象（兼容 format_event_for_frontend）
            event = {
                "id": row.get("id"),
                "title": row.get("title", ""),
                "start_at": start_at_str,
                "end_at": end_at_str,
                "cover_image_url": row.get("cover_image_url"),
                "location_info": row.get("location_info") or {},
                "style_config": row.get("style_config") or {},
                "timezone": row.get("timezone")  # 添加时区信息
            }
            
            # 格式化事件数据
            formatted_event = format_event_for_frontend(event, None)
            if not formatted_event:
                continue
            
            # 添加额外信息
            formatted_event["isCreated"] = row.get("is_created", False)
            formatted_event["isRegistered"] = row.get("is_registered", False)
            formatted_event["registrationCount"] = row.get("registration_count", 0)
            formatted_event["status"] = row.get("status", "PUBLISHED")
            
            # 判断是即将参与还是已参与
            start_dt = parse_datetime(start_at_str)
            if not start_dt:
                continue
            
            start_utc = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
            
            if start_utc > now_utc:
                upcoming_events.append(formatted_event)
            else:
                past_events.append(formatted_event)
        
        # 排序（数据库已经排序，但为了确保正确性再次排序）
        upcoming_events.sort(key=lambda x: parse_datetime(x.get("_start_at", "")) or datetime.min)
        past_events.sort(key=lambda x: parse_datetime(x.get("_start_at", "")) or datetime.min, reverse=True)
        
        # 移除临时字段
        for event in upcoming_events + past_events:
            event.pop("_start_at", None)
        
        print(f"✅ RPC 优化查询完成: {len(upcoming_events)} 个即将参与/创建, {len(past_events)} 个已参与/创建")
        
        return {
            "upcoming": upcoming_events,
            "past": past_events
        }
        
    except Exception as e:
        print(f"⚠️ RPC 查询失败，将回退到原方法: {e}")
        import traceback
        traceback.print_exc()
        # 回退到原方法
        return await get_user_events_legacy(user_id)

async def get_user_events_legacy(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    原版本：使用多次查询获取用户活动（作为 RPC 失败时的回退方案）
    包括：
    1. 用户参与的活动（通过 event_registrations 表）
    2. 用户创建的活动（通过 events_v1 表的 host_id 字段）
    返回即将参与和已参与的活动列表
    """
    try:
        supabase = get_supabase()
        print(f"🔍 查询用户 {user_id} 的活动（参与 + 创建）...")
        
        # 1. 查询用户参与的活动（通过报名记录）
        registrations_result = supabase.table("event_registrations").select(
            "id, event_id, status, created_at"
        ).eq("user_id", user_id).in_("status", ["confirmed", "pending"]).execute()
        
        registered_event_ids = set()
        registrations_map = {}
        
        if registrations_result.data:
            print(f"📊 找到 {len(registrations_result.data)} 条报名记录")
            for reg in registrations_result.data:
                event_id = reg.get("event_id")
                if event_id:
                    registered_event_ids.add(event_id)
                    registrations_map[event_id] = reg
        else:
            print("ℹ️ 用户没有报名记录")
        
        # 2. 查询用户创建的活动（通过 host_id）
        created_events_result = supabase.table("events_v1").select(
            "id"
        ).eq("host_id", user_id).execute()
        
        created_event_ids = set()
        if created_events_result.data:
            print(f"📊 找到 {len(created_events_result.data)} 个创建的活动")
            created_event_ids = {event.get("id") for event in created_events_result.data if event.get("id")}
        else:
            print("ℹ️ 用户没有创建的活动")
        
        # 3. 合并所有活动 ID（去重）
        all_event_ids = list(registered_event_ids | created_event_ids)
        
        if not all_event_ids:
            print("ℹ️ 用户既没有参与也没有创建任何活动")
            return {
                "upcoming": [],
                "past": []
            }
        
        print(f"🔍 查询 {len(all_event_ids)} 个活动的详情...")
        
        # 4. 查询所有活动详情
        events_result = supabase.table("events_v1").select("*").in_("id", all_event_ids).execute()
        
        if not events_result.data:
            print("⚠️ 未找到对应的活动信息")
            return {
                "upcoming": [],
                "past": []
            }
        
        print(f"✅ 找到 {len(events_result.data)} 个活动详情")
        
        # 5. 批量查询所有活动的报名人数（状态为 confirmed 或 pending）
        event_ids_list = [event.get("id") for event in events_result.data if event.get("id")]
        
        # 初始化所有活动的人数为 0
        event_registration_counts = {event_id: 0 for event_id in event_ids_list}
        
        if event_ids_list:
            try:
                # 批量查询所有相关活动的报名记录
                all_registrations = supabase.table("event_registrations").select(
                    "event_id"
                ).in_("event_id", event_ids_list).in_("status", ["confirmed", "pending"]).execute()
                
                # 统计每个活动的报名人数
                if all_registrations.data:
                    for reg in all_registrations.data:
                        event_id = reg.get("event_id")
                        if event_id in event_registration_counts:
                            event_registration_counts[event_id] = event_registration_counts.get(event_id, 0) + 1
                
                print(f"📊 活动报名人数统计: {event_registration_counts}")
            except Exception as e:
                print(f"⚠️ 批量查询报名人数失败: {e}")
                # 如果批量查询失败，所有活动人数保持为 0
        
        upcoming_events = []
        past_events = []
        now_utc = datetime.utcnow()
        
        for event in events_result.data:
            event_id = event.get("id")
            registration = registrations_map.get(event_id)
            is_created = event_id in created_event_ids
            is_registered = event_id in registered_event_ids
            
            # 判断是即将参与还是已参与
            start_at = event.get("start_at", "")
            end_at = event.get("end_at", "")
            
            if not start_at:
                print(f"⚠️ 活动 {event_id} 没有开始时间")
                continue
            
            try:
                # 解析时间
                start_dt = parse_datetime(start_at)
                if not start_dt:
                    print(f"⚠️ 无法解析活动 {event_id} 的开始时间: {start_at}")
                    continue
                
                # 转换为 UTC 时间进行比较
                start_utc = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                
                # 格式化活动数据
                formatted_event = format_event_for_frontend(event, registration)
                if not formatted_event:
                    print(f"⚠️ 跳过活动 {event_id}，格式化失败")
                    continue
                
                # 标记是否为创建的活动（前端可能需要这个信息）
                formatted_event["isCreated"] = is_created
                formatted_event["isRegistered"] = is_registered
                # 添加报名人数
                formatted_event["registrationCount"] = event_registration_counts.get(event_id, 0)
                formatted_event["status"] = event.get("status", "PUBLISHED")
                
                # 如果活动开始时间在未来，则是即将参与
                if start_utc > now_utc:
                    upcoming_events.append(formatted_event)
                    role = "创建" if is_created else "参与"
                    print(f"✅ 即将{role}: {event.get('title')} ({start_at})")
                else:
                    past_events.append(formatted_event)
                    role = "创建" if is_created else "参与"
                    print(f"✅ 已{role}: {event.get('title')} ({start_at})")
            except Exception as e:
                print(f"❌ 处理活动 {event_id} 失败: {e}, start_at: {start_at}")
                import traceback
                traceback.print_exc()
                continue
        
        # 按开始时间排序（使用原始 start_at 时间）
        # upcoming: 按开始时间升序（最早的在前面）
        upcoming_events.sort(key=lambda x: parse_datetime(x.get("_start_at", "")) or datetime.min)
        # past: 按开始时间降序（最近的在前面）
        past_events.sort(key=lambda x: parse_datetime(x.get("_start_at", "")) or datetime.min, reverse=True)
        
        # 移除临时字段
        for event in upcoming_events + past_events:
            event.pop("_start_at", None)
        
        print(f"📋 最终结果: {len(upcoming_events)} 个即将参与/创建, {len(past_events)} 个已参与/创建")
        
        return {
            "upcoming": upcoming_events,
            "past": past_events
        }
        
    except Exception as e:
        print(f"❌ 查询用户活动失败: {e}")
        import traceback
        traceback.print_exc()
        # 出错时返回空数据，而不是抛出异常
        return {
            "upcoming": [],
            "past": []
        }

async def get_user_events(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    获取用户活动的统一入口
    优先使用优化的 RPC 方法，失败时回退到原方法
    """
    try:
        # 优先使用优化版本
        return await get_user_events_optimized(user_id)
    except Exception as e:
        print(f"⚠️ 优化方法失败，使用原方法: {e}")
        return await get_user_events_legacy(user_id)

def generate_mock_events() -> Dict[str, List[Dict[str, Any]]]:
    """
    生成 mock 活动数据
    符合前端 EventCard 组件的数据结构
    """
    now = datetime.now()
    
    # 即将到来的活动
    upcoming = [
        {
            "id": 1,
            "title": "Design Systems & The Future of AI       哈哈哈",
            "date": "NOV 14",
            "time": "7:00 PM",
            "location": "San Francisco, CA",
            "imageColor": "from-blue-400 to-purple-500",
            "category": "this-week",
            "isPinned": False
        },
        {
            "id": 2,
            "title": "HereNow Community Meetup",
            "date": "NOV 20",
            "time": "6:30 PM",
            "location": "Online Event",
            "imageColor": "from-[#FF6B3D] to-orange-400",
            "category": "this-month",
            "isPinned": False
        },
        {
            "id": 3,
            "title": "Product Design Workshop",
            "date": "DEC 02",
            "time": "10:00 AM",
            "location": "New York, NY",
            "imageColor": "from-emerald-400 to-teal-500",
            "category": "next-month",
            "isPinned": False
        },
        {
            "id": 6,
            "title": "React Conf 2024 Watch Party",
            "date": "NOV 16",
            "time": "8:00 PM",
            "location": "San Jose, CA",
            "imageColor": "from-pink-400 to-rose-500",
            "category": "this-week",
            "isPinned": False
        },
        {
            "id": 7,
            "title": "Figma Config Recap",
            "date": "NOV 25",
            "time": "5:00 PM",
            "location": "London, UK",
            "imageColor": "from-violet-400 to-fuchsia-500",
            "category": "this-month",
            "isPinned": False
        },
        {
            "id": 8,
            "title": "Tech & Coffee Morning",
            "date": "NOV 18",
            "time": "8:00 AM",
            "location": "Seattle, WA",
            "imageColor": "from-amber-400 to-orange-500",
            "category": "this-week",
            "isPinned": False
        },
        {
            "id": 9,
            "title": "AI in Healthcare Panel",
            "date": "DEC 05",
            "time": "6:00 PM",
            "location": "Boston, MA",
            "imageColor": "from-cyan-400 to-blue-500",
            "category": "next-month",
            "isPinned": False
        }
    ]
    
    # 过去的活动
    past = [
        {
            "id": 4,
            "title": "Q3 Town Hall Meeting",
            "date": "OCT 15",
            "time": "9:00 AM",
            "location": "Headquarters",
            "imageColor": "from-slate-400 to-slate-500",
            "category": "last-month",
            "isPinned": False
        },
        {
            "id": 5,
            "title": "Summer Hackathon Demo Day",
            "date": "AUG 28",
            "time": "2:00 PM",
            "location": "Tech Hub",
            "imageColor": "from-indigo-400 to-blue-500",
            "category": "last-3-months",
            "isPinned": False
        },
        {
            "id": 10,
            "title": "Team Building Retreat",
            "date": "SEP 10",
            "time": "All Day",
            "location": "Lake Tahoe",
            "imageColor": "from-teal-400 to-emerald-500",
            "category": "last-3-months",
            "isPinned": False
        },
        {
            "id": 11,
            "title": "Q2 Financial Review",
            "date": "JUL 15",
            "time": "10:00 AM",
            "location": "Online",
            "imageColor": "from-gray-400 to-slate-600",
            "category": "older",
            "isPinned": False
        }
    ]
    
    return {
        "upcoming": upcoming,
        "past": past
    }

@router.get("/home/events")
async def get_home_events(current_user: dict = Depends(get_current_user)):
    """
    获取首页活动数据
    返回用户参与的活动（即将参与和已参与）
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )
    
    # 从数据库查询用户的活动（参与 + 创建）
    events_data = await get_user_events(user_id)
    
    return {
        "success": True,
        "data": events_data
    }

async def get_user_communities_from_db(user_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    从数据库获取用户的社群数据
    包括用户创建的社群（作为 owner）和加入的社群
    """
    try:
        supabase = get_supabase()
        print(f"🔍 查询用户 {user_id} 的社群...")

        # 1. 查询用户创建的社群（通过 owner_id）
        my_communities_result = supabase.table("communities").select(
            "id, name, description, logo_url, cover_image_url, members_count, events_count, settings, created_at, updated_at"
        ).eq("owner_id", user_id).order("created_at", desc=True).execute()

        my_communities = []
        if my_communities_result.data:
            print(f"📊 找到 {len(my_communities_result.data)} 个创建的社群")
            for community in my_communities_result.data:
                my_communities.append({
                    "id": str(community.get("id")),
                    "name": community.get("name", ""),
                    "members": community.get("members_count", 0),
                    "avatar": "🎨",  # 默认头像，可以从 logo_url 获取
                    "color": "bg-purple-100",  # 默认颜色，可以从 settings 获取
                    "role": "Owner",
                    "isPinned": False,
                    "createdAt": community.get("created_at", "").split('T')[0] if community.get("created_at") else ""
                })
        else:
            print("ℹ️ 用户没有创建的社群")

        # 2. 查询用户加入的社群（通过 community_members 表）
        joined_communities_result = supabase.table("community_members").select(
            "community_id, role, status, joined_at, communities!inner(id, name, description, logo_url, cover_image_url, members_count, events_count, settings, created_at, updated_at)"
        ).eq("user_id", user_id).eq("status", "active").order("joined_at", desc=True).execute()

        joined_communities = []
        if joined_communities_result.data:
            print(f"📊 找到 {len(joined_communities_result.data)} 个加入的社群")
            for membership in joined_communities_result.data:
                community = membership.get("communities", {})
                joined_communities.append({
                    "id": str(community.get("id")),
                    "name": community.get("name", ""),
                    "members": community.get("members_count", 0),
                    "avatar": "🤖",  # 默认头像
                    "color": "bg-blue-100",  # 默认颜色
                    "role": membership.get("role", "member"),
                    "isPinned": False,
                    "joinedAt": membership.get("joined_at", "").split('T')[0] if membership.get("joined_at") else "",
                    "newPosts": 0  # 暂时设置为 0，后续可以从 posts 表获取
                })
        else:
            print("ℹ️ 用户没有加入的社群")

        print(f"📋 最终结果: {len(my_communities)} 个创建的社群, {len(joined_communities)} 个加入的社群")

        return {
            "myCommunities": my_communities,
            "joinedCommunities": joined_communities
        }

    except Exception as e:
        print(f"❌ 查询用户社群失败: {e}")
        import traceback
        traceback.print_exc()
        # 出错时返回空数据，而不是抛出异常
        return {
            "myCommunities": [],
            "joinedCommunities": []
        }

@router.get("/home/communities")
async def get_home_communities(current_user: dict = Depends(get_current_user)):
    """
    获取首页社群数据
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    communities_data = await get_user_communities_from_db(user_id)
    return {
        "success": True,
        "data": communities_data
    }

@router.get("/home/all")
async def get_home_all_data(current_user: dict = Depends(get_current_user)):
    """
    获取首页所有数据（活动和社群）
    需要认证
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户信息无效"
        )

    # 从数据库查询用户的活动（参与 + 创建）
    events_data = await get_user_events(user_id)
    # 从数据库查询用户的社群
    communities_data = await get_user_communities_from_db(user_id)

    return {
        "success": True,
        "data": {
            "events": events_data,
            "communities": communities_data
        }
    }

