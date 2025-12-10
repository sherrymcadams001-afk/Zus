/**
 * Shared TypeScript types for Enterprise Trading Platform
 */

// ============================================
// Environment
// ============================================

export interface Env {
  DB: D1Database;
  NOWPAYMENTS_API_KEY: string;
  NOWPAYMENTS_IPN_SECRET: string;
}

// ============================================
// Bot Tiers (Single Source of Truth)
// ============================================

export type BotTier = 'delta' | 'gamma' | 'alpha' | 'omega';

export interface BotTierConfig {
  name: string;
  hourlyRoiMin: number;
  hourlyRoiMax: number;
  dailyRoiMin: number;
  dailyRoiMax: number;
  minimumStake: number;
  tradingHoursPerDay: number;
  tradingDaysPerWeek: number;
  roiWithdrawalHours: number;
  capitalWithdrawalDays: number;
  investmentDurationDays: number;
}

// ============================================
// Users & Authentication
// ============================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  kyc_status: 'pending' | 'approved' | 'rejected';
  referrer_id: number | null;
  referral_code: string;
  created_at: number;
  updated_at: number;
}

export interface UserSession {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: number;
  created_at: number;
}

export interface AuthResponse {
  status: 'success' | 'error';
  data?: {
    user: Omit<User, 'password_hash'>;
    token: string;
    refreshToken?: string;
  };
  error?: string;
}

// ============================================
// Wallets & Transactions
// ============================================

export interface Wallet {
  id: number;
  user_id: number;
  available_balance: number;
  locked_balance: number;
  pending_balance: number;
  currency: string;
  updated_at: number;
}

export type TransactionType = 
  | 'deposit'
  | 'withdraw'
  | 'trade_profit'
  | 'trade_loss'
  | 'pool_stake'
  | 'pool_unstake'
  | 'roi_payout'
  | 'referral_commission';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: number;
  user_id: number;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string | null;
  metadata: string | null; // JSON string
  created_at: number;
  completed_at: number | null;
}

// ============================================
// Portfolios & Trading
// ============================================

export interface Portfolio {
  id: number;
  user_id: number;
  total_invested: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  current_bot_tier: BotTier | null;
  updated_at: number;
}

export type TradingSessionStatus = 'active' | 'stopped' | 'completed';

export interface TradingSession {
  id: number;
  user_id: number;
  bot_tier: BotTier;
  stake_amount: number;
  status: TradingSessionStatus;
  start_balance: number;
  current_balance: number;
  total_pnl: number;
  started_at: number;
  stopped_at: number | null;
}

export interface Trade {
  id: number;
  user_id: number;
  session_id: number | null;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl: number;
  created_at: number;
}

// ============================================
// Pools & Staking
// ============================================

export type PoolStatus = 'active' | 'paused' | 'closed';

export interface Pool {
  id: number;
  name: string;
  bot_tier: BotTier;
  min_stake: number;
  max_stake: number | null;
  total_capacity: number | null;
  current_staked: number;
  roi_min: number;
  roi_max: number;
  lock_period_days: number;
  status: PoolStatus;
  created_at: number;
  updated_at: number;
}

export type PoolStakeStatus = 'active' | 'unstaked' | 'matured';

export interface PoolStake {
  id: number;
  user_id: number;
  pool_id: number;
  amount: number;
  status: PoolStakeStatus;
  staked_at: number;
  unstake_available_at: number;
  unstaked_at: number | null;
  total_earned: number;
}

// ============================================
// Referrals
// ============================================

export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number; // 1-5
  created_at: number;
}

export type CommissionStatus = 'pending' | 'paid' | 'cancelled';

export interface ReferralCommission {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  source_transaction_id: number | null;
  amount: number;
  commission_rate: number;
  status: CommissionStatus;
  created_at: number;
  paid_at: number | null;
}

// ============================================
// System
// ============================================

export type PayoutType = 'roi' | 'commission' | 'withdrawal';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payout {
  id: number;
  user_id: number;
  type: PayoutType;
  amount: number;
  status: PayoutStatus;
  scheduled_at: number;
  processed_at: number | null;
  metadata: string | null; // JSON string
}

export type NotificationType = 'trade' | 'payout' | 'referral' | 'system';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: number; // SQLite boolean (0 or 1)
  metadata: string | null; // JSON string
  created_at: number;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  resource_type: string | null;
  resource_id: number | null;
  details: string | null; // JSON string
  ip_address: string | null;
  created_at: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
