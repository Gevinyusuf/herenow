"""
修复用户 AI 配额
1. 创建 subscription 记录
2. 初始化 usages 记录
"""
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 你的用户 ID - 需要替换
USER_ID = "your-user-id-here"

def fix_quotas():
    """修复配额"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 1. 首先获取 Beta Plan 的 ID
    print("=" * 50)
    print("获取 Beta Plan ID...")
    print("=" * 50)
    plans_response = supabase.table("plans").select("id, name").execute()
    beta_plan_id = None
    free_plan_id = None
    for plan in plans_response.data:
        if plan.get('name') == 'Beta Tester':
            beta_plan_id = plan.get('id')
            print(f"  Beta Tester Plan ID: {beta_plan_id}")
        elif plan.get('name') == 'Free Plan':
            free_plan_id = plan.get('id')
            print(f"  Free Plan ID: {free_plan_id}")

    if not beta_plan_id:
        print("  未找到 Beta Plan，使用 Free Plan")
        beta_plan_id = free_plan_id

    # 2. 创建或更新 subscription
    print("\n" + "=" * 50)
    print("创建 Subscription...")
    print("=" * 50)

    # 检查是否已有 subscription
    existing_sub = supabase.table("subscriptions").select("*").eq("user_id", USER_ID).execute()
    if existing_sub.data:
        print(f"  用户已有 subscription，更新为 Beta Plan...")
        sub_response = supabase.table("subscriptions").update({
            "plan_id": beta_plan_id,
            "status": "active"
        }).eq("user_id", USER_ID).execute()
    else:
        print(f"  创建新的 subscription...")
        sub_response = supabase.table("subscriptions").insert({
            "user_id": USER_ID,
            "plan_id": beta_plan_id,
            "status": "active"
        }).execute()
    print(f"  完成!")

    # 3. 重置所有 AI 配额
    print("\n" + "=" * 50)
    print("重置 AI 配额...")
    print("=" * 50)
    quota_keys = [
        "quota_ai_text_generation",
        "quota_ai_image_generation",
        "quota_ai_chat",
        "quota_ai_planning",
        "quota_ai_import"
    ]

    for key in quota_keys:
        # 检查是否已有记录
        existing = supabase.table("usages").select("id").eq("user_id", USER_ID).eq("feature_key", key).execute()
        if existing.data:
            # 更新为 0
            supabase.table("usages").update({"count": 0}).eq("user_id", USER_ID).eq("feature_key", key).execute()
            print(f"  {key}: 已重置")
        else:
            # 插入新记录
            supabase.table("usages").insert({
                "user_id": USER_ID,
                "feature_key": key,
                "count": 0
            }).execute()
            print(f"  {key}: 已创建并重置")

    print("\n完成!")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        USER_ID = sys.argv[1]
    else:
        print("用法: python fix_user_quota.py <user_id>")
        print("或者直接在脚本中修改 USER_ID 变量")
        sys.exit(1)
    fix_quotas()
