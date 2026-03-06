'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, CalendarDays, UserPlus } from 'lucide-react';
import { getUserEvents } from '@/lib/api/client';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string;
  start_at: string;
  end_at: string;
  timezone: string;
  location_info: any;
  visibility: string;
  is_created: boolean;
  is_registered: boolean;
  registration_count: number;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'created' | 'registered'>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserEvents();
      setEvents(data.events || []);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'created') return event.is_created;
    if (filter === 'registered') return event.is_registered;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Events</h1>
          <p className="text-slate-600">Manage your created and registered events</p>
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
              All Events
            </button>
            <button
              onClick={() => setFilter('created')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'created'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setFilter('registered')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'registered'
                  ? 'bg-[#FF6B3D] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Registered
            </button>
          </div>

          <Link href="/create/event">
            <button className="px-4 py-2 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500">Loading events...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No events found</h3>
            <p className="text-slate-500 mb-4">
              {filter === 'created'
                ? "You haven't created any events yet"
                : filter === 'registered'
                ? "You haven't registered for any events yet"
                : "No events found"}
            </p>
            <Link href="/create/event">
              <button className="px-6 py-3 bg-[#FF6B3D] text-white rounded-lg hover:bg-[#FF855F] transition-colors flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Create Your First Event
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/event/${event.slug || event.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                {event.cover_image_url ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={event.cover_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#FF6B3D] to-[#FF855F] flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white opacity-50" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {event.is_created && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Created
                      </span>
                    )}
                    {event.is_registered && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Registered
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.start_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(event.start_at)} - {formatTime(event.end_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{event.registration_count} registered</span>
                    </div>
                    {event.location_info?.name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location_info.name}</span>
                      </div>
                    )}
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
