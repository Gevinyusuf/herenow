'use client';

interface ToastProps {
  message: string;
  show: boolean;
}

export default function Toast({ message, show }: ToastProps) {
  if (!show) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl transition-opacity duration-300 z-50 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {message}
    </div>
  );
}

