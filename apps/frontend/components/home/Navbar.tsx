'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Calendar, CalendarDays, Users, Compass, Search, Bell, Plus, Settings, ChevronDown, Crown } from 'lucide-react';
import Link from 'next/link';
import NavLink from './NavLink';
import UserMenu from './UserMenu';
import Notifications from './Notifications';

interface NavbarProps {
  onCreateEventClick?: () => void;
  variant?: 'default' | 'fixed';
  showTime?: boolean;
  currentView?: 'events' | 'communities' | 'my-events' | 'my-communities' | 'settings' | 'profile';
  onViewChange?: (view: 'events' | 'communities' | 'my-events' | 'my-communities') => void;
  canAccessCommunity?: boolean;
  canAccessDiscover?: boolean;
}

export default function Navbar({ 
  onCreateEventClick, 
  variant = 'default', 
  showTime = false, 
  currentView: propCurrentView = 'events', 
  onViewChange,
  canAccessCommunity = false,
  canAccessDiscover = false
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState('');
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);

  // 只在 /home 页面从 URL 参数获取视图，否则使用 prop
  const urlView = pathname === '/' || pathname === '/home' 
    ? searchParams.get('view') as 'events' | 'communities' | 'my-events' | 'my-communities' | null
    : null;
  const currentView = urlView || propCurrentView;
  
  // 判断是否是 Events 相关视图
  const isEventsActive = currentView === 'events' || currentView === 'my-events';
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventsDropdownRef.current && !eventsDropdownRef.current.contains(event.target as Node)) {
        setEventsDropdownOpen(false);
      }
      if (communitiesDropdownRef.current && !communitiesDropdownRef.current.contains(event.target as Node)) {
        setCommunitiesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动获取浏览器时区和时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const timeString = timeFormatter.format(now);
      setCurrentTimeDisplay(timeString);
    };

    updateTime();
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
            {!canAccessDiscover && (
              <Link href="/discover">
                <button className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm text-slate-400 hover:bg-slate-50 bg-transparent">
                  <Compass className="w-5 h-5" strokeWidth={2} />
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

            <Link href="/pricing">
              <button className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
                <Crown className="w-4 h-4" strokeWidth={2.5} /> Upgrade
              </button>
            </Link>

            <div className="flex items-center space-x-2">
              <Notifications />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Default variant (for home page)
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
          <div className="hidden md:flex items-center gap-4">
            {/* Events Dropdown */}
            <div className="relative" ref={eventsDropdownRef}>
              <button
                onClick={() => {
                  setEventsDropdownOpen(!eventsDropdownOpen);
                  setCommunitiesDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 text-base font-semibold transition-all duration-200 rounded-lg ${
                  isEventsActive && pathname === '/home'
                    ? 'text-slate-900 bg-slate-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={isEventsActive && pathname === '/home' ? 'text-[#FF6B3D]' : 'text-slate-400'}>
                  <Calendar size={18} />
                </span>
                <span>Events</span>
                <ChevronDown size={14} className={`transition-transform ${eventsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {eventsDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                  <button
                    onClick={() => {
                      onViewChange?.('events');
                      setEventsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentView === 'events' 
                        ? 'bg-orange-50 text-[#FF6B3D] font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar size={16} />
                    All Events
                  </button>
                  <button
                    onClick={() => {
                      router.push('/my-events');
                      setEventsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      currentView === 'my-events' 
                        ? 'bg-orange-50 text-[#FF6B3D] font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarDays size={16} />
                    My Events
                  </button>
                </div>
              )}
            </div>

            {canAccessDiscover && (
              <NavLink icon={<Compass size={18} />} text="Discover" href="/discover" />
            )}
            {!canAccessDiscover && (
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
            <Link href={currentView === 'communities' || currentView === 'my-communities' ? '/create/community' : '/create/event'}>
              <button className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
                <Plus className="w-5 h-5" strokeWidth={3} /> Create
              </button>
            </Link>
          )}

          <Link href="/pricing">
            <button className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm">
              <Crown className="w-4 h-4" strokeWidth={2.5} /> Upgrade
            </button>
          </Link>

          <div className="flex items-center space-x-2">
            <Notifications />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
}
