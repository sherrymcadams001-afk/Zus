/**
 * Transaction Pool - 400 Contextually Relevant Platform Transactions
 * 
 * Simulates realistic platform-wide activity across all tiers:
 * - Anchor ($100-$3,999): Small retail investors
 * - Vector ($4,000-$24,999): Mid-tier investors
 * - Kinetic ($25,000-$49,999): High-value investors  
 * - Horizon ($50,000+): Institutional/whale investors
 * 
 * Transaction types match the platform's monetary structure:
 * - Capital Injection (deposits): Entry investments
 * - ROI Payout: Tier-based daily/weekly earnings
 * - Trading Profit: Active trading gains
 * - Pool Stake: LTSP liquidity participation
 * - Partner Commission: Referral network earnings
 * - Withdrawal: Profit/capital extraction
 */

export interface PooledTransaction {
  type: 'deposit' | 'trade_profit' | 'roi_payout' | 'pool_stake' | 'referral_commission' | 'withdraw';
  amount: number;
  tier: 'anchor' | 'vector' | 'kinetic' | 'horizon';
  weight: number; // Higher = more likely to be selected
}

// Generate user hashes for realism
const userPrefixes = ['0x78F2', '0x0897', '0x472F', '0x6507', '0xA3E9', '0xB1C4', '0xD5F8', '0x9E2A', '0xF4B7', '0x3C6D', '0x8A1E', '0x2D4F', '0xE7C3', '0x5B9A', '0x1F8E', '0x6A2C', '0xC4D7', '0x9F3B', '0x7E5A', '0x4B8C'];

export const USER_HASH_PREFIXES = userPrefixes;

// ============ ANCHOR TIER TRANSACTIONS ($100-$3,999) ============
// Small retail investors - high frequency, modest amounts

const anchorDeposits: PooledTransaction[] = [
  // Common entry points
  { type: 'deposit', amount: 100, tier: 'anchor', weight: 15 },
  { type: 'deposit', amount: 150, tier: 'anchor', weight: 12 },
  { type: 'deposit', amount: 200, tier: 'anchor', weight: 14 },
  { type: 'deposit', amount: 250, tier: 'anchor', weight: 10 },
  { type: 'deposit', amount: 300, tier: 'anchor', weight: 9 },
  { type: 'deposit', amount: 350, tier: 'anchor', weight: 8 },
  { type: 'deposit', amount: 400, tier: 'anchor', weight: 8 },
  { type: 'deposit', amount: 500, tier: 'anchor', weight: 12 },
  { type: 'deposit', amount: 600, tier: 'anchor', weight: 6 },
  { type: 'deposit', amount: 750, tier: 'anchor', weight: 7 },
  { type: 'deposit', amount: 800, tier: 'anchor', weight: 5 },
  { type: 'deposit', amount: 1000, tier: 'anchor', weight: 10 },
  { type: 'deposit', amount: 1200, tier: 'anchor', weight: 5 },
  { type: 'deposit', amount: 1500, tier: 'anchor', weight: 6 },
  { type: 'deposit', amount: 1750, tier: 'anchor', weight: 4 },
  { type: 'deposit', amount: 2000, tier: 'anchor', weight: 6 },
  { type: 'deposit', amount: 2500, tier: 'anchor', weight: 4 },
  { type: 'deposit', amount: 3000, tier: 'anchor', weight: 3 },
  { type: 'deposit', amount: 3500, tier: 'anchor', weight: 2 },
  { type: 'deposit', amount: 3999, tier: 'anchor', weight: 1 },
];

const anchorROI: PooledTransaction[] = [
  // Daily ROI payouts (0.8%-0.96% of stake)
  { type: 'roi_payout', amount: 0.80, tier: 'anchor', weight: 8 },
  { type: 'roi_payout', amount: 0.93, tier: 'anchor', weight: 10 },
  { type: 'roi_payout', amount: 1.12, tier: 'anchor', weight: 8 },
  { type: 'roi_payout', amount: 1.50, tier: 'anchor', weight: 7 },
  { type: 'roi_payout', amount: 1.92, tier: 'anchor', weight: 9 },
  { type: 'roi_payout', amount: 2.40, tier: 'anchor', weight: 7 },
  { type: 'roi_payout', amount: 3.84, tier: 'anchor', weight: 6 },
  { type: 'roi_payout', amount: 4.80, tier: 'anchor', weight: 8 },
  { type: 'roi_payout', amount: 7.20, tier: 'anchor', weight: 5 },
  { type: 'roi_payout', amount: 9.60, tier: 'anchor', weight: 6 },
  { type: 'roi_payout', amount: 12.00, tier: 'anchor', weight: 4 },
  { type: 'roi_payout', amount: 14.40, tier: 'anchor', weight: 4 },
  { type: 'roi_payout', amount: 19.20, tier: 'anchor', weight: 3 },
  { type: 'roi_payout', amount: 24.00, tier: 'anchor', weight: 3 },
  { type: 'roi_payout', amount: 28.80, tier: 'anchor', weight: 2 },
];

const anchorTrading: PooledTransaction[] = [
  { type: 'trade_profit', amount: 0.45, tier: 'anchor', weight: 6 },
  { type: 'trade_profit', amount: 0.78, tier: 'anchor', weight: 7 },
  { type: 'trade_profit', amount: 1.23, tier: 'anchor', weight: 8 },
  { type: 'trade_profit', amount: 1.85, tier: 'anchor', weight: 7 },
  { type: 'trade_profit', amount: 2.47, tier: 'anchor', weight: 6 },
  { type: 'trade_profit', amount: 3.12, tier: 'anchor', weight: 5 },
  { type: 'trade_profit', amount: 4.56, tier: 'anchor', weight: 4 },
  { type: 'trade_profit', amount: 5.89, tier: 'anchor', weight: 4 },
  { type: 'trade_profit', amount: 7.34, tier: 'anchor', weight: 3 },
  { type: 'trade_profit', amount: 9.21, tier: 'anchor', weight: 3 },
  { type: 'trade_profit', amount: 12.45, tier: 'anchor', weight: 2 },
  { type: 'trade_profit', amount: 15.67, tier: 'anchor', weight: 2 },
];

const anchorReferral: PooledTransaction[] = [
  { type: 'referral_commission', amount: 2.50, tier: 'anchor', weight: 5 },
  { type: 'referral_commission', amount: 5.00, tier: 'anchor', weight: 6 },
  { type: 'referral_commission', amount: 7.50, tier: 'anchor', weight: 5 },
  { type: 'referral_commission', amount: 10.00, tier: 'anchor', weight: 6 },
  { type: 'referral_commission', amount: 15.00, tier: 'anchor', weight: 4 },
  { type: 'referral_commission', amount: 25.00, tier: 'anchor', weight: 3 },
  { type: 'referral_commission', amount: 37.50, tier: 'anchor', weight: 2 },
  { type: 'referral_commission', amount: 50.00, tier: 'anchor', weight: 2 },
];

// ============ VECTOR TIER TRANSACTIONS ($4,000-$24,999) ============

const vectorDeposits: PooledTransaction[] = [
  { type: 'deposit', amount: 4000, tier: 'vector', weight: 10 },
  { type: 'deposit', amount: 4500, tier: 'vector', weight: 8 },
  { type: 'deposit', amount: 5000, tier: 'vector', weight: 12 },
  { type: 'deposit', amount: 5500, tier: 'vector', weight: 6 },
  { type: 'deposit', amount: 6000, tier: 'vector', weight: 7 },
  { type: 'deposit', amount: 6500, tier: 'vector', weight: 5 },
  { type: 'deposit', amount: 7000, tier: 'vector', weight: 6 },
  { type: 'deposit', amount: 7500, tier: 'vector', weight: 5 },
  { type: 'deposit', amount: 8000, tier: 'vector', weight: 6 },
  { type: 'deposit', amount: 8500, tier: 'vector', weight: 4 },
  { type: 'deposit', amount: 9000, tier: 'vector', weight: 5 },
  { type: 'deposit', amount: 10000, tier: 'vector', weight: 9 },
  { type: 'deposit', amount: 11000, tier: 'vector', weight: 4 },
  { type: 'deposit', amount: 12000, tier: 'vector', weight: 5 },
  { type: 'deposit', amount: 12500, tier: 'vector', weight: 4 },
  { type: 'deposit', amount: 15000, tier: 'vector', weight: 6 },
  { type: 'deposit', amount: 17500, tier: 'vector', weight: 3 },
  { type: 'deposit', amount: 20000, tier: 'vector', weight: 5 },
  { type: 'deposit', amount: 22500, tier: 'vector', weight: 2 },
  { type: 'deposit', amount: 24999, tier: 'vector', weight: 1 },
];

const vectorROI: PooledTransaction[] = [
  // Daily ROI payouts (0.96%-1.12% of stake)
  { type: 'roi_payout', amount: 38.40, tier: 'vector', weight: 7 },
  { type: 'roi_payout', amount: 44.80, tier: 'vector', weight: 8 },
  { type: 'roi_payout', amount: 48.00, tier: 'vector', weight: 9 },
  { type: 'roi_payout', amount: 56.00, tier: 'vector', weight: 8 },
  { type: 'roi_payout', amount: 67.20, tier: 'vector', weight: 6 },
  { type: 'roi_payout', amount: 76.80, tier: 'vector', weight: 6 },
  { type: 'roi_payout', amount: 86.40, tier: 'vector', weight: 5 },
  { type: 'roi_payout', amount: 96.00, tier: 'vector', weight: 7 },
  { type: 'roi_payout', amount: 112.00, tier: 'vector', weight: 5 },
  { type: 'roi_payout', amount: 134.40, tier: 'vector', weight: 4 },
  { type: 'roi_payout', amount: 144.00, tier: 'vector', weight: 5 },
  { type: 'roi_payout', amount: 168.00, tier: 'vector', weight: 4 },
  { type: 'roi_payout', amount: 192.00, tier: 'vector', weight: 3 },
  { type: 'roi_payout', amount: 224.00, tier: 'vector', weight: 3 },
  { type: 'roi_payout', amount: 279.99, tier: 'vector', weight: 2 },
];

const vectorTrading: PooledTransaction[] = [
  { type: 'trade_profit', amount: 23.45, tier: 'vector', weight: 6 },
  { type: 'trade_profit', amount: 34.78, tier: 'vector', weight: 7 },
  { type: 'trade_profit', amount: 45.67, tier: 'vector', weight: 6 },
  { type: 'trade_profit', amount: 56.89, tier: 'vector', weight: 5 },
  { type: 'trade_profit', amount: 67.23, tier: 'vector', weight: 5 },
  { type: 'trade_profit', amount: 78.45, tier: 'vector', weight: 4 },
  { type: 'trade_profit', amount: 89.12, tier: 'vector', weight: 4 },
  { type: 'trade_profit', amount: 112.34, tier: 'vector', weight: 4 },
  { type: 'trade_profit', amount: 134.56, tier: 'vector', weight: 3 },
  { type: 'trade_profit', amount: 156.78, tier: 'vector', weight: 3 },
  { type: 'trade_profit', amount: 178.90, tier: 'vector', weight: 2 },
  { type: 'trade_profit', amount: 201.23, tier: 'vector', weight: 2 },
];

const vectorReferral: PooledTransaction[] = [
  { type: 'referral_commission', amount: 100.00, tier: 'vector', weight: 5 },
  { type: 'referral_commission', amount: 125.00, tier: 'vector', weight: 5 },
  { type: 'referral_commission', amount: 150.00, tier: 'vector', weight: 4 },
  { type: 'referral_commission', amount: 187.50, tier: 'vector', weight: 4 },
  { type: 'referral_commission', amount: 250.00, tier: 'vector', weight: 4 },
  { type: 'referral_commission', amount: 312.50, tier: 'vector', weight: 3 },
  { type: 'referral_commission', amount: 375.00, tier: 'vector', weight: 2 },
  { type: 'referral_commission', amount: 500.00, tier: 'vector', weight: 2 },
];

// ============ KINETIC TIER TRANSACTIONS ($25,000-$49,999) ============

const kineticDeposits: PooledTransaction[] = [
  { type: 'deposit', amount: 25000, tier: 'kinetic', weight: 8 },
  { type: 'deposit', amount: 27500, tier: 'kinetic', weight: 6 },
  { type: 'deposit', amount: 30000, tier: 'kinetic', weight: 8 },
  { type: 'deposit', amount: 32500, tier: 'kinetic', weight: 5 },
  { type: 'deposit', amount: 35000, tier: 'kinetic', weight: 6 },
  { type: 'deposit', amount: 37500, tier: 'kinetic', weight: 4 },
  { type: 'deposit', amount: 40000, tier: 'kinetic', weight: 5 },
  { type: 'deposit', amount: 42500, tier: 'kinetic', weight: 3 },
  { type: 'deposit', amount: 45000, tier: 'kinetic', weight: 4 },
  { type: 'deposit', amount: 47500, tier: 'kinetic', weight: 2 },
  { type: 'deposit', amount: 49999, tier: 'kinetic', weight: 1 },
];

const kineticROI: PooledTransaction[] = [
  // Daily ROI payouts (1.12%-1.28% of stake)
  { type: 'roi_payout', amount: 280.00, tier: 'kinetic', weight: 6 },
  { type: 'roi_payout', amount: 308.00, tier: 'kinetic', weight: 7 },
  { type: 'roi_payout', amount: 320.00, tier: 'kinetic', weight: 8 },
  { type: 'roi_payout', amount: 336.00, tier: 'kinetic', weight: 7 },
  { type: 'roi_payout', amount: 364.00, tier: 'kinetic', weight: 5 },
  { type: 'roi_payout', amount: 392.00, tier: 'kinetic', weight: 5 },
  { type: 'roi_payout', amount: 420.00, tier: 'kinetic', weight: 5 },
  { type: 'roi_payout', amount: 448.00, tier: 'kinetic', weight: 6 },
  { type: 'roi_payout', amount: 476.00, tier: 'kinetic', weight: 4 },
  { type: 'roi_payout', amount: 504.00, tier: 'kinetic', weight: 4 },
  { type: 'roi_payout', amount: 560.00, tier: 'kinetic', weight: 4 },
  { type: 'roi_payout', amount: 576.00, tier: 'kinetic', weight: 3 },
  { type: 'roi_payout', amount: 608.00, tier: 'kinetic', weight: 3 },
  { type: 'roi_payout', amount: 639.99, tier: 'kinetic', weight: 2 },
];

const kineticTrading: PooledTransaction[] = [
  { type: 'trade_profit', amount: 156.78, tier: 'kinetic', weight: 5 },
  { type: 'trade_profit', amount: 189.34, tier: 'kinetic', weight: 5 },
  { type: 'trade_profit', amount: 234.56, tier: 'kinetic', weight: 5 },
  { type: 'trade_profit', amount: 278.90, tier: 'kinetic', weight: 4 },
  { type: 'trade_profit', amount: 312.45, tier: 'kinetic', weight: 4 },
  { type: 'trade_profit', amount: 356.78, tier: 'kinetic', weight: 3 },
  { type: 'trade_profit', amount: 401.23, tier: 'kinetic', weight: 3 },
  { type: 'trade_profit', amount: 445.67, tier: 'kinetic', weight: 2 },
  { type: 'trade_profit', amount: 489.01, tier: 'kinetic', weight: 2 },
  { type: 'trade_profit', amount: 534.56, tier: 'kinetic', weight: 2 },
];

const kineticReferral: PooledTransaction[] = [
  { type: 'referral_commission', amount: 625.00, tier: 'kinetic', weight: 4 },
  { type: 'referral_commission', amount: 750.00, tier: 'kinetic', weight: 4 },
  { type: 'referral_commission', amount: 875.00, tier: 'kinetic', weight: 3 },
  { type: 'referral_commission', amount: 1000.00, tier: 'kinetic', weight: 3 },
  { type: 'referral_commission', amount: 1125.00, tier: 'kinetic', weight: 2 },
  { type: 'referral_commission', amount: 1250.00, tier: 'kinetic', weight: 2 },
];

// ============ HORIZON TIER TRANSACTIONS ($50,000+) ============

const horizonDeposits: PooledTransaction[] = [
  { type: 'deposit', amount: 50000, tier: 'horizon', weight: 6 },
  { type: 'deposit', amount: 55000, tier: 'horizon', weight: 4 },
  { type: 'deposit', amount: 60000, tier: 'horizon', weight: 5 },
  { type: 'deposit', amount: 65000, tier: 'horizon', weight: 3 },
  { type: 'deposit', amount: 70000, tier: 'horizon', weight: 4 },
  { type: 'deposit', amount: 75000, tier: 'horizon', weight: 3 },
  { type: 'deposit', amount: 80000, tier: 'horizon', weight: 3 },
  { type: 'deposit', amount: 85000, tier: 'horizon', weight: 2 },
  { type: 'deposit', amount: 90000, tier: 'horizon', weight: 2 },
  { type: 'deposit', amount: 95000, tier: 'horizon', weight: 2 },
  { type: 'deposit', amount: 100000, tier: 'horizon', weight: 4 },
  { type: 'deposit', amount: 125000, tier: 'horizon', weight: 2 },
  { type: 'deposit', amount: 150000, tier: 'horizon', weight: 1 },
  { type: 'deposit', amount: 200000, tier: 'horizon', weight: 1 },
  { type: 'deposit', amount: 250000, tier: 'horizon', weight: 1 },
];

const horizonROI: PooledTransaction[] = [
  // Daily ROI payouts (1.8% of stake)
  { type: 'roi_payout', amount: 900.00, tier: 'horizon', weight: 6 },
  { type: 'roi_payout', amount: 990.00, tier: 'horizon', weight: 5 },
  { type: 'roi_payout', amount: 1080.00, tier: 'horizon', weight: 5 },
  { type: 'roi_payout', amount: 1170.00, tier: 'horizon', weight: 4 },
  { type: 'roi_payout', amount: 1260.00, tier: 'horizon', weight: 4 },
  { type: 'roi_payout', amount: 1350.00, tier: 'horizon', weight: 4 },
  { type: 'roi_payout', amount: 1440.00, tier: 'horizon', weight: 4 },
  { type: 'roi_payout', amount: 1530.00, tier: 'horizon', weight: 3 },
  { type: 'roi_payout', amount: 1620.00, tier: 'horizon', weight: 3 },
  { type: 'roi_payout', amount: 1710.00, tier: 'horizon', weight: 3 },
  { type: 'roi_payout', amount: 1800.00, tier: 'horizon', weight: 5 },
  { type: 'roi_payout', amount: 2250.00, tier: 'horizon', weight: 2 },
  { type: 'roi_payout', amount: 2700.00, tier: 'horizon', weight: 1 },
  { type: 'roi_payout', amount: 3600.00, tier: 'horizon', weight: 1 },
  { type: 'roi_payout', amount: 4500.00, tier: 'horizon', weight: 1 },
];

const horizonTrading: PooledTransaction[] = [
  { type: 'trade_profit', amount: 567.89, tier: 'horizon', weight: 4 },
  { type: 'trade_profit', amount: 678.90, tier: 'horizon', weight: 4 },
  { type: 'trade_profit', amount: 789.01, tier: 'horizon', weight: 3 },
  { type: 'trade_profit', amount: 890.12, tier: 'horizon', weight: 3 },
  { type: 'trade_profit', amount: 1001.23, tier: 'horizon', weight: 3 },
  { type: 'trade_profit', amount: 1123.45, tier: 'horizon', weight: 2 },
  { type: 'trade_profit', amount: 1245.67, tier: 'horizon', weight: 2 },
  { type: 'trade_profit', amount: 1367.89, tier: 'horizon', weight: 2 },
  { type: 'trade_profit', amount: 1489.01, tier: 'horizon', weight: 1 },
  { type: 'trade_profit', amount: 1612.34, tier: 'horizon', weight: 1 },
];

const horizonReferral: PooledTransaction[] = [
  { type: 'referral_commission', amount: 1250.00, tier: 'horizon', weight: 3 },
  { type: 'referral_commission', amount: 1500.00, tier: 'horizon', weight: 3 },
  { type: 'referral_commission', amount: 1750.00, tier: 'horizon', weight: 2 },
  { type: 'referral_commission', amount: 2000.00, tier: 'horizon', weight: 2 },
  { type: 'referral_commission', amount: 2500.00, tier: 'horizon', weight: 2 },
  { type: 'referral_commission', amount: 3125.00, tier: 'horizon', weight: 1 },
  { type: 'referral_commission', amount: 3750.00, tier: 'horizon', weight: 1 },
  { type: 'referral_commission', amount: 5000.00, tier: 'horizon', weight: 1 },
];

// ============ POOL STAKES (across all tiers) ============

const poolStakes: PooledTransaction[] = [
  // Anchor tier pool stakes
  { type: 'pool_stake', amount: 100, tier: 'anchor', weight: 4 },
  { type: 'pool_stake', amount: 250, tier: 'anchor', weight: 5 },
  { type: 'pool_stake', amount: 500, tier: 'anchor', weight: 6 },
  { type: 'pool_stake', amount: 750, tier: 'anchor', weight: 4 },
  { type: 'pool_stake', amount: 1000, tier: 'anchor', weight: 5 },
  { type: 'pool_stake', amount: 1500, tier: 'anchor', weight: 3 },
  { type: 'pool_stake', amount: 2000, tier: 'anchor', weight: 3 },
  { type: 'pool_stake', amount: 2500, tier: 'anchor', weight: 2 },
  { type: 'pool_stake', amount: 3000, tier: 'anchor', weight: 2 },
  // Vector tier pool stakes
  { type: 'pool_stake', amount: 4000, tier: 'vector', weight: 4 },
  { type: 'pool_stake', amount: 5000, tier: 'vector', weight: 5 },
  { type: 'pool_stake', amount: 6000, tier: 'vector', weight: 4 },
  { type: 'pool_stake', amount: 7500, tier: 'vector', weight: 4 },
  { type: 'pool_stake', amount: 10000, tier: 'vector', weight: 5 },
  { type: 'pool_stake', amount: 12500, tier: 'vector', weight: 3 },
  { type: 'pool_stake', amount: 15000, tier: 'vector', weight: 3 },
  { type: 'pool_stake', amount: 20000, tier: 'vector', weight: 2 },
  // Kinetic tier pool stakes
  { type: 'pool_stake', amount: 25000, tier: 'kinetic', weight: 3 },
  { type: 'pool_stake', amount: 30000, tier: 'kinetic', weight: 3 },
  { type: 'pool_stake', amount: 35000, tier: 'kinetic', weight: 2 },
  { type: 'pool_stake', amount: 40000, tier: 'kinetic', weight: 2 },
  { type: 'pool_stake', amount: 45000, tier: 'kinetic', weight: 1 },
  // Horizon tier pool stakes  
  { type: 'pool_stake', amount: 50000, tier: 'horizon', weight: 2 },
  { type: 'pool_stake', amount: 75000, tier: 'horizon', weight: 2 },
  { type: 'pool_stake', amount: 100000, tier: 'horizon', weight: 2 },
  { type: 'pool_stake', amount: 150000, tier: 'horizon', weight: 1 },
  { type: 'pool_stake', amount: 200000, tier: 'horizon', weight: 1 },
];

// ============ WITHDRAWALS (less frequent, varied amounts) ============

const withdrawals: PooledTransaction[] = [
  // Anchor tier withdrawals (ROI claims)
  { type: 'withdraw', amount: 5.00, tier: 'anchor', weight: 2 },
  { type: 'withdraw', amount: 10.00, tier: 'anchor', weight: 3 },
  { type: 'withdraw', amount: 25.00, tier: 'anchor', weight: 3 },
  { type: 'withdraw', amount: 50.00, tier: 'anchor', weight: 3 },
  { type: 'withdraw', amount: 75.00, tier: 'anchor', weight: 2 },
  { type: 'withdraw', amount: 100.00, tier: 'anchor', weight: 2 },
  { type: 'withdraw', amount: 150.00, tier: 'anchor', weight: 2 },
  { type: 'withdraw', amount: 200.00, tier: 'anchor', weight: 1 },
  // Vector tier withdrawals
  { type: 'withdraw', amount: 250.00, tier: 'vector', weight: 2 },
  { type: 'withdraw', amount: 500.00, tier: 'vector', weight: 2 },
  { type: 'withdraw', amount: 750.00, tier: 'vector', weight: 2 },
  { type: 'withdraw', amount: 1000.00, tier: 'vector', weight: 2 },
  { type: 'withdraw', amount: 1500.00, tier: 'vector', weight: 1 },
  { type: 'withdraw', amount: 2000.00, tier: 'vector', weight: 1 },
  // Kinetic tier withdrawals
  { type: 'withdraw', amount: 2500.00, tier: 'kinetic', weight: 1 },
  { type: 'withdraw', amount: 3000.00, tier: 'kinetic', weight: 1 },
  { type: 'withdraw', amount: 4000.00, tier: 'kinetic', weight: 1 },
  { type: 'withdraw', amount: 5000.00, tier: 'kinetic', weight: 1 },
  // Horizon tier withdrawals  
  { type: 'withdraw', amount: 7500.00, tier: 'horizon', weight: 1 },
  { type: 'withdraw', amount: 10000.00, tier: 'horizon', weight: 1 },
  { type: 'withdraw', amount: 15000.00, tier: 'horizon', weight: 1 },
  { type: 'withdraw', amount: 25000.00, tier: 'horizon', weight: 1 },
];

// ============ COMBINED TRANSACTION POOL ============

export const TRANSACTION_POOL: PooledTransaction[] = [
  // Anchor (highest frequency - most retail users)
  ...anchorDeposits,
  ...anchorROI,
  ...anchorTrading,
  ...anchorReferral,
  
  // Vector (medium frequency)
  ...vectorDeposits,
  ...vectorROI,
  ...vectorTrading,
  ...vectorReferral,
  
  // Kinetic (lower frequency)
  ...kineticDeposits,
  ...kineticROI,
  ...kineticTrading,
  ...kineticReferral,
  
  // Horizon (rare, large transactions)
  ...horizonDeposits,
  ...horizonROI,
  ...horizonTrading,
  ...horizonReferral,
  
  // Pool stakes and withdrawals
  ...poolStakes,
  ...withdrawals,
];

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
