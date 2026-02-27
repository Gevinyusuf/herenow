'use client';

import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    count: string;
    icon: LucideIcon;
    color: string;
    bg: string;
  };
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const Icon = category.icon;
  
  return (
    <div className="group p-4 bg-white/60 hover:bg-white border border-white/60 rounded-2xl hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${category.bg} ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="font-brand font-bold text-slate-900 group-hover:text-[#FF6B3D] transition-colors">
          {category.name}
        </h3>
        <p className="text-slate-500 text-sm">{category.count}</p>
      </div>
    </div>
  );
}

