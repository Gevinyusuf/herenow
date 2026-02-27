import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, MapPin, AlignLeft, Ticket, Users, Globe, ChevronDown, Shuffle, Image as ImageIcon,
  X, Check, Search, Bell, UserCircle, MoreHorizontal, ArrowRight, UploadCloud, LayoutGrid,
  Monitor, Briefcase, PartyPopper, Coffee, Trees, Lock, Sparkles, Bold, Italic, Link as LinkIcon,
  List, ListOrdered, Map as MapIcon, Heading1, Heading2, Heading3, Video, Clock, Palette,
  Type, Moon, Sun, Layout, Plus, Trash2, DollarSign, Settings, Eye, Wand2, Flame, Bot,       
  RefreshCw, Cpu, Send, Maximize2, Minimize2, Share2, ArrowLeft, CalendarDays, MessageSquare,
  Copy, CheckCircle, Building2, UserPlus, Mail, LogOut, Smartphone, Chrome, Zap, Key, Shield,
  Instagram, Twitter, Youtube, Linkedin, Command, Music, Smile, MapPin as MapPinIcon, ExternalLink,
  Compass, MoreVertical, Save, AlertCircle
} from 'lucide-react';

// --- API CONFIG ---
const apiKey = ""; // API key provided by the environment at runtime

// --- DATA CONSTANTS ---
const THEME_CATEGORIES = ['All', 'Modern', 'Soft', 'Vibrant', 'Dark'];
const THEME_OPTIONS = [
  { id: 'fresh', name: 'Fresh Air', category: 'Modern', bg: 'bg-slate-50', contentBg: 'bg-white/80 backdrop-blur-md border border-white/50', text: 'text-slate-900', button: 'bg-[#FF6B3D] hover:bg-[#E05D32] text-white shadow-lg shadow-orange-500/30', preview: 'linear-gradient(to bottom right, #F8FAFC, #EFF6FF)' },
  { id: 'glass', name: 'Frost', category: 'Modern', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', contentBg: 'bg-white/40 backdrop-blur-xl border border-white/60', text: 'text-indigo-950', button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30', preview: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)' },
  { id: 'sunset', name: 'Golden Hour', category: 'Vibrant', bg: 'bg-[#FFF7ED]', contentBg: 'bg-white/90 backdrop-blur-sm', text: 'text-orange-950', button: 'bg-orange-500 hover:bg-orange-600 text-white', preview: '#FFF7ED' },
  { id: 'midnight', name: 'Deep Space', category: 'Dark', bg: 'bg-[#0F172A]', contentBg: 'bg-[#1E293B]/80 backdrop-blur-md border border-white/5', text: 'text-white', button: 'bg-blue-500 hover:bg-blue-600 text-white', preview: '#0F172A' },
  { id: 'lavender', name: 'Lavender', category: 'Soft', bg: 'bg-purple-50', contentBg: 'bg-white/80 backdrop-blur-md border border-purple-100', text: 'text-purple-900', button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30', preview: '#FAF5FF' },
  { id: 'mint', name: 'Mint', category: 'Modern', bg: 'bg-teal-50', contentBg: 'bg-white/80 backdrop-blur-md border border-teal-100', text: 'text-teal-900', button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30', preview: '#F0FDFA' },
  { id: 'rose', name: 'Rose', category: 'Vibrant', bg: 'bg-rose-50', contentBg: 'bg-white/80 backdrop-blur-md border border-rose-100', text: 'text-rose-900', button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30', preview: '#FFF1F2' },
  { id: 'corporate', name: 'Corporate', category: 'Modern', bg: 'bg-gray-50', contentBg: 'bg-white border border-gray-200', text: 'text-gray-900', button: 'bg-blue-700 hover:bg-blue-800 text-white shadow-lg', preview: '#F9FAFB' },
  { id: 'luxury', name: 'Luxury', category: 'Dark', bg: 'bg-slate-950', contentBg: 'bg-slate-900/90 border border-amber-500/20', text: 'text-amber-50', button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20', preview: '#020617' },
  { id: 'forest', name: 'Forest', category: 'Modern', bg: 'bg-green-50', contentBg: 'bg-white/80 border border-green-100', text: 'text-green-900', button: 'bg-green-700 hover:bg-green-800 text-white', preview: '#F0FDF4' },
  { id: 'lemon', name: 'Lemonade', category: 'Vibrant', bg: 'bg-yellow-50', contentBg: 'bg-white/90 border border-yellow-200', text: 'text-yellow-900', button: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg', preview: '#FEFCE8' },
];

const EFFECT_CATEGORIES = ['All', 'Fun', 'Subtle'];
const EFFECT_OPTIONS = [
  { id: 'none', name: 'Clean', category: 'All', icon: '🚫' },
  { id: 'confetti', name: 'Party', category: 'Fun', icon: '🎉' },
  { id: 'sparkles', name: 'Sparkle', category: 'Subtle', icon: '✨' },
  { id: 'mesh', name: 'Rainbow', category: 'Subtle', icon: '🌈' },
  { id: 'hearts', name: 'Love', category: 'Fun', icon: '💖' },
  { id: 'snow', name: 'Snow', category: 'Fun', icon: '❄️' },
  { id: 'fire', name: 'Fire', category: 'Fun', icon: '🔥' },
  { id: 'balloons', name: 'Balloons', category: 'Fun', icon: '🎈' },
  { id: 'music', name: 'Music', category: 'Fun', icon: '🎵' },
  { id: 'flowers', name: 'Bloom', category: 'Subtle', icon: '🌸' },
  { id: 'stars', name: 'Stars', category: 'Subtle', icon: '⭐' },
  { id: 'ghosts', name: 'Spooky', category: 'Fun', icon: '👻' },
];

const IMAGE_CATEGORIES = [
  { id: 'featured', label: 'Featured', icon: LayoutGrid },
  { id: 'tech', label: 'Tech', icon: Monitor },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'party', label: 'Party', icon: PartyPopper },
  { id: 'food', label: 'Food & Drinks', icon: Coffee },
  { id: 'outdoors', label: 'Outdoors', icon: Trees },
];

const MOCK_IMAGES = {
  featured: [
    { id: 101, url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2669&auto=format&fit=crop', title: 'Celebration' },
    { id: 102, url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop', title: 'Event Crowd' },
  ],
  tech: [{ id: 201, url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop', title: 'Coding' },
         { id: 202, url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', title: 'Tech Office' }],
  business: [{ id: 301, url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2670&auto=format&fit=crop', title: 'Meeting' }],
  party: [{ id: 401, url: 'https://images.unsplash.com/photo-1530103862676-de3c9fa59af7?q=80&w=2670&auto=format&fit=crop', title: 'Balloons' }],
  food: [{ id: 501, url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop', title: 'Feast' }],
  outdoors: [{ id: 601, url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2673&auto=format&fit=crop', title: 'Mountain' }],
};

const LOCATION_RESULTS = [
  { id: 1, name: 'San Francisco, CA', address: 'United States' },
  { id: 2, name: 'Moscone Center', address: '747 Howard St, San Francisco, CA 94103' },
  { id: 3, name: 'Golden Gate Park', address: 'San Francisco, CA' },
];

const TIMEZONES = [
  { id: 'Asia/Shanghai', city: 'Shanghai', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Tokyo', city: 'Tokyo', offset: 'GMT+09:00', currentTime: '9:00 PM' },
  { id: 'Europe/London', city: 'London', offset: 'GMT+00:00', currentTime: '12:00 PM' },
  { id: 'America/New_York', city: 'New York', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Los_Angeles', city: 'Los Angeles', offset: 'GMT-08:00', currentTime: '4:00 AM' },
];

const HOST_PROFILES = [
  { id: 'me', name: 'Yan (You)', type: 'personal', icon: UserCircle },
  { id: 'org1', name: 'HereNow Team', type: 'organization', icon: Building2 }
];

// --- UTILS: Background Elements ---
const BgBlobs = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-100/50 blur-[100px] animate-pulse-slow" />
    <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px] animate-pulse-slower" />
  </div>
);

// --- HELPER COMPONENTS ---

const UserMenu = ({ onViewChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-[#8B5CF6] flex items-center justify-center text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all active:scale-95"
      >
         <UserCircle className="w-6 h-6" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 z-[100] animate-in fade-in zoom-in-95 text-slate-800">
           <div className="p-3 border-b border-slate-100 mb-1">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8E6B] flex items-center justify-center text-white font-brand text-lg font-bold">Y</div>
                 <div className="overflow-hidden">
                    <div className="font-bold text-slate-800 text-sm truncate">Yan Zhang</div>
                    <div className="text-xs text-slate-500 truncate">yan@herenow.com</div>
                 </div>
              </div>
           </div>
           <button 
             onClick={() => { onViewChange('settings:profile'); setIsOpen(false); }}
             className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2 transition-colors"
           >
             <UserCircle className="w-4 h-4 text-slate-400" /> View Profile
           </button>
           <button 
             onClick={() => { onViewChange('settings:account'); setIsOpen(false); }}
             className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2 transition-colors"
           >
             <Settings className="w-4 h-4 text-slate-400" /> Settings
           </button>
           <div className="h-px bg-slate-100 my-1"></div>
           <button 
             onClick={() => { setIsOpen(false); }}
             className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 flex items-center gap-2 transition-colors"
           >
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      )}
    </div>
  );
};

const SharedHeader = ({ currentView, onViewChange }) => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_ITEMS = [
    { label: 'Events', icon: CalendarDays, id: 'home' },
    { label: 'Communities', icon: Users, id: 'communities' },
    { label: 'Discover', icon: Compass, id: 'discover' }
  ];

  const currentTimeDisplay = "10:12 PM GMT+8";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'} min-w-[1100px]`}>
      <div className="max-w-[1600px] mx-auto px-20 h-20 flex items-center justify-between py-4">
        <div 
          className="flex items-center cursor-pointer select-none mr-8"
          onClick={() => onViewChange('creator')}
        >
          <span className="text-4xl font-logo tracking-wide text-[#FF6B3D]">HereNow</span>
        </div>

        <nav className="flex items-center space-x-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = (currentView === 'creator' && item.id === 'home');
            return (
              <button 
                key={item.label}
                onClick={() => item.id === 'home' && onViewChange('creator')}
                className={`
                  px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm
                  ${isActive 
                    ? 'bg-[#EFF4F9] text-[#334155]' 
                    : 'text-[#64748B] hover:bg-slate-50 hover:text-slate-600 bg-transparent'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#FF6B3D]' : 'text-[#64748B]'}`} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="flex items-center space-x-6">
          <div className="text-[#94A3B8] font-bold text-sm hidden xl:block">
            {currentTimeDisplay}
          </div>

          <button 
            onClick={() => onViewChange('creator')}
            className="bg-[#FF6B3D] hover:bg-[#FF855F] text-white px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-bold text-sm"
          >
            <Plus className="w-5 h-5" strokeWidth={3} /> Create
          </button>

          <div className="flex items-center space-x-2">
            <button className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B]"><Search className="w-6 h-6" strokeWidth={2} /></button>
            <button className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B]"><Bell className="w-6 h-6" strokeWidth={2} /></button>
            <UserMenu onViewChange={onViewChange} />
          </div>
        </div>
      </div>
    </header>
  );
};

const EffectLayer = ({ effect }) => {
  if (!effect || effect === 'none') return null;
  
  const getIcon = () => { 
    const map = { 
      confetti: '🎉', sparkles: '✨', hearts: '💖', snow: '❄️', 
      fire: '🔥', balloons: '🎈', music: '🎵', flowers: '🌸', 
      stars: '⭐', ghosts: '👻', mesh: '🌈' 
    }; 
    return map[effect] || '✨'; 
  };

  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i, left: `${Math.random() * 100}%`, delay: `${Math.random() * 5}s`, duration: `${6 + Math.random() * 6}s`, scale: 0.5 + Math.random() * 1 
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map(p => (<div key={p.id} className="absolute text-2xl opacity-0 animate-float" style={{ left: p.left, bottom: '-10%', fontSize: `${p.scale}rem`, animation: `floatUp ${p.duration} linear infinite`, animationDelay: p.delay }}>{getIcon()}</div>))}
      <style>{`@keyframes floatUp { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 10% { opacity: 0.6; } 90% { opacity: 0.4; } 100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; } }`}</style>
    </div>
  );
};

// --- SETTINGS PAGE --- (Unchanged)
const SettingsPage = ({ activeTab = 'profile', onTabChange, onClose }) => {
    const BgBlobs = () => (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-100/50 blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px] animate-pulse-slower" />
        </div>
    );

    return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 pt-24 pb-20 relative">
        <BgBlobs />
        <div className="max-w-5xl mx-auto px-12 relative z-10">
            <div className="flex items-center gap-4 mb-10">
                <button onClick={onClose} className="p-3 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-500 border border-transparent hover:border-slate-200"><ArrowLeft className="w-5 h-5" /></button>
                <h1 className="text-3xl font-bold font-brand text-slate-900 tracking-tight">Settings</h1>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-64 shrink-0 space-y-2">
                    {['Profile', 'Account', 'Integrations', 'Payment'].map(tab => (
                        <button key={tab} onClick={() => onTabChange(tab.toLowerCase())} className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.toLowerCase() ? 'bg-white text-[#FF6B3D] shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>{tab}</button>
                    ))}
                </div>
                <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/40 border border-white">
                    <div className="p-12 text-center text-slate-400">Settings Placeholder</div>
                </div>
            </div>
        </div>
    </div>
    );
};

// --- MODALS --- (ImagePickerModal Unchanged)
const ImagePickerModal = ({ isOpen, onClose, activeTab, onTabChange, selectedCategory, onCategoryChange, searchQuery, onSearchChange, aiPrompt, onAiPromptChange, isGenerating, generatedImage, onGenerate, onSelectImage }) => {
    if (!isOpen) return null;
    const currentImages = MOCK_IMAGES[selectedCategory] || [];
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
            <div className="flex items-center space-x-6">
              <h2 className="text-2xl font-bold text-slate-900 font-brand">Cover Image</h2>
              <div className="flex bg-slate-100/80 rounded-xl p-1">
                <button onClick={() => onTabChange('gallery')} className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'gallery' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Gallery</button>
                <button onClick={() => onTabChange('ai')} className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'ai' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><Sparkles className="w-3 h-3" />AI Studio</button>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col bg-white/50">
            {activeTab === 'gallery' ? (
              <div className="flex flex-1 overflow-hidden">
                 <div className="w-64 overflow-y-auto py-6 px-4 space-y-1 bg-slate-50/50 border-r border-slate-100">
                    <div className="text-xs font-bold text-slate-400 px-4 py-2 uppercase tracking-wider mb-2">Collections</div>
                    {IMAGE_CATEGORIES.map((cat) => { const Icon = cat.icon; return ( <button key={cat.id} onClick={() => onCategoryChange(cat.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${selectedCategory === cat.id ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}><Icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-[#FF6B3D]' : 'text-slate-400'}`} /><span>{cat.label}</span></button>); })}
                 </div>
                 <div className="flex-1 overflow-y-auto p-8">
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {currentImages.map((img) => (<div key={img.id} onClick={() => onSelectImage(img.url)} className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 transform hover:-translate-y-1"><img src={img.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"><span className="text-white font-bold text-sm">{img.title}</span></div></div>))}
                   </div>
                 </div>
              </div>
            ) : (
              <div className="flex-1 p-12 overflow-y-auto flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50">
                 <div className="w-full max-w-2xl text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-[#FF6B3D] mb-6 border border-indigo-100 shadow-sm"><Bot className="w-8 h-8" /></div>
                    <h3 className="font-bold text-slate-900 text-3xl mb-3 font-brand">AI Cover Artist</h3>
                    <p className="text-slate-500 mb-10">Describe your vision, and our AI will craft a unique texture.</p>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-200 to-blue-200 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                      <textarea placeholder="e.g. abstract geometric shapes, soft pastel colors, frosted glass texture..." className="relative w-full p-6 rounded-2xl border border-slate-200 bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none h-40 text-lg text-slate-800 placeholder-slate-300 shadow-sm transition-all" value={aiPrompt} onChange={(e) => onAiPromptChange(e.target.value)} />
                      <div className="absolute bottom-4 right-4">
                          <button onClick={onGenerate} disabled={isGenerating || !aiPrompt} className="px-6 py-2.5 bg-[#FF6B3D] hover:bg-[#E05D32] text-white rounded-xl font-bold tracking-wide transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/30">{isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : 'Generate'}</button>
                      </div>
                    </div>
                 </div>
                 {generatedImage && (
                    <div className="mt-12 w-full max-w-2xl animate-in slide-in-from-bottom-4 fade-in">
                       <div className="relative group aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 border-4 border-white mb-6"><img src={generatedImage} className="w-full h-full object-cover" /></div>
                       <button onClick={() => onSelectImage(generatedImage)} className="w-full py-4 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg transition-all">Use This Image</button>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

const DesignStudio = ({ activeTab, onTabToggle, selectedTheme, onThemeSelect, selectedEffect, onEffectSelect, searchCategory, onSearchCategoryChange, panelRef, onPreview }) => {
  // ... (DesignStudio Unchanged)
  return (
    <>
      <div className="fixed right-8 top-32 z-40 flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/60 p-2 flex flex-col gap-2">
            <button onClick={() => onTabToggle('theme')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'theme' ? 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`} title="Theme"><Palette className="w-5 h-5" /></button>
            <button onClick={() => onTabToggle('effect')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'effect' ? 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`} title="Effects"><Wand2 className="w-5 h-5" /></button>
            <div className="h-px w-8 bg-slate-100 mx-auto"></div>
            <button onClick={onPreview} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:bg-slate-50 hover:text-[#FF6B3D]" title="Preview"><Eye className="w-5 h-5" /></button>
        </div>
      </div>

      {activeTab && (
        <div ref={panelRef} className="fixed right-28 top-32 w-80 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 z-40 flex flex-col animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden ring-1 ring-black/5 max-h-[600px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-slate-900 capitalize font-brand text-lg">{activeTab}</h3></div>
          <div className="p-5 bg-slate-50/50 flex-1 overflow-y-auto">
             <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">{(activeTab === 'theme' ? THEME_CATEGORIES : EFFECT_CATEGORIES).map(cat => (<button key={cat} onClick={() => onSearchCategoryChange(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${searchCategory === cat ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{cat}</button>))}</div>
             <div className="grid grid-cols-2 gap-4 mt-1">
               {activeTab === 'theme' ? THEME_OPTIONS.filter(t => searchCategory === 'All' || t.category === searchCategory).map(theme => (
                 <button key={theme.id} onClick={() => onThemeSelect(theme)} className={`relative p-1 rounded-2xl border transition-all text-left group overflow-hidden ${selectedTheme.id === theme.id ? 'border-[#FF6B3D] bg-white shadow-md' : 'border-transparent hover:bg-white hover:shadow-sm'}`}>
                    <div className="h-20 rounded-xl w-full mb-2 border border-slate-100 overflow-hidden" style={{ background: theme.preview }}></div>
                    <div className="px-1 pb-1"><div className={`text-xs font-bold ${selectedTheme.id === theme.id ? 'text-[#FF6B3D]' : 'text-slate-700'}`}>{theme.name}</div></div>
                 </button>
               )) : 
               EFFECT_OPTIONS.filter(e => searchCategory === 'All' || e.category === searchCategory).map(effect => (
                 <button key={effect.id} onClick={() => onEffectSelect(effect.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${selectedEffect === effect.id ? 'border-[#FF6B3D] bg-white shadow-md text-[#FF6B3D]' : 'border-transparent bg-white hover:shadow-sm text-slate-600'}`}>
                    <div className="text-3xl mb-2 filter drop-shadow-sm">{effect.icon}</div>
                    <span className="text-xs font-bold">{effect.name}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- EDITOR COMPONENT ---
const EventEditor = ({ eventData, updateData, setViewMode, navigateToHome }) => {
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [activeDesignTab, setActiveDesignTab] = useState(null);
  const [designSearchCategory, setDesignSearchCategory] = useState('All');
  const [imagePickerTab, setImagePickerTab] = useState('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  
  // Re-added States
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isAIWriterOpen, setIsAIWriterOpen] = useState(false);
  const [aiWriterPrompt, setAiWriterPrompt] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  
  // Link Input States
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const selectionRef = useRef(null);
  
  // Popover States
  const [activePopover, setActivePopover] = useState(null); // 'ticket-{id}' or 'question-{id}' or 'visibility'

  // Timezone States
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  
  // Host Selector States
  const [isHostSelectorOpen, setIsHostSelectorOpen] = useState(false);

  const designPanelRef = useRef(null);
  const editorRef = useRef(null);
  const locationRef = useRef(null);
  const timezoneRef = useRef(null);
  const hostRef = useRef(null);
  const popoverRef = useRef(null);
  const visibilityRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
        if (designPanelRef.current && !designPanelRef.current.contains(event.target)) { if (!event.target.closest('.design-sidebar-btn')) setActiveDesignTab(null); }
        if (locationRef.current && !locationRef.current.contains(event.target)) setIsLocationOpen(false);
        if (timezoneRef.current && !timezoneRef.current.contains(event.target)) setIsTimezoneOpen(false);
        if (hostRef.current && !hostRef.current.contains(event.target)) setIsHostSelectorOpen(false);
        if (visibilityRef.current && !visibilityRef.current.contains(event.target)) setActivePopover(p => p === 'visibility' ? null : p);

        // Close popover if clicking outside
        if (popoverRef.current && !popoverRef.current.contains(event.target) && !event.target.closest('.popover-trigger')) {
            // Don't close if clicking inside the popover itself (handled by ref check), 
            // but do check if we clicked another trigger to avoid conflict? 
            // Simplified: just close if not inside popover or trigger
             setActivePopover(null);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ticket Management
  const addTicket = () => { const newId = eventData.tickets.length + 1; updateData('tickets', [...eventData.tickets, { id: newId, name: '', type: 'free', price: '', quantity: '', requireApproval: false, saveToTemplate: true }]); };
  const updateTicketItem = (id, field, value) => updateData('tickets', eventData.tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
  const removeTicketItem = (id) => updateData('tickets', eventData.tickets.filter(t => t.id !== id));


  // AI & Editor Logic
  const saveSelection = () => {
      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
          selectionRef.current = sel.getRangeAt(0);
      }
  };

  const restoreSelection = () => {
      const sel = window.getSelection();
      sel.removeAllRanges();
      if (selectionRef.current) {
          sel.addRange(selectionRef.current);
      }
  };

  // FIXED: Toggle H1-H3. If current selection is already that tag, revert to div.
  const toggleFormatBlock = (tag) => {
    const currentTag = document.queryCommandValue('formatBlock');
    if (currentTag && currentTag.toLowerCase() === tag.toLowerCase()) {
        document.execCommand('formatBlock', false, 'div');
    } else {
        document.execCommand('formatBlock', false, tag);
    }
    if (editorRef.current) editorRef.current.focus();
  };

  const execCommand = (command, value) => { 
     document.execCommand(command, false, value); 
     if(editorRef.current) editorRef.current.focus(); 
  };

  // FIXED: Open Link Input
  const openLinkInput = (e) => {
    e.preventDefault(); // Important: prevent editor blur
    saveSelection();
    if (selectionRef.current && !selectionRef.current.collapsed) {
         setShowLinkInput(true);
         setLinkUrl(''); 
    } else {
        alert("Please select text to link.");
    }
  };

  const applyLink = () => {
    restoreSelection();
    if (linkUrl) {
        document.execCommand('createLink', false, linkUrl);
    }
    setShowLinkInput(false);
    setLinkUrl('');
    if (editorRef.current) editorRef.current.focus();
  };

  const handleAIWrite = async () => {
    if (!aiWriterPrompt) return;
    setIsWriting(true);
    try {
        const context = `Event: ${eventData.eventName}, Date: ${eventData.startDate}, Desc: ${eventData.description}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `Write/Edit event description (HTML only, minimal styling) based on: ${aiWriterPrompt}. Context: ${context}` }] }] }) });
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        text = text.replace(/```html/g, '').replace(/```/g, '');
        updateData('description', text);
        if (editorRef.current) editorRef.current.innerHTML = text;
        setIsAIWriterOpen(false);
        setAiWriterPrompt('');
    } catch (e) { console.error(e); } finally { setIsWriting(false); }
  };

  // Question Management
  const addQuestion = () => { const newId = `q_${Date.now()}`; updateData('questions', [...eventData.questions, { id: newId, label: '', required: false, fixed: false, saveToTemplate: true }]); };
  const updateQuestion = (id, field, value) => updateData('questions', eventData.questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  const removeQuestion = (id) => updateData('questions', eventData.questions.filter(q => q.id !== id));

  const BgBlobs = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-100/50 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[120px] animate-pulse-slower" />
    </div>
  );

  return (
    <div className={`min-h-screen font-sans min-w-[1100px] transition-colors duration-500 ${eventData.selectedTheme.bg} ${eventData.selectedTheme.text || 'text-slate-900'}`}>
      <BgBlobs />
      <EffectLayer effect={eventData.selectedEffect} />
      <SharedHeader currentView="creator" onViewChange={(view) => view === 'home' ? navigateToHome() : setViewMode(view)} />

      <ImagePickerModal 
        isOpen={isImagePickerOpen} 
        onClose={() => setIsImagePickerOpen(false)} 
        activeTab={imagePickerTab} 
        onTabChange={setImagePickerTab} 
        selectedCategory={'featured'} 
        onCategoryChange={() => {}} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        aiPrompt={aiImagePrompt} 
        onAiPromptChange={setAiImagePrompt} 
        isGenerating={isGeneratingImage} 
        generatedImage={aiGeneratedImage} 
        onGenerate={() => { setIsGeneratingImage(true); setTimeout(() => { setAiGeneratedImage(MOCK_IMAGES.tech[0].url); setIsGeneratingImage(false); }, 2000); }} 
        onSelectImage={(url) => { updateData('coverImage', url); setIsImagePickerOpen(false); }} 
      />

      <DesignStudio 
        activeTab={activeDesignTab} 
        onTabToggle={(tab) => setActiveDesignTab(activeDesignTab === tab ? null : tab)} 
        selectedTheme={eventData.selectedTheme} 
        onThemeSelect={(t) => updateData('selectedTheme', t)} 
        selectedEffect={eventData.selectedEffect} 
        onEffectSelect={(e) => updateData('selectedEffect', e)} 
        searchCategory={designSearchCategory} 
        onSearchCategoryChange={setDesignSearchCategory} 
        panelRef={designPanelRef} 
        onPreview={() => setViewMode('preview')} 
      />

      <main className="max-w-6xl mx-auto pt-24 pb-32 px-20 relative z-10">
         
         {/* Title Section */}
         <div className="mb-12 text-center">
            <input 
              type="text" 
              placeholder="Event Name" 
              className={`w-full text-center text-6xl md:text-7xl font-bold font-brand bg-transparent border-none focus:ring-0 placeholder-slate-300 leading-tight tracking-tight ${eventData.selectedTheme.text}`}
              value={eventData.eventName} 
              onChange={(e) => updateData('eventName', e.target.value)} 
            />
            
            {/* Host Selector & Badge */}
            <div className="mt-6 flex items-center justify-center gap-4">
               {/* Visibility Switcher Popover Trigger */}
               <div className="relative" ref={visibilityRef}>
                    <button 
                       onClick={() => setActivePopover(activePopover === 'visibility' ? null : 'visibility')}
                       className="bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-slate-600 border border-white flex items-center gap-2 shadow-sm hover:bg-white transition-all"
                    >
                       <div className={`w-2 h-2 rounded-full ${eventData.visibility === 'public' ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}></div> 
                       {eventData.visibility === 'public' ? 'Public Event' : 'Private Event'}
                       <ChevronDown className="w-3 h-3 opacity-50" />
                   </button>

                   {activePopover === 'visibility' && (
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                           <button 
                               onClick={() => { updateData('visibility', 'public'); setActivePopover(null); }}
                               className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${eventData.visibility === 'public' ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                           >
                               <Globe className={`w-4 h-4 mt-0.5 ${eventData.visibility === 'public' ? 'text-green-600' : 'text-slate-400'}`} />
                               <div>
                                   <div className={`text-sm font-bold ${eventData.visibility === 'public' ? 'text-green-700' : 'text-slate-700'}`}>Public Event</div>
                                   <div className="text-xs text-slate-500 mt-0.5">Visible to everyone and featured on discovery.</div>
                               </div>
                           </button>
                           <div className="h-px bg-slate-100 my-1"></div>
                           <button 
                               onClick={() => { updateData('visibility', 'private'); setActivePopover(null); }}
                               className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${eventData.visibility === 'private' ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                           >
                               <Lock className={`w-4 h-4 mt-0.5 ${eventData.visibility === 'private' ? 'text-orange-600' : 'text-slate-400'}`} />
                               <div>
                                   <div className={`text-sm font-bold ${eventData.visibility === 'private' ? 'text-orange-700' : 'text-slate-700'}`}>Private Event</div>
                                   <div className="text-xs text-slate-500 mt-0.5">Only people with the link can register.</div>
                               </div>
                           </button>
                       </div>
                   )}
               </div>
               
               <div className="relative" ref={hostRef}>
                   <button 
                     onClick={() => setIsHostSelectorOpen(!isHostSelectorOpen)}
                     className="bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-slate-600 border border-white flex items-center gap-2 shadow-sm hover:bg-white transition-colors"
                   >
                       {(() => { const HostIcon = eventData.host.icon; return <HostIcon className="w-4 h-4 text-[#FF6B3D]" />; })()}
                       <span>Hosted by {eventData.host.name}</span>
                       <ChevronDown className="w-3 h-3 opacity-50" />
                   </button>

                   {isHostSelectorOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Host</div>
                          {HOST_PROFILES.map(profile => (
                              <button 
                                  key={profile.id} 
                                  onClick={() => { updateData('host', profile); setIsHostSelectorOpen(false); }}
                                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${eventData.host.id === profile.id ? 'bg-orange-50 text-[#FF6B3D]' : 'hover:bg-slate-50 text-slate-700'}`}
                              >
                                  <profile.icon className="w-4 h-4" />
                                  <span className="font-medium">{profile.name}</span>
                                  {eventData.host.id === profile.id && <Check className="w-4 h-4 ml-auto" />}
                              </button>
                          ))}
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors">
                              <Plus className="w-4 h-4" />
                              <span className="font-medium">Add new host</span>
                          </button>
                      </div>
                   )}
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-8">
               
                {/* 0. Cover Image */}
                <div className="group relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-slate-100 shadow-2xl shadow-slate-200/50 border border-white transition-all cursor-pointer hover:shadow-orange-500/10" onClick={() => setIsImagePickerOpen(true)}>
                  <img src={eventData.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-all flex items-center justify-center">
                     <button className="bg-white/90 backdrop-blur-md text-slate-900 px-5 py-2.5 rounded-full font-bold shadow-lg transform transition-all flex items-center gap-2 text-sm hover:scale-105 active:scale-95">
                        <ImageIcon className="w-4 h-4 text-[#FF6B3D]" /> Change Cover
                     </button>
                  </div>
               </div>

                {/* 1. Date & Time */}
                <div className="bg-white/70 backdrop-blur-md border border-white rounded-3xl p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md relative z-20">
                  <div className="p-3 bg-orange-50 rounded-2xl text-[#FF6B3D]"><Calendar className="w-6 h-6" /></div>
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Schedule</label>
                        
                        {/* Timezone Selector */}
                        <div className="relative" ref={timezoneRef}>
                            <button 
                                onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#FF6B3D] transition-colors bg-slate-100/50 hover:bg-white px-2 py-1 rounded-lg border border-transparent hover:border-slate-100"
                            >
                                <Globe className="w-3 h-3" />
                                {eventData.selectedTimezone.city} <span className="opacity-50">({eventData.selectedTimezone.offset.replace('GMT', '')})</span>
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            
                            {isTimezoneOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 overflow-hidden animate-in fade-in zoom-in-95 z-50 max-h-64 flex flex-col">
                                     <div className="p-2 sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-slate-100">
                                        <input 
                                            type="text" 
                                            placeholder="Search city..." 
                                            className="w-full bg-slate-50 border-none rounded-lg text-xs p-2 focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none font-medium text-slate-700"
                                            value={timezoneSearch}
                                            onChange={(e) => setTimezoneSearch(e.target.value)}
                                            autoFocus
                                        />
                                     </div>
                                     <div className="p-1 overflow-y-auto">
                                        {TIMEZONES.filter(tz => tz.city.toLowerCase().includes(timezoneSearch.toLowerCase())).map(tz => (
                                            <button 
                                                key={tz.id} 
                                                onClick={() => { updateData('selectedTimezone', tz); setIsTimezoneOpen(false); }}
                                                className={`w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-medium flex justify-between group transition-colors ${eventData.selectedTimezone.id === tz.id ? 'bg-orange-50 text-[#FF6B3D]' : 'text-slate-700'}`}
                                            >
                                                <span>{tz.city}</span>
                                                <span className={`text-slate-400 group-hover:text-slate-500 ${eventData.selectedTimezone.id === tz.id ? 'text-orange-400' : ''}`}>{tz.offset.replace('GMT', '')}</span>
                                            </button>
                                        ))}
                                     </div>
                                </div>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <div className="flex flex-col">
                                 <input type="date" className="bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0" value={eventData.startDate} onChange={(e) => updateData('startDate', e.target.value)} />
                                 <input type="time" className="bg-transparent border-none p-0 text-sm font-medium text-slate-500 focus:ring-0" value={eventData.startTime} onChange={(e) => updateData('startTime', e.target.value)} />
                              </div>
                          </div>
                          <div>
                              <div className="flex flex-col">
                                 <input type="date" className="bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0" value={eventData.endDate} onChange={(e) => updateData('endDate', e.target.value)} />
                                 <input type="time" className="bg-transparent border-none p-0 text-sm font-medium text-slate-500 focus:ring-0" value={eventData.endTime} onChange={(e) => updateData('endTime', e.target.value)} />
                              </div>
                          </div>
                      </div>
                  </div>
               </div>

               {/* 2. Location */}
               <div className={`relative bg-white/70 backdrop-blur-md border border-white rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${isLocationOpen ? 'ring-2 ring-[#FF6B3D]/20 z-30' : ''}`} ref={locationRef}>
                  <div className="flex items-center gap-4" onClick={() => !eventData.isVirtual && setIsLocationOpen(true)}>
                      <div className={`p-3 rounded-2xl ${eventData.isVirtual ? 'bg-cyan-50 text-cyan-500' : 'bg-blue-50 text-blue-500'}`}>{eventData.isVirtual ? <Video className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}</div>
                      <div className="flex-1">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">{eventData.isVirtual ? 'Virtual Link' : 'Location'}</label>
                         {eventData.isVirtual ? (
                             <div className="flex items-center">
                                 <input 
                                   type="text" 
                                   className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 placeholder-slate-300" 
                                   placeholder="Paste meeting link..."
                                   value={eventData.meetingLink}
                                   onChange={(e) => updateData('meetingLink', e.target.value)}
                                   autoFocus
                                 />
                                 <button onClick={(e) => { e.stopPropagation(); updateData('isVirtual', false); updateData('meetingLink', ''); updateData('location', ''); }} className="p-1 hover:bg-slate-100 rounded-full"><X className="w-4 h-4 text-slate-400" /></button>
                             </div>
                         ) : (
                             <input 
                               type="text" 
                               className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 placeholder-slate-300" 
                               placeholder="Search location..."
                               value={eventData.location}
                               onChange={(e) => { updateData('location', e.target.value); setLocationSearch(e.target.value); setIsLocationOpen(true); }}
                               onFocus={() => setIsLocationOpen(true)}
                             />
                         )}
                      </div>
                  </div>
                  
                  {/* Location Dropdown */}
                  {isLocationOpen && !eventData.isVirtual && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden animate-in fade-in zoom-in-95 z-50">
                          <div className="p-2">
                              <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">Suggestions</div>
                              {LOCATION_RESULTS.filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase())).map(loc => (
                                  <div key={loc.id} onClick={() => { updateData('location', loc.name); setIsLocationOpen(false); }} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                                      <div className="bg-slate-100 p-2 rounded-full text-slate-500"><MapPin className="w-4 h-4" /></div>
                                      <div>
                                          <div className="text-sm font-bold text-slate-800">{loc.name}</div>
                                          <div className="text-xs text-slate-500">{loc.address}</div>
                                      </div>
                                  </div>
                              ))}
                              <div onClick={() => { updateData('isVirtual', true); setIsLocationOpen(false); updateData('location', 'Virtual Event'); }} className="flex items-center space-x-3 p-3 hover:bg-cyan-50 rounded-xl cursor-pointer border-t border-slate-100 mt-1 group">
                                  <div className="bg-cyan-100 p-2 rounded-full text-cyan-600 group-hover:bg-cyan-200"><Video className="w-4 h-4" /></div>
                                  <div>
                                      <div className="text-sm font-bold text-slate-800 group-hover:text-cyan-700">Switch to Virtual Event</div>
                                      <div className="text-xs text-slate-500 group-hover:text-cyan-600">Add Zoom, Google Meet link</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
               </div>

               {/* 3. Description (Enhanced Editor) */}
               <div className={`bg-white/70 backdrop-blur-md border border-white rounded-3xl p-8 shadow-sm transition-all flex flex-col ${isEditorFocused ? 'ring-2 ring-[#FF6B3D]/20 shadow-md' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Description</h3>
                      <div className="flex items-center gap-2">
                          {/* Formatting Toolbar */}
                          <div className="flex bg-slate-100/50 rounded-lg p-1 items-center">
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormatBlock('H1')} className="w-8 h-8 hover:bg-white rounded text-xs font-bold text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center">H1</button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormatBlock('H2')} className="w-8 h-8 hover:bg-white rounded text-xs font-bold text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center">H2</button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => toggleFormatBlock('H3')} className="w-8 h-8 hover:bg-white rounded text-xs font-bold text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center">H3</button>
                              <div className="w-px h-4 bg-slate-300 mx-1"></div>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('bold')} className="w-8 h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center"><Bold className="w-3.5 h-3.5" /></button>
                              <button onMouseDown={(e) => e.preventDefault()} onClick={() => execCommand('italic')} className="w-8 h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center"><Italic className="w-3.5 h-3.5" /></button>
                              {/* Link Button with Popover */}
                              <div className="relative">
                                  <button onMouseDown={openLinkInput} className="w-8 h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D] flex items-center justify-center" title="Add Link"><LinkIcon className="w-3.5 h-3.5" /></button>
                                  {showLinkInput && (
                                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 flex gap-2 min-w-[240px] animate-in zoom-in-95">
                                          <input 
                                              type="text" 
                                              className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none"
                                              placeholder="https://..."
                                              value={linkUrl}
                                              onChange={(e) => setLinkUrl(e.target.value)}
                                              autoFocus
                                              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                                          />
                                          <button onMouseDown={(e) => e.preventDefault()} onClick={applyLink} className="bg-[#FF6B3D] text-white text-xs px-3 py-1 rounded-lg font-bold">Add</button>
                                      </div>
                                  )}
                              </div>
                          </div>
                          {/* AI Button */}
                          <button 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setIsAIWriterOpen(!isAIWriterOpen)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAIWriterOpen ? 'bg-[#FFF0E6] text-[#FF6B3D]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                              <Sparkles className="w-3.5 h-3.5" /> AI Magic
                          </button>
                      </div>
                  </div>

                  {/* AI Panel */}
                  {isAIWriterOpen && (
                      <div className="mb-4 p-4 bg-[#FFF0E6]/50 rounded-2xl border border-[#FF6B3D]/10 animate-in slide-in-from-top-2">
                          <div className="flex gap-2">
                              <input 
                                  className="flex-1 px-4 py-2 bg-white rounded-xl text-sm border-none focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none text-slate-700 placeholder-slate-400" 
                                  placeholder="Describe what to write (e.g., 'Exciting tech launch intro')..."
                                  value={aiWriterPrompt}
                                  onChange={(e) => setAiWriterPrompt(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAIWrite()}
                                  autoFocus
                              />
                              <button onClick={handleAIWrite} disabled={isWriting || !aiWriterPrompt} className="px-4 py-2 bg-[#FF6B3D] text-white rounded-xl font-bold text-xs hover:bg-[#E05D32] disabled:opacity-50 transition-colors">
                                  {isWriting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                          </div>
                      </div>
                  )}

                  <div ref={editorRef} contentEditable className="prose prose-lg prose-slate max-w-none focus:outline-none min-h-[120px] text-slate-600" placeholder="Write something amazing..." onFocus={() => setIsEditorFocused(true)} onBlur={() => setIsEditorFocused(false)}></div>
               </div>

               {/* 4. Registration Questions (NEW SECTION) */}
               <div className="bg-white/70 backdrop-blur-md border border-white rounded-3xl p-8 shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Registration Questions</h3>
                      <button onClick={addQuestion} className="flex items-center gap-1 text-xs font-bold text-[#FF6B3D] hover:bg-[#FFF0E6] px-3 py-1.5 rounded-lg transition-colors">
                          <Plus className="w-3 h-3" /> Add Question
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      {eventData.questions.map((q) => (
                          <div key={q.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${q.fixed ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-sm'}`}>
                              <div className="flex-1">
                                  {q.fixed ? (
                                      <div className="font-bold text-slate-500 text-sm flex items-center gap-2">
                                          {q.label}
                                          <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] uppercase tracking-wide text-slate-500">Fixed</span>
                                      </div>
                                  ) : (
                                      <input 
                                          type="text" 
                                          className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 placeholder-slate-400"
                                          value={q.label}
                                          placeholder="Enter question..."
                                          onChange={(e) => updateQuestion(q.id, 'label', e.target.value)}
                                      />
                                  )}
                              </div>
                              
                              <div className="flex items-center gap-2 relative">
                                  {/* Settings Menu Trigger for Questions */}
                                  <button 
                                      className={`p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 popover-trigger transition-colors ${q.fixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => !q.fixed && setActivePopover(activePopover === `question-${q.id}` ? null : `question-${q.id}`)}
                                  >
                                      <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {/* Settings Popover */}
                                  {activePopover === `question-${q.id}` && !q.fixed && (
                                      <div ref={popoverRef} className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                                          {/* Required Switch */}
                                          <div 
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                              onClick={() => updateQuestion(q.id, 'required', !q.required)}
                                          >
                                              <span className="text-xs font-medium text-slate-700">Required</span>
                                              <div className={`w-7 h-4 rounded-full relative transition-colors ${q.required ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${q.required ? 'left-3.5' : 'left-0.5'}`}></div>
                                              </div>
                                          </div>
                                          
                                          {/* Save Template Switch */}
                                          <div 
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                              onClick={() => updateQuestion(q.id, 'saveToTemplate', !q.saveToTemplate)}
                                          >
                                              <div className="flex items-center gap-2">
                                                  <Save className="w-3.5 h-3.5 text-slate-400" />
                                                  <span className="text-xs font-medium text-slate-700">Save Template</span>
                                              </div>
                                              <div className={`w-7 h-4 rounded-full relative transition-colors ${q.saveToTemplate ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${q.saveToTemplate ? 'left-3.5' : 'left-0.5'}`}></div>
                                              </div>
                                          </div>
                                          
                                          <div className="h-px bg-slate-100 my-1"></div>
                                          
                                          {/* Delete Action */}
                                          <button 
                                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-xs font-medium"
                                              onClick={() => removeQuestion(q.id)}
                                          >
                                              <Trash2 className="w-3.5 h-3.5" /> Delete
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
               </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
               
               {/* Tickets Card */}
               <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-lg shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Ticket className="w-5 h-5 text-[#FF6B3D]" /> Tickets</h3>
                     <button onClick={addTicket} className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-[#FF6B3D] hover:text-white transition-colors">Add Type</button>
                  </div>
                  <div className="space-y-3">
                     {eventData.tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group hover:border-orange-200 hover:bg-orange-50/30 transition-all">
                           <div className="flex items-start gap-3 mb-2">
                              {/* Approval Status Icon - Left of Ticket Name */}
                              <button 
                                  onClick={() => updateTicketItem(ticket.id, 'requireApproval', !ticket.requireApproval)}
                                  className={`p-3 rounded-xl flex items-center justify-center transition-all ${ticket.requireApproval ? 'bg-purple-100 text-purple-600 shadow-sm ring-1 ring-purple-200' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                                  title={ticket.requireApproval ? "Approval Required" : "Direct Entry"}
                              >
                                  {ticket.requireApproval ? <Shield className="w-5 h-5" /> : <Ticket className="w-5 h-5" />}
                              </button>

                              <div className="flex-1 relative">
                                  {/* Ticket Name Input */}
                                  <input 
                                    type="text" 
                                    className="bg-transparent border-none p-0 font-bold text-base focus:ring-0 w-full text-slate-800 placeholder-slate-400 pr-8 h-11" 
                                    value={ticket.name} 
                                    placeholder="General Admission"
                                    onChange={(e) => updateTicketItem(ticket.id, 'name', e.target.value)} 
                                  />
                                  
                                  {/* Ticket More Menu Trigger */}
                                  <button 
                                      className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 popover-trigger transition-colors absolute right-0 top-2"
                                      onClick={() => setActivePopover(activePopover === `ticket-${ticket.id}` ? null : `ticket-${ticket.id}`)}
                                  >
                                      <MoreHorizontal className="w-4 h-4" />
                                  </button>

                                  {/* Ticket Popover */}
                                  {activePopover === `ticket-${ticket.id}` && (
                                      <div ref={popoverRef} className="absolute top-8 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                                          
                                          {/* Require Approval Switch */}
                                          <div 
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                              onClick={() => updateTicketItem(ticket.id, 'requireApproval', !ticket.requireApproval)}
                                          >
                                              <div className="flex items-center gap-2">
                                                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                                                  <span className="text-xs font-medium text-slate-700">Require Approval</span>
                                              </div>
                                              <div className={`w-7 h-4 rounded-full relative transition-colors ${ticket.requireApproval ? 'bg-purple-500' : 'bg-slate-200'}`}>
                                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${ticket.requireApproval ? 'left-3.5' : 'left-0.5'}`}></div>
                                              </div>
                                          </div>

                                          {/* Save Template Switch */}
                                          <div 
                                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                                              onClick={() => updateTicketItem(ticket.id, 'saveToTemplate', !ticket.saveToTemplate)}
                                          >
                                              <div className="flex items-center gap-2">
                                                  <Save className="w-3.5 h-3.5 text-slate-400" />
                                                  <span className="text-xs font-medium text-slate-700">Save Template</span>
                                              </div>
                                              <div className={`w-7 h-4 rounded-full relative transition-colors ${ticket.saveToTemplate ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${ticket.saveToTemplate ? 'left-3.5' : 'left-0.5'}`}></div>
                                              </div>
                                          </div>
                                          
                                          <div className="h-px bg-slate-100 my-1"></div>
                                          
                                          {/* Delete Action */}
                                          <button 
                                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-xs font-medium"
                                              onClick={() => removeTicketItem(ticket.id)}
                                          >
                                              <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
                                          </button>
                                      </div>
                                  )}
                              </div>
                           </div>
                           
                           {/* Price and Quantity Row */}
                           <div className="flex gap-3 pt-2 pl-[3.25rem]"> {/* Added padding to align with input text */}
                              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shrink-0 shadow-sm self-start">
                                 <button onClick={() => updateTicketItem(ticket.id, 'type', 'free')} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${ticket.type === 'free' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}>FREE</button>
                                 <button onClick={() => updateTicketItem(ticket.id, 'type', 'paid')} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${ticket.type === 'paid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}>$$$</button>
                              </div>
                              <div className="flex-1">
                                 <div className="flex gap-2">
                                    {ticket.type === 'paid' && (
                                        <div className="relative flex-1">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                                            <input type="number" className="block w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-[#FF6B3D] focus:border-[#FF6B3D] text-slate-600 placeholder-slate-400" placeholder="0.00" value={ticket.price} onChange={(e) => updateTicketItem(ticket.id, 'price', e.target.value)} />
                                        </div>
                                    )}
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
                                        <input type="number" className="block w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-[#FF6B3D] focus:border-[#FF6B3D] text-slate-600 placeholder-slate-400" placeholder="Unlimited" value={ticket.quantity} onChange={(e) => updateTicketItem(ticket.id, 'quantity', e.target.value)} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
         </div>
         
         {/* Floating CTA */}
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30">
             <button 
               onClick={() => setViewMode('live')}
               className={`px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 flex items-center gap-3 border-4 border-white/20 backdrop-blur-sm ${eventData.selectedTheme.button}`}
             >
                Launch Event <ArrowRight className="w-5 h-5" />
             </button>
         </div>

      </main>
    </div>
  );
};

// --- HOMEPAGE ---
const HomePage = ({ onNavigate }) => {
  // ... (HomePage code removed as per request)
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-x-hidden">
      <BgBlobs />
      <SharedHeader currentView="home" onViewChange={onNavigate} />
      <div className="relative z-10 max-w-7xl mx-auto pt-32 px-20 pb-20">
         <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-slate-400">Home Page Placeholder</h2>
            <button onClick={() => onNavigate('creator')} className="mt-4 text-[#FF6B3D] font-bold hover:underline">Go to Event Creator</button>
         </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function HereNowApp() {
  const [currentView, setCurrentView] = useState('creator'); // Default to creator as requested
  const [eventData, setEventData] = useState({
    eventName: 'Product Launch 2025', coverImage: MOCK_IMAGES.featured[0].url, startDate: '2025-11-19', startTime: '20:00', endDate: '2025-11-19', endTime: '21:00',
    location: '', description: '<p>Enter a description...</p>', tickets: [{ id: 1, name: 'General Admission', type: 'free', price: '', quantity: '', requireApproval: false, saveToTemplate: true }],
    questions: [{ id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true }, { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }],
    host: HOST_PROFILES[0], coHosts: [], selectedTheme: THEME_OPTIONS[0], selectedEffect: 'none', selectedTimezone: TIMEZONES[0],
    visibility: 'public', isVirtual: false, meetingLink: '', requireApproval: false
  });

  const updateData = (field, value) => setEventData(prev => ({ ...prev, [field]: value }));

  const renderContent = () => {
    if (currentView.startsWith('settings')) return <SettingsPage activeTab={currentView.split(':')[1] || 'profile'} onTabChange={(tab) => setCurrentView(`settings:${tab}`)} onClose={() => setCurrentView('creator')} />;
    
    switch (currentView) {
      case 'home': return <HomePage onNavigate={setCurrentView} />;
      case 'creator': return <EventEditor eventData={eventData} updateData={updateData} setViewMode={setCurrentView} navigateToHome={() => setCurrentView('home')} />;
      case 'preview': return <EventDetailPage data={eventData} onEdit={() => setCurrentView('creator')} onViewChange={setCurrentView} />;
      case 'live': return <EventDetailPage data={eventData} onEdit={() => setCurrentView('creator')} onViewChange={setCurrentView} />;
      default: return <HomePage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="font-sans text-slate-900 bg-[#F8FAFC]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Lalezar&display=swap');
        
        .font-brand { 
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          letter-spacing: -0.02em;
        }

        .font-logo {
          font-family: 'Lalezar', system-ui;
        }
        
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        
        @keyframes pulse-slow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slow 12s ease-in-out infinite; }

        /* Added Editor Typography Styles */
        .prose h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1em; margin-bottom: 0.5em; line-height: 1.1; }
        .prose h2 { font-size: 1.875rem; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; line-height: 1.2; }
        .prose h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; line-height: 1.3; }
        .prose p { margin-bottom: 1em; line-height: 1.6; }
        .prose a { color: #FF6B3D; text-decoration: underline; cursor: pointer; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .prose strong { font-weight: 700; }
        .prose em { font-style: italic; }
      `}</style>
      {renderContent()}
    </div>
  );
}