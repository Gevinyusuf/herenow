"""
更新年度套餐配额并修复显示
"""
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def update_yearly_plan():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 获取 pro_monthly 的 limits
    monthly_response = supabase.table("plans").select("limits").eq("id", "pro_monthly").execute()
    if monthly_response.data:
        limits = monthly_response.data[0]["limits"]
        print(f"月度套餐配额: {limits}")

        # 更新 pro_yearly
        supabase.table("plans").update({"limits": limits}).eq("id", "pro_yearly").execute()
        print("✅ 年度套餐配额已更新")
    else:
        print("❌ 未找到月度套餐")

    # 验证
    print("\n验证套餐:")
    response = supabase.table("plans").select("id, name, limits").execute()
    for plan in response.data:
        if "pro" in plan["id"]:
            print(f"  {plan['id']}: {plan['name']}")
            print(f"    limits: {plan['limits']}")

if __name__ == "__main__":
    update_yearly_plan()
