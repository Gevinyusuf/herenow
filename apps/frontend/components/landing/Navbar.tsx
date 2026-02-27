'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onSignInClick: () => void;
}

export default function Navbar({ onSignInClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Text Logo */}
        <div className="flex items-center cursor-pointer">
          <span className="text-4xl font-lalezar text-brand tracking-wide">
            HereNow
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-slate-600 hover:text-brand font-medium transition-colors">Features</a>
          <a href="#pricing" className="text-slate-600 hover:text-brand font-medium transition-colors">Pricing</a>
          <button 
            onClick={onSignInClick}
            className="bg-slate-900 hover:bg-brand text-white px-5 py-2.5 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
          >
            Sign In
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="text-slate-800" /> : <Menu className="text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-xl md:hidden flex flex-col p-6 gap-4 animate-in slide-in-from-top-5 duration-200 border-t border-slate-100">
          <a href="#features" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#pricing" className="text-lg font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <hr className="border-slate-100" />
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              onSignInClick();
            }}
            className="w-full py-3 text-center font-bold text-white bg-brand rounded-lg shadow-md"
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  );
}

