"""
Supabase 客户端单例管理
优化高并发场景下的客户端创建和复用
"""
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

# 全局单例客户端
_supabase_client: Optional[Client] = None
_client_lock = None

# 尝试导入 threading（用于线程安全，虽然 FastAPI 是异步的，但为了保险）
try:
    import threading
    _client_lock = threading.Lock()
except ImportError:
    pass


def get_supabase_client() -> Client:
    """
    获取 Supabase 客户端单例（线程安全）
    
    使用单例模式确保：
    1. 所有请求复用同一个客户端实例
    2. 避免重复创建连接的开销
    3. 自动管理连接池（Supabase SDK 内部使用 httpx，自带连接池）
    
    Returns:
        Client: Supabase 客户端实例
        
    Raises:
        RuntimeError: 如果配置缺失或初始化失败
    """
    global _supabase_client
    
    # 双重检查锁定模式（Double-Checked Locking）
    if _supabase_client is None:
        if _client_lock:
            with _client_lock:
                # 再次检查，防止并发创建
                if _supabase_client is None:
                    _supabase_client = _create_client()
        else:
            # 如果没有锁，直接创建（FastAPI 是异步的，通常不会有问题）
            _supabase_client = _create_client()
    
    return _supabase_client


def _create_client() -> Client:
    """
    创建 Supabase 客户端实例
    
    Returns:
        Client: 新创建的 Supabase 客户端
        
    Raises:
        RuntimeError: 如果配置缺失或创建失败
    """
    SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    
    if not SUPABASE_URL:
        error_msg = "SUPABASE_URL environment variable is not set"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    if not SUPABASE_SERVICE_ROLE_KEY:
        error_msg = "SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    if not SUPABASE_URL.startswith(("http://", "https://")):
        error_msg = f"Invalid SUPABASE_URL format: {SUPABASE_URL}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    try:
        logger.info("Initializing Supabase client singleton...")
        client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized successfully")
        return client
    except Exception as e:
        error_msg = f"Failed to initialize Supabase client: {str(e)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


def reset_client():
    """
    重置客户端（用于测试或重新连接）
    注意：在生产环境中谨慎使用
    """
    global _supabase_client
    if _client_lock:
        with _client_lock:
            _supabase_client = None
    else:
        _supabase_client = None
    logger.info("Supabase client reset")


# 应用启动时预初始化客户端（可选，但推荐）
def initialize_client():
    """
    在应用启动时预初始化客户端
    这样可以：
    1. 提前发现配置错误
    2. 预热连接
    3. 避免第一个请求的延迟
    """
    try:
        get_supabase_client()
        logger.info("Supabase client pre-initialized on startup")
    except Exception as e:
        logger.warning(f"Failed to pre-initialize Supabase client: {e}")
        # 不抛出异常，允许延迟初始化

