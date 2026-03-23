'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Calendar } from 'lucide-react';
import Image from 'next/image';

interface PopularEventCardProps {
  event: {
    id: string | number;
    title: string;
    date?: string;
    start_time?: string;
    location?: string;
    city?: string;
    image?: string;
    cover_image_url?: string;
    organizer?: string;
  };
}

export default function PopularEventCard({ event }: PopularEventCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/event-detail?id=${event.id}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const displayDate = event.date || formatDate(event.start_time);
  const displayLocation = event.location || event.city || 'TBD';
  const displayImage = event.image || event.cover_image_url || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';

  return (
    <div
      onClick={handleClick}
      className="group flex gap-4 p-3 bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/60 rounded-2xl hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer"
    >
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={displayImage}
          alt={event.title}
          fill
          sizes="96px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
          }}
        />
      </div>
      <div className="flex flex-col justify-center py-1">
        <div className="text-[#FF6B3D] text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <Calendar size={12} />
          {displayDate}
        </div>
        <h3 className="font-brand font-bold text-slate-900 text-lg leading-tight mb-1 group-hover:text-[#FF6B3D] transition-colors line-clamp-1">
          {event.title}
        </h3>
        <div className="flex items-center gap-1 text-slate-500 text-sm">
          <MapPin size={14} />
          {displayLocation}
        </div>
      </div>
    </div>
  );
}
