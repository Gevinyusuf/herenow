"""
Supabase client singleton for user service
"""
from supabase import Client, create_client
import os
import logging

logger = logging.getLogger(__name__)

_supabase_client: Client = None

def get_supabase_client() -> Client:
    """
    获取 Supabase 客户端（单例模式）
    """
    global _supabase_client
    
    if _supabase_client is None:
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
            
            _supabase_client = create_client(
                supabase_url=supabase_url,
                supabase_key=supabase_key
            )
            logger.info("✅ Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise
    
    return _supabase_client

def initialize_client():
    """
    预初始化 Supabase 客户端（在应用启动时调用）
    """
    try:
        get_supabase_client()
    except Exception as e:
        logger.warning(f"⚠️ Supabase client pre-initialization failed: {e}")
