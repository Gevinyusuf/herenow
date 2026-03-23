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
  isSelected?: boolean;
  onClick?: () => void;
}

export default function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <div
      onClick={onClick}
      className={`group p-4 bg-white/60 hover:bg-white border rounded-2xl hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer flex items-center gap-4 ${
        isSelected ? 'border-[#FF6B3D] shadow-lg shadow-orange-500/20' : 'border-white/60'
      }`}
    >
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

