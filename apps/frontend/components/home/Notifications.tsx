'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, MoreHorizontal } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationsProps {
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
}

export default function Notifications({ onMarkAsRead, onClearAll }: NotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/v1/notifications`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setNotifications(data.data);
          setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    onMarkAsRead?.(notificationId);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    onClearAll?.();
    };

  const handleDelete = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 1) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <Bell className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-3 hover:bg-slate-100 rounded-full transition-colors text-[#64748B]"
      >
        <Bell className="w-6 h-6" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-[#FF6B3D] text-white text-xs font-bold rounded-full border-2 border-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear All
                </button>
                <span className="text-xs text-slate-400">
                  {unreadCount} unread
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer ${
                        notification.isRead ? 'opacity-60' : 'bg-white border border-slate-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h4 className={`text-sm font-semibold ${
                                notification.isRead ? 'text-slate-500' : 'text-slate-900'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className={`text-xs ${
                                notification.isRead ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-[#FF6B3D] rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="p-1 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
