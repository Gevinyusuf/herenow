'use client';

import { MapPin, Plus } from 'lucide-react';

interface CommunityCardProps {
  community: {
    id: number;
    name: string;
    description: string;
    logo: string;
    location: string;
  };
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <div className="flex flex-col p-5 bg-white/70 hover:bg-white border border-white/60 rounded-3xl hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 h-full relative overflow-hidden group/card">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-sm group-hover/card:scale-110 transition-transform duration-300">
          {community.logo}
        </div>
        <button className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 text-sm font-bold hover:border-[#FF6B3D] hover:bg-[#FF6B3D] hover:text-white transition-all flex items-center gap-1.5 shadow-sm hover:shadow-orange-500/30 group/btn">
          Join
          <Plus size={14} className="group-hover/btn:rotate-90 transition-transform duration-300" />
        </button>
      </div>
      <h3 className="font-brand font-bold text-slate-900 text-lg mb-2">
        {community.name}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">
        {community.description}
      </p>
      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium uppercase tracking-wide mt-auto">
        <MapPin size={12} /> {community.location}
      </div>
    </div>
  );
}

