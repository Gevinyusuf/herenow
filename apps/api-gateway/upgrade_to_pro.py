"""
将用户升级为 Pro 套餐
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def upgrade_to_pro(user_id: str = None, email: str = None):
    """将用户升级为 Pro 套餐"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 1. 获取所有可用的套餐
    print("=" * 50)
    print("可用套餐:")
    print("=" * 50)
    plans_response = supabase.table("plans").select("id, name, limits").execute()
    pro_plan_id = None
    for plan in plans_response.data:
        limits = plan.get('limits', {})
        print(f"  ID: {plan['id']}")
        print(f"    Name: {plan['name']}")
        print(f"    Features: {limits.get('feature_community', False)}, {limits.get('feature_discover', False)}")
        if 'pro' in plan['id'].lower() or 'pro' in plan['name'].lower():
            pro_plan_id = plan['id']
            print(f"    ⭐ 这是 Pro 套餐!")
        print()
    
    if not pro_plan_id:
        print("未找到 Pro 套餐，使用第一个套餐")
        pro_plan_id = plans_response.data[0]['id'] if plans_response.data else None

    # 2. 如果提供了 email，先查找 user_id
    if email and not user_id:
        print(f"通过邮箱查找用户: {email}")
        user_response = supabase.auth.admin.list_users()
        for user in user_response.users:
            if user.email == email:
                user_id = user.id
                print(f"找到用户 ID: {user_id}")
                break
    
    if not user_id:
        print("用法: python upgrade_to_pro.py <user_id> [email]")
        print("或者直接在脚本中修改 USER_ID 和 EMAIL 变量")
        return

    # 3. 更新用户的订阅
    print("=" * 50)
    print(f"升级用户 {user_id} 为 Pro 套餐...")
    print("=" * 50)

    # 检查是否已有订阅
    existing_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
    
    if existing_sub.data:
        # 更新现有订阅
        print(f"更新现有订阅 (ID: {existing_sub.data[0]['id']})...")
        response = supabase.table("subscriptions").update({
            "plan_id": pro_plan_id,
            "status": "active"
        }).eq("user_id", user_id).execute()
        print(f"✅ 订阅已更新!")
    else:
        # 创建新订阅
        print("创建新的 Pro 订阅...")
        response = supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan_id": pro_plan_id,
            "status": "active"
        }).execute()
        print(f"✅ 订阅已创建!")

    # 4. 验证更新
    print("\n验证更新后的订阅状态:")
    updated_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
    if updated_sub.data:
        sub = updated_sub.data[0]
        print(f"  Plan ID: {sub['plan_id']}")
        print(f"  Status: {sub['status']}")
    
    print("\n完成!")

if __name__ == "__main__":
    user_id = None
    email = None
    
    if len(sys.argv) > 1:
        user_id = sys.argv[1]
    if len(sys.argv) > 2:
        email = sys.argv[2]
    
    upgrade_to_pro(user_id, email)
