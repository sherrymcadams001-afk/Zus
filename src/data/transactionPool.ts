/**
 * Transaction Pool - Tier-driven activity generation
 * 
 * Builds the platform feed from the shared strategy tier configuration so
 * deposit bands, ROI payouts, and withdrawals always stay in mathematical parity
 * with the active tier system.
 */

import {
  STRATEGY_TIER_ORDER,
  STRATEGY_TIERS,
  getAverageDailyRoi,
  type StrategyTier,
} from '../core/strategy-tiers';

export interface PooledTransaction {
  type: 'deposit' | 'trade_profit' | 'roi_payout' | 'pool_stake' | 'referral_commission' | 'withdraw';
  amount: number;
  tier: StrategyTier;
  weight: number; // Higher = more likely to be selected
}

// Generate user hashes for realism
const userPrefixes = ['0x78F2', '0x0897', '0x472F', '0x6507', '0xA3E9', '0xB1C4', '0xD5F8', '0x9E2A', '0xF4B7', '0x3C6D', '0x8A1E', '0x2D4F', '0xE7C3', '0x5B9A', '0x1F8E', '0x6A2C', '0xC4D7', '0x9F3B', '0x7E5A', '0x4B8C'];

export const USER_HASH_PREFIXES = userPrefixes;

const TIER_ACTIVITY_WEIGHT: Record<StrategyTier, number> = {
  anchor: 1.5,
  vector: 1.15,
  kinetic: 0.8,
  horizon: 0.45,
};

const AMOUNT_LADDER_PROGRESS = [0, 0.03, 0.08, 0.14, 0.22, 0.34, 0.5, 0.68, 0.82, 1];
const ROI_VARIANCE = [0.88, 0.94, 1, 1.06, 1.12];
const TRADE_MULTIPLIERS = [0.55, 0.8, 1.05, 1.35, 1.7];
const REFERRAL_MULTIPLIERS = [0.025, 0.05, 0.075, 0.1];
const WITHDRAWAL_MULTIPLIERS = [4, 8, 12, 18, 26];

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function dedupeAmounts(amounts: number[]): number[] {
  return [...new Set(amounts.map(roundCurrency))].sort((a, b) => a - b);
}

function getTierUpperBound(tier: StrategyTier): number {
  const currentIndex = STRATEGY_TIER_ORDER.indexOf(tier);
  const nextTier = STRATEGY_TIER_ORDER[currentIndex + 1];

  if (!nextTier) {
    return STRATEGY_TIERS[tier].minimumStake * 5;
  }

  return STRATEGY_TIERS[nextTier].minimumStake - 1;
}

function buildAmountLadder(minimum: number, maximum: number): number[] {
  if (maximum <= minimum) {
    return [roundCurrency(minimum)];
  }

  return dedupeAmounts(
    AMOUNT_LADDER_PROGRESS.map((progress) => minimum + ((maximum - minimum) * progress)),
  );
}

function buildWeightedTransactions(
  type: PooledTransaction['type'],
  tier: StrategyTier,
  amounts: number[],
  weightOffset: number,
): PooledTransaction[] {
  const tierWeight = TIER_ACTIVITY_WEIGHT[tier];

  return amounts.map((amount, index) => ({
    type,
    amount: roundCurrency(amount),
    tier,
    weight: Math.max(1, Math.round(((amounts.length - index) + weightOffset) * tierWeight)),
  }));
}

function buildTierTransactions(tier: StrategyTier): PooledTransaction[] {
  const config = STRATEGY_TIERS[tier];
  const minimumStake = config.minimumStake;
  const maximumStake = getTierUpperBound(tier);
  const depositAmounts = buildAmountLadder(minimumStake, maximumStake);
  const roiBaseAmounts = depositAmounts.filter((_, index) => index % 2 === 0 || index === depositAmounts.length - 1);
  const averageDailyRoi = getAverageDailyRoi(config);

  const depositTransactions = buildWeightedTransactions('deposit', tier, depositAmounts, 6);

  const roiTransactions = buildWeightedTransactions(
    'roi_payout',
    tier,
    roiBaseAmounts.flatMap((stake) => ROI_VARIANCE.map((variance) => stake * averageDailyRoi * variance)),
    4,
  );

  const tradeProfitTransactions = buildWeightedTransactions(
    'trade_profit',
    tier,
    roiBaseAmounts.flatMap((stake) => TRADE_MULTIPLIERS.map((multiplier) => stake * averageDailyRoi * multiplier)),
    3,
  );

  const referralTransactions = buildWeightedTransactions(
    'referral_commission',
    tier,
    REFERRAL_MULTIPLIERS.map((multiplier) => minimumStake * multiplier),
    2,
  );

  const poolStakeTransactions = buildWeightedTransactions(
    'pool_stake',
    tier,
    depositAmounts.filter((_, index) => index < depositAmounts.length - 1),
    2,
  );

  const withdrawals = buildWeightedTransactions(
    'withdraw',
    tier,
    roiBaseAmounts.slice(0, 5).map((stake, index) => stake * averageDailyRoi * WITHDRAWAL_MULTIPLIERS[index]),
    1,
  );

  return [
    ...depositTransactions,
    ...roiTransactions,
    ...tradeProfitTransactions,
    ...referralTransactions,
    ...poolStakeTransactions,
    ...withdrawals,
  ];
}

// ============ COMBINED TRANSACTION POOL ============

export const TRANSACTION_POOL: PooledTransaction[] = STRATEGY_TIER_ORDER.flatMap((tier) => buildTierTransactions(tier));

// Calculate total weight for weighted random selection
const TOTAL_WEIGHT = TRANSACTION_POOL.reduce((sum, tx) => sum + tx.weight, 0);

/**
 * Select a random transaction using weighted probability
 * Higher weight = more likely to appear
 */
export function selectRandomTransaction(): PooledTransaction {
  let random = Math.random() * TOTAL_WEIGHT;
  
  for (const tx of TRANSACTION_POOL) {
    random -= tx.weight;
    if (random <= 0) {
      return tx;
    }
  }
  
  // Fallback to last transaction
  return TRANSACTION_POOL[TRANSACTION_POOL.length - 1];
}

/**
 * Generate a random user hash for anonymized display
 */
export function generateUserHash(): string {
  const prefix = USER_HASH_PREFIXES[Math.floor(Math.random() * USER_HASH_PREFIXES.length)];
  const suffix = Math.random().toString(16).substring(2, 6).toUpperCase();
  return prefix + suffix + '...';
}

/**
 * Get varied pacing interval (ms) for transaction display
 * Simulates natural platform activity patterns
 */
export function getTransactionPacing(): number {
  const roll = Math.random();
  
  // 20% chance: Very fast (1.5-2.5s) - burst activity
  if (roll < 0.20) {
    return 1500 + Math.random() * 1000;
  }
  
  // 40% chance: Normal (3-5s) - regular activity
  if (roll < 0.60) {
    return 3000 + Math.random() * 2000;
  }
  
  // 30% chance: Slow (6-10s) - calm period
  if (roll < 0.90) {
    return 6000 + Math.random() * 4000;
  }
  
  // 10% chance: Very slow (12-18s) - quiet period
  return 12000 + Math.random() * 6000;
}

// Export pool count for verification
export const POOL_SIZE = TRANSACTION_POOL.length;
