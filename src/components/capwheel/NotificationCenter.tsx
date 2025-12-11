/**
 * NotificationCenter Component
 * 
 * Dropdown panel for viewing and managing user notifications.
 * Features:
 * - Real-time unread count badge
 * - Grouped notifications by type
 * - Mark as read on click
 * - Mark all as read
 * - Clear all functionality
 * - Responsive mobile support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  LogIn, 
  Layers, 
  Gift, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { springPhysics } from '../../theme/capwheel';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  type Notification,
  type NotificationType
} from '../../api/notifications';

interface NotificationCenterProps {
  className?: string;
}

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, typeof Bell> = {
  deposit: ArrowDownCircle,
  withdrawal: ArrowUpCircle,
  login: LogIn,
  stake: Layers,
  unstake: Layers,
  referral: Gift,
  system: AlertCircle,
  yield: TrendingUp
};

// Color mapping for notification types
const notificationColors: Record<NotificationType, string> = {
  deposit: '#00FF9D',
  withdrawal: '#FF6B6B',
  login: '#00B8D4',
  stake: '#FFD93D',
  unstake: '#FFD93D',
  referral: '#C084FC',
  system: '#94A3B8',
  yield: '#00FF9D'
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const response = await getNotifications(50);
    if (response.success && response.data) {
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    }
    setIsLoading(false);
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click - mark as read
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      const success = await markAsRead(notification.id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    const success = await markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  // Handle clear all
  const handleClearAll = async () => {
    const success = await clearAllNotifications();
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const hoverSpring = { type: 'spring', stiffness: 400, damping: 25 };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
        whileTap={{ scale: 0.95 }}
        transition={hoverSpring}
        className="relative p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {/* Unread count badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#00FF9D] text-black text-[10px] font-bold shadow-lg shadow-[#00FF9D]/50"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={springPhysics.quick}
            className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-14 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[70vh] bg-[#0B1120]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    onClick={handleMarkAllRead}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#00FF9D] hover:bg-[#00FF9D]/10 rounded-md transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[calc(70vh-100px)]">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#00FF9D]/30 border-t-[#00FF9D] rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-500 mt-1">We'll notify you when something happens</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const color = notificationColors[notification.type];
                    
                    return (
                      <motion.div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                        className={`relative px-4 py-3 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-[#00FF9D]/[0.02]' : ''
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00FF9D]" />
                        )}
                        
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div 
                            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${notification.is_read ? 'text-slate-300' : 'text-white'}`}>
                                {notification.title}
                              </p>
                              <span className="flex-shrink-0 text-[10px] text-slate-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        
                        {/* Read indicator on hover */}
                        {!notification.is_read && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <Check className="w-4 h-4 text-[#00FF9D]" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - Clear all */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-white/[0.06]">
                <motion.button
                  onClick={handleClearAll}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all notifications
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
