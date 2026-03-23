'use client';

import { X, AlertTriangle } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LeaveModal({ isOpen, onClose, onConfirm }: LeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-[#FF6B3D]" size={32} />
          </div>
          
          <h3 className="text-xl font-brand font-bold text-slate-900 mb-2">Leave Community?</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            You're on a <span className="font-bold text-[#FF6B3D]">1-day streak!</span> If you leave now, you'll lose your progress and badge.
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-colors"
            >
              Yes, Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

