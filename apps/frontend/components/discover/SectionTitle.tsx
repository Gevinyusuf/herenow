'use client';

import { ChevronRight } from 'lucide-react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: string;
}

export default function SectionTitle({ title, subtitle, action }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="font-brand text-2xl font-bold text-slate-900 mb-1">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
      </div>
      {action && (
        <button className="text-sm font-semibold text-slate-500 hover:text-[#FF6B3D] flex items-center gap-1 transition-colors">
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

