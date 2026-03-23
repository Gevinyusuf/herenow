"""
诊断 AI 配额情况
"""
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_quotas():
    """检查配额情况"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 1. 检查 plans 表
    print("=" * 50)
    print("Plans 配额配置:")
    print("=" * 50)
    plans_response = supabase.table("plans").select("*").execute()
    for plan in plans_response.data:
        print(f"  Plan: {plan.get('name', 'Unknown')}")
        limits = plan.get('limits', {})
        print(f"    quota_ai_image_generation: {limits.get('quota_ai_image_generation', 'N/A')}")
        print(f"    quota_ai_text_generation: {limits.get('quota_ai_text_generation', 'N/A')}")
        print()

    # 2. 检查 usages 表
    print("=" * 50)
    print("Usages 表记录:")
    print("=" * 50)
    usages_response = supabase.table("usages").select("*").execute()
    if usages_response.data:
        for usage in usages_response.data:
            print(f"  User: {usage.get('user_id', 'Unknown')[:20]}...")
            print(f"    feature_key: {usage.get('feature_key')}")
            print(f"    count: {usage.get('count')}")
            print()
    else:
        print("  没有记录")

    # 3. 检查 subscriptions 表
    print("=" * 50)
    print("Subscriptions 表记录:")
    print("=" * 50)
    subs_response = supabase.table("subscriptions").select("*").execute()
    if subs_response.data:
        for sub in subs_response.data:
            print(f"  User: {sub.get('user_id', 'Unknown')[:20]}...")
            print(f"    plan_id: {sub.get('plan_id')}")
            print(f"    status: {sub.get('status')}")
            print()
    else:
        print("  没有记录")

if __name__ == "__main__":
    check_quotas()
