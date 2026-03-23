import { ArrowRight, MapPin, Phone, Mail, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 items-start">
          {/* Left Side: Brand */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-3xl font-lalezar text-slate-900 tracking-wide">
                HereNow
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              HereNow is an AI-native platform designed to eliminate the friction in event management. 
              We empower creators to monetize their expertise and foster local, authentic communities globally.
            </p>
          </div>

          {/* Center: Menu */}
          <div className="flex flex-col gap-4 pt-2 md:pl-12">
            <h4 className="font-bold text-slate-900 mb-2">Menu</h4>
            <div className="flex flex-col gap-3">
              <a href="#features" className="text-slate-600 hover:text-brand transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-brand transition-colors font-medium">Pricing</a>
              <a href="https://discord.gg/YG55pNqg" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-brand transition-colors flex items-center gap-2 font-medium">
                Community <ArrowRight size={14} />
              </a>
            </div>
          </div>
          
          {/* Right Side: Contact */}
          <div className="flex flex-col gap-2 pt-2">
             <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
             <div className="flex flex-col gap-3 text-sm text-slate-600 mb-6">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
                <span>1111B S Governors Ave, STE 48047<br/>Dover, DE 19904</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-brand shrink-0" />
                <span>+1 (213) 536-0031</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-brand shrink-0" />
                <a href="mailto:timzhangherenow@gmail.com" className="hover:text-brand">timzhangherenow@gmail.com</a>
              </div>
            </div>

            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/company/herenow-events/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-[#0077b5] hover:text-white transition-colors cursor-pointer"
              >
                <Linkedin size={16}/>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © 2025 HereNow Events Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

