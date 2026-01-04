/**
 * Notifications API Routes
 * 
 * Handles CRUD operations for user notifications
 */

import { Env } from '../types';
import { requireAuth } from '../middleware/auth';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../services/notificationService';

/**
 * Handle notification routes
 * All routes require authentication
 */
export async function handleNotificationRoutes(request: Request, env: Env, path: string): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // All notification routes require authentication
  const authResult = await requireAuth(request, env);
  if (authResult instanceof Response) return authResult;

  const { user } = authResult;

  /**
   * GET /api/notifications
   * Returns all notifications for the authenticated user
   */
  if (path === '/api/notifications' && request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const [notifications, unreadCount] = await Promise.all([
        getUserNotifications(env.DB, user.userId, limit),
        getUnreadCount(env.DB, user.userId)
      ]);

      return new Response(JSON.stringify({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch notifications'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns just the unread count for badge display
   */
  if (path === '/api/notifications/unread-count' && request.method === 'GET') {
    try {
      const count = await getUnreadCount(env.DB, user.userId);

      return new Response(JSON.stringify({
        success: true,
        data: { unreadCount: count }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch unread count'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * POST /api/notifications/read/:id
   * Marks a specific notification as read
   */
  if (path.startsWith('/api/notifications/read/') && request.method === 'POST') {
    try {
      const notificationId = path.replace('/api/notifications/read/', '');
      const success = await markAsRead(env.DB, user.userId, notificationId);

      if (!success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Notification not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Notification marked as read'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to mark notification as read'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * POST /api/notifications/read-all
   * Marks all notifications as read
   */
  if (path === '/api/notifications/read-all' && request.method === 'POST') {
    try {
      const count = await markAllAsRead(env.DB, user.userId);

      return new Response(JSON.stringify({
        success: true,
        message: `Marked ${count} notifications as read`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to mark notifications as read'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Deletes a specific notification
   */
  if (path.match(/^\/api\/notifications\/[^/]+$/) && 
      !path.includes('/read') && 
      !path.includes('/unread') &&
      request.method === 'DELETE') {
    try {
      const notificationId = path.replace('/api/notifications/', '');
      const success = await deleteNotification(env.DB, user.userId, notificationId);

      if (!success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Notification not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Notification deleted'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to delete notification'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  /**
   * DELETE /api/notifications
   * Clears all notifications for the user
   */
  if (path === '/api/notifications' && request.method === 'DELETE') {
    try {
      const count = await clearAllNotifications(env.DB, user.userId);

      return new Response(JSON.stringify({
        success: true,
        message: `Deleted ${count} notifications`
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to clear notifications'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  // 404 for unknown notification routes
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
