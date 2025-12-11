/**
 * Invite Code Service
 * 
 * Handles invite code generation, validation, usage tracking,
 * and automatic expiry after 3 days.
 */

import { Env, ApiResponse } from '../types';

export interface InviteCode {
  id: number;
  creator_id: number;
  code: string;
  used_by_id: number | null;
  status: 'active' | 'used' | 'expired';
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

// Invite code expiry duration (3 days in seconds)
const INVITE_CODE_EXPIRY_SECONDS = 3 * 24 * 60 * 60;

/**
 * Generate a unique invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'INV-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new invite code for a user
 */
export async function createInviteCode(
  env: Env,
  userId: number
): Promise<ApiResponse<{ inviteCode: InviteCode }>> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + INVITE_CODE_EXPIRY_SECONDS;
    
    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existing = await env.DB.prepare(
        'SELECT id FROM invite_codes WHERE code = ?'
      ).bind(code).first();
      
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      return { status: 'error', error: 'Failed to generate unique invite code' };
    }
    
    // Create invite code
    const result = await env.DB.prepare(
      `INSERT INTO invite_codes (creator_id, code, status, created_at, expires_at)
       VALUES (?, ?, 'active', ?, ?)
       RETURNING *`
    ).bind(userId, code, timestamp, expiresAt).first<InviteCode>();
    
    if (!result) {
      return { status: 'error', error: 'Failed to create invite code' };
    }
    
    return {
      status: 'success',
      data: { inviteCode: result },
    };
  } catch (error) {
    console.error('Create invite code error:', error);
    return { status: 'error', error: 'Failed to create invite code' };
  }
}

/**
 * Get all invite codes created by a user
 */
export async function getUserInviteCodes(
  env: Env,
  userId: number
): Promise<InviteCode[]> {
  // First, expire any old codes
  await expireOldCodes(env);
  
  const codes = await env.DB.prepare(
    `SELECT * FROM invite_codes WHERE creator_id = ? ORDER BY created_at DESC`
  ).bind(userId).all<InviteCode>();
  
  return codes.results;
}

/**
 * Get active (unused, non-expired) invite codes for a user
 */
export async function getActiveInviteCodes(
  env: Env,
  userId: number
): Promise<InviteCode[]> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const codes = await env.DB.prepare(
    `SELECT * FROM invite_codes 
     WHERE creator_id = ? AND status = 'active' AND expires_at > ?
     ORDER BY created_at DESC`
  ).bind(userId, timestamp).all<InviteCode>();
  
  return codes.results;
}

/**
 * Validate an invite code for registration
 */
export async function validateInviteCode(
  env: Env,
  code: string
): Promise<ApiResponse<{ inviteCode: InviteCode; creatorId: number }>> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const inviteCode = await env.DB.prepare(
    `SELECT * FROM invite_codes WHERE code = ?`
  ).bind(code).first<InviteCode>();
  
  if (!inviteCode) {
    return { status: 'error', error: 'Invalid invite code' };
  }
  
  if (inviteCode.status === 'used') {
    return { status: 'error', error: 'Invite code has already been used' };
  }
  
  if (inviteCode.status === 'expired' || inviteCode.expires_at <= timestamp) {
    // Update status if not already expired
    if (inviteCode.status !== 'expired') {
      await env.DB.prepare(
        `UPDATE invite_codes SET status = 'expired' WHERE id = ?`
      ).bind(inviteCode.id).run();
    }
    return { status: 'error', error: 'Invite code has expired' };
  }
  
  return {
    status: 'success',
    data: { 
      inviteCode, 
      creatorId: inviteCode.creator_id 
    },
  };
}

/**
 * Mark an invite code as used
 */
export async function useInviteCode(
  env: Env,
  code: string,
  usedByUserId: number
): Promise<ApiResponse<{ inviteCode: InviteCode }>> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // First validate the code
  const validation = await validateInviteCode(env, code);
  if (validation.status === 'error') {
    return validation as ApiResponse<{ inviteCode: InviteCode }>;
  }
  
  // Mark as used
  const result = await env.DB.prepare(
    `UPDATE invite_codes 
     SET status = 'used', used_by_id = ?, used_at = ?
     WHERE code = ?
     RETURNING *`
  ).bind(usedByUserId, timestamp, code).first<InviteCode>();
  
  if (!result) {
    return { status: 'error', error: 'Failed to use invite code' };
  }
  
  return {
    status: 'success',
    data: { inviteCode: result },
  };
}

/**
 * Expire old invite codes (called periodically)
 */
export async function expireOldCodes(env: Env): Promise<number> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const result = await env.DB.prepare(
    `UPDATE invite_codes 
     SET status = 'expired' 
     WHERE status = 'active' AND expires_at <= ?`
  ).bind(timestamp).run();
  
  return result.meta.changes ?? 0;
}

/**
 * Delete expired invite codes older than 7 days
 */
export async function cleanupOldCodes(env: Env): Promise<number> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = timestamp - (7 * 24 * 60 * 60);
  
  const result = await env.DB.prepare(
    `DELETE FROM invite_codes 
     WHERE status = 'expired' AND expires_at <= ?`
  ).bind(sevenDaysAgo).run();
  
  return result.meta.changes ?? 0;
}

/**
 * Get invite code stats for a user
 */
export async function getInviteCodeStats(
  env: Env,
  userId: number
): Promise<{
  totalCreated: number;
  activeCount: number;
  usedCount: number;
  expiredCount: number;
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const stats = await env.DB.prepare(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'active' AND expires_at > ? THEN 1 ELSE 0 END) as active,
       SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
       SUM(CASE WHEN status = 'expired' OR (status = 'active' AND expires_at <= ?) THEN 1 ELSE 0 END) as expired
     FROM invite_codes
     WHERE creator_id = ?`
  ).bind(timestamp, timestamp, userId).first<{
    total: number;
    active: number;
    used: number;
    expired: number;
  }>();
  
  return {
    totalCreated: stats?.total ?? 0,
    activeCount: stats?.active ?? 0,
    usedCount: stats?.used ?? 0,
    expiredCount: stats?.expired ?? 0,
  };
}
