'use client';

import { X, Mail } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export default function AuthModal({ isOpen, onClose, onLogin }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="text-center mb-8">
          <span className="font-logo text-3xl text-[#FF6B3D] tracking-wide block mb-2">HereNow</span>
          <h3 className="font-brand font-bold text-xl text-slate-900">Sign in to join</h3>
          <p className="text-slate-500 text-sm mt-1">Register for this event and join the discussion.</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={onLogin}
            className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
          >
            <span className="font-bold text-blue-600">G</span><span>Continue with Google</span>
          </button>
          <button 
            onClick={onLogin}
            className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Mail size={18} /><span>Continue with Email</span>
          </button>
        </div>
      </div>
    </div>
  );
}

