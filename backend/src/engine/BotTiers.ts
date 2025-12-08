/**
 * BotTiers - Single Source of Truth
 * 
 * Defines all bot tier configurations used across the platform.
 * This is the authoritative source for bot tier data.
 */

import { BotTier, BotTierConfig } from '../types';

/**
 * Bot tier configurations
 * All ROI rates, staking requirements, and withdrawal rules
 */
export const BOT_TIERS: Record<BotTier, BotTierConfig> = {
  protobot: {
    name: 'Protobot',
    hourlyRoiMin: 0.001,    // 0.1%
    hourlyRoiMax: 0.0012,   // 0.12%
    dailyRoiMin: 0.008,     // 0.8% (8 hours × 0.1%)
    dailyRoiMax: 0.0096,    // 0.96% (8 hours × 0.12%)
    minimumStake: 100,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 40,
    investmentDurationDays: 365,
  },
  chainpulse: {
    name: 'Chainpulse Bot',
    hourlyRoiMin: 0.0012,   // 0.12%
    hourlyRoiMax: 0.0014,   // 0.14%
    dailyRoiMin: 0.0096,    // 0.96% (8 hours × 0.12%)
    dailyRoiMax: 0.0112,    // 1.12% (8 hours × 0.14%)
    minimumStake: 4000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 45,
    investmentDurationDays: 365,
  },
  titan: {
    name: 'Titan Bot',
    hourlyRoiMin: 0.0014,   // 0.14%
    hourlyRoiMax: 0.0016,   // 0.16%
    dailyRoiMin: 0.0112,    // 1.12% (8 hours × 0.14%)
    dailyRoiMax: 0.0128,    // 1.28% (8 hours × 0.16%)
    minimumStake: 25000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 65,
    investmentDurationDays: 365,
  },
  omega: {
    name: 'Omega Bot',
    hourlyRoiMin: 0.00225,  // 0.225% per hour (1.8% / 8)
    hourlyRoiMax: 0.00225,  // Fixed rate
    dailyRoiMin: 0.018,     // 1.8% fixed
    dailyRoiMax: 0.018,     // 1.8% fixed
    minimumStake: 50000,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 85,
    investmentDurationDays: 365,
  },
};

/**
 * Valid bot tier identifiers
 */
export const VALID_BOT_TIERS: BotTier[] = ['protobot', 'chainpulse', 'titan', 'omega'];

/**
 * Get the appropriate bot tier based on stake amount
 * Returns the highest tier the stake qualifies for
 */
export function getBotTierForStake(stakeAmount: number): BotTier {
  if (stakeAmount >= BOT_TIERS.omega.minimumStake) return 'omega';
  if (stakeAmount >= BOT_TIERS.titan.minimumStake) return 'titan';
  if (stakeAmount >= BOT_TIERS.chainpulse.minimumStake) return 'chainpulse';
  return 'protobot';
}

/**
 * Validate that stake meets minimum for selected tier
 */
export function isValidStakeForTier(stakeAmount: number, tier: BotTier): boolean {
  return stakeAmount >= BOT_TIERS[tier].minimumStake;
}

/**
 * Validate bot tier identifier
 */
export function isValidBotTier(tier: string): tier is BotTier {
  return VALID_BOT_TIERS.includes(tier as BotTier);
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: BotTier): BotTierConfig {
  return BOT_TIERS[tier];
}
