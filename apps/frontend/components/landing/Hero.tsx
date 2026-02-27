import { ArrowRight, Globe, Share2, BarChart3, Bot, MessageCircle } from 'lucide-react';

interface HeroProps {
  onJoinClick: () => void;
}

export default function Hero({ onJoinClick }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full text-brand font-medium text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          AI-Powered Event Intelligence
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 fill-mode-both">
          Make Every Encounter <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B3D] to-red-600">Count</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
          HereNow is the intelligent, <strong>AI-powered</strong> platform for event socialization and management. 
          Create your digital identity instantly and let AI connect you with the right people and opportunities. 
          Here, Now, Limitless.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-both">
          <button 
            onClick={onJoinClick}
            className="group bg-slate-900 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl hover:shadow-orange-500/20 hover:bg-brand flex items-center gap-2"
          >
            Join Waiting List
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="https://discord.gg/YG55pNqg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all flex items-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Join Community
          </a>
        </div>

        {/* Hero Visual / Mockup Placeholder */}
        <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in zoom-in duration-1000 delay-500">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B3D] to-pink-500 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-white/50 backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden p-4 md:p-8">
             {/* Simple conceptual UI illustration */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Card 1: User Profile */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 transform md:-rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden relative">
                       <img 
                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                         alt="avatar" 
                         className="w-full h-full"
                       />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-slate-800 rounded mb-2"></div>
                      <div className="h-3 w-16 bg-slate-300 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-4/5 bg-slate-100 rounded"></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Globe size={16} /></div>
                     <div className="p-2 bg-orange-50 text-brand rounded-lg"><Share2 size={16} /></div>
                  </div>
                </div>

                {/* Card 2: Main Event Dashboard (Center) */}
                <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-100 relative z-10 transform scale-105">
                  <div className="flex justify-between items-center mb-6">
                    <div className="font-bold text-lg text-slate-800">Tech Summit 2025</div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Live</span>
                  </div>
                  <div className="flex justify-between text-center mb-6">
                     <div>
                       <div className="text-2xl font-bold text-slate-900">1k+</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">Check-ins</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-brand">856</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">Interactions</div>
                     </div>
                     <div>
                       <div className="text-2xl font-bold text-slate-900">98%</div>
                       <div className="text-xs text-slate-500 uppercase font-medium">NPS</div>
                     </div>
                  </div>
                  <div className="h-24 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 text-sm">
                    <BarChart3 className="mr-2" /> AI Insights Active
                  </div>
                </div>

                {/* Card 3: Connection Notification */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100 transform md:rotate-2 hover:rotate-0 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-green-100 text-green-600 rounded-full"><Bot size={16} /></div>
                     <span className="font-semibold text-slate-700">AI Suggestion</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden relative">
                       <img 
                         src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" 
                         alt="avatar" 
                         className="w-full h-full"
                       />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">Sarah Chen</p>
                      <p className="text-slate-500">Best match for: Fintech</p>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors">
                    Say Hello
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

