import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';

/**
 * PortfolioManager
 * 
 * Handles the "business logic" of the autonomous trading system.
 * - Generates consistent payouts (Treasury Reactor)
 * - Executes simulated trades based on market movements
 * - Ensures mathematical consistency across the dashboard
 * - Supports multi-tier bot system with different ROI rates
 * - Integrates market context for more realistic trade outcomes
 */

/** Market volatility levels for contextual trading */
type MarketVolatility = 'low' | 'medium' | 'high';

/** Bot tier types for multi-tier trading system */
export type BotTier = 'protobot' | 'chainpulse' | 'titan' | 'omega';

/** Bot tier configuration */
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

/** Bot tier configurations - mirroring backend */
export const BOT_TIERS: Record<BotTier, BotTierConfig> = {
  protobot: {
    name: 'Protobot',
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
  chainpulse: {
    name: 'Chainpulse Bot',
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
  titan: {
    name: 'Titan Bot',
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
  omega: {
    name: 'Omega Bot',
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

/** Get bot tier based on stake amount */
export function getBotTierForStake(stakeAmount: number): BotTier {
  if (stakeAmount >= BOT_TIERS.omega.minimumStake) return 'omega';
  if (stakeAmount >= BOT_TIERS.titan.minimumStake) return 'titan';
  if (stakeAmount >= BOT_TIERS.chainpulse.minimumStake) return 'chainpulse';
  return 'protobot';
}

class PortfolioManager {
  private static instance: PortfolioManager | null = null;
  private isRunning = false;
  private payoutInterval: ReturnType<typeof setInterval> | null = null;
  private tradeInterval: ReturnType<typeof setInterval> | null = null;
  private activityInterval: ReturnType<typeof setInterval> | null = null;

  // Current bot tier - defaults to auto-selection based on balance
  private currentBotTier: BotTier | null = null;
  
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private startTime: number = Date.now();
  private recentPnL: number[] = [];
  private readonly MAX_RECENT_TRADES = 18;
  private readonly MIN_LOSS_RATIO = 0.35;
  private lastDayIndex: number = 0;

  // Market context tracking
  private recentPriceChanges: Map<string, number[]> = new Map();
  private readonly PRICE_HISTORY_SIZE = 10;

  // Market context cache for performance
  private cachedVolatility: MarketVolatility = 'medium';
  private lastVolatilityUpdate: number = 0;
  private readonly VOLATILITY_CACHE_TTL = 30000; // 30 seconds cache

  private constructor() {
    this.startTime = Date.now() - (Math.random() * 3600000 * 4); // Simulate we started 0-4 hours ago
    this.lastDayIndex = this.getCurrentDayIndex();
  }

  public static getInstance(): PortfolioManager {
    if (!PortfolioManager.instance) {
      PortfolioManager.instance = new PortfolioManager();
    }
    return PortfolioManager.instance;
  }

  /**
   * Get the current active bot tier
   * Returns explicitly set tier or auto-selects based on wallet balance
   */
  public getActiveBotTier(): BotTier {
    if (this.currentBotTier) {
      return this.currentBotTier;
    }
    const { walletBalance } = usePortfolioStore.getState();
    return getBotTierForStake(walletBalance);
  }

  /**
   * Get the config for the current active tier
   */
  public getActiveTierConfig(): BotTierConfig {
    return BOT_TIERS[this.getActiveBotTier()];
  }

  /**
   * Set the bot tier explicitly
   */
  public setBotTier(tier: BotTier): void {
    const { walletBalance } = usePortfolioStore.getState();
    const tierConfig = BOT_TIERS[tier];
    
    if (walletBalance < tierConfig.minimumStake) {
      throw new Error(`Insufficient balance for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}`);
    }
    
    this.currentBotTier = tier;
  }

  /**
   * Get daily target min for current tier
   */
  private getTargetDailyMin(): number {
    return this.getActiveTierConfig().dailyRoiMin;
  }

  /**
   * Get daily target max for current tier
   */
  private getTargetDailyMax(): number {
    return this.getActiveTierConfig().dailyRoiMax;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Start the "Treasury Reactor" payout cycle
    this.startPayoutCycle();

    // Start the "Bot Execution" cycle (Slow Ledger)
    this.startTradeCycle();

    // Start the "Agent Activity" cycle (Fast Logs)
    this.startActivityCycle();
  }

  public stop() {
    this.isRunning = false;
    if (this.payoutInterval) clearTimeout(this.payoutInterval);
    if (this.tradeInterval) clearInterval(this.tradeInterval);
    if (this.activityInterval) clearInterval(this.activityInterval);
  }

  /**
   * Calculate current market volatility based on recent price changes
   * Uses caching to improve performance
   */
  private calculateMarketVolatility(): MarketVolatility {
    // Return cached value if still valid
    const now = Date.now();
    if (now - this.lastVolatilityUpdate < this.VOLATILITY_CACHE_TTL) {
      return this.cachedVolatility;
    }

    const tickers = useMarketStore.getState().tickers;
    if (tickers.size === 0) {
      this.cachedVolatility = 'medium';
      this.lastVolatilityUpdate = now;
      return 'medium';
    }

    let totalVolatility = 0;
    let count = 0;

    for (const [symbol, ticker] of tickers) {
      const currentPrice = parseFloat(ticker.closePrice);
      const openPrice = parseFloat(ticker.openPrice);
      if (isNaN(currentPrice) || isNaN(openPrice) || openPrice === 0) continue;

      // Calculate 24h price change percentage
      const priceChange = Math.abs((currentPrice - openPrice) / openPrice) * 100;
      totalVolatility += priceChange;
      count++;

      // Track price changes for this symbol
      const history = this.recentPriceChanges.get(symbol) || [];
      history.push(priceChange);
      if (history.length > this.PRICE_HISTORY_SIZE) history.shift();
      this.recentPriceChanges.set(symbol, history);
    }

    let volatility: MarketVolatility = 'medium';
    if (count > 0) {
      const avgVolatility = totalVolatility / count;
      if (avgVolatility < 2) volatility = 'low';
      else if (avgVolatility > 5) volatility = 'high';
    }

    // Cache the result
    this.cachedVolatility = volatility;
    this.lastVolatilityUpdate = now;
    return volatility;
  }

  /**
   * Get market trend for a specific symbol
   */
  private getMarketTrend(symbol: string): 'bullish' | 'bearish' | 'neutral' {
    const tickers = useMarketStore.getState().tickers;
    const ticker = tickers.get(symbol);
    if (!ticker) return 'neutral';

    const currentPrice = parseFloat(ticker.closePrice);
    const openPrice = parseFloat(ticker.openPrice);
    if (isNaN(currentPrice) || isNaN(openPrice) || openPrice === 0) return 'neutral';

    const changePercent = ((currentPrice - openPrice) / openPrice) * 100;
    
    if (changePercent > 1) return 'bullish';
    if (changePercent < -1) return 'bearish';
    return 'neutral';
  }

  /**
   * Simulates constant payouts from Pool to Wallet
   * Keeps Wallet balance smaller than Pool but growing
   */
  private startPayoutCycle() {
    const runPayout = () => {
      if (!this.isRunning) return;

      // Scale payout based on wallet balance to maintain realistic proportions
      const { walletBalance } = usePortfolioStore.getState();
      const baseAmount = Math.max(20, walletBalance * 0.001); // 0.1% of wallet or minimum $20
      const amount = Math.random() * baseAmount * 2 + baseAmount * 0.5;
      
      // Update store - Mathematically accurate transfer
      // Wallet increases (+), Pool decreases (-)
      usePortfolioStore.getState().updateBalances(amount, -amount);
      
      // Schedule next payout
      const nextDelay = 800 + Math.random() * 1700;
      this.payoutInterval = setTimeout(runPayout, nextDelay);
    };

    runPayout();
  }

  /**
   * Generates a fast stream of agent activity logs
   * "The agent trades should be a fast stream of activity"
   */
  private startActivityCycle() {
    const volatilityActions = {
      low: [
        'Market stable, monitoring for breakout...',
        'Low volatility detected, tightening spreads...',
        'Consolidation pattern forming...',
        'Range-bound conditions, setting grid...',
      ],
      medium: [
        'Scanning market structure...',
        'Analyzing order book depth...',
        'Calculating volatility index...',
        'Checking correlation matrix...',
        'Validating entry signals...',
        'Monitoring liquidity pools...',
        'Adjusting risk parameters...',
        'Syncing with global nodes...',
        'Optimizing execution path...',
        'Detecting arbitrage opportunity...',
        'Filtering noise...',
        'Backtesting pattern match...',
      ],
      high: [
        'High volatility alert! Adjusting position size...',
        'Rapid price movement detected, hedging...',
        'Volatility spike, pausing new entries...',
        'Emergency risk assessment in progress...',
        'Large order detected, analyzing impact...',
      ],
    };

    const runActivity = () => {
      if (!this.isRunning) return;

      const volatility = this.calculateMarketVolatility();
      const actions = volatilityActions[volatility];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const tickers = useMarketStore.getState().tickers;
      
      // Occasionally add a symbol specific log with market context
      if (Math.random() > 0.7 && tickers.size > 0) {
        const symbols = Array.from(tickers.keys());
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const ticker = tickers.get(symbol);
        if (ticker) {
          const price = parseFloat(ticker.closePrice);
          const trend = this.getMarketTrend(symbol);
          const trendEmoji = trend === 'bullish' ? '↑' : trend === 'bearish' ? '↓' : '→';
          usePortfolioStore.getState().addLog(
            `${trendEmoji} ${symbol.replace('USDT', '')} @ $${price.toFixed(2)} - Vol: ${parseFloat(ticker.volume).toFixed(0)}`, 
            'system'
          );
        }
      } else {
        usePortfolioStore.getState().addLog(action, 'system');
      }

      // Adjust interval based on volatility - faster during high volatility
      const baseDelay = volatility === 'high' ? 80 : volatility === 'low' ? 200 : 100;
      const nextDelay = baseDelay + Math.random() * (baseDelay * 4);
      this.activityInterval = setTimeout(runActivity, nextDelay);
    };

    runActivity();
  }

  /**
   * Simulates trading activity based on current market prices
   * "Ledger should be the averagely moving like a balance sheet"
   * Enforces tier-based daily profit target based on user wallet balance
   * Now includes market context for more realistic outcomes
   */
  private startTradeCycle() {
    this.tradeInterval = setInterval(() => {
      const tickers = useMarketStore.getState().tickers;
      if (tickers.size === 0) return;

      const currentDayIndex = this.getCurrentDayIndex();
      if (currentDayIndex !== this.lastDayIndex) {
        this.recentPnL = [];
        this.lastDayIndex = currentDayIndex;
        // Reset start of day equity for new day
        const { walletBalance } = usePortfolioStore.getState();
        usePortfolioStore.getState().resetDailyEquity(walletBalance);
      }

      // Pick a random symbol
      const symbols = Array.from(tickers.keys());
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const ticker = tickers.get(symbol);
      
      if (!ticker) return;

      const price = parseFloat(ticker.closePrice);
      if (isNaN(price) || price <= 0) return;

      // --- Market Context ---
      const volatility = this.calculateMarketVolatility();
      const trend = this.getMarketTrend(symbol);

      // --- Target Logic based on wallet balance and tier ---
      const { walletBalance, startOfDayWalletBalance, sessionPnL } = usePortfolioStore.getState();
      const baseBalance = startOfDayWalletBalance > 0 ? startOfDayWalletBalance : walletBalance;
      const currentReturn = baseBalance > 0 ? sessionPnL / baseBalance : 0;
      
      // Get tier-specific targets
      const targetDailyMin = this.getTargetDailyMin();
      const targetDailyMax = this.getTargetDailyMax();
      
      // Calculate where we should be right now
      const elapsedTime = Date.now() - this.startTime;
      const dayProgress = (elapsedTime % this.MS_PER_DAY) / this.MS_PER_DAY;
      
      // Target return for this specific moment in the day
      const targetReturnNow = targetDailyMin * dayProgress;
      
      // Scale PnL based on user balance - larger balance = larger trades
      const scaleFactor = Math.max(1, baseBalance / 10000); // Normalize to $10k base
      
      let pnl = 0;

      // Market-contextual trading logic
      const marketModifier = this.getMarketContextModifier(volatility, trend);

      // If we are BEHIND schedule, we generally want to win, but market matters
      if (currentReturn < targetReturnNow) {
        // Base 80% win chance, modified by market conditions
        const winChance = 0.8 * marketModifier.winRateMultiplier;
        if (Math.random() < winChance) {
          pnl = (Math.random() * 40 + 10) * scaleFactor * marketModifier.profitMultiplier;
        } else {
          pnl = (Math.random() * -20 - 5) * scaleFactor * marketModifier.lossMultiplier;
        }
      } 
      // If we are AHEAD of schedule, force a correction
      else if (currentReturn > targetDailyMax * dayProgress * 1.2) {
        pnl = (Math.random() * -30 - 5) * scaleFactor * marketModifier.lossMultiplier;
      }
      // Otherwise, mixed outcome based on market conditions
      else {
        // Base: -25 to +35, modified by trend
        const basePnL = (Math.random() - 0.45) * 60;
        if (trend === 'bullish') {
          pnl = (basePnL + 10) * scaleFactor * marketModifier.profitMultiplier;
        } else if (trend === 'bearish') {
          pnl = (basePnL - 5) * scaleFactor * marketModifier.lossMultiplier;
        } else {
          pnl = basePnL * scaleFactor;
        }
      }

      pnl = this.applyPnLGuards(pnl, currentReturn, dayProgress);
      const normalizedPnL = Number(pnl.toFixed(2));
      const side: 'BUY' | 'SELL' = normalizedPnL >= 0 ? 'BUY' : 'SELL';
      const quantity = (Math.random() * 500 * scaleFactor) / price; // Scaled position size

      // Execute trade (Ledger update)
      usePortfolioStore.getState().addTrade({
        symbol: symbol.replace('USDT', ''),
        side,
        price,
        quantity,
        pnl: normalizedPnL
      });

      // Log the trade execution with market context
      const pnlText = normalizedPnL >= 0 ? `+${normalizedPnL.toFixed(2)}` : normalizedPnL.toFixed(2);
      const volIndicator = volatility === 'high' ? '⚡' : volatility === 'low' ? '💤' : '';
      const msg = `EXECUTED: ${side === 'BUY' ? 'Long' : 'Short'} ${symbol.replace('USDT', '')} | PnL: ${pnlText} ${volIndicator}`;
      usePortfolioStore.getState().addLog(msg, 'trade');
      this.recordPnL(normalizedPnL);

    }, 5000 + Math.random() * 8000); // Trade every 5-13 seconds (Slower than logs)
  }

  /**
   * Get market context modifiers for trade outcomes
   */
  private getMarketContextModifier(volatility: MarketVolatility, trend: 'bullish' | 'bearish' | 'neutral') {
    const modifiers = {
      winRateMultiplier: 1,
      profitMultiplier: 1,
      lossMultiplier: 1,
    };

    // Volatility adjustments
    switch (volatility) {
      case 'high':
        modifiers.profitMultiplier = 1.5;  // Higher potential profits
        modifiers.lossMultiplier = 1.3;    // But also higher losses
        modifiers.winRateMultiplier = 0.9; // Slightly lower win rate
        break;
      case 'low':
        modifiers.profitMultiplier = 0.7;  // Smaller moves
        modifiers.lossMultiplier = 0.7;
        modifiers.winRateMultiplier = 1.1; // More predictable
        break;
    }

    // Trend adjustments for long positions
    switch (trend) {
      case 'bullish':
        modifiers.winRateMultiplier *= 1.15; // Better chance in uptrend
        modifiers.profitMultiplier *= 1.2;
        break;
      case 'bearish':
        modifiers.winRateMultiplier *= 0.85; // Harder in downtrend
        modifiers.lossMultiplier *= 1.15;
        break;
    }

    return modifiers;
  }

  private applyPnLGuards(pnl: number, currentReturn: number, dayProgress: number): number {
    const lossRatio = this.getLossRatio();
    const insufficientLosses = this.recentPnL.length >= 6 && lossRatio < this.MIN_LOSS_RATIO;
    
    // Use tier-specific targets
    const targetDailyMin = this.getTargetDailyMin();
    const targetDailyMax = this.getTargetDailyMax();
    
    const aheadOfSchedule = currentReturn > targetDailyMax * dayProgress;
    const behindSchedule = currentReturn < targetDailyMin * dayProgress;

    // Scale guards based on wallet balance
    const { walletBalance } = usePortfolioStore.getState();
    const scaleFactor = Math.max(1, walletBalance / 10000);

    if ((aheadOfSchedule || insufficientLosses) && pnl > 0) {
      return -Math.abs(Math.random() * 30 + 5) * scaleFactor;
    }

    if (behindSchedule && pnl < 0) {
      return Math.abs(Math.random() * 45 + 10) * scaleFactor;
    }

    return pnl;
  }

  private recordPnL(pnl: number): void {
    this.recentPnL.push(pnl);
    if (this.recentPnL.length > this.MAX_RECENT_TRADES) {
      this.recentPnL.shift();
    }
  }

  private getLossRatio(): number {
    if (this.recentPnL.length === 0) return 0;
    const losses = this.recentPnL.filter((value) => value < 0).length;
    return losses / this.recentPnL.length;
  }

  private getCurrentDayIndex(): number {
    return Math.floor((Date.now() - this.startTime) / this.MS_PER_DAY);
  }

  /**
   * Exposes the current portfolio state as a JSON object
   * For integration with broader platforms
   */
  public getPortfolioStateAPI() {
    const state = usePortfolioStore.getState();
    const volatility = this.calculateMarketVolatility();
    const activeTier = this.getActiveBotTier();
    const tierConfig = BOT_TIERS[activeTier];
    
    return {
      status: 'success',
      timestamp: Date.now(),
      data: {
        wallet_balance: state.walletBalance,
        pool_balance: state.poolBalance,
        total_equity: state.totalEquity,
        session_pnl: state.sessionPnL,
        bot_tier: activeTier,
        bot_tier_config: tierConfig,
        daily_target_pct: {
          min: tierConfig.dailyRoiMin,
          max: tierConfig.dailyRoiMax
        },
        projected_daily_profit: {
          min: state.walletBalance * tierConfig.dailyRoiMin,
          max: state.walletBalance * tierConfig.dailyRoiMax,
        },
        market_context: {
          volatility,
          active_pairs: useMarketStore.getState().tickers.size,
        },
        active_trades_count: state.trades.length,
        system_status: 'OPERATIONAL'
      }
    };
  }

  /**
   * Set user balance from external API
   * This allows integration with broader platforms
   * @param balance - The new balance to set
   * @param botTier - Optional bot tier to use (auto-selected if not provided)
   */
  public setUserBalance(balance: number, botTier?: BotTier): { 
    status: string; 
    walletBalance: number; 
    botTier: BotTier;
    botTierConfig: BotTierConfig;
    projectedDailyProfit: { min: number; max: number } 
  } {
    if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
      throw new Error('Invalid balance: must be a non-negative number');
    }
    
    // Set or auto-select tier
    if (botTier) {
      const tierConfig = BOT_TIERS[botTier];
      if (balance < tierConfig.minimumStake) {
        throw new Error(`Insufficient balance for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}`);
      }
      this.currentBotTier = botTier;
    } else {
      this.currentBotTier = getBotTierForStake(balance);
    }
    
    usePortfolioStore.getState().setWalletBalance(balance);
    usePortfolioStore.getState().resetDailyEquity(balance);
    
    const effectiveTier = this.getActiveBotTier();
    const tierConfig = BOT_TIERS[effectiveTier];
    
    return {
      status: 'success',
      walletBalance: balance,
      botTier: effectiveTier,
      botTierConfig: tierConfig,
      projectedDailyProfit: {
        min: balance * tierConfig.dailyRoiMin,
        max: balance * tierConfig.dailyRoiMax,
      }
    };
  }
}

// Expose API globally for frontend/platform integration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getTradingAgentStatus = () => PortfolioManager.getInstance().getPortfolioStateAPI();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).setTradingAgentBalance = (amount: number, botTier?: BotTier) => {
  try {
    const result = PortfolioManager.getInstance().setUserBalance(amount, botTier);
    return { 
      status: 'success', 
      new_balance: result.walletBalance,
      bot_tier: result.botTier,
      bot_tier_config: result.botTierConfig,
      projected_daily_profit: result.projectedDailyProfit
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Invalid amount' };
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).setBotTier = (tier: BotTier) => {
  try {
    PortfolioManager.getInstance().setBotTier(tier);
    return { 
      status: 'success', 
      bot_tier: tier,
      bot_tier_config: BOT_TIERS[tier]
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Invalid tier' };
  }
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getBotTiers = () => BOT_TIERS;

export const portfolioManager = PortfolioManager.getInstance();
