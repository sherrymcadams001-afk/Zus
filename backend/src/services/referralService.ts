/**
 * Referral Service
 * 
 * Handles referral system operations including tracking partner volume
 * and commission calculations.
 */

import { Env, ApiResponse } from '../types';

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  created_at: number;
}

export interface ReferralCommission {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  source_transaction_id: number | null;
  amount: number;
  commission_rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: number;
  paid_at: number | null;
}

// Commission rates by level (percentage)
export const COMMISSION_RATES: Record<number, number> = {
  1: 0.10,  // 10% for direct referrals
  2: 0.05,  // 5% for level 2
  3: 0.03,  // 3% for level 3
  4: 0.02,  // 2% for level 4
  5: 0.01,  // 1% for level 5
};

/**
 * Get user's direct referrals
 */
export async function getDirectReferrals(env: Env, userId: number): Promise<Referral[]> {
  const referrals = await env.DB.prepare(
    `SELECT * FROM referrals WHERE referrer_id = ? AND level = 1 ORDER BY created_at DESC`
  ).bind(userId).all<Referral>();
  
  return referrals.results;
}

/**
 * Get all referrals in user's network (all 5 levels)
 */
export async function getReferralNetwork(env: Env, userId: number): Promise<Referral[]> {
  const referrals = await env.DB.prepare(
    `SELECT * FROM referrals WHERE referrer_id = ? ORDER BY level ASC, created_at DESC`
  ).bind(userId).all<Referral>();
  
  return referrals.results;
}

/**
 * Calculate total partner volume (sum of all referral investments across all levels)
 * Uses a single CTE query to avoid N+1 pattern.
 */
export async function getPartnerVolume(env: Env, userId: number): Promise<number> {
  const result = await env.DB.prepare(`
    WITH network AS (
      SELECT referred_id
      FROM referrals
      WHERE referrer_id = ?
    ),
    deposits AS (
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM transactions
      WHERE type = 'deposit'
        AND status = 'completed'
        AND user_id IN (SELECT referred_id FROM network)
    ),
    stakes AS (
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM pool_stakes
      WHERE status = 'active'
        AND user_id IN (SELECT referred_id FROM network)
    )
    SELECT 
      (SELECT total FROM deposits) + (SELECT total FROM stakes) AS total_volume
  `).bind(userId).first<{ total_volume: number }>();
  
  return result?.total_volume ?? 0;
}

/**
 * Get volume breakdown by level
 */
export async function getVolumeByLevel(
  env: Env,
  userId: number
): Promise<Record<number, number>> {
  const volumeByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const result = await env.DB.prepare(`
    WITH network AS (
      SELECT referred_id, level
      FROM referrals
      WHERE referrer_id = ?
    ),
    deposits AS (
      SELECT user_id, SUM(amount) AS total_deposits
      FROM transactions
      WHERE type = 'deposit'
        AND status = 'completed'
        AND user_id IN (SELECT referred_id FROM network)
      GROUP BY user_id
    ),
    stakes AS (
      SELECT user_id, SUM(amount) AS total_stakes
      FROM pool_stakes
      WHERE status = 'active'
        AND user_id IN (SELECT referred_id FROM network)
      GROUP BY user_id
    ),
    per_user AS (
      SELECT
        n.level AS level,
        COALESCE(d.total_deposits, 0) + COALESCE(s.total_stakes, 0) AS volume
      FROM network n
      LEFT JOIN deposits d ON d.user_id = n.referred_id
      LEFT JOIN stakes s ON s.user_id = n.referred_id
    )
    SELECT level, COALESCE(SUM(volume), 0) AS total
    FROM per_user
    GROUP BY level
  `).bind(userId).all<{ level: number; total: number }>();

  for (const row of result.results) {
    if (row.level >= 1 && row.level <= 5) {
      volumeByLevel[row.level] = row.total;
    }
  }

  return volumeByLevel;
}

/**
 * Get total earned commissions
 */
export async function getTotalCommissions(env: Env, userId: number): Promise<number> {
  const result = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM referral_commissions 
     WHERE referrer_id = ? AND status = 'paid'`
  ).bind(userId).first<{ total: number }>();
  
  return result?.total ?? 0;
}

/**
 * Get pending commissions
 */
export async function getPendingCommissions(env: Env, userId: number): Promise<number> {
  const result = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM referral_commissions 
     WHERE referrer_id = ? AND status = 'pending'`
  ).bind(userId).first<{ total: number }>();
  
  return result?.total ?? 0;
}

/**
 * Create referral relationship when a new user registers
 */
export async function createReferralChain(
  env: Env,
  referrerId: number,
  newUserId: number
): Promise<ApiResponse<{ referrals: Referral[] }>> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const createdReferrals: Referral[] = [];
    
    // Create level 1 referral (direct)
    const level1 = await env.DB.prepare(
      `INSERT INTO referrals (referrer_id, referred_id, level, created_at)
       VALUES (?, ?, 1, ?)
       RETURNING *`
    ).bind(referrerId, newUserId, timestamp).first<Referral>();
    
    if (level1) {
      createdReferrals.push(level1);
    }
    
    // Get referrer's referrers (upline) for levels 2-5
    const upline = await env.DB.prepare(
      `SELECT referrer_id, level FROM referrals 
       WHERE referred_id = ? AND level < 5 
       ORDER BY level ASC`
    ).bind(referrerId).all<{ referrer_id: number; level: number }>();
    
    // Create referral relationships for upline
    for (const ancestor of upline.results) {
      const newLevel = ancestor.level + 1;
      
      const referral = await env.DB.prepare(
        `INSERT INTO referrals (referrer_id, referred_id, level, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (referrer_id, referred_id) DO NOTHING
         RETURNING *`
      ).bind(ancestor.referrer_id, newUserId, newLevel, timestamp).first<Referral>();
      
      if (referral) {
        createdReferrals.push(referral);
      }
    }
    
    return {
      status: 'success',
      data: { referrals: createdReferrals },
    };
  } catch (error) {
    console.error('Create referral chain error:', error);
    return { status: 'error', error: 'Failed to create referral chain' };
  }
}

/**
 * Calculate and record commission for a transaction
 */
export async function processReferralCommission(
  env: Env,
  userId: number,
  transactionId: number,
  transactionAmount: number
): Promise<ApiResponse<{ commissions: ReferralCommission[] }>> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Get all referrers who should receive commission
    const referrers = await env.DB.prepare(
      `SELECT referrer_id, level FROM referrals WHERE referred_id = ? ORDER BY level ASC`
    ).bind(userId).all<{ referrer_id: number; level: number }>();
    
    const createdCommissions: ReferralCommission[] = [];
    
    for (const referrer of referrers.results) {
      const rate = COMMISSION_RATES[referrer.level] ?? 0;
      if (rate <= 0) continue;
      
      const commissionAmount = transactionAmount * rate;
      
      // Create commission record
      const commission = await env.DB.prepare(
        `INSERT INTO referral_commissions 
         (referrer_id, referred_id, level, source_transaction_id, amount, commission_rate, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
         RETURNING *`
      ).bind(
        referrer.referrer_id,
        userId,
        referrer.level,
        transactionId,
        commissionAmount,
        rate,
        timestamp
      ).first<ReferralCommission>();
      
      if (commission) {
        createdCommissions.push(commission);
      }
    }
    
    return {
      status: 'success',
      data: { commissions: createdCommissions },
    };
  } catch (error) {
    console.error('Process referral commission error:', error);
    return { status: 'error', error: 'Failed to process commissions' };
  }
}

/**
 * Get referral stats summary
 */
export async function getReferralStats(
  env: Env,
  userId: number
): Promise<{
  totalReferrals: number;
  directReferrals: number;
  totalVolume: number;
  totalCommissions: number;
  pendingCommissions: number;
}> {
  const [network, totalVolume, totalCommissions, pendingCommissions] = await Promise.all([
    getReferralNetwork(env, userId),
    getPartnerVolume(env, userId),
    getTotalCommissions(env, userId),
    getPendingCommissions(env, userId),
  ]);
  
  const directReferrals = network.filter(r => r.level === 1).length;
  
  return {
    totalReferrals: network.length,
    directReferrals,
    totalVolume,
    totalCommissions,
    pendingCommissions,
  };
}
