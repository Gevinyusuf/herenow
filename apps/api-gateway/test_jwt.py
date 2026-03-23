"""
测试 JWT 验证
用于调试 JWT Token 验证问题
"""
import jwt
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_JWT_ALGORITHM = os.getenv("SUPABASE_JWT_ALGORITHM", "RS256")

print("=" * 80)
print("JWT 验证测试")
print("=" * 80)

print(f"\n🔑 JWT Secret: {SUPABASE_JWT_SECRET}")
print(f"🔑 JWT Algorithm: {SUPABASE_JWT_ALGORITHM}")

# 测试 Token（从浏览器 LocalStorage 复制）
test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

print(f"\n🔑 Test Token: {test_token}")

try:
    # 解码 Token Header
    header = jwt.get_unverified_header(test_token)
    print(f"\n✅ Token Header: {header}")
    print(f"🔍 Algorithm in header: {header.get('alg')}")
except Exception as e:
    print(f"\n❌ Failed to decode token header: {e}")

# 测试 RS256
try:
    print(f"\n🔐 Testing RS256 verification...")
    payload = jwt.decode(
        test_token,
        SUPABASE_JWT_SECRET,
        algorithms=["RS256"],
        audience="authenticated"
    )
    print(f"✅ RS256 verification successful!")
    print(f"📦 Payload: {payload}")
except Exception as e:
    print(f"❌ RS256 verification failed: {e}")

# 测试 HS256
try:
    print(f"\n🔐 Testing HS256 verification...")
    payload = jwt.decode(
        test_token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    print(f"✅ HS256 verification successful!")
    print(f"📦 Payload: {payload}")
except Exception as e:
    print(f"❌ HS256 verification failed: {e}")

print("\n" + "=" * 80)
print("测试完成")
print("=" * 80)
