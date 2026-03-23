'use client';

import { Trash2 } from 'lucide-react';

interface DeleteTarget {
  type: 'member' | 'event' | 'post';
  id: number;
  name: string;
}

interface ConfirmModalProps {
  deleteTarget: DeleteTarget | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({ deleteTarget, onCancel, onConfirm }: ConfirmModalProps) {
  if (!deleteTarget) return null;

  const getTitle = () => {
    if (deleteTarget.type === 'member') return 'Remove Member?';
    if (deleteTarget.type === 'event') return 'Delete Event?';
    return 'Delete Post?';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 scale-100">
        <div className="mb-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
            <Trash2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {getTitle()}
          </h3>
          <p className="text-slate-500 text-sm">
            Are you sure you want to remove <span className="font-semibold text-slate-700">"{deleteTarget.name}"</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

