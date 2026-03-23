'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import useSWR from 'swr';

type UserIdentity = 'guest' | 'lite' | 'full';

interface EntitlementsData {
  user_id: string;
  plan_name: string | null;
  plan_id: string | null;
  user_identity: UserIdentity;
  can_access_community: boolean;
  can_access_discover: boolean;
  can_create_events: boolean;
  can_use_ai: boolean;
  quota_ai_limit: number | null;
  quota_ai_used: number;
  quota_ai_remaining: number;
}

export function useEntitlements() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  const hasInitializedRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [supabase]);

  const fetcher = async (): Promise<EntitlementsData | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('v_user_entitlements')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return data[0] as EntitlementsData;
    }
    return null;
  };

  const { data, isLoading, mutate } = useSWR(
    user ? ['entitlements', user.id] : null,
    fetcher,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  );

  return {
    user,
    planName: data?.plan_name,
    userIdentity: (data?.user_identity as UserIdentity) || (user ? 'full' : 'guest'),
    canAccessCommunity: data?.can_access_community ?? false,
    canAccessDiscover: data?.can_access_discover ?? false,
    canCreateEvents: data?.can_create_events ?? true,
    canUseAI: data?.can_use_ai ?? false,
    aiRemaining: data?.quota_ai_remaining ?? 0,
    aiLimit: data?.quota_ai_limit,
    isUnlimited: data?.quota_ai_limit === -1,
    isLoading,
    mutate,

    isGuest: !user || data?.user_identity === 'guest',
    isLite: data?.user_identity === 'lite',
    isFull: data?.user_identity === 'full',
    isLoggedIn: !!user,
  };
}

export type { UserIdentity, EntitlementsData };
