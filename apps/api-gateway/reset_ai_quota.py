"""
重置用户 AI 配额脚本
用于测试目的
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def reset_user_quotas(user_id: str = None):
    """重置用户的所有 AI 配额"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # AI 功能配额 key 列表
    quota_keys = [
        "quota_ai_text_generation",
        "quota_ai_image_generation",
        "quota_ai_chat",
        "quota_ai_planning",
        "quota_ai_import"
    ]

    if user_id:
        # 重置指定用户的配额
        print(f"重置用户 {user_id} 的配额...")
        for key in quota_keys:
            response = supabase.table("usages").update({
                "count": 0,
            }).eq("user_id", user_id).eq("feature_key", key).execute()
            print(f"  {key}: 已重置 {len(response.data)} 条记录")
        print("完成！")
    else:
        # 重置所有用户的配额
        print("重置所有用户的配额...")
        for key in quota_keys:
            response = supabase.table("usages").update({
                "count": 0,
            }).eq("feature_key", key).execute()
            print(f"  {key}: 已重置 {len(response.data)} 条记录")
        print("完成！")

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    reset_user_quotas(user_id)
