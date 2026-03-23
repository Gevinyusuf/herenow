'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, ArrowLeft, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getPendingPayments, confirmPayment } from '@/lib/api/client';

interface Payment {
  payment_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingPayments();
      setPayments(data);
    } catch (err: any) {
      console.error('❌ 加载支付列表失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      setError(null);
      setSuccess(null);

      await confirmPayment(paymentId);

      setSuccess(`Payment ${paymentId} confirmed successfully!`);
      await loadPayments();
    } catch (err: any) {
      console.error('❌ 确认支付失败:', err);
      setError(err.message || '确认失败');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <h1 className="text-2xl font-bold text-slate-900">Pending Payments</h1>
            <p className="text-sm text-slate-500">Confirm user payments manually</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Pending Payments</h3>
            <p className="text-slate-500">All payment requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.payment_id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{payment.plan_name}</h3>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">User</p>
                        <p className="text-sm font-medium text-slate-900">{payment.user_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Email</p>
                        <p className="text-sm text-slate-900">{payment.user_email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Amount</p>
                        <p className="text-lg font-bold text-green-600">¥{payment.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Created</p>
                        <p className="text-sm text-slate-900">{formatDate(payment.created_at)}</p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Payment ID</p>
                      <p className="text-xs font-mono text-slate-700 break-all">{payment.payment_id}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleConfirm(payment.payment_id)}
                      disabled={processing === payment.payment_id}
                      className="px-6 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {processing === payment.payment_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirm Payment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
