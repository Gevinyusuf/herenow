'use client';

import { useRef } from 'react';
import { Palette, Wand2, Eye } from 'lucide-react';
import { THEME_CATEGORIES, THEME_OPTIONS, EFFECT_CATEGORIES, EFFECT_OPTIONS } from './constants';

interface Theme {
  id: string;
  name: string;
  category: string;
  bg: string;
  contentBg: string;
  text: string;
  button: string;
  preview: string;
}

interface DesignStudioProps {
  activeTab: 'theme' | 'effect' | null;
  onTabToggle: (tab: 'theme' | 'effect') => void;
  selectedTheme: Theme;
  onThemeSelect: (theme: Theme) => void;
  selectedEffect: string;
  onEffectSelect: (effect: string) => void;
  searchCategory: string;
  onSearchCategoryChange: (category: string) => void;
  panelRef: React.RefObject<HTMLDivElement>;
  onPreview: () => void;
}

export default function DesignStudio({
  activeTab,
  onTabToggle,
  selectedTheme,
  onThemeSelect,
  selectedEffect,
  onEffectSelect,
  searchCategory,
  onSearchCategoryChange,
  panelRef,
  onPreview,
}: DesignStudioProps) {
  return (
    <>
      <div className="fixed right-8 top-32 z-40 flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-white/60 p-2 flex flex-col gap-2">
          <button 
            onClick={() => onTabToggle('theme')} 
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'theme' ? 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`} 
            title="Theme"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onTabToggle('effect')} 
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === 'effect' ? 'bg-[#FF6B3D] text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`} 
            title="Effects"
          >
            <Wand2 className="w-5 h-5" />
          </button>
          <div className="h-px w-8 bg-slate-100 mx-auto"></div>
          <button 
            onClick={onPreview} 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all text-slate-400 hover:bg-slate-50 hover:text-[#FF6B3D]" 
            title="Preview"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {activeTab && (
        <div 
          ref={panelRef} 
          className="fixed right-28 top-32 w-80 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 z-40 flex flex-col animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden ring-1 ring-black/5 max-h-[600px]"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 capitalize font-brand text-lg">{activeTab}</h3>
          </div>
          <div className="p-5 bg-slate-50/50 flex-1 overflow-y-auto">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3">
              {(activeTab === 'theme' ? THEME_CATEGORIES : EFFECT_CATEGORIES).map(cat => (
                <button 
                  key={cat} 
                  onClick={() => onSearchCategoryChange(cat)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${searchCategory === cat ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-1">
              {activeTab === 'theme' ? (
                THEME_OPTIONS
                  .filter(t => searchCategory === 'All' || t.category === searchCategory)
                  .map(theme => (
                    <button 
                      key={theme.id} 
                      onClick={() => onThemeSelect(theme as Theme)} 
                      className={`relative p-1 rounded-2xl border transition-all text-left group overflow-hidden ${selectedTheme.id === theme.id ? 'border-[#FF6B3D] bg-white shadow-md' : 'border-transparent hover:bg-white hover:shadow-sm'}`}
                    >
                      <div 
                        className="h-20 rounded-xl w-full mb-2 border border-slate-100 overflow-hidden" 
                        style={{ background: theme.preview }}
                      ></div>
                      <div className="px-1 pb-1">
                        <div className={`text-xs font-bold ${selectedTheme.id === theme.id ? 'text-[#FF6B3D]' : 'text-slate-700'}`}>
                          {theme.name}
                        </div>
                      </div>
                    </button>
                  ))
              ) : (
                EFFECT_OPTIONS
                  .filter(e => searchCategory === 'All' || e.category === searchCategory)
                  .map(effect => (
                    <button 
                      key={effect.id} 
                      onClick={() => onEffectSelect(effect.id)} 
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${selectedEffect === effect.id ? 'border-[#FF6B3D] bg-white shadow-md text-[#FF6B3D]' : 'border-transparent bg-white hover:shadow-sm text-slate-600'}`}
                    >
                      <div className="text-3xl mb-2 filter drop-shadow-sm">{effect.icon}</div>
                      <span className="text-xs font-bold">{effect.name}</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

