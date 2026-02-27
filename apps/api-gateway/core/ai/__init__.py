"""
AI 相关依赖模块
包含 AI 配额验证和管理的依赖函数
"""

from .dependencies import (
    verify_ai_quota,
    verify_ai_quota_by_type,
    verify_ai_text_generation_quota,
    verify_ai_image_generation_quota,
    verify_ai_chat_quota,
    verify_ai_planning_quota,
    verify_ai_import_quota,
    get_ai_quota_info,
    get_all_ai_quotas,
)

__all__ = [
    "verify_ai_quota",
    "verify_ai_quota_by_type",
    "verify_ai_text_generation_quota",
    "verify_ai_image_generation_quota",
    "verify_ai_chat_quota",
    "verify_ai_planning_quota",
    "verify_ai_import_quota",
    "get_ai_quota_info",
    "get_all_ai_quotas",
]

