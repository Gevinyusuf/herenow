'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  BarChart2, 
  Settings, 
  Plus, 
  Sparkles, 
  Link as LinkIcon,
  Search,
  Bell,
  Filter,
  MoreHorizontal,
  UserPlus,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Trash2,
  TrendingUp,
  Eye,
  MousePointer,
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  Pin,
  Ticket,
  Shield,
  MapPin,
  Mail as MailIcon,
  ChevronRight,
  Archive,
  AlertCircle,
  Compass,
  Globe,
  User,
  LayoutGrid,
  UserMinus
} from 'lucide-react';
import InviteModal from '@/components/manager/InviteModal';
import ConfirmModal from '@/components/manager/ConfirmModal';
import CouponModal from '@/components/manager/CouponModal';
import Navbar from '@/components/home/Navbar';

type TabType = 'events' | 'members' | 'discussions' | 'insights' | 'more';
type DeleteTarget = { type: 'member' | 'event' | 'post'; id: number; name: string } | null;

interface Member {
  id: number;
  name: string;
  handle: string;
  email: string;
  role: 'Owner' | 'Member';
  joined: string;
  avatarGradient: string;
}

interface Event {
  id: number;
  type: 'event';
  title: string;
  date: string;
  location: string;
  attendees: number;
  imageUrl: string;
  tags: string[];
  isPinned: boolean;
}

interface Discussion {
  id: number;
  authorId: number;
  isPinned: boolean;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  time: string;
}

interface Coupon {
  id: number;
  code: string;
  discount: string;
  type: 'percent' | 'fixed';
  active: boolean;
}

export default function CommunityManagerPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [eventFilter, setEventFilter] = useState('upcoming');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [communitySettings, setCommunitySettings] = useState({
    isPublic: true,
    allowJoin: true,
    requireApproval: false
  });

  const [members, setMembers] = useState<Member[]>([
    { id: 1, name: "Alex Chen", handle: "@alexc", email: "alex.chen@example.com", role: "Owner", joined: "Oct 24, 2023", avatarGradient: "from-orange-400 to-pink-500" },
    { id: 2, name: "Sarah Miller", handle: "@sarah_design", email: "sarah.m@studio.io", role: "Member", joined: "Nov 02, 2023", avatarGradient: "from-blue-400 to-cyan-500" },
    { id: 3, name: "Jordan Lee", handle: "@jlee_ux", email: "jordan@creative.co", role: "Member", joined: "Yesterday", avatarGradient: "from-emerald-400 to-teal-500" },
    { id: 4, name: "Mike Ross", handle: "@miker", email: "mike.ross@law.com", role: "Member", joined: "2 hrs ago", avatarGradient: "from-purple-400 to-indigo-500" },
    { id: 5, name: "Emily Blunt", handle: "@emilyb", email: "emily@hollywood.com", role: "Member", joined: "Just now", avatarGradient: "from-rose-400 to-red-500" },
  ]);

  const [events, setEvents] = useState<Event[]>([
    { 
      id: 101, 
      type: 'event', 
      title: "Weekly Design Critique", 
      date: "Tomorrow, 10:00 AM", 
      location: "Zoom / Online",
      attendees: 12,
      imageUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80",
      tags: ["Weekly", "Feedback"],
      isPinned: false
    },
    { 
      id: 103, 
      type: 'event', 
      title: "Figma Config Watch Party", 
      date: "Nov 20, 2023 • 6:00 PM", 
      location: "Design Hub HQ, San Francisco",
      attendees: 45,
      imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
      tags: ["In-Person", "Social"],
      isPinned: true 
    },
    { 
      id: 105, 
      type: 'event', 
      title: "Year-End Community Mixer", 
      date: "Dec 15, 2023 • 7:00 PM", 
      location: "The Rooftop Bar",
      attendees: 82,
      imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
      tags: ["Social", "Networking"],
      isPinned: false
    }
  ]);

  const [discussions, setDiscussions] = useState<Discussion[]>([
    {
      id: 1,
      authorId: 1,
      isPinned: true,
      title: "Welcome to the Community Wall! 👋",
      content: "This is our space to share thoughts, ask questions, and keep the conversation going after events.",
      tags: ["Announcement"],
      likes: 24,
      comments: 5,
      time: "2 days ago"
    },
    {
      id: 2,
      authorId: 3,
      isPinned: false,
      title: "Anyone going to the Figma event early?",
      content: "I'm planning to arrive around 5:30 PM to grab a good seat. Would love to meet up with some of you beforehand for coffee.",
      tags: ["Event Chat", "Social"],
      likes: 8,
      comments: 12,
      time: "4 hours ago"
    },
    {
      id: 3,
      authorId: 2,
      isPinned: false,
      title: "Sharing some resources from yesterday's critique",
      content: "Here are the links to the design systems we discussed. I found the section on token naming conventions particularly useful.",
      tags: ["Resources", "Learning"],
      likes: 15,
      comments: 2,
      time: "Yesterday"
    }
  ]);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: 'percent' as 'percent' | 'fixed' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  useEffect(() => {
    const handleMenuClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.item-menu-trigger') && !target.closest('.item-menu-dropdown')) {
        setActiveMenuId(null);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('mousedown', handleMenuClickOutside);
      return () => document.removeEventListener('mousedown', handleMenuClickOutside);
    }
  }, []);

  const handleCreateCoupon = () => {
    if (newCoupon.code && newCoupon.discount) {
      setCoupons([...coupons, { ...newCoupon, id: Date.now(), active: true }]);
      setNewCoupon({ code: '', discount: '', type: 'percent' });
      setIsCouponModalOpen(false);
    }
  };

  const initiateDelete = (type: 'member' | 'event' | 'post', id: number, name: string) => {
    setDeleteTarget({ type, id, name });
    setActiveMenuId(null);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'event') {
      setEvents(prev => prev.filter(item => item.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'member') {
      setMembers(prev => prev.filter(item => item.id !== deleteTarget.id));
    } else if (deleteTarget.type === 'post') {
      setDiscussions(prev => prev.filter(item => item.id !== deleteTarget.id));
    }
    
    setDeleteTarget(null);
  };

  const handleTogglePinEvent = (id: number) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, isPinned: !event.isPinned } : event
    ));
    setActiveMenuId(null);
  };

  const handleTogglePinPost = (id: number) => {
    setDiscussions(prev => prev.map(post => 
      post.id === id ? { ...post, isPinned: !post.isPinned } : post
    ));
    setActiveMenuId(null);
  };

  const handleEditItem = (type: string, id: number) => {
    console.log(`Edit ${type}:`, id);
    setActiveMenuId(null);
  };

  const toggleItemMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const tabs = [
    { id: 'events' as TabType, label: 'Events', icon: Calendar },
    { id: 'members' as TabType, label: 'Members', icon: Users }, 
    { id: 'discussions' as TabType, label: 'Wall', icon: LayoutGrid }, 
    { id: 'insights' as TabType, label: 'Insights', icon: BarChart2 }, 
    { id: 'more' as TabType, label: 'More', icon: MoreHorizontal }, 
  ];

  const EventsView = () => {
    const sortedEvents = [...events].sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });

    return (
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="font-brand text-2xl font-bold text-slate-900 flex items-center gap-3">
            Events History
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
              {events.length}
            </span>
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-100/50 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
              {['Upcoming', 'Past'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter.toLowerCase())}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    eventFilter === filter.toLowerCase() ? 'bg-white text-slate-900 shadow-sm shadow-slate-200' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B3D] hover:bg-[#ff8057] text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 transition-all active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add New</span>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-400/20 border border-white/60 p-2 z-50">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => { router.push('/create/community'); setIsDropdownOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B3D] flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={18} /></div>
                      <div className="flex flex-col"><span className="text-slate-900 font-semibold text-sm">Create New Event</span><span className="text-slate-400 text-xs">Start from scratch</span></div>
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B3D] flex items-center justify-center group-hover:scale-110 transition-transform"><Sparkles size={18} /></div>
                      <div className="flex flex-col"><span className="text-slate-900 font-semibold text-sm">Import Event</span><span className="text-slate-400 text-xs">From HereNow</span></div>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><LinkIcon size={18} /></div>
                      <div className="flex flex-col"><span className="text-slate-900 font-semibold text-sm">Add External</span><span className="text-slate-400 text-xs">Link to page</span></div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="relative pl-4 md:pl-8 pb-12 space-y-8 before:absolute before:left-[19px] md:before:left-[35px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
            {sortedEvents.map((item, index) => (
              <div key={item.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`
                  absolute left-[-15px] md:left-[-27px] top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center 
                  ${item.isPinned ? 'bg-orange-500 scale-110' : 'bg-[#FF6B3D]'}
                `}>
                  {item.isPinned && <Pin size={10} className="text-white fill-current" />}
                </div>

                <div className={`bg-white rounded-2xl border ${item.isPinned ? 'border-orange-200 shadow-orange-500/10' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all duration-200 group ${activeMenuId === item.id ? 'z-20 relative' : 'z-0 relative'}`}>
                  <div className="flex flex-col md:flex-row h-full md:h-40">
                    <div className="w-full md:w-56 h-40 md:h-full relative overflow-hidden rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>
                      {item.isPinned && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase rounded shadow-sm flex items-center gap-1">
                          <Pin size={10} fill="currentColor" /> Pinned
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between relative">
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-[#FF6B3D] text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                              {item.date}
                            </div>
                            <h3 className="font-brand text-lg font-bold text-slate-900 group-hover:text-[#FF6B3D] transition-colors cursor-pointer line-clamp-1">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-sm mt-1.5">
                              <MapPin size={14} />
                              <span>{item.location}</span>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <button 
                              onClick={(e) => toggleItemMenu(item.id, e)}
                              className="item-menu-trigger p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {activeMenuId === item.id && (
                              <div className="item-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                                <button onClick={() => handleTogglePinEvent(item.id)} className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                  <Pin size={14} className={item.isPinned ? "fill-current" : ""} /> {item.isPinned ? "Unpin" : "Pin to Top"}
                                </button>
                                <button onClick={() => handleEditItem('event', item.id)} className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"><Edit2 size={14} /> Edit</button>
                                <div className="h-px bg-slate-50 my-1"></div>
                                <button onClick={() => initiateDelete('event', item.id, item.title)} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"><Trash2 size={14} /> Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center -space-x-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] text-slate-400 font-bold">U{i}</div>
                            ))}
                          </div>
                          <span className="text-xs font-medium text-slate-500">+{item.attendees} attending</span>
                        </div>
                        <button 
                          onClick={() => router.push(`/manager/event?id=${item.id}`)}
                          className="text-sm font-semibold text-slate-600 hover:text-[#FF6B3D] transition-colors"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="absolute left-[-6px] md:left-[-18px] bottom-0 w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-8 group cursor-pointer">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl"></div>
              <div className="absolute top-0 left-8 w-24 h-24 bg-slate-100 rounded-2xl transform rotate-12 opacity-60 group-hover:rotate-[15deg] group-hover:translate-x-2 transition-transform duration-500 ease-out"></div>
              <div className="absolute top-2 left-4 w-28 h-28 bg-white border border-slate-100 rounded-2xl shadow-sm transform -rotate-6 z-10 group-hover:-rotate-12 group-hover:-translate-x-2 transition-transform duration-500 ease-out"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-white to-slate-50 border border-white rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-2 w-16 h-16 opacity-20 mb-1">
                  <div className="bg-slate-800 rounded-lg col-span-2 h-6 w-full"></div>
                  <div className="bg-slate-800 rounded-md h-8 w-full"></div>
                  <div className="bg-slate-800 rounded-md h-8 w-full"></div>
                </div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center font-brand font-bold text-xl text-slate-300">0</div>
              </div>
            </div>
            <h3 className="font-brand text-2xl font-bold text-slate-900 mb-2 text-center">No Events</h3>
            <p className="text-slate-500 mb-8 text-center max-w-md">This community has no {eventFilter} events scheduled yet. <br className="hidden sm:block"/>Ready to bring people together?</p>
          </div>
        )}
      </div>
    );
  };

  const MembersView = () => (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="font-brand text-2xl font-bold text-slate-900 flex items-center gap-3">
          Members
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
            {members.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"><MoreHorizontal size={20} /></button>
          <button 
            onClick={() => setIsInviteModalOpen(true)} 
            className="flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search members..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B3D] transition-all placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"><Filter size={16} /><span>Filter</span></button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm min-w-max"><ArrowUpDown size={16} /><span>Most Recent</span></button>
        </div>
      </div>

      {members.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:grid">
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Joined</div>
          </div>
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors items-center relative">
                <div className="flex items-center gap-3 col-span-12 md:col-span-5 w-full">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.avatarGradient} flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-semibold text-sm">{member.name}</span>
                    <span className="text-slate-400 text-xs md:hidden">{member.email}</span>
                    <span className="text-slate-400 text-xs hidden md:inline-block">{member.handle}</span>
                  </div>
                </div>
                <div className="col-span-3 hidden md:flex items-center text-sm text-slate-500">{member.email}</div>
                <div className="col-span-12 md:col-span-2 w-full md:w-auto flex md:block">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${member.role === 'Owner' ? 'bg-orange-50 text-[#FF6B3D] border-orange-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {member.role === 'Owner' && <Shield size={10} />}
                    {member.role}
                  </span>
                </div>
                <div className="col-span-2 hidden md:flex items-center justify-end text-sm text-slate-400">{member.joined}</div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex gap-2">
                  <a 
                    href={`mailto:${member.email}`} 
                    className="p-2 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all flex items-center justify-center" 
                    title={`Send email to ${member.email}`}
                  >
                    <MailIcon size={16} />
                  </a>
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleItemMenu(member.id, e)} 
                      className="p-2 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all flex items-center justify-center"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {activeMenuId === member.id && (
                      <div className="item-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        <button onClick={() => handleEditItem('member', member.id)} className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"><Edit2 size={14} /> Edit Member</button>
                        <div className="h-px bg-slate-50 my-1"></div>
                        <button onClick={() => initiateDelete('member', member.id, member.name)} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"><UserMinus size={14} /> Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center md:text-left"><p className="text-xs text-slate-400">Showing {members.length} members</p></div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/40 rounded-3xl border border-white shadow-sm backdrop-blur-sm">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 shadow-inner">
              <div className="opacity-30 grayscale"><Users size={48} className="text-slate-400" /></div>
              <div className="absolute bottom-6 flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#FF6B3D] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#FF6B3D] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#FF6B3D] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
          <h3 className="font-brand text-xl font-bold text-slate-900 mb-2 text-center">No Members Yet</h3>
          <p className="text-slate-500 text-center max-w-sm text-sm leading-relaxed mb-8">When people join your community, they will appear here. <br/>Share your community link to get started!</p>
          <button 
            onClick={() => setIsInviteModalOpen(true)} 
            className="group relative overflow-hidden rounded-2xl px-8 py-3.5 bg-[#FF6B3D] hover:bg-[#ff8057] active:scale-95 text-white font-semibold shadow-lg shadow-orange-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus size={20} strokeWidth={2.5} />
            <span>Invite Member</span>
          </button>
        </div>
      )}
    </div>
  );

  const DiscussionsView = () => {
    const sortedDiscussions = [...discussions].sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
    });

    return (
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-brand text-2xl font-bold text-slate-900">Community Wall</h2>
            <p className="text-slate-400 text-sm mt-1">A space for members to connect, share, and ask questions.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B3D] hover:bg-[#ff8057] text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 transition-all active:scale-95">
            <MessageCircle size={18} />
            <span>Start New Topic</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-grow group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search discussions..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B3D] transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"><Filter size={16} /><span>All Tags</span></button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex gap-4 items-center cursor-pointer hover:border-[#FF6B3D]/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex-shrink-0"></div>
          <div className="flex-grow bg-slate-50 rounded-xl px-4 py-2.5 text-slate-400 text-sm hover:bg-slate-100 transition-colors">
            What's on your mind, Alex?
          </div>
        </div>

        <div className="space-y-6">
          {sortedDiscussions.map((post) => {
            const author = members.find(m => m.id === post.authorId);
            return (
              <div 
                key={post.id} 
                className={`bg-white rounded-3xl border ${post.isPinned ? 'border-orange-200 shadow-orange-500/5' : 'border-slate-100'} p-6 shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${author?.avatarGradient || 'from-slate-300 to-slate-400'} flex items-center justify-center text-white font-bold text-sm`}>
                      {author?.name.split(' ')[0][0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-sm">{author?.name}</span>
                        {post.isPinned && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-[#FF6B3D] text-[10px] font-bold uppercase tracking-wide rounded-full">
                            <Pin size={10} fill="currentColor" /> Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">{post.time}</span>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleItemMenu(post.id, e)}
                      className="text-slate-300 hover:text-slate-500 p-1 rounded-full hover:bg-slate-50 transition-colors"
                    >
                      <MoreHorizontal size={20}/>
                    </button>
                    {activeMenuId === post.id && (
                      <div className="item-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        <button onClick={() => handleTogglePinPost(post.id)} className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                          <Pin size={14} className={post.isPinned ? "fill-current" : ""} /> {post.isPinned ? "Unpin" : "Pin to Top"}
                        </button>
                        <button onClick={() => handleEditItem('post', post.id)} className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"><Edit2 size={14} /> Edit</button>
                        <div className="h-px bg-slate-50 my-1"></div>
                        <button onClick={() => initiateDelete('post', post.id, post.title)} className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 pl-[52px]">
                  <h3 className="font-brand text-lg font-bold text-slate-900 mb-2">{post.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{post.content}</p>
                </div>

                <div className="pl-[52px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <button className="flex items-center gap-1.5 hover:text-[#FF6B3D] transition-colors"><Heart size={16} /> {post.likes}</button>
                    <button className="flex items-center gap-1.5 hover:text-[#FF6B3D] transition-colors"><MessageCircle size={16} /> {post.comments}</button>
                    <button className="flex items-center gap-1.5 hover:text-[#FF6B3D] transition-colors"><Share2 size={16} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="py-8 text-center">
          <p className="text-slate-400 text-sm">You've reached the end of the discussions.</p>
        </div>
      </div>
    );
  };

  const InsightsView = () => (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="font-brand text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Overview of your community growth and engagement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-orange-50 rounded-xl text-[#FF6B3D]"><Users size={20} /></div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} /> +12%</span>
          </div>
          <div className="text-3xl font-brand font-bold text-slate-900 mb-1">1,248</div>
          <div className="text-sm text-slate-400 font-medium">Total Members</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500"><Eye size={20} /></div>
            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><TrendingUp size={12} /> +5.4%</span>
          </div>
          <div className="text-3xl font-brand font-bold text-slate-900 mb-1">8.5k</div>
          <div className="text-sm text-slate-400 font-medium">Page Views</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-500"><MousePointer size={20} /></div>
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">0%</span>
          </div>
          <div className="text-3xl font-brand font-bold text-slate-900 mb-1">24%</div>
          <div className="text-sm text-slate-400 font-medium">RSVP Rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-brand text-lg font-bold text-slate-900">Growth Over Time</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button className="px-3 py-1 bg-white rounded-md text-xs font-semibold shadow-sm text-slate-900">30 Days</button>
              <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700">90 Days</button>
            </div>
          </div>
          <div className="relative h-64 w-full">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-px bg-slate-50"></div>
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,90 C20,80 40,60 50,50 C60,40 80,20 100,10" fill="none" stroke="#FF6B3D" strokeWidth="2" strokeLinecap="round" className="drop-shadow-lg shadow-orange-200"/>
              <path d="M0,90 C20,80 40,60 50,50 C60,40 80,20 100,10 V100 H0 Z" fill="url(#gradient)" opacity="0.1"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B3D" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-[10%] right-0 w-3 h-3 bg-[#FF6B3D] rounded-full border-2 border-white shadow-md"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-brand text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1,2,3,4].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">U{i}</div>
                <div>
                  <p className="text-sm text-slate-800"><span className="font-semibold">User {i+1}</span> joined the community</p>
                  <p className="text-xs text-slate-400 mt-0.5">{i * 2 + 1} hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MoreView = () => (
    <div className="animate-fade-in max-w-2xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="font-brand text-2xl font-bold text-slate-900">More Options</h2>
        <p className="text-slate-400 text-sm mt-1">Manage community settings, access, and danger zone.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-8 shadow-sm">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 bg-slate-50/50 text-sm uppercase tracking-wide">General</div>
        <div className="divide-y divide-slate-100">
          <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left group">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all"><Settings size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900">Community Details</div>
                <div className="text-sm text-slate-400 mt-0.5">Update name, description, and cover image</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500"/>
          </button>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500"><Globe size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900">Public Visibility</div>
                <div className="text-sm text-slate-400 mt-0.5">Anyone can find and view this community</div>
              </div>
            </div>
            <button 
              onClick={() => setCommunitySettings(prev => ({...prev, isPublic: !prev.isPublic}))} 
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${communitySettings.isPublic ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
            >
              <span className={`${communitySettings.isPublic ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`} />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-8 shadow-sm">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 bg-slate-50/50 text-sm uppercase tracking-wide">Access & Membership</div>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-green-50 rounded-xl text-green-600"><UserPlus size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900">Allow New Members</div>
                <div className="text-sm text-slate-400 mt-0.5">Turn off to pause new member registrations</div>
              </div>
            </div>
            <button 
              onClick={() => setCommunitySettings(prev => ({...prev, allowJoin: !prev.allowJoin}))} 
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${communitySettings.allowJoin ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
            >
              <span className={`${communitySettings.allowJoin ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-500"><Shield size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900">Require Approval</div>
                <div className="text-sm text-slate-400 mt-0.5">Admins must approve new members</div>
              </div>
            </div>
            <button 
              onClick={() => setCommunitySettings(prev => ({...prev, requireApproval: !prev.requireApproval}))} 
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${communitySettings.requireApproval ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
            >
              <span className={`${communitySettings.requireApproval ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm`} />
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white border border-red-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-red-50 font-bold text-red-600 bg-red-50/30 text-sm uppercase tracking-wide flex items-center gap-2">
          <AlertCircle size={16} /> Danger Zone
        </div>
        <div className="divide-y divide-slate-100">
          <button className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors text-left group">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-white group-hover:text-red-500 transition-all"><Archive size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900 group-hover:text-red-600 transition-colors">Archive Community</div>
                <div className="text-sm text-slate-400 mt-0.5">Hide from public but keep data</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-red-400"/>
          </button>
          <button className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors text-left group">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-white group-hover:text-red-500 transition-all"><Trash2 size={20} /></div>
              <div>
                <div className="text-base font-semibold text-slate-900 group-hover:text-red-600 transition-colors">Close Community</div>
                <div className="text-sm text-slate-400 mt-0.5">Permanently delete this community and all data</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-red-400"/>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white font-sans text-slate-500 selection:bg-[#FF6B3D] selection:text-white">
      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        communityUrl="herenow.com/community/design-hub"
        communityName="Design Thinking Hub"
      />
      <ConfirmModal 
        deleteTarget={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
      />
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        newCoupon={newCoupon}
        onCouponChange={setNewCoupon}
        onCreate={handleCreateCoupon}
      />

      {/* Navigation Bar */}
      <Navbar 
        onCreateEventClick={() => router.push('/create/community')} 
        variant="default" 
        currentView="communities"
        onViewChange={(view) => {
          if (view === 'events') {
            router.push('/home?view=events');
          } else {
            router.push('/home?view=communities');
          }
        }}
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        
        {/* Community Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-3xl">
              🎨
            </div>
            <div>
              <h1 className="font-brand text-3xl font-bold text-slate-900">Design Thinking Hub</h1>
              <p className="text-slate-400 text-sm">Community managed by @alex_creator</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-slate-200/60 mb-10 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'text-slate-900' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-[#FF6B3D]' : ''} />
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FF6B3D] rounded-t-full shadow-[0_0_10px_rgba(255,107,61,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Renderer */}
        {activeTab === 'events' ? <EventsView /> : 
         activeTab === 'members' ? <MembersView /> : 
         activeTab === 'discussions' ? <DiscussionsView /> :
         activeTab === 'insights' ? <InsightsView /> :
         activeTab === 'more' ? <MoreView /> : 
         <div className="py-20 text-center text-slate-400 italic">Section under construction</div>}
        
      </main>

      {/* Font Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
        .font-logo { font-family: 'Lalezar', system-ui; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

