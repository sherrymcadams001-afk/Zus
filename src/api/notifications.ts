/**
 * Notifications API
 * 
 * Client-side API calls for the notifications system
 */

import { apiClient } from './client';

export type NotificationType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'login' 
  | 'stake' 
  | 'unstake' 
  | 'referral' 
  | 'system' 
  | 'yield';

export interface Notification {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    unreadCount: number;
  };
  error?: string;
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    unreadCount: number;
  };
  error?: string;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit: number = 50): Promise<NotificationsResponse> {
  try {
    const response = await apiClient.get(`/api/notifications?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

/**
 * Get unread notification count for badge display
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const response = await apiClient.get<UnreadCountResponse>('/api/notifications/unread-count');
    return response.data.data?.unreadCount || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark a specific notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await apiClient.post(`/api/notifications/read/${notificationId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<boolean> {
  try {
    const response = await apiClient.post('/api/notifications/read-all');
    return response.data.success;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Delete a specific notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<boolean> {
  try {
    const response = await apiClient.delete('/api/notifications');
    return response.data.success;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
}
