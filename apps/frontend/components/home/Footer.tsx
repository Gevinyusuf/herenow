'use client';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="hover:text-[#FF6B3D] transition-colors">Discover</a>
          <a href="#" className="hover:text-[#FF6B3D] transition-colors">Pricing</a>
          <a href="#" className="hover:text-[#FF6B3D] transition-colors">Help</a>
        </div>
        <div className="flex-1 flex justify-center">
          <a href="#" className="text-sm font-semibold text-[#FF6B3D] hover:text-[#E55A2D] flex items-center gap-1 group">
            Host your community with HereNow 
            <span className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">↗</span>
          </a>
        </div>
        <div className="flex gap-4 text-slate-400">
          <div className="w-5 h-5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors cursor-pointer"></div>
          <div className="w-5 h-5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors cursor-pointer"></div>
        </div>
      </div>
    </footer>
  );
}
