'use client';

import { useState } from 'react';
import { X, UserPlus, Copy, Check } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityUrl: string;
  communityName: string;
}

export default function InviteModal({ isOpen, onClose, communityUrl, communityName }: InviteModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (typeof navigator !== 'undefined') {
      try {
        await navigator.clipboard.writeText(communityUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-300/50 p-6 w-full max-w-md border border-white/60 transform transition-all scale-100">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center text-center mb-6 mt-2">
          <div className="w-14 h-14 bg-orange-50 text-[#FF6B3D] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <UserPlus size={28} />
          </div>
          <h3 className="font-brand text-2xl font-bold text-slate-900">Invite Members</h3>
          <p className="text-slate-500 text-sm mt-2 px-4">
            Share this link with your friends or community to let them join <strong>{communityName}</strong>.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center gap-2 mb-6">
          <div className="flex-grow px-3 py-2 text-sm text-slate-600 font-medium truncate select-all">
            {communityUrl}
          </div>
          <button 
            onClick={handleCopyLink}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm ${
              isCopied 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="text-center">
          <button 
            onClick={onClose} 
            className="text-slate-400 text-sm hover:text-slate-600 font-medium transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

