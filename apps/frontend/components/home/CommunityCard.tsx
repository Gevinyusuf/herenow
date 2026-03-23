'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pin, Trash2, LogOut, Users, Settings, Eye } from 'lucide-react';

interface CommunityData {
  id: number;
  name: string;
  members: number;
  avatar: string;
  color: string;
  role?: string;
  isPinned: boolean;
  createdAt?: string;
  joinedAt?: string;
  newPosts?: number;
}

interface CommunityCardProps {
  data: CommunityData;
  type: 'mine' | 'joined';
  onPin?: () => void;
  onDelete?: () => void;
  getRelativeTime: (dateString: string) => string;
  formatNumber: (num: number) => string;
}

export default function CommunityCard({ 
  data, 
  type, 
  onPin, 
  onDelete,
  getRelativeTime,
  formatNumber
}: CommunityCardProps) {
  const router = useRouter();
  const isOwner = type === 'mine';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const hasActions = onPin !== undefined || onDelete !== undefined;

  const handleManage = () => {
    setShowMenu(false);
    router.push(`/manager/community?id=${data.id}`);
  };

  const handleView = () => {
    setShowMenu(false);
    router.push(`/community-detail?id=${data.id}`);
  };

  // Time display logic
  let timeDisplay: string | null = null;
  if (isOwner && data.createdAt) {
    timeDisplay = `Created ${getRelativeTime(data.createdAt)} ago`;
  } else if (!isOwner && data.joinedAt) {
    timeDisplay = `Joined ${getRelativeTime(data.joinedAt)} ago`;
  }

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
    <div className="group glass-card rounded-3xl p-6 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer border-transparent hover:border-orange-100 relative flex flex-col h-full">
      
      {/* 右上角置顶标识 */}
      {data.isPinned && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center z-10 text-[#FF6B3D]">
           <Pin size={14} fill="currentColor" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl ${data.color} flex items-center justify-center text-2xl shadow-inner`}>
          {data.avatar}
        </div>
        
        {/* 菜单按钮 & 下拉框 */}
        {hasActions ? (
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2 rounded-full transition-all ${showMenu ? 'bg-slate-100 text-slate-900 opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            >
              <MoreHorizontal size={20} />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-20 overflow-hidden">
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
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                        onClick={() => { onDelete && onDelete(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-left"
                    >
                        {isOwner ? <Trash2 size={14} /> : <LogOut size={14} />}
                        <span>{isOwner ? 'Delete' : 'Leave'}</span>
                    </button>
                </div>
              </div>
            )}
          </div>
        ) : (
           <button className="opacity-0 pointer-events-none p-2">
             <MoreHorizontal size={20} />
           </button>
        )}
      </div>

      <h3 className="font-brand text-xl font-bold text-slate-900 mb-1 truncate pr-2">
        {data.name}
      </h3>
      
      <div className="mt-auto pt-4 flex flex-col gap-2">
         {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
            <Users size={14} className={isOwner ? "text-[#FF6B3D]" : "text-slate-400"} />
            <span>{formatNumber(data.members)} members</span>
            </div>
            
             {/* Time Display */}
            {timeDisplay && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <span>{timeDisplay}</span>
                </div>
            )}
        </div>

        {/* Status Row */}
         <div className="flex items-center gap-2">
            {isOwner ? (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">Owner</span>
            ) : (
            data.newPosts !== undefined && data.newPosts > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                New Posts
                </span>
            )
            )}
        </div>
      </div>
      
      <div className="w-0 group-hover:w-full h-1 bg-[#FF6B3D] mt-6 rounded-full transition-all duration-500 opacity-80 absolute bottom-0 left-0 right-0 mx-6 mb-6" style={{position: 'relative', margin: '24px 0 0 0'}} />
    </div>
  );
}

