"""
添加年度套餐
"""
import os
from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def add_yearly_plan():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 检查 pro_yearly 是否存在
    response = supabase.table("plans").select("id").eq("id", "pro_yearly").execute()

    if response.data:
        print("pro_yearly 已存在")
    else:
        # 获取 beta_tester 的 limits 作为模板
        beta_response = supabase.table("plans").select("limits").eq("id", "beta_tester").execute()
        limits = beta_response.data[0]["limits"] if beta_response.data else {}

        # 创建 pro_yearly
        supabase.table("plans").insert({
            "id": "pro_yearly",
            "name": "Pro Yearly",
            "price": 99.99,
            "interval": "year",
            "limits": limits
        }).execute()
        print("✅ 创建 pro_yearly: ¥99.99/年")

    # 验证
    print("\n所有套餐:")
    response = supabase.table("plans").select("id, name, price, interval").execute()
    for plan in response.data:
        print(f"  {plan['id']}: {plan['name']} - ¥{plan['price']}/{plan['interval']}")

if __name__ == "__main__":
    add_yearly_plan()
