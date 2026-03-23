import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Compass, 
  Plus, 
  Search, 
  Bell, 
  User, 
  Users, 
  MoreHorizontal, 
  Globe, 
  Lock,
  Zap,
  Image as ImageIcon, 
  Camera, 
  MapPin, 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  AtSign, 
  UploadCloud, 
  X, 
  Sparkles, 
  Palette,
  Pin,
  Trash2,
  LogOut,
  Clock,
  History,
  Link as LinkIcon,
  Mail,
  CheckCircle2
} from 'lucide-react';

// --- Main App Controller ---
const HereNowCommunities = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create'

  const handleNavigateToCreate = () => {
    window.scrollTo(0, 0);
    setCurrentView('create');
  };

  const handleNavigateBack = () => {
    window.scrollTo(0, 0);
    setCurrentView('list');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#FF6B3D] selection:text-white">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
          .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
          .font-logo { font-family: 'Lalezar', system-ui; }
          .font-sans { font-family: 'Inter', sans-serif; }
          
          .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.6);
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 4px 20px -2px rgba(203, 213, 225, 0.2);
          }

          .text-gradient {
            background: linear-gradient(135deg, #FF6B3D 0%, #FF9E7D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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

          /* 彩虹渐变按钮 */
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

      {currentView === 'list' ? (
        <CommunitiesList onNavigateToCreate={handleNavigateToCreate} />
      ) : (
        <CreateCommunityPage onBack={handleNavigateBack} />
      )}
    </div>
  );
};

// --- Helper Functions ---
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years}y ${months > 0 ? months + 'mo' : ''}`;
  }
  if (months > 0) {
    return `${months}mo`;
  }
  return `${diffDays}d`;
};

// --- Page 1: Communities List View ---
const CommunitiesList = ({ onNavigateToCreate }) => {
  // 模拟数据：我的社区
  const [myCommunities, setMyCommunities] = useState([
    {
      id: 1,
      name: "Tim's Design Club",
      members: 1240,
      avatar: "🎨",
      color: "bg-purple-100",
      role: "Owner",
      isPinned: false,
      createdAt: '2023-08-15' // 1年3个月前
    },
    {
      id: 2,
      name: "AI Enthusiasts",
      members: 856,
      avatar: "🤖",
      color: "bg-green-100",
      role: "Owner",
      isPinned: false,
      createdAt: '2024-05-10' // 6个月前
    },
    {
      id: 3,
      name: "Weekend Hikers",
      members: 42,
      avatar: "🏔️",
      color: "bg-orange-100",
      role: "Owner",
      isPinned: false,
      createdAt: '2024-11-01' // 不久前
    }
  ]);

  // 模拟数据：已加入的社区 (Joined)
  const [joinedCommunities, setJoinedCommunities] = useState([
    {
      id: 101,
      name: "React Developers",
      members: 15400,
      avatar: "⚛️",
      color: "bg-blue-100",
      newPosts: 5,
      isPinned: false,
      joinedAt: '2022-11-01' // 2年前
    },
    {
      id: 102,
      name: "Startup Grinders",
      members: 3200,
      avatar: "🚀",
      color: "bg-rose-100",
      newPosts: 0,
      isPinned: false,
      joinedAt: '2024-04-15' // 7个月前
    }
  ]);

  // --- My Communities Handlers ---
  const handlePinMy = (id) => {
    setMyCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, isPinned: !c.isPinned };
      return c;
    }));
  };

  const handleDeleteMy = (id) => {
    if(window.confirm("Are you sure you want to delete this community? This cannot be undone.")) {
        setMyCommunities(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- Joined Communities Handlers ---
  const handlePinJoined = (id) => {
    setJoinedCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, isPinned: !c.isPinned };
      return c;
    }));
  };

  const handleLeaveJoined = (id) => {
    if(window.confirm("Are you sure you want to leave this community?")) {
        setJoinedCommunities(prev => prev.filter(c => c.id !== id));
    }
  };

  // 排序逻辑：置顶的排在前面
  const sortedMyCommunities = [...myCommunities].sort((a, b) => {
    return (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0);
  });

  const sortedJoinedCommunities = [...joinedCommunities].sort((a, b) => {
    return (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0);
  });

  return (
    <div className="animate-fade-in">
      {/* 顶部导航栏 */}
      <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左侧 Logo 与 导航链接 */}
            <div className="flex items-center gap-8">
              <a href="#" className="font-logo text-3xl text-[#FF6B3D] tracking-wide hover:scale-105 transition-transform">
                HereNow
              </a>
              <div className="hidden md:flex items-center gap-1">
                <NavLink icon={<Calendar size={18} />} text="Events" />
                <NavLink icon={<Users size={18} />} text="Communities" active />
                <NavLink icon={<Compass size={18} />} text="Discover" />
              </div>
            </div>

            {/* 右侧工具栏 */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs font-medium text-slate-400">10:12 PM GMT+8</span>
              
              <button 
                onClick={onNavigateToCreate}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#FF6B3D] hover:bg-[#E55A2D] text-white text-sm font-bold rounded-full transition-all shadow-lg shadow-orange-200 hover:shadow-orange-300"
              >
                <Plus size={16} strokeWidth={3} />
                <span>Create</span>
              </button>
              
              <div className="flex items-center gap-2">
                <IconButton icon={<Search size={20} />} />
                <IconButton icon={<Bell size={20} />} />
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <User size={16} className="text-slate-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        
        {/* Hero Copy 区域 */}
        <div className="mb-16 mt-8 animate-fade-in-up">
          <h1 className="font-brand text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Your Community <br />
            <span className="text-gradient">Connections</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed">
            Build meaningful relationships and grow with the people who share your passions.
          </p>
        </div>

        {/* My Communities Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-brand text-2xl font-bold text-slate-900 flex items-center gap-2">
              My Communities
              <span className="bg-orange-50 text-[#FF6B3D] text-xs font-bold px-2 py-1 rounded-lg border border-orange-100">
                {myCommunities.length}
              </span>
            </h2>
            <button 
              onClick={onNavigateToCreate}
              className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-[#FF6B3D] hover:text-[#FF6B3D] transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
              Create New
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMyCommunities.map((community) => (
              <CommunityCard 
                key={community.id} 
                data={community} 
                type="mine" 
                onPin={() => handlePinMy(community.id)}
                onDelete={() => handleDeleteMy(community.id)}
              />
            ))}
            
            {/* Create New Placeholder Card - 增加 active:scale 交互 */}
            <button 
              onClick={onNavigateToCreate}
              className="group relative flex flex-col items-center justify-center h-48 rounded-3xl border-2 border-dashed border-slate-200 hover:border-[#FF6B3D]/50 hover:bg-orange-50/30 active:scale-[0.98] active:bg-orange-50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#FF6B3D] transition-all duration-300">
                <Plus size={24} className="text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <span className="font-brand font-bold text-slate-500 group-hover:text-[#FF6B3D]">New Community</span>
            </button>
          </div>
        </section>

        {/* Joined Communities Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-brand text-2xl font-bold text-slate-900">
              Joined
            </h2>
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedJoinedCommunities.map((community) => (
                <CommunityCard 
                    key={community.id} 
                    data={community} 
                    type="joined" 
                    onPin={() => handlePinJoined(community.id)}
                    onDelete={() => handleLeaveJoined(community.id)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-12 flex flex-col items-center text-center max-w-lg mx-auto mt-8">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-300" />
              </div>
              <h3 className="font-brand text-lg font-bold text-slate-900">No Communities Joined</h3>
              <p className="text-slate-500 mt-2 mb-6">You haven't joined any communities yet.</p>
              <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800">
                Explore Communities
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-[#FF6B3D] transition-colors">Discover</a>
            <a href="#" className="hover:text-[#FF6B3D] transition-colors">Pricing</a>
            <a href="#" className="hover:text-[#FF6B3D] transition-colors">Help</a>
          </div>
          <div className="flex gap-4 text-slate-400">
            <SocialIcon icon="twitter" />
            <SocialIcon icon="instagram" />
          </div>
        </div>
        <div className="text-center pb-8">
          <a href="#" className="text-sm font-semibold text-[#FF6B3D] hover:text-[#E55A2D] flex items-center justify-center gap-1 group">
            Host your community with HereNow 
            <span className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">↗</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

// --- Page 2: Create Community View ---
const CreateCommunityPage = ({ onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slug: '',
        themeColor: '#FF6B3D',
        privacy: 'public',
        locationType: 'global',
        location: '',
        city: '', // 增加城市字段
        coverImage: ''
      });
    
      const [showCoverSelector, setShowCoverSelector] = useState(false);
      const [showCustomPicker, setShowCustomPicker] = useState(false);
      const [isScrolled, setIsScrolled] = useState(false);
      const [isSlugTouched, setIsSlugTouched] = useState(false);
      // 城市搜索状态
      const [showCitySearch, setShowCitySearch] = useState(false);
      const [cityQuery, setCityQuery] = useState('');
      // 邀请设置状态
      const [inviteMethods, setInviteMethods] = useState({
        link: true,
        email: true
      });
    
      useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
      }, []);
    
      const handleNameChange = (e) => {
        const newName = e.target.value;
        const updates = { name: newName };
        if (!isSlugTouched) {
          updates.slug = newName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        }
        setFormData(prev => ({ ...prev, ...updates }));
      };
    
      const handleSlugChange = (e) => {
        setIsSlugTouched(true);
        setFormData({
          ...formData, 
          slug: e.target.value.toLowerCase().replace(/\s+/g, '-')
        });
      };

      // 模拟城市选择确认
      const handleCitySelect = (city) => {
        setFormData({ ...formData, city: city, locationType: 'local' });
        setCityQuery(city);
        setShowCitySearch(false);
      };
    
      const handleCreate = () => {
        console.log("Creating community:", { ...formData, inviteMethods });
        onBack(); 
      };
    
      // 升级后的图片封面库 (使用 Unsplash Source)
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
        <div className="pb-32">
          {/* 顶部导航 (Create Page) */}
          <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200' : 'bg-transparent'}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <button 
                onClick={onBack}
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
                    
                    <div className="absolute inset-x-4 top-4 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 animate-fade-in z-20">
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
                            onClick={() => setFormData({ ...formData, coverImage: preset.url })}
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
                      <div className="ml-2 animate-scale-in">
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
                        style={{ backgroundColor: color, '--tw-ring-color': color }}
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
                           <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 p-3 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 z-30 w-48 animate-fade-in">
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
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col p-4 z-10 animate-fade-in">
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
                                                    handleCitySelect(e.target.value);
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
                    <div className="mt-6 pt-6 border-t border-rose-200/50 animate-fade-in">
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
                                    <div className="absolute top-3 right-3 text-rose-500 animate-scale-in">
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
                                    <div className="absolute top-3 right-3 text-rose-500 animate-scale-in">
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
                onClick={onBack}
                className="px-6 py-3 rounded-3xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
               >
                 Cancel
               </button>
               <div className="w-px h-6 bg-slate-200"></div>
               <button 
                onClick={handleCreate}
                className={`px-8 py-3 rounded-3xl font-bold shadow-lg flex items-center gap-2 transition-all ${
                  formData.name 
                    ? 'bg-[#FF6B3D] text-white shadow-orange-500/30 hover:shadow-orange-500/50' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!formData.name}
               >
                 <span>Create Community</span>
                 <ChevronRight size={18} strokeWidth={3} />
               </button>
            </div>
          </div>
        </div>
      );
};

// --- 子组件 (Helper Components) ---

const NavLink = ({ icon, text, active }) => (
  <a 
    href="#" 
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
  >
    <span className={active ? "text-[#FF6B3D]" : ""}>{icon}</span>
    <span>{text}</span>
  </a>
);

const IconButton = ({ icon }) => (
  <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
    {icon}
  </button>
);

// --- Community Card ---
const CommunityCard = ({ data, type, onPin, onDelete }) => {
  const isOwner = type === 'mine';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // 判断是否显示操作菜单 (Owner 或 Joined 都有操作)
  const showActionMenu = isOwner || type === 'joined';
  // 也可以简单判断传入了 action props
  const hasActions = onPin || onDelete;

  // Time display logic
  let timeDisplay = null;
  if (isOwner && data.createdAt) {
      timeDisplay = `Created ${getRelativeTime(data.createdAt)} ago`;
  } else if (!isOwner && data.joinedAt) {
      timeDisplay = `Joined ${getRelativeTime(data.joinedAt)} ago`;
  }

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="group glass-card rounded-3xl p-6 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 active:scale-[0.98] active:shadow-sm transition-all duration-300 cursor-pointer border-transparent hover:border-orange-100 relative flex flex-col h-full">
      
      {/* 右上角置顶标识 (Pin Indicator) */}
      {data.isPinned && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center z-10 text-[#FF6B3D] animate-bounce-in">
           <Pin size={14} fill="currentColor" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl ${data.color} flex items-center justify-center text-2xl shadow-inner`}>
          {data.avatar}
        </div>
        
        {/* 菜单按钮 & 下拉框 */}
        {hasActions ? (
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-all ${showMenu ? 'bg-slate-100 text-slate-900 opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            >
              <MoreHorizontal size={20} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-20 overflow-hidden animate-fade-in">
                <div className="p-1">
                    <button 
                        onClick={() => { onPin && onPin(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                    >
                        <Pin size={14} className={data.isPinned ? "fill-current" : ""} />
                        <span>{data.isPinned ? 'Unpin' : 'Pin to top'}</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                        onClick={() => { onDelete && onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-left"
                    >
                        {isOwner ? <Trash2 size={14} /> : <LogOut size={14} />}
                        <span>{isOwner ? 'Delete' : 'Leave'}</span>
                    </button>
                </div>
              </div>
            )}
          </div>
        ) : (
           // 无操作时的占位 (保持布局一致性)
           <button className="opacity-0 pointer-events-none p-2">
             <MoreHorizontal size={20} />
           </button>
        )}
      </div>

      <h3 className="font-brand text-xl font-bold text-slate-900 mb-1 truncate pr-2">
        {data.name}
      </h3>
      
      <div className="mt-auto pt-4 flex flex-col gap-2">
         {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
            <Users size={14} className={isOwner ? "text-[#FF6B3D]" : "text-slate-400"} />
            <span>{formatNumber(data.members)} members</span>
            </div>
            
             {/* Time Display */}
            {timeDisplay && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span>{timeDisplay}</span>
                </div>
            )}
        </div>

        {/* Status Row (Optional, if needed separate) */}
         <div className="flex items-center gap-2">
            {isOwner ? (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">Owner</span>
            ) : (
            data.newPosts > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                New Posts
                </span>
            )
            )}
        </div>
      </div>
      
      <div className="w-0 group-hover:w-full h-1 bg-[#FF6B3D] mt-6 rounded-full transition-all duration-500 opacity-80 absolute bottom-0 left-0 right-0 mx-6 mb-6" style={{position: 'relative', margin: '24px 0 0 0'}} />
    </div>
  );
};

const SocialIcon = () => (
  <div className="w-5 h-5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors cursor-pointer"></div>
);

const formatNumber = (num) => {
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num;
};

export default HereNowCommunities;