'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  AtSign, 
  UploadCloud, 
  X, 
  Sparkles, 
  Palette,
  MapPin,
  Globe,
  Lock,
  Link as LinkIcon,
  Mail,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  slug: string;
  themeColor: string;
  privacy: 'public' | 'private';
  locationType: 'global' | 'local';
  location: string;
  city: string;
  coverImage: string;
}

interface InviteMethods {
  link: boolean;
  email: boolean;
}

export default function CreateCommunityPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    slug: '',
    themeColor: '#FF6B3D',
    privacy: 'public',
    locationType: 'global',
    location: '',
    city: '',
    coverImage: ''
  });
  
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [inviteMethods, setInviteMethods] = useState<InviteMethods>({
    link: true,
    email: true
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(typeof window !== 'undefined' ? window.scrollY > 20 : false);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const updates: Partial<FormData> = { name: newName };
    if (!isSlugTouched) {
      updates.slug = newName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugTouched(true);
    setFormData({
      ...formData, 
      slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
    });
  };

  const handleCitySelect = (city: string) => {
    setFormData({ ...formData, city: city, locationType: 'local' });
    setCityQuery(city);
    setShowCitySearch(false);
  };
  
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('请输入社群名称');
      return;
    }

    if (!formData.slug.trim()) {
      setError('请输入社群 URL');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录');
        setIsCreating(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          theme_color: formData.themeColor,
          privacy: formData.privacy,
          location_type: formData.locationType,
          location: formData.location,
          city: formData.city,
          cover_image_url: formData.coverImage,
          invite_link: inviteMethods.link,
          invite_email: inviteMethods.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '创建社群失败');
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ 社群创建成功:', data.data);
        router.push('/home?view=communities');
      } else {
        throw new Error(data.message || '创建社群失败');
      }
    } catch (err) {
      console.error('❌ 创建社群失败:', err);
      setError(err instanceof Error ? err.message : '创建社群失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    router.push('/home?view=communities');
  };
  
  const presetCovers = [
    { id: 'img1', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Nature' },
    { id: 'img2', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Tech' },
    { id: 'img3', url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Social' },
    { id: 'img4', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Urban' },
    { id: 'img5', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Creative' },
    { id: 'img6', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', name: 'Team' },
  ];
  
  const colors = [
    '#FF6B3D', '#8B5CF6', '#10B981', '#3B82F6', '#F43F5E', '#64748B'
  ];
  
  return (
    <div className="pb-32 min-h-screen bg-slate-50 font-sans selection:bg-[#FF6B3D] selection:text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
          .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
          .font-logo { font-family: 'Lalezar', system-ui; }
          .font-sans { font-family: 'Inter', sans-serif; }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 4px 20px -2px rgba(203, 213, 225, 0.2);
          }

          .input-ghost {
            background: transparent;
            border: none;
            outline: none;
            width: 100%;
            transition: all 0.2s;
          }
          .input-ghost::placeholder {
            color: #CBD5E1;
          }

          .pattern-grid {
            background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
            background-size: 20px 20px;
          }

          .bg-rainbow {
            background: conic-gradient(from 180deg at 50% 50%, #FF6B3D 0deg, #F43F5E 72deg, #8B5CF6 144deg, #3B82F6 216deg, #10B981 288deg, #FF6B3D 360deg);
          }
          
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
          }
        `}
      </style>

      {/* 顶部导航 */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200' : 'bg-transparent'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className={`text-sm font-bold text-slate-400 uppercase tracking-wider transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
            Create New Community
          </div>
          <div className="w-16"></div>
        </div>
      </nav>
  
      <main className="max-w-4xl mx-auto px-4 pt-24 animate-fade-in-up">
        
        {/* 视觉卡片 */}
        <div className="glass-card rounded-[2rem] overflow-hidden mb-8 relative group transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50">
          
          {/* 封面 */}
          <div className="h-64 relative flex items-center justify-center transition-all duration-500 bg-slate-100 overflow-hidden">
            {formData.coverImage ? (
                <img src={formData.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <div className="absolute inset-0 opacity-20 pattern-grid"></div>
            )}
            
            {!showCoverSelector ? (
              <button 
                onClick={() => setShowCoverSelector(true)}
                className="group/btn flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 text-slate-600 font-medium hover:bg-white hover:text-[#FF6B3D] hover:scale-105 transition-all z-10"
              >
                <ImageIcon size={18} />
                <span>{formData.coverImage ? 'Change Cover' : 'Add Cover Image'}</span>
              </button>
            ) : (
              <>
                {/* 遮罩层 */}
                <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowCoverSelector(false)}></div>
                
                <div className="absolute inset-x-4 top-4 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 z-20">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-[#FF6B3D]" />
                      Choose from Gallery
                    </h4>
                    <button onClick={() => setShowCoverSelector(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <button className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-[#FF6B3D] hover:bg-orange-50 flex flex-col items-center justify-center gap-1 transition-all group/upload">
                      <UploadCloud size={20} className="text-slate-400 group-hover/upload:text-[#FF6B3D]" />
                      <span className="text-[10px] font-bold text-slate-500">Upload</span>
                    </button>

                    {presetCovers.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setFormData({ ...formData, coverImage: preset.url });
                          setShowCoverSelector(false);
                        }}
                        className={`relative aspect-video rounded-xl shadow-sm overflow-hidden hover:scale-105 transition-all ring-2 ring-offset-2 ${formData.coverImage === preset.url ? 'ring-[#FF6B3D] ring-offset-white' : 'ring-transparent'}`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors"></div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
  
          {/* 信息 */}
          <div className="px-8 pb-12 relative bg-white/40 backdrop-blur-sm">
            <div className="-mt-12 mb-6 relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center border-4 border-white relative overflow-hidden group/avatar cursor-pointer hover:shadow-orange-500/20 transition-shadow">
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-4xl select-none">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '🎨'}
                </div>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <Camera className="text-white drop-shadow-md" size={24} />
                </div>
              </div>
            </div>
  
            <div className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Name your Community" 
                  className="input-ghost font-brand text-4xl md:text-5xl font-bold text-slate-900 placeholder-slate-300"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div>
                <textarea 
                  placeholder="Add a short description..." 
                  className="input-ghost font-sans text-xl text-slate-500 resize-none h-20 placeholder-slate-300 leading-relaxed"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
  
        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Col */}
          <div className="space-y-6">
            {/* URL Setting */}
            <div className="glass-card rounded-3xl p-6 group focus-within:ring-2 focus-within:ring-[#FF6B3D]/20 transition-all">
              <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AtSign size={16} className="text-[#FF6B3D]" />
                Community URL
              </label>
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-[#FF6B3D] transition-all">
                <div className="flex items-center text-slate-400 font-medium select-none border-r border-slate-200 pr-2 mr-2">
                  <span>herenow.com</span>
                  <span className="text-slate-300 mx-1">/</span>
                  <span className="text-slate-500">c</span>
                  <span className="text-slate-300 mx-1">/</span>
                </div>
                <input 
                  type="text" 
                  placeholder="my-awesome-club" 
                  className="bg-transparent outline-none flex-1 font-bold text-slate-900 placeholder-slate-300 min-w-0"
                  value={formData.slug}
                  onChange={handleSlugChange}
                />
                {formData.slug && (
                  <div className="ml-2">
                    <Check size={18} className="text-green-500" strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Theme Color */}
            <div className={`glass-card rounded-3xl p-6 relative transition-all ${showCustomPicker ? 'z-30' : ''}`}>
              <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500"></div>
                Theme Color
              </label>
              <div className="flex gap-3 flex-wrap items-center">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({...formData, themeColor: color})}
                    className={`w-10 h-10 rounded-full transition-all hover:scale-110 flex items-center justify-center shadow-sm ${formData.themeColor === color ? 'ring-2 ring-offset-2 ring-offset-white scale-110' : 'hover:shadow-md'}`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.themeColor === color && <Check size={16} className="text-white" strokeWidth={3} />}
                  </button>
                ))}
  
                <div className="relative">
                    {showCustomPicker && (
                      <div className="fixed inset-0 z-10 cursor-default" onClick={() => setShowCustomPicker(false)}></div>
                    )}
  
                    <button
                      onClick={() => setShowCustomPicker(!showCustomPicker)}
                      className={`w-10 h-10 rounded-full bg-rainbow hover:scale-110 transition-all flex items-center justify-center shadow-sm relative z-20 ${!colors.includes(formData.themeColor) ? 'ring-2 ring-offset-2 ring-offset-white scale-110' : 'hover:shadow-md opacity-80 hover:opacity-100'}`}
                    >
                       {!colors.includes(formData.themeColor) && <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                       {colors.includes(formData.themeColor) && <Palette size={16} className="text-white/90 drop-shadow-sm" />}
                    </button>
  
                    {showCustomPicker && (
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 z-30 w-48">
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-l border-t border-white/50"></div>
                          <div className="relative z-10">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hex Color</label>
                            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-[#FF6B3D] focus-within:ring-2 focus-within:ring-[#FF6B3D]/10 transition-all">
                                <span className="text-slate-400 font-mono select-none">#</span>
                                <input 
                                    type="text" 
                                    maxLength={6}
                                    placeholder="FFFFFF"
                                    className="w-full bg-transparent outline-none font-mono text-sm text-slate-700 uppercase"
                                    value={formData.themeColor.replace('#', '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({...formData, themeColor: '#' + val});
                                    }}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between px-1">
                                <span className="text-[10px] text-slate-400">Pick Color</span>
                                 <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                                     <input 
                                        type="color" 
                                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0 opacity-0" 
                                        value={formData.themeColor.startsWith('#') && formData.themeColor.length === 7 ? formData.themeColor : '#000000'}
                                        onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                                     />
                                     <div className="w-full h-full" style={{backgroundColor: formData.themeColor.startsWith('#') ? formData.themeColor : '#000'}}></div>
                                </div>
                            </div>
                          </div>
                       </div>
                    )}
                </div>
              </div>
            </div>
          </div>
  
          {/* Right Col */}
          <div className="space-y-6">
             {/* Location Card */}
             <div className="glass-card rounded-3xl p-6 h-full flex flex-col relative">
                <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-[#FF6B3D]" />
                  Location
                </label>
                
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button 
                    onClick={() => { setFormData({...formData, locationType: 'global', city: ''}); setShowCitySearch(false); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.locationType === 'global' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Global
                  </button>
                  <button 
                    onClick={() => { setFormData({...formData, locationType: 'local'}); setShowCitySearch(true); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.locationType === 'local' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    City Based
                  </button>
                </div>

                <div className="relative flex-1 min-h-[120px] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 transition-colors">
                   {formData.locationType === 'global' ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                          <Globe size={24} className="text-[#FF6B3D]" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Accessible everywhere</span>
                     </div>
                   ) : (
                     <>
                        {/* Static Map / City View */}
                        <div className={`absolute inset-0 transition-all ${showCitySearch ? 'blur-sm' : ''}`}>
                            <div className="absolute inset-0 opacity-30 grayscale pattern-grid"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                               <div 
                                 onClick={() => setShowCitySearch(true)}
                                 className="bg-white/90 backdrop-blur px-5 py-2.5 rounded-full shadow-lg shadow-slate-200/50 text-sm font-bold text-slate-700 flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
                               >
                                  <MapPin size={16} className="text-[#FF6B3D]" />
                                  <span>{formData.city || 'Pick a city'}</span>
                               </div>
                            </div>
                        </div>

                        {/* City Search Overlay */}
                        {showCitySearch && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col p-4 z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Search City</span>
                                    <button onClick={() => setShowCitySearch(false)}><X size={14} className="text-slate-400" /></button>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="San Francisco, London..." 
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-slate-800 placeholder-slate-300 focus:border-[#FF6B3D] focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none"
                                        value={cityQuery}
                                        onChange={(e) => setCityQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCitySelect(e.currentTarget.value);
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleCitySelect(cityQuery || 'San Francisco, CA')}
                                        className="absolute right-2 top-2 p-1 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#E55A2D] transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {['New York', 'Tokyo', 'Paris'].map(city => (
                                        <button 
                                            key={city}
                                            onClick={() => handleCitySelect(city)}
                                            className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-500 hover:bg-slate-200"
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                     </>
                   )}
                </div>
             </div>
          </div>
  
          {/* Privacy & Invitation Settings */}
          <div 
            className={`md:col-span-2 glass-card rounded-3xl p-6 transition-all ${formData.privacy === 'private' ? 'border-rose-200 bg-rose-50/30' : 'border-transparent hover:border-orange-200'}`}
          >
            <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setFormData({...formData, privacy: formData.privacy === 'public' ? 'private' : 'public'})}
            >
                <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${formData.privacy === 'private' ? 'bg-rose-100 text-rose-500' : 'bg-green-100 text-green-500'}`}>
                    {formData.privacy === 'private' ? <Lock size={28} /> : <Globe size={28} />}
                </div>
                <div>
                    <h3 className="font-brand font-bold text-slate-900 text-lg mb-1">
                    {formData.privacy === 'private' ? 'Private Circle' : 'Public Community'}
                    </h3>
                    <p className="text-slate-500 text-sm leading-tight max-w-md">
                    {formData.privacy === 'private' 
                        ? 'Only approved members can join. Invite only.' 
                        : 'Anyone can discover and join instantly.'}
                    </p>
                </div>
                </div>
                
                <div className="relative">
                <div className={`w-14 h-8 rounded-full transition-colors duration-300 ${formData.privacy === 'private' ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-sm transition-transform duration-300 ${formData.privacy === 'private' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                </div>
            </div>

            {/* Invitation Info for Private Communities */}
            {formData.privacy === 'private' && (
                <div className="mt-6 pt-6 border-t border-rose-200/50">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">Invitation Settings</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={() => setInviteMethods({...inviteMethods, link: !inviteMethods.link})}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left flex-1 group relative hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${inviteMethods.link ? 'bg-rose-50/80 border-rose-200 shadow-sm' : 'bg-slate-50/50 border-transparent hover:bg-slate-100'}`}
                        >
                            <div className={`p-2 rounded-lg transition-colors ${inviteMethods.link ? 'bg-rose-100 text-rose-500' : 'bg-slate-200 text-slate-400'}`}>
                                <LinkIcon size={16} />
                            </div>
                            <div>
                                <div className={`text-sm font-bold transition-colors ${inviteMethods.link ? 'text-rose-700' : 'text-slate-500'}`}>Invite Link</div>
                                <div className="text-xs text-slate-500 mt-0.5">A unique link will be generated after creation.</div>
                            </div>
                            {inviteMethods.link && (
                                <div className="absolute top-3 right-3 text-rose-500">
                                    <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                </div>
                            )}
                        </button>

                        <button 
                            onClick={() => setInviteMethods({...inviteMethods, email: !inviteMethods.email})}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 text-left flex-1 group relative hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${inviteMethods.email ? 'bg-rose-50/80 border-rose-200 shadow-sm' : 'bg-slate-50/50 border-transparent hover:bg-slate-100'}`}
                        >
                            <div className={`p-2 rounded-lg transition-colors ${inviteMethods.email ? 'bg-rose-100 text-rose-500' : 'bg-slate-200 text-slate-400'}`}>
                                <Mail size={16} />
                            </div>
                            <div>
                                <div className={`text-sm font-bold transition-colors ${inviteMethods.email ? 'text-rose-700' : 'text-slate-500'}`}>Email Invite</div>
                                <div className="text-xs text-slate-500 mt-0.5">You can invite members via email later.</div>
                            </div>
                            {inviteMethods.email && (
                                <div className="absolute top-3 right-3 text-rose-500">
                                    <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>
  
      </main>
  
      {/* Bottom Actions */}
      <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-xl p-2 rounded-[2rem] shadow-2xl shadow-orange-500/20 border border-white/50 flex items-center gap-2 pr-3 pl-3 transform transition-all hover:scale-105">
           <button 
            onClick={handleBack}
            className="px-6 py-3 rounded-3xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
           >
             Cancel
           </button>
           <div className="w-px h-6 bg-slate-200"></div>
           <button 
            onClick={handleCreate}
            disabled={isCreating || !formData.name}
            className={`px-8 py-3 rounded-3xl font-bold shadow-lg flex items-center gap-2 transition-all ${
              formData.name && !isCreating
                ? 'bg-[#FF6B3D] text-white shadow-orange-500/30 hover:shadow-orange-500/50' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
           >
             {isCreating ? (
               <>
                 <span>Creating...</span>
               </>
             ) : (
               <>
                 <span>Create Community</span>
                 <ChevronRight size={18} strokeWidth={3} />
               </>
             )}
           </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-32 left-0 right-0 z-50 flex justify-center px-4">
          <div className="bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg max-w-md">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

