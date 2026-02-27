'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pin, Trash2, Clock, MapPin, Settings, Eye } from 'lucide-react';
import { getEvent } from '@/lib/api/client';

interface EventData {
  id: number | string;
  title: string;
  date: string;
  time: string;
  location: string;
  imageColor: string;
  category: string;
  isPinned?: boolean;
  registrationCount?: number; // 报名人数
  coverImageUrl?: string | null; // 活动封面图片
}

interface EventCardProps {
  data: EventData;
  isOwner?: boolean;
  onPin?: () => void;
  onDelete?: () => void;
}

export default function EventCard({ 
  data, 
  isOwner = false,
  onPin, 
  onDelete
}: EventCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasActions = onPin || onDelete;

  const handleManage = () => {
    setShowMenu(false);
    router.push(`/manager/event?id=${data.id}`);
  };

  const handleView = () => {
    setShowMenu(false);
    router.push(`/event-detail?id=${data.id}`);
  };

  // 处理卡片点击，跳转到详情页
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果点击的是菜单按钮或菜单内容，不触发跳转
    if (
      menuRef.current?.contains(e.target as Node) ||
      (e.target as HTMLElement).closest('button[data-menu-button]')
    ) {
      return;
    }
    handleView();
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-white rounded-3xl p-3 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
    >
      
      {/* 右上角置顶标识 */}
      {data.isPinned && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center z-10 text-[#FF6B3D]">
          <Pin size={14} fill="currentColor" />
        </div>
      )}

      <div className={`h-48 rounded-2xl relative overflow-hidden ${
        data.coverImageUrl 
          ? '' 
          : `bg-gradient-to-br ${data.imageColor}`
      }`}>
        {/* 活动封面图片 */}
        {data.coverImageUrl ? (
          <>
            <img 
              src={data.coverImageUrl} 
              alt={data.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // 如果图片加载失败，隐藏图片，显示渐变背景
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.classList.contains('bg-gradient-to-br')) {
                  parent.className = `h-48 rounded-2xl relative overflow-hidden bg-gradient-to-br ${data.imageColor}`;
                }
              }}
            />
            {/* 图片遮罩层，确保文字可读性 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          </>
        ) : null}
        
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm z-10">
          <span className="text-xs font-bold text-slate-900 tracking-wider font-brand">{data.date}</span>
        </div>
        
        {/* 菜单按钮 - 在图片右上角 */}
        {hasActions ? (
          <div className="absolute top-3 right-3 z-10">
            <button 
              data-menu-button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className={`p-1.5 rounded-full bg-white/90 backdrop-blur-md transition-all ${showMenu ? 'bg-white text-slate-900 opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:bg-white hover:text-[#FF6B3D] shadow-sm'}`}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        ) : null}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      
      {/* 下拉菜单 - 移到图片容器外部，定位在按钮下方 */}
      {hasActions && showMenu && (
        <div className="absolute top-[56px] right-6 z-50" ref={menuRef} onClick={(e) => e.stopPropagation()} data-menu-content>
          <div className="w-40 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-1">
                <button 
                    onClick={handleView}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                >
                    <Eye size={14} />
                    <span>View</span>
                </button>
                {isOwner && (
                  <>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                        onClick={handleManage}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                    >
                        <Settings size={14} />
                        <span>Manage</span>
                    </button>
                  </>
                )}
                <div className="h-px bg-slate-100 my-1"></div>
                <button 
                    onClick={() => { onPin && onPin(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors text-left"
                >
                    <Pin size={14} className={data.isPinned ? "fill-current" : ""} />
                    <span>{data.isPinned ? 'Unpin' : 'Pin to top'}</span>
                </button>
                {onDelete && (
                  <>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-left"
                    >
                        <Trash2 size={14} />
                        <span>Delete</span>
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-4 pb-2 px-1">
        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 font-brand group-hover:text-[#FF6B3D] transition-colors">
          {data.title}
        </h3>

        <div className="flex flex-col gap-2 text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            {data.time}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            {data.location}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex -space-x-2">
            {(() => {
              const count = data.registrationCount || 0;
              const maxAvatars = 3; // 最多显示3个头像
              const avatars = [];
              
              // 显示前几个头像（最多3个）
              for (let i = 0; i < Math.min(count, maxAvatars); i++) {
                avatars.push(
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"
                    style={{
                      backgroundColor: `hsl(${(i * 60) % 360}, 70%, 80%)`
                    }}
                  />
                );
              }
              
              // 如果人数超过3个，显示剩余人数
              if (count > maxAvatars) {
                avatars.push(
                  <div 
                    key="more" 
                    className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500"
                  >
                    +{count - maxAvatars}
                  </div>
                );
              }
              
              // 如果没有人，显示占位符
              if (count === 0) {
                return (
                  <span className="text-xs text-slate-400 font-medium">No registrations yet</span>
                );
              }
              
              return avatars;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

