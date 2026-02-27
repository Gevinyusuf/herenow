'use client';

import Link from 'next/link';
import UserMenu from '../home/UserMenu';

interface DetailNavbarProps {
  isLoggedIn?: boolean;
  onSignInClick?: () => void;
  onSignOut?: () => void;
}

export default function DetailNavbar({ 
  isLoggedIn = false, 
  onSignInClick, 
  onSignOut 
}: DetailNavbarProps = {}) {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100/50 py-4"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Link 
            href="/home" 
            className="group cursor-pointer"
          >
            <span className="text-4xl font-lalezar text-brand tracking-wide group-hover:scale-105 transition-transform duration-300">
              HereNow
            </span>
          </Link>
        </div>

        {/* Right Actions - Login/User Menu */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <UserMenu onSignOut={onSignOut} />
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
    </nav>
  );
}
