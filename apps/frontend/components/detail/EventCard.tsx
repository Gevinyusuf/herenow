'use client';

import Link from 'next/link';
import { Clock, MapPin, ArrowRight } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: string;
  image: string;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link 
      href={`/event-detail`}
      className="group bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 flex flex-col sm:flex-row gap-4 cursor-pointer"
    >
      {/* Event Image */}
      <div className="w-full sm:w-48 h-32 sm:h-auto rounded-2xl overflow-hidden relative shrink-0">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-slate-900 font-brand shadow-sm">
          {event.status}
        </div>
      </div>

      {/* Event Details */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-brand font-bold text-slate-900 group-hover:text-[#FF6B3D] transition-colors">
              {event.title}
            </h3>
          </div>
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <Clock size={16} className="text-[#FF6B3D]/70" />
              {event.date} • {event.time}
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <MapPin size={16} className="text-[#FF6B3D]/70" />
              {event.location}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1,2,3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white ring-1 ring-slate-100" />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-bold ml-1">+{event.attendees} Joined</span>
          </div>
          
          <button className="p-2 rounded-xl bg-slate-50 text-slate-600 group-hover:bg-[#FF6B3D] group-hover:text-white transition-colors">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}

