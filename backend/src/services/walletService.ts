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
 * Set absolute wallet balance (Admin/System override)
 */
export async function setWalletBalance(
  env: Env,
  userId: number,
  balance: number,
  currency = 'USD'
): Promise<Wallet> {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Check if wallet exists
  const wallet = await getUserWallet(env, userId);
  
  if (wallet) {
    // Update existing
    const updated = await env.DB.prepare(
      `UPDATE wallets 
       SET available_balance = ?, currency = ?, updated_at = ?
       WHERE user_id = ?
       RETURNING *`
    ).bind(balance, currency, timestamp, userId).first<Wallet>();
    
    if (!updated) throw new Error('Failed to update wallet');
    return updated;
  } else {
    // Create new
    const newWallet = await env.DB.prepare(
      `INSERT INTO wallets (user_id, available_balance, locked_balance, pending_balance, currency, updated_at)
       VALUES (?, ?, 0, 0, ?, ?)
       RETURNING *`
    ).bind(userId, balance, currency, timestamp).first<Wallet>();
    
    if (!newWallet) throw new Error('Failed to create wallet');
    return newWallet;
  }
}

/**
 * Process deposit
 */
export async function processDeposit(
  env: Env,
  userId: number,
  amount: number,
  description?: string,
  metadata?: any,
  status: 'completed' | 'pending' = 'completed'
): Promise<ApiResponse<{ wallet: Wallet | null; transaction: Transaction }>> {
  try {
    if (amount <= 0) {
      return { status: 'error', error: 'Deposit amount must be positive' };
    }
    
    if (amount > MAX_DEPOSIT_AMOUNT) {
      return { status: 'error', error: `Maximum deposit is $${MAX_DEPOSIT_AMOUNT.toLocaleString()}` };
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const completedAt = status === 'completed' ? timestamp : null;
    
    // Create transaction record
    const transaction = await env.DB.prepare(
      `INSERT INTO transactions (user_id, type, amount, status, description, metadata, created_at, completed_at)
       VALUES (?, 'deposit', ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(userId, amount, status, description || 'Deposit', metadataStr, timestamp, completedAt).first<Transaction>();
    
    if (!transaction) {
      return { status: 'error', error: 'Failed to create transaction' };
    }
    
    // Only update wallet if completed immediately (e.g. Admin deposit)
    let wallet: Wallet | null = null;
    if (status === 'completed') {
      wallet = await updateWalletBalance(env, userId, amount);
      if (!wallet) {
        return { status: 'error', error: 'Wallet not found' };
      }
    } else {
      // For pending deposits, we just return the current wallet state without changes
      wallet = await getUserWallet(env, userId);
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
 * Approve pending deposit (Admin)
 */
export async function approveDeposit(
  env: Env,
  transactionId: number
): Promise<ApiResponse<{ wallet: Wallet; transaction: Transaction }>> {
  try {
    // Get transaction
    const transaction = await env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    ).bind(transactionId).first<Transaction>();

    if (!transaction) {
      return { status: 'error', error: 'Transaction not found' };
    }

    if (transaction.status !== 'pending') {
      return { status: 'error', error: `Transaction is already ${transaction.status}` };
    }

    if (transaction.type !== 'deposit') {
      return { status: 'error', error: 'Not a deposit transaction' };
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Update transaction status
    const updatedTx = await env.DB.prepare(
      `UPDATE transactions 
       SET status = 'completed', completed_at = ? 
       WHERE id = ? 
       RETURNING *`
    ).bind(timestamp, transactionId).first<Transaction>();

    if (!updatedTx) {
      return { status: 'error', error: 'Failed to update transaction' };
    }

    // Credit user wallet
    const wallet = await updateWalletBalance(env, transaction.user_id, transaction.amount);

    if (!wallet) {
      return { status: 'error', error: 'Wallet not found' };
    }

    return {
      status: 'success',
      data: { wallet, transaction: updatedTx }
    };
  } catch (error) {
    console.error('Approve deposit error:', error);
    return { status: 'error', error: 'Failed to approve deposit' };
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
