/**
 * Notification Service
 * 
 * Handles creation and retrieval of user notifications
 * for deposits, withdrawals, logins, staking events, and system messages.
 */

import { D1Database } from '@cloudflare/workers-types';

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

export interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(
  db: D1Database,
  params: CreateNotificationParams
): Promise<Notification> {
  const id = crypto.randomUUID().replace(/-/g, '');
  const metadataJson = params.metadata ? JSON.stringify(params.metadata) : null;

  await db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, metadata, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
  `).bind(
    id,
    params.userId,
    params.type,
    params.title,
    params.message,
    metadataJson
  ).run();

  return {
    id,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata,
    is_read: false,
    created_at: new Date().toISOString()
  };
}

/**
 * Gets all notifications for a user, newest first
 */
export async function getUserNotifications(
  db: D1Database,
  userId: number,
  limit: number = 50
): Promise<Notification[]> {
  const result = await db.prepare(`
    SELECT id, user_id, type, title, message, metadata, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(userId, limit).all();

  return (result.results || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    user_id: row.user_id as number,
    type: row.type as NotificationType,
    title: row.title as string,
    message: row.message as string,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    is_read: Boolean(row.is_read),
    created_at: row.created_at as string
  }));
}

/**
 * Gets unread notification count for a user
 */
export async function getUnreadCount(
  db: D1Database,
  userId: number
): Promise<number> {
  const result = await db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).bind(userId).first();

  return (result?.count as number) || 0;
}

/**
 * Marks a specific notification as read
 */
export async function markAsRead(
  db: D1Database,
  userId: number,
  notificationId: string
): Promise<boolean> {
  const result = await db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE id = ? AND user_id = ?
  `).bind(notificationId, userId).run();

  return result.meta.changes > 0;
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllAsRead(
  db: D1Database,
  userId: number
): Promise<number> {
  const result = await db.prepare(`
    UPDATE notifications
    SET is_read = 1
    WHERE user_id = ? AND is_read = 0
  `).bind(userId).run();

  return result.meta.changes;
}

/**
 * Deletes a specific notification
 */
export async function deleteNotification(
  db: D1Database,
  userId: number,
  notificationId: string
): Promise<boolean> {
  const result = await db.prepare(`
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
  `).bind(notificationId, userId).run();

  return result.meta.changes > 0;
}

/**
 * Deletes all notifications for a user
 */
export async function clearAllNotifications(
  db: D1Database,
  userId: number
): Promise<number> {
  const result = await db.prepare(`
    DELETE FROM notifications
    WHERE user_id = ?
  `).bind(userId).run();

  return result.meta.changes;
}

// ============================================
// Notification Factory Functions
// ============================================

/**
 * Creates a deposit notification
 */
export async function notifyDeposit(
  db: D1Database,
  userId: number,
  amount: number,
  currency: string,
  txHash?: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: 'deposit',
    title: 'Deposit Confirmed',
    message: `Your deposit of ${amount.toLocaleString()} ${currency} has been confirmed and credited to your account.`,
    metadata: { amount, currency, txHash }
  });
}

/**
 * Creates a withdrawal notification
 */
export async function notifyWithdrawal(
  db: D1Database,
  userId: number,
  amount: number,
  currency: string,
  status: 'pending' | 'completed' | 'failed',
  txHash?: string
): Promise<Notification> {
  const statusMessages = {
    pending: 'is being processed',
    completed: 'has been completed',
    failed: 'could not be processed'
  };

  return createNotification(db, {
    userId,
    type: 'withdrawal',
    title: status === 'completed' ? 'Withdrawal Complete' : 
           status === 'pending' ? 'Withdrawal Processing' : 'Withdrawal Failed',
    message: `Your withdrawal of ${amount.toLocaleString()} ${currency} ${statusMessages[status]}.`,
    metadata: { amount, currency, status, txHash }
  });
}

/**
 * Creates a login notification
 */
export async function notifyLogin(
  db: D1Database,
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<Notification> {
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return createNotification(db, {
    userId,
    type: 'login',
    title: 'New Login Detected',
    message: `Your account was accessed on ${timeStr}. If this wasn't you, please secure your account immediately.`,
    metadata: { ipAddress, userAgent, timestamp: now.toISOString() }
  });
}

/**
 * Creates a stake notification
 */
export async function notifyStake(
  db: D1Database,
  userId: number,
  poolName: string,
  amount: number,
  currency: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: 'stake',
    title: 'Stake Confirmed',
    message: `You've successfully staked ${amount.toLocaleString()} ${currency} in the ${poolName} pool.`,
    metadata: { poolName, amount, currency }
  });
}

/**
 * Creates an unstake notification
 */
export async function notifyUnstake(
  db: D1Database,
  userId: number,
  poolName: string,
  amount: number,
  currency: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: 'unstake',
    title: 'Unstake Complete',
    message: `You've successfully unstaked ${amount.toLocaleString()} ${currency} from the ${poolName} pool.`,
    metadata: { poolName, amount, currency }
  });
}

/**
 * Creates a referral notification
 */
export async function notifyReferral(
  db: D1Database,
  userId: number,
  referredUserName: string,
  bonusAmount?: number
): Promise<Notification> {
  const message = bonusAmount
    ? `${referredUserName} joined using your referral! You earned a ${bonusAmount} USDT bonus.`
    : `${referredUserName} joined CapWheel using your referral link.`;

  return createNotification(db, {
    userId,
    type: 'referral',
    title: 'New Referral',
    message,
    metadata: { referredUserName, bonusAmount }
  });
}

/**
 * Creates a yield notification
 */
export async function notifyYield(
  db: D1Database,
  userId: number,
  amount: number,
  period: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: 'yield',
    title: 'Yield Credited',
    message: `Your ${period} yield of ${amount.toFixed(2)} USDT has been credited to your account.`,
    metadata: { amount, period }
  });
}

/**
 * Creates a system notification
 */
export async function notifySystem(
  db: D1Database,
  userId: number,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: 'system',
    title,
    message,
    metadata
  });
}
