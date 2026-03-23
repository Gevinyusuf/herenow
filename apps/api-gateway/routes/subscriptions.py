"""
订阅管理路由 - 手动支付方案
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from core.auth.dependencies import get_current_user
from core.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


class PlanResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    interval: str
    is_free: bool
    features: List[str]
    recommended: bool = False


@router.get("/plans", response_model=Dict[str, Any])
async def get_plans():
    """
    获取所有可用的订阅套餐
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("plans").select("*").execute()

        plans = []
        for plan in response.data:
            limits = plan.get("limits", {})

            features = []
            if limits.get("feature_community"):
                features.append("Community Access")
            if limits.get("feature_discover"):
                features.append("Discover Feature")

            ai_quota = limits.get("quota_ai_text_generation", 0)
            if ai_quota > 0:
                features.append(f"AI Writing ({ai_quota}/month)")
            else:
                features.append("AI Writing (Basic)")

            ai_image_quota = limits.get("quota_ai_image_generation", 0)
            if ai_image_quota > 0:
                features.append(f"AI Image Gen ({ai_image_quota}/month)")

            plan_data = {
                "id": plan["id"],
                "name": plan.get("name", "Unknown Plan"),
                "description": plan.get("description", ""),
                "price": plan.get("price", 0),
                "interval": plan.get("interval", "month"),
                "is_free": plan.get("price", 0) == 0,
                "features": features,
                "recommended": plan["id"] == "pro_yearly",
            }
            plans.append(plan_data)

        return {"plans": plans}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取套餐列表失败: {str(e)}")


@router.get("/me")
async def get_my_subscription(current_user: Dict = Depends(get_current_user)):
    """
    获取当前用户的订阅信息
    """
    user_id = current_user.get("sub")
    supabase = get_supabase_client()

    try:
        sub_response = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

        if not sub_response.data:
            return {
                "subscription": None,
                "plan": None
            }

        subscription = sub_response.data[0]

        plan_response = supabase.table("plans").select("*").eq("id", subscription.get("plan_id")).execute()
        plan = plan_response.data[0] if plan_response.data else None

        return {
            "subscription": {
                "id": subscription.get("id"),
                "plan_id": subscription.get("plan_id"),
                "status": subscription.get("status"),
                "current_period_end": subscription.get("current_period_end"),
                "cancel_at_period_end": subscription.get("cancel_at_period_end"),
                "pending_payment": subscription.get("pending_payment", False),
            },
            "plan": {
                "id": plan.get("id") if plan else None,
                "name": plan.get("name") if plan else None,
                "price": plan.get("price") if plan else 0,
                "interval": plan.get("interval") if plan else None,
            } if plan else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取订阅信息失败: {str(e)}")


@router.post("/request-payment")
async def request_payment(
    plan_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    申请支付（生成待支付记录）
    用户选择套餐后，系统生成一个支付请求，等待管理员确认
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

        payment_id = f"pay_{user_id[:8]}_{plan_id}_{int(__import__('time').time())}"

        payment_record = {
            "user_id": user_id,
            "plan_id": plan_id,
            "amount": plan.get("price"),
            "currency": "CNY",
            "status": "pending",
            "payment_id": payment_id,
            "created_at": "now()",
        }

        supabase.table("pending_payments").insert(payment_record).execute()

        return {
            "success": True,
            "payment_id": payment_id,
            "amount": plan.get("price"),
            "currency": "CNY",
            "message": "支付请求已创建，请联系管理员完成支付"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建支付请求失败: {str(e)}")


@router.post("/confirm-payment/{payment_id}")
async def confirm_payment(
    payment_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """
    管理员确认支付（手动）
    """
    supabase = get_supabase_client()

    try:
        payment_response = supabase.table("pending_payments").select("*").eq("payment_id", payment_id).execute()

        if not payment_response.data:
            raise HTTPException(status_code=404, detail="支付记录不存在")

        payment = payment_response.data[0]

        if payment.get("status") != "pending":
            raise HTTPException(status_code=400, detail="支付已被处理")

        user_id = payment.get("user_id")
        plan_id = payment.get("plan_id")

        existing_sub = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()

        from datetime import datetime, timedelta
        from dateutil.relativedelta import relativedelta

        period_end = datetime.now()
        if plan_id == "pro_yearly":
            period_end = datetime.now() + relativedelta(years=1)
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
            "message": "支付已确认，订阅已激活"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"确认支付失败: {str(e)}")


@router.get("/pending-payments")
async def get_pending_payments(current_user: Dict = Depends(get_current_user)):
    """
    获取所有待处理的支付请求（管理员用）
    """
    supabase = get_supabase_client()

    try:
        response = supabase.table("pending_payments").select("*").eq("status", "pending").order("created_at", desc=True).execute()

        payments = []
        for payment in response.data:
            user_response = supabase.table("profiles").select("full_name", "email").eq("id", payment.get("user_id")).execute()
            user = user_response.data[0] if user_response.data else {}

            plan_response = supabase.table("plans").select("name").eq("id", payment.get("plan_id")).execute()
            plan_name = plan_response.data[0].get("name") if plan_response.data else "Unknown"

            payments.append({
                "payment_id": payment.get("payment_id"),
                "user_id": payment.get("user_id"),
                "user_name": user.get("full_name", ""),
                "user_email": user.get("email", ""),
                "plan_id": payment.get("plan_id"),
                "plan_name": plan_name,
                "amount": payment.get("amount"),
                "currency": payment.get("currency"),
                "created_at": payment.get("created_at"),
            })

        return {"payments": payments}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取待支付列表失败: {str(e)}")
