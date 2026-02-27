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
  Users 
} from 'lucide-react';
import DiscoverNavbar from '@/components/discover/DiscoverNavbar';
import SectionTitle from '@/components/discover/SectionTitle';
import PopularEventCard from '@/components/discover/PopularEventCard';
import CategoryCard from '@/components/discover/CategoryCard';
import CommunityCard from '@/components/discover/CommunityCard';
import { CATEGORIES, POPULAR_EVENTS, FEATURED_COMMUNITIES, CITIES } from '@/components/discover/constants';
import { useEntitlements } from '@/hooks/useEntitlements';

export default function DiscoverPage() {
  const router = useRouter();
  const { canAccessDiscover, isLoading: entitlementsLoading } = useEntitlements();
  const [activeRegion, setActiveRegion] = useState<keyof typeof CITIES>('North America');

  // 检查权限，如果没有权限则重定向
  useEffect(() => {
    if (!entitlementsLoading && !canAccessDiscover) {
      // 可以显示提示或重定向到首页
      alert('您当前的套餐不支持访问 Discover 功能，请升级套餐后使用。');
      router.push('/home');
    }
  }, [canAccessDiscover, entitlementsLoading, router]);

  // 如果正在加载权限或没有权限，显示加载状态或空内容
  if (entitlementsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
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
          <h2 className="text-2xl font-brand font-bold text-slate-900 mb-3">Discover 功能未开启</h2>
          <p className="text-slate-500 mb-6 leading-relaxed">
            您当前的套餐不支持访问 Discover 功能。请升级到 Pro 套餐以解锁此功能。
          </p>
          <button 
            onClick={() => router.push('/home')}
            className="w-full bg-[#FF6B3D] text-white px-6 py-3 rounded-xl font-bold font-brand hover:bg-[#ff5a26] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

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

          {/* Popular Events Section */}
          <section>
            <SectionTitle 
              title="Popular Events" 
              subtitle="Trending in your area"
              action="View All" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {POPULAR_EVENTS.map(event => (
                <PopularEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>

          {/* Categories Section */}
          <section>
            <SectionTitle title="Browse by Category" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
              {CATEGORIES.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>

          {/* Featured Communities Section */}
          <section>
             <SectionTitle 
              title="Featured Communities" 
              subtitle="Curated communities you might like"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURED_COMMUNITIES.map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
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

