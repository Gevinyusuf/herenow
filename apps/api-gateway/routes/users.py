"""
User routes - 用户相关路由
转发请求到 User Service
"""
from fastapi import APIRouter, Request, HTTPException, status
import httpx
import logging
from typing import Dict, Any

router = APIRouter()
logger = logging.getLogger(__name__)

USER_SERVICE_URL = "http://localhost:8001"

async def forward_to_user_service(
    method: str,
    path: str,
    request: Request,
    body: Dict[str, Any] = None
):
    """
    转发请求到 User Service
    
    Args:
        method: HTTP 方法 (GET, POST, PATCH, DELETE)
        path: 路径
        request: 原始请求对象
        body: 请求体（可选）
    
    Returns:
        User Service 的响应
    
    Raises:
        HTTPException: 如果 User Service 不可用或返回错误
    """
    url = f"{USER_SERVICE_URL}{path}"
    
    # 获取原始请求的 headers，但排除 host 等特定 headers
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, json=body, headers=headers)
            elif method == "PATCH":
                response = await client.patch(url, json=body, headers=headers)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise HTTPException(
                    status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
                    detail=f"Method {method} not allowed"
                )
            
            # 返回 User Service 的响应
            return response.json()
            
    except httpx.TimeoutException:
        logger.error(f"User Service timeout: {url}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="User Service timeout"
        )
    except httpx.ConnectError:
        logger.error(f"User Service connection failed: {url}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User Service unavailable"
        )
    except Exception as e:
        logger.error(f"Forward request failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/users/me")
async def get_user_profile(request: Request):
    """
    获取当前用户的资料信息
    转发到 User Service: GET /users/me
    """
    return await forward_to_user_service("GET", "/users/me", request)

@router.patch("/users/me")
async def update_user_profile(request: Request):
    """
    更新当前用户的资料信息
    转发到 User Service: PATCH /users/me
    """
    body = await request.json()
    return await forward_to_user_service("PATCH", "/users/me", request, body)

@router.get("/users/me/events")
async def get_user_events(request: Request):
    """
    获取当前用户的活动列表（创建的和参与的）
    转发到 User Service: GET /users/me/events
    """
    return await forward_to_user_service("GET", "/users/me/events", request)

@router.get("/users/me/communities")
async def get_user_communities(request: Request):
    """
    获取当前用户的社群列表（加入的和创建的）
    转发到 User Service: GET /users/me/communities
    """
    return await forward_to_user_service("GET", "/users/me/communities", request)
