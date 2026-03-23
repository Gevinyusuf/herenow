'use client';

import { useEffect } from 'react';
import { X, Crown, ArrowRight } from 'lucide-react';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function PermissionModal({ 
  isOpen, 
  onClose,
  featureName = 'Communities'
}: PermissionModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-[#FF6B3D] to-[#FF855F] px-6 py-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade Required
          </h2>
          <p className="text-white/80 text-sm">
            Unlock premium features with a subscription
          </p>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-6 border border-orange-100">
            <p className="text-slate-700 text-center leading-relaxed">
              Your current plan does not support access to <span className="font-bold text-[#FF6B3D]">{featureName}</span> feature
            </p>
            <p className="text-slate-500 text-center text-sm mt-2">
              Please upgrade your plan to use this feature
            </p>
          </div>
          
          {/* Features list */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Create and manage communities</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Post community updates and events</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Invite members to join communities</span>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF6B3D] to-[#FF855F] hover:from-[#E05D32] hover:to-[#FF6B3D] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              Upgrade Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
