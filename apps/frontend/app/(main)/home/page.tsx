'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import useSWR from 'swr';
import { 
  Calendar, 
  Search, 
  Plus, 
  MapPin,
  Clock,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Download,
  Users,
  Trash2,
} from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import ImportModal from '@/components/home/ImportModal';
import CommunityCard from '@/components/home/CommunityCard';
import EventCard from '@/components/home/EventCard';
import { getHomeData, deleteEvent } from '@/lib/api/client';
import { useEntitlements } from '@/hooks/useEntitlements';

interface Event {
  id: number | string; // 支持 UUID 字符串
  title: string;
  date: string;
  time: string;
  location: string;
  imageColor: string;
  category: string;
  isPinned?: boolean;
  registrationCount?: number; // 报名人数
  coverImageUrl?: string | null; // 活动封面图片
}

interface EventsData {
  upcoming: Event[];
  past: Event[];
}

interface Community {
  id: number;
  name: string;
  members: number;
  avatar: string;
  color: string;
  role?: string;
  isPinned: boolean;
  createdAt?: string;
  joinedAt?: string;
  newPosts?: number;
}

// FilterButton 组件 - 仅在此页面使用
function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-3 rounded-2xl text-sm font-bold font-brand transition-all duration-200 border ${
        active
          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

// Helper Functions for Communities
const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffTime = Math.abs(now.getTime() - date.getTime());
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

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

// 内部组件：处理 searchParams
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { canAccessCommunity, canAccessDiscover, isLoading: entitlementsLoading } = useEntitlements();
  const [currentView, setCurrentView] = useState<'events' | 'communities'>('events');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isHoveringCreate, setIsHoveringCreate] = useState(false);

  // 根据 URL 参数设置视图
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'communities') {
      // 检查权限，如果没有权限则保持在 events 视图
      if (canAccessCommunity) {
        setCurrentView('communities');
      } else {
        setCurrentView('events');
      }
    } else if (view === 'events') {
      setCurrentView('events');
    }
  }, [searchParams, canAccessCommunity]);

  // 处理视图切换，检查权限
  const handleViewChange = (view: 'events' | 'communities') => {
    if (view === 'communities' && !canAccessCommunity) {
      // 如果没有权限，显示提示或阻止切换
      alert('您当前的套餐不支持访问 Communities 功能，请升级套餐后使用。');
      return;
    }
    setCurrentView(view);
  };
  
  // Search, Filter, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // NEW: Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Data Loading State - 移除 isLoading，页面立即显示
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Data State
  const [eventsData, setEventsData] = useState<EventsData>({
    upcoming: [],
    past: []
  });

  const filterOptions = {
    upcoming: [
      { label: 'All', value: 'all' },
      { label: 'This Week', value: 'this-week' },
      { label: 'This Month', value: 'this-month' },
    ],
    past: [
      { label: 'All', value: 'all' },
      { label: 'Last Month', value: 'last-month' },
      { label: 'Last 3 Months', value: 'last-3-months' },
    ]
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, activeFilter]);

  const currentTabEvents = eventsData[activeTab] || [];
  const filteredEvents = currentTabEvents
    .filter(event => {
      // 模糊搜索活动名称（不区分大小写）
      const matchesSearch = searchTerm === '' || 
                            event.title.toLowerCase().includes(searchTerm.toLowerCase().trim());
      const matchesFilter = activeFilter === 'all' || event.category === activeFilter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // 置顶的排在前面
      return (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0);
    });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Import Handler
  const handleImport = () => {
    if (!importUrl) return;
    setImportStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setImportStatus('success');
      // Mock adding event after delay
      setTimeout(() => {
        const newEvent: Event = {
          id: Date.now(),
          title: "Imported Event: Tech Mixer",
          date: "DEC 10",
          time: "6:00 PM",
          location: "Imported Location",
          imageColor: "from-indigo-500 to-purple-600",
          category: "next-month"
        };
        
        setEventsData(prev => ({
          ...prev,
          upcoming: [newEvent, ...prev.upcoming]
        }));
        
        setImportUrl('');
        setImportStatus('idle');
        setIsImportModalOpen(false);
      }, 1000);
    }, 1500);
  };

  const handleImportUrlChange = (url: string) => {
    setImportUrl(url);
    if (importStatus === 'error') {
      setImportStatus('idle');
    }
  };

  // Event Handlers
  const handlePinEvent = (eventId: number | string) => {
    setEventsData(prev => ({
      upcoming: prev.upcoming.map(e => e.id === eventId ? { ...e, isPinned: !e.isPinned } : e),
      past: prev.past.map(e => e.id === eventId ? { ...e, isPinned: !e.isPinned } : e)
    }));
  };

  // Delete confirmation modal state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: number | string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteEvent = (eventId: number | string) => {
    // 找到要删除的活动
    const event = [...eventsData.upcoming, ...eventsData.past].find(e => e.id === eventId);
    if (event) {
      setEventToDelete({ id: eventId, title: event.title });
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    setIsDeleting(true);
    try {
      // 调用后端删除接口
      await deleteEvent(String(eventToDelete.id));
      
      // 乐观更新：立即从状态中移除活动
      setEventsData(prev => ({
        upcoming: prev.upcoming.filter(e => e.id !== eventToDelete.id),
        past: prev.past.filter(e => e.id !== eventToDelete.id)
      }));
      
      // 使用 SWR 重新验证数据，确保数据同步
      await refreshHomeData();
      
      // 关闭确认对话框
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
    } catch (error: any) {
      console.error('Delete event failed:', error);
      alert(error.message || 'Failed to delete event. Please try again.');
      // 删除失败时，重新获取数据以恢复状态
      await refreshHomeData();
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteEvent = () => {
    setDeleteConfirmOpen(false);
    setEventToDelete(null);
  };

  // Communities Data and Handlers
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);

  // 使用 SWR 管理数据获取（最佳实践）
  // SWR 的优势：
  // 1. 自动缓存，避免重复请求
  // 2. 自动去重（10秒内相同请求只执行一次）
  // 3. 更好的加载和错误状态管理
  // 4. 支持乐观更新
  const { data: homeData, error: homeError, isLoading: isDataLoading, mutate: refreshHomeData } = useSWR(
    'home-data', // 缓存 key（全局唯一，确保所有组件共享同一份数据）
    getHomeData, // fetcher 函数
    {
      // 优化配置：避免重复请求
      dedupingInterval: 10000, // 10秒内相同请求去重（关键：防止 React StrictMode 导致的重复请求）
      revalidateOnFocus: true, // 开启聚焦时重新验证（确保从其他页面返回时刷新数据）
      revalidateOnReconnect: true, // 网络重连时重新验证
      revalidateIfStale: true, // 开启自动重新验证（确保数据是最新的）
      errorRetryCount: 2, // 错误重试次数
      errorRetryInterval: 3000, // 错误重试间隔
      onSuccess: (data) => {
        console.log('📊 SWR 获取到的首页数据:', data);
        
        // 设置活动数据
        if (data?.events) {
          console.log('📅 活动数据:', {
            upcoming: data.events.upcoming?.length || 0,
            past: data.events.past?.length || 0,
          });
          setEventsData({
            upcoming: Array.isArray(data.events.upcoming) ? data.events.upcoming : [],
            past: Array.isArray(data.events.past) ? data.events.past : []
          });
        } else {
          console.warn('⚠️ 返回数据中没有 events 字段，完整数据:', data);
          setEventsData({ upcoming: [], past: [] });
        }
        
        // 设置社群数据
        if (data?.communities) {
          setMyCommunities(data.communities.myCommunities || []);
          setJoinedCommunities(data.communities.joinedCommunities || []);
        } else {
          console.warn('⚠️ 返回数据中没有 communities 字段');
          setMyCommunities([]);
          setJoinedCommunities([]);
        }
      },
      onError: (error) => {
        console.error('❌ SWR 加载首页数据失败:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load data');
        // 使用空数据，保持页面可用
        setEventsData({ upcoming: [], past: [] });
        setMyCommunities([]);
        setJoinedCommunities([]);
      }
    }
  );

  // 监听页面可见性变化和路由变化，确保从其他页面返回时重新获取数据
  useEffect(() => {
    // 处理页面可见性变化（用户切换标签页或返回页面）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/home') {
        console.log('🔄 页面重新可见，重新验证数据');
        refreshHomeData();
      }
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, refreshHomeData]);

  // 监听路由变化，当返回到 home 页面时重新验证数据
  useEffect(() => {
    if (pathname === '/home') {
      console.log('🔄 路由变化到 home 页面，重新验证数据');
      // 延迟一点执行，确保组件已完全挂载
      const timer = setTimeout(() => {
        refreshHomeData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, refreshHomeData]);

  const handlePinMy = (id: number) => {
    setMyCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, isPinned: !c.isPinned };
      return c;
    }));
  };

  const handleDeleteMy = (id: number) => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to delete this community? This cannot be undone.")) {
      setMyCommunities(prev => prev.filter(c => c.id !== id));
    }
  };

  const handlePinJoined = (id: number) => {
    setJoinedCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, isPinned: !c.isPinned };
      return c;
    }));
  };

  const handleLeaveJoined = (id: number) => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to leave this community?")) {
      setJoinedCommunities(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleNavigateToCreateCommunity = () => {
    router.push('/create/community');
  };

  const handleNavigateToCreateEvent = () => {
    router.push('/create/event');
  };

  // 排序逻辑：置顶的排在前面
  const sortedMyCommunities = [...myCommunities].sort((a, b) => {
    return (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0);
  });

  const sortedJoinedCommunities = [...joinedCommunities].sort((a, b) => {
    return (b.isPinned === true ? 1 : 0) - (a.isPinned === true ? 1 : 0);
  });

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900 ${isImportModalOpen ? 'overflow-hidden h-screen' : ''}`}>
      
      {/* 导航栏 (Navbar) */}
      <Navbar 
        onCreateEventClick={currentView === 'events' ? handleNavigateToCreateEvent : handleNavigateToCreateCommunity} 
        variant="default" 
        showTime={true}
        currentView={currentView}
        onViewChange={handleViewChange}
        canAccessCommunity={canAccessCommunity}
        canAccessDiscover={canAccessDiscover}
      />

      {/* Main Content Area - 立即显示，数据加载时显示空状态 */}
      <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col relative z-0">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {currentView === 'events' ? (
              <>
                <h1 className="text-5xl md:text-7xl font-brand font-extrabold tracking-tight leading-[1.1] mb-4">
                  <span className="text-slate-900">Your Event </span>
                  <span className="bg-gradient-to-r from-[#FF6B3D] to-[#FF9E7D] bg-clip-text text-transparent">Records</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed whitespace-nowrap">
                  Record every amazing moment you've been a part of.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-5xl md:text-7xl font-brand font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
                  Your Community <br />
                  <span className="text-gradient">Connections</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-500 font-medium max-w-md leading-relaxed">
                  Build meaningful relationships and grow with the people who share your passions.
                </p>
              </>
            )}
          </div>

          {currentView === 'events' && (
            <div className="flex flex-col items-end gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-slate-200/50 p-1 rounded-2xl inline-flex">
                {(['upcoming', 'past'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setSearchTerm(''); setActiveFilter('all'); }} 
                    className={`px-6 py-2 rounded-xl text-sm font-bold font-brand capitalize transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {currentView === 'communities' ? (
          // 检查权限，如果没有权限则显示提示
          !canAccessCommunity ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-white rounded-3xl p-12 max-w-md shadow-lg border border-slate-200">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-[#FF6B3D]" />
                </div>
                <h2 className="text-2xl font-brand font-bold text-slate-900 mb-3">Communities 功能未开启</h2>
                <p className="text-slate-500 mb-6 leading-relaxed">
                  您当前的套餐不支持访问 Communities 功能。请升级到 Pro 套餐以解锁此功能。
                </p>
                <button 
                  onClick={() => setCurrentView('events')}
                  className="w-full bg-[#FF6B3D] text-white px-6 py-3 rounded-xl font-bold font-brand hover:bg-[#ff5a26] transition-colors"
                >
                  返回 Events
                </button>
              </div>
            </div>
          ) : (
          <>
            {/* My Communities Section */}
            <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6">
                <h2 className="font-brand text-2xl font-bold text-slate-900 flex items-center gap-2">
                  My Communities
                  <span className="bg-orange-50 text-[#FF6B3D] text-xs font-bold px-2 py-1 rounded-lg border border-orange-100">
                    {myCommunities.length}
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMyCommunities.map((community) => (
                  <CommunityCard 
                    key={community.id} 
                    data={community} 
                    type="mine" 
                    onPin={() => handlePinMy(community.id)}
                    onDelete={() => handleDeleteMy(community.id)}
                    getRelativeTime={getRelativeTime}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            </section>

            {/* Joined Communities Section */}
            <section className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
                        getRelativeTime={getRelativeTime}
                        formatNumber={formatNumber}
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
          </>
          )
        ) : currentTabEvents.length === 0 ? (
          // --- Empty State View (完全没有活动) ---
          <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative mb-8 group">
              <div className="absolute -inset-4 bg-orange-200/30 blur-2xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
              <div className="relative">
                <div className="absolute top-0 left-8 w-24 h-24 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl -rotate-12 transform origin-bottom-left"></div>
                <div className="absolute top-0 right-8 w-24 h-24 bg-[#FF6B3D]/10 backdrop-blur-md border border-white/60 rounded-2xl rotate-12 transform origin-bottom-right"></div>
                <div className="relative w-32 h-32 bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl shadow-orange-500/10 flex items-center justify-center z-10 transform transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="relative">
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#FF6B3D] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">0</div>
                     <Calendar size={48} className="text-slate-300 group-hover:text-[#FF6B3D] transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-brand font-bold text-slate-900 mb-3 capitalize">No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Events</h2>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed font-medium">
              {activeTab === 'upcoming' ? "You have no upcoming events scheduled. Why not take the lead and host something amazing today?" : "No past events found. Your journey is just beginning!"}
            </p>

            <button 
              onClick={handleNavigateToCreateEvent}
              onMouseEnter={() => setIsHoveringCreate(true)}
              onMouseLeave={() => setIsHoveringCreate(false)}
              className="group relative flex items-center gap-3 bg-[#FF6B3D] text-white px-8 py-4 rounded-2xl font-brand font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              <Plus size={20} className={`transition-transform duration-300 ${isHoveringCreate ? 'rotate-90' : ''}`} />
              <span>Create Event</span>
            </button>

            {/* Import Button for Empty State (Updated Style) */}
            <div className="mt-6 flex flex-col items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">or</span>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-500 font-bold font-brand shadow-sm hover:border-[#FF6B3D]/30 hover:bg-orange-50/50 hover:text-[#FF6B3D] hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-1 rounded-full bg-slate-100 group-hover:bg-[#FF6B3D]/10 transition-colors">
                   <LinkIcon size={16} className="text-slate-400 group-hover:text-[#FF6B3D] transition-colors" />
                </div>
                <span>Import from external link</span>
              </button>
            </div>
          </div>
        ) : (
          // --- Events View (有活动数据) ---
          <div className="flex flex-col gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            
            {/* Search & Filter & Import Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="搜索活动名称..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B3D]/50 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"><X size={16} /></button>
                )}
              </div>

              {/* Import Button (Icon style for compact toolbar) */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-slate-600 font-bold font-brand bg-white border border-slate-200 hover:border-[#FF6B3D] hover:text-[#FF6B3D] hover:bg-orange-50 transition-all shadow-sm"
              >
                <Download size={18} />
                <span>Import</span>
              </button>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {filterOptions[activeTab].map((option) => (
                   <FilterButton 
                    key={option.value}
                    label={option.label} 
                    active={activeFilter === option.value} 
                    onClick={() => setActiveFilter(option.value)} 
                  />
                ))}
              </div>
            </div>

            {/* Event Grid */}
            {filteredEvents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[500px] content-start">
                  {paginatedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      data={event}
                      isOwner={true}
                      onPin={() => handlePinEvent(event.id)}
                      onDelete={() => handleDeleteEvent(event.id)}
                    />
                  ))}
                  
                  {/* Create New Card */}
                  {searchTerm === '' && activeFilter === 'all' && currentPage === totalPages && (
                    <div 
                        onClick={handleNavigateToCreateEvent}
                        className="min-h-[300px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-[#FF6B3D]/50 hover:bg-[#FF6B3D]/5 hover:text-[#FF6B3D] transition-all cursor-pointer group"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center mb-3 transition-colors">
                          <Plus size={24} />
                        </div>
                        <span className="font-bold font-brand">Create New Event</span>
                    </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-slate-100">
                     <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500"><ChevronLeft size={20} /></button>
                     <span className="text-sm font-bold text-slate-600 font-brand">Page {currentPage} of {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500"><ChevronRight size={20} /></button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="font-medium">未找到匹配 "{searchTerm}" 的活动</p>
                <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="mt-4 text-[#FF6B3D] font-bold text-sm hover:underline">清除搜索</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* --- IMPORT MODAL --- */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importUrl={importUrl}
        onImportUrlChange={handleImportUrlChange}
        importStatus={importStatus}
        onImport={handleImport}
      />

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Delete Event</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700">
                Are you sure you want to delete <strong>"{eventToDelete?.title}"</strong>? 
                This will permanently remove the event and all associated data.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelDeleteEvent}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 默认导出：用 Suspense 包裹
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
