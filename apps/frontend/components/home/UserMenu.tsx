'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCircle, Settings, LogOut, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useEntitlements } from '@/hooks/useEntitlements';

interface UserMenuProps {
  onViewChange?: (view: string) => void;
  onSignOut?: () => void;
}

export default function UserMenu({ onViewChange, onSignOut }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { planName } = useEntitlements();

  // 检查用户登录状态
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      // 重置头像错误状态
      setAvatarError(false);
      
      // 调试：打印用户元数据，帮助排查头像问题
      if (session?.user) {
        console.log('🔍 User metadata:', session.user.user_metadata);
        console.log('📸 Avatar URL (picture):', session.user.user_metadata?.picture);
        console.log('📸 Avatar URL (avatar_url):', session.user.user_metadata?.avatar_url);
      }
    };

    checkUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // 重置头像错误状态
      setAvatarError(false);
      
      // 调试：打印用户元数据，帮助排查头像问题
      if (session?.user) {
        console.log('🔍 User metadata (onAuthStateChange):', session.user.user_metadata);
        console.log('📸 Avatar URL (picture):', session.user.user_metadata?.picture);
        console.log('📸 Avatar URL (avatar_url):', session.user.user_metadata?.avatar_url);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await supabase.auth.signOut();
    if (onSignOut) {
      onSignOut();
    }
    // 刷新页面或重定向到首页
    router.refresh();
  };

  const handleLogin = () => {
    setIsOpen(false);
    // 跳转到登录页面或打开登录模态框
    // 根据项目实际情况调整路径
    router.push('/');
  };

  // 获取用户头像 URL（优先使用 picture，这是 Google OAuth 的标准字段）
  const getAvatarUrl = () => {
    if (!user) return null;
    // Google OAuth 使用 'picture' 字段，其他可能使用 'avatar_url'
    return user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
  };

  // 获取用户头像首字母或使用默认头像
  const getAvatarInitial = () => {
    if (!user) return '?';
    const email = user.email || '';
    return email.charAt(0).toUpperCase();
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  // 处理头像图片加载错误
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('❌ Avatar image failed to load:', getAvatarUrl());
    console.error('Error event:', e);
    setAvatarError(true);
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full border-2 border-[#8B5CF6] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 统一显示用户菜单按钮，点击后根据登录状态显示不同内容
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-[#8B5CF6] hover:opacity-80 transition-all active:scale-95 relative"
      >
        {user ? (
          getAvatarUrl() && !avatarError ? (
            <img
              src={getAvatarUrl()!}
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
              onError={handleAvatarError}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8E6B] flex items-center justify-center text-white font-brand text-lg font-bold">
              {getAvatarInitial()}
            </div>
          )
        ) : (
          <UserCircle className="w-6 h-6" />
        )}
        {planName && planName.toLowerCase().includes('pro') && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 z-[100] animate-in fade-in zoom-in-95 text-slate-800">
          {user ? (
            // 已登录状态：显示用户信息和菜单
            <>
              <div className="p-3 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-3">
                  {getAvatarUrl() && !avatarError ? (
                    <img 
                      src={getAvatarUrl()!} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF8E6B] flex items-center justify-center text-white font-brand text-lg font-bold">
                      {getAvatarInitial()}
                    </div>
                  )}
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm truncate">{getUserDisplayName()}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
              </div>
              {onViewChange && (
                <>
                  <button 
                    onClick={() => { onViewChange('settings:profile'); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-slate-400" /> View Profile
                  </button>
                  <button 
                    onClick={() => { onViewChange('settings:account'); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </button>
                </>
              )}
              <Link 
                href="/setting"
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-700 flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Setting
              </Link>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            // 未登录状态：显示 Login In 按钮
            <div className="p-4">
              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-[#FF6B3D] text-white hover:bg-[#FF855F] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <UserCircle className="w-4 h-4" />
                Login In
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

