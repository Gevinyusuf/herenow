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

          {/* Sign In / User Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative group">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF9E7D] via-[#FF6B3D] to-orange-300 shadow-sm border-2 border-white hover:scale-105 transition-transform cursor-pointer"></div>
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button 
                    onClick={onSignOut} 
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {onSignInClick ? (
                  <>
                    <button
                      onClick={onSignInClick}
                      className="hidden sm:block px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={onSignInClick}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B3D] to-[#FF855F] hover:from-[#FF5A26] hover:to-[#FF6B3D] text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login"
                      className="hidden sm:block px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/register"
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B3D] to-[#FF855F] hover:from-[#FF5A26] hover:to-[#FF6B3D] text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient line on scroll */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B3D]/20 to-transparent" />
      )}
    </nav>
  );
}

