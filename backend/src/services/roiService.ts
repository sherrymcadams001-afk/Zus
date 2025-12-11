/**
 * ROI Service - Dynamic ROI Calculation
 * 
 * Generates realistic, fluctuating ROI that varies throughout the day
 * but always settles within the user's tier range by end of 24h period.
 * 
 * Algorithm:
 * 1. Uses seeded random based on user ID + date for reproducibility
 * 2. Applies wave patterns (sine, cosine) for organic market-like movement
 * 3. Current "instantaneous" ROI can spike ±50% above tier range
 * 4. Cumulative 24h ROI always lands within [dailyRoiMin, dailyRoiMax]
 */

import { BotTier, BotTierConfig } from '../types';
import { BOT_TIERS, getBotTierForStake } from '../engine/BotTiers';

/**
 * Seeded pseudo-random number generator
 * Returns reproducible values for same seed
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate a deterministic seed from user ID and time components
 */
function generateSeed(userId: number, dayOfYear: number, hourOfDay: number): number {
  return userId * 1000000 + dayOfYear * 100 + hourOfDay;
}

/**
 * Get current day of year (1-365)
 */
function getDayOfYear(timestamp: number = Date.now()): number {
  const date = new Date(timestamp);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Calculate dynamic instantaneous ROI rate
 * 
 * This rate fluctuates throughout the day but the cumulative effect
 * over 24 hours will land within the tier's daily range.
 * 
 * @param userId - User's ID for seeding
 * @param tier - User's current bot tier
 * @param timestamp - Current timestamp (default: now)
 * @returns Object with current rate and projection info
 */
export function calculateDynamicROI(
  userId: number,
  tier: BotTier,
  timestamp: number = Date.now()
): {
  currentHourlyRate: number;     // Current instantaneous hourly rate
  currentDailyProjection: number; // If this rate continued all day
  actualDailyRate: number;        // What the 24h cumulative will be
  rateMultiplier: number;         // How much above/below base rate (1.0 = normal)
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'high' | 'medium' | 'low';
} {
  const config = BOT_TIERS[tier];
  const date = new Date(timestamp);
  
  // Time components
  const dayOfYear = getDayOfYear(timestamp);
  const hourOfDay = date.getUTCHours();
  const minuteOfHour = date.getUTCMinutes();
  const secondOfMinute = date.getUTCSeconds();
  
  // Progress through the day (0.0 to 1.0)
  const dayProgress = (hourOfDay * 3600 + minuteOfHour * 60 + secondOfMinute) / 86400;
  
  // Generate seeds for different components
  const baseSeed = generateSeed(userId, dayOfYear, 0);
  const hourSeed = generateSeed(userId, dayOfYear, hourOfDay);
  const minuteSeed = generateSeed(userId, dayOfYear * 24 + hourOfDay, minuteOfHour);
  
  // Determine the day's target ROI (within tier range, consistent for entire day)
  const dailyRoiRange = config.dailyRoiMax - config.dailyRoiMin;
  const dailyRoiPosition = seededRandom(baseSeed); // 0-1 position within range
  const actualDailyRate = config.dailyRoiMin + (dailyRoiRange * dailyRoiPosition);
  
  // Calculate base hourly rate from daily
  const baseHourlyRate = actualDailyRate / config.tradingHoursPerDay;
  
  // Generate volatility waves
  // Wave 1: Slow macro trend (changes every few hours)
  const macroWave = Math.sin(dayProgress * Math.PI * 2 + seededRandom(baseSeed) * Math.PI * 2);
  
  // Wave 2: Medium frequency (hourly oscillation)
  const hourlyWave = Math.sin(dayProgress * Math.PI * 6 + seededRandom(hourSeed) * Math.PI);
  
  // Wave 3: High frequency (minute-level noise)
  const minuteNoise = (seededRandom(minuteSeed) - 0.5) * 2;
  
  // Wave 4: Micro noise (second-level jitter)
  const microNoise = Math.sin(secondOfMinute * 0.5) * 0.1;
  
  // Combine waves with different weights
  // Max deviation allowed: ±50% of base rate during peak volatility
  const maxDeviation = 0.5;
  const combinedWave = (
    macroWave * 0.3 +      // 30% weight to macro trend
    hourlyWave * 0.25 +    // 25% weight to hourly
    minuteNoise * 0.35 +   // 35% weight to minute noise  
    microNoise * 0.1       // 10% weight to micro jitter
  );
  
  // Apply mean reversion that increases as day progresses
  // This ensures we "settle" towards actual rate by end of day
  const reversionStrength = Math.pow(dayProgress, 2) * 0.5;
  const adjustedWave = combinedWave * (1 - reversionStrength);
  
  // Calculate rate multiplier (how much above/below base)
  const rateMultiplier = 1 + (adjustedWave * maxDeviation);
  
  // Current instantaneous hourly rate
  const currentHourlyRate = baseHourlyRate * rateMultiplier;
  
  // What daily would be if this rate continued
  const currentDailyProjection = currentHourlyRate * config.tradingHoursPerDay;
  
  // Determine market sentiment based on wave direction
  const sentiment = combinedWave > 0.15 ? 'bullish' : 
                    combinedWave < -0.15 ? 'bearish' : 'neutral';
  
  // Determine volatility level
  const volatilityScore = Math.abs(combinedWave);
  const volatility = volatilityScore > 0.35 ? 'high' :
                     volatilityScore > 0.15 ? 'medium' : 'low';
  
  return {
    currentHourlyRate,
    currentDailyProjection,
    actualDailyRate,
    rateMultiplier,
    marketSentiment: sentiment,
    volatility,
  };
}

/**
 * Calculate current ROI earnings for display
 * 
 * @param userId - User's ID
 * @param stakedAmount - User's total staked amount
 * @param timestamp - Current timestamp
 * @returns Earnings info for display
 */
export function calculateCurrentEarnings(
  userId: number,
  stakedAmount: number,
  timestamp: number = Date.now()
): {
  tier: BotTier;
  tierConfig: BotTierConfig;
  currentHourlyEarning: number;
  projectedDailyEarning: number;
  actualDailyEarning: number;
  currentRatePercent: number;       // Current rate as percentage (e.g., 1.25%)
  actualDailyRatePercent: number;   // Actual daily rate as percentage
  rateMultiplier: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'high' | 'medium' | 'low';
  displayRate: string;              // Formatted for display (e.g., "+1.25%")
} {
  // Determine tier based on stake
  const tier = getBotTierForStake(stakedAmount);
  const tierConfig = BOT_TIERS[tier];
  
  // Get dynamic ROI
  const roi = calculateDynamicROI(userId, tier, timestamp);
  
  // Calculate actual earnings
  const currentHourlyEarning = stakedAmount * roi.currentHourlyRate;
  const projectedDailyEarning = stakedAmount * roi.currentDailyProjection;
  const actualDailyEarning = stakedAmount * roi.actualDailyRate;
  
  // Convert to percentages
  const currentRatePercent = roi.currentDailyProjection * 100;
  const actualDailyRatePercent = roi.actualDailyRate * 100;
  
  // Format display rate with sign
  const sign = roi.rateMultiplier >= 1 ? '+' : '';
  const displayRate = `${sign}${currentRatePercent.toFixed(2)}%`;
  
  return {
    tier,
    tierConfig,
    currentHourlyEarning,
    projectedDailyEarning,
    actualDailyEarning,
    currentRatePercent,
    actualDailyRatePercent,
    rateMultiplier: roi.rateMultiplier,
    marketSentiment: roi.marketSentiment,
    volatility: roi.volatility,
    displayRate,
  };
}

/**
 * Generate ROI history for charting
 * Returns hourly ROI data points for the past N hours
 */
export function generateROIHistory(
  userId: number,
  tier: BotTier,
  hours: number = 24
): Array<{
  timestamp: number;
  hourlyRate: number;
  ratePercent: number;
}> {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const history: Array<{ timestamp: number; hourlyRate: number; ratePercent: number }> = [];
  
  for (let i = hours - 1; i >= 0; i--) {
    const timestamp = now - (i * hourMs);
    const roi = calculateDynamicROI(userId, tier, timestamp);
    
    history.push({
      timestamp,
      hourlyRate: roi.currentHourlyRate,
      ratePercent: roi.currentDailyProjection * 100,
    });
  }
  
  return history;
}
