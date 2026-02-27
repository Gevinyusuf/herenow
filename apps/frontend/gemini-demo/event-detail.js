import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Share2, 
  MoreHorizontal, 
  CheckCircle2, 
  MessageCircle, 
  Flag, 
  Globe, 
  Linkedin, 
  Twitter,
  ChevronRight,
  Ticket,
  ExternalLink,
  Lock,
  Compass,
  Search,
  Bell,
  Plus,
  X,
  Mail,
  Image as ImageIcon,
  FileText,
  PlayCircle,
  Download,
  Send,
  MessageSquare,
  ThumbsUp,
  Heart,
  CornerDownRight,
  LogOut
} from 'lucide-react';

const ActivityDetail = () => {
  const [selectedTicket, setSelectedTicket] = useState('member');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New: Login State
  const [activeTab, setActiveTab] = useState('overview');

  // Comments State for Interaction
  const [comments, setComments] = useState([
    { 
      id: 1, 
      user: "Sarah Jenkins", 
      avatar: "https://ui-avatars.com/api/?name=Sarah+J&background=random", 
      time: "2h ago", 
      text: "Super excited for this one! The last session on SaaS metrics was incredibly helpful.",
      likes: 12,
      isLiked: false,
      showReply: false
    },
    { 
      id: 2, 
      user: "Mike Chen", 
      avatar: "https://ui-avatars.com/api/?name=Mike+C&background=random", 
      time: "5h ago", 
      text: "Is there parking available near the venue?",
      likes: 3,
      isLiked: false,
      showReply: false
    }
  ]);

  // Helper: Wrap actions that require authentication
  const checkAuth = (action) => {
    if (isLoggedIn) {
      action();
    } else {
      setShowAuthModal(true);
    }
  };

  // Mock Login Action
  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  // Handle Like Toggle
  const toggleLike = (id) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }
      return comment;
    }));
  };

  // Handle Reply Toggle
  const toggleReply = (id) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        return { ...comment, showReply: !comment.showReply };
      }
      return comment;
    }));
  };

  // Mock Data
  const event = {
    title: "9K Club Monthly Gathering - November",
    hostOrg: "RevTech Ventures",
    date: "Thursday, November 20",
    time: "6:30 PM - 9:30 PM CST",
    location: "Register to See Address",
    city: "Dallas, Texas",
    description: "The 9K Club is a founder-first community where early-stage entrepreneurs meet monthly to connect, learn, and grow together. This month features a fireside chat with AI investors.",
    tags: ["Tech", "Founders", "Networking", "AI"],
    hosts: [
      { name: "Hunter Zhang", role: "Host", avatar: "https://ui-avatars.com/api/?name=Hunter+Zhang&background=FF6B3D&color=fff" },
      { name: "David Matthews", role: "Co-host", avatar: "https://ui-avatars.com/api/?name=David+Matthews&background=random" },
      { name: "Vincy Qi", role: "Organizer", avatar: "https://ui-avatars.com/api/?name=Vincy+Qi&background=random" },
    ],
    participants: 142,
    participantAvatars: [
      "https://ui-avatars.com/api/?name=Alex+R&background=random",
      "https://ui-avatars.com/api/?name=Sarah+J&background=random",
      "https://ui-avatars.com/api/?name=Mike+T&background=random",
      "https://ui-avatars.com/api/?name=Emily+W&background=random",
    ],
    gallery: [
      { type: 'image', src: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { type: 'image', src: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600' },
      { type: 'image', src: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600' },
    ],
    resources: [
      { title: "Event Agenda.pdf", size: "2.4 MB", type: "pdf" },
      { title: "AI Investor Landscape 2025.pdf", size: "15.1 MB", type: "pdf" },
      { title: "Speaker Slides - Hunter Zhang", size: "8.5 MB", type: "ppt" }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-600 font-sans selection:bg-orange-100 relative">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
          .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-logo { font-family: 'Lalezar', system-ui; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
            <div className="text-center mb-8">
              <span className="font-logo text-3xl text-[#FF6B3D] tracking-wide block mb-2">HereNow</span>
              <h3 className="font-brand font-bold text-xl text-slate-900">Sign in to join</h3>
              <p className="text-slate-500 text-sm mt-1">Register for this event and join the discussion.</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleLogin}
                className="flex items-center justify-center gap-3 w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all"
              >
                <span className="font-bold text-blue-600">G</span><span>Continue with Google</span>
              </button>
              <button 
                onClick={handleLogin}
                className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                <Mail size={18} /><span>Continue with Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <span className="font-logo text-4xl text-[#FF6B3D] tracking-wide cursor-pointer hover:opacity-90 transition-opacity mt-1">HereNow</span>
            <div className="hidden md:flex items-center gap-8">
               <a href="#" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-[15px] transition-colors"><Calendar size={20} /><span>Events</span></a>
               <a href="#" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-[15px] transition-colors"><Users size={20} /><span>Communities</span></a>
               <a href="#" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium text-[15px] transition-colors"><Compass size={20} /><span>Discover</span></a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-5 text-slate-500">
              <button className="hover:text-slate-900 transition-colors p-1"><Search size={22} /></button>
              <button className="hover:text-slate-900 transition-colors p-1 relative"><Bell size={22} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span></button>
            </div>
            
            {/* User Avatar - Changes based on Login State */}
            {isLoggedIn ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-200 to-rose-200 p-0.5 cursor-pointer hover:ring-2 hover:ring-orange-100 transition-all relative group">
                 <img src="https://ui-avatars.com/api/?name=Tim+Z&background=0f172a&color=fff" alt="User" className="w-full h-full object-cover rounded-full border border-white" />
                 <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 p-1 hidden group-hover:block">
                    <button onClick={() => setIsLoggedIn(false)} className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2"><LogOut size={12}/> Sign Out</button>
                 </div>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-slate-600 hover:text-[#FF6B3D] transition-colors">Sign In</button>
            )}

            <button className="hidden sm:flex items-center gap-1.5 bg-[#FF6B3D] hover:bg-[#e55a2c] text-white px-5 py-2.5 rounded-full font-brand font-bold text-sm shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all">
              <Plus size={18} strokeWidth={2.5} /><span>Create Event</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left Column (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            {/* ... Poster & Hosts Code (Unchanged) ... */}
            <div className="group relative aspect-[4/5] w-full rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 ring-1 ring-slate-100 bg-slate-200">
              <img src="https://images.pexels.com/photos/2833037/pexels-photo-2833037.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Event Poster" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#FF6B3D] shadow-sm border border-white/50">NOVEMBER SERIES</div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                 <p className="text-white/90 text-sm font-medium mb-1">Presented by</p>
                 <p className="text-white font-brand font-bold text-xl">{event.hostOrg}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-slate-900 font-brand font-bold text-lg">Hosted By</h3>
              <div className="flex flex-col gap-3">
                {event.hosts.map((host, idx) => (
                  <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <img src={host.avatar} alt={host.name} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm bg-slate-200" />
                    <div>
                      <p className="text-slate-900 font-semibold text-sm group-hover:text-[#FF6B3D] transition-colors">{host.name}</p>
                      <p className="text-slate-400 text-xs">{host.role}</p>
                    </div>
                    <button className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"><MessageCircle size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
               <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"><MessageCircle size={16} className="group-hover:text-[#FF6B3D] transition-colors"/> Contact the Host</button>
               <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group"><Flag size={16} className="group-hover:text-red-500 transition-colors"/> Report Event</button>
               <div className="flex gap-4 mt-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#0077b5] hover:text-white transition-colors cursor-pointer"><Linkedin size={14}/></div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-colors cursor-pointer"><Twitter size={14}/></div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-600 hover:text-white transition-colors cursor-pointer"><Globe size={14}/></div>
               </div>
            </div>

            {/* DISCUSSION SECTION */}
            <div className="border-t border-slate-100 pt-8 mt-4">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-slate-900 font-brand font-bold text-lg">Discussion</h3>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{comments.length}</span>
              </div>

              {/* Compact Input */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-start gap-2 focus-within:ring-1 focus-within:ring-[#FF6B3D] focus-within:border-[#FF6B3D] transition-all mb-6 relative">
                 {/* Visual Block for Input if not logged in (Optional, but using button click is smoother) */}
                 <div className="flex-1">
                   <textarea 
                    placeholder="Ask a question..." 
                    rows={1}
                    className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 text-sm py-1 px-1 resize-none min-h-[36px]"
                   />
                 </div>
                 <button 
                   onClick={() => checkAuth(() => {
                     // Add logic to post comment here
                     console.log("Posted!"); 
                   })}
                   className="bg-white hover:bg-[#FF6B3D] hover:text-white text-slate-400 shadow-sm border border-slate-200 border-none p-1.5 rounded-lg transition-colors"
                 >
                   <Send size={16} />
                 </button>
              </div>

              {/* Interactive Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img src={comment.avatar} alt={comment.user} className="w-8 h-8 rounded-full bg-slate-100 border border-white shadow-sm shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-slate-900 font-bold text-xs">{comment.user}</h4>
                        <span className="text-[10px] text-slate-400">{comment.time}</span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{comment.text}</p>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-4 mt-2">
                         <button 
                           onClick={() => checkAuth(() => toggleLike(comment.id))}
                           className={`text-[10px] font-bold flex items-center gap-1 transition-all duration-200 ${comment.isLiked ? 'text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           <Heart size={12} fill={comment.isLiked ? "currentColor" : "none"} className={`transition-transform duration-200 ${comment.isLiked ? 'scale-110' : ''}`} /> 
                           {comment.likes}
                         </button>
                         <button 
                           onClick={() => checkAuth(() => toggleReply(comment.id))}
                           className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${comment.showReply ? 'text-[#FF6B3D]' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                           Reply
                         </button>
                      </div>

                      {/* Nested Reply Input */}
                      {comment.showReply && (
                        <div className="mt-3 flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                             <CornerDownRight size={12} className="text-slate-400" />
                           </div>
                           <div className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-1.5 flex items-center gap-2">
                             <input 
                               type="text" 
                               placeholder={`Reply to ${comment.user}...`}
                               className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:ring-0 p-0"
                               autoFocus
                             />
                             <button 
                               onClick={() => checkAuth(() => console.log("Reply posted"))}
                               className="text-[#FF6B3D] text-[10px] font-bold px-2 py-0.5 hover:bg-orange-50 rounded"
                             >
                               Post
                             </button>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7/12) */}
          <div className="lg:col-span-7 relative">
            {/* Header Area */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">Dallas, TX</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6B3D] text-xs font-semibold border border-orange-100 flex items-center gap-1"><Ticket size={12}/> Limited Spots</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-brand font-extrabold text-slate-900 leading-[1.1] mb-6">{event.title}</h1>
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B3D] shrink-0"><Calendar size={20} /></div>
                   <div>
                     <p className="font-bold text-slate-900">{event.date}</p>
                     <p className="text-sm text-slate-500">{event.time}</p>
                     <div className="mt-1 text-xs text-[#FF6B3D] font-medium cursor-pointer hover:underline">Add to Calendar</div>
                   </div>
                </div>
                <div className="w-full h-[1px] bg-slate-50"></div>
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0"><MapPin size={20} /></div>
                   <div>
                     <p className="font-bold text-slate-900">{event.location}</p>
                     <p className="text-sm text-slate-500">{event.city}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* TAB SYSTEM */}
            <div className="mb-10">
              <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  { id: 'moments', label: 'Moments', icon: ImageIcon },
                  { id: 'resources', label: 'Resources', icon: Download }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                      ${activeTab === tab.id 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}
                  >
                    <tab.icon size={16} className={activeTab === tab.id ? 'text-[#FF6B3D]' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[100px]">
                {activeTab === 'overview' && (
                  <div className="prose prose-slate prose-lg text-slate-500">
                    <p>{event.description}</p>
                    <p>At this event, you will have the opportunity to:</p>
                    <ul className="list-disc pl-5 space-y-1 marker:text-[#FF6B3D]">
                      <li>Connect deeply with 50+ early-stage founders</li>
                      <li>Gain market insights from top-tier VCs</li>
                      <li>Enjoy curated light bites and drinks</li>
                    </ul>
                  </div>
                )}

                {activeTab === 'moments' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-black">
                      <img src="https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Video Thumb" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle size={40} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    {event.gallery.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-slate-100">
                        <img src={img.src} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="grid gap-3">
                    {event.resources.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50/30 transition-all group cursor-pointer bg-white">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                             <FileText size={20} />
                           </div>
                           <div>
                             <p className="text-slate-900 font-bold text-sm group-hover:text-[#FF6B3D] transition-colors">{file.title}</p>
                             <p className="text-slate-400 text-xs font-medium">{file.size} • {file.type.toUpperCase()}</p>
                           </div>
                         </div>
                         <button className="text-slate-400 hover:text-[#FF6B3D] transition-colors">
                           <Download size={20} />
                         </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div className="mb-12">
              <h3 className="text-slate-900 font-brand font-bold text-xl mb-3">Location</h3>
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight="0" 
                  marginWidth="0" 
                  src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=Dallas%20Texas&amp;t=&amp;z=12&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                  className="filter grayscale-[20%] opacity-80 group-hover:opacity-100 transition-all duration-500"
                  title="Google Map"
                ></iframe>
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Lock size={18} className="text-[#FF6B3D]" /></div>
                   <div>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Exact Location Hidden</p>
                     <p className="text-sm font-bold text-slate-900">Register to unlock</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Registration Card (Sticky) */}
            <div className="sticky top-24 z-30">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-orange-500/5 p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-xl font-brand font-bold text-slate-900 mb-1 relative z-10">Registration</h2>
                <p className="text-sm text-slate-500 mb-6 relative z-10">Welcome! Please choose your desired ticket type:</p>
                <div className="space-y-3 relative z-10">
                  <div onClick={() => setSelectedTicket('new')} className={`cursor-pointer group p-4 rounded-2xl border-2 transition-all duration-200 ${selectedTicket === 'new' ? 'border-[#FF6B3D] bg-orange-50/30' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        {selectedTicket === 'new' ? <CheckCircle2 size={18} className="text-[#FF6B3D]"/> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200"></div>}
                        <span className="font-bold text-slate-900">9K Club New Applicants</span>
                      </div>
                      <span className="font-brand font-bold text-slate-900">Free</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-[26px]">For founders pitching for a chance to join the club.</p>
                  </div>
                  <div onClick={() => setSelectedTicket('member')} className={`cursor-pointer group p-4 rounded-2xl border-2 transition-all duration-200 ${selectedTicket === 'member' ? 'border-[#FF6B3D] bg-orange-50/30' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                         {selectedTicket === 'member' ? <CheckCircle2 size={18} className="text-[#FF6B3D]"/> : <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200"></div>}
                        <span className="font-bold text-slate-900">9K Club Members</span>
                      </div>
                      <span className="font-brand font-bold text-slate-900">Free</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-[26px]">For current 9K Club members only.</p>
                  </div>
                </div>
                <div className="mt-6 relative z-10">
                   {/* Also check auth for Registration, though traditionally this opens the modal anyway */}
                   <button 
                     onClick={() => checkAuth(() => console.log("Proceed to checkout"))} 
                     className="w-full bg-[#FF6B3D] hover:bg-[#e55a2c] text-white font-brand font-bold text-lg py-3.5 rounded-2xl shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                   >
                     {isLoggedIn ? "Complete Registration" : "Request to Join"} <ChevronRight size={20} />
                   </button>
                   <p className="text-center text-xs text-slate-400 mt-3">By clicking, you agree to our Terms of Service.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between px-2">
                 <div className="flex -space-x-3">
                    {event.participantAvatars.map((url, i) => (<img key={i} src={url} className="w-8 h-8 rounded-full ring-2 ring-white object-cover bg-slate-200" alt="User" />))}
                    <div className="w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-xs font-bold text-slate-600">+{event.participants}</div>
                 </div>
                 <div className="text-xs text-slate-400 font-medium">140+ Registered</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <div className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-200/60 mb-12">
         <div className="flex flex-wrap gap-2">
           {event.tags.map((tag) => (<span key={tag} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors"># {tag}</span>))}
         </div>
      </div>
    </div>
  );
};

export default ActivityDetail;