import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Compass, 
  Search, 
  Bell, 
  Plus, 
  ChevronDown, 
  User,
  Users,
  MapPin,
  Clock,
  MoreHorizontal,
  Filter,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Download,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react';

const HereNowHome = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isHoveringCreate, setIsHoveringCreate] = useState(false);
  // DEMO STATE: Toggle between empty state and list view
  const [hasEvents, setHasEvents] = useState(false);
  
  // Search, Filter, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // NEW: Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState('idle'); // idle, loading, success, error

  // Mock Data
  const [eventsData, setEventsData] = useState({
    upcoming: [
      { id: 1, title: "Design Systems & The Future of AI", date: "NOV 14", time: "7:00 PM", location: "San Francisco, CA", imageColor: "from-blue-400 to-purple-500", category: "this-week" },
      { id: 2, title: "HereNow Community Meetup", date: "NOV 20", time: "6:30 PM", location: "Online Event", imageColor: "from-[#FF6B3D] to-orange-400", category: "this-month" },
      { id: 3, title: "Product Design Workshop", date: "DEC 02", time: "10:00 AM", location: "New York, NY", imageColor: "from-emerald-400 to-teal-500", category: "next-month" },
      { id: 6, title: "React Conf 2024 Watch Party", date: "NOV 16", time: "8:00 PM", location: "San Jose, CA", imageColor: "from-pink-400 to-rose-500", category: "this-week" },
      { id: 7, title: "Figma Config Recap", date: "NOV 25", time: "5:00 PM", location: "London, UK", imageColor: "from-violet-400 to-fuchsia-500", category: "this-month" },
      { id: 8, title: "Tech & Coffee Morning", date: "NOV 18", time: "8:00 AM", location: "Seattle, WA", imageColor: "from-amber-400 to-orange-500", category: "this-week" },
      { id: 9, title: "AI in Healthcare Panel", date: "DEC 05", time: "6:00 PM", location: "Boston, MA", imageColor: "from-cyan-400 to-blue-500", category: "next-month" },
    ],
    past: [
      { id: 4, title: "Q3 Town Hall Meeting", date: "OCT 15", time: "9:00 AM", location: "Headquarters", imageColor: "from-slate-400 to-slate-500", category: "last-month" },
      { id: 5, title: "Summer Hackathon Demo Day", date: "AUG 28", time: "2:00 PM", location: "Tech Hub", imageColor: "from-indigo-400 to-blue-500", category: "last-3-months" },
      { id: 10, title: "Team Building Retreat", date: "SEP 10", time: "All Day", location: "Lake Tahoe", imageColor: "from-teal-400 to-emerald-500", category: "last-3-months" },
      { id: 11, title: "Q2 Financial Review", date: "JUL 15", time: "10:00 AM", location: "Online", imageColor: "from-gray-400 to-slate-600", category: "older" },
    ]
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
  const filteredEvents = currentTabEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || event.category === activeFilter;
    
    return matchesSearch && matchesFilter;
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
        const newEvent = {
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
        setHasEvents(true); // Ensure list is shown
      }, 1000);
    }, 1500);
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-orange-200 selection:text-orange-900 ${isImportModalOpen ? 'overflow-hidden h-screen' : ''}`}>
      
      {/* 导航栏 (Navbar) */}
      <nav className="w-full z-50 px-6 py-5 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-10">
              <a href="#" className="text-3xl text-[#FF6B3D] tracking-wide hover:scale-105 transition-transform font-logo select-none">
                HereNow
              </a>
              <div className="hidden md:flex items-center gap-6">
                <NavLink icon={<Calendar size={18} />} text="Events" active />
                <NavLink icon={<Users size={18} />} text="Communities" />
                <NavLink icon={<Compass size={18} />} text="Discover" />
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-500 hover:text-[#FF6B3D] hover:bg-orange-50 rounded-full transition-colors">
                  <Search size={22} strokeWidth={2} />
                </button>
                <button className="p-2 text-slate-500 hover:text-[#FF6B3D] hover:bg-orange-50 rounded-full transition-colors relative">
                  <Bell size={22} strokeWidth={2} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#FF6B3D] rounded-full border border-white"></span>
                </button>
              </div>
              <button className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF9E7D] via-[#FF6B3D] to-orange-300 shadow-sm border-2 border-white hover:scale-105 transition-transform cursor-pointer"></button>
              <button 
                onClick={() => setHasEvents(true)}
                className="hidden md:flex items-center gap-2 bg-[#FF6B3D] text-white pl-4 pr-5 py-2.5 rounded-full font-brand font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:bg-[#ff5a26] hover:scale-[1.02] active:scale-[0.98] transition-all ml-2"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Create Event</span>
              </button>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-10 pb-12 px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col relative z-0">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-7xl font-brand font-extrabold tracking-tight leading-[1.1] mb-4">
              <span className="block text-slate-900">Your Event</span>
              <span className="block bg-gradient-to-r from-[#FF6B3D] to-[#FF9E7D] bg-clip-text text-transparent pb-2">Records</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-md leading-relaxed">
              Record every amazing moment you've been a part of.
            </p>
          </div>

          <div className="flex flex-col items-end gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-slate-200/50 p-1 rounded-2xl inline-flex">
              {['upcoming', 'past'].map((tab) => (
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
        </div>

        {/* Content Area */}
        {hasEvents ? (
          <div className="flex flex-col gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            
            {/* Search & Filter & Import Toolbar */}
            <div className="flex flex-col md:flex-row gap-4">
              
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF6B3D] transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search events..." 
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
                    <div key={event.id} className="group bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className={`h-48 rounded-2xl bg-gradient-to-br ${event.imageColor} relative overflow-hidden`}>
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="text-xs font-bold text-slate-900 tracking-wider font-brand">{event.date}</span>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      </div>
                      
                      <div className="pt-4 pb-2 px-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 font-brand group-hover:text-[#FF6B3D] transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-slate-500 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            {event.time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            {event.location}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                              <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
                              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">+3</div>
                          </div>
                          <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#FF6B3D] transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Create New Card */}
                  {searchTerm === '' && activeFilter === 'all' && currentPage === totalPages && (
                    <div 
                        onClick={() => setHasEvents(!hasEvents)}
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
                <p className="font-medium">No events found matching "{searchTerm}"</p>
                <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} className="mt-4 text-[#FF6B3D] font-bold text-sm hover:underline">Clear filters</button>
              </div>
            )}
          </div>
        ) : (
          // --- Empty State View ---
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

            <h2 className="text-2xl font-brand font-bold text-slate-900 mb-3 capitalize">No {activeTab} Records</h2>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed font-medium">
              {activeTab === 'upcoming' ? "You have no upcoming events scheduled. Why not take the lead and host something amazing today?" : "No past events found. Your journey is just beginning!"}
            </p>

            <button 
              onClick={() => setHasEvents(true)}
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
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 text-center border-t border-slate-200 bg-white/30 backdrop-blur-sm mt-auto">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="flex gap-6 text-sm font-medium text-slate-500">
              <FooterLink text="Discover" />
              <FooterLink text="Pricing" />
              <FooterLink text="Help" />
            </div>
            <div className="mt-4 md:mt-0 text-sm font-medium text-slate-500">
              Host your event with <span className="text-[#FF6B3D] font-bold cursor-pointer hover:underline">HereNow ↗</span>
            </div>
             <div className="hidden md:flex gap-4 text-slate-400">
               <div className="w-5 h-5 bg-current rounded-md opacity-50 hover:opacity-100 hover:text-[#FF6B3D] cursor-pointer transition-all"></div>
               <div className="w-5 h-5 bg-current rounded-md opacity-50 hover:opacity-100 hover:text-[#FF6B3D] cursor-pointer transition-all"></div>
            </div>
         </div>
      </footer>

      {/* --- IMPORT MODAL --- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsImportModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-8 md:p-10 animate-fade-in-up">
            <button 
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FF6B3D]">
                 <Globe size={32} />
              </div>
              <h3 className="text-2xl font-brand font-bold text-slate-900 mb-2">Import Event</h3>
              <p className="text-slate-500 leading-relaxed">
                Paste a link from your favorite platform, and we'll magically pull in all the details for you.
              </p>
            </div>

            {/* Input Area */}
            <div className="space-y-6">
              <div className="relative">
                <input 
                  type="text" 
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    if(importStatus === 'error') setImportStatus('idle');
                  }}
                  placeholder="https://lu.ma/event/..." 
                  className={`w-full bg-slate-50 border-2 ${importStatus === 'error' ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-[#FF6B3D]'} rounded-2xl pl-5 pr-12 py-4 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                   <LinkIcon size={20} />
                </div>
              </div>

              {/* Supported Platforms Hints */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Luma</span>
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Eventbrite</span>
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Partiful</span>
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg">Zoom</span>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleImport}
                disabled={!importUrl || importStatus === 'loading' || importStatus === 'success'}
                className={`w-full py-4 rounded-2xl font-brand font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300
                  ${importStatus === 'success' 
                    ? 'bg-green-500 text-white shadow-green-500/30' 
                    : !importUrl 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {importStatus === 'loading' ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    <span>Fetching Details...</span>
                  </>
                ) : importStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={24} />
                    <span>Imported Successfully!</span>
                  </>
                ) : (
                  <span>Import Event</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
        
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
        .font-logo { font-family: 'Lalezar', system-ui; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

// Sub-components
const NavLink = ({ icon, text, active = false }) => (
  <a 
    href="#" 
    className={`flex items-center gap-2 px-1 py-1 text-base font-semibold transition-all duration-200 group
      ${active 
        ? 'text-slate-900' 
        : 'text-slate-500 hover:text-slate-900'
      }`}
  >
    <span className={active ? 'text-[#FF6B3D]' : 'text-slate-400 group-hover:text-slate-600'}>
      {icon}
    </span>
    <span>{text}</span>
  </a>
);

// Filter Button Component
const FilterButton = ({ label, active, onClick }) => (
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

const FooterLink = ({ text }) => (
  <a href="#" className="hover:text-[#FF6B3D] transition-colors">{text}</a>
);

export default HereNowHome;