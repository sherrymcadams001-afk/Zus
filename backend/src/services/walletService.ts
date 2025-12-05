/**
 * Wallet Service
 * 
 * Handles wallet operations including balance updates, deposits, and withdrawals.
 */

import { Env, Wallet, Transaction, ApiResponse } from '../types';

// Validation constants
const MAX_DEPOSIT_AMOUNT = 1000000; // Maximum single deposit in USD

/**
 * Get user wallet
 */
export async function getUserWallet(env: Env, userId: number): Promise<Wallet | null> {
  const wallet = await env.DB.prepare(
    'SELECT * FROM wallets WHERE user_id = ?'
  ).bind(userId).first<Wallet>();
  
  return wallet;
}

/**
 * Create wallet for new user
 */
export async function createWallet(env: Env, userId: number, currency = 'USD'): Promise<Wallet> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  const result = await env.DB.prepare(
    `INSERT INTO wallets (user_id, available_balance, locked_balance, pending_balance, currency, updated_at)
     VALUES (?, 0, 0, 0, ?, ?)
     RETURNING *`
  ).bind(userId, currency, timestamp).first<Wallet>();
  
  if (!result) {
    throw new Error('Failed to create wallet');
  }
  
  return result;
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  env: Env,
  userId: number,
  availableDelta: number,
  lockedDelta: number = 0,
  pendingDelta: number = 0
): Promise<Wallet | null> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Get current wallet
  const wallet = await getUserWallet(env, userId);
  if (!wallet) return null;
  
  // Calculate new balances
  const newAvailable = wallet.available_balance + availableDelta;
  const newLocked = wallet.locked_balance + lockedDelta;
  const newPending = wallet.pending_balance + pendingDelta;
  
  // Validate balances don't go negative
  if (newAvailable < 0 || newLocked < 0 || newPending < 0) {
    throw new Error('Insufficient balance');
  }
  
  // Update wallet
  const updated = await env.DB.prepare(
    `UPDATE wallets 
     SET available_balance = ?, locked_balance = ?, pending_balance = ?, updated_at = ?
     WHERE user_id = ?
     RETURNING *`
  ).bind(newAvailable, newLocked, newPending, timestamp, userId).first<Wallet>();
  
  return updated;
}

/**
 * Process deposit
 */
export async function processDeposit(
  env: Env,
  userId: number,
  amount: number,
  description?: string
): Promise<ApiResponse<{ wallet: Wallet; transaction: Transaction }>> {
  try {
    if (amount <= 0) {
      return { status: 'error', error: 'Deposit amount must be positive' };
    }
    
    if (amount > MAX_DEPOSIT_AMOUNT) {
      return { status: 'error', error: `Maximum deposit is $${MAX_DEPOSIT_AMOUNT.toLocaleString()}` };
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create transaction record
    const transaction = await env.DB.prepare(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at, completed_at)
       VALUES (?, 'deposit', ?, 'completed', ?, ?, ?)
       RETURNING *`
    ).bind(userId, amount, description || 'Deposit', timestamp, timestamp).first<Transaction>();
    
    if (!transaction) {
      return { status: 'error', error: 'Failed to create transaction' };
    }
    
    // Update wallet
    const wallet = await updateWalletBalance(env, userId, amount);
    
    if (!wallet) {
      return { status: 'error', error: 'Wallet not found' };
    }
    
    return {
      status: 'success',
      data: { wallet, transaction },
    };
  } catch (error) {
    console.error('Deposit error:', error instanceof Error ? error.message : 'Unknown error', error);
    return { status: 'error', error: 'Deposit failed' };
  }
}

/**
 * Process withdrawal
 * 
 * NOTE: Race condition exists - the balance check and update are not atomic.
 * Between reading the wallet and updating it, another transaction could modify 
 * the balance. This could lead to:
 * - Negative balances if two withdrawals happen simultaneously
 * - Incorrect balance calculations
 * 
 * Solution requires database transaction support. When D1 supports transactions:
 * 1. Wrap balance check and update in a transaction
 * 2. Use optimistic locking with a version column
 * 3. Add database-level constraints to prevent negative balances
 */
export async function processWithdrawal(
  env: Env,
  userId: number,
  amount: number,
  description?: string
): Promise<ApiResponse<{ wallet: Wallet; transaction: Transaction }>> {
  try {
    if (amount <= 0) {
      return { status: 'error', error: 'Withdrawal amount must be positive' };
    }
    
    // Check if user has sufficient balance
    const wallet = await getUserWallet(env, userId);
    if (!wallet) {
      return { status: 'error', error: 'Wallet not found' };
    }
    
    if (wallet.available_balance < amount) {
      return { status: 'error', error: 'Insufficient balance' };
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create transaction record
    const transaction = await env.DB.prepare(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES (?, 'withdraw', ?, 'pending', ?, ?)
       RETURNING *`
    ).bind(userId, amount, description || 'Withdrawal', timestamp).first<Transaction>();
    
    if (!transaction) {
      return { status: 'error', error: 'Failed to create transaction' };
    }
    
    // Move funds from available to pending
    const updatedWallet = await updateWalletBalance(env, userId, -amount, 0, amount);
    
    if (!updatedWallet) {
      return { status: 'error', error: 'Failed to update wallet' };
    }
    
    return {
      status: 'success',
      data: { wallet: updatedWallet, transaction },
    };
  } catch (error) {
    console.error('Withdrawal error:', error);
    return { status: 'error', error: error instanceof Error ? error.message : 'Withdrawal failed' };
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  env: Env,
  userId: number,
  limit = 50,
  offset = 0
): Promise<Transaction[]> {
  const transactions = await env.DB.prepare(
    `SELECT * FROM transactions 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`
  ).bind(userId, limit, offset).all<Transaction>();
  
  return transactions.results;
}
