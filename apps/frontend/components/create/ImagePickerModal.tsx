'use client';

import { X, Sparkles, Bot, RefreshCw } from 'lucide-react';
import { IMAGE_CATEGORIES, MOCK_IMAGES } from './constants';

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'gallery' | 'ai';
  onTabChange: (tab: 'gallery' | 'ai') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  aiPrompt: string;
  onAiPromptChange: (prompt: string) => void;
  isGenerating: boolean;
  generatedImage: string | null;
  onGenerate: () => void;
  onSelectImage: (url: string) => void;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  aiPrompt,
  onAiPromptChange,
  isGenerating,
  generatedImage,
  onGenerate,
  onSelectImage,
}: ImagePickerModalProps) {
  if (!isOpen) return null;
  
  const currentImages = MOCK_IMAGES[selectedCategory as keyof typeof MOCK_IMAGES] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/50 ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center space-x-6">
            <h2 className="text-2xl font-bold text-slate-900 font-brand">Cover Image</h2>
            <div className="flex bg-slate-100/80 rounded-xl p-1">
              <button 
                onClick={() => onTabChange('gallery')} 
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'gallery' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Gallery
              </button>
              <button 
                onClick={() => onTabChange('ai')} 
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${activeTab === 'ai' ? 'bg-white text-[#FF6B3D] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Sparkles className="w-3 h-3" />AI Studio
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col bg-white/50">
          {activeTab === 'gallery' ? (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-64 overflow-y-auto py-6 px-4 space-y-1 bg-slate-50/50 border-r border-slate-100">
                <div className="text-xs font-bold text-slate-400 px-4 py-2 uppercase tracking-wider mb-2">Collections</div>
                {IMAGE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => onCategoryChange(cat.id)} 
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${selectedCategory === cat.id ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700'}`}
                    >
                      <Icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-[#FF6B3D]' : 'text-slate-400'}`} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {currentImages.map((img) => (
                    <div 
                      key={img.id} 
                      onClick={() => onSelectImage(img.url)} 
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-slate-100 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white font-bold text-sm">{img.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex bg-gradient-to-b from-white to-slate-50">
              {/* 左侧：生成的图片 */}
              <div className="flex-1 p-8 flex items-center justify-center bg-slate-50/50 border-r border-slate-100">
                {generatedImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95">
                    <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 border-4 border-white">
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => onSelectImage(generatedImage)} 
                      className="px-8 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      Use This Image
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-[#FF6B3D] border border-indigo-100 shadow-sm">
                      <Bot className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xl mb-2 font-brand">AI Cover Artist</h3>
                      <p className="text-slate-500 text-sm">Generated image will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：文本输入区域 */}
              <div className="w-96 p-8 flex flex-col bg-white border-l border-slate-100">
                <div className="mb-6">
                  <h3 className="font-bold text-slate-900 text-xl mb-2 font-brand">Describe Your Vision</h3>
                  <p className="text-sm text-slate-500">Tell us what kind of cover image you want</p>
                </div>
                
                <div className="flex-1 flex flex-col">
                  <div className="relative group flex-1 mb-4">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-200 to-blue-200 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                    <textarea 
                      placeholder="e.g. abstract geometric shapes, soft pastel colors, frosted glass texture, modern tech event, vibrant networking atmosphere..." 
                      className="relative w-full h-full p-4 rounded-2xl border border-slate-200 bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 outline-none resize-none text-sm text-slate-800 placeholder-slate-300 shadow-sm transition-all" 
                      value={aiPrompt} 
                      onChange={(e) => onAiPromptChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          if (!isGenerating && aiPrompt) {
                            onGenerate();
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <button 
                    onClick={onGenerate} 
                    disabled={isGenerating || !aiPrompt.trim()} 
                    className="w-full px-6 py-3 bg-[#FF6B3D] hover:bg-[#E05D32] text-white rounded-xl font-bold tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Generate Image
                      </>
                    )}
                  </button>
                  
                  {isGenerating && (
                    <p className="mt-3 text-xs text-slate-400 text-center">
                      This may take a few moments...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

