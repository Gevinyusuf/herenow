'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import WaitingListModal from '@/components/landing/WaitingListModal';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';

export default function ActivatePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [showWaitingListModal, setShowWaitingListModal] = useState(false);

  useEffect(() => {
    // Load invite code from sessionStorage if available
    const storedCode = sessionStorage.getItem('invite_code');
    if (storedCode) {
      setInviteCode(storedCode);
      // Clear from sessionStorage after loading
      sessionStorage.removeItem('invite_code');
    }
  }, []);

  useEffect(() => {
    // Redirect to home page if error count reaches 3
    if (errorCount >= 3) {
      setTimeout(() => {
        router.push('/');
      }, 2000); // Give user 2 seconds to see the error message
    }
  }, [errorCount, router]);

  const handleActivate = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in to activate');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Increment error count on failure
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);
        
        // Show error message with remaining attempts
        const remainingAttempts = 3 - newErrorCount;
        if (remainingAttempts > 0) {
          setError(`${data.detail || 'Failed to activate invite code'}. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`);
        } else {
          setError('Too many failed attempts. Redirecting to homepage...');
        }
        
        throw new Error(data.detail || 'Failed to activate invite code');
      }

      // Success - reset error count
      setErrorCount(0);
      setSuccess(true);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err) {
      // Error handling is done above, just ensure loading state is reset
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <WaitingListModal 
        isOpen={showWaitingListModal} 
        onClose={() => setShowWaitingListModal(false)} 
      />
      
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Activate Your Account</h1>
          <p className="text-slate-600">
            Enter your invite code to activate your account and get started
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Activation Successful!</h2>
            <p className="text-slate-600 mb-4">Redirecting you to your dashboard...</p>
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label htmlFor="invite-code" className="block text-sm font-medium text-slate-700 mb-2">
                Invite Code
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading && errorCount < 3) {
                    handleActivate();
                  }
                }}
                placeholder="Enter your invite code"
                disabled={isLoading || errorCount >= 3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={isLoading || !inviteCode.trim() || errorCount >= 3}
              className="w-full bg-brand text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:bg-brand/90 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Activating...</span>
                </>
              ) : (
                <span>Activate Account</span>
              )}
            </button>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowWaitingListModal(true)}
                className="w-full text-sm text-slate-600 hover:text-slate-900 underline transition-colors"
              >
                Don't have an invite code? Join our waiting list
              </button>
              <p className="text-xs text-slate-500 text-center">
                Contact support if you need assistance
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

