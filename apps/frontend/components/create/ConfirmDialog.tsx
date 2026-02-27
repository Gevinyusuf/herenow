'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Start a New Event?',
  message = 'You have unsaved changes. Starting a new event will discard your current work.',
  confirmText = 'Start New Event',
  cancelText = 'Cancel'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-5 py-2.5 text-sm font-bold rounded-lg bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition-colors h-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-bold rounded-lg bg-[#FF6B3D] text-white hover:bg-[#E05D32] transition-colors h-auto shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

