'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Plus, Users } from 'lucide-react';

interface CommunityCardProps {
  community: {
    id: string | number;
    name: string;
    description: string;
    logo: string;
    location: string;
    members_count?: number;
    slug?: string;
  };
  onJoin?: (communityId: string | number) => void;
}

export default function CommunityCard({ community, onJoin }: CommunityCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/community-detail?id=${community.id}`);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(community.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="flex flex-col p-5 bg-white/70 hover:bg-white border border-white/60 rounded-3xl hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 h-full relative overflow-hidden group/card cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-sm group-hover/card:scale-110 transition-transform duration-300 overflow-hidden">
          {community.logo?.startsWith('http') ? (
            <img src={community.logo} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            community.logo
          )}
        </div>
        <button
          onClick={handleJoin}
          className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:border-[#FF6B3D] hover:bg-[#FF6B3D] hover:text-white transition-all flex items-center gap-1.5 shadow-sm hover:shadow-orange-500/30 group/btn"
        >
          Join
          <Plus size={14} className="group-hover/btn:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      <h3 className="font-brand font-bold text-slate-900 text-lg mb-2">
        {community.name}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-3 flex-grow line-clamp-2">
        {community.description}
      </p>
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium mt-auto">
        <div className="flex items-center gap-1">
          <MapPin size={12} /> {community.location}
        </div>
        {community.members_count !== undefined && (
          <div className="flex items-center gap-1">
            <Users size={12} /> {community.members_count}
          </div>
        )}
      </div>
    </div>
  );
}
