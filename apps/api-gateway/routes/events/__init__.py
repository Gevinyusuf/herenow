"""
活动相关路由模块
统一导入和注册所有活动相关的路由
"""
from fastapi import APIRouter
from .create import router as create_router
from .view import router as view_router
from .manage import router as manage_router
from .contents import router as contents_router

# 创建主路由器
router = APIRouter()

# 注册子路由
router.include_router(create_router, tags=["events"])
router.include_router(view_router, tags=["events"])
router.include_router(manage_router, tags=["events"])
router.include_router(contents_router, tags=["events"])

