"""
AI 生成相关路由
处理 AI 内容生成请求，包括配额验证和链接导入
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from core.auth.dependencies import get_current_user
from core.ai.dependencies import verify_ai_quota_by_type, get_all_ai_quotas
from core.ai.openrouter_service import get_openrouter_service
from core.supabase_client import get_supabase_client
from core.scraper import LumaScraper, LumaDataMapper
from core.scraper.exceptions import ScraperError, InvalidURLError, NetworkError, ParseError, TimeoutError as ScraperTimeoutError
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal, List
from supabase import Client
import logging
import base64
import io
import os

logger = logging.getLogger(__name__)

router = APIRouter()


class AIGenerateRequest(BaseModel):
    """AI 生成请求模型"""
    type: Literal["text_generation", "image_generation", "chat", "planning", "import"]
    prompt: str
    context: Optional[Dict[str, Any]] = None
    options: Optional[Dict[str, Any]] = None


class AIGenerateResponse(BaseModel):
    """AI 生成响应模型"""
    success: bool
    data: Any  # 可以是字符串（文本生成）或字典（图片生成）
    message: Optional[str] = None
    quota: Optional[Dict[str, Any]] = None


class QuotaInfo(BaseModel):
    """配额信息模型"""
    used: int
    total: int
    remaining: int


class AIQuotaResponse(BaseModel):
    """AI 配额查询响应模型"""
    success: bool
    data: Dict[str, QuotaInfo]
    message: Optional[str] = None


class ImportFromLinkRequest(BaseModel):
    """从链接导入活动的请求模型"""
    url: str
    host_id: Optional[str] = None  # 可选，默认使用当前用户


class ImportFromLinkResponse(BaseModel):
    """从链接导入活动的响应模型"""
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None


class ImportFromImageResponse(BaseModel):
    """从图片导入活动的响应模型"""
    success: bool
    data: Dict[str, Any]
    message: Optional[str] = None


@router.post("/ai/generate", response_model=AIGenerateResponse)
async def generate_content(
    request: AIGenerateRequest,
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    生成 AI 内容
    
    这个端点会在执行 AI 生成逻辑之前自动验证并扣减配额。
    如果能进入这个函数，说明：
    1. 用户已通过 JWT 认证
    2. 配额检查通过
    3. 配额已成功扣减（原子性操作）
    
    Args:
        request: AI 生成请求，包含 type、prompt、context 和 options
        current_user: 当前用户信息（通过依赖注入自动获取）
        supabase: Supabase 客户端（通过依赖注入自动获取）
        
    Returns:
        AIGenerateResponse: 生成的 AI 内容
        
    Raises:
        HTTPException: 如果配额不足或其他错误
    """
    # 临时跳过配额检查（用于测试）
    if os.getenv("SKIP_AI_QUOTA_CHECK", "false").lower() != "true":
        # 根据 request.type 验证并扣减对应的配额
        await verify_ai_quota_by_type(request.type, current_user, supabase)
    else:
        logger.info("⚠️ AI 配额检查已跳过（SKIP_AI_QUOTA_CHECK=true）")
    
    # 只要能进到这里，说明数据库已经扣费成功了
    # 开始运行昂贵的 AI 逻辑...
    
    try:
        # 获取 OpenRouter 服务
        openrouter_service = get_openrouter_service()
        
        # 根据类型调用不同的生成逻辑
        if request.type == "image_generation":
            # 图片生成：先优化提示词，然后生成图片
            generated_content = await openrouter_service.generate_image(
                prompt=request.prompt,
                options=request.options
            )
        else:
            # 文本生成：直接调用文本生成 API
            # 对于 chat 类型，可以从 context 中提取对话历史
            conversation_history = None
            if request.type == "chat" and request.context:
                conversation_history = request.context.get("conversation_history")
            
            generated_content = await openrouter_service.generate_text(
                prompt=request.prompt,
                ai_type=request.type,
                context=request.context,
                options=request.options,
                conversation_history=conversation_history
            )
        
        # 获取更新后的配额信息（可选）
        from core.ai.dependencies import get_ai_quota_info, AI_QUOTA_MAPPING
        feature_key = AI_QUOTA_MAPPING.get(request.type)
        quota_info = None
        if feature_key:
            quota_info = await get_ai_quota_info(
                current_user.get("sub"),
                supabase,
                feature_key
            )
        
        return AIGenerateResponse(
            success=True,
            data=generated_content,
            message=f"AI {request.type} 内容生成成功",
            quota=quota_info
        )
        
    except HTTPException:
        # 重新抛出 HTTP 异常（如配额不足等）
        raise
    except Exception as e:
        # 记录错误
        logger.error(f"AI generation failed for type {request.type}: {str(e)}", exc_info=True)
        # 如果 AI 生成失败，可以考虑回滚配额（可选）
        # 但通常建议不回滚，因为配额已经消耗了
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}"
        )


@router.get("/ai/quota", response_model=AIQuotaResponse)
async def get_ai_quota(
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    获取当前用户的所有 AI 配额信息
    不需要扣减配额，只是查询
    
    Args:
        current_user: 当前用户信息
        supabase: Supabase 客户端
        
    Returns:
        AIQuotaResponse: 包含所有 AI 功能配额信息的响应
    """
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    try:
        # 获取所有 AI 功能的配额信息
        quotas = await get_all_ai_quotas(user_id, supabase)
        
        # 转换为响应格式
        quota_data = {}
        for feature_key, quota_info in quotas.items():
            quota_data[feature_key] = QuotaInfo(**quota_info)
        
        return AIQuotaResponse(
            success=True,
            data=quota_data,
            message="Quota information retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to get quota info for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve quota information: {str(e)}"
        )


@router.post("/ai/import-from-link", response_model=ImportFromLinkResponse)
async def import_from_link(
    request: ImportFromLinkRequest,
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    从 Luma 活动链接导入活动数据
    
    这个端点会：
    1. 验证并扣减 "import" 类型的 AI 配额
    2. 爬取 Luma 活动页面数据
    3. 将数据映射到 events_v1 表结构
    4. 保存到数据库
    
    Args:
        request: 导入请求，包含 Luma 活动 URL
        current_user: 当前用户信息
        supabase: Supabase 客户端
        
    Returns:
        ImportFromLinkResponse: 导入结果，包含创建的活动信息
        
    Raises:
        HTTPException: 如果配额不足、URL 无效、爬取失败或其他错误
    """
    # 临时跳过配额检查（用于测试）
    if os.getenv("SKIP_AI_QUOTA_CHECK", "false").lower() != "true":
        # 验证并扣减 "import" 类型的配额
        await verify_ai_quota_by_type("import", current_user, supabase)
    else:
        logger.info("⚠️ AI Import 配额检查已跳过（SKIP_AI_QUOTA_CHECK=true）")

    # 获取用户 ID（作为活动主办方）
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    # 使用请求中的 host_id 或默认使用当前用户 ID
    host_id = request.host_id or user_id
    
    # 验证 host_id 是否存在于 profiles 表中
    try:
        profile_check = supabase.table("profiles").select("id").eq("id", host_id).execute()
        if not profile_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"主办方 ID {host_id} 在系统中不存在。请先创建个人资料。"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"检查 profiles 表时出错: {str(e)}")
        # 不阻止继续，让数据库外键约束处理
    
    # 初始化爬虫
    scraper = None
    try:
        scraper = LumaScraper()
        
        # 爬取活动数据
        logger.info(f"开始爬取 Luma 活动: {request.url}")
        luma_data = await scraper.scrape(request.url)
        
        # 映射数据到 events_v1 结构
        logger.info("映射数据到 events_v1 结构...")
        mapper = LumaDataMapper()
        event_data = await mapper.map_to_events_v1(luma_data, host_id)
        
        # 确保 slug 唯一性
        slug = event_data["slug"]
        existing = supabase.table("events_v1").select("id").eq("slug", slug).execute()
        if existing.data:
            # 如果 slug 已存在，添加时间戳
            import time
            slug = f"{slug}-{int(time.time())}"
            event_data["slug"] = slug
        
        # 插入数据库
        logger.info("保存活动到数据库...")
        result = supabase.table("events_v1").insert(event_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="创建活动失败，数据库未返回数据"
            )
        
        created_event = result.data[0]
        
        logger.info(f"成功导入活动: {created_event.get('id')}")
        
        return ImportFromLinkResponse(
            success=True,
            data={
                "id": created_event["id"],
                "slug": created_event["slug"],
                "title": created_event["title"],
                "source_url": request.url
            },
            message="活动导入成功"
        )
        
    except InvalidURLError as e:
        logger.error(f"无效的 URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无效的 URL: {str(e)}"
        )
    except NetworkError as e:
        logger.error(f"网络错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"无法访问活动页面: {str(e)}"
        )
    except ScraperTimeoutError as e:
        logger.error(f"爬取超时: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"爬取超时: {str(e)}"
        )
    except ParseError as e:
        logger.error(f"数据解析错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"无法解析活动数据: {str(e)}"
        )
    except ScraperError as e:
        logger.error(f"爬虫错误: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"爬取失败: {str(e)}"
        )
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        logger.error(f"导入活动失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"导入活动失败: {str(e)}"
        )
    finally:
        # 清理资源
        if scraper:
            try:
                await scraper.close()
            except Exception as e:
                logger.warning(f"关闭爬虫时出错: {str(e)}")


@router.post("/ai/import-from-image", response_model=ImportFromImageResponse)
async def import_from_image(
    image: UploadFile = File(...),
    additional_text: Optional[str] = Form(None),
    host_id: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_client)
):
    """
    从活动海报图片导入活动数据
    
    这个端点会：
    1. 验证并扣减 "import" 类型的 AI 配额
    2. 使用 AI 视觉模型分析图片，提取活动信息
    3. 将数据映射到 events_v1 表结构
    4. 保存到数据库
    
    Args:
        image: 上传的图片文件
        additional_text: 可选的附加文本描述
        host_id: 可选的主办方 ID，默认使用当前用户
        current_user: 当前用户信息
        supabase: Supabase 客户端
        
    Returns:
        ImportFromImageResponse: 导入结果，包含创建的活动信息
        
    Raises:
        HTTPException: 如果配额不足、图片无效、AI 分析失败或其他错误
    """
    # 临时跳过配额检查（用于测试）
    if os.getenv("SKIP_AI_QUOTA_CHECK", "false").lower() != "true":
        # 验证并扣减 "import" 类型的配额
        await verify_ai_quota_by_type("import", current_user, supabase)
    else:
        logger.info("⚠️ AI Import (图片) 配额检查已跳过（SKIP_AI_QUOTA_CHECK=true）")

    # 获取用户 ID（作为活动主办方）
    user_id = current_user.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    
    # 使用请求中的 host_id 或默认使用当前用户 ID
    host_id = host_id or user_id
    
    # 验证 host_id 是否存在于 profiles 表中
    try:
        profile_check = supabase.table("profiles").select("id").eq("id", host_id).execute()
        if not profile_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"主办方 ID {host_id} 在系统中不存在。请先创建个人资料。"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"检查 profiles 表时出错: {str(e)}")
    
    # 验证图片格式
    allowed_content_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"]
    if image.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的图片格式。支持的格式: JPEG, PNG, GIF, WebP, BMP, SVG"
        )
    
    # 读取图片数据
    try:
        image_data = await image.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        image_data_url = f"data:{image.content_type};base64,{image_base64}"
    except Exception as e:
        logger.error(f"读取图片数据失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"无法读取图片数据: {str(e)}"
        )
    
    # 使用 AI 服务提取活动信息
    try:
        openrouter_service = get_openrouter_service()
        
        # 构建提示词
        prompt = """Analyze this event poster image and extract all relevant event information. 
Please extract the following information if available:
- Event title
- Event description
- Date and time
- Location (venue name and address)
- Ticket information (price, availability)
- Host/Organizer information
- Any other relevant details

Return the information in a structured format that can be used to create an event listing."""
        
        if additional_text:
            prompt += f"\n\nAdditional context provided by user: {additional_text}"
        
        # 调用 AI 视觉模型分析图片
        # 使用 OpenRouter 的视觉模型（支持图片输入）
        extracted_text = await openrouter_service.analyze_image(
            image_data_url=image_data_url,
            prompt=prompt,
            ai_type="import"
        )
        
        # 解析提取的文本，转换为活动数据
        # 这里可以使用 LLM 进一步结构化数据
        structured_prompt = f"""Based on the following extracted information from an event poster, create a structured JSON object with event details in Luma format.

Extracted information:
{extracted_text}

Please return a JSON object with the following structure (matching Luma event format):
{{
  "name": "event title (REQUIRED - must not be empty)",
  "description": "event description",
  "start_at": "ISO 8601 datetime string (e.g., 2024-12-25T18:00:00Z) (REQUIRED)",
  "end_at": "ISO 8601 datetime string (e.g., 2024-12-25T20:00:00Z) (REQUIRED - if not found, estimate 2 hours after start_at)",
  "timezone": "timezone string (e.g., America/New_York or UTC)",
  "location_type": "offline or online",
  "location": {{
    "venue_name": "venue name",
    "address": "full address",
    "city": "city",
    "state": "state (optional)",
    "country": "country",
    "postal_code": "postal code (optional)"
  }},
  "tickets": [
    {{
      "name": "ticket type name (e.g., General Admission)",
      "price": 0.0,
      "currency": "USD",
      "quantity": null
    }}
  ],
  "cover_image_url": null
}}

IMPORTANT RULES:
1. "name" field is REQUIRED and must not be empty. If you cannot find an event title, use "Event" as default.
2. "start_at" is REQUIRED. If only date is found, use 18:00:00 as default time. If no date found, use today's date.
3. "end_at" is REQUIRED. If not found, calculate it as 2 hours after start_at.
4. Use ISO 8601 format for datetime strings (YYYY-MM-DDTHH:MM:SSZ).
5. If location is not found, set location_type to "online" and location to empty object.
6. If tickets are not found, create a default free ticket: {{"name": "Free", "price": 0.0, "currency": "USD", "quantity": null}}

Return ONLY the JSON object, no additional text or markdown formatting."""
        
        structured_data_text = await openrouter_service.generate_text(
            prompt=structured_prompt,
            ai_type="import"
        )
        
        # 解析 JSON（移除可能的 markdown 代码块标记）
        import json
        import re
        structured_data_text = re.sub(r'```json\s*', '', structured_data_text)
        structured_data_text = re.sub(r'```\s*', '', structured_data_text)
        structured_data_text = structured_data_text.strip()
        
        try:
            event_data = json.loads(structured_data_text)
        except json.JSONDecodeError as e:
            logger.error(f"解析 AI 返回的 JSON 失败: {str(e)}")
            logger.error(f"原始文本: {structured_data_text}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="无法解析从图片中提取的活动信息。请确保图片包含清晰的活动信息。"
            )
        
        # 验证和补充必填字段
        from datetime import datetime, timedelta
        
        # 确保 name 字段存在
        if not event_data.get("name") or not event_data["name"].strip():
            event_data["name"] = "Event"
            logger.warning("活动名称未找到，使用默认值 'Event'")
        
        # 确保 start_at 字段存在
        if not event_data.get("start_at"):
            # 使用当前时间 + 1 天作为默认值
            default_start = (datetime.now() + timedelta(days=1)).replace(hour=18, minute=0, second=0, microsecond=0)
            event_data["start_at"] = default_start.isoformat() + "Z"
            logger.warning("活动开始时间未找到，使用默认值（明天 18:00）")
        
        # 确保 end_at 字段存在
        if not event_data.get("end_at"):
            try:
                # 尝试从 start_at 计算 end_at（默认 2 小时后）
                start_dt = datetime.fromisoformat(event_data["start_at"].replace("Z", "+00:00"))
                end_dt = start_dt + timedelta(hours=2)
                event_data["end_at"] = end_dt.isoformat().replace("+00:00", "Z")
                logger.warning("活动结束时间未找到，使用默认值（开始时间 + 2 小时）")
            except Exception as e:
                # 如果解析失败，使用当前时间 + 1 天 20:00
                default_end = (datetime.now() + timedelta(days=1)).replace(hour=20, minute=0, second=0, microsecond=0)
                event_data["end_at"] = default_end.isoformat() + "Z"
                logger.warning(f"解析开始时间失败: {str(e)}，使用默认结束时间")
        
        # 确保 timezone 字段存在
        if not event_data.get("timezone"):
            event_data["timezone"] = "UTC"
        
        # 确保 location_type 字段存在
        if not event_data.get("location_type"):
            event_data["location_type"] = "offline" if event_data.get("location", {}).get("venue_name") else "online"
        
        # 确保 tickets 字段存在
        if not event_data.get("tickets") or len(event_data.get("tickets", [])) == 0:
            event_data["tickets"] = [{
                "name": "Free",
                "price": 0.0,
                "currency": "USD",
                "quantity": None
            }]
        
        logger.info(f"提取的活动数据: name={event_data.get('name')}, start_at={event_data.get('start_at')}, end_at={event_data.get('end_at')}")
        
        # 使用 LumaDataMapper 映射数据（复用现有的映射逻辑）
        mapper = LumaDataMapper()
        mapped_data = await mapper.map_to_events_v1(event_data, host_id)
        
        # 确保 slug 唯一性
        import time
        original_slug = mapped_data.get("slug", "")
        slug = original_slug
        counter = 1
        while True:
            check_result = supabase.table("events_v1").select("id").eq("slug", slug).execute()
            if not check_result.data:
                break
            slug = f"{original_slug}-{int(time.time())}-{counter}"
            counter += 1
        mapped_data["slug"] = slug
        
        # 保存到数据库
        insert_result = supabase.table("events_v1").insert(mapped_data).execute()
        
        if not insert_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="保存活动数据失败"
            )
        
        created_event = insert_result.data[0]
        
        logger.info(f"成功从图片导入活动: {created_event.get('id')} - {created_event.get('title')}")
        
        return ImportFromImageResponse(
            success=True,
            data={
                "id": created_event["id"],
                "slug": created_event["slug"],
                "title": created_event["title"],
                "source": "image_upload"
            },
            message="活动导入成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"从图片导入活动失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"从图片导入活动失败: {str(e)}"
        )

