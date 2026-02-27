'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Search, Bell, Plus } from 'lucide-react';
import UserMenu from '../home/UserMenu';

interface CreateNavbarProps {
  showTime?: boolean;
}

export default function CreateNavbar({ showTime = false }: CreateNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const currentTimeDisplay = '10:12 PM GMT+8';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'
      } min-w-[1100px]`}
    >
      <div className="max-w-[1600px] mx-auto px-20 h-20 flex items-center justify-between py-4">
        <Link href="/home" className="flex items-center cursor-pointer select-none mr-8">
          <span className="text-4xl font-lalezar tracking-wide text-brand">HereNow</span>
        </Link>

        <nav className="flex items-center space-x-1 flex-1">
          <Link href="/home">
            <button className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm bg-transparent text-[#334155] hover:bg-slate-100">
              <CalendarDays className="w-5 h-5 text-[#FF6B3D]" strokeWidth={2} />
              Events
            </button>
          </Link>
          {/* Communities / Discover hidden for now */}
        </nav>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center bg-slate-100/70 border border-slate-200 rounded-full px-3 py-1.5 shadow-inner w-60 focus-within:ring-2 focus-within:ring-[#FF6B3D]/30">
            <Search className="w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search anything..."
              className="flex-1 bg-transparent border-none text-sm text-slate-700 px-2 focus:outline-none"
            />
          </div>

          {showTime && (
            <div className="text-[#94A3B8] font-bold text-sm hidden xl:block">
              {currentTimeDisplay}
            </div>
          )}

          <Link href="/create/event">
            <button className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
              <Plus className="w-5 h-5" strokeWidth={3} /> Create
            </button>
          </Link>

          <div className="flex items-center space-x-2">
            <button className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B] relative">
              <Bell className="w-6 h-6" strokeWidth={2} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B3D] rounded-full border border-white"></span>
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
