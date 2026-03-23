"""
支付宝支付路由 - 沙箱环境
"""
import time
import hmac
import hashlib
import base64
from fastapi import APIRouter, HTTPException, Form, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional

from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client
from services.alipay_service import (
    create_qr_code_payment,
    verify_notification,
    query_payment_status,
    ALIPAY_DEBUG,
)

router = APIRouter(prefix="/api/v1/alipay", tags=["alipay"])


class PaymentRequest(BaseModel):
    plan_id: str


class PaymentResponse(BaseModel):
    success: bool
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    message: str


@router.get("/pay/{payment_id}")
async def get_payment_url(payment_id: str, current_user: dict = None):
    """
    获取支付链接
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")

    user_id = current_user.get("sub")
    supabase = get_supabase_client()

    try:
        payment_response = supabase.table("pending_payments").select("*").eq("payment_id", payment_id).execute()

        if not payment_response.data:
            raise HTTPException(status_code=404, detail="支付记录不存在")

        payment = payment_response.data[0]

        if payment.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="无权访问此支付记录")

        if payment.get("status") == "completed":
            return {
                "success": True,
                "payment_url": None,
                "message": "支付已完成"
            }

        plan_response = supabase.table("plans").select("name", "price").eq("id", payment.get("plan_id")).execute()
        if not plan_response.data:
            raise HTTPException(status_code=404, detail="套餐不存在")

        plan = plan_response.data[0]

        payment_url = create_payment_url(
            out_trade_no=payment_id,
            subject=f"HereNow - {plan.get('name')}",
            total_amount=float(plan.get("price", 0)),
            body=f"订阅 {plan.get('name')} {plan.get('price')} CNY"
        )

        return {
            "success": True,
            "payment_url": payment_url,
            "payment_id": payment_id,
            "message": "支付链接已生成"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取支付链接失败: {str(e)}")


@router.post("/create-payment")
async def create_payment(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    创建支付请求（生成待支付记录并返回支付链接）
    """
    user_id = current_user.get("sub")
    supabase = get_supabase_client()

    try:
        plan_response = supabase.table("plans").select("*").eq("id", plan_id).execute()

        if not plan_response.data:
            raise HTTPException(status_code=404, detail="套餐不存在")

        plan = plan_response.data[0]

        if plan.get("price", 0) == 0:
            raise HTTPException(status_code=400, detail="免费套餐无需支付")

        payment_id = f"pay_{user_id[:8]}_{plan_id}_{int(time.time())}"

        payment_record = {
            "user_id": user_id,
            "plan_id": plan_id,
            "amount": plan.get("price"),
            "currency": "CNY",
            "status": "pending",
            "payment_id": payment_id,
        }

        supabase.table("pending_payments").insert(payment_record).execute()

        qr_result = create_qr_code_payment(
            out_trade_no=payment_id,
            subject=f"HereNow - {plan.get('name')}",
            total_amount=float(plan.get("price", 0)),
            body=f"订阅 {plan.get('name')} {plan.get('price')} CNY"
        )

        return {
            "success": True,
            "qr_code": qr_result.get("qr_code"),
            "payment_id": payment_id,
            "amount": plan.get("price"),
            "message": "支付二维码已生成"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建支付失败: {str(e)}")


@router.post("/notify")
async def alipay_notify(request: Request):
    """
    支付宝异步回调通知
    """
    try:
        form_data = await request.form()
        data = dict(form_data)

        signature = data.pop("sign", None)
        if not signature:
            return "fail"

        is_valid = verify_notification(data)
        if not is_valid:
            return "fail"

        out_trade_no = data.get("out_trade_no")
        trade_status = data.get("trade_status")
        trade_no = data.get("trade_no")

        supabase = get_supabase_client()

        if trade_status in ["TRADE_SUCCESS", "TRADE_FINISHED"]:
            payment_response = supabase.table("pending_payments").select("*").eq("payment_id", out_trade_no).execute()

            if not payment_response.data:
                return "fail"

            payment = payment_response.data[0]

            if payment.get("status") == "completed":
                return "success"

            user_id = payment.get("user_id")
            plan_id = payment.get("plan_id")

            from datetime import datetime
            from dateutil.relativedelta import relativedelta

            period_end = datetime.now()
            if plan_id == "pro_yearly":
                period_end = datetime.now() + relativedelta(years=1)
            else:
                period_end = datetime.now() + relativedelta(months=1)

            existing_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

            if existing_sub.data:
                supabase.table("subscriptions").update({
                    "plan_id": plan_id,
                    "status": "active",
                    "current_period_end": period_end.isoformat(),
                    "cancel_at_period_end": False,
                }).eq("user_id", user_id).execute()
            else:
                supabase.table("subscriptions").insert({
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "status": "active",
                    "current_period_end": period_end.isoformat(),
                }).execute()

            supabase.table("pending_payments").update({
                "status": "completed",
                "confirmed_at": "now()",
                "alipay_trade_no": trade_no,
            }).eq("payment_id", out_trade_no).execute()

            return "success"

        return "success"

    except Exception as e:
        print(f"Alipay notify error: {str(e)}")
        return "fail"


@router.get("/return")
async def alipay_return(request: Request):
    """
    支付宝同步回调（支付后跳转回网站）
    """
    return RedirectResponse(url="/pricing?payment=success")


@router.get("/query/{payment_id}")
async def query_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    查询支付状态
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="请先登录")

    user_id = current_user.get("sub")
    supabase = get_supabase_client()

    try:
        payment_response = supabase.table("pending_payments").select("*").eq("payment_id", payment_id).execute()

        if not payment_response.data:
            raise HTTPException(status_code=404, detail="支付记录不存在")

        payment = payment_response.data[0]

        if payment.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="无权访问此支付记录")

        if payment.get("status") == "completed":
            return {
                "success": True,
                "status": "completed",
                "message": "支付已完成"
            }

        result = query_payment_status(payment_id)

        if result.get("is_paid"):
            user_id = payment.get("user_id")
            plan_id = payment.get("plan_id")

            from datetime import datetime
            from dateutil.relativedelta import relativedelta

            existing_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

            if plan_id == "pro_yearly":
                if existing_sub.data:
                    current_end = existing_sub.data[0].get("current_period_end")
                    if current_end and current_end > datetime.now().isoformat():
                        remaining_days = (datetime.fromisoformat(current_end.replace("Z", "+00:00").replace("+00:00", "")) - datetime.now()).days
                        period_end = datetime.now() + relativedelta(years=1) + relativedelta(days=remaining_days)
                    else:
                        period_end = datetime.now() + relativedelta(years=1)
                else:
                    period_end = datetime.now() + relativedelta(years=1)

                if existing_sub.data:
                    supabase.table("subscriptions").update({
                        "plan_id": plan_id,
                        "status": "active",
                        "current_period_end": period_end.isoformat(),
                        "cancel_at_period_end": False,
                    }).eq("user_id", user_id).execute()
                else:
                    supabase.table("subscriptions").insert({
                        "user_id": user_id,
                        "plan_id": plan_id,
                        "status": "active",
                        "current_period_end": period_end.isoformat(),
                    }).execute()
            else:
                period_end = datetime.now() + relativedelta(months=1)
                if existing_sub.data:
                    supabase.table("subscriptions").update({
                        "plan_id": plan_id,
                        "status": "active",
                        "current_period_end": period_end.isoformat(),
                        "cancel_at_period_end": False,
                    }).eq("user_id", user_id).execute()
                else:
                    supabase.table("subscriptions").insert({
                        "user_id": user_id,
                        "plan_id": plan_id,
                        "status": "active",
                        "current_period_end": period_end.isoformat(),
                    }).execute()

            supabase.table("pending_payments").update({
                "status": "completed",
                "confirmed_at": "now()",
            }).eq("payment_id", payment_id).execute()

            return {
                "success": True,
                "status": "completed",
                "message": "支付已完成"
            }

        return {
            "success": True,
            "status": payment.get("status"),
            "trade_status": result.get("trade_status", "WAITING"),
            "message": "等待支付"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询支付失败: {str(e)}")
