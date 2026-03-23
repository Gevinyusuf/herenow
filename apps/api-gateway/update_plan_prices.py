"""
更新套餐价格
"""
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def update_plan_prices():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 更新价格
    updates = [
        ('free', 0),
        ('pro_monthly', 9.99),
        ('pro_yearly', 99.99),
        ('beta_tester', 0),
    ]

    for plan_id, price in updates:
        response = supabase.table("plans").update({"price": price}).eq("id", plan_id).execute()
        if response.data:
            print(f"✅ 更新 {plan_id}: ¥{price}")
        else:
            print(f"❌ 更新失败 {plan_id}")

    # 验证
    print("\n验证更新后的套餐:")
    response = supabase.table("plans").select("id, name, price").execute()
    for plan in response.data:
        print(f"  {plan['id']}: {plan['name']} - ¥{plan['price']}")

if __name__ == "__main__":
    update_plan_prices()
