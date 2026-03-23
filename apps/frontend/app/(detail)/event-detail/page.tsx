'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  MessageCircle,
  Flag,
  Globe,
  Linkedin,
  Twitter,
  ChevronRight,
  Ticket,
  Lock,
  Image as ImageIcon,
  FileText,
  PlayCircle,
  Download,
  X,
  Video,
  Heart,
  BookOpen,
  Star,
} from 'lucide-react';
import AuthModal from '@/components/detail/AuthModal';
import DiscussionSection from '@/components/detail/DiscussionSection';
import Navbar from '@/components/home/Navbar';
import EffectLayer from '@/components/create/EffectLayer';
import { getEvent, registerEvent, getEventRegistrations, getEventRegistrationStatus, getGalleryPhotos, toggleGalleryPhotoLike, getEventResources, getEventRecap, getEventRatings, submitEventRating } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import { MapPreview } from '@/components/create/MapPreview';
import { LocationCoordinates } from '@/components/create/LocationMap';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useRouter } from 'next/navigation';

interface Comment {
  id: number;
  user: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  isLiked: boolean;
  showReply: boolean;
}

// 后端返回的活动数据接口
interface BackendEventData {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string | null;
  start_at?: string;
  end_at?: string;
  timezone?: string;
  location_info?: {
    type: 'virtual' | 'offline';
    name?: string;
    link?: string;
    isPublic?: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
    place_id?: string;
  };
  style_config?: {
    themeId?: string;
    effect?: string;
    colors?: {
      bg?: string;
      contentBg?: string;
      text?: string;
      button?: string;
    };
  };
  registration_fields?: Array<{
    id: string;
    label: string;
    required: boolean;
    fixed: boolean;
  }>;
  ticket_config?: {
    tickets?: Array<{
      id: number | string;
      name: string;
      type: 'free' | 'paid';
      price: number | string;
      quantity?: number | string | null;
      requireApproval?: boolean;
    }>;
  };
  co_hosts?: Array<{
    id?: string;  // 可选，如果有 id 说明是系统用户
    name?: string;  // 必须有
    email?: string;  // 必须有
  }>;
  host_id?: string;
  host?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  co_hosts_info?: Array<{
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  }>;
  visibility?: 'public' | 'private';
  require_approval?: boolean;
}

// 前端使用的活动数据格式
interface GalleryPhoto {
  id: string;
  image_url: string;
  likes_count: number;
  liked: boolean;
  created_at: string;
}

interface Resource {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  require_registration: boolean;
  created_at: string;
}

// 更新 EventDisplayData 接口
interface EventDisplayData {
  title: string;
  hostOrg: string;
  date: string;
  time: string;
  location: string;
  city: string;
  description: string;
  tags: string[];
  hosts: Array<{
    name: string;
    role: string;
    avatar: string;
  }>;
  participants: number;
  participantAvatars: string[];
  gallery: GalleryPhoto[]; // 更新为真实数据格式
  resources: Resource[]; // 更新为真实数据格式
  coverImage?: string | null;
}

// 默认 Mock 数据（作为后备）
const defaultEventData: EventDisplayData = {
  title: "9K Club Monthly Gathering - November",
  hostOrg: "RevTech Ventures",
  date: "Thursday, November 20",
  time: "6:30 PM - 9:30 PM CST",
  location: "Register to See Address",
  city: "Dallas, Texas",
  description: "The 9K Club is a founder-first community where early-stage entrepreneurs meet monthly to connect, learn, and grow together. This month features a fireside chat with AI investors.",
  tags: ["Tech", "Founders", "Networking", "AI"],
  hosts: [
    { name: "Hunter Zhang", role: "Host", avatar: "https://ui-avatars.com/api/?name=Hunter+Zhang&background=FF6B3D&color=fff" },
    { name: "David Matthews", role: "Co-host", avatar: "https://ui-avatars.com/api/?name=David+Matthews&background=random" },
    { name: "Vincy Qi", role: "Organizer", avatar: "https://ui-avatars.com/api/?name=Vincy+Qi&background=random" },
  ],
  participants: 142,
  participantAvatars: [
    "https://ui-avatars.com/api/?name=Alex+R&background=random",
    "https://ui-avatars.com/api/?name=Sarah+J&background=random",
    "https://ui-avatars.com/api/?name=Mike+T&background=random",
    "https://ui-avatars.com/api/?name=Emily+W&background=random",
  ],
  gallery: [
    { 
      id: '1', 
      image_url: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes_count: 0,
      liked: false,
      created_at: new Date().toISOString()
    },
    { 
      id: '2', 
      image_url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes_count: 0,
      liked: false,
      created_at: new Date().toISOString()
    },
    { 
      id: '3', 
      image_url: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600',
      likes_count: 0,
      liked: false,
      created_at: new Date().toISOString()
    },
  ],
  resources: [
    { 
      id: '1',
      file_name: "Event Agenda.pdf",
      file_size: 2.4 * 1024 * 1024, // 2.4 MB in bytes
      file_type: "application/pdf",
      file_url: "https://example.com/agenda.pdf",
      require_registration: false,
      created_at: new Date().toISOString()
    },
    { 
      id: '2',
      file_name: "AI Investor Landscape 2025.pdf",
      file_size: 15.1 * 1024 * 1024, // 15.1 MB in bytes
      file_type: "application/pdf",
      file_url: "https://example.com/landscape.pdf",
      require_registration: false,
      created_at: new Date().toISOString()
    },
    { 
      id: '3',
      file_name: "Speaker Slides - Hunter Zhang",
      file_size: 8.5 * 1024 * 1024, // 8.5 MB in bytes
      file_type: "application/vnd.ms-powerpoint",
      file_url: "https://example.com/slides.ppt",
      require_registration: false,
      created_at: new Date().toISOString()
    }
  ],
};

/**
 * 格式化日期时间
 */
function formatDateTime(dateTimeStr: string | undefined, timezone?: string): { date: string; time: string } {
  if (!dateTimeStr) {
    return { date: defaultEventData.date, time: defaultEventData.time };
  }

  try {
    // 解析 UTC 时间字符串
    const utcDate = new Date(dateTimeStr);
    
    // 如果提供了时区，使用该时区格式化
    // 否则使用用户本地时区
    const targetTimezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // 格式化日期
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: targetTimezone,  // 使用时区转换
    };
    const dateStr = utcDate.toLocaleDateString('en-US', dateOptions);
    
    // 格式化时间
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: targetTimezone,  // 使用时区转换
    };
    const timeStr = utcDate.toLocaleTimeString('en-US', timeOptions);
    
    return {
      date: dateStr,
      time: timeStr,
    };
  } catch (error) {
    console.error('日期格式化失败:', error, 'timezone:', timezone);
    return { date: defaultEventData.date, time: defaultEventData.time };
  }
}

function isEventEnded(endAt: string | undefined): boolean {
  if (!endAt) return false;
  const endDate = new Date(endAt);
  const now = new Date();
  return now > endDate;
}

/**
 * 从后端数据转换为前端显示格式
 */
function transformBackendDataToDisplay(backendData: BackendEventData | null): EventDisplayData {
  if (!backendData) {
    return defaultEventData;
  }

  // 格式化日期时间
  const startDateTime = formatDateTime(backendData.start_at, backendData.timezone);
  const endDateTime = formatDateTime(backendData.end_at, backendData.timezone);
  const timeRange = `${startDateTime.time} - ${endDateTime.time}`;

  // 处理地点信息
  const locationInfo: BackendEventData['location_info'] = backendData.location_info;
  let location = defaultEventData.location;
  let city = defaultEventData.city;

  if (locationInfo && locationInfo.type === 'virtual') {
    location = locationInfo.link || 'Virtual Event';
    city = 'Online';
  } else if (locationInfo && locationInfo.type === 'offline' && locationInfo.name) {
    location = locationInfo.name;
    // 尝试从地点名称中提取城市（简单处理）
    const cityMatch = location.match(/([^,]+),\s*([^,]+)/);
    if (cityMatch) {
      city = cityMatch[2].trim();
    } else {
      city = locationInfo.name.split(',')[0] || defaultEventData.city;
    }
  }

  // 处理描述（保留 HTML 标签用于渲染）
  let description = backendData.description || defaultEventData.description;
  if (description) {
    // 不再移除 HTML 标签，保留原始 HTML 用于渲染
    description = description.trim();
    if (!description) {
      description = defaultEventData.description;
    }
  }

  // 处理主办方信息
  let hosts = defaultEventData.hosts;
  let hostOrg = defaultEventData.hostOrg;
  
  if (backendData.host) {
    // 使用后端返回的主办方信息
    const hostName = backendData.host.full_name || backendData.host.email || 'Unknown';
    hosts = [
      {
        name: hostName,
        role: 'Host',
        avatar: backendData.host.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(hostName)}&background=FF6B3D&color=fff`
      }
    ];
    
    // 设置主办方组织名称（使用主办方姓名）
    hostOrg = hostName;
    
    // 添加联合主办方
    // 处理两种格式：
    // 1. co_hosts_info: 有 id 的联合主办方（从 profiles 表查询）
    // 2. co_hosts: 只有 name 和 email 的联合主办方（外部添加的）
    
    const allCoHosts: Array<{ name: string; email?: string; avatar?: string }> = [];
    
    // 添加有 id 的联合主办方（从 profiles 查询的）
    if (backendData.co_hosts_info && backendData.co_hosts_info.length > 0) {
      backendData.co_hosts_info.forEach((coHost) => {
        const coHostName = coHost.full_name || coHost.email || 'Unknown';
        allCoHosts.push({
          name: coHostName,
          email: coHost.email,
          avatar: coHost.avatar_url
        });
      });
    }
    
    // 添加只有 name 和 email 的联合主办方（从 co_hosts 字段）
    if (backendData.co_hosts && Array.isArray(backendData.co_hosts)) {
      backendData.co_hosts.forEach((coHost: any) => {
        // 只处理有 name 和 email 但没有 id 的（或者 id 不在 profiles 表中的）
        if (coHost.name && coHost.email) {
          // 检查是否已经在 co_hosts_info 中（避免重复）
          const existsInInfo = backendData.co_hosts_info?.some(
            (info: any) => info.email?.toLowerCase() === coHost.email?.toLowerCase()
          );
          
          if (!existsInInfo) {
            allCoHosts.push({
              name: coHost.name,
              email: coHost.email,
              avatar: undefined // 没有 avatar，使用默认生成
            });
          }
        }
      });
    }
    
    // 将联合主办方添加到 hosts 列表
    if (allCoHosts.length > 0) {
      const coHostsDisplay = allCoHosts.map((coHost, index) => {
        const coHostName = coHost.name || coHost.email || 'Unknown';
        return {
          name: coHostName,
          role: index === 0 ? 'Co-host' : 'Organizer',
          avatar: coHost.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(coHostName)}&background=random`
        };
      });
      hosts = [...hosts, ...coHostsDisplay];
    }
  }

  // 处理标签（可以从 description 或其他字段提取，暂时使用默认值）
  const tags = defaultEventData.tags;

  return {
    title: backendData.title || defaultEventData.title,
    hostOrg: hostOrg,
    date: startDateTime.date,
    time: timeRange,
    location,
    city,
    description: backendData.description || defaultEventData.description,
    tags,
    hosts,
    participants: defaultEventData.participants,
    participantAvatars: defaultEventData.participantAvatars,
    gallery: [], // 不再使用 mock 数据，从 API 获取
    resources: [], // 不再使用 mock 数据，从 API 获取
    coverImage: backendData.cover_image_url,
  };
}

function EventDetailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { canAccessCommunity, canAccessDiscover } = useEntitlements();
  const eventId = searchParams.get('id');
  
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // 移除 isLoading，页面立即显示，使用默认数据
  const [event, setEvent] = useState<EventDisplayData>(defaultEventData);
  const [backendEventData, setBackendEventData] = useState<BackendEventData | null>(null);
  const [registrationFormData, setRegistrationFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [registrations, setRegistrations] = useState<{
    total: number;
    avatars: string[];
  }>({
    total: 0,
    avatars: []
  });
  const [locationCoordinates, setLocationCoordinates] = useState<LocationCoordinates | undefined>(undefined);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // 添加 gallery 和 resources 状态
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [eventRecap, setEventRecap] = useState<{title: string; content: string} | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const registrationFormInitialized = useRef(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();

    // 监听认证状态变化
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 从后端获取活动数据
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        return;
      }

      try {
        const backendData = await getEvent(eventId);
        setBackendEventData(backendData);
        const transformedData = transformBackendDataToDisplay(backendData);
        setEvent(transformedData);
        
        // 提取位置坐标信息
        if (backendData.location_info && backendData.location_info.type === 'offline') {
          const locationInfo = backendData.location_info;
          
          // 如果后端返回了 coordinates，直接使用
          if (locationInfo.coordinates) {
            const coords: LocationCoordinates = {
              lat: locationInfo.coordinates.lat,
              lng: locationInfo.coordinates.lng,
              placeId: locationInfo.place_id,
              formattedAddress: locationInfo.name || '',
              displayText: locationInfo.name || '',
            };
            setLocationCoordinates(coords);
          }
        }
        
        // 检查用户是否已注册（用于判断是否显示位置）
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const regStatus = await getEventRegistrationStatus(eventId);
            setIsRegistered(regStatus.is_registered);
          }
        } catch (error) {
          console.error('检查注册状态失败:', error);
          setIsRegistered(false);
        }
        
        // 初始化选中的票务
        if (backendData.ticket_config?.tickets && backendData.ticket_config.tickets.length > 0) {
          setSelectedTicket(backendData.ticket_config.tickets[0].id.toString());
        }
        
        // 获取注册用户列表
        try {
          const regData = await getEventRegistrations(eventId, 5);
          setRegistrations(regData);
        } catch (error) {
          console.error('获取注册用户列表失败:', error);
          // 使用默认值
          setRegistrations({ total: 0, avatars: [] });
        }
        
        // 获取相册图片列表
        try {
          const photosData = await getGalleryPhotos(eventId);
          if (photosData && Array.isArray(photosData)) {
            setGalleryPhotos(photosData.map((p: any) => ({
              id: p.id,
              image_url: p.image_url,
              likes_count: p.likes_count || 0,
              liked: p.liked || false,
              created_at: p.created_at
            })));
          }
        } catch (error) {
          console.error('获取相册图片失败:', error);
        }
        
        // 获取资源列表
        try {
          const resourcesData = await getEventResources(eventId);
          if (resourcesData && Array.isArray(resourcesData)) {
            setResources(resourcesData.map((r: any) => ({
              id: r.id,
              file_name: r.file_name,
              file_size: r.file_size,
              file_type: r.file_type,
              file_url: r.file_url,
              require_registration: r.require_registration || false,
              created_at: r.created_at
            })));
          }
        } catch (error) {
          console.error('获取资源列表失败:', error);
        }

        // 获取活动回顾
        try {
          const recapData = await getEventRecap(eventId);
          if (recapData && recapData.length > 0) {
            const recap = recapData[0];
            setEventRecap({
              title: recap.title || '',
              content: recap.content_data?.content || ''
            });
          }
        } catch (error) {
          console.error('获取活动回顾失败:', error);
        }

        // 获取评分
        try {
          const ratingsData = await getEventRatings(eventId);
          if (ratingsData && ratingsData.data) {
            setRatings(ratingsData.data || []);
            setAvgRating(ratingsData.avg_rating || 0);
          } else if (Array.isArray(ratingsData)) {
            setRatings(ratingsData);
            if (ratingsData.length > 0) {
              const total = ratingsData.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
              setAvgRating(total / ratingsData.length);
            }
          }
        } catch (error) {
          console.error('获取评分失败:', error);
        }

      } catch (error) {
        console.error('获取活动数据失败:', error);
      }
    };

    fetchEventData();
  }, [eventId]);

  // 初始化表单数据
  useEffect(() => {
    if (backendEventData?.registration_fields) {
      // 只在表单数据为空时才初始化，避免清空用户已输入的内容
      if (Object.keys(registrationFormData).length === 0) {
        const initialData: Record<string, string> = {};
        backendEventData.registration_fields.forEach(field => {
          initialData[field.id] = '';
        });
        setRegistrationFormData(initialData);
      }
    }
  }, [backendEventData]);

  // 处理报名表单提交
  const handleRegistrationSubmit = async () => {
    if (!eventId || !backendEventData) return;

    // 验证必填字段
    const requiredFields = backendEventData.registration_fields?.filter(f => f.required) || [];
    for (const field of requiredFields) {
      if (!registrationFormData[field.id]?.trim()) {
        alert(`Please fill in the required field: ${field.label}`);
        return;
      }
    }

    // 验证是否选择了票务
    if (!selectedTicket) {
      alert('Please select a ticket type');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 获取选中的票务代码
      const ticketCode = selectedTicket;
      
      // 准备 form_answers（只包含 registration_fields 的答案）
      const formAnswers: Record<string, string> = {};
      backendEventData.registration_fields?.forEach(field => {
        if (registrationFormData[field.id]) {
          formAnswers[field.id] = registrationFormData[field.id];
        }
      });
      
      await registerEvent(eventId, formAnswers, ticketCode);
      
      // 报名成功
      alert('Registration successful!');
      setShowRegistrationModal(false);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Registration failed, please try again later');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 修改按钮点击处理
  const handleRegisterClick = () => {
    if (backendEventData?.registration_fields && backendEventData.registration_fields.length > 0) {
      // 有报名字段，显示报名表单
      setShowRegistrationModal(true);
    } else {
      // 没有报名字段，直接报名
      handleRegistrationSubmit();
    }
  };

  // Comments State for Interaction
  const [comments, setComments] = useState<Comment[]>([
    { 
      id: 1, 
      user: "Sarah Jenkins", 
      avatar: "https://ui-avatars.com/api/?name=Sarah+J&background=random", 
      time: "2h ago", 
      text: "Super excited for this one! The last session on SaaS metrics was incredibly helpful.",
      likes: 12,
      isLiked: false,
      showReply: false
    },
    { 
      id: 2, 
      user: "Mike Chen", 
      avatar: "https://ui-avatars.com/api/?name=Mike+C&background=random", 
      time: "5h ago", 
      text: "Is there parking available near the venue?",
      likes: 3,
      isLiked: false,
      showReply: false
    }
  ]);

  // Helper: Wrap actions that require authentication
  const checkAuth = (action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLogin = () => {
    // 登录成功后，重新检查登录状态
    const checkAuthStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('check auth status failed: {error}');
      }
    };
    checkAuthStatus();
    setShowAuthModal(false);
  };

  // 处理登出
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('sign out failed: {error}');
    }
  };

  // Handle Like Toggle
  const toggleLike = (id: number) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }
      return comment;
    }));
  };

  // Handle Reply Toggle
  const toggleReply = (id: number) => {
    setComments(comments.map(comment => {
      if (comment.id === id) {
        return { ...comment, showReply: !comment.showReply };
      }
      return comment;
    }));
  };

  // 获取样式配置
  const styleConfig = backendEventData?.style_config;
  const bgClass = styleConfig?.colors?.bg || 'bg-gradient-to-b from-slate-50 to-white';
  const textClass = styleConfig?.colors?.text || 'text-slate-600';
  const buttonClass = styleConfig?.colors?.button || 'bg-[#FF6B3D] hover:bg-[#e55a2c] text-white';
  const contentBgClass = styleConfig?.colors?.contentBg || 'bg-white/90 backdrop-blur-xl border border-white';
  const effect = styleConfig?.effect || null;

  const handleContactHost = () => {
    if (backendEventData?.host?.email) {
      setShowContactModal(true);
    } else {
      alert('主办方邮箱信息不可用');
    }
  };

  // 添加点赞处理函数
  const handleToggleLike = async (photoId: string) => {
    try {
      const { toggleGalleryPhotoLike } = await import('@/lib/api/client');
      const result = await toggleGalleryPhotoLike(photoId);
      
      setGalleryPhotos(prev => prev.map(photo => {
        if (photo.id === photoId) {
          return {
            ...photo,
            liked: result.liked,
            likes_count: result.likes_count
          };
        }
        return photo;
      }));
    } catch (error) {
      console.error('点赞失败:', error);
      // 如果未登录，可以提示登录
      if (!isLoggedIn) {
        setShowAuthModal(true);
      }
    }
  };

  // 添加文件类型图标函数（从管理页复制）
  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension) || fileType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension) || 
        fileType?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension) || 
        fileType?.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  const getFileIconBg = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (['pdf'].includes(extension) || fileType?.includes('pdf')) {
      return 'bg-red-50';
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension) || 
        fileType?.startsWith('image/')) {
      return 'bg-blue-50';
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension) || 
        fileType?.startsWith('video/')) {
      return 'bg-purple-50';
    }
    
    return 'bg-slate-100';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} font-sans selection:bg-orange-100 relative`}>
      {/* 添加效果层 */}
      {effect && effect !== 'none' && <EffectLayer effect={effect} />}
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Registration Modal */}
      {showRegistrationModal && backendEventData?.registration_fields && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-brand font-bold text-slate-900">Registration</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              <p className="text-slate-600">Please fill in the following information to complete your registration:</p>
              
              {backendEventData.registration_fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={registrationFormData[field.id] || ''}
                    onChange={(e) => setRegistrationFormData({
                      ...registrationFormData,
                      [field.id]: e.target.value
                    })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-[#FF6B3D] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegistrationSubmit}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${buttonClass}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Host Modal */}
      {showContactModal && backendEventData?.host?.email && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-brand font-bold text-slate-900">Contact the Host</h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={backendEventData.host?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(backendEventData.host?.full_name || backendEventData.host?.email || 'H')}&background=FF6B3D&color=fff`} 
                  alt={backendEventData.host?.full_name || 'Host'} 
                  className="w-16 h-16 rounded-full ring-2 ring-slate-100"
                />
                <div>
                  <p className="font-bold text-slate-900 text-lg">
                    {backendEventData.host?.full_name || 'Host'}
                  </p>
                  <p className="text-sm text-slate-500">Event Host</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-900 font-medium flex-1">
                      {backendEventData.host?.email || 'No email available'}
                    </span>
                    {backendEventData.host?.email && (
                      <button
                        onClick={() => {
                          if (backendEventData.host?.email) {
                            navigator.clipboard.writeText(backendEventData.host.email);
                            alert('邮箱已复制到剪贴板');
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#FF6B3D] hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        复制
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {backendEventData.host?.email ? (
                    <a
                      href={`mailto:${backendEventData.host.email}`}
                      className="flex-1 px-4 py-3 bg-[#FF6B3D] text-white font-semibold rounded-xl hover:bg-[#e55a2c] transition-colors text-center"
                    >
                      发送邮件
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 px-4 py-3 bg-slate-300 text-slate-500 font-semibold rounded-xl cursor-not-allowed"
                    >
                      发送邮件
                    </button>
                  )}
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar 
        onCreateEventClick={() => router.push('/create/event')}
        variant="default" 
        showTime={false}
        currentView="events"
        onViewChange={(view) => {
          router.push(`/home?view=${view}`);
        }}
        canAccessCommunity={canAccessCommunity}
        canAccessDiscover={canAccessDiscover}
      />

      <main className={`max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12 pt-24 sm:pt-28 md:pt-32 ${textClass}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          
          {/* Left Column (5/12) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Poster */}
            <div className={`group relative aspect-[16/9] w-full rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 ring-1 ring-slate-100 ${contentBgClass}`}>
              <img 
                src={event.coverImage || "https://images.pexels.com/photos/2833037/pexels-photo-2833037.jpeg?auto=compress&cs=tinysrgb&w=800"} 
                alt="Event Poster" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-[#FF6B3D] shadow-sm border border-white/50">NOVEMBER SERIES</div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                 <p className="text-white/90 text-sm font-medium mb-1">Presented by</p>
                 <p className="text-white font-brand font-bold text-xl">{event.hostOrg}</p>
              </div>
            </div>

            {/* Hosts - Hidden on mobile, shown after registration */}
            <div className="space-y-4 hidden lg:block">
              <h3 className={`font-brand font-bold text-lg ${textClass}`}>Hosted By</h3>
              <div className="flex flex-col gap-3">
                {event.hosts.map((host, idx) => (
                  <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <img src={host.avatar} alt={host.name} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm bg-slate-200" />
                    <div>
                      <p className={`font-semibold text-sm group-hover:text-[#FF6B3D] transition-colors ${textClass}`}>{host.name}</p>
                      <p className="text-slate-400 text-xs">{host.role}</p>
                    </div>
                    <button className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"><MessageCircle size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className={`pt-6 border-t border-slate-100 flex flex-col gap-3 ${contentBgClass} rounded-2xl p-4 hidden lg:flex`}>
               <button 
                 onClick={handleContactHost}
                 className={`flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group ${textClass}`}
               >
                 <MessageCircle size={16} className="group-hover:text-[#FF6B3D] transition-colors"/> Contact the Host
               </button>
               <button className={`flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group ${textClass}`}>
                 <Flag size={16} className="group-hover:text-red-500 transition-colors"/> Report Event
               </button>
               <div className="flex gap-4 mt-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#0077b5] hover:text-white transition-colors cursor-pointer">
                    <Linkedin size={14}/>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-colors cursor-pointer">
                    <Twitter size={14}/>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-600 hover:text-white transition-colors cursor-pointer">
                    <Globe size={14}/>
                  </div>
               </div>
            </div>

            {/* DISCUSSION SECTION - Hidden on mobile, shown after registration */}
            <div className="hidden lg:block">
              <DiscussionSection
                eventId={eventId || ''}
                isLoggedIn={isLoggedIn}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            </div>
          </div>

          {/* Right Column (7/12) */}
          <div className="lg:col-span-7 relative">
            {/* Header Area */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">{event.city}</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6B3D] text-xs font-semibold border border-orange-100 flex items-center gap-1">
                  <Ticket size={12}/> Limited Spots
                </span>
              </div>
              <h1 className={`text-4xl lg:text-5xl font-brand font-extrabold leading-[1.1] mb-6 ${textClass}`}>{event.title}</h1>
              <div className={`flex flex-col gap-4 p-5 rounded-2xl ${contentBgClass} shadow-sm`}>
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B3D] shrink-0">
                     <Calendar size={20} />
                   </div>
                   <div>
                     <p className={`font-bold ${textClass}`}>{event.date}</p>
                     <p className="text-sm text-slate-500">{event.time}</p>
                     <div className="mt-1 text-xs text-[#FF6B3D] font-medium cursor-pointer hover:underline">Add to Calendar</div>
                   </div>
                </div>
                <div className="w-full h-[1px] bg-slate-50"></div>
                <div className="flex items-start gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                     <MapPin size={20} />
                   </div>
                   <div>
                     <p className={`font-bold ${textClass}`}>{event.location}</p>
                     <p className="text-sm text-slate-500">{event.city}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* TAB SYSTEM */}
            <div className="mb-10">
              <div className="flex items-center gap-1 mb-6 bg-slate-100 p-1.5 rounded-2xl w-fit">
                {[
                  { id: 'overview', label: 'Overview', icon: FileText },
                  ...(isEventEnded(backendEventData?.end_at) ? [{ id: 'recap', label: 'Recap', icon: BookOpen }] : []),
                  { id: 'moments', label: 'Moments', icon: ImageIcon },
                  ...(isEventEnded(backendEventData?.end_at) ? [{ id: 'reviews', label: 'Reviews', icon: Star }] : []),
                  { id: 'resources', label: 'Resources', icon: Download }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                      ${activeTab === tab.id 
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}
                  >
                    <tab.icon size={16} className={activeTab === tab.id ? 'text-[#FF6B3D]' : 'text-slate-400'} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[100px]">
                {activeTab === 'overview' && (
                  <div className={`prose prose-slate prose-lg max-w-none ${textClass}`}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: event.description || '' }}
                      className="prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-[#FF6B3D] prose-a:no-underline hover:prose-a:underline prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"
                      style={{
                        // 确保文字颜色有足够对比度
                        color: textClass.includes('text-slate') ? undefined : 'inherit'
                      }}
                    />
                  </div>
                )}

                {activeTab === 'recap' && (
                  <div className="space-y-6">
                    {eventRecap && eventRecap.content ? (
                      <>
                        <h2 className="text-3xl font-bold text-slate-900">{eventRecap.title || 'Event Recap'}</h2>
                        <div className="prose prose-slate prose-lg max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ __html: eventRecap.content }}
                            className="prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-[#FF6B3D] prose-a:no-underline hover:prose-a:underline prose-ul:text-slate-700 prose-ol:text-slate-700 prose-li:text-slate-700"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No recap available yet.</p>
                        <p className="text-sm mt-2">Check back after the event!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-5xl font-bold text-slate-900">{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</div>
                        <div>
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={20}
                                className={star <= Math.round(avgRating) ? 'text-yellow-400 fill-current' : 'text-slate-300'}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-slate-500">{ratings.length} review{ratings.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Submit Rating */}
                      <div className="border-t border-slate-100 pt-4 mt-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Leave a Review</h4>
                        <div className="flex gap-2 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setUserRating(star)}
                              className="p-1 hover:scale-110 transition"
                            >
                              <Star
                                size={28}
                                className={star <= userRating ? 'text-yellow-400 fill-current' : 'text-slate-300 hover:text-yellow-200'}
                              />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          placeholder="Share your experience (optional)..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-300 resize-none text-sm"
                          rows={3}
                        />
                        <button
                          onClick={async () => {
                            if (userRating === 0) {
                              alert('Please select a rating');
                              return;
                            }
                            try {
                              await submitEventRating(eventId, userRating, ratingComment);
                              alert('Thank you for your review!');
                              setUserRating(0);
                              setRatingComment('');
                              // Refresh ratings
                              const newRatings = await getEventRatings(eventId);
                              setRatings(newRatings.data || newRatings || []);
                              if (newRatings.avg_rating) setAvgRating(newRatings.avg_rating);
                            } catch (error) {
                              console.error('Submit rating failed:', error);
                              alert('Failed to submit rating');
                            }
                          }}
                          disabled={userRating === 0}
                          className="mt-3 px-6 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: userRating > 0 ? 'var(--color-herenow-orange)' : undefined }}
                        >
                          Submit Review
                        </button>
                      </div>
                    </div>

                    {/* Reviews List */}
                    {ratings.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Recent Reviews</h4>
                        {ratings.map((rating: any, index: number) => (
                          <div key={rating.id || index} className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF9E7D] flex items-center justify-center text-white font-bold text-sm">
                                {rating.email?.charAt(0).toUpperCase() || 'A'}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 text-sm">{rating.email || 'Anonymous'}</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={14}
                                      className={star <= (rating.score || 0) ? 'text-yellow-400 fill-current' : 'text-slate-300'}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400">
                                {rating.created_at ? new Date(rating.created_at).toLocaleDateString() : ''}
                              </p>
                            </div>
                            {rating.comment && (
                              <p className="text-sm text-slate-600 mt-2">{rating.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No reviews yet. Be the first to review!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'moments' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryPhotos.length > 0 ? (
                      galleryPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden group cursor-pointer bg-slate-100">
                          <img 
                            src={photo.image_url} 
                            alt={`Gallery photo ${photo.id}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex justify-end items-end">
                            <button
                              onClick={() => handleToggleLike(photo.id)}
                              className="flex items-center space-x-1 text-white hover:scale-110 transition"
                            >
                              <Heart size={18} className={photo.liked ? 'text-red-500 fill-current' : 'text-white'} />
                              <span className="text-xs font-bold">{photo.likes_count}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-slate-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No photos yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="grid gap-3">
                    {resources.length > 0 ? (
                      resources.map((resource) => (
                        <a
                          key={resource.id}
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50/30 transition-all group cursor-pointer bg-white shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getFileIconBg(resource.file_name, resource.file_type)}`}>
                              {getFileIcon(resource.file_name, resource.file_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-slate-900 group-hover:text-[#FF6B3D] transition-colors truncate">
                                {resource.file_name}
                              </p>
                              <p className="text-slate-500 text-xs font-medium mt-0.5">
                                {formatFileSize(resource.file_size)} • {resource.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(resource.file_url, '_blank');
                            }}
                            className="text-slate-500 hover:text-[#FF6B3D] transition-colors shrink-0 ml-2"
                          >
                            <Download size={20} />
                          </button>
                        </a>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-slate-500">No resources available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location Section */}
            <div className={`mb-12 ${contentBgClass} rounded-2xl p-6 shadow-sm`}>
              <h3 className={`font-brand font-bold text-xl mb-3 ${textClass}`}>Location</h3>
              
              {backendEventData?.location_info?.type === 'virtual' ? (
                // 虚拟活动显示会议链接
                <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Virtual Event</p>
                      <a 
                        href={backendEventData.location_info.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-cyan-700 hover:text-cyan-800 hover:underline break-all"
                      >
                        {backendEventData.location_info.link}
                      </a>
                    </div>
                  </div>
                </div>
              ) : backendEventData?.location_info?.type === 'offline' ? (
                // 线下活动显示地图
                <>
                  {backendEventData.location_info.isPublic === false && !isRegistered ? (
                    // 位置不公开且用户未注册，显示提示
                    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-600 mb-1">Location Hidden</p>
                          <p className="text-xs text-slate-500">Register to view exact location</p>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <Lock size={18} className="text-[#FF6B3D]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Exact Location Hidden</p>
                          <p className="text-sm font-bold text-slate-900">Register to unlock</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // 位置公开或用户已注册，显示地图
                    <>
                      {locationCoordinates ? (
                        <MapPreview
                          location={event.location}
                          locationCoordinates={locationCoordinates}
                        />
                      ) : (
                        // 如果没有坐标但有地址，显示地址文本和简单的 Google Maps embed
                        <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                          <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight={0} 
                            marginWidth={0} 
                            src={`https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=${encodeURIComponent(event.location)}&amp;t=&amp;z=12&amp;ie=UTF8&amp;iwloc=B&amp;output=embed`}
                            className="filter grayscale-[20%] opacity-80 group-hover:opacity-100 transition-all duration-500"
                            title="Google Map"
                          ></iframe>
                          <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"></div>
                          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5 text-[#FF6B3D]" />
                              <div>
                                <p className="text-sm font-bold text-slate-900">{event.location}</p>
                                {event.city && (
                                  <p className="text-xs text-slate-500">{event.city}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                // 默认情况（没有 location_info）
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-600">Location TBD</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Registration Card (Sticky) */}
            <div className="sticky top-28 lg:top-32 z-30">
              <div className={`${contentBgClass} rounded-3xl shadow-xl shadow-orange-500/5 p-6 lg:p-8 relative overflow-hidden`}>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-200/20 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className={`text-xl font-brand font-bold mb-1 relative z-10 ${textClass}`}>Registration</h2>
                <p className="text-sm text-slate-500 mb-6 relative z-10">Welcome! Please choose your desired ticket type:</p>
                
                {/* 动态渲染票务选项 */}
                {backendEventData?.ticket_config?.tickets && backendEventData.ticket_config.tickets.length > 0 ? (
                <div className="space-y-3 relative z-10">
                    {backendEventData.ticket_config.tickets.map((ticket) => {
                      const ticketId = ticket.id.toString();
                      const isSelected = selectedTicket === ticketId;
                      const price = ticket.type === 'paid' 
                        ? `$${typeof ticket.price === 'number' ? ticket.price.toFixed(2) : ticket.price}` 
                        : 'Free';
                      
                      return (
                  <div 
                          key={ticketId}
                          onClick={() => setSelectedTicket(ticketId)} 
                          className={`cursor-pointer group p-4 rounded-2xl border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#FF6B3D] bg-orange-50/30' 
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                          }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckCircle2 size={18} className="text-[#FF6B3D]"/>
                              ) : (
                                <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200"></div>
                              )}
                              <span className={`font-bold ${textClass}`}>{ticket.name}</span>
                            </div>
                            <span className={`font-brand font-bold ${textClass}`}>{price}</span>
                      </div>
                          {ticket.requireApproval && (
                            <p className="text-xs text-slate-500 pl-[26px]">Requires approval</p>
                          )}
                    </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 relative z-10 py-4">
                    No tickets available for this event.
                  </div>
                )}
                
                <div className="mt-6 relative z-10">
                   <button 
                     onClick={handleRegisterClick}
                     disabled={!selectedTicket || !backendEventData?.ticket_config?.tickets || backendEventData.ticket_config.tickets.length === 0}
                     className={`w-full disabled:bg-slate-300 disabled:cursor-not-allowed font-brand font-bold text-lg py-3.5 rounded-2xl shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 ${buttonClass}`}
                   >
                     Request to Join <ChevronRight size={20} />
                   </button>
                   <p className="text-center text-xs text-slate-400 mt-3">By clicking, you agree to our Terms of Service.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between px-2">
                 <div className="flex -space-x-3">
                    {registrations.avatars.map((url, i) => (
                      <img key={i} src={url} className="w-8 h-8 rounded-full ring-2 ring-white object-cover bg-slate-200" alt="User" />
                    ))}
                    {registrations.total > registrations.avatars.length && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center text-xs font-bold text-slate-600">
                        +{registrations.total - registrations.avatars.length}
                      </div>
                    )}
                 </div>
                 <div className="text-xs text-slate-400 font-medium">
                    {registrations.total > 0 ? `${registrations.total}+ Registered` : 'No registrations yet'}
                 </div>
              </div>
            </div>

            {/* Mobile: Hosted By and Discussion - shown after registration */}
            <div className="lg:hidden mt-8 space-y-8">
              {/* Hosts */}
              <div className="space-y-4">
                <h3 className={`font-brand font-bold text-lg ${textClass}`}>Hosted By</h3>
                <div className="flex flex-col gap-3">
                  {event.hosts.map((host, idx) => (
                    <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <img src={host.avatar} alt={host.name} className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm bg-slate-200" />
                      <div>
                        <p className={`font-semibold text-sm group-hover:text-[#FF6B3D] transition-colors ${textClass}`}>{host.name}</p>
                        <p className="text-slate-400 text-xs">{host.role}</p>
                      </div>
                      <button className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"><MessageCircle size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* DISCUSSION SECTION */}
              <DiscussionSection
                eventId={eventId || ''}
                isLoggedIn={isLoggedIn}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            </div>
          </div>
        </div>
      </main>
      
      <div className={`max-w-6xl mx-auto px-4 py-8 border-t border-slate-200/60 mb-12 ${textClass}`}>
         <div className="flex flex-wrap gap-2">
           {event.tags.map((tag) => (
             <span key={tag} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 cursor-pointer transition-colors">
               # {tag}
             </span>
           ))}
         </div>
      </div>
    </div>
  );
}

// 默认导出：用 Suspense 包裹
export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <EventDetailPageContent />
    </Suspense>
  );
}