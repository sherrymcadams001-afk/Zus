-- Enterprise Trading Platform Database Schema
-- Migration 0001: Initial Schema

-- ============================================
-- Users & Authentication
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user', 'admin'
  kyc_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  referrer_id INTEGER,
  referral_code TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (referrer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referrer_id ON users(referrer_id);

-- User sessions (JWT token management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- Wallets & Transactions
-- ============================================

-- User wallets
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  available_balance REAL NOT NULL DEFAULT 0,
  locked_balance REAL NOT NULL DEFAULT 0,
  pending_balance REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdraw', 'trade_profit', 'trade_loss', 'pool_stake', 'pool_unstake', 'roi_payout', 'referral_commission'
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  description TEXT,
  metadata TEXT, -- JSON for additional data
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  completed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- Portfolios & Trading
-- ============================================

-- User portfolio summary
CREATE TABLE IF NOT EXISTS portfolios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  total_invested REAL NOT NULL DEFAULT 0,
  total_pnl REAL NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  current_bot_tier TEXT, -- 'protobot', 'chainpulse', 'titan', 'omega'
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Trading sessions
CREATE TABLE IF NOT EXISTS trading_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bot_tier TEXT NOT NULL,
  stake_amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'stopped', 'completed'
  start_balance REAL NOT NULL,
  current_balance REAL NOT NULL,
  total_pnl REAL NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  stopped_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_status ON trading_sessions(status);

-- Individual trades
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id INTEGER,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'BUY', 'SELL'
  price REAL NOT NULL,
  quantity REAL NOT NULL,
  pnl REAL NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES trading_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_session_id ON trades(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- ============================================
-- Pools & Staking
-- ============================================

-- Staking pools
CREATE TABLE IF NOT EXISTS pools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bot_tier TEXT NOT NULL, -- Maps to bot tier for ROI rates
  min_stake REAL NOT NULL,
  max_stake REAL,
  total_capacity REAL,
  current_staked REAL NOT NULL DEFAULT 0,
  roi_min REAL NOT NULL,
  roi_max REAL NOT NULL,
  lock_period_days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'closed'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_pools_status ON pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_bot_tier ON pools(bot_tier);

-- User stakes in pools
CREATE TABLE IF NOT EXISTS pool_stakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pool_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'unstaked', 'matured'
  staked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  unstake_available_at INTEGER NOT NULL,
  unstaked_at INTEGER,
  total_earned REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (pool_id) REFERENCES pools(id)
);

CREATE INDEX IF NOT EXISTS idx_pool_stakes_user_id ON pool_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_stakes_pool_id ON pool_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_stakes_status ON pool_stakes(status);

-- ============================================
-- Referral System
-- ============================================

-- Referral relationships (supports 5 levels)
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  level INTEGER NOT NULL, -- 1-5
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id),
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON referrals(level);

-- Referral commission tracking
CREATE TABLE IF NOT EXISTS referral_commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  source_transaction_id INTEGER,
  amount REAL NOT NULL,
  commission_rate REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  paid_at INTEGER,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id),
  FOREIGN KEY (source_transaction_id) REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_id ON referral_commissions(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);

-- ============================================
-- System Tables
-- ============================================

-- Scheduled payouts
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'roi', 'commission', 'withdrawal'
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  scheduled_at INTEGER NOT NULL,
  processed_at INTEGER,
  metadata TEXT, -- JSON for additional data
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_scheduled_at ON payouts(scheduled_at);

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'trade', 'payout', 'referral', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  metadata TEXT, -- JSON for additional data
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT, -- 'user', 'wallet', 'trade', 'pool', etc.
  resource_id INTEGER,
  details TEXT, -- JSON for additional details
  ip_address TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
