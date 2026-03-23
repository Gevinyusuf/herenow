import { 
  Zap, 
  Coffee, 
  Cpu, 
  Palette, 
  Leaf, 
  Activity
} from 'lucide-react';

export const CATEGORIES = [
  { id: 1, name: 'Tech & AI', count: '12.5K Events', icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, name: 'Food & Drink', count: '8.2K Events', icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 3, name: 'Arts & Culture', count: '5.4K Events', icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 4, name: 'Wellness', count: '3.2K Events', icon: Leaf, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 5, name: 'Fitness', count: '4.1K Events', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 6, name: 'Crypto', count: '1.8K Events', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

export const POPULAR_EVENTS = [
  {
    id: 1,
    title: 'Elevé Matcha Social',
    date: 'Tomorrow, 6:30 PM',
    location: '568 S Coppell Rd',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    organizer: 'Matcha Club'
  },
  {
    id: 2,
    title: 'Dallas Community Meet-up',
    date: 'Thu, Dec 11, 4:30 PM',
    location: 'ServiceNow HQ',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    organizer: 'PSC'
  },
  {
    id: 3,
    title: 'Sunset Rooftop Yoga',
    date: 'Sat, Dec 14, 9:00 AM',
    location: 'Skyline Deck',
    image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
    organizer: 'Zen Flow'
  }
];

export const FEATURED_COMMUNITIES = [
  {
    id: 1,
    name: 'Reading Rhythms',
    description: 'Not a book club. A reading party. Read with friends to live music.',
    logo: '📚',
    location: 'Global'
  },
  {
    id: 2,
    name: 'Build Club',
    description: 'The best place in the world to learn AI. Curated with love.',
    logo: '🚀',
    location: 'Sydney'
  },
  {
    id: 3,
    name: 'Design Buddies',
    description: 'Events for designers and all creatives across SF, online, and beyond.',
    logo: '🎨',
    location: 'San Francisco'
  },
  {
    id: 4,
    name: 'The AI Collective',
    description: 'The world\'s largest AI community: 100,000+ pioneers.',
    logo: '🤖',
    location: 'Global'
  }
];

export const CITIES = {
  'North America': [
    { name: 'New York', events: '2.4K Events', icon: '🗽' },
    { name: 'San Francisco', events: '1.8K Events', icon: '🌉' },
    { name: 'Austin', events: '950 Events', icon: '🎸' },
    { name: 'Toronto', events: '840 Events', icon: '🍁' },
    { name: 'Los Angeles', events: '1.5K Events', icon: '🌴' },
  ],
  'Europe': [
    { name: 'London', events: '1.9K Events', icon: '💂' },
    { name: 'Berlin', events: '1.2K Events', icon: '🐻' },
    { name: 'Paris', events: '1.4K Events', icon: '🥐' },
    { name: 'Amsterdam', events: '890 Events', icon: '🌷' },
  ],
  'Asia & Pacific': [
    { name: 'Tokyo', events: '2.1K Events', icon: '🗼' },
    { name: 'Singapore', events: '1.1K Events', icon: '🦁' },
    { name: 'Seoul', events: '980 Events', icon: '🏮' },
    { name: 'Bangkok', events: '750 Events', icon: '🐘' },
  ],
  'South America': [
    { name: 'São Paulo', events: '1.3K Events', icon: '🌇' },
    { name: 'Buenos Aires', events: '920 Events', icon: '💃' },
    { name: 'Rio', events: '850 Events', icon: '🏖️' },
    { name: 'Bogotá', events: '640 Events', icon: '☕' },
  ],
  'Africa': [
    { name: 'Cape Town', events: '780 Events', icon: '⛰️' },
    { name: 'Lagos', events: '650 Events', icon: '🎵' },
    { name: 'Nairobi', events: '520 Events', icon: '🦒' },
    { name: 'Cairo', events: '940 Events', icon: '🐫' },
  ]
};

