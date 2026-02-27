'use client';

import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Users, Compass, Search, Bell, Plus } from 'lucide-react';
import Link from 'next/link';
import NavLink from './NavLink';
import UserMenu from './UserMenu';

interface NavbarProps {
  onCreateEventClick?: () => void;
  variant?: 'default' | 'fixed'; // default: 普通导航, fixed: 固定导航（带滚动效果）
  showTime?: boolean;
  currentView?: 'events' | 'communities';
  onViewChange?: (view: 'events' | 'communities') => void;
  canAccessCommunity?: boolean;
  canAccessDiscover?: boolean;
}

export default function Navbar({ 
  onCreateEventClick, 
  variant = 'default', 
  showTime = false, 
  currentView = 'events', 
  onViewChange,
  canAccessCommunity = false,
  canAccessDiscover = false
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 自动获取浏览器时区和时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // 格式化时间为 12 小时制 (例如: "10:12 PM")
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const timeString = timeFormatter.format(now);
      
      // 获取时区偏移量 (GMT+X)
      const timezoneOffset = -now.getTimezoneOffset() / 60; // 转换为小时
      const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
      const timezoneString = `GMT${timezoneSign}${Math.abs(timezoneOffset)}`;
      
      setCurrentTimeDisplay(`${timeString} ${timezoneString}`);
    };

    // 立即更新一次
    updateTime();

    // 每秒更新一次
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (variant === 'fixed') {
    return (
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'} min-w-[1100px]`}>
        <div className="max-w-[1600px] mx-auto px-20 h-20 flex items-center justify-between py-4">
          <Link href="/home" className="flex items-center cursor-pointer select-none mr-8">
            <span className="text-4xl font-lalezar tracking-wide text-brand">HereNow</span>
          </Link>

          <nav className="flex items-center space-x-1 flex-1">
            <Link href="/home">
              <button className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm bg-[#EFF4F9] text-[#334155]">
                <CalendarDays className="w-5 h-5 text-[#FF6B3D]" strokeWidth={2} />
                Events
              </button>
            </Link>
            {canAccessCommunity && (
              <button className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm text-[#64748B] hover:bg-slate-50 hover:text-slate-600 bg-transparent">
                <Users className="w-5 h-5 text-[#64748B]" strokeWidth={2} />
                Communities
              </button>
            )}
            {canAccessDiscover && (
              <Link href="/discover">
                <button className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm text-[#64748B] hover:bg-slate-50 hover:text-slate-600 bg-transparent">
                  <Compass className="w-5 h-5 text-[#64748B]" strokeWidth={2} />
                  Discover
                </button>
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-6">
            {showTime && (
              <div className="text-[#94A3B8] font-bold text-sm hidden xl:block">
                {currentTimeDisplay}
              </div>
            )}

            {onCreateEventClick ? (
              <button 
                onClick={onCreateEventClick}
                className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm"
              >
                <Plus className="w-5 h-5" strokeWidth={3} /> Create
              </button>
            ) : (
              <Link href="/create/event">
                <button className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
                  <Plus className="w-5 h-5" strokeWidth={3} /> Create
                </button>
              </Link>
            )}

            <div className="flex items-center space-x-2">
              <button className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B]">
                <Search className="w-6 h-6" strokeWidth={2} />
              </button>
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

  // Default variant (for home page) - 现在支持固定导航和滚动效果
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/home" className="text-4xl font-lalezar text-brand tracking-wide hover:scale-105 transition-transform select-none">
            HereNow
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onViewChange?.('events')}
              className={`flex items-center gap-2 px-1 py-1 text-base font-semibold transition-all duration-200 group ${
                currentView === 'events'
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={currentView === 'events' ? 'text-[#FF6B3D]' : 'text-slate-400 group-hover:text-slate-600'}>
                <Calendar size={18} />
              </span>
              <span>Events</span>
            </button>
            {canAccessCommunity && (
              <button
                onClick={() => onViewChange?.('communities')}
                className={`flex items-center gap-2 px-1 py-1 text-base font-semibold transition-all duration-200 group ${
                  currentView === 'communities'
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className={currentView === 'communities' ? 'text-[#FF6B3D]' : 'text-slate-400 group-hover:text-slate-600'}>
                  <Users size={18} />
                </span>
                <span>Communities</span>
              </button>
            )}
            {canAccessDiscover && (
              <NavLink icon={<Compass size={18} />} text="Discover" href="/discover" />
            )}
          </div>
        </div>

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

          {onCreateEventClick ? (
            <button 
              onClick={onCreateEventClick}
              className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={3} /> Create
            </button>
          ) : (
            <Link href={currentView === 'communities' ? '/create/community' : '/create/event'}>
              <button className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
                <Plus className="w-5 h-5" strokeWidth={3} /> Create
              </button>
            </Link>
          )}

          <div className="flex items-center space-x-2">
            <button className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B] relative">
              <Bell className="w-6 h-6" strokeWidth={2} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B3D] rounded-full border border-white"></span>
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
