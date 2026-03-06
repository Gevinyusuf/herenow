'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import useSWR from 'swr';

interface EntitlementsData {
  user_id: string;
  plan_name: string | null;
  plan_id: string | null;
  can_access_community: boolean;
  can_access_discover: boolean;
  quota_ai_limit: number | null;
  quota_ai_used: number;
  quota_ai_remaining: number;
}

export function useEntitlements() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  
  // 使用 ref 防止 React StrictMode 导致的重复请求
  const hasInitializedRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // 获取当前用户（优化：使用 Supabase 的 getSession 而不是 getUser，减少请求）
  useEffect(() => {
    // 防止重复初始化（React StrictMode 会导致 useEffect 执行两次）
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // 优化：使用 getSession 而不是 getUser，减少一次请求
    // getSession 从本地存储读取，getUser 会发起网络请求
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // 如果 session 不存在，再尝试 getUser（可能是首次登录）
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      }
    };

    initUser();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      // 注意：不在清理函数中重置 hasInitializedRef，避免 React StrictMode 导致的重复请求
    };
  }, [supabase]); // 移除 user 依赖，避免循环更新

  const fetcher = async (): Promise<EntitlementsData | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('v_user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] as EntitlementsData : null;
  };

  // 使用 SWR 缓存，避免重复请求
  // 优化配置：增加去重间隔，避免短时间内重复请求
  const { data, isLoading, mutate } = useSWR(
    user ? ['entitlements', user.id] : null, 
    fetcher,
    {
      dedupingInterval: 30000, // 30秒去重（权限数据变化频率低）
      revalidateOnFocus: false, // 关闭聚焦时重新验证（权限数据不需要）
      revalidateIfStale: false, // 关闭自动重新验证
      errorRetryCount: 2, // 错误重试次数
      errorRetryInterval: 5000, // 错误重试间隔
    }
  );

  return {
    // 基础信息
    planName: data?.plan_name,

    // 功能开关
    canAccessCommunity: data?.can_access_community,

    canAccessDiscover: data?.can_access_discover,

    // 额度信息
    aiRemaining: data?.quota_ai_remaining ?? 0,

    aiLimit: data?.quota_ai_limit,

    isUnlimited: data?.quota_ai_limit === -1,

    isLoading,

    // SWR mutate 函数，用于手动刷新数据
    mutate,
  };
}

