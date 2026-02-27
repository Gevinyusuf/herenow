'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';  // 添加 useSearchParams
import { 
  Eye, 
  Plus, 
  Copy, 
  Upload, 
  X,
  Zap,
  Link as LinkIcon,
  Mail,
  Download,
  Trash2,
  Heart,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  FileCode,
  Archive,
  Table2,  // 用于 Excel/Spreadsheet
  BarChart3,  // 用于 PowerPoint/Presentation（如果存在）
} from 'lucide-react';
import Toast from '@/components/home/Toast';
import AIModal from '@/components/manager/AIModal';
import PhotoModal from '@/components/manager/PhotoModal';
import ResourceModal from '@/components/manager/ResourceModal';
import Navbar from '@/components/home/Navbar';
import { getEvent, getEventRegistrations, getEventGuests, updateEvent, getEventResources, deleteEventResource, exportEventGuests, getGalleryPhotos, toggleGalleryPhotoLike, deleteGalleryPhoto } from '@/lib/api/client';  // 添加 API 导入

type TabType = 'overview' | 'guests' | 'content' | 'planning' | 'insights';
type InsightFilter = 'today' | '7d' | '28d' | '1y' | 'all';

interface Guest {
  name: string;
  email: string;
  date: string;
  created_at?: string;  // 添加原始时间戳
  amt: number;
  checkedIn: boolean;
  ticket: 'VIP' | 'General' | 'Early Bird';
}

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

interface Feedback {
  name: string;
  avatar: string;
  time: string;
  content: string;
}

const initialGuests: Guest[] = [
  { name: 'Alex Johnson', email: 'alex.j@example.com', date: 'Nov 20, 10:30 AM', created_at: '2023-11-20T10:30:00', amt: 50, checkedIn: true, ticket: 'VIP' },
  { name: 'Bianca Lee', email: 'bianca.l@example.com', date: 'Nov 20, 11:45 AM', created_at: '2023-11-20T11:45:00', amt: 0, checkedIn: false, ticket: 'General' },
  { name: 'Chris Miller', email: 'chris.m@example.com', date: 'Nov 20, 1:05 PM', created_at: '2023-11-20T13:05:00', amt: 25, checkedIn: true, ticket: 'Early Bird' },
  { name: 'Dana Evans', email: 'dana.e@example.com', date: 'Nov 21, 9:00 AM', created_at: '2023-11-21T09:00:00', amt: 75, checkedIn: false, ticket: 'VIP' },
  { name: 'Ethan Fox', email: 'ethan.f@example.com', date: 'Nov 21, 2:20 PM', created_at: '2023-11-21T14:20:00', amt: 0, checkedIn: false, ticket: 'General' },
  { name: 'Fiona Gray', email: 'fiona.g@example.com', date: 'Nov 22, 8:40 AM', created_at: '2023-11-22T08:40:00', amt: 100, checkedIn: true, ticket: 'VIP' },
  { name: 'George Hall', email: 'george.h@example.com', date: 'Nov 22, 3:55 PM', created_at: '2023-11-22T15:55:00', amt: 0, checkedIn: false, ticket: 'General' },
];

const initialGalleryPhotos: GalleryPhoto[] = [
  { id: '1', image_url: 'https://example.com/photo1.jpg', likes_count: 24, liked: true, created_at: '2023-11-20T10:30:00' },
  { id: '2', image_url: 'https://example.com/photo2.jpg', likes_count: 12, liked: false, created_at: '2023-11-20T11:45:00' },
  { id: '3', image_url: 'https://example.com/photo3.jpg', likes_count: 5, liked: false, created_at: '2023-11-20T13:05:00' },
];

const initialResources: Resource[] = [
  { id: '1', file_name: 'Event_Schedule.pdf', file_size: 2.4 * 1024 * 1024, file_type: 'application/pdf', file_url: 'https://example.com/schedule.pdf', require_registration: false, created_at: '2023-11-20T10:30:00' },
  { id: '2', file_name: 'Speaker_Bios.pdf', file_size: 1.1 * 1024 * 1024, file_type: 'application/pdf', file_url: 'https://example.com/bios.pdf', require_registration: true, created_at: '2023-11-20T11:45:00' },
  { id: '3', file_name: 'Workshop_Materials.zip', file_size: 15 * 1024 * 1024, file_type: 'application/zip', file_url: 'https://example.com/materials.zip', require_registration: true, created_at: '2023-11-20T13:05:00' },
];

const initialFeedbacks: Feedback[] = [
  { name: 'Alice M.', avatar: 'AM', time: '2h ago', content: 'Loved the session on AI! Very insightful.' },
  { name: 'Bob D.', avatar: 'BD', time: '5h ago', content: 'Great venue, but parking was a bit tricky.' },
  { name: 'Charlie K.', avatar: 'CK', time: '1d ago', content: 'Will there be a recording available? I missed the intro.' }
];

const insightsData = {
  'today': { views: 1240, shares: 85, regs: 128, rev: 12800, bars: [40, 60, 30, 80, 50, 90, 100] },
  '7d': { views: 8500, shares: 420, regs: 950, rev: 85000, bars: [60, 80, 50, 90, 70, 100, 80] },
  '28d': { views: 32000, shares: 1500, regs: 3800, rev: 320000, bars: [50, 70, 90, 60, 80, 70, 90] },
  '1y': { views: 150000, shares: 6000, regs: 18000, rev: 1500000, bars: [80, 60, 70, 90, 80, 90, 100] },
  'all': { views: 180000, shares: 7200, regs: 21000, rev: 1800000, bars: [70, 80, 90, 80, 90, 100, 90] }
};

function EventManagerPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  
  // 移除 isLoading，页面立即显示
  const [eventData, setEventData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [guests, setGuests] = useState<Guest[]>(initialGuests);  // 保持默认值，从后端加载后更新
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>(initialGuests);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(initialGalleryPhotos);
  const [resources, setResources] = useState<Resource[]>([]);
  const [insightFilter, setInsightFilter] = useState<InsightFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventDescription, setEventDescription] = useState(`<h1>Join us for an unforgettable evening!</h1><p>We're bringing together top innovators and creators for a night of networking, learning, and celebration.</p><h2>What to expect:</h2><ul><li>Inspiring talks from industry leaders</li><li>Delicious food and beverages</li><li>Great company and networking opportunities</li></ul><p>Don't miss out on this opportunity to connect!</p>`);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [planEmpty, setPlanEmpty] = useState(true);
  const [planGenerating, setPlanGenerating] = useState(false);
  const [planTheme, setPlanTheme] = useState('The Founder\'s Hearth');
  const [planDesc, setPlanDesc] = useState('An intimate, fireside-chat style gathering designed to strip away the corporate facade. Think warm lighting, comfortable seating, and \'unplugged\' conversations about the real journey of building.');
  const [planAgenda, setPlanAgenda] = useState('');
  const [planWow, setPlanWow] = useState('<strong>"Future Self" Postcards:</strong> Have guests write a postcard to their future selves about one goal they want to achieve. You mail it to them in 6 months. A powerful, memorable touchpoint.');
  
  const [coHosts, setCoHosts] = useState<Array<{ name: string; email: string }>>([]);
  const [showAddHostModal, setShowAddHostModal] = useState(false);
  const [newHostName, setNewHostName] = useState('');
  const [newHostEmail, setNewHostEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const planTypeRef = useRef<HTMLInputElement>(null);
  const planAudienceRef = useRef<HTMLInputElement>(null);
  const planVibeRef = useRef<HTMLInputElement>(null);

  // 添加分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalGuests, setTotalGuests] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);

  // 从后端获取活动数据
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        return;
      }

      try {
        
        // 获取活动详情
        const event = await getEvent(eventId);
        setEventData(event);
        
        // 设置活动描述
        if (event.description) {
          setEventDescription(event.description);
          // 如果编辑器已经存在，直接设置内容
          if (editorRef.current) {
            editorRef.current.innerHTML = event.description;
          }
        }

        // 初始化 co_hosts（在设置 description 之后添加）
        if (event.co_hosts && Array.isArray(event.co_hosts)) {
          // 过滤出有 name 和 email 的 co_hosts（兼容后端可能返回的格式）
          const hostsWithInfo = event.co_hosts.filter((h: any) => h.name && h.email);
          setCoHosts(hostsWithInfo);
        } else {
          setCoHosts([]);
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
        
        // 获取注册用户列表（分页）
        try {
          setIsLoadingGuests(true);
          const guestsResponse = await getEventGuests(eventId, currentPage, pageSize);
          if (guestsResponse && guestsResponse.data) {
            const formattedGuests: Guest[] = guestsResponse.data.map((g: any) => ({
              name: g.name,
              email: g.email,
              date: g.date,
              created_at: g.created_at,
              amt: g.amt || 0,
              checkedIn: g.checkedIn || false,
              ticket: (g.ticket || 'General') as 'VIP' | 'General' | 'Early Bird'
            }));
            setGuests(formattedGuests);
            setFilteredGuests(formattedGuests);
            
            // 更新分页信息
            if (guestsResponse.pagination) {
              setTotalGuests(guestsResponse.pagination.total || 0);
              setTotalPages(guestsResponse.pagination.total_pages || 0);
            }
          }
        } catch (error) {
          console.error('获取注册用户列表失败:', error);
        } finally {
          setIsLoadingGuests(false);
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
        
      } catch (error) {
        console.error('获取活动数据失败:', error);
      }
    };

    fetchEventData();
  }, [eventId, currentPage, pageSize]); // 添加 currentPage 和 pageSize 依赖

  useEffect(() => {
    filterGuests();
  }, [searchQuery, ticketFilter, statusFilter, guests]);

  useEffect(() => {
    // 当编辑器存在时，初始化内容
    if (editorRef.current && eventDescription) {
      // 只在编辑器为空或内容不同时更新
      if (!editorRef.current.innerHTML.trim() || editorRef.current.innerHTML !== eventDescription) {
        // 保存当前焦点状态
        const wasFocused = document.activeElement === editorRef.current;
        
        editorRef.current.innerHTML = eventDescription;
        
        // 如果之前有焦点，恢复焦点
        if (wasFocused) {
          editorRef.current.focus();
          // 将光标移到末尾
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [eventDescription]);

  useEffect(() => {
    // 当切换到 Content 标签页且数据加载完成时，初始化编辑器内容
    if (activeTab === 'content' && editorRef.current && eventDescription) {
      const currentContent = editorRef.current.innerHTML.trim();
      if (!currentContent || currentContent !== eventDescription) {
        editorRef.current.innerHTML = eventDescription;
      }
    }
  }, [eventDescription, activeTab]);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 2000);
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const filterGuests = () => {
    let filtered = [...guests];
    
    if (searchQuery) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (ticketFilter !== 'all') {
      filtered = filtered.filter(g => g.ticket === ticketFilter);
    }
    
    if (statusFilter === 'checkedIn') {
      filtered = filtered.filter(g => g.checkedIn);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(g => !g.checkedIn);
    }
    
    setFilteredGuests(filtered);
  };

  // 通用保存函数
  const handleSaveEvent = async (updateData: Record<string, any>, successMessage: string = 'Event saved successfully!') => {
    if (!eventId) {
      setSaveMessage({ type: 'error', text: 'Event ID not found' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const updatedEvent = await updateEvent(eventId, updateData);
      
      // 更新本地状态
      if (updatedEvent) {
        setEventData(updatedEvent);
        // 如果更新了 co_hosts，同步更新本地状态
        if (updateData.co_hosts) {
          setCoHosts(updateData.co_hosts);
        }
        // 如果更新了 description，同步更新本地状态
        if (updateData.description) {
          setEventDescription(updateData.description);
        }
      }
      
      setSaveMessage({ type: 'success', text: successMessage });
      
      // 3秒后清除提示
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('保存失败:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Save failed, please try again' });
      
      // 5秒后清除错误提示
      setTimeout(() => {
        setSaveMessage(null);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 保存 description 的函数
  const handleSaveDescription = async () => {
    if (!editorRef.current) {
      return;
    }
    
    const description = editorRef.current.innerHTML;
    await handleSaveEvent({ description }, 'Description saved successfully!');
  };

  // 添加 Host 的处理函数
  const handleAddHost = async () => {
    if (!newHostName.trim() || !newHostEmail.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter name and email' });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newHostEmail.trim())) {
      setSaveMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // 检查是否已存在相同邮箱的 host
    if (coHosts.some(h => h.email.toLowerCase() === newHostEmail.trim().toLowerCase())) {
      setSaveMessage({ type: 'error', text: 'This email already exists' });
      return;
    }

    // 构建新的 co_hosts 数组
    const newCoHosts = [
      ...coHosts,
      {
        name: newHostName.trim(),
        email: newHostEmail.trim()
      }
    ];

    // 保存到后端
    await handleSaveEvent({ co_hosts: newCoHosts }, 'Co-host added successfully!');
    
    // 清空输入框并关闭弹窗
    setNewHostName('');
    setNewHostEmail('');
    setShowAddHostModal(false);
  };

  // 删除 Host 的函数
  const handleRemoveHost = async (email: string) => {
    const newCoHosts = coHosts.filter(h => h.email !== email);
    await handleSaveEvent({ co_hosts: newCoHosts }, 'Co-host removed successfully!');
  };

  const getAvatarColor = (initials: string) => {
    const hash = initials.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-green-100', text: 'text-green-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' },
      { bg: 'bg-orange-100', text: 'text-orange-700' },
      { bg: 'bg-red-100', text: 'text-red-700' },
    ];
    return colors[hash % colors.length];
  };

  // 修改 execCmd 函数，保存光标位置
  const execCmd = (command: string, value?: string) => {
    if (typeof document === 'undefined' || !editorRef.current) return;
    
    // 保存光标位置
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    
    document.execCommand(command, false, value || undefined);
    editorRef.current.focus();
    
    // 恢复光标位置
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    if (editorRef.current) {
      setEventDescription(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    if (typeof window === 'undefined') return;
    const url = window.prompt('Enter link URL:', 'https://');
    if (url) execCmd('createLink', url);
  };

  const toggleLike = async (photoId: string) => {
    try {
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
      showToast('点赞失败，请稍后重试');
    }
  };

  const generatePlan = () => {
    setPlanGenerating(true);
    setTimeout(() => {
      setPlanEmpty(false);
      setPlanAgenda(`
        <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
          <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
          <div><span class="font-bold text-slate-900">6:00 PM</span> <span class="text-slate-600">Arrival & "Unplugged" Cocktails</span></div>
        </div>
        <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
          <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
          <div><span class="font-bold text-slate-900">6:45 PM</span> <span class="text-slate-600">Fireside Chat: "The Real Struggle"</span></div>
        </div>
        <div class="flex gap-4 relative pb-6 border-l-2 border-slate-200 pl-6 last:border-0 last:pb-0">
          <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
          <div><span class="font-bold text-slate-900">7:30 PM</span> <span class="text-slate-600">Networking Roulette</span></div>
        </div>
      `);
      setPlanGenerating(false);
      showToast('Experience Plan Generated!');
    }, 2000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      } catch (fallbackErr) {
        showToast('Failed to copy');
      }
      document.body.removeChild(textArea);
    }
  };

  const copyLink = async () => {
    const eventUrl = eventData?.slug 
      ? `herenow.events/e/${eventData.slug}` 
      : eventId 
      ? `herenow.events/e/${eventId}` 
      : 'herenow.events/e/et9wrmvr';
    
    const fullUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/event-detail?id=${eventId || ''}`
      : eventUrl;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast('Link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!');
      } catch (fallbackErr) {
        showToast('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const exportCsv = async () => {
    if (!eventId) {
      showToast('Event ID not found');
      return;
    }

    try {
      showToast('Exporting CSV...');
      
      // 导入 exportEventGuests 函数
      const { exportEventGuests } = await import('@/lib/api/client');
      const allGuests = await exportEventGuests(eventId);
      
      if (!allGuests || allGuests.length === 0) {
        showToast('No guests to export');
        return;
      }

      // 构建 CSV 内容
      const headers = ['Name', 'Email', 'Ticket Type', 'Registration Date', 'Amount', 'Status'];
      const rows: string[][] = allGuests.map((guest: any) => [
        guest.name || '',
        guest.email || '',
        guest.ticket || 'General',
        guest.date || '',
        `$${guest.amt || 0}`,
        guest.checkedIn ? 'Checked In' : 'Pending'
      ]);

      // 转义 CSV 字段（处理逗号和引号）
      const escapeCsvField = (field: string) => {
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      const csvContent = [
        headers.map(escapeCsvField).join(','),
        ...rows.map((row: string[]) => row.map(escapeCsvField).join(','))
      ].join('\n');

      // 创建 Blob 并下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `event-guests-${eventId}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('CSV exported successfully!');
    } catch (error: any) {
      console.error('导出 CSV 失败:', error);
      showToast(error.message || 'Export failed, please try again');
    }
  };

  // 添加获取 guests 的独立函数（用于分页切换）
  const fetchGuests = async (page: number = currentPage, limit: number = pageSize) => {
    if (!eventId) return;
    
    try {
      setIsLoadingGuests(true);
      const guestsResponse = await getEventGuests(eventId, page, limit);
      if (guestsResponse && guestsResponse.data) {
        const formattedGuests: Guest[] = guestsResponse.data.map((g: any) => ({
          name: g.name,
          email: g.email,
          date: g.date,
          created_at: g.created_at,
          amt: g.amt || 0,
          checkedIn: g.checkedIn || false,
          ticket: (g.ticket || 'General') as 'VIP' | 'General' | 'Early Bird'
        }));
        setGuests(formattedGuests);
        setFilteredGuests(formattedGuests);
        
        if (guestsResponse.pagination) {
          setTotalGuests(guestsResponse.pagination.total || 0);
          setTotalPages(guestsResponse.pagination.total_pages || 0);
        }
      }
    } catch (error) {
      console.error('获取注册用户列表失败:', error);
      showToast('获取用户列表失败');
    } finally {
      setIsLoadingGuests(false);
    }
  };

  // 添加分页处理函数
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchGuests(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchGuests(1, newSize);
  };

  const pauseEvent = () => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to pause registrations? No new guests will be able to sign up.")) {
      showToast("Registrations Paused");
    }
  };

  const cancelEvent = () => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      showToast("Event Cancelled");
    }
  };

  const updateInsights = (range: InsightFilter) => {
    setInsightFilter(range);
  };

  const currentInsightData = insightsData[insightFilter];

  const tabTitles: Record<TabType, string> = {
    overview: 'Overview',
    guests: 'Guests',
    content: 'Content',
    planning: 'Planning',
    insights: 'Insights'
  };

  // 格式化日期时间用于显示
  const formatEventDateTime = (dateTimeStr: string | undefined, timezone?: string) => {
    if (!dateTimeStr) return { date: 'TBD', time: 'TBD' };
    
    try {
      const date = new Date(dateTimeStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: timezone || 'UTC'
      };
      const dateStr = date.toLocaleDateString('en-US', options).toUpperCase();
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone || 'UTC'
      };
      const timeStr = date.toLocaleTimeString('en-US', timeOptions);
      
      return { date: dateStr, time: timeStr };
    } catch {
      return { date: 'TBD', time: 'TBD' };
    }
  };

  // 计算统计数据
  const calculateTodayStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRegistrations = guests.filter(g => {
      if (!g.created_at) return false;
      const regDate = new Date(g.created_at);
      regDate.setHours(0, 0, 0, 0);
      return regDate.getTime() === today.getTime();
    });
    
    const todayRevenue = todayRegistrations.reduce((sum, g) => sum + g.amt, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayRegistrations = guests.filter(g => {
      if (!g.created_at) return false;
      const regDate = new Date(g.created_at);
      regDate.setHours(0, 0, 0, 0);
      return regDate.getTime() === yesterday.getTime();
    });
    
    const yesterdayRevenue = yesterdayRegistrations.reduce((sum, g) => sum + g.amt, 0);
    
    return {
      registered: guests.length,
      revenue: guests.reduce((sum, g) => sum + g.amt, 0),
      checkedIn: guests.filter(g => g.checkedIn).length,
      todayRegistered: todayRegistrations.length,
      todayRevenue: todayRevenue,
      yesterdayRegistered: yesterdayRegistrations.length,
      yesterdayRevenue: yesterdayRevenue
    };
  };

  const stats = calculateTodayStats();

  // 添加删除资源的处理函数
  const handleDeleteResource = async (resourceId: string) => {
    if (!eventId) return;
    
    if (!window.confirm('确定要删除这个资源吗？此操作无法撤销。')) {
      return;
    }

    try {
      await deleteEventResource(eventId, resourceId);
      // 从本地状态中移除
      setResources(prev => prev.filter(r => r.id !== resourceId));
      showToast('资源已删除');
    } catch (error: any) {
      console.error('删除资源失败:', error);
      showToast(error.message || '删除失败，请稍后重试');
    }
  };

  // 添加刷新资源列表的函数
  const handleResourceUploaded = async () => {
    if (!eventId) return;
    
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
      console.error('刷新资源列表失败:', error);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 添加获取文件类型图标的函数
  const getFileIcon = (fileName: string, fileType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // 根据文件扩展名和 MIME 类型返回对应的图标
    if (['pdf'].includes(extension) || fileType?.includes('pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension) || 
        fileType?.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension) || 
        fileType?.startsWith('video/')) {
      return <Video className="w-6 h-6 text-purple-500" />;
    }
    
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension) || 
        fileType?.startsWith('audio/')) {
      return <Music className="w-6 h-6 text-pink-500" />;
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || 
        fileType?.includes('zip') || fileType?.includes('compressed')) {
      return <Archive className="w-6 h-6 text-yellow-500" />;
    }
    
    if (['doc', 'docx'].includes(extension) || fileType?.includes('word')) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    
    if (['xls', 'xlsx', 'csv'].includes(extension) || fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
      return <Table2 className="w-6 h-6 text-green-600" />;
    }
    
    if (['ppt', 'pptx'].includes(extension) || fileType?.includes('powerpoint') || fileType?.includes('presentation')) {
      return <BarChart3 className="w-6 h-6 text-orange-500" />;
    }
    
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(extension) || 
        fileType?.includes('text') || fileType?.includes('code')) {
      return <FileCode className="w-6 h-6 text-indigo-500" />;
    }
    
    // 默认文件图标
    return <File className="w-6 h-6 text-slate-500" />;
  };

  // 添加获取文件类型背景色的函数
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
    
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(extension) || 
        fileType?.startsWith('audio/')) {
      return 'bg-pink-50';
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) || 
        fileType?.includes('zip') || fileType?.includes('compressed')) {
      return 'bg-yellow-50';
    }
    
    if (['doc', 'docx'].includes(extension) || fileType?.includes('word')) {
      return 'bg-blue-50';
    }
    
    if (['xls', 'xlsx', 'csv'].includes(extension) || fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
      return 'bg-green-50';
    }
    
    if (['ppt', 'pptx'].includes(extension) || fileType?.includes('powerpoint') || fileType?.includes('presentation')) {
      return 'bg-orange-50';
    }
    
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml', 'yaml', 'yml'].includes(extension) || 
        fileType?.includes('text') || fileType?.includes('code')) {
      return 'bg-indigo-50';
    }
    
    return 'bg-slate-100';
  };

  const handlePhotoUploaded = async () => {
    if (!eventId) return;
    
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
      showToast('Photo added successfully!');
    } catch (error) {
      console.error('刷新相册失败:', error);
      showToast('Failed to refresh gallery');
    }
  };

  return (
    <div className="bg-herenow min-h-screen font-sans text-base">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Lalezar&display=swap');
          .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.02em; }
          .font-logo { font-family: 'Lalezar', system-ui; }
          .font-sans { font-family: 'Inter', sans-serif; }
          
          :root { --color-herenow-orange: #FF6B3D; }
          .bg-herenow { background: linear-gradient(135deg, #f8fafc, #ffffff); }
          .shadow-herenow { box-shadow: 0 10px 30px -5px rgba(255, 107, 61, 0.3); }
          .glass-card { background-color: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
          
          .tab-active {
            color: #0f172a;
            font-weight: 600;
            border-bottom: 4px solid var(--color-herenow-orange);
          }
          .tab-inactive {
            color: #64748b;
            font-weight: 500;
            border-bottom: 4px solid transparent;
          }
          .tab-inactive:hover { color: #334155; }

          .guest-table th { background-color: rgba(248, 250, 252, 0.8); font-size: 0.875rem; font-weight: 700; color: #1e293b; text-transform: uppercase; padding: 1rem 1.5rem; text-align: left; }
          .guest-table td { padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.5); }
          
          .form-input {
            background-color: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(226, 232, 240, 0.8);
            transition: all 0.2s;
          }
          .form-input:focus {
            background-color: #fff;
            outline: none;
            border-color: var(--color-herenow-orange);
            box-shadow: 0 0 0 3px rgba(255, 107, 61, 0.1);
          }

          .editor-content { min-height: 240px; outline: none; overflow-y: auto; line-height: 1.6; }
          .editor-content h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5em; margin-top: 0.2em; color: #1e293b; line-height: 1.2; }
          .editor-content h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.4em; margin-top: 0.8em; color: #334155; line-height: 1.3; }
          .editor-content h3 { font-size: 1.15rem; font-weight: 600; margin-bottom: 0.3em; margin-top: 0.6em; color: #475569; }
          .editor-content p { margin-bottom: 0.8em; color: #475569; }
          .editor-content a { color: var(--color-herenow-orange); text-decoration: underline; cursor: pointer; font-weight: 500; }
          .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.8em; }
          .editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.8em; }
          .editor-content blockquote { border-left: 4px solid #e2e8f0; padding-left: 1em; color: #64748b; font-style: italic; margin-bottom: 0.8em; }
          
          .toolbar-btn { padding: 0.375rem; border-radius: 0.375rem; color: #475569; transition: all 0.15s; }
          .toolbar-btn:hover { background-color: #f1f5f9; color: #1e293b; }

          [contenteditable="true"]:focus {
            outline: 2px dashed #FF6B3D;
            outline-offset: 4px;
            border-radius: 4px;
          }
          [contenteditable="true"]:hover {
            background-color: rgba(255,255,255,0.5);
            border-radius: 4px;
            cursor: text;
          }

          .insight-filter.active-filter {
            background-color: var(--color-herenow-orange);
            color: white;
          }
          .insight-filter:not(.active-filter):hover {
            background-color: #f1f5f9;
          }
        `}
      </style>

      {/* Navigation Bar */}
      <Navbar 
        onCreateEventClick={() => router.push('/create/event')} 
        variant="default" 
        currentView="events"
        onViewChange={(view) => {
          if (view === 'communities') {
            router.push('/home?view=communities');
          } else {
            router.push('/home?view=events');
          }
        }}
      />

      <div className="max-w-6xl mx-auto p-6 sm:p-10 lg:p-12">
        
        {/* HEADER */}
        <header className="mb-10 pt-24">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-brand tracking-tighter mb-2">
            {eventData?.title || '11th Anniversary Celebration'}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <p className="text-lg sm:text-xl text-slate-500 flex items-center">
              <span>Event Management / </span>
              <span className="ml-1 font-medium text-slate-700">{tabTitles[activeTab]}</span>
            </p>
            
            <a 
              href={`/event-detail?id=${eventId}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition duration-200 hover:bg-orange-50 group"
              style={{ borderColor: 'var(--color-herenow-orange)' }}
            >
              <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: 'var(--color-herenow-orange)' }} />
              <span className="font-bold text-sm" style={{ color: 'var(--color-herenow-orange)' }}>View Live Page</span>
            </a>
          </div>
          
          <nav className="overflow-x-auto whitespace-nowrap -mb-1 border-b border-slate-200">
            <div className="inline-flex space-x-8">
              {(['overview', 'guests', 'content', 'planning', 'insights'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`pb-3 text-lg transition-colors capitalize ${
                    activeTab === tab ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  {tabTitles[tab]}
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* CONTENT AREA */}
        <main>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card rounded-2xl p-5">
                    <span className="text-sm font-medium text-slate-500">Registered</span>
                    <div className="text-3xl font-extrabold font-brand text-slate-900 mt-1">{stats.registered}</div>
                    {stats.todayRegistered > 0 ? (
                      <span className="text-xs text-green-600 font-medium">+{stats.todayRegistered} Today</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No new registrations today</span>
                    )}
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <span className="text-sm font-medium text-slate-500">Revenue</span>
                    <div className="text-3xl font-extrabold font-brand text-slate-900 mt-1">$ {stats.revenue.toLocaleString()}</div>
                    {stats.todayRevenue > 0 ? (
                      <span className="text-xs text-green-600 font-medium">+$ {stats.todayRevenue.toLocaleString()} Today</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">No revenue today</span>
                    )}
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <span className="text-sm font-medium text-slate-500">Checked In</span>
                    <div className="text-3xl font-extrabold font-brand text-slate-900 mt-1">{stats.checkedIn}</div>
                    <span className="text-xs text-orange-600 font-medium">{stats.registered > 0 ? Math.round((stats.checkedIn / stats.registered) * 100) : 0}% Rate</span>
                  </div>
                </div>

                <div className="glass-card rounded-3xl p-6 shadow-herenow flex flex-col gap-6">
                  <h2 className="text-3xl font-bold text-slate-900 font-brand">Event Details</h2>
                  <div className="flex flex-col xl:flex-row gap-6">
                    <div className="w-full xl:w-1/2 space-y-4">
                      {/* 封面图片 */}
                      {eventData?.cover_image_url ? (
                        <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-200">
                          <img 
                            src={eventData.cover_image_url} 
                            alt={eventData.title || 'Event cover'} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L14 16m-2-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-1">
                          {eventData?.start_at && (() => {
                            const startDateTime = formatEventDateTime(eventData.start_at, eventData.timezone);
                            const endDateTime = eventData.end_at 
                              ? formatEventDateTime(eventData.end_at, eventData.timezone)
                              : null;
                            
                            // 判断开始和结束是否在同一天
                            const startDate = new Date(eventData.start_at);
                            const endDate = eventData.end_at ? new Date(eventData.end_at) : null;
                            const isSameDay = endDate && 
                              startDate.toDateString() === endDate.toDateString();
                            
                            return (
                              <>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-herenow-orange)' }}>
                                    {startDateTime.date}
                                  </span>
                                  {!isSameDay && endDateTime && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-herenow-orange)' }}>
                                      {endDateTime.date}
                                    </span>
                                  )}
                                  <span className="text-slate-900 font-bold">
                                    {new Date(eventData.start_at).toLocaleDateString('en-US', { weekday: 'long' })}
                                  </span>
                                </div>
                                <p className="text-slate-500 text-sm">
                                  {startDateTime.time}
                                  {endDateTime && (
                                    <>
                                      <span className="mx-2 text-slate-400">-</span>
                                      {endDateTime.time}
                                    </>
                                  )}
                                </p>
                              </>
                            );
                          })()}
                          {eventData?.location_info && (
                            <div className="mt-2 text-sm text-slate-600 flex items-start gap-1">
                              <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243m.707-10.707l4.243 4.243a1.998 1.998 0 002.828 0l4.243-4.243m-9.9-1.414l3.535-3.535m0 0l3.535 3.535M9.899 9.899l4.243-4.243M9.899 14.142l4.243 4.243"/>
                              </svg>
                              <span>{eventData.location_info.name || 'Location TBD'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition" style={{ backgroundColor: 'var(--color-herenow-orange)' }}>Go to Check-in</button>
                    </div>
                    <div className="w-full xl:w-1/2 space-y-4 xl:pl-6 xl:border-l border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-sm font-medium text-orange-600 truncate mr-2">
                          {eventData?.slug ? `herenow.events/e/${eventData.slug}` : eventId ? `herenow.events/e/${eventId}` : 'herenow.events/e/et9wrmvr'}
                        </span>
                        <button 
                          onClick={copyLink} 
                          className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          // 跳转到编辑页面或打开编辑模态框
                          // 这里可以跳转到创建页面并传递 eventId，或者打开一个编辑模态框
                          router.push(`/create/event?edit=${eventId}`);
                        }}
                        className="w-full py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <aside className="lg:col-span-1">
                <div className="glass-card rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 font-brand">Hosts</h3>
                    <button 
                      onClick={() => setShowAddHostModal(true)}
                      className="text-sm font-semibold text-white px-3 py-1 rounded-lg hover:opacity-90 transition" 
                      style={{ backgroundColor: 'var(--color-herenow-orange)' }}
                    >
                      + Add
                    </button>
                  </div>
                  
                  {/* 主办方（Creator） */}
                  {eventData?.host && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                          {eventData.host.full_name ? eventData.host.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'H'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{eventData.host.full_name || 'Host'}</p>
                          <span className="text-[10px] uppercase font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Creator</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 联合主办方列表 */}
                  {coHosts.length > 0 && (
                    <div className="space-y-2">
                      {coHosts.map((host, index) => (
                        <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {host.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{host.name}</p>
                              <p className="text-xs text-slate-500 truncate">{host.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveHost(host.email)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Remove"
                          >
                            <X size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {coHosts.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">No co-hosts found</p>
                  )}
                </div>
              </aside>
            </div>
          )}

          {/* TAB 2: GUESTS - 使用从后端获取的数据 */}
          {activeTab === 'guests' && (
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 rounded-3xl flex flex-col gap-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-brand mb-1">
                      Guests ({totalGuests})
                    </h2>
                    <p className="text-slate-500">Manage registered attendees.</p>
                  </div>
                  <button 
                    onClick={exportCsv} 
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold hover:opacity-90 shadow-lg transition" 
                    style={{ backgroundColor: 'var(--color-herenow-orange)' }}
                  >
                    <Download size={18} />
                    <span>Export CSV</span>
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input block flex-grow w-full pl-4 pr-3 py-2.5 rounded-xl text-slate-700 placeholder-slate-400"
                    placeholder="Search name or email..."
                  />
                  <div className="flex gap-3">
                    <select
                      value={ticketFilter}
                      onChange={(e) => setTicketFilter(e.target.value)}
                      className="form-input rounded-xl py-2.5 pl-3 pr-10 text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Tickets</option>
                      <option value="VIP">VIP</option>
                      <option value="General">General</option>
                      <option value="Early Bird">Early Bird</option>
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="form-input rounded-xl py-2.5 pl-3 pr-10 text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="checkedIn">Checked In</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="glass-card rounded-3xl overflow-hidden">
                {isLoadingGuests ? (
                  <div className="p-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-[#FF6B3D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading guests...</p>
                  </div>
                ) : filteredGuests.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full guest-table">
                        <thead>
                          <tr>
                            <th>Guest</th>
                            <th>Email</th>
                            <th>Ticket Type</th>
                            <th>Reg. Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-700 text-sm">
                          {filteredGuests.map((guest, idx) => {
                            const initials = guest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const { bg, text } = getAvatarColor(initials);
                            const ticketBadgeClass = 
                              guest.ticket === 'VIP' ? 'bg-purple-100 text-purple-700' :
                              guest.ticket === 'Early Bird' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600';
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 pl-4 pr-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text} flex-shrink-0`}>{initials}</div>
                                    <div className="font-bold text-slate-900">{guest.name}</div>
                                  </div>
                                </td>
                                <td>{guest.email}</td>
                                <td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${ticketBadgeClass}`}>{guest.ticket}</span></td>
                                <td>{guest.date}</td>
                                <td className="font-mono">${guest.amt}</td>
                                <td>
                                  {guest.checkedIn ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Checked In</span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-600">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalGuests)} of {totalGuests} guests
                          </span>
                          <select
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="form-input rounded-lg py-1.5 pl-2 pr-8 text-sm text-slate-700 cursor-pointer"
                          >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    currentPage === pageNum
                                      ? 'bg-[#FF6B3D] text-white'
                                      : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <p>No guests found matching your filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 space-y-8">
                <div className="glass-card rounded-3xl p-6 shadow-herenow relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900 font-brand">Event Details</h2>
                      <button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-full transition hover:opacity-90 shadow-sm"
                        style={{ background: 'linear-gradient(90deg, #FF6B3D 0%, #FF8E53 100%)' }}
                      >
                        <Zap size={14} />
                        AI Magic
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleSaveDescription}
                        disabled={isSaving}
                        className="text-sm font-semibold text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
                        style={{ backgroundColor: 'var(--color-herenow-orange)' }}
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                      {saveMessage && activeTab === 'content' && (
                        <span className={`text-sm font-semibold ${
                          saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {saveMessage.text}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3 pb-3 border-b border-slate-200 flex-wrap">
                    <button onClick={() => execCmd('formatBlock', 'H1')} className="toolbar-btn font-extrabold text-sm" title="Heading 1">H1</button>
                    <button onClick={() => execCmd('formatBlock', 'H2')} className="toolbar-btn font-bold text-sm" title="Heading 2">H2</button>
                    <button onClick={() => execCmd('bold')} className="toolbar-btn font-bold" title="Bold">B</button>
                    <button onClick={() => execCmd('italic')} className="toolbar-btn italic" title="Italic">I</button>
                    <button onClick={() => execCmd('insertUnorderedList')} className="toolbar-btn" title="Bullet List">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7"/></svg>
                    </button>
                    <button onClick={insertLink} className="toolbar-btn" title="Insert Link">
                      <LinkIcon size={16} />
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="editor-content w-full bg-slate-50 rounded-xl p-4 text-slate-700 border border-slate-200 focus:outline-none focus:border-orange-300"
                    onInput={(e) => {
                      if (e.currentTarget) {
                        setEventDescription(e.currentTarget.innerHTML);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.currentTarget) {
                        setEventDescription(e.currentTarget.innerHTML);
                      }
                    }}
                  />
                </div>
                
                <div className="glass-card rounded-3xl p-6 shadow-herenow">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 font-brand">Moments Gallery</h2>
                    <button
                      onClick={() => setShowPhotoModal(true)}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition"
                    >
                      <Upload size={16} />
                      Upload
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {galleryPhotos.length > 0 ? (
                      galleryPhotos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer hover:shadow-md transition bg-slate-200">
                          <img 
                            src={photo.image_url} 
                            alt={`Gallery photo ${photo.id}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">
                            Photo
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex justify-end items-end">
                            <button
                              onClick={() => toggleLike(photo.id)}
                              className="flex items-center space-x-1 text-white hover:scale-110 transition"
                            >
                              <Heart size={20} className={photo.liked ? 'text-red-500 fill-current' : 'text-white'} />
                              <span className="text-xs font-bold">{photo.likes_count}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-slate-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No photos yet. Upload your first moment!</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              
              <aside className="lg:col-span-1">
                <div className="glass-card rounded-3xl p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 font-brand">Resources</h2>
                    <button
                      className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
                      onClick={() => setShowResourceModal(true)}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="space-y-4 flex-grow">
                    {resources.map((res) => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-orange-200 transition group">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFileIconBg(res.file_name, res.file_type)}`}>
                            {getFileIcon(res.file_name, res.file_type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{res.file_name}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(res.file_size)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {res.require_registration ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 flex-shrink-0">Reg. Req</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 flex-shrink-0">Public</span>
                          )}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <a
                              href={res.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-slate-700"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                            <button
                              onClick={() => handleDeleteResource(res.id)}
                              className="text-slate-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {resources.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      <p>暂无资源</p>
                    </div>
                  )}
                  <div
                    onClick={() => setShowResourceModal(true)}
                    className="mt-6 p-4 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 text-sm hover:bg-slate-50 transition cursor-pointer"
                  >
                    <p>Drop files here to upload</p>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* TAB 4: PLANNING */}
          {activeTab === 'planning' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-1 space-y-6">
                <div className="glass-card rounded-3xl p-6 shadow-herenow h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 font-brand">AI Planner</h2>
                      <p className="text-xs text-slate-500">Design extraordinary experiences</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Event Type</label>
                      <input
                        ref={planTypeRef}
                        type="text"
                        className="form-input w-full rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. Networking Mixer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Target Audience</label>
                      <input
                        ref={planAudienceRef}
                        type="text"
                        className="form-input w-full rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. Startup Founders"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Desired Vibe</label>
                      <input
                        ref={planVibeRef}
                        type="text"
                        className="form-input w-full rounded-xl px-3 py-2 text-sm"
                        placeholder="e.g. Chill, Inspiring"
                      />
                    </div>
                    <button
                      onClick={generatePlan}
                      disabled={planGenerating}
                      className="w-full py-3 mt-4 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: 'linear-gradient(90deg, #FF6B3D 0%, #FF8E53 100%)' }}
                    >
                      {planGenerating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Dreaming up ideas...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Brainstorm Experience
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-2 space-y-6">
                {planEmpty ? (
                  <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] border-dashed border-2 border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Zap size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to innovate?</h3>
                    <p className="text-slate-500 max-w-md">Fill in the details on the left, and our AI will craft a unique event concept, agenda, and engagement strategy for you.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="glass-card rounded-3xl p-6 border-l-4 border-purple-500 group relative hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>
                          </span>
                          Theme Concept
                        </h3>
                        <button
                          onClick={() => copyToClipboard(`${planTheme}\n${planDesc}`)}
                          className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100"
                          title="Copy Content"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div>
                        <h4
                          contentEditable
                          suppressContentEditableWarning
                          className="text-2xl font-extrabold text-slate-800 mb-2 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-purple-200"
                          onBlur={(e) => setPlanTheme(e.currentTarget.textContent || '')}
                        >
                          {planTheme}
                        </h4>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          className="text-slate-600 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-purple-200"
                          onBlur={(e) => setPlanDesc(e.currentTarget.textContent || '')}
                        >
                          {planDesc}
                        </p>
                      </div>
                    </div>

                    <div className="glass-card rounded-3xl p-6 border-l-4 border-blue-500 group relative hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </span>
                          Smart Agenda
                        </h3>
                        <button
                          onClick={() => copyToClipboard(planAgenda.replace(/<[^>]*>/g, ''))}
                          className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100"
                          title="Copy Content"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="space-y-4 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-blue-200"
                        dangerouslySetInnerHTML={{ __html: planAgenda }}
                        onBlur={(e) => setPlanAgenda(e.currentTarget.innerHTML)}
                      />
                    </div>

                    <div className="glass-card rounded-3xl p-6 border-l-4 border-orange-500 group relative hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                          </span>
                          Wow Factor
                        </h3>
                        <button
                          onClick={() => copyToClipboard(planWow.replace(/<[^>]*>/g, ''))}
                          className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-lg shadow-sm border border-slate-100"
                          title="Copy Content"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        className="text-slate-600 outline-none hover:bg-white/50 rounded p-1 -ml-1 transition focus:bg-white focus:ring-2 focus:ring-orange-200"
                        dangerouslySetInnerHTML={{ __html: planWow }}
                        onBlur={(e) => setPlanWow(e.currentTarget.innerHTML)}
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 5: INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900 font-brand">Performance</h2>
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                  {(['today', '7d', '28d', '1y', 'all'] as InsightFilter[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => updateInsights(range)}
                      className={`insight-filter px-4 py-1.5 rounded-lg text-sm transition ${
                        insightFilter === range
                          ? 'active-filter font-semibold text-slate-600'
                          : 'font-medium text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {range === '7d' ? '7D' : range === '28d' ? '28D' : range === '1y' ? '1Y' : range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-2xl flex flex-col">
                  <span className="text-slate-500 text-sm font-medium mb-2">Page Views</span>
                  <div className="text-3xl font-extrabold text-slate-900">{currentInsightData.views.toLocaleString()}</div>
                  <div className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    +12%
                  </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col">
                  <span className="text-slate-500 text-sm font-medium mb-2">Shares</span>
                  <div className="text-3xl font-extrabold text-slate-900">{currentInsightData.shares.toLocaleString()}</div>
                  <div className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    +5%
                  </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col">
                  <span className="text-slate-500 text-sm font-medium mb-2">Registrations</span>
                  <div className="text-3xl font-extrabold text-slate-900">{currentInsightData.regs.toLocaleString()}</div>
                  <div className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    +8%
                  </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col">
                  <span className="text-slate-500 text-sm font-medium mb-2">Total Revenue</span>
                  <div className="text-3xl font-extrabold text-slate-900">${currentInsightData.rev.toLocaleString()}</div>
                  <div className="text-xs font-medium text-green-600 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                    +15%
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Traffic Trend</h3>
                <div className="h-48 flex items-end justify-between gap-2 px-2">
                  {currentInsightData.bars.map((height, idx) => (
                    <div key={idx} className="w-full bg-orange-100 rounded-t-md relative group" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${height}%`,
                          backgroundColor: 'var(--color-herenow-orange)'
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                        {height}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Attendee Feedback</h3>
                <div className="space-y-4">
                  {initialFeedbacks.map((feedback, idx) => {
                    const { bg, text } = getAvatarColor(feedback.avatar);
                    return (
                      <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${bg} ${text} flex-shrink-0`}>
                          {feedback.avatar}
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{feedback.name}</h4>
                            <span className="text-xs text-slate-400">{feedback.time}</span>
                          </div>
                          <p className="text-sm text-slate-600">{feedback.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === 'overview' && (
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-end gap-6 opacity-60 hover:opacity-100 transition-opacity">
              <button onClick={pauseEvent} className="text-sm font-medium text-slate-500 hover:text-amber-600 transition">Pause Registrations</button>
              <button onClick={cancelEvent} className="text-sm font-medium text-slate-500 hover:text-red-600 transition">Cancel Event</button>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      <Toast message={toast.message} show={toast.show} />

      {/* Modals */}
      <AIModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onApply={(content) => {
          setEventDescription(content);
          setShowAIModal(false);
          showToast('AI Content Applied!');
        }}
      />

      <PhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onUpload={handlePhotoUploaded}
        eventId={eventId || ''}
      />

      <ResourceModal
        isOpen={showResourceModal}
        onClose={() => setShowResourceModal(false)}
        onUpload={handleResourceUploaded}
        eventId={eventId || ''}
      />

      {/* Add Host Modal */}
      {showAddHostModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-brand font-bold text-slate-900">Add Co-Host</h2>
              <button
                onClick={() => {
                  setShowAddHostModal(false);
                  setNewHostName('');
                  setNewHostEmail('');
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newHostName}
                  onChange={(e) => setNewHostName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF6B3D] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  placeholder="Enter name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHost();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newHostEmail}
                  onChange={(e) => setNewHostEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#FF6B3D] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  placeholder="Enter email"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHost();
                    }
                  }}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAddHostModal(false);
                  setNewHostName('');
                  setNewHostEmail('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHost}
                disabled={isSaving || !newHostName.trim() || !newHostEmail.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 bg-[#FF6B3D] text-white hover:bg-[#e55a2c]"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Add Host'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Message Toast */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              saveMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm font-semibold">{saveMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 默认导出：用 Suspense 包裹
export default function EventManagerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <EventManagerPageContent />
    </Suspense>
  );
}
