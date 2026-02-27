'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Cat, Minimize2, ArrowLeftRight, RefreshCw, Send, 
  ClipboardPaste, LinkIcon, FileUp, Zap, UserCircle, Settings
} from 'lucide-react';
import { THEME_OPTIONS, EFFECT_OPTIONS, THEME_CATEGORIES, EFFECT_CATEGORIES, TIMEZONES, HOST_PROFILES } from './constants';
import { generateAIContent, importEventFromLink, importEventFromImage, getEvent } from '@/lib/api/client';

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

interface AIAssistantProps {
  eventData: {
    eventName: string;
    selectedTheme: Theme;
    selectedEffect: string;
  };
  onThemeChange: (theme: Theme) => void;
  onEffectChange: (effect: string) => void;
  onEventDataUpdate?: (eventData: any) => void; // 用于更新活动数据的回调函数
  settings?: {
    saveTickets: boolean;
    saveLocation: boolean;
    saveQuestions: boolean;
    eventPublic: boolean;
    locationPublic: boolean;
    requireApproval: boolean;
    onSaveTicketsChange: (value: boolean) => void;
    onSaveLocationChange: (value: boolean) => void;
    onSaveQuestionsChange: (value: boolean) => void;
    onEventPublicChange: (value: boolean) => void;
    onLocationPublicChange: (value: boolean) => void;
    onRequireApprovalChange: (value: boolean) => void;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // 图片URL（用于显示）
  imageFile?: File; // 图片文件（用于上传）
}

interface CommandOption {
  id: string;
  label: string;
  description: string;
  icon: any;
}

const COMMAND_OPTIONS: CommandOption[] = [
  { id: 'paste', label: 'paste', description: 'Paste event information from text', icon: ClipboardPaste },
  { id: 'link', label: 'link', description: 'Import event details from URL', icon: LinkIcon },
  { id: 'image', label: 'image', description: 'Import event details from poster image', icon: FileUp },
];

export default function AIAssistant({ eventData, onThemeChange, onEffectChange, onEventDataUpdate, settings }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [activeTab, setActiveTab] = useState<'chat' | 'planning' | 'style' | 'settings'>('chat');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState('All');
  const [effectCategoryFilter, setEffectCategoryFilter] = useState('All');
  const [planType, setPlanType] = useState('Networking Mixer');
  const [planAudience, setPlanAudience] = useState('Startup Founders');
  const [planVibe, setPlanVibe] = useState('Chill, Inspiring');
  const [planIdea, setPlanIdea] = useState('Future Self postcards as memorable follow-up.');
  
  // @ command selector state
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [atSymbolIndex, setAtSymbolIndex] = useState(-1);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<{ file: File; preview: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // Get plain text from contentEditable div
  const getPlainText = (element: HTMLElement): string => {
    return element.innerText || element.textContent || '';
  };

  // Format text with @ command highlighting
  const formatTextWithCommands = (text: string): string => {
    if (!text) return '';
    
    // Match @command: pattern (avoid matching if already inside HTML tags)
    const commandPattern = /(@\w+):/g;
    const parts: string[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = commandPattern.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.substring(lastIndex, match.index)));
      }
      // Add highlighted command
      parts.push(`<span class="text-[#FF6B3D] font-semibold">${escapeHtml(match[1])}</span>:`);
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.substring(lastIndex)));
    }
    
    return parts.length > 0 ? parts.join('') : escapeHtml(text);
  };

  // Escape HTML to prevent XSS
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Handle input change in contentEditable div
  const handleInputChange = () => {
    const div = inputRef.current;
    if (!div) return;

    const text = getPlainText(div);
    setInput(text);

    // Check for @ symbol
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const cursorPosition = range.startOffset;
    const textNode = range.startContainer;
    
    // Get text before cursor
    let textBeforeCursor = '';
    if (textNode.nodeType === Node.TEXT_NODE) {
      const nodeText = textNode.textContent || '';
      textBeforeCursor = nodeText.substring(0, cursorPosition);
    } else {
      // If cursor is in a span or other element, get all text before
      const walker = document.createTreeWalker(
        div,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      let pos = 0;
      while ((node = walker.nextNode())) {
        const nodeText = node.textContent || '';
        if (node === textNode) {
          textBeforeCursor += nodeText.substring(0, cursorPosition);
          break;
        }
        textBeforeCursor += nodeText;
        pos += nodeText.length;
      }
    }

    // Check if there's already a @command: in the text (including optional space after colon)
    const existingCommandPattern = /(@\w+):\s*/g;
    const hasExistingCommand = existingCommandPattern.test(text);
    
    // Find @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const spaceAfterAt = textBeforeCursor.indexOf(' ', atIndex);
    const newlineAfterAt = textBeforeCursor.indexOf('\n', atIndex);
    const colonAfterAt = textBeforeCursor.indexOf(':', atIndex);
    
    // Check if @ is at the start or after whitespace/newline
    const isValidAtPosition = atIndex >= 0 && (
      atIndex === 0 || 
      /[\s\n]/.test(textBeforeCursor[atIndex - 1])
    );

    // Check if there's already a command (has colon after @)
    const hasCommand = colonAfterAt > atIndex && (spaceAfterAt === -1 || colonAfterAt < spaceAfterAt);

    // Only show menu if no existing command and valid @ position
    if (!hasExistingCommand && isValidAtPosition && !hasCommand && (spaceAfterAt === -1 || spaceAfterAt > atIndex) && (newlineAfterAt === -1 || newlineAfterAt > atIndex)) {
      // Show command menu
      setAtSymbolIndex(atIndex);
      setShowCommandMenu(true);
      setSelectedCommandIndex(0);
      
      // Calculate menu position (show directly above the input box)
      const divRect = div.getBoundingClientRect();
      
      setCommandMenuPosition({
        top: -4, // Show directly above with minimal gap
        left: 0 // Align to left of input box
      });
    } else {
      setShowCommandMenu(false);
      setAtSymbolIndex(-1);
    }

    // Update formatted text (only if not already formatted to avoid infinite loop)
    const currentHtml = div.innerHTML;
    const plainText = getPlainText(div);
    const formatted = formatTextWithCommands(plainText);
    
    // Only update if the HTML is different and we're not in the middle of typing a command
    if (currentHtml !== formatted && !showCommandMenu) {
      const cursorPos = selection.rangeCount > 0 ? selection.getRangeAt(0).startOffset : 0;
      div.innerHTML = formatted;
      
      // Restore cursor position
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (newSelection) {
          const newRange = document.createRange();
          // Find the correct text node and position
          const walker = document.createTreeWalker(
            div,
            NodeFilter.SHOW_TEXT,
            null
          );
          let node;
          let pos = 0;
          let targetNode: Node | null = null;
          let targetOffset = 0;
          
          while ((node = walker.nextNode())) {
            const nodeText = node.textContent || '';
            if (pos + nodeText.length >= cursorPos) {
              targetNode = node;
              targetOffset = cursorPos - pos;
              break;
            }
            pos += nodeText.length;
          }
          
          if (targetNode) {
            newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
            newRange.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
          } else {
            newRange.selectNodeContents(div);
            newRange.collapse(false);
          }
          
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        }
      }, 0);
    }
  };

  // Handle keydown in input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (showCommandMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev + 1) % COMMAND_OPTIONS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(prev => (prev - 1 + COMMAND_OPTIONS.length) % COMMAND_OPTIONS.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectCommand(COMMAND_OPTIONS[selectedCommandIndex].id);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
        return;
      }
    }

    // Handle Backspace/Delete to remove entire @command: as a unit
    if ((e.key === 'Backspace' || e.key === 'Delete') && !showCommandMenu) {
      const div = inputRef.current;
      if (!div) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const text = getPlainText(div);
      
      // Get cursor position in plain text
      const range = selection.getRangeAt(0);
      let cursorPos = 0;
      
      // Calculate cursor position by walking through text nodes
      const walker = document.createTreeWalker(
        div,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      while ((node = walker.nextNode())) {
        if (node === range.startContainer) {
          cursorPos += range.startOffset;
          break;
        }
        cursorPos += (node.textContent || '').length;
      }
      
      // Check if cursor is at or inside a command (e.g., @paste: | or |@paste:)
      const commandPattern = /(@\w+):/g;
      let match;
      let shouldDeleteCommand = false;
      let commandStart = -1;
      let commandEnd = -1;

      while ((match = commandPattern.exec(text)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        if (e.key === 'Backspace') {
          // Backspace: cursor is right after the colon or inside the command
          if (cursorPos > matchStart && cursorPos <= matchEnd) {
            shouldDeleteCommand = true;
            commandStart = matchStart;
            commandEnd = matchEnd;
            break;
          }
        } else if (e.key === 'Delete') {
          // Delete: cursor is at the start or inside the command
          if (cursorPos >= matchStart && cursorPos < matchEnd) {
            shouldDeleteCommand = true;
            commandStart = matchStart;
            commandEnd = matchEnd;
            break;
          }
        }
      }

      if (shouldDeleteCommand && commandStart >= 0 && commandEnd > commandStart) {
        e.preventDefault();
        
        // Remove the entire command
        const newText = text.slice(0, commandStart) + text.slice(commandEnd);
        setInput(newText);
        
        const formatted = formatTextWithCommands(newText);
        div.innerHTML = formatted;
        
        // Set cursor to where the command was
        setTimeout(() => {
          const newSelection = window.getSelection();
          if (newSelection) {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              div,
              NodeFilter.SHOW_TEXT,
              null
            );
            let node;
            let pos = 0;
            let targetNode: Node | null = null;
            let targetOffset = commandStart;
            
            while ((node = walker.nextNode())) {
              const nodeText = node.textContent || '';
              if (pos + nodeText.length >= commandStart) {
                targetNode = node;
                targetOffset = commandStart - pos;
                break;
              }
              pos += nodeText.length;
            }
            
            if (targetNode) {
              newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
              newRange.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
            } else {
              newRange.selectNodeContents(div);
              newRange.collapse(true);
            }
            
            newSelection.removeAllRanges();
            newSelection.addRange(newRange);
            div.focus();
          }
        }, 0);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showCommandMenu) {
      e.preventDefault();
      handleSend();
    }
  };

  // Select a command from menu
  const selectCommand = (commandId: string) => {
    const div = inputRef.current;
    if (!div) return;

    const text = getPlainText(div);
    const command = COMMAND_OPTIONS.find(c => c.id === commandId);
    if (!command) return;

    // Check if there's already a @command: in the text (including optional space after colon)
    const existingCommandPattern = /(@\w+):\s*/g;
    let existingCommandMatch: RegExpExecArray | null = null;
    let match;
    while ((match = existingCommandPattern.exec(text)) !== null) {
      existingCommandMatch = match;
    }

    // Get current cursor position
    const selection = window.getSelection();
    let cursorPos = text.length;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const walker = document.createTreeWalker(
        div,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      let pos = 0;
      while ((node = walker.nextNode())) {
        if (node === range.startContainer) {
          cursorPos = pos + range.startOffset;
          break;
        }
        pos += (node.textContent || '').length;
      }
    }

    let newText = text;
    let newCursorPos = cursorPos;
    
    if (existingCommandMatch) {
      // Replace existing @command: with new one (including any trailing spaces)
      const existingStart = existingCommandMatch.index;
      const existingEnd = existingCommandMatch.index + existingCommandMatch[0].length;
      const beforeCommand = text.substring(0, existingStart);
      const afterCommand = text.substring(existingEnd);
      newText = beforeCommand + `@${command.id}: ` + afterCommand;
      
      // Calculate new cursor position
      if (cursorPos <= existingStart) {
        // Cursor was before the old command
        newCursorPos = existingStart + `@${command.id}: `.length;
      } else if (cursorPos >= existingEnd) {
        // Cursor was after the old command
        const oldCommandLength = existingEnd - existingStart;
        const newCommandLength = `@${command.id}: `.length;
        newCursorPos = cursorPos - oldCommandLength + newCommandLength;
      } else {
        // Cursor was inside the old command
        newCursorPos = existingStart + `@${command.id}: `.length;
      }
    } else if (atSymbolIndex >= 0 && atSymbolIndex < cursorPos) {
      // Replace existing @ symbol
      const beforeAt = text.substring(0, atSymbolIndex);
      const afterAt = text.substring(atSymbolIndex + 1);
      newText = beforeAt + `@${command.id}: ` + afterAt;
      newCursorPos = atSymbolIndex + `@${command.id}: `.length;
    } else {
      // Append at cursor position or end
      newText = text.slice(0, cursorPos) + `@${command.id}: ` + text.slice(cursorPos);
      newCursorPos = cursorPos + `@${command.id}: `.length;
    }

    setInput(newText);
    setShowCommandMenu(false);
    setAtSymbolIndex(-1);

    // Update div content with formatting
    const formatted = formatTextWithCommands(newText);
    div.innerHTML = formatted;

    // Set cursor after the command
    setTimeout(() => {
      const newSelection = window.getSelection();
      if (newSelection) {
        const range = document.createRange();
        const walker = document.createTreeWalker(
          div,
          NodeFilter.SHOW_TEXT,
          null
        );
        let node;
        let pos = 0;
        let targetNode: Node | null = null;
        let targetOffset = newCursorPos;
        
        while ((node = walker.nextNode())) {
          const nodeText = node.textContent || '';
          if (pos + nodeText.length >= newCursorPos) {
            targetNode = node;
            targetOffset = newCursorPos - pos;
            break;
          }
          pos += nodeText.length;
        }
        
        if (targetNode) {
          range.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
          range.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
        } else {
          range.selectNodeContents(div);
          range.collapse(false);
        }
        
        newSelection.removeAllRanges();
        newSelection.addRange(range);
        div.focus();
      }
    }, 0);
  };

  // 检测是否是 Luma 链接
  const isLumaLink = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      // 支持 luma.com 和 lu.ma 域名
      return hostname === 'luma.com' || 
             hostname === 'lu.ma' || 
             hostname.endsWith('.luma.com') || 
             hostname.endsWith('.lu.ma');
    } catch {
      return false;
    }
  };

  // 从文本中提取 @link: 命令和 URL
  const extractLinkCommand = (text: string): { url: string; isLuma: boolean } | null => {
    const linkPattern = /@link:\s*(https?:\/\/[^\s]+)/i;
    const match = text.match(linkPattern);
    if (match && match[1]) {
      const url = match[1].trim();
      return {
        url,
        isLuma: isLumaLink(url)
      };
    }
    return null;
  };

  // 将后端活动数据转换为前端格式
  // 返回格式: { data: {...}, missingFields: [...] }
  const convertBackendToFrontendFormat = (backendData: any): { data: any; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    // 解析时间
    let startDate = '';
    let startTime = '';
    let endDate = '';
    let endTime = '';
    
    try {
      const startAt = new Date(backendData.start_at);
      const endAt = new Date(backendData.end_at);
      
      // 检查时间是否有效
      if (isNaN(startAt.getTime())) {
        missingFields.push('Start Date & Time');
      }
      if (isNaN(endAt.getTime())) {
        missingFields.push('End Date & Time');
      }
      
      // 提取日期和时间
      startDate = startAt.toISOString().split('T')[0];
      startTime = startAt.toTimeString().slice(0, 5);
      endDate = endAt.toISOString().split('T')[0];
      endTime = endAt.toTimeString().slice(0, 5);
    } catch (e) {
      // 如果时间解析失败，使用当前时间作为默认值
      missingFields.push('Start Date & Time');
      missingFields.push('End Date & Time');
      const now = new Date();
      startDate = now.toISOString().split('T')[0];
      startTime = '20:00';
      endDate = now.toISOString().split('T')[0];
      endTime = '21:00';
    }

    // 处理地点信息
    const locationInfo = backendData.location_info || {};
    const isVirtual = locationInfo.type === 'virtual';
    const location = isVirtual ? '' : (locationInfo.name || '');
    const meetingLink = isVirtual ? (locationInfo.link || '') : '';
    
    // 检查地点信息
    if (isVirtual && !meetingLink) {
      missingFields.push('Meeting Link');
    } else if (!isVirtual && !location) {
      missingFields.push('Location');
    }

    // 处理票务配置
    const ticketConfig = backendData.ticket_config || {};
    const tickets = (ticketConfig.tickets || []).map((t: any, index: number) => ({
      id: index + 1,
      name: t.name || 'General Admission',
      type: t.type || 'free',
      price: t.price || '',
      quantity: t.quantity || '',
      requireApproval: t.requireApproval || false,
      saveToTemplate: true
    }));

    // 如果没有票务，添加一个默认的免费票
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

    // 处理注册字段
    const registrationFields = backendData.registration_fields || [];
    const questions = registrationFields.map((f: any) => ({
      id: f.id || `field-${Date.now()}-${Math.random()}`,
      label: f.label || '',
      required: f.required || false,
      fixed: f.fixed || false,
      saveToTemplate: true
    }));

    // 如果没有注册字段，添加默认字段
    if (questions.length === 0) {
      questions.push(
        { id: 'name', label: 'Name', required: true, fixed: true, saveToTemplate: true },
        { id: 'email', label: 'Email', required: true, fixed: true, saveToTemplate: true }
      );
    }

    // 处理主题配置 - 确保 selectedTheme 不为 undefined
    const styleConfig = backendData.style_config || {};
    let selectedTheme: Theme = THEME_OPTIONS.find(t => t.id === styleConfig.themeId) as Theme;
    if (!selectedTheme) {
      // 如果找不到主题，使用默认主题 'fresh'（THEME_OPTIONS 不会为空）
      selectedTheme = (THEME_OPTIONS.find(t => t.id === 'fresh') || THEME_OPTIONS[0]) as Theme;
    }
    const selectedEffect = styleConfig.effect || 'none';

    // 处理时区 - 确保 timezone 不为 undefined
    let timezone: typeof TIMEZONES[number] = TIMEZONES.find(t => t.id === backendData.timezone) || TIMEZONES[0];

    // 处理主办方 - 确保 host 格式正确（HOST_PROFILES 不会为空）
    let host: typeof HOST_PROFILES[number] = HOST_PROFILES[0];
    if (backendData.host && HOST_PROFILES && HOST_PROFILES.length > 0) {
      // 如果后端返回了 host 信息，尝试匹配或使用默认值
      const hostInfo = backendData.host;
      if (hostInfo.id) {
        const matchedHost = HOST_PROFILES.find(h => h.id === hostInfo.id);
        if (matchedHost) {
          host = matchedHost;
        }
      }
    }

    // 检查其他重要字段
    if (!backendData.title || !backendData.title.trim()) {
      missingFields.push('Event Name');
    }
    if (!backendData.description || !backendData.description.trim()) {
      missingFields.push('Description');
    }
    if (!backendData.cover_image_url) {
      missingFields.push('Cover Image');
    }
    
    const data = {
      eventName: backendData.title || '',
      coverImage: backendData.cover_image_url || '',
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      locationCoordinates: !isVirtual && locationInfo.lat && locationInfo.lng ? {
        lat: locationInfo.lat,
        lng: locationInfo.lng,
        placeId: locationInfo.place_id || '',
        formattedAddress: locationInfo.name || ''
      } : undefined,
      description: backendData.description || '',
      tickets,
      questions,
      host: host,
      coHosts: backendData.co_hosts || [],
      selectedTheme: selectedTheme as Theme,
      selectedEffect,
      selectedTimezone: timezone,
      visibility: backendData.visibility || 'public',
      isVirtual,
      meetingLink,
      requireApproval: backendData.require_approval || false,
      isLocationPublic: locationInfo.isPublic !== false
    };
    
    return { data, missingFields };
  };

  // Handle AI chat send
  const handleSend = async () => {
    const div = inputRef.current;
    if (!div) return;

    const text = getPlainText(div).trim();
    
    // 如果没有文本也没有图片，不发送
    if ((!text && !uploadedImage) || isLoading) return;

    // 检测 @link 命令
    const linkCommand = extractLinkCommand(text);
    if (linkCommand && linkCommand.isLuma) {
      // 处理 Luma 链接导入
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      div.innerHTML = '';
      setIsLoading(true);

      try {
        // 显示导入中消息
        const importingMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: 'Importing event data from Luma...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, importingMessage]);

        // 调用导入接口
        const importResult = await importEventFromLink(linkCommand.url);
        
        // 获取完整的活动数据
        // importResult 格式: { success: true, data: { id, slug, title, source_url }, message: "..." }
        const eventId = importResult.data?.id || importResult.id;
        if (!eventId) {
          throw new Error('Failed to get event ID from import result');
        }
        const fullEventData = await getEvent(eventId);
        
        // 转换为前端格式
        const { data: frontendEventData, missingFields } = convertBackendToFrontendFormat(fullEventData);
        
        // 调用回调函数更新活动数据
        if (onEventDataUpdate) {
          onEventDataUpdate(frontendEventData);
        }

        // 构建成功消息
        let successContent = `✅ Successfully imported event "${fullEventData.title}"! Event information has been auto-filled in the form.`;
        
        if (missingFields.length > 0) {
          const missingList = missingFields.map(field => `• ${field}`).join('\n');
          successContent += `\n\n⚠️ Please complete the following fields:\n${missingList}`;
        }

        // 显示成功消息
        const successMessage: ChatMessage = {
          id: `msg-${Date.now() + 2}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.slice(0, -1), successMessage]);
      } catch (error: any) {
        console.error('Import event from link failed:', error);
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `❌ Import failed: ${error.message || 'Unable to import event data from the link. Please check if the link is correct.'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 处理图片上传
    if (uploadedImage) {
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text || '',
        timestamp: new Date(),
        imageUrl: uploadedImage.preview,
        imageFile: uploadedImage.file
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      div.innerHTML = '';
      setIsLoading(true);

      try {
        // 显示处理中消息
        const processingMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: 'Analyzing image and extracting event information...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);

        // 调用图片提取接口
        const extractResult = await importEventFromImage(uploadedImage.file, text || '');
        
        // 获取完整的活动数据
        // extractResult 格式: { success: true, data: { id, slug, title, source }, message: "..." }
        const eventId = extractResult.data?.id || extractResult.id;
        if (!eventId) {
          throw new Error('Failed to get event ID from import result');
        }
        const fullEventData = await getEvent(eventId);
        
        // 转换为前端格式
        const { data: frontendEventData, missingFields } = convertBackendToFrontendFormat(fullEventData);
        
        // 调用回调函数更新活动数据
        if (onEventDataUpdate) {
          onEventDataUpdate(frontendEventData);
        }

        // 构建成功消息
        let successContent = `✅ Successfully extracted event information from image! Event information has been auto-filled in the form.`;
        
        if (missingFields.length > 0) {
          const missingList = missingFields.map(field => `• ${field}`).join('\n');
          successContent += `\n\n⚠️ Please complete the following fields:\n${missingList}`;
        }

        // 显示成功消息
        const successMessage: ChatMessage = {
          id: `msg-${Date.now() + 2}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.slice(0, -1), successMessage]);
      } catch (error: any) {
        console.error('Extract event from image failed:', error);
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: `❌ Failed to extract event information: ${error.message || 'Unable to analyze the image. Please try again or provide more details.'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      } finally {
        setIsLoading(false);
        // 清除上传的图片
        removeUploadedImage();
      }
      return;
    }

    // 普通聊天消息处理
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    div.innerHTML = '';
    setIsLoading(true);

    try {
      // Call backend AI API
      const result = await generateAIContent(
        'chat',
        userMessage.content,
        {
          eventName: eventData.eventName,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.data || 'Got it! How can I help you with your event? 😊',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('AI chat failed:', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `Oops! Something went wrong: ${error.message || 'Please try again in a moment.'} 😅`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const div = inputRef.current;
    if (!div) return;

    const items = e.clipboardData.items;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = getPlainText(div);
    
    // 计算光标位置
    let cursorPos = 0;
    const walker = document.createTreeWalker(
      div,
      NodeFilter.SHOW_TEXT,
      null
    );
    let node;
    while ((node = walker.nextNode())) {
      if (node === range.startContainer) {
        cursorPos += range.startOffset;
        break;
      }
      cursorPos += (node.textContent || '').length;
    }

    // 检查光标前是否有 @link: 命令
    const textBeforeCursor = text.substring(0, cursorPos);
    const linkCommandPattern = /@link:\s*$/;
    const hasLinkCommandBefore = linkCommandPattern.test(textBeforeCursor);
    
    // 检查粘贴位置是否在 @link: 命令内
    const linkCommandWithContentPattern = /@link:\s*[^\s]/;
    const isInLinkCommand = linkCommandWithContentPattern.test(textBeforeCursor);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const commandText = `@image: ${file.name}`;
          const newText = text.slice(0, cursorPos) + commandText + text.slice(cursorPos);
          setInput(newText);
          const formatted = formatTextWithCommands(newText);
          div.innerHTML = formatted;
          setTimeout(() => {
            const newSelection = window.getSelection();
            if (newSelection) {
              const newRange = document.createRange();
              const textNode = div.childNodes[0] || div;
              if (textNode.nodeType === Node.TEXT_NODE) {
                const newPos = cursorPos + commandText.length;
                newRange.setStart(textNode, Math.min(newPos, textNode.textContent?.length || 0));
                newRange.setEnd(textNode, Math.min(newPos, textNode.textContent?.length || 0));
              }
              newSelection.removeAllRanges();
              newSelection.addRange(newRange);
              div.focus();
            }
          }, 0);
        }
      } else if (item.type === 'text/plain') {
        item.getAsString((pastedText) => {
          // 清理粘贴文本中可能包含的 @link: 前缀
          let cleanPastedText = pastedText.trim();
          cleanPastedText = cleanPastedText.replace(/^@link:\s*/i, '');
          
          let commandText = '';
          
          // 如果光标前已经有 @link: 命令，只粘贴 URL（不添加 @link: 前缀）
          if (hasLinkCommandBefore || isInLinkCommand) {
            // 只粘贴 URL，不添加 @link: 前缀
            commandText = cleanPastedText;
          } else if (cleanPastedText.match(/^https?:\/\//)) {
            // 如果粘贴的是 URL 且没有 @link: 命令，添加 @link: 前缀
            commandText = `@link: ${cleanPastedText}`;
          } else {
            // 普通文本，添加 @paste: 前缀
            commandText = `@paste: ${cleanPastedText}`;
          }
          
          const newText = text.slice(0, cursorPos) + commandText + text.slice(cursorPos);
          setInput(newText);
          const formatted = formatTextWithCommands(newText);
          div.innerHTML = formatted;
          setTimeout(() => {
            const newSelection = window.getSelection();
            if (newSelection) {
              const newRange = document.createRange();
              const walker = document.createTreeWalker(
                div,
                NodeFilter.SHOW_TEXT,
                null
              );
              let node;
              let pos = 0;
              let targetNode: Node | null = null;
              let targetOffset = cursorPos + commandText.length;
              
              while ((node = walker.nextNode())) {
                const nodeText = node.textContent || '';
                if (pos + nodeText.length >= cursorPos + commandText.length) {
                  targetNode = node;
                  targetOffset = cursorPos + commandText.length - pos;
                  break;
                }
                pos += nodeText.length;
              }
              
              if (targetNode) {
                newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
                newRange.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
              } else {
                newRange.selectNodeContents(div);
                newRange.collapse(false);
              }
              
              newSelection.removeAllRanges();
              newSelection.addRange(newRange);
              div.focus();
            }
          }, 0);
        });
      }
    }
  };

  // Strict image format validation
  const isValidImageFormat = (file: File): boolean => {
    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ];
    
    // Allowed file extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    
    // Check MIME type
    const isValidMimeType = allowedMimeTypes.includes(file.type.toLowerCase());
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    // Both checks must pass
    return isValidMimeType && hasValidExtension;
  };

  // Handle file upload with strict validation
  const handleFileUpload = (file: File) => {
    // Strict format validation
    if (!isValidImageFormat(file)) {
      // Show error message
      const errorMessage = `Invalid image format. Please upload a valid image file (JPEG, PNG, GIF, WebP, BMP, or SVG).`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }]);
      return;
    }

    // Check file size (optional: limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMessage = `Image file is too large. Please upload an image smaller than 10MB.`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }]);
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setUploadedImage({ file, preview });
  };

  // Remove uploaded image
  const removeUploadedImage = () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
  };

  // Handle icon button clicks
  const handlePasteClick = async () => {
    const div = inputRef.current;
    if (!div) return;

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const selection = window.getSelection();
        const currentText = getPlainText(div);
        
        // 计算光标位置
        let cursorPos = currentText.length;
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const walker = document.createTreeWalker(
            div,
            NodeFilter.SHOW_TEXT,
            null
          );
          let node;
          let pos = 0;
          while ((node = walker.nextNode())) {
            if (node === range.startContainer) {
              cursorPos = pos + range.startOffset;
              break;
            }
            pos += (node.textContent || '').length;
          }
        }
        
        // 检查光标前是否有 @link: 命令
        const textBeforeCursor = currentText.substring(0, cursorPos);
        const linkCommandPattern = /@link:\s*$/;
        const hasLinkCommandBefore = linkCommandPattern.test(textBeforeCursor);
        
        // 检查粘贴位置是否在 @link: 命令内
        const linkCommandWithContentPattern = /@link:\s*[^\s]/;
        const isInLinkCommand = linkCommandWithContentPattern.test(textBeforeCursor);
        
        // 清理粘贴文本中可能包含的 @link: 前缀
        let cleanPastedText = text.trim();
        cleanPastedText = cleanPastedText.replace(/^@link:\s*/i, '');
        
        let commandText = '';
        
        // 如果光标前已经有 @link: 命令，只粘贴 URL（不添加 @link: 前缀）
        if (hasLinkCommandBefore || isInLinkCommand) {
          // 只粘贴 URL，不添加 @link: 前缀
          commandText = cleanPastedText;
        } else if (cleanPastedText.match(/^https?:\/\//)) {
          // 如果粘贴的是 URL 且没有 @link: 命令，添加 @link: 前缀
          commandText = `@link: ${cleanPastedText}`;
        } else {
          // 普通文本，添加 @paste: 前缀
          commandText = `@paste: ${cleanPastedText}`;
        }
        
        const newText = currentText.slice(0, cursorPos) + commandText + currentText.slice(cursorPos);
        setInput(newText);
        const formatted = formatTextWithCommands(newText);
        div.innerHTML = formatted;
        setTimeout(() => {
          const newSelection = window.getSelection();
          if (newSelection) {
            const newRange = document.createRange();
            const walker = document.createTreeWalker(
              div,
              NodeFilter.SHOW_TEXT,
              null
            );
            let node;
            let pos = 0;
            let targetNode: Node | null = null;
            let targetOffset = cursorPos + commandText.length;
            
            while ((node = walker.nextNode())) {
              const nodeText = node.textContent || '';
              if (pos + nodeText.length >= cursorPos + commandText.length) {
                targetNode = node;
                targetOffset = cursorPos + commandText.length - pos;
                break;
              }
              pos += nodeText.length;
            }
            
            if (targetNode) {
              newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
              newRange.setEnd(targetNode, Math.min(targetOffset, targetNode.textContent?.length || 0));
            } else {
              newRange.selectNodeContents(div);
              newRange.collapse(false);
            }
            
            newSelection.removeAllRanges();
            newSelection.addRange(newRange);
            div.focus();
          }
        }, 0);
      }
    } catch (err) {
      const selection = window.getSelection();
      const cursorPos = selection && selection.rangeCount > 0 
        ? selection.getRangeAt(0).startOffset 
        : getPlainText(div).length;
      
      const currentText = getPlainText(div);
      const commandText = `@paste: 输入你的文本内容`;
      const newText = currentText.slice(0, cursorPos) + commandText + currentText.slice(cursorPos);
      setInput(newText);
      const formatted = formatTextWithCommands(newText);
      div.innerHTML = formatted;
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (newSelection) {
          const newRange = document.createRange();
          const textNode = div.childNodes[0] || div;
          if (textNode.nodeType === Node.TEXT_NODE) {
            const newPos = cursorPos + commandText.length;
            newRange.setStart(textNode, Math.min(newPos, textNode.textContent?.length || 0));
            newRange.setEnd(textNode, Math.min(newPos, textNode.textContent?.length || 0));
          }
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
          div.focus();
        }
      }, 0);
    }
  };

  const handleUrlClick = () => {
    const url = prompt('Enter event URL to import:');
    if (url) {
      const div = inputRef.current;
      if (!div) return;
      
      const selection = window.getSelection();
      const cursorPos = selection && selection.rangeCount > 0 
        ? selection.getRangeAt(0).startOffset 
        : getPlainText(div).length;
      
      const currentText = getPlainText(div);
      const commandText = `@link: ${url}`;
      const newText = currentText.slice(0, cursorPos) + commandText + currentText.slice(cursorPos);
      setInput(newText);
      const formatted = formatTextWithCommands(newText);
      div.innerHTML = formatted;
      setTimeout(() => {
        const newSelection = window.getSelection();
        if (newSelection) {
          const newRange = document.createRange();
          const textNode = div.childNodes[0] || div;
          if (textNode.nodeType === Node.TEXT_NODE) {
            const newPos = cursorPos + commandText.length;
            newRange.setStart(textNode, Math.min(newPos, textNode.textContent?.length || 0));
            newRange.setEnd(textNode, Math.min(newPos, textNode.textContent?.length || 0));
          }
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
          div.focus();
        }
      }, 0);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Click outside to close command menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showCommandMenu &&
        commandMenuRef.current &&
        !commandMenuRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowCommandMenu(false);
      }
    }
    if (showCommandMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCommandMenu]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Don't auto-close, let user control manually
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* AI Assistant / Plugin Drawer */}
      <div
        ref={containerRef}
        className={`fixed ${side === 'right' ? 'right-0 pr-2 sm:pr-3' : 'left-0 pl-2 sm:pl-3'} top-20 sm:top-24 bottom-2 sm:bottom-4 z-50 flex items-start ${
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`max-w-[92vw] sm:max-w-[420px] bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-white/50 flex flex-col overflow-hidden transition-[transform,height,width] duration-300 ${
            isOpen ? 'pointer-events-auto' : 'pointer-events-none'
          } ${isMinimized ? 'w-64 sm:w-80 h-16' : 'w-[92vw] sm:w-[420px] h-[calc(100%-8px)] sm:h-[calc(100%-16px)]'}`}
          style={{
            transform: isOpen
              ? 'translateX(0)'
              : side === 'right'
                ? 'translateX(calc(100% + 16px))'
                : 'translateX(calc(-100% - 16px))',
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-[#FF6B3D]/10 to-orange-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF6B3D]/10 rounded-xl">
                <Cat className="w-5 h-5 text-[#FF6B3D]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">AI Assistant</h3>
                <p className="text-xs text-slate-500">Your creation copilot</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                title="Toggle dock side"
                onClick={() => setSide(prev => prev === 'right' ? 'left' : 'right')}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-[#FF6B3D]/30"
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title={isMinimized ? 'Expand panel' : 'Collapse panel'}
              >
                <Minimize2 className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close assistant"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {!isMinimized ? (
            <>
              {/* Plugin tabs */}
              <div className="px-4 py-2 border-b border-slate-100 bg-white/80 flex items-center gap-2">
                {([
                  { id: 'chat', label: 'Chat' },
                  { id: 'planning', label: 'Planning' },
                  { id: 'style', label: 'Style' },
                  { id: 'settings', label: 'Settings' },
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setIsOpen(true);
                      setActiveTab(tab.id);
                      if (isMinimized) setIsMinimized(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#FF6B3D] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50">
                {activeTab === 'chat' && (
                  <div className="p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="p-4 bg-[#FF6B3D]/10 rounded-full mb-4">
                          <Cat className="w-8 h-8 text-[#FF6B3D]" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Welcome to AI Assistant</h4>
                        <p className="text-sm text-slate-600 mb-6">
                          I can optimize your copy, suggest themes, and answer questions.
                        </p>
                        <div className="space-y-3 w-full mb-4">
                          <button
                            onClick={() => {
                              selectCommand('paste');
                            }}
                            className="w-full text-left px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-[#FF6B3D] hover:bg-orange-50 transition-all text-sm text-slate-700 flex items-center gap-3 group"
                          >
                            <ClipboardPaste className="w-4 h-4 text-[#FF6B3D] group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="font-bold mb-0.5">Paste Event Info</div>
                              <div className="text-xs text-slate-500">Auto-fill from pasted text</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              selectCommand('link');
                            }}
                            className="w-full text-left px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-[#FF6B3D] hover:bg-orange-50 transition-all text-sm text-slate-700 flex items-center gap-3 group"
                          >
                            <LinkIcon className="w-4 h-4 text-[#FF6B3D] group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="font-bold mb-0.5">Import Event Link</div>
                              <div className="text-xs text-slate-500">Extract details from event URL</div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              selectCommand('image');
                            }}
                            className="w-full text-left px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-[#FF6B3D] hover:bg-orange-50 transition-all text-sm text-slate-700 flex items-center gap-3 group"
                          >
                            <FileUp className="w-4 h-4 text-[#FF6B3D] group-hover:scale-110 transition-transform" />
                            <div className="flex-1">
                              <div className="font-bold mb-0.5">Import Event Poster</div>
                              <div className="text-xs text-slate-500">Extract details from poster image</div>
                            </div>
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 pt-2 border-t border-slate-200 w-full">
                          Or ask me anything about creating your event
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-white">
                                <Cat className="w-6 h-6" />
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-[#FF6B3D] text-white'
                                  : 'bg-white border border-slate-200 text-slate-800'
                              }`}
                            >
                              {/* Display image if present */}
                              {message.imageUrl && (
                                <div className="mb-2 rounded-lg overflow-hidden">
                                  <img
                                    src={message.imageUrl}
                                    alt="Uploaded event poster"
                                    className="max-w-full h-auto max-h-48 object-contain"
                                  />
                                </div>
                              )}
                              {message.content && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content}
                                </p>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-white">
                                <UserCircle className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex items-start gap-3 justify-start">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg ring-2 ring-white">
                              <Cat className="w-6 h-6" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'planning' && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">AI Planning</h4>
                        <p className="text-xs text-slate-500">Design extraordinary experiences</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Event Type</label>
                        <input
                          value={planType}
                          onChange={(e) => setPlanType(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D] outline-none"
                          placeholder="e.g. Networking Mixer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Target Audience</label>
                        <input
                          value={planAudience}
                          onChange={(e) => setPlanAudience(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D] outline-none"
                          placeholder="e.g. Startup Founders"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Desired Vibe</label>
                        <input
                          value={planVibe}
                          onChange={(e) => setPlanVibe(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D] outline-none"
                          placeholder="e.g. Chill, Inspiring"
                        />
                      </div>
                      <button
                        onClick={() => {
                          setPlanIdea(`Plan for ${planType}: Aim at ${planAudience} with a ${planVibe} vibe. Highlight a signature moment to delight guests.`);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B3D] to-[#FF8E53] text-white font-bold text-sm shadow-md hover:opacity-90 transition"
                      >
                        Brainstorm Experience
                      </button>
                      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                        <div className="text-xs uppercase text-slate-500 font-semibold">Suggested angle</div>
                        <div className="text-sm font-bold text-slate-900">{planType}</div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{planIdea}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'style' && (
                  <div className="p-4 space-y-6">
                    <div className="space-y-3">
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {THEME_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setThemeCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              themeCategoryFilter === cat ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-600 bg-slate-100 hover:bg-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {THEME_OPTIONS
                          .filter(t => themeCategoryFilter === 'All' || t.category === themeCategoryFilter)
                          .map(theme => (
                            <button
                              key={theme.id}
                              onClick={() => onThemeChange(theme as Theme)}
                              className={`relative p-1 rounded-2xl border transition-all text-left group overflow-hidden ${
                                eventData.selectedTheme.id === theme.id ? 'border-[#FF6B3D] bg-white shadow-md' : 'border-transparent hover:bg-white hover:shadow-sm'
                              }`}
                            >
                              <div
                                className="h-20 rounded-xl w-full mb-2 border border-slate-100 overflow-hidden"
                                style={{ background: (theme as Theme).preview }}
                              ></div>
                              <div className="px-1 pb-1">
                                <div className={`text-xs font-bold ${eventData.selectedTheme.id === theme.id ? 'text-[#FF6B3D]' : 'text-slate-700'}`}>
                                  {theme.name}
                                </div>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {EFFECT_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setEffectCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                              effectCategoryFilter === cat ? 'bg-white text-[#FF6B3D] shadow-sm ring-1 ring-slate-200' : 'text-slate-600 bg-slate-100 hover:bg-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {EFFECT_OPTIONS
                          .filter(e => effectCategoryFilter === 'All' || e.category === effectCategoryFilter)
                          .map(effect => (
                            <button
                              key={effect.id}
                              onClick={() => onEffectChange(effect.id)}
                              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                                eventData.selectedEffect === effect.id ? 'border-[#FF6B3D] bg-white shadow-md text-[#FF6B3D]' : 'border-transparent bg-white hover:shadow-sm text-slate-600'
                              }`}
                            >
                              <div className="text-3xl mb-2 filter drop-shadow-sm">{effect.icon}</div>
                              <span className="text-xs font-bold">{effect.name}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && settings && (
                  <div className="p-5 space-y-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-[#FF6B3D] flex items-center justify-center text-white shadow-lg">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Optional Settings</h4>
                        <p className="text-xs text-slate-500">Configure event preferences</p>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {/* Save Tickets */}
                      <div className="border-t border-slate-100 first:border-t-0 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Save Tickets</span>
                          <button
                            onClick={() => settings.onSaveTicketsChange(!settings.saveTickets)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.saveTickets ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.saveTickets ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>

                      {/* Save Location */}
                      <div className="border-t border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Save Location</span>
                          <button
                            onClick={() => settings.onSaveLocationChange(!settings.saveLocation)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.saveLocation ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.saveLocation ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>

                      {/* Save Questions */}
                      <div className="border-t border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Save Questions</span>
                          <button
                            onClick={() => settings.onSaveQuestionsChange(!settings.saveQuestions)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.saveQuestions ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.saveQuestions ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>

                      {/* Event Public */}
                      <div className="border-t border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Event Public</span>
                          <button
                            onClick={() => settings.onEventPublicChange(!settings.eventPublic)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.eventPublic ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.eventPublic ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>

                      {/* Location Public */}
                      <div className="border-t border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Location Public</span>
                          <button
                            onClick={() => settings.onLocationPublicChange(!settings.locationPublic)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.locationPublic ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.locationPublic ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>

                      {/* Require Approval */}
                      <div className="border-t border-slate-100 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-900">Require Approval</span>
                          <button
                            onClick={() => settings.onRequireApprovalChange(!settings.requireApproval)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.requireApproval ? 'bg-[#FF6B3D]' : 'bg-slate-200'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${settings.requireApproval ? 'translate-x-5' : 'translate-x-0'}`}></span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Input Area */}
              {activeTab === 'chat' && (
                <div className="p-4 border-t border-slate-100 bg-white">
                  {/* Image preview */}
                  {uploadedImage && (
                    <div className="mb-2 relative inline-block">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-[#FF6B3D]">
                        <img
                          src={uploadedImage.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeUploadedImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <div
                        ref={inputRef}
                        contentEditable
                        onInput={handleInputChange}
                        onPaste={handlePaste}
                        onKeyDown={handleInputKeyDown}
                        data-placeholder={uploadedImage ? "Add a message (optional)..." : "Ask me anything... (Type @ to see commands)"}
                        className="w-full min-h-[60px] max-h-[120px] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#FF6B3D]/20 focus:border-[#FF6B3D] outline-none resize-none text-sm text-slate-700 overflow-y-auto [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-400"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      />
                      {/* Command Menu */}
                      {showCommandMenu && (
                        <div
                          ref={commandMenuRef}
                          className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
                          style={{
                            bottom: '100%',
                            left: `${commandMenuPosition.left}px`,
                            marginBottom: '4px',
                            minWidth: '280px'
                          }}
                        >
                          <div className="py-1">
                            {COMMAND_OPTIONS.map((option, index) => {
                              const Icon = option.icon;
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => selectCommand(option.id)}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                                    selectedCommandIndex === index ? 'bg-orange-50' : ''
                                  }`}
                                  onMouseEnter={() => setSelectedCommandIndex(index)}
                                >
                                  <Icon className={`w-4 h-4 ${selectedCommandIndex === index ? 'text-[#FF6B3D]' : 'text-slate-500'}`} />
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${selectedCommandIndex === index ? 'text-[#FF6B3D]' : 'text-slate-900'}`}>
                                      @{option.label}
                                    </div>
                                    <div className="text-xs text-slate-500">{option.description}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                            // Reset input to allow selecting the same file again
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                    {/* Image Upload Button */}
                    <button
                      onClick={handleImageClick}
                      disabled={isLoading}
                      className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-[#FF6B3D] hover:text-[#FF6B3D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      title="Upload image (JPEG, PNG, GIF, WebP, BMP, SVG)"
                    >
                      <FileUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={(!input.trim() && !uploadedImage) || isLoading}
                      className="p-3 bg-[#FF6B3D] text-white rounded-xl hover:bg-[#E05D32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* AI Assistant Handle */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed top-1/2 -translate-y-1/2 z-[55] px-3 py-2 bg-[#FF6B3D] text-white shadow-2xl hover:bg-[#E05D32] transition-all hover:scale-105 flex items-center gap-2 font-bold text-sm ${
            side === 'right'
              ? 'right-0 translate-x-1/2 rounded-l-xl rounded-r-none'
              : 'left-0 -translate-x-1/2 rounded-r-xl rounded-l-none'
          }`}
        >
          <Cat className="w-4 h-4" />
          <span className="whitespace-nowrap">AI Plugin</span>
        </button>
      )}
    </>
  );
}

