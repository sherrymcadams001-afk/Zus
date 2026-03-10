export type StrategyTier = 'anchor' | 'vector' | 'kinetic' | 'horizon';

export interface StrategyTierConfig {
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

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const VOLATILITY_TRADE_MULTIPLIERS: Record<'low' | 'medium' | 'high', number> = {
  low: 0.85,
  medium: 1,
  high: 1.15,
};

const LEGACY_STRATEGY_TIER_MAP: Record<string, StrategyTier> = {
  protobot: 'anchor',
  delta: 'anchor',
  chainpulse: 'vector',
  gamma: 'vector',
  titan: 'kinetic',
  alpha: 'kinetic',
  omega: 'horizon',
};

export const STRATEGY_TIER_ORDER: readonly StrategyTier[] = ['anchor', 'vector', 'kinetic', 'horizon'];

export const STRATEGY_TIERS: Record<StrategyTier, StrategyTierConfig> = {
  anchor: {
    name: 'Anchor',
    hourlyRoiMin: 0.001,
    hourlyRoiMax: 0.0012,
    dailyRoiMin: 0.008,
    dailyRoiMax: 0.0096,
    minimumStake: 100,
    tradingHoursPerDay: 8,
    tradingDaysPerWeek: 6,
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 40,
    investmentDurationDays: 365,
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
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 45,
    investmentDurationDays: 365,
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
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 65,
    investmentDurationDays: 365,
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
    roiWithdrawalHours: 24,
    capitalWithdrawalDays: 85,
    investmentDurationDays: 365,
  },
};

/** @deprecated Use STRATEGY_TIERS instead */
export const BOT_TIERS = STRATEGY_TIERS;

type StrategyTierReference = StrategyTier | StrategyTierConfig;

function resolveStrategyTierConfig(reference: StrategyTierReference): StrategyTierConfig {
  return typeof reference === 'string' ? STRATEGY_TIERS[reference] : reference;
}

export function isStrategyTier(value: string | null | undefined): value is StrategyTier {
  return typeof value === 'string' && value in STRATEGY_TIERS;
}

export function normalizeStrategyTier(value: string | null | undefined): StrategyTier | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.toLowerCase();
  if (isStrategyTier(normalizedValue)) {
    return normalizedValue;
  }

  return LEGACY_STRATEGY_TIER_MAP[normalizedValue] ?? null;
}

export function getStrategyTierForStake(stakeAmount: number): StrategyTier {
  if (stakeAmount >= STRATEGY_TIERS.horizon.minimumStake) return 'horizon';
  if (stakeAmount >= STRATEGY_TIERS.kinetic.minimumStake) return 'kinetic';
  if (stakeAmount >= STRATEGY_TIERS.vector.minimumStake) return 'vector';
  return 'anchor';
}

/** @deprecated Use getStrategyTierForStake instead */
export const getBotTierForStake = getStrategyTierForStake;

export function getAverageHourlyRoi(reference: StrategyTierReference): number {
  const config = resolveStrategyTierConfig(reference);
  return (config.hourlyRoiMin + config.hourlyRoiMax) / 2;
}

export function getAverageDailyRoi(reference: StrategyTierReference): number {
  const config = resolveStrategyTierConfig(reference);
  return (config.dailyRoiMin + config.dailyRoiMax) / 2;
}

export function getTradingDaysPerMonth(reference: StrategyTierReference): number {
  const config = resolveStrategyTierConfig(reference);
  return (config.tradingDaysPerWeek * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
}

export function getTradingDaysPerYear(reference: StrategyTierReference): number {
  const config = resolveStrategyTierConfig(reference);
  return config.tradingDaysPerWeek * WEEKS_PER_YEAR;
}

export interface TierEarningsProjection {
  daily: number;
  weekly: number;
  monthly: number;
  annualSimple: number;
  annualCompoundedProfit: number;
  annualCompoundedTotal: number;
}

export function calculateTierEarnings(
  balance: number,
  reference: StrategyTierReference,
  dailyRateOverride?: number,
): TierEarningsProjection {
  const config = resolveStrategyTierConfig(reference);
  const dailyRate = dailyRateOverride ?? getAverageDailyRoi(config);
  const daily = balance * dailyRate;
  const weekly = daily * config.tradingDaysPerWeek;
  const monthly = daily * getTradingDaysPerMonth(config);
  const tradingDaysPerYear = getTradingDaysPerYear(config);
  const annualSimple = daily * tradingDaysPerYear;
  const annualCompoundedTotal = balance * Math.pow(1 + dailyRate, tradingDaysPerYear);
  const annualCompoundedProfit = annualCompoundedTotal - balance;

  return {
    daily,
    weekly,
    monthly,
    annualSimple,
    annualCompoundedProfit,
    annualCompoundedTotal,
  };
}

export function formatTierRoiRange(
  reference: StrategyTierReference,
  unit: 'hourly' | 'daily' = 'hourly',
): string {
  const config = resolveStrategyTierConfig(reference);
  const min = unit === 'hourly' ? config.hourlyRoiMin : config.dailyRoiMin;
  const max = unit === 'hourly' ? config.hourlyRoiMax : config.dailyRoiMax;
  const suffix = unit === 'hourly' ? '/hr' : '/day';
  const minLabel = (min * 100).toFixed(2);
  const maxLabel = (max * 100).toFixed(2);

  return min === max
    ? `${minLabel}%${suffix}`
    : `${minLabel}%-${maxLabel}%${suffix}`;
}

export function getSimulationBaseBalance(currentBalance: number, startOfDayBalance: number = 0): number {
  if (startOfDayBalance > 0) {
    return startOfDayBalance;
  }

  if (currentBalance > 0) {
    return currentBalance;
  }

  return STRATEGY_TIERS.anchor.minimumStake;
}

export function getTargetTradesPerHour(
  reference: StrategyTierReference,
  volatility: 'low' | 'medium' | 'high' = 'medium',
): number {
  const config = resolveStrategyTierConfig(reference);
  const baseTradesPerHour = Math.round(
    (config.tradingHoursPerDay * config.tradingDaysPerWeek) / (getAverageDailyRoi(config) * 100),
  );

  return Math.max(
    config.tradingHoursPerDay * 3,
    Math.round(baseTradesPerHour * VOLATILITY_TRADE_MULTIPLIERS[volatility]),
  );
}