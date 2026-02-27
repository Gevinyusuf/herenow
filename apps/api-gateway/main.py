"""
API Gateway - 统一入口点
负责 JWT 验证、路由分发和请求转发
"""
from dotenv import load_dotenv
import os

# 加载 .env 文件中的环境变量
load_dotenv()

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.concurrency import iterate_in_threadpool
from core.auth.dependencies import get_current_user
from core.supabase_client import initialize_client
from routes import home, auth, events, ai
import logging

app = FastAPI(
    title="HereNow API Gateway",
    description="统一 API 网关，处理认证和路由分发",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
DEBUG_API_RESPONSE = os.getenv("DEBUG_API_RESPONSE", "false").lower() == "true"
DEBUG_API_RESPONSE_LIMIT = int(os.getenv("DEBUG_API_RESPONSE_LIMIT", "2000"))

# 应用启动时预初始化 Supabase 客户端
# 这样可以提前发现配置错误，预热连接，避免第一个请求的延迟
@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化操作"""
    try:
        initialize_client()
        logger.info("✅ Application startup completed")
    except Exception as e:
        logger.error(f"❌ Application startup error: {e}")
        # 不阻止应用启动，允许延迟初始化


@app.middleware("http")
async def debug_response_logger(request: Request, call_next):
    """
    Debug 模式下，统一打印返回前端的响应数据
    """
    response = await call_next(request)

    if not DEBUG_API_RESPONSE:
        return response

    try:
        body = getattr(response, "body", b"") or b""
        if not body and getattr(response, "body_iterator", None) is not None:
            collected_body = b""
            async for chunk in response.body_iterator:
                collected_body += chunk

            # body_iterator 被消费后需要重新赋值
            response.body_iterator = iterate_in_threadpool(iter([collected_body]))
            body = collected_body

        truncated_body = body[:DEBUG_API_RESPONSE_LIMIT]
        logger.info(
            f"[DEBUG RESPONSE] {request.method} {request.url.path} "
            f"status={response.status_code} length={len(body)} "
            f"body={truncated_body.decode('utf-8', errors='replace')}"
        )
        if len(body) > DEBUG_API_RESPONSE_LIMIT:
            logger.info(
                f"[DEBUG RESPONSE] 响应体已截断，原始长度 {len(body)} bytes"
            )

        # 保持正确的 content-length
        response.headers["content-length"] = str(len(body))
    except Exception as e:
        logger.error(f"[DEBUG RESPONSE] 记录响应失败: {e}")

    return response

# 添加全局异常处理器，捕获验证错误
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    处理 Pydantic 验证错误，返回详细的错误信息
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(x) for x in error.get("loc", []))
        message = error.get("msg", "验证失败")
        error_type = error.get("type", "unknown")
        errors.append({
            "field": field,
            "message": message,
            "type": error_type
        })
    
    # 记录详细错误信息
    logger.error(f"验证错误 - URL: {request.url}, 方法: {request.method}")
    logger.error(f"验证错误详情: {errors}")
    
    # 尝试读取请求体（如果可能）
    try:
        body = await request.body()
        if body:
            logger.error(f"请求体: {body.decode('utf-8')[:500]}")  # 限制长度
    except Exception as e:
        logger.error(f"无法读取请求体: {e}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": errors,
            "message": "数据验证失败，请检查以下字段"
        }
    )

# 注册路由
app.include_router(auth.router, prefix="/api/v1", tags=["认证"])
app.include_router(home.router, prefix="/api/v1", tags=["首页"])
app.include_router(events.router, prefix="/api/v1", tags=["活动"])
app.include_router(ai.router, prefix="/api/v1", tags=["AI"])

@app.get("/")
async def root():
    return {"message": "HereNow API Gateway", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

