'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Crown, UserPlus, Globe, Lock } from 'lucide-react';
import { getUserCommunities } from '@/lib/api/client';
import Link from 'next/link';

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  member_count: number;
  is_joined: boolean;
  is_owner: boolean;
}

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'owned'>('all');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserCommunities();
      setCommunities(data.communities || []);
    } catch (err) {
      setError('Failed to load communities');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter(community => {
    if (filter === 'all') return true;
    if (filter === 'joined') return community.is_joined && !community.is_owner;
    if (filter === 'owned') return community.is_owner;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Communities</h1>
          <p className="text-slate-600">Manage your joined and created communities</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              All Communities
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'joined'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Joined
            </button>
            <button
              onClick={() => setFilter('owned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'owned'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Owned
            </button>
          </div>

          <Link href="/create/community">
            <button className="px-4 py-2 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Community
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500">Loading communities...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No communities found</h3>
            <p className="text-slate-500 mb-4">
              {filter === 'owned'
                ? "You haven't created any communities yet"
                : filter === 'joined'
                ? "You haven't joined any communities yet"
                : "No communities found"}
            </p>
            <Link href="/create/community">
              <button className="px-6 py-3 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Create Your First Community
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <Link
                key={community.id}
                href={`/community-detail?id=${community.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {community.cover_image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={community.cover_image_url}
                      alt={community.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#FF6B3D] to-[#FF855F] flex items-center justify-center">
                    <Users className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {community.is_owner && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Owner
                      </span>
                    )}
                    {community.is_joined && !community.is_owner && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <UserPlus className="w-3 h-3" />
                        Member
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">
                    {community.name}
                  </h3>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {community.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{community.member_count} members</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
