"""
User Service - 用户服务
负责用户资料管理、用户活动列表、用户社群列表等功能
"""
from dotenv import load_dotenv
import os

# 加载 .env 文件中的环境变量
load_dotenv()

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client, initialize_client
from routes import users
import logging

app = FastAPI(
    title="HereNow User Service",
    description="用户服务，负责用户资料管理、用户活动列表、用户社群列表等功能",
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

# 应用启动时预初始化 Supabase 客户端
@app.on_event("startup")
async def startup_event():
    """应用启动时的初始化操作"""
    try:
        initialize_client()
        logger.info("✅ Application startup completed")
    except Exception as e:
        logger.error(f"❌ Application startup error: {e}")
        # 不阻止应用启动，允许延迟初始化

@app.get("/")
async def root():
    return {"message": "HereNow User Service", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# 注册路由
app.include_router(users.router, prefix="/api/v1", tags=["用户"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
