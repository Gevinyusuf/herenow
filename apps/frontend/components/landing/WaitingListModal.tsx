'use client';

import { useState } from 'react';
import { X, Zap, ArrowRight, PartyPopper } from 'lucide-react';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WaitingListModal({ isOpen, onClose }: WaitingListModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waiting list');
      }

      setIsLoading(false);
      setIsSubmitted(true);
      setEmail(''); // Reset email after successful submission
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>
        
        <div className="p-8">
          {!isSubmitted ? (
            <>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="text-brand w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Join the Waiting List</h3>
              <p className="text-slate-600 mb-6">
                We're working hard to bring HereNow to life. Be the first to know when we launch and get early access benefits.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    id="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null); // Clear error when user types
                    }}
                    placeholder="you@example.com" 
                    className={`w-full px-4 py-3 rounded-xl border ${
                      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20'
                    } outline-none transition-all`}
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-brand text-white py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Joining...' : 'Join Now'}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in bounce-in duration-500">
                <PartyPopper className="text-green-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">You're on the list!</h3>
              <p className="text-slate-600 mb-6">
                Thank you for your interest! We are currently accelerating development to bring you the best AI event experience. Stay tuned!
              </p>
              <button 
                onClick={handleClose}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

