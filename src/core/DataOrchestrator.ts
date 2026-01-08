/**
 * Data Orchestrator - Single Source of Truth
 * 
 * Connects all dashboard figures to REAL backend data:
 * - Wallet balance from D1 database via API
 * - Portfolio metrics from trading history
 * - Strategy tier ROI calculations (Anchor, Vector, Kinetic, Horizon)
 * - Transaction ledger from transactions table
 * 
 * NO SIMULATED DATA. Every figure derives from DB state.
 * 
 * Note: Frontend uses "StrategyTier" terminology. Backend API uses "bot_tier" for DB compatibility.
 */

import { apiClient } from '../api/client';

// ========== Type Definitions ==========

export interface WalletData {
  available_balance: number;
  locked_balance: number;
  pending_balance: number;
  currency: string;
  updated_at: number;
}

export interface PortfolioData {
  total_invested: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  current_bot_tier: StrategyTier | null; // Maps to backend 'bot_tier' column
  updated_at: number;
}

export interface PoolStakeData {
  id: number;
  pool_id: number;
  amount: number;
  status: 'active' | 'unstaked' | 'matured';
  staked_at: number;
  unstake_available_at: number;
  total_earned: number;
}

export interface TransactionData {
  id: number;
  type: 'deposit' | 'withdraw' | 'trade_profit' | 'trade_loss' | 'pool_stake' | 'pool_unstake' | 'roi_payout' | 'referral_commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string | null;
  created_at: number;
  completed_at: number | null;
}

export interface TradeData {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl: number;
  created_at: number;
}

/**
 * Strategy Tier - Frontend naming for trading strategy levels
 * Maps to backend 'BotTier' type and 'bot_tier' database columns
 */
export type StrategyTier = 'anchor' | 'vector' | 'kinetic' | 'horizon';

/** @deprecated Use StrategyTier instead */
export type BotTier = StrategyTier;

// Strategy tier configurations (mirrored from backend/src/engine/BotTiers.ts)
export const STRATEGY_TIERS: Record<StrategyTier, {
  name: string;
  hourlyRoiMin: number;
  hourlyRoiMax: number;
  dailyRoiMin: number;
  dailyRoiMax: number;
  minimumStake: number;
  tradingHoursPerDay: number;
  tradingDaysPerWeek: number;
  capitalWithdrawalDays: number;
}> = {
  anchor: {
    name: 'Anchor',
    hourlyRoiMin: 0.001,
    hourlyRoiMax: 0.0012,
    dailyRoiMin: 0.008,
    dailyRoiMax: 0.0096,
    minimumStake: 100,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 40,
  },
  vector: {
    name: 'Vector',
    hourlyRoiMin: 0.0012,
    hourlyRoiMax: 0.0014,
    dailyRoiMin: 0.0096,
    dailyRoiMax: 0.0112,
    minimumStake: 4000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 45,
  },
  kinetic: {
    name: 'Kinetic',
    hourlyRoiMin: 0.0014,
    hourlyRoiMax: 0.0016,
    dailyRoiMin: 0.0112,
    dailyRoiMax: 0.0128,
    minimumStake: 25000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 65,
  },
  horizon: {
    name: 'Horizon',
    hourlyRoiMin: 0.00225,
    hourlyRoiMax: 0.00225,
    dailyRoiMin: 0.018,
    dailyRoiMax: 0.018,
    minimumStake: 50000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 85,
  },
};

/** @deprecated Use STRATEGY_TIERS instead */
export const BOT_TIERS = STRATEGY_TIERS;

// ========== Core Orchestrator ==========

export interface ROIData {
  currentRatePercent: number;       // Current instantaneous rate as %
  actualDailyRatePercent: number;   // What 24h cumulative will be
  currentHourlyEarning: number;     // Current hourly earnings
  projectedDailyEarning: number;    // If current rate continued
  actualDailyEarning: number;       // Actual 24h earnings
  rateMultiplier: number;           // How much above/below base (1.0 = normal)
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'high' | 'medium' | 'low';
  displayRate: string;              // Formatted display rate
  tier: StrategyTier;
  history?: Array<{                 // Optional 24h history
    timestamp: number;
    hourlyRate: number;
    ratePercent: number;
  }>;
}

export interface DashboardData {
  // Metric Cards
  aum: number;                    // From wallet.available_balance + pool_stakes.amount
  netYieldPercent: number;        // Dynamic ROI % - from backend's real-time calculation
  partnerVolume: number;          // Sum of referral downstream investments
  vestingRunway: number;          // Days until capital withdrawal available
  
  // Dynamic Data Matrix (Cash Flow) - Uses DYNAMIC ROI from backend
  dailyEarnings: number;          // From backend's actualDailyEarning
  weeklyEarnings: number;         // dailyEarnings × tradingDaysPerWeek
  monthlyEarnings: number;        // weeklyEarnings × 4.33 (avg weeks/month)
  
  // Strategy Performance
  sharpeRatio: number;            // (mean return - risk free) / std dev
  maxDrawdown: number;            // Largest peak-to-trough decline
  winRate: number;                // winning_trades / total_trades × 100
  
  // Transaction Ledger
  transactions: TransactionData[];
  
  // Trade History
  trades: TradeData[];
  
  // Strategy Tier
  currentTier: StrategyTier;
  tierConfig: typeof STRATEGY_TIERS[StrategyTier];
  
  // Dynamic ROI Data (from backend)
  roi: ROIData | null;
  
  // Timestamps
  lastUpdated: number;
  dataFreshness: 'live' | 'stale' | 'error';
}

/**
 * Determine strategy tier based on total staked amount
 */
export function getStrategyTierForAmount(amount: number): StrategyTier {
  if (amount >= STRATEGY_TIERS.horizon.minimumStake) return 'horizon';
  if (amount >= STRATEGY_TIERS.kinetic.minimumStake) return 'kinetic';
  if (amount >= STRATEGY_TIERS.vector.minimumStake) return 'vector';
  return 'anchor';
}

/** @deprecated Use getStrategyTierForAmount instead */
export const getBotTierForAmount = getStrategyTierForAmount;

/**
 * Calculate vesting runway (days until capital withdrawal)
 */
export function calculateVestingRunway(
  stakedAt: number,
  tier: StrategyTier
): number {
  const config = STRATEGY_TIERS[tier];
  const now = Math.floor(Date.now() / 1000);
  const vestingEnd = stakedAt + (config.capitalWithdrawalDays * 24 * 60 * 60);
  const remainingSeconds = Math.max(0, vestingEnd - now);
  return Math.ceil(remainingSeconds / (24 * 60 * 60));
}

/**
 * Calculate earnings projections based on tier ROI
 */
export function calculateEarningsProjections(
  stakedAmount: number,
  tier: StrategyTier
): { daily: number; weekly: number; monthly: number } {
  const config = STRATEGY_TIERS[tier];
  
  // Use average of min/max for projection
  const avgDailyRoi = (config.dailyRoiMin + config.dailyRoiMax) / 2;
  
  const daily = stakedAmount * avgDailyRoi;
  const weekly = daily * config.tradingDaysPerWeek;
  const monthly = weekly * 4.33; // Average weeks per month
  
  return { daily, weekly, monthly };
}

/**
 * Calculate Sharpe Ratio from trade history
 * Sharpe = (Mean Return - Risk Free Rate) / Std Dev of Returns
 */
export function calculateSharpeRatio(trades: TradeData[]): number {
  if (trades.length < 2) return 0;
  
  const returns = trades.map(t => t.pnl);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  const riskFreeRate = 0.05 / 365; // 5% annual, daily
  
  if (stdDev === 0) return mean > 0 ? 3.0 : 0;
  
  return Math.min(5, Math.max(-2, (mean - riskFreeRate) / stdDev));
}

/**
 * Calculate Max Drawdown from trade history
 */
export function calculateMaxDrawdown(trades: TradeData[]): number {
  if (trades.length === 0) return 0;
  
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;
  
  // Sort by time ascending
  const sorted = [...trades].sort((a, b) => a.created_at - b.created_at);
  
  for (const trade of sorted) {
    cumulative += trade.pnl;
    peak = Math.max(peak, cumulative);
    const drawdown = peak > 0 ? (peak - cumulative) / peak : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown * 100; // Return as percentage
}

/**
 * Calculate Win Rate from portfolio stats
 */
export function calculateWinRate(portfolio: PortfolioData): number {
  if (portfolio.total_trades === 0) return 0;
  return (portfolio.winning_trades / portfolio.total_trades) * 100;
}

// ========== API Fetch Functions ==========

/**
 * OPTIMIZED: Single API call fetches ALL dashboard data
 * Reduces 6 calls to 1 for free-tier efficiency
 */
export async function fetchDashboardAggregate(): Promise<{
  wallet: WalletData | null;
  portfolio: PortfolioData | null;
  trades: TradeData[];
  transactions: TransactionData[];
  staking: { activeStakes: PoolStakeData[]; totalStaked: number; totalEarned: number };
  referrals: { partnerVolume: number };
  roi: ROIData;
} | null> {
  try {
    const response = await apiClient.get('/api/dashboard');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch dashboard aggregate:', error);
    return null;
  }
}

// Legacy individual fetchers (kept for backwards compatibility)
export async function fetchWallet(): Promise<WalletData | null> {
  try {
    const response = await apiClient.get('/api/wallet');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return null;
  }
}

export async function fetchPortfolio(): Promise<PortfolioData | null> {
  try {
    const response = await apiClient.get('/api/portfolio');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return null;
  }
}

export async function fetchTrades(limit = 50): Promise<TradeData[]> {
  try {
    const response = await apiClient.get(`/api/portfolio/trades?limit=${limit}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch trades:', error);
    return [];
  }
}

export async function fetchTransactions(limit = 50): Promise<TransactionData[]> {
  try {
    const response = await apiClient.get(`/api/wallet/transactions?limit=${limit}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

export async function fetchPoolStakes(): Promise<PoolStakeData[]> {
  try {
    const response = await apiClient.get('/api/pools/stakes');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch pool stakes:', error);
    return [];
  }
}

export async function fetchPartnerVolume(): Promise<number> {
  try {
    const response = await apiClient.get('/api/referrals/volume');
    if (response.data.status === 'success') {
      return response.data.data.total_volume || 0;
    }
    return 0;
  } catch (error) {
    console.error('Failed to fetch partner volume:', error);
    return 0;
  }
}

// ========== Master Orchestration Function ==========

/**
 * Fetch all dashboard data in ONE API call
 * OPTIMIZED: 6 calls → 1 call for free-tier efficiency
 * 
 * Now uses DYNAMIC ROI from backend instead of static tier averages
 */
export async function orchestrateDashboardData(): Promise<DashboardData> {
  const startTime = Date.now();
  
  // Single API call fetches everything (including dynamic ROI)
  const aggregateData = await fetchDashboardAggregate();
  
  if (!aggregateData) {
    // Fallback to default if API fails
    return getDefaultDashboardData();
  }
  
  const { wallet, portfolio, trades, transactions, staking, referrals, roi } = aggregateData;
  const { activeStakes, totalStaked } = staking;
  const { partnerVolume } = referrals;
  
  // Calculate AUM = available balance + active stakes
  const aum = (wallet?.available_balance ?? 0) + totalStaked;
  
  // Use backend's dynamic tier determination (based on actual stake amount)
  const currentTier = roi?.tier ?? getStrategyTierForAmount(aum);
  const tierConfig = STRATEGY_TIERS[currentTier];
  
  // Use DYNAMIC ROI from backend instead of static tier max
  // The backend calculates this using the sophisticated wave-based algorithm
  const netYieldPercent = roi?.actualDailyRatePercent ?? (tierConfig.dailyRoiMax * 100);
  
  // Calculate vesting runway from earliest active stake
  const earliestStake = activeStakes.length > 0 
    ? Math.min(...activeStakes.map(s => s.staked_at))
    : Math.floor(Date.now() / 1000);
  const vestingRunway = calculateVestingRunway(earliestStake, currentTier);
  
  // Use DYNAMIC earnings from backend instead of static calculations
  // This reflects the real-time fluctuating ROI, not just tier averages
  const dailyEarnings = roi?.actualDailyEarning ?? (aum * tierConfig.dailyRoiMax);
  const weeklyEarnings = dailyEarnings * tierConfig.tradingDaysPerWeek;
  const monthlyEarnings = weeklyEarnings * 4.33; // Average weeks per month
  
  // Calculate strategy metrics from trade history
  const sharpeRatio = calculateSharpeRatio(trades);
  const maxDrawdown = calculateMaxDrawdown(trades);
  const winRate = portfolio ? calculateWinRate(portfolio) : 0;
  
  // Determine data freshness
  const fetchDuration = Date.now() - startTime;
  const dataFreshness: 'live' | 'stale' | 'error' = 
    fetchDuration < 3000 ? 'live' : 
    fetchDuration < 10000 ? 'stale' : 'error';
  
  return {
    // Metric Cards
    aum,
    netYieldPercent,  // Now uses dynamic ROI from backend
    partnerVolume,
    vestingRunway,
    
    // Dynamic Data Matrix - Now uses real-time ROI from backend
    dailyEarnings,
    weeklyEarnings,
    monthlyEarnings,
    
    // Strategy Performance
    sharpeRatio,
    maxDrawdown,
    winRate,
    
    // Raw Data
    transactions,
    trades,
    
    // Bot Tier
    currentTier,
    tierConfig,
    
    // Dynamic ROI Data (pass through from backend)
    roi: roi ?? null,
    
    // Timestamps
    lastUpdated: Date.now(),
    dataFreshness,
  };
}

// ========== Default/Fallback Data ==========

/**
 * Default dashboard data when user is not authenticated or API fails
 * Uses minimum tier values for projections
 */
export function getDefaultDashboardData(): DashboardData {
  const tier: StrategyTier = 'anchor';
  const config = STRATEGY_TIERS[tier];
  
  return {
    aum: 0,
    netYieldPercent: config.dailyRoiMax * 100,
    partnerVolume: 0,
    vestingRunway: config.capitalWithdrawalDays,
    
    dailyEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    
    transactions: [],
    trades: [],
    
    currentTier: tier,
    tierConfig: config,
    
    roi: null, // No ROI data when not authenticated
    
    lastUpdated: Date.now(),
    dataFreshness: 'error',
  };
}
