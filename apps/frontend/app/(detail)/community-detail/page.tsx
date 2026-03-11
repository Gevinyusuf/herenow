'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Clock,
  Instagram, 
  Globe, 
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import LeaveModal from '@/components/detail/LeaveModal';
import DetailNavbar from '@/components/detail/DetailNavbar';
import CommunityWall from '@/components/detail/CommunityWall';
import EventCard from '@/components/detail/EventCard';

interface Reply {
  id: number;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  replies: Reply[];
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: string;
  image: string;
}

interface CommunityData {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  foundedDate: string;
  creator: {
    name: string;
    avatar: string;
    handle: string;
  };
  bio: string;
  banner: string;
}

export default function CommunityDetailPage() {
  const searchParams = useSearchParams();
  const communityId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming'>('all');
  const [isJoined, setIsJoined] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock events data (暂时保留，后续可以从 API 获取)
  const events: Event[] = [
    {
      id: 1,
      title: "Sunset Hike at Lands End",
      date: "Oct 24, 2023",
      time: "16:30 PM",
      location: "Lands End Lookout, SF",
      attendees: 42,
      status: "Upcoming",
      image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=600"
    }
  ];

  // Mock comments data (暂时保留，后续可以从 API 获取)
  const comments: Comment[] = [];

  // 获取社群详情
  useEffect(() => {
    const fetchCommunityDetail = async () => {
      if (!communityId) {
        setError('社群 ID 不存在');
        setIsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/communities/${communityId}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!response.ok) {
          throw new Error('获取社群详情失败');
        }

        const data = await response.json();

        if (data.success && data.data) {
          const detail = data.data;
          
          setCommunityData({
            id: detail.community_id,
            name: detail.community_name || '未命名社群',
            category: detail.community_settings?.category || '社群',
            memberCount: detail.community_members_count || 0,
            foundedDate: detail.community_created_at 
              ? `Est. ${new Date(detail.community_created_at).getFullYear()}`
              : 'Est. 2024',
            creator: {
              name: detail.owner_name || '未知',
              avatar: detail.owner_avatar_url || 'https://ui-avatars.com/api/?name=Unknown&background=FF6B3D&color=fff',
              handle: `@${detail.owner_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}`
            },
            bio: detail.community_description || '暂无描述',
            banner: detail.community_cover_image_url || 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=1200'
          });

          setIsJoined(detail.is_member || false);
        } else {
          throw new Error(data.message || '获取社群详情失败');
        }
      } catch (err) {
        console.error('获取社群详情失败:', err);
        setError(err instanceof Error ? err.message : '获取社群详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityDetail();
  }, [communityId]);

  const handleJoinToggle = async () => {
    if (isJoined) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/communities/${communityId}/join`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '加入社群失败');
      }

      const data = await response.json();

      if (data.success) {
        setIsJoined(true);
        // 更新成员数
        if (communityData) {
          setCommunityData({
            ...communityData,
            memberCount: communityData.memberCount + 1
          });
        }
      } else {
        throw new Error(data.message || '加入社群失败');
      }
    } catch (err) {
      console.error('加入社群失败:', err);
      alert(err instanceof Error ? err.message : '加入社群失败，请重试');
    }
  };

  const confirmLeave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        setShowLeaveModal(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/communities/${communityId}/leave`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '离开社群失败');
      }

      const data = await response.json();

      if (data.success) {
        setIsJoined(false);
        setShowLeaveModal(false);
        // 更新成员数
        if (communityData) {
          setCommunityData({
            ...communityData,
            memberCount: Math.max(0, communityData.memberCount - 1)
          });
        }
      } else {
        throw new Error(data.message || '离开社群失败');
      }
    } catch (err) {
      console.error('离开社群失败:', err);
      alert(err instanceof Error ? err.message : '离开社群失败，请重试');
    }
  };

  const filteredEvents = activeTab === 'all' 
    ? events 
    : events.filter(event => event.status === 'Upcoming');

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B3D] mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !communityData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">出错了</h2>
          <p className="text-slate-600 mb-4">{error || '社群不存在'}</p>
          <Link 
            href="/home" 
            className="px-6 py-3 bg-[#FF6B3D] text-white rounded-full font-bold hover:bg-[#ff5a2d] transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#FF6B3D] selection:text-white pb-20 relative">
      {/* Leave Modal */}
      <LeaveModal 
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={confirmLeave}
      />

      {/* Navigation */}
      <DetailNavbar />

      {/* SECTION 1: Community Header & Info */}
      <div className="relative pt-20">
        {/* Banner Image */}
        <div className="h-64 md:h-80 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/30 z-10"></div>
          <img 
            src={communityData.banner} 
            alt="Community Banner" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info Card - Floating Effect */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-24">
          <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-xl shadow-orange-500/5">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              
              {/* Left: Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-orange-50 text-[#FF6B3D] text-xs font-bold font-brand rounded-full uppercase tracking-wider border border-orange-100">
                    {communityData.category}
                  </span>
                  <span className="text-slate-400 text-sm font-medium">{communityData.foundedDate}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-brand font-bold text-slate-900 mb-4">
                  {communityData.name}
                </h1>
                
                <p className="text-slate-500 leading-relaxed max-w-2xl mb-6 font-medium">
                  {communityData.bio}
                </p>

                {/* Creator & Socials */}
                <div className="flex items-center flex-wrap gap-6">
                  <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
                    <img src={communityData.creator.avatar} alt="Creator" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Organizer</p>
                      <p className="text-sm font-bold text-slate-800 font-brand">{communityData.creator.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#FF6B3D] hover:text-white transition-all duration-300">
                      <Instagram size={18} />
                    </button>
                    {/* Twitter/X Logo */}
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#FF6B3D] hover:text-white transition-all duration-300">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#FF6B3D] hover:text-white transition-all duration-300">
                      <Globe size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Actions & Stats */}
              <div className="flex flex-col gap-4 min-w-[200px]">
                <button 
                  onClick={handleJoinToggle}
                  className={`w-full py-3 px-6 font-brand font-bold rounded-2xl shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ${
                    isJoined 
                      ? "bg-slate-800 text-white shadow-slate-800/20 cursor-default" 
                      : "bg-[#FF6B3D] hover:bg-[#E55A2D] text-white shadow-orange-500/30"
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Trophy size={18} className="text-[#FF6B3D]" />
                      Member • Day 1
                    </>
                  ) : (
                    "Join Community"
                  )}
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 rounded-2xl p-3 text-center border border-white/60">
                    <div className="text-2xl font-brand font-bold text-slate-900">
                      {isJoined ? communityData.memberCount + 1 : communityData.memberCount}
                    </div>
                    <div className="text-xs text-slate-500 font-medium uppercase">Members</div>
                  </div>
                  <div className="bg-white/50 rounded-2xl p-3 text-center border border-white/60">
                    <div className="text-2xl font-brand font-bold text-slate-900">48</div>
                    <div className="text-xs text-slate-500 font-medium uppercase">Events</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SECTION 2: Event Feed (Main Column) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-brand font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-[#FF6B3D]" size={24} />
                Events History
              </h2>
              <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-orange-50 text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Upcoming
                </button>
              </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid gap-5">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <button className="w-full py-4 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:text-[#FF6B3D] hover:border-[#FF6B3D] font-bold text-sm transition-all flex items-center justify-center gap-2">
              View All Past Events
            </button>
          </div>

          {/* SECTION 3: Content/Discussion Area (Sidebar) */}
          <div className="lg:col-span-4">
            <CommunityWall comments={comments} />
          </div>

        </div>
      </div>
      
      {/* Leave Community Footer Button */}
      {isJoined && (
        <div className="max-w-7xl mx-auto px-4 mt-12 mb-8 text-center">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="text-xs font-medium text-slate-300 hover:text-slate-500 transition-colors hover:underline decoration-slate-300 underline-offset-4"
          >
            Leave Community
          </button>
        </div>
      )}
    </div>
  );
}

