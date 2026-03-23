'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CreditCard, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { getSubscriptionPlans, getMySubscription, createAlipayPayment, queryAlipayPayment } from '@/lib/api/client';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  is_free: boolean;
  features: string[];
  recommended: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  pending_payment?: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<{ payment_id: string; qr_code: string; amount: number } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showPaymentModal && paymentInfo?.payment_id) {
      startPaymentPolling();
    }
    return () => stopPaymentPolling();
  }, [showPaymentModal, paymentInfo?.payment_id]);

  const startPaymentPolling = () => {
    setPaymentPolling(true);
    const interval = setInterval(async () => {
      try {
        const result = await queryAlipayPayment(paymentInfo!.payment_id);
        if (result.success && result.status === 'completed') {
          setCurrentSubscription((prev: any) => prev ? { ...prev, status: 'active' } : null);
          setShowPaymentModal(false);
          setPaymentInfo(null);
          stopPaymentPolling();
          setShowSuccessModal(true);
          loadData();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
    (window as any).paymentPollingInterval = interval;
  };

  const stopPaymentPolling = () => {
    if ((window as any).paymentPollingInterval) {
      clearInterval((window as any).paymentPollingInterval);
      (window as any).paymentPollingInterval = null;
    }
    setPaymentPolling(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription()
      ]);

      setPlans(plansData);

      if (subscriptionData.subscription) {
        setCurrentSubscription(subscriptionData.subscription);
        const plan = plansData.find((p: Plan) => p.id === subscriptionData.subscription.plan_id);
        setCurrentPlan(plan || null);
      }
    } catch (err: any) {
      console.error('❌ 加载订阅数据失败:', err);
      setError(err.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(planId);
      setError(null);

      const result = await createAlipayPayment(planId);

      if (result.success && result.qr_code) {
        setPaymentInfo({
          payment_id: result.payment_id,
          qr_code: result.qr_code,
          amount: result.amount
        });
        setShowPaymentModal(true);
      } else {
        throw new Error(result.detail || '创建支付请求失败');
      }
    } catch (err: any) {
      console.error('❌ 订阅失败:', err);
      setError(err.message || '订阅失败，请重试');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '有效' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '已取消' },
      expired: { bg: 'bg-slate-100', text: 'text-slate-700', label: '已过期' },
      past_due: { bg: 'bg-orange-100', text: 'text-orange-700', label: '逾期' },
    };
    const config = statusMap[status] || statusMap.expired;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/home" className="p-2 hover:bg-slate-200 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
            <p className="text-sm text-slate-500">Choose the plan that fits your needs</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {currentSubscription && currentPlan && (
          <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Current Plan</h2>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-brand">{currentPlan.name}</span>
                  {getStatusBadge(currentSubscription.status)}
                </div>
                {currentSubscription.cancel_at_period_end && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ 订阅将在 {formatDate(currentSubscription.current_period_end)} 终止
                  </p>
                )}
                {!currentSubscription.cancel_at_period_end && currentSubscription.current_period_end && (
                  <p className="text-sm text-slate-500 mt-2">
                    下次扣款日期: {formatDate(currentSubscription.current_period_end)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans
            .filter((plan) => !plan.id.includes('beta'))
            .map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const isProcessing = processing === plan.id;
            const isYearlyUser = currentSubscription?.plan_id === 'pro_yearly';
            const isYearlyPlan = plan.id === 'pro_yearly';
            const isDowngrade = isYearlyUser && !isYearlyPlan;

            return (
              <div
                key={plan.id}
                className={`relative p-6 bg-white rounded-2xl border-2 transition-all ${
                  plan.recommended
                    ? 'border-brand shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white px-4 py-1 rounded-full text-xs font-bold">
                    Recommended
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-slate-900">
                      {plan.is_free ? 'Free' : `¥${plan.price}`}
                    </span>
                    {!plan.is_free && (
                      <span className="text-slate-500 text-sm">/ {plan.interval}</span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-6">{plan.description}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isProcessing || plan.is_free || isDowngrade}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : plan.is_free
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isDowngrade
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-brand hover:bg-orange-600 text-white shadow-lg hover:shadow-orange-500/25'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.is_free ? (
                    'Free Plan'
                  ) : isDowngrade ? (
                    'Not Available'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>All prices are in CNY (¥). Cancel anytime.</p>
          <p className="mt-1">Questions? Contact support@herenow.events</p>
        </div>
      </div>

      {showPaymentModal && paymentInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Scan to Pay</h3>
            <p className="text-center text-slate-500 text-sm mb-4">Amount: ¥{paymentInfo.amount}</p>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl mb-4">
              <QRCodeSVG
                value={paymentInfo.qr_code}
                size={200}
                level="H"
                includeMargin={true}
              />
              <p className="text-xs text-slate-400 mt-4">Payment ID: {paymentInfo.payment_id}</p>
            </div>

            <div className="text-center space-y-3">
              {paymentPolling ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Waiting for payment...</span>
                </div>
              ) : (
                <div className="text-slate-500 text-sm">
                  <p>Open Alipay app to scan the QR code</p>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800">
                  💡 Payment will be confirmed automatically once completed.
                  This page will refresh when your subscription is activated.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  stopPaymentPolling();
                  setShowPaymentModal(false);
                  setPaymentInfo(null);
                }}
                className="w-full py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
            <p className="text-slate-500 text-sm mb-6">Your subscription is now active. Thank you for your purchase!</p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/home');
              }}
              className="w-full py-3 rounded-xl font-bold bg-brand hover:bg-orange-600 text-white transition"
            >
              Great, Thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
