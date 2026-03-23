'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, LogOut } from 'lucide-react';

interface DiscoverNavbarProps {
  isLoggedIn?: boolean;
  onSignInClick?: () => void;
  onSignOut?: () => void;
}

export default function DiscoverNavbar({ 
  isLoggedIn = false, 
  onSignInClick, 
  onSignOut 
}: DiscoverNavbarProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-900/5 border-b border-slate-100/50 py-3' 
          : 'bg-gradient-to-b from-white/90 via-white/80 to-transparent backdrop-blur-sm py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="group cursor-pointer"
          >
            <span className="text-4xl font-lalezar text-brand tracking-wide group-hover:scale-105 transition-transform duration-300">
              HereNow
            </span>
          </Link>
          <div className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
            <Sparkles className="w-4 h-4 text-[#FF6B3D]" strokeWidth={2} />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discover</span>
          </div>
        </div>

        {/* Search Bar - Prominent Feature */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div 
            className={`relative w-full transition-all duration-300 ${
              searchFocused 
                ? 'scale-105' 
                : ''
            }`}
          >
            <Search 
              className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                searchFocused 
                  ? 'text-[#FF6B3D]' 
                  : 'text-slate-400'
              }`} 
              size={20} 
            />
            <input
              type="text"
              placeholder="Search events, communities, locations..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full pl-12 pr-4 py-3 rounded-2xl border-2 transition-all duration-300 font-medium text-sm ${
                searchFocused
                  ? 'border-[#FF6B3D]/50 bg-white shadow-lg shadow-orange-500/10'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
              } focus:outline-none focus:ring-4 focus:ring-orange-500/10`}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button className="md:hidden p-2.5 text-slate-500 hover:text-[#FF6B3D] hover:bg-orange-50 rounded-xl transition-all">
            <Search size={20} />
          </button>

          {/* Logo only - no auth buttons needed for Pro users */}
        </div>
      </div>

      {/* Subtle bottom gradient line on scroll */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B3D]/20 to-transparent" />
      )}
    </nav>
  );
}

