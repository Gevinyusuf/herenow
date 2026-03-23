'use client';

import { X, Globe, Link as LinkIcon, Loader2, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importUrl: string;
  onImportUrlChange: (url: string) => void;
  importStatus: 'idle' | 'loading' | 'success' | 'error';
  onImport: () => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  importUrl,
  onImportUrlChange,
  importStatus,
  onImport,
}: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-10 animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FF6B3D]">
             <Globe size={32} />
          </div>
          <h3 className="text-2xl font-brand font-bold text-slate-900 mb-2">Import Event</h3>
          <p className="text-slate-500 leading-relaxed">
            Paste a link from your favorite platform, and we'll magically pull in all the details for you.
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              value={importUrl}
              onChange={(e) => {
                onImportUrlChange(e.target.value);
              }}
              placeholder="https://lu.ma/event/..." 
              className={`w-full bg-slate-50 border-2 ${importStatus === 'error' ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-[#FF6B3D]'} rounded-2xl pl-5 pr-12 py-4 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
               <LinkIcon size={20} />
            </div>
          </div>

          {/* Supported Platforms Hints */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Luma</span>
          </div>

          {/* Action Button */}
          <button 
            onClick={onImport}
            disabled={!importUrl || importStatus === 'loading' || importStatus === 'success'}
            className={`w-full py-4 rounded-2xl font-brand font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
              ${importStatus === 'success' 
                ? 'bg-green-500 text-white shadow-green-500/30' 
                : !importUrl 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {importStatus === 'loading' ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Fetching Details...</span>
              </>
            ) : importStatus === 'success' ? (
              <>
                <CheckCircle2 size={24} />
                <span>Imported Successfully!</span>
              </>
            ) : (
              <span>Import Event</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

