'use client';

import { X, Ticket } from 'lucide-react';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  newCoupon: { code: string; discount: string; type: 'percent' | 'fixed' };
  onCouponChange: (coupon: { code: string; discount: string; type: 'percent' | 'fixed' }) => void;
  onCreate: () => void;
}

export default function CouponModal({ isOpen, onClose, newCoupon, onCouponChange, onCreate }: CouponModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-white/60 scale-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-brand text-xl font-bold text-slate-900">Create Coupon</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Coupon Code</label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="e.g. EARLYBIRD2024" 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D]"
                value={newCoupon.code}
                onChange={(e) => onCouponChange({...newCoupon, code: e.target.value.toUpperCase()})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount Amount</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input 
                  type="number" 
                  placeholder="20" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D]"
                  value={newCoupon.discount}
                  onChange={(e) => onCouponChange({...newCoupon, discount: e.target.value})}
                />
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => onCouponChange({...newCoupon, type: 'percent'})} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    newCoupon.type === 'percent' 
                      ? 'bg-white shadow-sm text-slate-900' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  %
                </button>
                <button 
                  onClick={() => onCouponChange({...newCoupon, type: 'fixed'})} 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    newCoupon.type === 'fixed' 
                      ? 'bg-white shadow-sm text-slate-900' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  $
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onCreate} 
          className="w-full py-3 bg-[#FF6B3D] hover:bg-[#ff8057] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
        >
          Create Coupon
        </button>
      </div>
    </div>
  );
}

