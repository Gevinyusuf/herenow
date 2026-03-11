'use client';

import { createClient } from '@/lib/supabase/client';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('未登录，请先登录');
  }

  const url = `${API_GATEWAY_URL}${endpoint}`;
  console.log(`🔗 请求 API: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '请求失败' }));
    console.error(`❌ API 请求失败: ${response.status} ${response.statusText}`, error);
    throw new Error(error.detail || error.message || `请求失败: ${response.status}`);
  }

  return response;
}

export interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  is_liked: boolean;
  is_owner: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string;
  content: string;
  likes_count: number;
  created_at: string;
  is_liked: boolean;
  is_owner: boolean;
}

export interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'banned';
  nickname: string;
  bio: string;
  joined_at: string;
}

export interface Invite {
  id: string;
  community_id: string;
  inviter_id: string;
  inviter: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  invite_type: 'link' | 'email';
  invite_code: string;
  invite_email: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  members_count: number;
  events_count: number;
  settings: Record<string, any>;
  created_at: string;
}

export async function getCommunityPosts(
  communityId: string,
  sort: string = 'recent',
  page: number = 1,
  limit: number = 20
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts?sort=${sort}&page=${page}&limit=${limit}`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ getCommunityPosts 失败:', error);
    throw error;
  }
}

export async function createCommunityPost(
  communityId: string,
  content: string,
  images: string[] = []
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts`,
      {
        method: 'POST',
        body: JSON.stringify({ content, images }),
      }
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ createCommunityPost 失败:', error);
    throw error;
  }
}

export async function getCommunityPostDetail(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ getCommunityPostDetail 失败:', error);
    throw error;
  }
}

export async function updateCommunityPost(
  communityId: string,
  postId: string,
  data: { content?: string; images?: string[] }
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ updateCommunityPost 失败:', error);
    throw error;
  }
}

export async function deleteCommunityPost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ deleteCommunityPost 失败:', error);
    throw error;
  }
}

export async function createPostComment(
  communityId: string,
  postId: string,
  content: string
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ createPostComment 失败:', error);
    throw error;
  }
}

export async function likePost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/like`,
      { method: 'POST' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ likePost 失败:', error);
    throw error;
  }
}

export async function unlikePost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/like`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ unlikePost 失败:', error);
    throw error;
  }
}

export async function pinPost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/pin`,
      { method: 'POST' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ pinPost 失败:', error);
    throw error;
  }
}

export async function unpinPost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/pin`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ unpinPost 失败:', error);
    throw error;
  }
}

export async function lockPost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/lock`,
      { method: 'POST' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ lockPost 失败:', error);
    throw error;
  }
}

export async function unlockPost(communityId: string, postId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/posts/${postId}/lock`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ unlockPost 失败:', error);
    throw error;
  }
}

export async function getCommunityMembers(
  communityId: string,
  role?: string,
  status?: string,
  page: number = 1,
  limit: number = 50
) {
  try {
    let url = `/api/v1/communities/${communityId}/members?page=${page}&limit=${limit}`;
    if (role) url += `&role=${role}`;
    if (status) url += `&status=${status}`;
    
    const response = await authenticatedFetch(url);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ getCommunityMembers 失败:', error);
    throw error;
  }
}

export async function updateMemberRole(
  communityId: string,
  userId: string,
  role: 'member' | 'admin' | 'owner'
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/members/${userId}/role`,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ updateMemberRole 失败:', error);
    throw error;
  }
}

export async function removeMember(communityId: string, userId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/members/${userId}`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ removeMember 失败:', error);
    throw error;
  }
}

export async function transferOwnership(communityId: string, newOwnerId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/transfer-ownership`,
      {
        method: 'POST',
        body: JSON.stringify({ new_owner_id: newOwnerId }),
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ transferOwnership 失败:', error);
    throw error;
  }
}

export async function searchCommunities(
  query: string = '',
  location: string = '',
  sort: string = 'members',
  page: number = 1,
  limit: number = 20
) {
  try {
    const params = new URLSearchParams({
      q: query,
      location,
      sort,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    const response = await authenticatedFetch(
      `/api/v1/communities/search?${params.toString()}`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ searchCommunities 失败:', error);
    throw error;
  }
}

export async function createInviteLink(
  communityId: string,
  expiresInDays: number = 7
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/invites/link`,
      {
        method: 'POST',
        body: JSON.stringify({ expires_in_days: expiresInDays }),
      }
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ createInviteLink 失败:', error);
    throw error;
  }
}

export async function sendEmailInvites(communityId: string, emails: string[]) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/invites/email`,
      {
        method: 'POST',
        body: JSON.stringify({ emails }),
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ sendEmailInvites 失败:', error);
    throw error;
  }
}

export async function getCommunityInvites(
  communityId: string,
  status: string = 'pending',
  page: number = 1,
  limit: number = 50
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/invites?status=${status}&page=${page}&limit=${limit}`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ getCommunityInvites 失败:', error);
    throw error;
  }
}

export async function joinByInvite(inviteCode: string) {
  try {
    const response = await authenticatedFetch(
      '/api/v1/communities/join-by-invite',
      {
        method: 'POST',
        body: JSON.stringify({ invite_code: inviteCode }),
      }
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ joinByInvite 失败:', error);
    throw error;
  }
}

export async function getInviteInfo(inviteCode: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/invites/${inviteCode}/info`
    );
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('❌ getInviteInfo 失败:', error);
    throw error;
  }
}

export async function revokeInvite(communityId: string, inviteId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/invites/${inviteId}`,
      { method: 'DELETE' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ revokeInvite 失败:', error);
    throw error;
  }
}

export async function updateMemberProfile(
  communityId: string,
  profileData: { nickname?: string; bio?: string; muted?: boolean }
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/communities/${communityId}/profile`,
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ updateMemberProfile 失败:', error);
    throw error;
  }
}
