'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { searchCommunities, Community } from '@/lib/api/community';

interface CommunitySearchProps {
  onCommunityClick?: (community: Community) => void;
}

export default function CommunitySearch({ onCommunityClick }: CommunitySearchProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy] = useState<'members' | 'recent'>('members');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() && !location.trim()) {
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const result = await searchCommunities(query, location, sortBy, 1, 20);
      setCommunities(result.communities || []);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query || location) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [query, location, sortBy]);

  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索社群名称或描述..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
            />
          </div>
          
          <div className="relative md:w-48">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="城市"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/20"
            />
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setSortBy('members')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'members'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              热门
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                sortBy === 'recent'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              最新
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B3D]"></div>
        </div>
      )}

      {!isLoading && hasSearched && communities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">没有找到匹配的社群</p>
        </div>
      )}

      {!isLoading && communities.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/community-detail?id=${community.id}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <img
                  src={community.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=FF6B3D&color=fff`}
                  alt={community.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate group-hover:text-[#FF6B3D] transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                    {community.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Users size={12} />
                      {community.members_count} 成员
                    </span>
                    {community.settings?.city && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={12} />
                        {community.settings.city}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-300 group-hover:text-[#FF6B3D] transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
