"""
测试 Base64 解码 JWT Secret
"""
import base64
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

print("=" * 80)
print("JWT Secret Base64 解码测试")
print("=" * 80)

print(f"\n🔑 原始 JWT Secret (Base64):")
print(f"{SUPABASE_JWT_SECRET}")

try:
    # 尝试解码 Base64
    decoded_secret = base64.b64decode(SUPABASE_JWT_SECRET)
    print(f"\n✅ Base64 解码成功！")
    print(f"🔑 解码后的 Secret (原始字符串):")
    print(f"{decoded_secret.decode('utf-8')}")
    
    # 保存解码后的 Secret 到文件
    with open('.env.decoded', 'a') as f:
        f.write(f"\n# 解码后的 JWT Secret\n")
        f.write(f"SUPABASE_JWT_SECRET_DECODED={decoded_secret.decode('utf-8')}\n")
    
    print(f"\n✅ 已保存解码后的 Secret 到 .env.decoded 文件")
    
except Exception as e:
    print(f"\n❌ Base64 解码失败: {e}")
    print(f"💡 提示：JWT Secret 可能已经是原始字符串，不需要解码")

print("\n" + "=" * 80)
