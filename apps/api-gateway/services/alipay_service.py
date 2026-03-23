"""
支付宝支付服务 - 沙箱环境
"""
import os
import base64
from datetime import datetime
from alipay import AliPay
from typing import Dict, Any, Optional

ALIPAY_APP_ID = os.getenv("ALIPAY_APP_ID", "9021000162630119")
ALIPAY_APP_PRIVATE_KEY_ORG = os.getenv("ALIPAY_APP_PRIVATE_KEY", "")
ALIPAY_ALIPAY_PUBLIC_KEY_ORG = os.getenv("ALIPAY_ALIPAY_PUBLIC_KEY", "")
ALIPAY_DEBUG = os.getenv("ALIPAY_DEBUG", "true").lower() == "true"


def _convert_pkcs8_to_pem(pkcs8_key: str) -> str:
    """将 PKCS#8 格式的密钥转换为 PEM 格式"""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    try:
        key_bytes = base64.b64decode(pkcs8_key)
        private_key = serialization.load_der_private_key(
            key_bytes, password=None, backend=default_backend()
        )
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        return pem.decode()
    except Exception:
        return pkcs8_key


def _convert_public_key_to_pem(pkcs8_key: str) -> str:
    """将 PKCS#8 格式的公钥转换为 PEM 格式"""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.backends import default_backend

    try:
        key_bytes = base64.b64decode(pkcs8_key)
        public_key = serialization.load_der_public_key(
            key_bytes, backend=default_backend()
        )
        pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode()
    except Exception:
        return pkcs8_key


ALIPAY_APP_PRIVATE_KEY = _convert_pkcs8_to_pem(ALIPAY_APP_PRIVATE_KEY_ORG)
ALIPAY_ALIPAY_PUBLIC_KEY = _convert_public_key_to_pem(ALIPAY_ALIPAY_PUBLIC_KEY_ORG)

alipay = AliPay(
    appid=ALIPAY_APP_ID,
    app_notify_url=None,
    app_private_key_string=ALIPAY_APP_PRIVATE_KEY,
    alipay_public_key_string=ALIPAY_ALIPAY_PUBLIC_KEY,
    sign_type="RSA2",
    debug=ALIPAY_DEBUG,
)

ALIPAY_RETURN_URL = os.getenv("ALIPAY_RETURN_URL", "http://localhost:3000/pricing")
ALIPAY_NOTIFY_URL = os.getenv("ALIPAY_NOTIFY_URL", "http://localhost:8000/api/v1/alipay/notify")


def create_qr_code_payment(
    out_trade_no: str,
    subject: str,
    total_amount: float,
    body: str = ""
) -> Dict[str, Any]:
    """
    创建支付宝扫码支付（当面付）

    Args:
        out_trade_no: 商户订单号
        subject: 订单标题
        total_amount: 订单金额
        body: 订单描述

    Returns:
        Dict: 包含 qr_code 和支付链接的字典
    """
    response = alipay.api_alipay_trade_precreate(
        out_trade_no=out_trade_no,
        subject=subject,
        total_amount=str(total_amount),
        body=body,
        timeout_express="15m",
        notify_url=ALIPAY_NOTIFY_URL,
    )

    qr_code = response.get("qr_code", "")
    return {
        "success": True,
        "qr_code": qr_code,
        "out_trade_no": out_trade_no,
    }


def verify_notification(data: Dict[str, Any]) -> bool:
    """
    验证支付宝回调通知签名

    Args:
        data: 回调数据

    Returns:
        bool: 签名验证是否通过
    """
    signature = data.pop("sign", None)
    if not signature:
        return False

    return alipay.verify(data, signature)


def query_payment_status(out_trade_no: str) -> Dict[str, Any]:
    """
    查询支付状态

    Args:
        out_trade_no: 商户订单号

    Returns:
        Dict: 支付状态信息
    """
    try:
        response = alipay.api_alipay_trade_query(out_trade_no=out_trade_no)
        response_dict = dict(response) if hasattr(response, 'items') else response

        trade_status = response_dict.get("trade_status", "")

        is_paid = trade_status in ["TRADE_FINISHED", "TRADE_SUCCESS"]

        return {
            "success": True,
            "trade_status": trade_status,
            "is_paid": is_paid,
            "out_trade_no": response_dict.get("out_trade_no", ""),
            "trade_no": response_dict.get("trade_no", ""),
            "buyer_logon_id": response_dict.get("buyer_logon_id", ""),
            "total_amount": response_dict.get("total_amount", ""),
            "receipt_amount": response_dict.get("receipt_amount", ""),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "is_paid": False,
            "out_trade_no": out_trade_no,
        }


def close_payment(out_trade_no: str) -> Dict[str, Any]:
    """
    关闭交易

    Args:
        out_trade_no: 商户订单号

    Returns:
        Dict: 操作结果
    """
    try:
        response = alipay.api_alipay_trade_close(out_trade_no=out_trade_no)
        return {
            "success": response.get("success", False),
            "out_trade_no": response.get("out_trade_no", ""),
            "trade_no": response.get("trade_no", ""),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }
