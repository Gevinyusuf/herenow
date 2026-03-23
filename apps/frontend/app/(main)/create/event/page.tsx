'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Calendar, AlignLeft, Ticket, ChevronDown, Image as ImageIcon,
  X, Check, ArrowRight, Bold, Italic, Link as LinkIcon,
  MessageSquare, Plus, Trash2, MoreHorizontal, MoreVertical, Save, Shield,
  Sparkles, RefreshCw, Send, Cat, Minimize2, ClipboardPaste, FileUp, ArrowLeftRight, Zap, Heart, Calendar as CalendarIcon, Clock3, Eye, EyeOff, UserCircle, Lock, MapPin, Video, Type, Info, Repeat, Settings, Globe, Building2
} from 'lucide-react';
import Navbar from '@/components/home/Navbar';
import BgBlobs from '@/components/home/BgBlobs';
import EffectLayer from '@/components/create/EffectLayer';
import ImagePickerModal from '@/components/create/ImagePickerModal';
import AIAssistant from '@/components/create/AIAssistant';
import { LocationMap, LocationCoordinates } from '@/components/create/LocationMap';
import { Schedule, Timezone } from '@/components/create/Schedule';
import { generateAIContent } from '@/lib/api/client';
import { THEME_OPTIONS, EFFECT_OPTIONS, MOCK_IMAGES, LOCATION_RESULTS, TIMEZONES, HOST_PROFILES, THEME_CATEGORIES, EFFECT_CATEGORIES } from '@/components/create/constants';
import { createEvent, getEvent, updateEvent } from '@/lib/api/client';
import { useEntitlements } from '@/hooks/useEntitlements';
import { MapPreview } from '@/components/create/MapPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/create/ConfirmDialog';

interface Ticket {
  id: number;
  name: string;
  type: 'free' | 'paid';
  price: string;
  quantity: string;
  requireApproval: boolean;
  saveToTemplate: boolean;
}

interface Question {
  id: string;
  label: string;
  required: boolean;
  fixed: boolean;
  saveToTemplate: boolean;
}

interface Theme {
  id: string;
  name: string;
  category: string;
  bg: string;
  contentBg: string;
  text: string;
  button: string;
  preview: string;
}

interface EventData {
  eventName: string;
  coverImage: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  locationCoordinates?: LocationCoordinates;
  description: string;
  tickets: Ticket[];
  questions: Question[];
  host: { id: string; name: string; type: string; icon: any };
  coHosts: any[];
  selectedTheme: Theme;
  selectedEffect: string;
  selectedTimezone: Timezone;
  visibility: 'public' | 'private';
  isVirtual: boolean;
  meetingLink: string;
  requireApproval: boolean;
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editEventId = searchParams.get('edit');
  const [isEditMode, setIsEditMode] = useState(false);
  // 移除 isLoadingEvent，页面立即显示

  const [eventData, setEventData] = useState<EventData>({
    eventName: '',
    coverImage: MOCK_IMAGES.featured[0].url,
    startDate: '2025-11-19',
    startTime: '20:00',
    endDate: '2025-11-19',
    endTime: '21:00',
    location: '',
    description: '<p style="color: #94a3b8;">Enter a description...</p>',
    tickets: [{ id: 1, name: 'General Admission', type: 'free', price: '', quantity: '', requireApproval: false, saveToTemplate: true }],
    questions: [
      { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
      { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
    ],
    host: HOST_PROFILES[0],
    coHosts: [],
    selectedTheme: THEME_OPTIONS[0] as Theme,
    selectedEffect: 'none',
    selectedTimezone: TIMEZONES[0],
    visibility: 'public',
    isVirtual: false,
    meetingLink: '',
    requireApproval: false
  });

  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<'gallery' | 'ai'>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [isAIWriterOpen, setIsAIWriterOpen] = useState(false);
  const [aiWriterPrompt, setAiWriterPrompt] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [isLocationPublic, setIsLocationPublic] = useState(true); // false: visible after registration; true: visible to everyone (default: public)
  const [saveLocationNotice, setSaveLocationNotice] = useState<string | null>(null);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Optional Settings State
  const [saveTickets, setSaveTickets] = useState(false);
  const [saveLocation, setSaveLocation] = useState(false);
  const [saveQuestions, setSaveQuestions] = useState(false);
  const [eventPublic, setEventPublic] = useState(true);
  const [locationPublic, setLocationPublicSetting] = useState(true);
  const [requireApproval, setRequireApprovalSetting] = useState(false);
  
  // Registration Questions temporary state for cancel/save
  const [questionsBackup, setQuestionsBackup] = useState<Question[]>([
    { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
    { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
  ]);
  const [hasUnsavedQuestions, setHasUnsavedQuestions] = useState(false);
  
  // Tickets temporary state for cancel/save
  const [ticketsBackup, setTicketsBackup] = useState<Ticket[]>([
    { id: 1, name: 'General Admission', type: 'free', price: '', quantity: '', requireApproval: false, saveToTemplate: true }
  ]);
  const [hasUnsavedTickets, setHasUnsavedTickets] = useState(false);
  const [isStartDatePanelOpen, setIsStartDatePanelOpen] = useState(false);
  const [isEndDatePanelOpen, setIsEndDatePanelOpen] = useState(false);
  const [isStartTimePanelOpen, setIsStartTimePanelOpen] = useState(false);
  const [isEndTimePanelOpen, setIsEndTimePanelOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHostSelectorOpen, setIsHostSelectorOpen] = useState(false);
  const hostSelectorButtonRef = useRef<HTMLButtonElement>(null);
  const hostSelectorDropdownRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<HTMLDivElement>(null);
  const aiChatMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiChatInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 添加缺失的 AI 聊天相关状态
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAIChatLoading, setIsAIChatLoading] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const { canAccessCommunity, canAccessDiscover } = useEntitlements();

  const editorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const hasClearedDefaultTextRef = useRef<boolean>(false);
  
  // 初始数据引用，用于检测是否有未保存的更改
  const initialEventDataRef = useRef<EventData | null>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = eventData.description;
    }
  }, [eventData.description]);
  
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const handleInput = () => {
        if (editor) {
          updateData('description', editor.innerHTML);
        }
      };
      editor.addEventListener('input', handleInput);
      return () => {
        if (editor) {
          editor.removeEventListener('input', handleInput);
        }
      };
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target) && !(target as Element).closest('.popover-trigger')) {
        setActivePopover(null);
      }
      // 关闭主办方选择器
      if (isHostSelectorOpen) {
        const isClickInsideButton = hostSelectorButtonRef.current?.contains(target as Node);
        const isClickInsideDropdown = hostSelectorDropdownRef.current?.contains(target as Node);
        if (!isClickInsideButton && !isClickInsideDropdown) {
          setIsHostSelectorOpen(false);
        }
      }
    }
    if (isHostSelectorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isHostSelectorOpen]);

  const handleSaveLocation = (location: string) => {
    const exists = savedLocations.includes(location);
    setSavedLocations(prev => (exists ? prev.filter(v => v !== location) : [...prev, location]));
  };

  const updateData = (field: keyof EventData, value: any) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  // 检测是否有未保存的更改
  const hasUnsavedChanges = (): boolean => {
    // 检查是否有事件名称
    if (eventData.eventName && eventData.eventName.trim()) {
      return true;
    }
    
    // 检查描述是否有实际内容（不是默认文本）
    const description = editorRef.current?.innerHTML || eventData.description;
    if (description && 
        description.trim() !== '<p style="color: #94a3b8;">Enter a description...</p>' &&
        description.trim() !== '<p>Enter a description...</p>' && 
        description.trim() !== 'Enter a description...' &&
        description.trim() !== '<p><br></p>' &&
        description.trim() !== '<br>') {
      return true;
    }
    
    // 检查是否有位置信息
    if (eventData.location && eventData.location.trim()) {
      return true;
    }
    
    // 检查是否有虚拟会议链接
    if (eventData.isVirtual && eventData.meetingLink && eventData.meetingLink.trim()) {
      return true;
    }
    
    // 检查票务是否有自定义内容（除了默认的 General Admission）
    const hasCustomTickets = eventData.tickets.some(ticket => 
      ticket.name && ticket.name.trim() && ticket.name !== 'General Admission'
    );
    if (hasCustomTickets) {
      return true;
    }
    
    // 检查是否有自定义问题（除了默认的 Name 和 Email）
    const hasCustomQuestions = eventData.questions.some(question => 
      !question.fixed && question.label && question.label.trim()
    );
    if (hasCustomQuestions) {
      return true;
    }
    
    return false;
  };

  // 重置表单数据
  const resetFormData = () => {
    setEventData({
      eventName: '',
      coverImage: MOCK_IMAGES.featured[0].url,
      startDate: '2025-11-19',
      startTime: '20:00',
      endDate: '2025-11-19',
      endTime: '21:00',
      location: '',
      description: '<p style="color: #94a3b8;">Enter a description...</p>',
      tickets: [{ id: 1, name: 'General Admission', type: 'free', price: '', quantity: '', requireApproval: false, saveToTemplate: true }],
      questions: [
        { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
        { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
      ],
      host: HOST_PROFILES[0],
      coHosts: [],
      selectedTheme: THEME_OPTIONS[0] as Theme,
      selectedEffect: 'none',
      selectedTimezone: TIMEZONES[0],
      visibility: 'public',
      isVirtual: false,
      meetingLink: '',
      requireApproval: false
    });
    
    // 重置编辑器
    if (editorRef.current) {
      editorRef.current.innerHTML = '<p style="color: #94a3b8;">Enter a description...</p>';
      hasClearedDefaultTextRef.current = false;
    }
    
    // 重置其他状态
    setIsLocationPublic(true);
    setQuestionsBackup([
      { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
      { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
    ]);
    setHasUnsavedQuestions(false);
    
    // 如果当前是编辑模式，跳转到创建页面
    if (editEventId) {
      router.push('/create/event');
    }
  };

  // 处理导航栏"创建"按钮点击
  const handleCreateButtonClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (hasUnsavedChanges()) {
      // 显示确认对话框
      setPendingNavigation(() => () => {
        resetFormData();
        setShowConfirmDialog(false);
        setPendingNavigation(null);
      });
      setShowConfirmDialog(true);
    } else {
      // 没有未保存的更改，直接重置
      resetFormData();
    }
  };

  const addTicket = () => {
    if (eventData.tickets.length >= 5) return;
    
    // 在添加新票务前，保存当前状态作为备份（如果还没有备份或当前状态与备份不同）
    if (ticketsBackup.length === 0 || JSON.stringify(ticketsBackup) !== JSON.stringify(eventData.tickets)) {
      setTicketsBackup([...eventData.tickets]);
    }
    
    const newId = eventData.tickets.length + 1;
    updateData('tickets', [...eventData.tickets, { 
      id: newId, 
      name: '', 
      type: 'free', 
      price: '', 
      quantity: '1', 
      requireApproval: false, 
      saveToTemplate: true 
    }]);
    setHasUnsavedTickets(true); // 标记有未保存的票务
  };

  const updateTicketItem = (id: number, field: keyof Ticket, value: any) => {
    updateData('tickets', eventData.tickets.map(t => {
      if (t.id !== id) return t;
      if (field === 'quantity') {
        const num = Math.max(1, Number(value) || 1);
        return { ...t, quantity: String(num) };
      }
      if (field === 'price') {
        const num = Math.max(0, Number(value) || 0);
        return { ...t, price: String(num) };
      }
      return { ...t, [field]: value };
    }));
  };

  const removeTicketItem = (id: number) => {
    updateData('tickets', eventData.tickets.filter(t => t.id !== id));
  };

  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      selectionRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && selectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current);
    }
  };

  const toggleFormatBlock = (tag: string) => {
    if (typeof document === 'undefined') return;
    const currentTag = document.queryCommandValue('formatBlock');
    if (currentTag && currentTag.toLowerCase() === tag.toLowerCase()) {
      document.execCommand('formatBlock', false, 'div');
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    if (editorRef.current) editorRef.current.focus();
  };

  const execCommand = (command: string, value?: string) => {
    if (typeof document === 'undefined') return;
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const openLinkInput = (e: React.MouseEvent) => {
    e.preventDefault();
    saveSelection();
    if (selectionRef.current && !selectionRef.current.collapsed) {
      setShowLinkInput(true);
      setLinkUrl('');
    } else {
      alert("Please select text to link.");
    }
  };

  const applyLink = () => {
    if (typeof document === 'undefined') return;
    restoreSelection();
    if (linkUrl) {
      document.execCommand('createLink', false, linkUrl);
    }
    setShowLinkInput(false);
    setLinkUrl('');
    if (editorRef.current) editorRef.current.focus();
  };

  const handleAIWrite = async () => {
    if (!aiWriterPrompt) return;
    setIsWriting(true);
    try {
      // 构建上下文信息
      const context = {
        eventName: eventData.eventName,
        startDate: eventData.startDate,
        startTime: eventData.startTime,
        endDate: eventData.endDate,
        endTime: eventData.endTime,
        location: eventData.location,
        currentDescription: eventData.description,
      };

      // 构建完整的提示词
      const fullPrompt = `Write/Edit event description (HTML only, minimal styling) based on: ${aiWriterPrompt}. 
Event context: Name: ${eventData.eventName}, Date: ${eventData.startDate}, Location: ${eventData.location || 'TBD'}`;

      // 调用后端 AI API
      const result = await generateAIContent(
        'text_generation',
        fullPrompt,
        context
      );

      // 处理返回的 HTML 内容
      let text = result.data || '';
      // 清理可能的代码块标记
      text = text.replace(/```html/g, '').replace(/```/g, '').trim();
      
      // 更新描述
      updateData('description', text);
      if (editorRef.current) {
        editorRef.current.innerHTML = text;
        hasClearedDefaultTextRef.current = true; // AI 写入后标记为已清除默认文本
      }
      
      // 关闭 AI Writer 面板并清空输入
      setIsAIWriterOpen(false);
      setAiWriterPrompt('');
    } catch (error: any) {
      console.error('AI 生成失败:', error);
      // 显示错误提示
      alert(error.message || 'AI generation failed, please try again later');
    } finally {
      setIsWriting(false);
    }
  };

  const addQuestion = () => {
    // 在添加新问题前，保存当前状态作为备份（如果还没有备份或当前状态与备份不同）
    if (questionsBackup.length === 0 || JSON.stringify(questionsBackup) !== JSON.stringify(eventData.questions)) {
      setQuestionsBackup([...eventData.questions]);
    }
    
    const newId = `q_${Date.now()}`;
    updateData('questions', [...eventData.questions, {
      id: newId,
      label: '',
      required: true, // 默认是必填项
      fixed: false,
      saveToTemplate: true
    }]);
    setHasUnsavedQuestions(true); // 标记有未保存的问题
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    updateData('questions', eventData.questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (id: string) => {
    updateData('questions', eventData.questions.filter(q => q.id !== id));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!eventData.eventName || !eventData.eventName.trim()) {
      setSubmitError('Please enter an event title');
      return;
    }

    if (!eventData.startDate || !eventData.startTime) {
      setSubmitError('Please select event start date and time');
      return;
    }

    if (!eventData.endDate || !eventData.endTime) {
      setSubmitError('Please select event end date and time');
      return;
    }

    if (!eventData.isVirtual && !eventData.location) {
      setSubmitError('Please enter event location or select virtual event');
      return;
    }

    if (eventData.isVirtual && !eventData.meetingLink) {
      setSubmitError('Please enter meeting link');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 🔧 在提交时，直接从编辑器获取最新的描述内容
      const currentDescription = editorRef.current?.innerHTML || eventData.description;
      
      const eventDataWithLocationPublic = {
        ...eventData,
        description: currentDescription, // 使用编辑器中的最新内容
        isLocationPublic
      };
      
      // 直接使用 editEventId 判断是否为编辑模式，不依赖 isEditMode 状态
      if (editEventId) {
        // 编辑模式：调用更新接口
        // 注意：需要将前端格式转换为后端更新格式
        const updatePayload: any = {
          title: eventDataWithLocationPublic.eventName,
          cover_image_url: eventDataWithLocationPublic.coverImage,
          description: eventDataWithLocationPublic.description, // 这里会使用最新的描述
          visibility: eventDataWithLocationPublic.visibility,
          require_approval: eventDataWithLocationPublic.requireApproval,
        };

        // 处理时间（需要转换为 UTC ISO 格式）
        // 根据时区转换时间：将指定时区的本地时间转换为 UTC
        const combineDateTime = (date: string, time: string, timezone: string): string => {
          // 解析日期和时间部分
          const dateParts = date.split('-');
          const timeParts = time.split(':');
          const year = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1; // 月份从 0 开始
          const day = parseInt(dateParts[2]);
          const hour = parseInt(timeParts[0]);
          const minute = parseInt(timeParts[1] || '0');
          
          // 方法：使用迭代来找到正确的 UTC 时间
          // 1. 创建一个 UTC 日期，表示我们想要的本地时间（作为初始猜测）
          // 2. 使用 Intl.DateTimeFormat 获取这个 UTC 时间在指定时区的本地时间
          // 3. 比较并调整，直到匹配
          
          // 初始猜测：假设 UTC 时间就是 (year, month, day, hour, minute)
          let guessUtc = new Date(Date.UTC(year, month, day, hour, minute));
          
          // 使用 Intl.DateTimeFormat 来获取这个 UTC 时间在指定时区的本地时间
          const tzFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          
          // 迭代调整，直到找到正确的 UTC 时间（最多 5 次迭代）
          for (let i = 0; i < 5; i++) {
            const tzParts = tzFormatter.formatToParts(guessUtc);
            const tzYear = parseInt(tzParts.find(p => p.type === 'year')?.value || '0');
            const tzMonth = parseInt(tzParts.find(p => p.type === 'month')?.value || '0') - 1;
            const tzDay = parseInt(tzParts.find(p => p.type === 'day')?.value || '0');
            const tzHour = parseInt(tzParts.find(p => p.type === 'hour')?.value || '0');
            const tzMinute = parseInt(tzParts.find(p => p.type === 'minute')?.value || '0');
            
            // 比较指定时区的本地时间和我们想要的本地时间
            if (tzYear === year && tzMonth === month && tzDay === day && tzHour === hour && tzMinute === minute) {
              // 找到了！返回这个 UTC 时间
              return guessUtc.toISOString();
            }
            
            // 计算差异（以分钟为单位）
            const tzDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute));
            const targetDate = new Date(Date.UTC(year, month, day, hour, minute));
            const diffMinutes = (targetDate.getTime() - tzDate.getTime()) / (60 * 1000);
            
            // 调整 UTC 时间：如果时区的本地时间比目标时间小，说明 UTC 时间需要增加
            guessUtc = new Date(guessUtc.getTime() + diffMinutes * 60 * 1000);
          }
          
          // 如果迭代失败，使用最后一次猜测
          return guessUtc.toISOString();
        };

        const startAt = combineDateTime(
          eventDataWithLocationPublic.startDate,
          eventDataWithLocationPublic.startTime,
          eventDataWithLocationPublic.selectedTimezone.id
        );
        const endAt = combineDateTime(
          eventDataWithLocationPublic.endDate,
          eventDataWithLocationPublic.endTime,
          eventDataWithLocationPublic.selectedTimezone.id
        );

        updatePayload.start_at = startAt;
        updatePayload.end_at = endAt;
        updatePayload.timezone = eventDataWithLocationPublic.selectedTimezone.id;

        // 处理 location_info
        if (eventDataWithLocationPublic.isVirtual) {
          updatePayload.location_info = {
            type: 'virtual',
            link: eventDataWithLocationPublic.meetingLink,
            isPublic: isLocationPublic
          };
        } else {
          updatePayload.location_info = {
            type: 'offline',
            name: eventDataWithLocationPublic.location,
            isPublic: isLocationPublic
          };
          if (eventDataWithLocationPublic.locationCoordinates) {
            updatePayload.location_info.coordinates = {
              lat: eventDataWithLocationPublic.locationCoordinates.lat,
              lng: eventDataWithLocationPublic.locationCoordinates.lng
            };
            if (eventDataWithLocationPublic.locationCoordinates.placeId) {
              updatePayload.location_info.place_id = eventDataWithLocationPublic.locationCoordinates.placeId;
            }
          }
        }

        // 处理 ticket_config
        updatePayload.ticket_config = {
          tickets: eventDataWithLocationPublic.tickets.map(t => ({
            id: t.id.toString(),
            name: t.name,
            type: t.type,
            price: t.type === 'paid' ? (t.price ? parseFloat(t.price) : 0) : '',
            quantity: t.quantity || '',
            requireApproval: t.requireApproval
          }))
        };

        // 处理 registration_fields
        updatePayload.registration_fields = eventDataWithLocationPublic.questions.map(q => ({
          id: q.id,
          label: q.label,
          required: q.required,
          fixed: q.fixed
        }));

        // 处理 co_hosts
        updatePayload.co_hosts = eventDataWithLocationPublic.coHosts.map(ch => ({
          id: ch.id,
          name: ch.name,
          email: ch.email
        }));

        // 处理 style_config
        updatePayload.style_config = {
          themeId: eventDataWithLocationPublic.selectedTheme.id,
          effect: eventDataWithLocationPublic.selectedEffect,
          colors: {
            bg: eventDataWithLocationPublic.selectedTheme.bg,
            contentBg: eventDataWithLocationPublic.selectedTheme.contentBg,
            text: eventDataWithLocationPublic.selectedTheme.text,
            button: eventDataWithLocationPublic.selectedTheme.button
          }
        };

        await updateEvent(editEventId, updatePayload);
        router.push(`/manager/event?id=${editEventId}`);
      } else {
        // 创建模式：调用创建接口
        // 构建包含坐标的完整数据
        const createPayload: any = {
          eventName: eventDataWithLocationPublic.eventName,
          coverImage: eventDataWithLocationPublic.coverImage,
          startDate: eventDataWithLocationPublic.startDate,
          startTime: eventDataWithLocationPublic.startTime,
          endDate: eventDataWithLocationPublic.endDate,
          endTime: eventDataWithLocationPublic.endTime,
          location: eventDataWithLocationPublic.location,
          description: eventDataWithLocationPublic.description,
          tickets: eventDataWithLocationPublic.tickets,
          questions: eventDataWithLocationPublic.questions,
          host: eventDataWithLocationPublic.host,
          coHosts: eventDataWithLocationPublic.coHosts,
          selectedTheme: eventDataWithLocationPublic.selectedTheme,
          selectedEffect: eventDataWithLocationPublic.selectedEffect,
          selectedTimezone: eventDataWithLocationPublic.selectedTimezone,
          visibility: eventDataWithLocationPublic.visibility,
          isVirtual: eventDataWithLocationPublic.isVirtual,
          meetingLink: eventDataWithLocationPublic.meetingLink,
          requireApproval: eventDataWithLocationPublic.requireApproval,
          isLocationPublic: isLocationPublic,
        };
        
        // 添加坐标信息（如果有）
        if (eventDataWithLocationPublic.locationCoordinates) {
          createPayload.locationCoordinates = {
            lat: eventDataWithLocationPublic.locationCoordinates.lat,
            lng: eventDataWithLocationPublic.locationCoordinates.lng,
            placeId: eventDataWithLocationPublic.locationCoordinates.placeId,
            formattedAddress: eventDataWithLocationPublic.locationCoordinates.formattedAddress,
            displayText: eventDataWithLocationPublic.locationCoordinates.displayText,
            subtitle: eventDataWithLocationPublic.locationCoordinates.subtitle,
            venueName: eventDataWithLocationPublic.locationCoordinates.venueName,
            streetAddress: eventDataWithLocationPublic.locationCoordinates.streetAddress,
            city: eventDataWithLocationPublic.locationCoordinates.city,
            state: eventDataWithLocationPublic.locationCoordinates.state,
            country: eventDataWithLocationPublic.locationCoordinates.country,
            postalCode: eventDataWithLocationPublic.locationCoordinates.postalCode,
          };
        }
        
        const result = await createEvent(createPayload);
        if (result.id) {
          router.push(`/manager/event?id=${result.id}`);
        } else {
          router.push('/manager/event');
        }
      }
    } catch (error: any) {
      setSubmitError(error.message || `${isEditMode ? 'Update' : 'Create'} event failed, please try again later`);
      setIsSubmitting(false);
    }
  };


  // AI对话相关函数
  const handleAIChatSend = async () => {
    if (!aiChatInput.trim() || isAIChatLoading) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: aiChatInput.trim(),
      timestamp: new Date()
    };

    setAiChatMessages(prev => [...prev, userMessage]);
    setAiChatInput('');
    setIsAIChatLoading(true);

    // Simulate AI response (should call API in production)
    setTimeout(() => {
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant' as const,
        content: `I understand your question: "${userMessage.content}". As your AI assistant, I can help you optimize event descriptions, suggest event themes, or answer any questions about event creation. How can I assist you?`,
        timestamp: new Date()
      };
      setAiChatMessages(prev => [...prev, assistantMessage]);
      setIsAIChatLoading(false);
    }, 1000);
  };

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          setAiChatInput(prev => prev + `\n[Image file: ${file.name}] Extract event information from this image.`);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((text) => {
          // Check if it's a URL
          if (text.match(/^https?:\/\//)) {
            setAiChatInput(prev => prev + (prev ? '\n' : '') + `Import event details from this link: ${text}`);
          } else {
            setAiChatInput(prev => prev + (prev ? '\n' : '') + `Please help me fill in the event details from this information:\n${text}`);
          }
        });
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      setAiChatInput(prev => prev + (prev ? '\n' : '') + `Extract event information from this poster image: ${file.name}`);
    } else {
      setAiChatInput(prev => prev + (prev ? '\n' : '') + `Please process this file: ${file.name}`);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      handleFileUpload(file);
    });
  };

  // Handle icon button clicks
  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (text.match(/^https?:\/\//)) {
          setAiChatInput(prev => prev + (prev ? '\n' : '') + `Import event details from this link: ${text}`);
        } else {
          setAiChatInput(prev => prev + (prev ? '\n' : '') + `Please help me fill in the event details from this information:\n${text}`);
        }
        aiChatInputRef.current?.focus();
      }
    } catch (err) {
      // Fallback: focus input and let user paste manually
      aiChatInputRef.current?.focus();
    }
  };

  const handleUrlClick = () => {
    const url = prompt('Enter event URL to import:');
    if (url) {
      setAiChatInput(prev => prev + (prev ? '\n' : '') + `Import event details from this link: ${url}`);
      aiChatInputRef.current?.focus();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 滚动到底部
  useEffect(() => {
    if (aiChatMessagesEndRef.current) {
      aiChatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatMessages, isAIChatLoading]);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aiChatRef.current && !aiChatRef.current.contains(event.target as Node)) {
        // 不自动关闭，让用户手动控制
      }
    }
    if (isAIChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAIChatOpen]);

  // 添加数据转换函数
  const transformBackendDataToFormData = (backendData: any): EventData => {
    // 解析开始和结束时间
    const startAt = backendData.start_at ? new Date(backendData.start_at) : null;
    const endAt = backendData.end_at ? new Date(backendData.end_at) : null;
    
    // 格式化日期和时间
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatTime = (date: Date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    // 处理 location_info
    const locationInfo = backendData.location_info || {};
    const isVirtual = locationInfo.type === 'virtual';
    const location = isVirtual ? '' : (locationInfo.name || '');
    const meetingLink = isVirtual ? (locationInfo.link || '') : '';

    // 处理 locationCoordinates（如果有）
    let locationCoordinates: LocationCoordinates | undefined;
    if (locationInfo.coordinates) {
      locationCoordinates = {
        lat: locationInfo.coordinates.lat || 0,
        lng: locationInfo.coordinates.lng || 0,
        placeId: locationInfo.place_id,
        formattedAddress: locationInfo.name
      };
    }

    // 处理 tickets
    const tickets: Ticket[] = [];
    if (backendData.ticket_config?.tickets) {
      backendData.ticket_config.tickets.forEach((ticket: any, index: number) => {
        tickets.push({
          id: index + 1,
          name: ticket.name || 'General Admission',
          type: ticket.type === 'paid' ? 'paid' : 'free',
          price: ticket.type === 'paid' ? String(ticket.price || '') : '',
          quantity: ticket.quantity ? String(ticket.quantity) : '',
          requireApproval: ticket.requireApproval || false,
          saveToTemplate: false
        });
      });
    }
    if (tickets.length === 0) {
      tickets.push({
        id: 1,
        name: 'General Admission',
        type: 'free',
        price: '',
        quantity: '',
        requireApproval: false,
        saveToTemplate: true
      });
    }

    // 处理 questions (registration_fields)
    const questions: Question[] = [];
    if (backendData.registration_fields) {
      backendData.registration_fields.forEach((field: any) => {
        questions.push({
          id: field.id || `field_${Date.now()}`,
          label: field.label || '',
          required: field.required || false,
          fixed: field.fixed || false,
          saveToTemplate: false
        });
      });
    }
    if (questions.length === 0) {
      questions.push(
        { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
        { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
      );
    }

    // 处理 theme
    const styleConfig = backendData.style_config || {};
    const themeId = styleConfig.themeId || 'default';
    let selectedTheme = THEME_OPTIONS.find(t => t.id === themeId) as Theme;
    if (!selectedTheme) {
      selectedTheme = THEME_OPTIONS[0] as Theme;
    }

    // 处理 effect
    const selectedEffect = styleConfig.effect || 'none';

    // 处理 timezone
    const timezoneId = backendData.timezone || 'UTC';
    let selectedTimezone = TIMEZONES.find(t => t.id === timezoneId);
    if (!selectedTimezone) {
      selectedTimezone = TIMEZONES[0];
    }

    // 处理 host
    let host: { id: string; name: string; type: string; icon: any } = HOST_PROFILES[0];
    if (backendData.host?.id) {
      const hostProfile = HOST_PROFILES.find(h => h.id === backendData.host.id);
      if (hostProfile) {
        host = hostProfile;
      } else {
        // 如果找不到匹配的 host profile，创建一个默认的
        host = {
          id: backendData.host.id,
          name: backendData.host.full_name || backendData.host.email || 'Host',
          type: 'personal',
          icon: UserCircle
        };
      }
    }

    // 处理 coHosts
    const coHosts: any[] = [];
    if (backendData.co_hosts_info) {
      backendData.co_hosts_info.forEach((coHost: any) => {
        coHosts.push({
          id: coHost.id,
          name: coHost.full_name || coHost.email || 'Unknown',
          email: coHost.email
        });
      });
    }
    // 也处理 co_hosts（只有 name 和 email 的）
    if (backendData.co_hosts) {
      backendData.co_hosts.forEach((coHost: any) => {
        if (coHost.name && coHost.email) {
          // 检查是否已存在
          const exists = coHosts.some(ch => ch.email === coHost.email);
          if (!exists) {
            coHosts.push({
              id: coHost.id || `cohost_${Date.now()}`,
              name: coHost.name,
              email: coHost.email
            });
          }
        }
      });
    }

    return {
      eventName: backendData.title || '',
      coverImage: backendData.cover_image_url || MOCK_IMAGES.featured[0].url,
      startDate: startAt ? formatDate(startAt) : '2025-11-19',
      startTime: startAt ? formatTime(startAt) : '20:00',
      endDate: endAt ? formatDate(endAt) : '2025-11-19',
      endTime: endAt ? formatTime(endAt) : '21:00',
      location,
      locationCoordinates,
      description: backendData.description || '<p style="color: #94a3b8;">Enter a description...</p>',
      tickets,
      questions,
      host,
      coHosts,
      selectedTheme,
      selectedEffect,
      selectedTimezone,
      visibility: backendData.visibility || 'public',
      isVirtual,
      meetingLink,
      requireApproval: backendData.require_approval || false
    };
  };

  // 添加加载活动数据的 useEffect
  useEffect(() => {
    const loadEventData = async () => {
      if (!editEventId) {
        return;
      }

      setIsEditMode(true);

      try {
        const backendData = await getEvent(editEventId);
        const formData = transformBackendDataToFormData(backendData);
        setEventData(formData);
        
        // 设置 isLocationPublic
        const locationInfo = backendData.location_info || {};
        setIsLocationPublic(locationInfo.isPublic !== undefined ? locationInfo.isPublic : true);
        
        // 设置 Optional Settings
        setEventPublic(backendData.visibility === 'public');
        setRequireApprovalSetting(backendData.require_approval || false);
        
        // 设置 questions backup
        setQuestionsBackup([...formData.questions]);
        
        // 设置 tickets backup
        setTicketsBackup([...formData.tickets]);

        // 设置编辑器内容
        if (editorRef.current && formData.description) {
          editorRef.current.innerHTML = formData.description;
          hasClearedDefaultTextRef.current = true; // 编辑模式下已经清除默认文本
        }
      } catch (error) {
        setSubmitError('load event data failed, please try again later');
      }
    };

    loadEventData();
  }, [editEventId]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${eventData.selectedTheme.bg} ${eventData.selectedTheme.text || 'text-slate-900'}`}>
      <BgBlobs />
      <EffectLayer effect={eventData.selectedEffect} />
      <Navbar 
        variant="default" 
        showTime={false}
        currentView="events"
        canAccessCommunity={canAccessCommunity || false}
        canAccessDiscover={canAccessDiscover || false}
        onCreateEventClick={handleCreateButtonClick}
        onViewChange={(view) => {
          router.push(`/home?view=${view}`);
        }}
      />

      <ImagePickerModal 
        isOpen={isImagePickerOpen} 
        onClose={() => setIsImagePickerOpen(false)} 
        activeTab={imagePickerTab} 
        onTabChange={setImagePickerTab} 
        selectedCategory={'featured'} 
        onCategoryChange={() => {}} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        aiPrompt={aiImagePrompt} 
        onAiPromptChange={setAiImagePrompt} 
        isGenerating={isGeneratingImage} 
        generatedImage={aiGeneratedImage} 
        onGenerate={async () => {
          if (!aiImagePrompt.trim()) return;

          setIsGeneratingImage(true);
          try {
            // 调用后端 AI 图片生成接口
            const result = await generateAIContent(
              'image_generation',
              aiImagePrompt.trim(),
              {
                eventName: eventData.eventName,
                eventType: 'cover_image',
              }
            );

            // 处理返回的图片 URL
            // 后端返回格式: { success: true, data: { image_url: "...", provider: "...", ... }, message: "...", quota: {...} }
            // 或者兼容格式: { success: true, data: "...", ... } (直接返回 URL)
            let imageUrl = '';

            if (result.data && typeof result.data === 'object') {
              // 新格式：result.data 是包含 image_url 的对象
              imageUrl = result.data.image_url || '';
            } else if (typeof result.data === 'string') {
              // 兼容格式：result.data 直接是 URL 字符串
              imageUrl = result.data;
            }

            // 如果是 base64 数据，转换为 data URL
            if (imageUrl.startsWith('data:image')) {
              setAiGeneratedImage(imageUrl);
            } else if (imageUrl.startsWith('http')) {
              setAiGeneratedImage(imageUrl);
            } else {
              // 如果没有返回有效的图片 URL，显示提示
              console.warn('Image generation did not return a valid image URL:', result);
              setAiGeneratedImage(null);
              alert('Image generation service is not configured. Please configure STABILITY_API_KEY, OPENAI_API_KEY, or REPLICATE_API_KEY in the API gateway environment.');
            }
          } catch (error: any) {
            console.error('AI image generation failed:', error);
            alert(error.message || 'AI image generation failed, please try again later');
          } finally {
            setIsGeneratingImage(false);
          }
        }} 
        onSelectImage={(url) => {
          updateData('coverImage', url);
          setIsImagePickerOpen(false);
        }} 
      />

      <main className="max-w-6xl mx-auto pt-16 sm:pt-20 md:pt-24 pb-32 sm:pb-48 md:pb-64 px-4 sm:px-6 md:px-12 lg:px-20 relative z-10">
        {/* Host Selection and Visibility */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm transition-all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Host Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-slate-500" /> Host Identity
                </label>
                <div className="relative" data-host-selector>
                  <button
                    ref={hostSelectorButtonRef}
                    onClick={() => setIsHostSelectorOpen(!isHostSelectorOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-[#FF6B3D] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {eventData.host.icon && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <eventData.host.icon className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{eventData.host.name}</div>
                        <div className="text-xs text-slate-500">{eventData.host.type === 'personal' ? 'Personal' : 'Organization'}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isHostSelectorOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isHostSelectorOpen && typeof window !== 'undefined' && hostSelectorButtonRef.current && createPortal(
                    <div 
                      ref={hostSelectorDropdownRef}
                      className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[9999] max-h-60 overflow-y-auto"
                      style={{
                        top: `${hostSelectorButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 8}px`,
                        left: `${hostSelectorButtonRef.current.getBoundingClientRect().left + window.scrollX}px`,
                        width: `${hostSelectorButtonRef.current.getBoundingClientRect().width}px`
                      }}
                    >
                      {HOST_PROFILES.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            updateData('host', profile);
                            setIsHostSelectorOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            eventData.host.id === profile.id
                              ? 'bg-orange-50 text-[#FF6B3D]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <profile.icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-sm">{profile.name}</div>
                            <div className="text-xs text-slate-500">{profile.type === 'personal' ? 'Personal' : 'Organization'}</div>
                          </div>
                          {eventData.host.id === profile.id && (
                            <Check className="w-4 h-4 text-[#FF6B3D]" />
                          )}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
                </div>
              </div>

              {/* Visibility Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-slate-500" /> Event Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateData('visibility', 'public');
                      setEventPublic(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      eventData.visibility === 'public'
                        ? 'bg-orange-50 border-[#FF6B3D] text-[#FF6B3D]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="font-semibold text-sm">Public</span>
                  </button>
                  <button
                    onClick={() => {
                      updateData('visibility', 'private');
                      setEventPublic(false);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      eventData.visibility === 'private'
                        ? 'bg-orange-50 border-[#FF6B3D] text-[#FF6B3D]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="font-semibold text-sm">Private</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Event Title */}
        <div className="mb-6 sm:mb-10">
          <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-orange-50 text-orange-500 flex-shrink-0">
                <Type className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  Event Title
                </label>
                <Input 
                  type="text" 
                  placeholder="Enter your event title..." 
                  className={`w-full text-xl sm:text-2xl md:text-3xl font-bold font-brand bg-transparent border-none focus:ring-0 placeholder-slate-400 leading-tight tracking-tight ${eventData.selectedTheme.text} h-auto py-2 px-0`}
                  value={eventData.eventName} 
                  onChange={(e) => updateData('eventName', e.target.value)}
                  onFocus={(e) => {
                    // Select all text for easy editing
                    e.target.select();
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Cover Image */}
            <div 
              className="group relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 shadow-xl sm:shadow-2xl shadow-slate-200/50 border border-white transition-all cursor-pointer hover:shadow-orange-500/10" 
              onClick={() => setIsImagePickerOpen(true)}
            >
              <img src={eventData.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/20 transition-all flex items-center justify-center">
                <Button className="group bg-white/90 backdrop-blur-md text-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold shadow-lg transform transition-all flex items-center gap-2 text-xs sm:text-sm hover:scale-105 active:scale-95 hover:bg-[#FF6B3D] hover:text-white focus:bg-[#FF6B3D] focus:text-white focus:ring-2 focus:ring-[#FF6B3D]/50 active:bg-[#FF6B3D] active:text-white h-auto">
                  <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF6B3D] group-hover:text-white group-focus:text-white group-active:text-white transition-colors" /> <span className="hidden sm:inline">Change Cover</span><span className="sm:hidden">Change</span>
                </Button>
              </div>
            </div>

            {/* Schedule */}
            <Schedule
              startDate={eventData.startDate}
              startTime={eventData.startTime}
              endDate={eventData.endDate}
              endTime={eventData.endTime}
              selectedTimezone={eventData.selectedTimezone}
              onStartDateChange={(date) => updateData('startDate', date)}
              onStartTimeChange={(time) => updateData('startTime', time)}
              onEndDateChange={(date) => updateData('endDate', date)}
              onEndTimeChange={(time) => updateData('endTime', time)}
              onTimezoneChange={(timezone) => updateData('selectedTimezone', timezone)}
            />

            {/* Location */}
            <LocationMap
              location={eventData.location}
              locationCoordinates={eventData.locationCoordinates}
              isVirtual={eventData.isVirtual}
              meetingLink={eventData.meetingLink}
              isLocationPublic={isLocationPublic}
              savedLocations={savedLocations}
              onLocationChange={(location) => updateData('location', location)}
              onCoordinatesChange={(coordinates) => updateData('locationCoordinates', coordinates)}
              onVirtualChange={(isVirtual) => {
                updateData('isVirtual', isVirtual);
                if (!isVirtual) {
                          updateData('meetingLink', '');
                }
              }}
              onMeetingLinkChange={(meetingLink) => updateData('meetingLink', meetingLink)}
              onLocationPublicChange={setIsLocationPublic}
              onSaveLocation={handleSaveLocation}
            />

            {/* Description Editor */}
            <div className={`bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all flex flex-col ${isEditorFocused ? 'ring-2 ring-[#FF6B3D]/20 shadow-md' : ''}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <AlignLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Description
                </h3>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Formatting Toolbar */}
                  <div className="flex bg-slate-100/50 rounded-lg p-0.5 sm:p-1 items-center">
                    <Button 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => toggleFormatBlock('H1')} 
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-[10px] sm:text-xs font-bold text-slate-500 hover:text-[#FF6B3D]"
                    >
                      H1
                    </Button>
                    <Button 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => toggleFormatBlock('H2')} 
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-[10px] sm:text-xs font-bold text-slate-500 hover:text-[#FF6B3D]"
                    >
                      H2
                    </Button>
                    <Button 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => toggleFormatBlock('H3')} 
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-[10px] sm:text-xs font-bold text-slate-500 hover:text-[#FF6B3D]"
                    >
                      H3
                    </Button>
                    <div className="w-px h-3 sm:h-4 bg-slate-300 mx-0.5 sm:mx-1"></div>
                    <Button 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => execCommand('bold')} 
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D]"
                    >
                      <Bold className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                    <Button 
                      onMouseDown={(e) => e.preventDefault()} 
                      onClick={() => execCommand('italic')} 
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D]"
                    >
                      <Italic className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                    <div className="relative">
                      <Button 
                        onMouseDown={openLinkInput} 
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 sm:w-8 sm:h-8 hover:bg-white rounded text-slate-500 hover:text-[#FF6B3D]" 
                        title="Add Link"
                      >
                        <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                      {showLinkInput && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 sm:p-3 z-50 flex gap-2 min-w-[200px] sm:min-w-[240px] animate-in zoom-in-95">
                          <Input 
                            type="text" 
                            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1 focus:ring-0 focus:border-slate-200 outline-none placeholder-slate-400 h-auto"
                            placeholder="https://..."
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && applyLink()}
                          />
                          <Button 
                            onMouseDown={(e) => e.preventDefault()} 
                            onClick={applyLink} 
                            className="bg-[#FF6B3D] text-white text-xs px-2 sm:px-3 py-1 rounded-lg font-bold h-auto"
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* AI Button */}
                  <Button 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsAIWriterOpen(!isAIWriterOpen)}
                    variant="ghost"
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all h-auto ${isAIWriterOpen ? 'bg-[#FFF0E6] text-[#FF6B3D]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">AI Magic</span><span className="sm:hidden">AI</span>
                  </Button>
                </div>
              </div>

              {/* AI Panel */}
              {isAIWriterOpen && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-[#FFF0E6]/50 rounded-xl sm:rounded-2xl border border-[#FF6B3D]/10 animate-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <Input 
                      className="flex-1 px-3 sm:px-4 py-2 bg-white rounded-xl text-xs sm:text-sm border-none focus:ring-0 outline-none text-slate-700 placeholder-slate-400 h-auto" 
                      placeholder="Describe what to write..."
                      value={aiWriterPrompt}
                      onChange={(e) => setAiWriterPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAIWrite()}
                      autoFocus
                    />
                    <Button 
                      onClick={handleAIWrite} 
                      disabled={isWriting || !aiWriterPrompt} 
                      className="px-3 sm:px-4 py-2 bg-[#FF6B3D] text-white rounded-xl font-bold text-xs hover:bg-[#E05D32] disabled:opacity-50 transition-colors h-auto"
                    >
                      {isWriting ? <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div 
                ref={editorRef} 
                contentEditable 
                className="prose prose-sm sm:prose-base md:prose-lg prose-slate max-w-none focus:outline-none min-h-[100px] sm:min-h-[120px] text-slate-600 text-sm sm:text-base" 
                data-placeholder="Write something amazing..."
                onFocus={() => {
                  setIsEditorFocused(true);
                  // 清除默认文本
                  if (editorRef.current) {
                    const currentContent = editorRef.current.innerHTML.trim();
                    const defaultText = '<p style="color: #94a3b8;">Enter a description...</p>';
                    const defaultTextAlt = '<p>Enter a description...</p>';
                    // 检查是否是默认文本（支持多种可能的格式）
                    if (currentContent === defaultText || 
                        currentContent === defaultTextAlt ||
                        currentContent === 'Enter a description...' ||
                        currentContent.replace(/\s/g, '') === '<p>Enteradescription...</p>') {
                      editorRef.current.innerHTML = '';
                      hasClearedDefaultTextRef.current = true;
                      updateData('description', '');
                      // 确保光标在正确位置
                      setTimeout(() => {
                        if (editorRef.current) {
                          const range = document.createRange();
                          const sel = window.getSelection();
                          range.selectNodeContents(editorRef.current);
                          range.collapse(true);
                          sel?.removeAllRanges();
                          sel?.addRange(range);
                        }
                      }, 0);
                    } else if (currentContent && currentContent !== '<p><br></p>' && currentContent !== '<br>') {
                      hasClearedDefaultTextRef.current = true; // 已经有内容，标记为已清除
                    }
                  }
                }} 
                onBlur={(e) => {
                  setIsEditorFocused(false);
                  // 在失去焦点时更新 eventData.description
                  if (editorRef.current) {
                    const content = editorRef.current.innerHTML.trim();
                    // 如果内容为空，恢复占位符效果
                    if (!content || content === '<p><br></p>' || content === '<br>') {
                      // 保持空内容，不设置默认文本，这样 placeholder 可以显示
                      updateData('description', '');
                    } else {
                      updateData('description', editorRef.current.innerHTML);
                    }
                  }
                }}
                suppressContentEditableWarning
              ></div>
            </div>

            {/* Tickets */}
            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm transition-all">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B3D]" /> Tickets
                </h3>
                <Button 
                  onClick={addTicket} 
                  disabled={eventData.tickets.length >= 5}
                  variant="outline"
                  className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors h-auto ${eventData.tickets.length >= 5 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-100 text-slate-600 hover:bg-[#FF6B3D] hover:text-white'}`}
                  title={eventData.tickets.length >= 5 ? 'Maximum 5 ticket types' : 'Add ticket type'}
                >
                  Add Type
                </Button>
              </div>
              <div className="space-y-3">
                {eventData.tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 group hover:border-orange-200 hover:bg-orange-50/30 transition-all"
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-2">
                      <Button 
                        onClick={() => updateTicketItem(ticket.id, 'requireApproval', !ticket.requireApproval)}
                        variant="outline"
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-center transition-all h-auto w-auto shrink-0 ${ticket.requireApproval ? 'bg-purple-100 text-purple-600 shadow-sm ring-1 ring-purple-200' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                        title={ticket.requireApproval ? "Approval Required" : "Direct Entry"}
                      >
                        {ticket.requireApproval ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> : <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </Button>

                      <div className="flex-1 relative min-w-0">
                        <Input 
                          type="text" 
                          className="bg-transparent border-none p-0 font-bold text-sm sm:text-base focus:ring-0 w-full text-slate-800 placeholder-slate-400 pr-7 sm:pr-8 h-9 sm:h-11" 
                          value={ticket.name} 
                          placeholder="General Admission"
                          onChange={(e) => updateTicketItem(ticket.id, 'name', e.target.value)}
                          onFocus={(e) => {
                            if (e.target.value === 'General Admission') {
                              updateTicketItem(ticket.id, 'name', '');
                              e.target.select();
                            }
                          }}
                        />
                        
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="p-1 sm:p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 popover-trigger transition-colors absolute right-0 top-1 sm:top-2 h-auto w-auto"
                          onClick={() => setActivePopover(activePopover === `ticket-${ticket.id}` ? null : `ticket-${ticket.id}`)}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>

                        {activePopover === `ticket-${ticket.id}` && (
                          <div ref={popoverRef} className="absolute top-8 right-0 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                            <div 
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => updateTicketItem(ticket.id, 'requireApproval', !ticket.requireApproval)}
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-medium text-slate-700">Require Approval</span>
                              </div>
                              <div className={`w-7 h-4 rounded-full relative transition-colors ${ticket.requireApproval ? 'bg-purple-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${ticket.requireApproval ? 'left-3.5' : 'left-0.5'}`}></div>
                              </div>
                            </div>

                            <div 
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                              onClick={() => updateTicketItem(ticket.id, 'saveToTemplate', !ticket.saveToTemplate)}
                            >
                              <div className="flex items-center gap-2">
                                <Save className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-medium text-slate-700">Save Template</span>
                              </div>
                              <div className={`w-7 h-4 rounded-full relative transition-colors ${ticket.saveToTemplate ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${ticket.saveToTemplate ? 'left-3.5' : 'left-0.5'}`}></div>
                              </div>
                            </div>
                            
                            <div className="h-px bg-slate-100 my-1"></div>
                            
                            <Button 
                              variant="ghost"
                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-xs font-medium justify-start h-auto"
                              onClick={() => removeTicketItem(ticket.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Price and Quantity Row */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 pl-0 sm:pl-[3.25rem]">
                      <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shrink-0 shadow-sm self-start">
                        <Button 
                          onClick={() => updateTicketItem(ticket.id, 'type', 'free')} 
                          variant="ghost"
                          className={`px-2 sm:px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors h-auto ${ticket.type === 'free' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          FREE
                        </Button>
                        <Button 
                          onClick={() => updateTicketItem(ticket.id, 'type', 'paid')} 
                          variant="ghost"
                          className={`px-2 sm:px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors h-auto ${ticket.type === 'paid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          $$$
                        </Button>
                      </div>
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {ticket.type === 'paid' && (
                            <div className="relative flex-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                              <Input 
                                type="number" 
                                className="block w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs sm:text-sm font-mono focus:ring-0 focus:border-slate-200 text-slate-600 placeholder-slate-400 h-auto" 
                                placeholder="0.00" 
                                value={ticket.price} 
                                onChange={(e) => updateTicketItem(ticket.id, 'price', e.target.value)}
                                onFocus={(e) => {
                                  // Select all text for easy editing
                                  e.target.select();
                                }}
                              />
                            </div>
                          )}
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
                            <Input 
                              type="number" 
                              className="block w-full bg-white border border-slate-200 rounded-lg pl-5 pr-2 py-1.5 text-xs sm:text-sm font-mono focus:ring-0 focus:border-slate-200 text-slate-600 placeholder-slate-400 h-auto" 
                              placeholder="1 or more" 
                              value={ticket.quantity} 
                              onChange={(e) => updateTicketItem(ticket.id, 'quantity', e.target.value)}
                              onFocus={(e) => {
                                // Select all text for easy editing
                                e.target.select();
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Save and Cancel buttons - only show when there are unsaved tickets */}
              {hasUnsavedTickets && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                  <Button 
                    onClick={() => {
                      // Cancel: restore from backup and remove unsaved tickets
                      updateData('tickets', [...ticketsBackup]);
                      setHasUnsavedTickets(false);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors h-auto"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      // Save: update backup to current state and mark as saved
                      setTicketsBackup([...eventData.tickets]);
                      setHasUnsavedTickets(false);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 text-xs font-bold text-[#FF6B3D] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors h-auto"
                  >
                    <Save className="w-4 h-4" /> Save
                  </Button>
                </div>
              )}
            </div>

            {/* Registration Questions */}
            <div className="bg-white/70 backdrop-blur-md border border-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm transition-all">
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Registration Questions
                </h3>
                <Button 
                  onClick={addQuestion}
                  variant="ghost"
                  className="flex items-center gap-1 text-xs font-bold text-[#FF6B3D] hover:bg-[#FFF0E6] px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors h-auto"
                >
                  <Plus className="w-3 h-3" /> <span className="hidden sm:inline">Add Question</span><span className="sm:hidden">Add</span>
                </Button>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {eventData.questions.map((q) => (
                  <div 
                    key={q.id} 
                    className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${q.fixed ? 'bg-slate-50 border-transparent' : 'bg-white border-slate-100 hover:border-orange-200 hover:shadow-sm'}`}
                  >
                    <div className="flex-1 min-w-0">
                      {q.fixed ? (
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-bold text-slate-500 text-xs sm:text-sm flex-1 truncate">{q.label}</span>
                          {q.required ? (
                            <span className="text-red-500 font-bold text-xs sm:text-sm shrink-0">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal text-[10px] sm:text-xs shrink-0">(optional)</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <Input 
                            type="text" 
                            className="flex-1 bg-transparent border-none p-0 text-xs sm:text-sm font-bold text-slate-800 focus:ring-0 placeholder-slate-400 h-auto min-w-0"
                            value={q.label}
                            placeholder="Enter question..."
                            onChange={(e) => updateQuestion(q.id, 'label', e.target.value)}
                            onFocus={(e) => {
                              // Select all text for easy editing
                              e.target.select();
                            }}
                          />
                          {q.required ? (
                            <span className="text-red-500 font-bold text-xs sm:text-sm shrink-0">*</span>
                          ) : (
                            <span className="text-slate-400 font-normal text-[10px] sm:text-xs shrink-0">(optional)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 relative shrink-0">
                      <Button 
                        variant="ghost"
                        size="icon"
                        className={`p-1.5 sm:p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 popover-trigger transition-colors h-auto w-auto ${q.fixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !q.fixed && setActivePopover(activePopover === `question-${q.id}` ? null : `question-${q.id}`)}
                        disabled={q.fixed}
                      >
                        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>

                      {activePopover === `question-${q.id}` && !q.fixed && (
                        <div ref={popoverRef} className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95">
                          <div 
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                            onClick={() => updateQuestion(q.id, 'required', !q.required)}
                          >
                            <span className="text-xs font-medium text-slate-700">Required</span>
                            <div className={`w-7 h-4 rounded-full relative transition-colors ${q.required ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}>
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${q.required ? 'left-3.5' : 'left-0.5'}`}></div>
                            </div>
                          </div>
                          
                          <div className="h-px bg-slate-100 my-1"></div>
                          
                          <Button 
                            variant="ghost"
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-xs font-medium justify-start h-auto"
                            onClick={() => removeQuestion(q.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Save and Cancel buttons - only show when there are unsaved questions */}
              {hasUnsavedQuestions && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                  <Button 
                    onClick={() => {
                      // Cancel: restore from backup and remove unsaved questions
                      updateData('questions', [...questionsBackup]);
                      setHasUnsavedQuestions(false);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors h-auto"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      // Save: update backup to current state and mark as saved
                      setQuestionsBackup([...eventData.questions]);
                      setHasUnsavedQuestions(false);
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 text-xs font-bold text-[#FF6B3D] hover:bg-[#FFF0E6] px-4 py-2 rounded-lg transition-colors h-auto"
                  >
                    <Save className="w-4 h-4" /> Save
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
        
        {/* Spacer to avoid overlap with floating CTA */}
        <div className="h-32 md:h-40" aria-hidden="true"></div>

        {/* Floating CTA */}
        <div className="fixed bottom-4 sm:bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-[calc(100vw-2rem)] sm:max-w-none px-4 sm:px-0">
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium shadow-lg max-w-full">
                {submitError}
              </div>
            )}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setIsPreviewOpen(true)}
                variant="outline"
                className="px-3 sm:px-5 py-2 sm:py-3 rounded-full font-bold text-xs sm:text-sm shadow-lg bg-white/80 text-slate-700 border border-white/60 hover:bg-white transition h-auto flex-1 sm:flex-initial"
              >
                Preview
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 rounded-full font-bold text-sm sm:text-base md:text-lg shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 flex items-center gap-2 sm:gap-3 border-4 border-white/20 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed h-auto flex-1 sm:flex-initial ${eventData.selectedTheme.button}`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">Creating</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Launch Event</span>
                    <span className="sm:hidden">Launch</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <AIAssistant
          eventData={{
            eventName: eventData.eventName,
            selectedTheme: eventData.selectedTheme,
            selectedEffect: eventData.selectedEffect,
          }}
          onThemeChange={(theme) => updateData('selectedTheme', theme)}
          onEffectChange={(effect) => updateData('selectedEffect', effect)}
          onEventDataUpdate={(importedData) => {
            // 批量更新所有活动数据字段
            setEventData(prev => ({
              ...prev,
              ...importedData
            }));
            // 如果编辑器存在，更新描述
            if (editorRef.current) {
              editorRef.current.innerHTML = importedData.description || '';
              if (importedData.description) {
                hasClearedDefaultTextRef.current = true; // AI 导入数据后标记为已清除默认文本
              }
            }
          }}
          settings={{
            saveTickets,
            saveLocation,
            saveQuestions,
            eventPublic,
            locationPublic: isLocationPublic,
            requireApproval: eventData.requireApproval,
            onSaveTicketsChange: setSaveTickets,
            onSaveLocationChange: setSaveLocation,
            onSaveQuestionsChange: setSaveQuestions,
            onEventPublicChange: (value: boolean) => {
              setEventPublic(value);
              updateData('visibility', value ? 'public' : 'private');
            },
            onLocationPublicChange: (value: boolean) => {
              setLocationPublicSetting(value);
              setIsLocationPublic(value);
            },
            onRequireApprovalChange: (value: boolean) => {
              setRequireApprovalSetting(value);
              updateData('requireApproval', value);
            },
          }}
        />
        
        {/* 确认对话框 */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setPendingNavigation(null);
          }}
          onConfirm={() => {
            if (pendingNavigation) {
              pendingNavigation();
            }
          }}
          title="Start a New Event?"
          message="You have unsaved changes. Starting a new event will discard your current work. Are you sure you want to continue?"
          confirmText="Start New Event"
          cancelText="Cancel"
        />
        {isPreviewOpen && (() => {
          // 格式化日期时间
          const formatDateTime = (date: string, time: string, timezone: string): { date: string; time: string } => {
            try {
              const dateTimeStr = `${date}T${time}`;
              const localDate = new Date(dateTimeStr);
              
              // 格式化日期
              const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              };
              const dateStr = localDate.toLocaleDateString('en-US', dateOptions);
              
              // 格式化时间
              const timeOptions: Intl.DateTimeFormatOptions = {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              };
              const timeStr = localDate.toLocaleTimeString('en-US', timeOptions);
              
              return { date: dateStr, time: timeStr };
            } catch (error) {
              return { date: date || 'TBD', time: time || 'TBD' };
            }
          };

          const startDateTime = formatDateTime(eventData.startDate, eventData.startTime, eventData.selectedTimezone.id);
          const endDateTime = formatDateTime(eventData.endDate, eventData.endTime, eventData.selectedTimezone.id);
          const timeRange = `${startDateTime.time} - ${endDateTime.time}`;
          
          // 获取地点信息
          const locationDisplay = eventData.isVirtual 
            ? (eventData.meetingLink || 'Virtual Event')
            : (eventData.location || 'Location TBD');
          const cityDisplay = eventData.isVirtual ? 'Online' : (eventData.locationCoordinates?.city || 'TBD');

          // 获取样式配置
          const bgClass = eventData.selectedTheme.bg;
          const textClass = eventData.selectedTheme.text || 'text-slate-900';
          const buttonClass = eventData.selectedTheme.button;
          const contentBgClass = eventData.selectedTheme.contentBg || 'bg-white/90 backdrop-blur-xl border border-white';

          return (
            <div 
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={(e) => {
                // 点击背景区域关闭预览
                if (e.target === e.currentTarget) {
                  setIsPreviewOpen(false);
                }
              }}
            >
              <div className="min-h-full flex items-start justify-center p-3 sm:p-4 md:p-6 pt-24 sm:pt-28 md:pt-32">
                <div 
                  className={`w-full max-w-6xl ${bgClass} ${textClass} font-sans relative rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden`}
                  onClick={(e) => {
                    // 阻止点击内容区域时关闭预览
                    e.stopPropagation();
                  }}
                >
                  {/* Effect Layer */}
                  {eventData.selectedEffect && eventData.selectedEffect !== 'none' && (
                    <EffectLayer effect={eventData.selectedEffect} />
                  )}

                  {/* Header */}
                  <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">Live Preview</div>
                      <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">This is how your event will look when published</div>
                    </div>
                    <Button
                      onClick={() => setIsPreviewOpen(false)}
                      variant="outline"
                      className="px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 h-auto shrink-0 ml-2"
                    >
                      Close
                    </Button>
                  </div>

                  {/* Main Content */}
                  <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16 items-start">
                    
                    {/* Left Column (5/12) */}
                    <div className="lg:col-span-5 space-y-6 sm:space-y-8">
                      {/* Cover Image */}
                      <div className={`group relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 ring-1 ring-slate-100 ${contentBgClass}`}>
                        <img 
                          src={eventData.coverImage || "https://images.pexels.com/photos/2833037/pexels-photo-2833037.jpeg?auto=compress&cs=tinysrgb&w=800"} 
                          alt="Event Cover" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                          <p className="text-white/90 text-xs sm:text-sm font-medium mb-1">Presented by</p>
                          <p className="text-white font-brand font-bold text-lg sm:text-xl">{eventData.host.name}</p>
                        </div>
                      </div>

                      {/* Hosts */}
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className={`font-brand font-bold text-base sm:text-lg ${textClass}`}>Hosted By</h3>
                        <div className="flex flex-col gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                            {eventData.host.icon && (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
                                <eventData.host.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-xs sm:text-sm group-hover:text-[#FF6B3D] transition-colors truncate ${textClass}`}>{eventData.host.name}</p>
                              <p className="text-slate-400 text-[10px] sm:text-xs">Host</p>
                            </div>
                          </div>
                          {eventData.coHosts.map((coHost, idx) => (
                            <div key={idx} className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm">
                                <UserCircle className="w-5 h-5 text-slate-600" />
                              </div>
                              <div>
                                <p className={`font-semibold text-sm group-hover:text-[#FF6B3D] transition-colors ${textClass}`}>{coHost.name}</p>
                                <p className="text-slate-400 text-xs">Co-host</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7/12) */}
                    <div className="lg:col-span-7 relative">
                      {/* Header Area */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">{cityDisplay}</span>
                          {eventData.tickets.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6B3D] text-xs font-semibold border border-orange-100 flex items-center gap-1">
                              <Ticket size={12}/> {eventData.tickets.length} Ticket{eventData.tickets.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h1 className={`text-4xl lg:text-5xl font-brand font-extrabold leading-[1.1] mb-6 ${textClass}`}>
                          {eventData.eventName || 'Event Title'}
                        </h1>
                        <div className={`flex flex-col gap-4 p-5 rounded-2xl ${contentBgClass} shadow-sm`}>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B3D] shrink-0">
                              <Calendar size={20} />
                            </div>
                            <div>
                              <p className={`font-bold ${textClass}`}>{startDateTime.date}</p>
                              <p className="text-sm text-slate-500">{timeRange}</p>
                              <p className="text-xs text-slate-400 mt-1">{eventData.selectedTimezone.city} ({eventData.selectedTimezone.offset})</p>
                            </div>
                          </div>
                          <div className="w-full h-[1px] bg-slate-50"></div>
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl ${eventData.isVirtual ? 'bg-purple-50' : 'bg-slate-50'} flex items-center justify-center ${eventData.isVirtual ? 'text-purple-500' : 'text-slate-500'} shrink-0`}>
                              {eventData.isVirtual ? <Video size={20} /> : <MapPin size={20} />}
                            </div>
                            <div>
                              <p className={`font-bold ${textClass}`}>{locationDisplay}</p>
                              <p className="text-sm text-slate-500">{cityDisplay}</p>
                              {eventData.locationCoordinates && (
                                <p className="text-xs text-slate-400 mt-1">{eventData.locationCoordinates.formattedAddress}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className={`mb-8 ${contentBgClass} rounded-2xl p-6 shadow-sm`}>
                        <h2 className={`font-bold text-xl mb-4 ${textClass}`}>About This Event</h2>
                        <div 
                          className={`prose prose-slate max-w-none ${textClass}`}
                          dangerouslySetInnerHTML={{ 
                            __html: eventData.description || '<p class="text-slate-400">No description provided.</p>' 
                          }}
                        />
                      </div>

                      {/* Tickets */}
                      {eventData.tickets.length > 0 && (
                        <div className={`mb-8 ${contentBgClass} rounded-2xl p-6 shadow-sm`}>
                          <h2 className={`font-bold text-xl mb-4 ${textClass}`}>Tickets</h2>
                          <div className="space-y-3">
                            {eventData.tickets.map((ticket) => (
                              <div key={ticket.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white/50">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-bold ${textClass}`}>{ticket.name || 'General Admission'}</p>
                                    {ticket.requireApproval && (
                                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 text-xs font-semibold border border-purple-100">
                                        Approval Required
                                      </span>
                                    )}
                                  </div>
                                  {ticket.type === 'paid' && ticket.price && (
                                    <p className="text-sm text-slate-500">${parseFloat(ticket.price).toFixed(2)}</p>
                                  )}
                                  {ticket.type === 'free' && (
                                    <p className="text-sm text-slate-500">Free</p>
                                  )}
                                </div>
                                <button className={`px-6 py-2 rounded-xl font-bold text-sm transition-colors ${buttonClass}`}>
                                  Select
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Register Button */}
                      <button className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 ${buttonClass} shadow-lg`}>
                        Register for Event
                      </button>
                    </div>
                  </div>
                  </main>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}

// 默认导出：用 Suspense 包裹
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
