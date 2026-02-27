'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

export default function CommunityNavbar() {
  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home" className="font-logo text-3xl text-[#FF6B3D] tracking-wide">
            HereNow
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:text-[#FF6B3D] transition-colors rounded-full hover:bg-orange-50">
            <MessageCircle size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="Profile" />
          </div>
        </div>
      </div>
    </nav>
  );
}

