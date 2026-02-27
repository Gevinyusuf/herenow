import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight, 
  Instagram, 
  Globe, 
  Clock,
  Send,
  ThumbsUp,
  MessageSquare,
  Check,
  AlertTriangle,
  X,
  Trophy
} from 'lucide-react';

const CommunityDetail = () => {
  // Mock Data
  const communityData = {
    name: "SF Weekend Hikers",
    category: "Outdoor & Adventure",
    memberCount: 2453,
    foundedDate: "Est. 2021",
    creator: {
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
      handle: "@sarah_hikes"
    },
    bio: "We are a group of outdoor enthusiasts exploring the hidden trails of San Francisco and the Bay Area. Every weekend is a new adventure. Beginners welcome! 🌲⛰️",
    banner: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=1200",
    socials: [
      { type: 'instagram', link: '#' },
      { type: 'x', link: '#' },
      { type: 'web', link: '#' }
    ]
  };

  const events = [
    {
      id: 1,
      title: "Sunset Hike at Lands End",
      date: "Oct 24, 2023",
      time: "16:30 PM",
      location: "Lands End Lookout, SF",
      attendees: 42,
      status: "Upcoming",
      image: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 2,
      title: "Golden Gate Bridge Morning Walk",
      date: "Oct 12, 2023",
      time: "08:00 AM",
      location: "Battery Spencer",
      attendees: 156,
      status: "Completed",
      image: "https://images.unsplash.com/photo-1521464302861-ce943915d1c3?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: 3,
      title: "Muir Woods Ancient Redwoods",
      date: "Sep 28, 2023",
      time: "09:00 AM",
      location: "Muir Woods National Monument",
      attendees: 89,
      status: "Completed",
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=600"
    }
  ];

  const comments = [
    {
      id: 1,
      user: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
      content: "The Lands End hike was absolutely stunning! Thanks for organizing.",
      time: "2h ago",
      likes: 12,
      replies: [
        {
          id: 101,
          user: "Sarah Jenkins",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
          content: "Glad you enjoyed it Alex! See you next time.",
          time: "1h ago",
          likes: 4
        }
      ]
    },
    {
      id: 2,
      user: "Marcus Johnson",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
      content: "Is the upcoming event dog friendly? 🐕",
      time: "5h ago",
      likes: 8,
      replies: []
    }
  ];

  const [activeTab, setActiveTab] = useState('all');
  const [isJoined, setIsJoined] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleJoinToggle = () => {
    if (isJoined) {
       return;
    }
    setIsJoined(true);
  };

  const confirmLeave = () => {
    setIsJoined(false);
    setShowLeaveModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#FF6B3D] selection:text-white pb-20 relative">
      {/* Styles for Fonts */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
          .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
          .font-logo { font-family: 'Lalezar', system-ui; }
          .font-sans { font-family: 'Inter', sans-serif; }
          
          .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.5);
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
          }
        `}
      </style>

      {/* Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-[#FF6B3D]" size={32} />
              </div>
              
              <h3 className="text-xl font-brand font-bold text-slate-900 mb-2">Leave Community?</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                You're on a <span className="font-bold text-[#FF6B3D]">1-day streak!</span> If you leave now, you'll lose your progress and badge.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  Yes, Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-logo text-3xl text-[#FF6B3D] tracking-wide">HereNow</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:text-[#FF6B3D] transition-colors rounded-full hover:bg-orange-50">
              <MessageCircle size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="Profile" />
            </div>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Community Header & Info */}
      <div className="relative">
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
              {events.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => console.log(`Maps to event ${event.id}`)}
                  className="group bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 flex flex-col sm:flex-row gap-4 cursor-pointer"
                >
                  {/* Event Image */}
                  <div className="w-full sm:w-48 h-32 sm:h-auto rounded-2xl overflow-hidden relative shrink-0">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-slate-900 font-brand shadow-sm">
                      {event.status}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-brand font-bold text-slate-900 group-hover:text-[#FF6B3D] transition-colors">
                          {event.title}
                        </h3>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                           <Clock size={16} className="text-[#FF6B3D]/70" />
                           {event.date} • {event.time}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                           <MapPin size={16} className="text-[#FF6B3D]/70" />
                           {event.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                           {[1,2,3].map((i) => (
                             <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
                           ))}
                        </div>
                        <span className="text-xs text-slate-500 font-bold ml-1">+{event.attendees} Joined</span>
                      </div>
                      
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-[#FF6B3D] group-hover:text-white transition-colors">
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
             <button className="w-full py-4 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:text-[#FF6B3D] hover:border-[#FF6B3D] font-bold text-sm transition-all flex items-center justify-center gap-2">
                View All Past Events
             </button>
          </div>

          {/* SECTION 3: Content/Discussion Area (Sidebar) */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-2xl font-brand font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="text-[#FF6B3D]" size={24} />
              Community Wall
            </h2>

            <div className="glass-panel rounded-3xl p-5 shadow-lg shadow-orange-500/5">
              {/* Input Area */}
              <div className="mb-6">
                <div className="relative">
                   <textarea 
                    className="w-full bg-slate-50 rounded-2xl p-4 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20 focus:bg-white transition-all resize-none h-24 font-medium"
                    placeholder="Say something to the community..."
                  />
                  <button className="absolute bottom-3 right-3 p-2 bg-[#FF6B3D] text-white rounded-xl shadow-md hover:bg-[#E55A2D] transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="group">
                    {/* Main Comment */}
                    <div className="flex gap-3">
                      <img src={comment.avatar} alt={comment.user} className="w-9 h-9 rounded-full border border-slate-100 shadow-sm shrink-0" />
                      <div className="flex-1">
                        <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-brand font-bold text-sm text-slate-900">{comment.user}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{comment.time}</span>
                          </div>
                          <p className="text-slate-600 text-sm leading-snug">{comment.content}</p>
                        </div>
                        
                        {/* Main Comment Actions */}
                        <div className="flex items-center gap-4 mt-1.5 ml-2">
                          <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#FF6B3D] transition-colors">
                            <ThumbsUp size={12} /> {comment.likes}
                          </button>
                           <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                            Reply
                          </button>
                        </div>

                        {/* Nested Replies */}
                        {comment.replies.length > 0 && (
                          <div className="mt-3 pl-3 border-l-2 border-slate-100 space-y-3">
                            {comment.replies.map(reply => (
                               <div key={reply.id} className="flex gap-2">
                                <img src={reply.avatar} alt={reply.user} className="w-6 h-6 rounded-full shrink-0" />
                                <div>
                                   <div className="bg-slate-50 rounded-xl rounded-tl-none p-2.5">
                                      <span className="font-brand font-bold text-xs text-slate-900 block mb-0.5">{reply.user}</span>
                                      <p className="text-slate-500 text-xs">{reply.content}</p>
                                   </div>
                                   {/* Nested Reply Actions - NEWLY ADDED */}
                                   <div className="flex items-center gap-3 mt-1 ml-1">
                                      <button className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-[#FF6B3D] transition-colors">
                                        <ThumbsUp size={10} /> {reply.likes}
                                      </button>
                                      <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                        Reply
                                      </button>
                                   </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-[#FF6B3D] uppercase tracking-wide transition-colors">
                Load more comments
              </button>

            </div>
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
};

export default CommunityDetail;