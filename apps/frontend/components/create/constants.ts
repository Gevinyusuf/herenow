import { LayoutGrid, Monitor, Briefcase, PartyPopper, Coffee, Trees, UserCircle, Building2 } from 'lucide-react';

export const THEME_CATEGORIES = ['All', 'Modern', 'Soft', 'Vibrant', 'Dark'] as const;
export const THEME_OPTIONS = [
  { id: 'fresh', name: 'Fresh Air', category: 'Modern', bg: 'bg-slate-50', contentBg: 'bg-white/80 backdrop-blur-md border border-white/50', text: 'text-slate-900', button: 'bg-[#FF6B3D] hover:bg-[#E05D32] text-white shadow-lg shadow-orange-500/30', preview: 'linear-gradient(to bottom right, #F8FAFC, #EFF6FF)' },
  { id: 'glass', name: 'Frost', category: 'Modern', bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', contentBg: 'bg-white/40 backdrop-blur-xl border border-white/60', text: 'text-indigo-950', button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30', preview: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)' },
  { id: 'sunset', name: 'Golden Hour', category: 'Vibrant', bg: 'bg-[#FFF7ED]', contentBg: 'bg-white/90 backdrop-blur-sm', text: 'text-orange-950', button: 'bg-orange-500 hover:bg-orange-600 text-white', preview: '#FFF7ED' },
  { id: 'midnight', name: 'Deep Space', category: 'Dark', bg: 'bg-[#0F172A]', contentBg: 'bg-[#1E293B]/80 backdrop-blur-md border border-white/5', text: 'text-white', button: 'bg-blue-500 hover:bg-blue-600 text-white', preview: '#0F172A' },
  { id: 'lavender', name: 'Lavender', category: 'Soft', bg: 'bg-purple-50', contentBg: 'bg-white/80 backdrop-blur-md border border-purple-100', text: 'text-purple-900', button: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30', preview: '#FAF5FF' },
  { id: 'mint', name: 'Mint', category: 'Modern', bg: 'bg-teal-50', contentBg: 'bg-white/80 backdrop-blur-md border border-teal-100', text: 'text-teal-900', button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/30', preview: '#F0FDFA' },
  { id: 'rose', name: 'Rose', category: 'Vibrant', bg: 'bg-rose-50', contentBg: 'bg-white/80 backdrop-blur-md border border-rose-100', text: 'text-rose-900', button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30', preview: '#FFF1F2' },
  { id: 'corporate', name: 'Corporate', category: 'Modern', bg: 'bg-gray-50', contentBg: 'bg-white border border-gray-200', text: 'text-gray-900', button: 'bg-blue-700 hover:bg-blue-800 text-white shadow-lg', preview: '#F9FAFB' },
  { id: 'luxury', name: 'Luxury', category: 'Dark', bg: 'bg-slate-950', contentBg: 'bg-slate-900/90 border border-amber-500/20', text: 'text-amber-50', button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20', preview: '#020617' },
  { id: 'forest', name: 'Forest', category: 'Modern', bg: 'bg-green-50', contentBg: 'bg-white/80 border border-green-100', text: 'text-green-900', button: 'bg-green-700 hover:bg-green-800 text-white', preview: '#F0FDF4' },
  { id: 'lemon', name: 'Lemonade', category: 'Vibrant', bg: 'bg-yellow-50', contentBg: 'bg-white/90 border border-yellow-200', text: 'text-yellow-900', button: 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg', preview: '#FEFCE8' },
] as const;

export const EFFECT_CATEGORIES = ['All', 'Fun', 'Subtle'] as const;
export const EFFECT_OPTIONS = [
  { id: 'none', name: 'Clean', category: 'All', icon: '🚫' },
  { id: 'confetti', name: 'Party', category: 'Fun', icon: '🎉' },
  { id: 'sparkles', name: 'Sparkle', category: 'Subtle', icon: '✨' },
  { id: 'mesh', name: 'Rainbow', category: 'Subtle', icon: '🌈' },
  { id: 'hearts', name: 'Love', category: 'Fun', icon: '💖' },
  { id: 'snow', name: 'Snow', category: 'Fun', icon: '❄️' },
  { id: 'fire', name: 'Fire', category: 'Fun', icon: '🔥' },
  { id: 'balloons', name: 'Balloons', category: 'Fun', icon: '🎈' },
  { id: 'music', name: 'Music', category: 'Fun', icon: '🎵' },
  { id: 'flowers', name: 'Bloom', category: 'Subtle', icon: '🌸' },
  { id: 'stars', name: 'Stars', category: 'Subtle', icon: '⭐' },
  { id: 'ghosts', name: 'Spooky', category: 'Fun', icon: '👻' },
] as const;

export const IMAGE_CATEGORIES = [
  { id: 'featured', label: 'Featured', icon: LayoutGrid },
  { id: 'tech', label: 'Tech', icon: Monitor },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'party', label: 'Party', icon: PartyPopper },
  { id: 'food', label: 'Food & Drinks', icon: Coffee },
  { id: 'outdoors', label: 'Outdoors', icon: Trees },
] as const;

export const MOCK_IMAGES = {
  featured: [
    { id: 101, url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2669&auto=format&fit=crop', title: 'Celebration' },
    { id: 102, url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop', title: 'Event Crowd' },
  ],
  tech: [
    { id: 201, url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop', title: 'Coding' },
    { id: 202, url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', title: 'Tech Office' }
  ],
  business: [{ id: 301, url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2670&auto=format&fit=crop', title: 'Meeting' }],
  party: [{ id: 401, url: 'https://images.unsplash.com/photo-1530103862676-de3c9fa59af7?q=80&w=2670&auto=format&fit=crop', title: 'Balloons' }],
  food: [{ id: 501, url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop', title: 'Feast' }],
  outdoors: [{ id: 601, url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=2673&auto=format&fit=crop', title: 'Mountain' }],
} as const;

export const LOCATION_RESULTS = [
  { id: 1, name: 'San Francisco, CA', address: 'United States' },
  { id: 2, name: 'Moscone Center', address: '747 Howard St, San Francisco, CA 94103' },
  { id: 3, name: 'Golden Gate Park', address: 'San Francisco, CA' },
] as const;

export const TIMEZONES = [
  // 中国及周边地区 (GMT+8)
  { id: 'Asia/Shanghai', city: 'Shanghai', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Shanghai', city: 'Beijing', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Shanghai', city: 'Hong Kong', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Shanghai', city: 'Taipei', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Shanghai', city: 'Singapore', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Asia/Manila', city: 'Manila', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  
  // 日本、韩国 (GMT+9)
  { id: 'Asia/Tokyo', city: 'Tokyo', offset: 'GMT+09:00', currentTime: '9:00 PM' },
  { id: 'Asia/Seoul', city: 'Seoul', offset: 'GMT+09:00', currentTime: '9:00 PM' },
  
  // 东南亚其他地区
  { id: 'Asia/Bangkok', city: 'Bangkok', offset: 'GMT+07:00', currentTime: '7:00 PM' },
  { id: 'Asia/Jakarta', city: 'Jakarta', offset: 'GMT+07:00', currentTime: '7:00 PM' },
  { id: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', offset: 'GMT+07:00', currentTime: '7:00 PM' },
  { id: 'Asia/Dhaka', city: 'Dhaka', offset: 'GMT+06:00', currentTime: '6:00 PM' },
  { id: 'Asia/Kolkata', city: 'Mumbai', offset: 'GMT+05:30', currentTime: '5:30 PM' },
  { id: 'Asia/Kolkata', city: 'New Delhi', offset: 'GMT+05:30', currentTime: '5:30 PM' },
  { id: 'Asia/Dubai', city: 'Dubai', offset: 'GMT+04:00', currentTime: '4:00 PM' },
  
  // 欧洲 (GMT+0 到 GMT+3)
  { id: 'Europe/London', city: 'London', offset: 'GMT+00:00', currentTime: '12:00 PM' },
  { id: 'Europe/Dublin', city: 'Dublin', offset: 'GMT+00:00', currentTime: '12:00 PM' },
  { id: 'Europe/Paris', city: 'Paris', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Berlin', city: 'Berlin', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Rome', city: 'Rome', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Madrid', city: 'Madrid', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Amsterdam', city: 'Amsterdam', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Brussels', city: 'Brussels', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Zurich', city: 'Zurich', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Stockholm', city: 'Stockholm', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Vienna', city: 'Vienna', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Warsaw', city: 'Warsaw', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Prague', city: 'Prague', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Europe/Athens', city: 'Athens', offset: 'GMT+02:00', currentTime: '2:00 PM' },
  { id: 'Europe/Helsinki', city: 'Helsinki', offset: 'GMT+02:00', currentTime: '2:00 PM' },
  { id: 'Europe/Istanbul', city: 'Istanbul', offset: 'GMT+03:00', currentTime: '3:00 PM' },
  { id: 'Europe/Moscow', city: 'Moscow', offset: 'GMT+03:00', currentTime: '3:00 PM' },
  
  // 美国 (GMT-5 到 GMT-8)
  { id: 'America/New_York', city: 'New York', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Chicago', city: 'Chicago', offset: 'GMT-06:00', currentTime: '6:00 AM' },
  { id: 'America/Denver', city: 'Denver', offset: 'GMT-07:00', currentTime: '5:00 AM' },
  { id: 'America/Los_Angeles', city: 'Los Angeles', offset: 'GMT-08:00', currentTime: '4:00 AM' },
  { id: 'America/Los_Angeles', city: 'San Francisco', offset: 'GMT-08:00', currentTime: '4:00 AM' },
  { id: 'America/Seattle', city: 'Seattle', offset: 'GMT-08:00', currentTime: '4:00 AM' },
  { id: 'America/Phoenix', city: 'Phoenix', offset: 'GMT-07:00', currentTime: '5:00 AM' },
  { id: 'America/Atlanta', city: 'Atlanta', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Miami', city: 'Miami', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Detroit', city: 'Detroit', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Boston', city: 'Boston', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Washington', city: 'Washington DC', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  
  // 加拿大
  { id: 'America/Toronto', city: 'Toronto', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Vancouver', city: 'Vancouver', offset: 'GMT-08:00', currentTime: '4:00 AM' },
  { id: 'America/Montreal', city: 'Montreal', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  
  // 中南美洲
  { id: 'America/Mexico_City', city: 'Mexico City', offset: 'GMT-06:00', currentTime: '6:00 AM' },
  { id: 'America/Sao_Paulo', city: 'São Paulo', offset: 'GMT-03:00', currentTime: '9:00 AM' },
  { id: 'America/Buenos_Aires', city: 'Buenos Aires', offset: 'GMT-03:00', currentTime: '9:00 AM' },
  { id: 'America/Lima', city: 'Lima', offset: 'GMT-05:00', currentTime: '7:00 AM' },
  { id: 'America/Santiago', city: 'Santiago', offset: 'GMT-03:00', currentTime: '9:00 AM' },
  
  // 澳洲及大洋洲
  { id: 'Australia/Sydney', city: 'Sydney', offset: 'GMT+10:00', currentTime: '10:00 PM' },
  { id: 'Australia/Melbourne', city: 'Melbourne', offset: 'GMT+10:00', currentTime: '10:00 PM' },
  { id: 'Australia/Brisbane', city: 'Brisbane', offset: 'GMT+10:00', currentTime: '10:00 PM' },
  { id: 'Australia/Perth', city: 'Perth', offset: 'GMT+08:00', currentTime: '8:00 PM' },
  { id: 'Pacific/Auckland', city: 'Auckland', offset: 'GMT+12:00', currentTime: '12:00 AM' },
  
  // 非洲
  { id: 'Africa/Cairo', city: 'Cairo', offset: 'GMT+02:00', currentTime: '2:00 PM' },
  { id: 'Africa/Johannesburg', city: 'Johannesburg', offset: 'GMT+02:00', currentTime: '2:00 PM' },
  { id: 'Africa/Lagos', city: 'Lagos', offset: 'GMT+01:00', currentTime: '1:00 PM' },
  { id: 'Africa/Nairobi', city: 'Nairobi', offset: 'GMT+03:00', currentTime: '3:00 PM' },
] as const;

export const HOST_PROFILES = [
  { id: 'me', name: 'Yan (You)', type: 'personal', icon: UserCircle },
  { id: 'org1', name: 'HereNow Team', type: 'organization', icon: Building2 }
] as const;

