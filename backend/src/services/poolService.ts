/**
 * Pools Service
 * 
 * Handles staking pool operations.
 */

import { Env, ApiResponse } from '../types';

export interface Pool {
  id: number;
  name: string;
  bot_tier: string;
  min_stake: number;
  max_stake: number | null;
  total_capacity: number | null;
  current_staked: number;
  roi_min: number;
  roi_max: number;
  lock_period_days: number;
  status: 'active' | 'paused' | 'closed';
  created_at: number;
  updated_at: number;
}

export interface PoolStake {
  id: number;
  user_id: number;
  pool_id: number;
  amount: number;
  status: 'active' | 'unstaked' | 'matured';
  staked_at: number;
  unstake_available_at: number;
  unstaked_at: number | null;
  total_earned: number;
}

/**
 * Get all active pools
 */
export async function getActivePools(env: Env): Promise<Pool[]> {
  const pools = await env.DB.prepare(
    `SELECT * FROM pools WHERE status = 'active' ORDER BY min_stake ASC`
  ).all<Pool>();
  
  return pools.results;
}

/**
 * Get user's active stakes
 */
export async function getUserStakes(env: Env, userId: number): Promise<PoolStake[]> {
  const stakes = await env.DB.prepare(
    `SELECT * FROM pool_stakes WHERE user_id = ? ORDER BY staked_at DESC`
  ).bind(userId).all<PoolStake>();
  
  return stakes.results;
}

/**
 * Get user's active stakes only
 */
export async function getUserActiveStakes(env: Env, userId: number): Promise<PoolStake[]> {
  const stakes = await env.DB.prepare(
    `SELECT * FROM pool_stakes WHERE user_id = ? AND status = 'active' ORDER BY staked_at DESC`
  ).bind(userId).all<PoolStake>();
  
  return stakes.results;
}

/**
 * Create a new stake in a pool
 */
export async function createStake(
  env: Env,
  userId: number,
  poolId: number,
  amount: number
): Promise<ApiResponse<{ stake: PoolStake }>> {
  try {
    // Get pool details
    const pool = await env.DB.prepare(
      'SELECT * FROM pools WHERE id = ? AND status = ?'
    ).bind(poolId, 'active').first<Pool>();
    
    if (!pool) {
      return { status: 'error', error: 'Pool not found or inactive' };
    }
    
    // Validate stake amount
    if (amount < pool.min_stake) {
      return { status: 'error', error: `Minimum stake is $${pool.min_stake}` };
    }
    
    if (pool.max_stake !== null && amount > pool.max_stake) {
      return { status: 'error', error: `Maximum stake is $${pool.max_stake}` };
    }
    
    // Check capacity
    if (pool.total_capacity !== null) {
      const remainingCapacity = pool.total_capacity - pool.current_staked;
      if (amount > remainingCapacity) {
        return { status: 'error', error: 'Insufficient pool capacity' };
      }
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const unstakeAvailableAt = timestamp + (pool.lock_period_days * 24 * 60 * 60);
    
    // Create stake
    const stake = await env.DB.prepare(
      `INSERT INTO pool_stakes (user_id, pool_id, amount, status, staked_at, unstake_available_at, total_earned)
       VALUES (?, ?, ?, 'active', ?, ?, 0)
       RETURNING *`
    ).bind(userId, poolId, amount, timestamp, unstakeAvailableAt).first<PoolStake>();
    
    if (!stake) {
      return { status: 'error', error: 'Failed to create stake' };
    }
    
    // Update pool's current staked amount
    await env.DB.prepare(
      `UPDATE pools SET current_staked = current_staked + ?, updated_at = ? WHERE id = ?`
    ).bind(amount, timestamp, poolId).run();
    
    return {
      status: 'success',
      data: { stake },
    };
  } catch (error) {
    console.error('Create stake error:', error);
    return { status: 'error', error: 'Failed to create stake' };
  }
}

/**
 * Calculate and credit ROI payout for a stake
 */
export async function processRoiPayout(
  env: Env,
  stake: PoolStake
): Promise<ApiResponse<{ payout: number }>> {
  try {
    // Get pool to determine ROI rate
    const pool = await env.DB.prepare(
      'SELECT * FROM pools WHERE id = ?'
    ).bind(stake.pool_id).first<Pool>();
    
    if (!pool) {
      return { status: 'error', error: 'Pool not found' };
    }
    
    // Calculate daily ROI (average of min/max)
    const dailyRoi = (pool.roi_min + pool.roi_max) / 2;
    const payout = stake.amount * dailyRoi;
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Update stake's total earned
    await env.DB.prepare(
      `UPDATE pool_stakes SET total_earned = total_earned + ? WHERE id = ?`
    ).bind(payout, stake.id).run();
    
    // Credit to user's wallet
    await env.DB.prepare(
      `UPDATE wallets SET available_balance = available_balance + ?, updated_at = ? WHERE user_id = ?`
    ).bind(payout, timestamp, stake.user_id).run();
    
    // Create transaction record
    await env.DB.prepare(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at, completed_at)
       VALUES (?, 'roi_payout', ?, 'completed', ?, ?, ?)`
    ).bind(stake.user_id, payout, `ROI payout from ${pool.name}`, timestamp, timestamp).run();
    
    return {
      status: 'success',
      data: { payout },
    };
  } catch (error) {
    console.error('Process ROI payout error:', error);
    return { status: 'error', error: 'Failed to process payout' };
  }
}

/**
 * Get total staked amount for a user
 */
export async function getTotalStaked(env: Env, userId: number): Promise<number> {
  const result = await env.DB.prepare(
    `SELECT SUM(amount) as total FROM pool_stakes WHERE user_id = ? AND status = 'active'`
  ).bind(userId).first<{ total: number }>();
  
  return result?.total ?? 0;
}

/**
 * Get total earned from stakes for a user
 */
export async function getTotalEarned(env: Env, userId: number): Promise<number> {
  const result = await env.DB.prepare(
    `SELECT SUM(total_earned) as total FROM pool_stakes WHERE user_id = ?`
  ).bind(userId).first<{ total: number }>();
  
  return result?.total ?? 0;
}
