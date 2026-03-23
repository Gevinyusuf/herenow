'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Calendar,
  Compass,
  Plus,
  MapPin,
  ChevronRight,
  Zap,
  Coffee,
  Cpu,
  Palette,
  Leaf,
  Activity,
  Globe,
  Users,
  Loader2
} from 'lucide-react';
import DiscoverNavbar from '@/components/discover/DiscoverNavbar';
import SectionTitle from '@/components/discover/SectionTitle';
import PopularEventCard from '@/components/discover/PopularEventCard';
import CategoryCard from '@/components/discover/CategoryCard';
import CommunityCard from '@/components/discover/CommunityCard';
import { CATEGORIES, POPULAR_EVENTS, CITIES } from '@/components/discover/constants';
import { useEntitlements } from '@/hooks/useEntitlements';
import { searchCommunities } from '@/lib/api/community';
import { createClient } from '@/lib/supabase/client';
import { getPublicEvents, searchEvents } from '@/lib/api/client';

interface CommunityData {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  members_count: number;
  events_count: number;
  settings: Record<string, any>;
  created_at: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { canAccessDiscover, isLoading: entitlementsLoading } = useEntitlements();
  const [activeTab, setActiveTab] = useState<'events' | 'communities'>('events');
  const [activeRegion, setActiveRegion] = useState<keyof typeof CITIES>('North America');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [categoryEvents, setCategoryEvents] = useState<any[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityData[]>([]);
  const [searchEventsResults, setSearchEventsResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!entitlementsLoading && !canAccessDiscover) {
    }
  }, [canAccessDiscover, entitlementsLoading, router]);

  useEffect(() => {
    if (canAccessDiscover) {
      fetchCommunities();
      fetchEvents(selectedCategory || undefined);
    }
  }, [canAccessDiscover]);

  useEffect(() => {
    if (canAccessDiscover && activeTab === 'events') {
      fetchEvents();
    }
  }, [activeTab, canAccessDiscover]);

  useEffect(() => {
    if (canAccessDiscover && activeTab === 'events' && selectedCategory) {
      console.log('🎯 useEffect triggered, selectedCategory:', selectedCategory);
      fetchCategoryEvents(selectedCategory);
    }
  }, [selectedCategory, activeTab, canAccessDiscover]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const result = await getPublicEvents(1, 6);
      setEvents(result.events || []);
    } catch (error) {
      console.error('❌ 获取活动失败:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchCategoryEvents = async (category: string) => {
    try {
      console.log('🔍 Fetching category events:', category);
      const result = await getPublicEvents(1, 10, category);
      console.log('📦 Category events result:', result);
      setCategoryEvents(result.events || []);
    } catch (error) {
      console.error('❌ 获取分类活动失败:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoadingCommunities(true);
      const result = await searchCommunities('', '', 'members', 1, 8);
      setCommunities(result.communities || []);
    } catch (error) {
      console.error('❌ 获取社群失败:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearchEventsResults([]);
      return;
    }
    try {
      setSearching(true);
      const [communityResult, eventResult] = await Promise.all([
        searchCommunities(query, '', 'members', 1, 10),
        searchEvents(query, 1, 10, selectedCategory || undefined)
      ]);
      setSearchResults(communityResult.communities || []);
      setSearchEventsResults(eventResult.events || []);
    } catch (error) {
      console.error('❌ 搜索失败:', error);
    } finally {
      setSearching(false);
    }
  };

  if (entitlementsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!canAccessDiscover) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 max-w-md shadow-lg border border-slate-200 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass size={32} className="text-[#FF6B3D]" />
          </div>
          <h2 className="text-2xl font-brand font-bold text-slate-900 mb-3">Discover Locked</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            Upgrade to Pro to unlock Discover and explore communities worldwide.
          </p>
          <button
            onClick={() => router.push('/pricing')}
            className="w-full bg-[#FF6B3D] text-white px-6 py-3 rounded-xl font-bold font-brand hover:bg-[#ff5a26] transition-colors"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  const displayCommunities = searchQuery.trim().length >= 2 ? searchResults : communities;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-orange-200 selection:text-orange-900">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-br from-slate-50 via-white to-orange-50/40 z-0" />
      <div className="fixed inset-0 pointer-events-none bg-pattern z-0" />

      <div className="relative z-10">
        <DiscoverNavbar />

        <main className="max-w-7xl mx-auto px-6 pt-24 pb-24 space-y-16">

          {/* Header Area */}
          <header className="max-w-2xl mt-4">
            <h1 className="font-brand text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Your Discover
            </h1>
            <p className="font-brand text-5xl md:text-6xl font-extrabold text-[#FF6B3D] tracking-tight mt-2">
              Awaits
            </p>
            <p className="text-slate-500 text-lg md:text-xl leading-relaxed mt-6 max-w-xl">
              The next unforgettable experience is just around the corner. Step out, explore, and find where you belong.
            </p>
          </header>

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === 'events'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === 'communities'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Communities
            </button>
          </div>

          {/* Search Bar */}
          <section>
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'events' ? "Search events..." : "Search communities..."}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:border-[#FF6B3D] focus:ring-2 focus:ring-[#FF6B3D]/20 outline-none transition-all text-slate-900 placeholder:text-slate-400"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-slate-400" />
              )}
            </div>
            {searchQuery.trim().length >= 2 && (
              <div className="mt-4 space-y-6">
                {activeTab === 'communities' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {searchResults.length > 0 ? (
                      searchResults.map((community) => (
                        <CommunityCard
                          key={community.id}
                          community={{
                            id: community.id,
                            name: community.name,
                            description: community.description || '',
                            logo: community.logo_url || '👥',
                            location: community.settings?.city || community.settings?.location || 'Global',
                            members_count: community.members_count,
                          }}
                        />
                      ))
                    ) : (
                      <p className="text-slate-500 col-span-full text-center py-8">No communities found</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searchEventsResults.length > 0 ? (
                      searchEventsResults.map((event) => (
                        <PopularEventCard key={event.id} event={event} />
                      ))
                    ) : (
                      <p className="text-slate-500 col-span-full text-center py-8">No events found</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {activeTab === 'events' && (
            <>
          {/* Popular Events Section */}
          <section>
            <SectionTitle
              title="Popular Events"
              subtitle="Trending in your area"
              action="View All"
            />
            {loadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 p-3 bg-white/60 rounded-2xl animate-pulse">
                    <div className="w-24 h-24 bg-slate-200 rounded-xl" />
                    <div className="flex-1 py-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-20" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                  <PopularEventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {POPULAR_EVENTS.map(event => (
                  <PopularEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>

          {/* Categories Section */}
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle title="Browse by Category" />
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCategoryEvents([]);
                  }}
                  className="text-sm text-[#FF6B3D] hover:text-[#ff5a26] font-medium"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {CATEGORIES.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.name}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                />
              ))}
            </div>

            {/* Category Events Horizontal Scroll */}
            {selectedCategory && categoryEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="font-brand font-bold text-lg text-slate-900 mb-4">
                  {selectedCategory} Events
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {categoryEvents.map(event => (
                    <div key={event.id} className="flex-shrink-0 w-72">
                      <PopularEventCard event={event} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Local Events Section */}
          <section>
            <SectionTitle title="Explore Local Events" />

            {/* Region Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {(Object.keys(CITIES) as Array<keyof typeof CITIES>).map(region => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    activeRegion === region
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {CITIES[activeRegion].map((city, index) => (
                <div key={index} className="group flex flex-col items-center text-center gap-3 cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-white shadow-sm group-hover:border-[#FF6B3D]/30 group-hover:shadow-orange-500/20 flex items-center justify-center text-3xl transition-all duration-300 group-hover:-translate-y-1">
                    {city.icon}
                  </div>
                  <div>
                    <h4 className="font-brand font-bold text-slate-900">{city.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{city.events}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
            </>
          )}

          {activeTab === 'communities' && (
          <>
          {/* Featured Communities Section */}
          <section>
            <SectionTitle
              title="Featured Communities"
              subtitle="Curated communities you might like"
            />
            {loadingCommunities ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayCommunities.slice(0, 8).map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={{
                      id: community.id,
                      name: community.name,
                      description: community.description || '',
                      logo: community.logo_url || '👥',
                      location: community.settings?.city || community.settings?.location || 'Global',
                      members_count: community.members_count,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
          </>
          )}

        </main>

        {/* Simple Footer */}
        <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-12">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-3xl font-lalezar text-slate-900 tracking-wide">HereNow</span>
             </div>
             <p className="text-slate-400 text-sm">© 2025 HereNow Events Inc. All rights reserved.</p>
             <div className="flex gap-6 text-sm text-slate-400">
               <a href="#" className="hover:text-slate-600">Privacy Policy</a>
               <a href="#" className="hover:text-slate-600">Terms of Service</a>
             </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
