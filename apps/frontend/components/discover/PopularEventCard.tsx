'use client';

import { MapPin } from 'lucide-react';
import Image from 'next/image';

interface PopularEventCardProps {
  event: {
    id: number;
    title: string;
    date: string;
    location: string;
    image: string;
    organizer: string;
  };
}

export default function PopularEventCard({ event }: PopularEventCardProps) {
  return (
    <div className="group flex gap-4 p-3 bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer">
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
        <Image 
          src={event.image} 
          alt={event.title} 
          fill
          sizes="96px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="flex flex-col justify-center py-1">
        <div className="text-[#FF6B3D] text-xs font-bold uppercase tracking-wider mb-1">
          {event.date}
        </div>
        <h3 className="font-brand font-bold text-slate-900 text-lg leading-tight mb-1 group-hover:text-[#FF6B3D] transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <MapPin size={14} />
          {event.location}
        </div>
      </div>
    </div>
  );
}

