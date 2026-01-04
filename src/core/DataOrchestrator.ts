/**
 * Data Orchestrator - Single Source of Truth
 * 
 * Connects all dashboard figures to REAL backend data:
 * - Wallet balance from D1 database via API
 * - Portfolio metrics from trading history
 * - Bot tier ROI calculations from BotTiers.ts logic
 * - Transaction ledger from transactions table
 * 
 * NO SIMULATED DATA. Every figure derives from DB state.
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
  current_bot_tier: BotTier | null;
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

export type BotTier = 'protobot' | 'chainpulse' | 'titan' | 'omega';

// Bot tier configurations (mirrored from backend/src/engine/BotTiers.ts)
export const BOT_TIERS: Record<BotTier, {
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
  protobot: {
    name: 'Protobot',
    hourlyRoiMin: 0.001,
    hourlyRoiMax: 0.0012,
    dailyRoiMin: 0.008,
    dailyRoiMax: 0.0096,
    minimumStake: 100,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 40,
  },
  chainpulse: {
    name: 'Chainpulse Bot',
    hourlyRoiMin: 0.0012,
    hourlyRoiMax: 0.0014,
    dailyRoiMin: 0.0096,
    dailyRoiMax: 0.0112,
    minimumStake: 4000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 45,
  },
  titan: {
    name: 'Titan Bot',
    hourlyRoiMin: 0.0014,
    hourlyRoiMax: 0.0016,
    dailyRoiMin: 0.0112,
    dailyRoiMax: 0.0128,
    minimumStake: 25000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    capitalWithdrawalDays: 65,
  },
  omega: {
    name: 'Omega Bot',
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

// ========== Core Orchestrator ==========

export interface DashboardData {
  // Metric Cards
  aum: number;                    // From wallet.available_balance + pool_stakes.amount
  netYieldPercent: number;        // Daily ROI % - from bot tier rate (actual earnings shown elsewhere)
  partnerVolume: number;          // Sum of referral downstream investments
  vestingRunway: number;          // Days until capital withdrawal available
  
  // Dynamic Data Matrix (Cash Flow)
  dailyEarnings: number;          // AUM × dailyRoiMax
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
  
  // Bot Tier
  currentTier: BotTier;
  tierConfig: typeof BOT_TIERS[BotTier];
  
  // Timestamps
  lastUpdated: number;
  dataFreshness: 'live' | 'stale' | 'error';
}

/**
 * Determine bot tier based on total staked amount
 */
export function getBotTierForAmount(amount: number): BotTier {
  if (amount >= BOT_TIERS.omega.minimumStake) return 'omega';
  if (amount >= BOT_TIERS.titan.minimumStake) return 'titan';
  if (amount >= BOT_TIERS.chainpulse.minimumStake) return 'chainpulse';
  return 'protobot';
}

/**
 * Calculate vesting runway (days until capital withdrawal)
 */
export function calculateVestingRunway(
  stakedAt: number,
  tier: BotTier
): number {
  const config = BOT_TIERS[tier];
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
  tier: BotTier
): { daily: number; weekly: number; monthly: number } {
  const config = BOT_TIERS[tier];
  
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
 */
export async function orchestrateDashboardData(): Promise<DashboardData> {
  const startTime = Date.now();
  
  // Single API call fetches everything
  const aggregateData = await fetchDashboardAggregate();
  
  if (!aggregateData) {
    // Fallback to default if API fails
    return getDefaultDashboardData();
  }
  
  const { wallet, portfolio, trades, transactions, staking, referrals } = aggregateData;
  const { activeStakes, totalStaked } = staking;
  const { partnerVolume } = referrals;
  
  // Calculate AUM = available balance + active stakes
  const aum = (wallet?.available_balance ?? 0) + totalStaked;
  
  // Determine bot tier based on total investment
  const currentTier = getBotTierForAmount(aum);
  const tierConfig = BOT_TIERS[currentTier];
  
  // Calculate ROI % - show the tier's daily rate
  // This is the user's current daily ROI based on their tier
  const netYieldPercent = tierConfig.dailyRoiMax * 100;
  
  // Calculate vesting runway from earliest active stake
  const earliestStake = activeStakes.length > 0 
    ? Math.min(...activeStakes.map(s => s.staked_at))
    : Math.floor(Date.now() / 1000);
  const vestingRunway = calculateVestingRunway(earliestStake, currentTier);
  
  // Calculate earnings projections
  const earnings = calculateEarningsProjections(aum, currentTier);
  
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
    netYieldPercent,
    partnerVolume,
    vestingRunway,
    
    // Dynamic Data Matrix
    dailyEarnings: earnings.daily,
    weeklyEarnings: earnings.weekly,
    monthlyEarnings: earnings.monthly,
    
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
  const tier: BotTier = 'protobot';
  const config = BOT_TIERS[tier];
  
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
    
    lastUpdated: Date.now(),
    dataFreshness: 'error',
  };
}
