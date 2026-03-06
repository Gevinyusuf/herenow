'use client';

import { createClient } from '@/lib/supabase/client';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';

/**
 * 获取认证 token
 */
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * 创建带认证的 fetch 请求
 */
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

/**
 * 获取首页数据
 */
export async function getHomeData() {
  try {
    const response = await authenticatedFetch('/api/v1/home/all');
    const result = await response.json();
    console.log('📦 API 原始响应:', result);
    
    // 后端返回格式: { success: true, data: { events: {...}, communities: {...} } }
    // 返回 data 字段的内容
    const data = result.data || result;
    console.log('✅ 提取后的数据:', data);
    return data;
  } catch (error) {
    console.error('❌ getHomeData 失败:', error);
    throw error;
  }
}

/**
 * 生成 AI 内容
 * @param type AI 功能类型: 'text_generation' | 'image_generation' | 'chat' | 'planning' | 'import'
 * @param prompt 用户输入的提示词
 * @param context 上下文信息（可选）
 * @param options 其他选项（可选）
 */
export async function generateAIContent(
  type: 'text_generation' | 'image_generation' | 'chat' | 'planning' | 'import',
  prompt: string,
  context?: Record<string, any>,
  options?: Record<string, any>
) {
  const response = await authenticatedFetch('/api/v1/ai/generate', {
    method: 'POST',
    body: JSON.stringify({
      type,
      prompt,
      context: context || null,
      options: options || null,
    }),
  });
  const result = await response.json();
  
  // 后端返回格式: { success: true, data: "...", message: "...", quota: {...} }
  if (!result.success) {
    throw new Error(result.message || 'AI 生成失败');
  }
  
  return result;
}

/**
 * 创建活动
 * 后端期望接收前端原始格式的数据（eventName, startDate, startTime 等）
 * 后端会自己转换为数据库格式
 */
export async function createEvent(eventData: any) {
  // 后端期望接收前端原始格式，不需要转换
  // 直接发送前端 EventData 格式
  
  // 调试：打印原始数据
  console.log('📋 原始 eventData:', eventData);
  console.log('📋 原始数据字段检查:', {
    eventName: eventData?.eventName,
    startDate: eventData?.startDate,
    startTime: eventData?.startTime,
    endDate: eventData?.endDate,
    endTime: eventData?.endTime,
  });
  
  // 确保必填字段存在且不为空
  if (!eventData.eventName || !eventData.eventName.trim()) {
    throw new Error('活动名称不能为空');
  }
  if (!eventData.startDate || !eventData.startTime) {
    throw new Error('请选择活动开始时间');
  }
  if (!eventData.endDate || !eventData.endTime) {
    throw new Error('请选择活动结束时间');
  }
  
  // 构建请求体，确保所有字段都存在
  const payload: any = {
    eventName: eventData.eventName,
    coverImage: eventData.coverImage || '',
    startDate: eventData.startDate,
    startTime: eventData.startTime,
    endDate: eventData.endDate,
    endTime: eventData.endTime,
    location: eventData.location || '',
    description: eventData.description || '',
    tickets: eventData.tickets || [],
    questions: eventData.questions || [],
    host: eventData.host || {},
    selectedTheme: eventData.selectedTheme || {},
    selectedEffect: eventData.selectedEffect || 'none',
    selectedTimezone: eventData.selectedTimezone || {},
    visibility: eventData.visibility || 'public',
    isVirtual: eventData.isVirtual || false,
    meetingLink: eventData.meetingLink || '',
    requireApproval: eventData.requireApproval || false,
  };
  
  // 如果存在 isLocationPublic，也包含进去（后端可能不需要，但不会报错）
  if (eventData.isLocationPublic !== undefined) {
    payload.isLocationPublic = eventData.isLocationPublic;
  }
  
  // 如果存在位置坐标信息，也包含进去
  if (eventData.locationCoordinates) {
    payload.locationCoordinates = {
      lat: eventData.locationCoordinates.lat,
      lng: eventData.locationCoordinates.lng,
      placeId: eventData.locationCoordinates.placeId,
      formattedAddress: eventData.locationCoordinates.formattedAddress,
    };
  }
  
  console.log('📤 发送活动创建请求（前端格式）:', payload);
  console.log('📤 必填字段最终检查:', {
    eventName: payload.eventName,
    startDate: payload.startDate,
    startTime: payload.startTime,
    endDate: payload.endDate,
    endTime: payload.endTime,
  });
  
  const response = await authenticatedFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  const result = await response.json();
  console.log('📥 活动创建响应:', result);
  
  // 后端返回格式: { success: true, data: { id: "...", ... } }
  // 或直接返回数据
  return result.data || result;
}


/**
 * get event by id
 * @param eventId event id
 */
export async function getEvent(eventId: string | number) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}`);
    const result = await response.json();

    console.log('📦 获取活动详情响应:', result);
    
    // 后端返回格式: { success: true, data: {...} }
    return result.data || result;
  } catch (error) {
    console.error('❌ getEvent 失败:', error);
    throw error;
  }
}

/**
 * 
 * @param eventId event id
 * @param updateData update data
 * @returns updated event data
 */
export async function updateEvent(
  eventId: string | number,
  updateData: {
    description?: string;
    title?: string;
    cover_image_url?: string;
    co_hosts?: Array<{ id: string; [key: string]: any }>;
    location_info?: Record<string, any>;
    style_config?: Record<string, any>;
    ticket_config?: Record<string, any>;
    registration_fields?: Array<any>;
    visibility?: 'public' | 'private';
    meeting_link?: string;
    is_location_public?: boolean;
    [key: string]: any;
  }
) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    throw error;
  }
}


/**
 * register event
 * @param eventId event id
 * @param ticketId ticket id (optional)
 * @param registrationData registration data (answers to registration_fields)
 */
export async function registerEvent(
  eventId: string,
  formAnswers: Record<string, string>,
  ticketCode?: string | number
) {
  try {
    const payload: any = {
      event_id: eventId,
      form_answers: formAnswers,  // 改为 form_answers
    };
    
    if (ticketCode) {
      payload.ticket_code = ticketCode;  // 改为 ticket_code
    }
    
    const response = await authenticatedFetch('/api/v1/events/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    return result.data || result;
  } catch (error) {
    throw error;
  }
}

/**
 * 获取活动注册用户列表（头像和总数）
 */
export async function getEventRegistrations(eventId: string, limit: number = 5) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/registrations?limit=${limit}`);
    const result = await response.json();
    return result.data || {
      total: 0,
      avatars: []
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 获取当前用户对指定活动的注册状态
 * 返回用户是否已注册、注册状态和注册详情
 */
export async function getEventRegistrationStatus(eventId: string) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/registration-status`);
    const result = await response.json();
    return result.data || {
      is_registered: false,
      status: null,
      registration: null
    };
  } catch (error) {
    console.error('❌ getEventRegistrationStatus 失败:', error);
    throw error;
  }
}


/**
 * 获取活动评论列表（支持分页）
 */
export async function getEventComments(
  eventId: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/events/${eventId}/comments?page=${page}&limit=${limit}`
    );
    const result = await response.json();
    return {
      comments: result.data || [],
      pagination: result.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        has_more: false
      }
    };
  } catch (error) {
    throw error;
  }
}


/**
 * 创建评论或回复
 */
export async function createEventComment(
  eventId: string,
  content: string,
  parentId?: string
) {
  try {
    const payload: any = {
      content: content,
    };
    
    if (parentId) {
      payload.parent_id = parentId;
    }
    
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('创建评论失败:', error);
    throw error;
  }
}

/**
 * 点赞/取消点赞评论
 */
export async function toggleCommentLike(commentId: string) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/comments/${commentId}/like`, {
      method: 'POST',
    });
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('点赞操作失败:', error);
    throw error;
  }
}


/**
 * 获取活动注册用户完整列表（用于管理页面）
 */
export async function getEventGuests(eventId: string, page: number = 1, limit: number = 20) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/guests?page=${page}&limit=${limit}`);
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * 导出活动的所有注册用户（用于 CSV 导出）
 */
export async function exportEventGuests(eventId: string) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/guests/export`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * 上传活动资源文件
 */
export async function uploadEventResource(
  eventId: string,
  file: File,
  requireRegistration: boolean = false
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('require_registration', requireRegistration.toString());

    const token = await getAuthToken();
    if (!token) {
      throw new Error('not logged in, please login');
    }

    const url = `${API_GATEWAY_URL}/api/v1/events/${eventId}/resources`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'upload event resource failed' }));
      throw new Error(error.detail || error.message || `upload event resource failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ upload event resource failed:', error);
    throw error;
  }
}

/**
 * 获取活动资源列表
 */
export async function getEventResources(eventId: string) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/${eventId}/resources`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('❌ get event resources failed:', error);
    throw error;
  }
}

/**
 * 删除活动资源
 */
export async function deleteEventResource(eventId: string, resourceId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/events/${eventId}/resources/${resourceId}`,
      {
        method: 'DELETE',
      }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ delete event resource failed:', error);
    throw error;
  }
}

/**
 * 上传活动相册图片（支持文件和 URL）
 */
export async function uploadGalleryPhoto(eventId: string, file?: File, imageUrl?: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const formData = new FormData();
    
    if (file) {
      formData.append('file', file);
    } else if (imageUrl) {
      formData.append('image_url', imageUrl);
    } else {
      throw new Error('either file or imageUrl must be provided');
    }

    const url = `${API_GATEWAY_URL}/api/v1/events/${eventId}/gallery/photos`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'upload gallery photo failed' }));
      throw new Error(error.detail || error.message || `upload gallery photo failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ upload gallery photo failed:', error);
    throw error;
  }
}

/**
 * 点赞/取消点赞相册图片（支持匿名用户）
 */
export async function toggleGalleryPhotoLike(photoId: string) {
  try {
    // 使用 authenticatedFetch，但如果未登录会使用可选认证
    const token = await getAuthToken();
    const url = `${API_GATEWAY_URL}/api/v1/events/gallery/photos/${photoId}/like`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'toggle like failed' }));
      throw new Error(error.detail || error.message || `toggle like failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data || {};
  } catch (error) {
    console.error('❌ toggle gallery photo like failed:', error);
    throw error;
  }
}

/**
 * 获取活动相册图片列表（支持匿名用户）
 */
export async function getGalleryPhotos(eventId: string) {
  try {
    const token = await getAuthToken();
    const url = `${API_GATEWAY_URL}/api/v1/events/${eventId}/gallery/photos`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'get gallery photos failed' }));
      throw new Error(error.detail || error.message || `get gallery photos failed: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('❌ get gallery photos failed:', error);
    throw error;
  }
}


/**
 * 删除相册图片
 */
export async function deleteGalleryPhoto(photoId: string) {
  try {
    const response = await authenticatedFetch(`/api/v1/events/gallery/photos/${photoId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ delete gallery photo failed:', error);
    throw error;
  }
}

/**
 * 删除活动
 * @param eventId 活动 ID
 */
export async function deleteEvent(eventId: string) {
  try {
    const response = await authenticatedFetch(
      `/api/v1/events/${eventId}`,
      {
        method: 'DELETE',
      }
    );
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to delete event');
    }
    
    return result;
  } catch (error) {
    console.error('❌ delete event failed:', error);
    throw error;
  }
}

/**
 * 从链接导入活动（Luma 等平台）
 * @param url 活动链接 URL
 * @param hostId 可选的主办方 ID，默认使用当前用户
 */
export async function importEventFromLink(url: string, hostId?: string) {
  try {
    const payload: any = {
      url: url,
    };
    
    if (hostId) {
      payload.host_id = hostId;
    }
    
    const response = await authenticatedFetch('/api/v1/ai/import-from-link', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '导入活动失败');
    }
    
    return result;
  } catch (error) {
    console.error('❌ import event from link failed:', error);
    throw error;
  }
}

/**
 * 从图片导入活动信息
 * @param imageFile 图片文件
 * @param additionalText 可选的附加文本描述
 * @param hostId 可选的主办方 ID，默认使用当前用户
 */
export async function importEventFromImage(imageFile: File, additionalText: string = '', hostId?: string) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      throw new Error('未登录，请先登录');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    if (additionalText) {
      formData.append('additional_text', additionalText);
    }
    if (hostId) {
      formData.append('host_id', hostId);
    }

    const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';
    const url = `${API_GATEWAY_URL}/api/v1/ai/import-from-image`;
    
    console.log(`🔗 请求 API: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: '请求失败' }));
      console.error(`❌ API 请求失败: ${response.status} ${response.statusText}`, error);
      throw new Error(error.detail || error.message || `请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to extract event information from image');
    }
    
    return result;
  } catch (error) {
    console.error('❌ import event from image failed:', error);
    throw error;
  }
}

/**
 * 获取当前用户资料
 */
export async function getUserProfile() {
  try {
    const response = await authenticatedFetch('/api/v1/users/me');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ getUserProfile 失败:', error);
    throw error;
  }
}

/**
 * 更新当前用户资料
 * @param updateData 更新数据 { full_name?: string, avatar_url?: string }
 */
export async function updateUserProfile(updateData: {
  full_name?: string;
  avatar_url?: string;
}) {
  try {
    const response = await authenticatedFetch('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ updateUserProfile 失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户的活动列表（创建的和参与的）
 */
export async function getUserEvents() {
  try {
    const response = await authenticatedFetch('/api/v1/users/me/events');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ getUserEvents 失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户的社群列表（加入的和创建的）
 */
export async function getUserCommunities() {
  try {
    const response = await authenticatedFetch('/api/v1/users/me/communities');
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error('❌ getUserCommunities 失败:', error);
    throw error;
  }
}