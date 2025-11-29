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

/** Bot mode types for smart/dumb trading simulation */
type BotMode = 'smart' | 'dumb' | 'recovering';

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

  // Bot mode system for smart/dumb trading simulation
  private currentBotMode: BotMode = 'smart';
  private modeStartTime: number = Date.now();
  private modeDuration: number = 0;
  private dumbModeAccumulatedLoss: number = 0;
  
  // Crypto pairs filter - only trade crypto, no stocks
  private readonly CRYPTO_SUFFIX_PATTERNS = ['USDT', 'BUSD', 'BTC', 'ETH', 'BNB', 'USD'];

  private constructor() {
    this.startTime = Date.now() - (Math.random() * 3600000 * 4); // Simulate we started 0-4 hours ago
    this.lastDayIndex = this.getCurrentDayIndex();
    this.initializeBotMode();
  }

  /**
   * Initialize or reset bot mode cycle
   * Creates variance with smart/dumb periods to simulate realistic bot behavior
   */
  private initializeBotMode(): void {
    // Start with a random mode, but weighted toward smart (60% smart, 30% dumb, 10% recovering)
    const roll = Math.random();
    if (roll < 0.6) {
      this.currentBotMode = 'smart';
      this.modeDuration = this.getSmartModeDuration();
    } else if (roll < 0.9) {
      this.currentBotMode = 'dumb';
      this.modeDuration = this.getDumbModeDuration();
    } else {
      this.currentBotMode = 'recovering';
      this.modeDuration = this.getRecoveringModeDuration();
    }
    this.modeStartTime = Date.now();
    this.dumbModeAccumulatedLoss = 0;
  }

  /**
   * Get duration for smart mode (longer periods of good trading)
   */
  private getSmartModeDuration(): number {
    // 45-90 seconds of smart trading
    return 45000 + Math.random() * 45000;
  }

  /**
   * Get duration for dumb mode (shorter scary periods)
   */
  private getDumbModeDuration(): number {
    // 15-35 seconds of dumb trading (scary for user)
    return 15000 + Math.random() * 20000;
  }

  /**
   * Get duration for recovering mode (moderate periods to reclaim losses)
   */
  private getRecoveringModeDuration(): number {
    // 25-50 seconds of recovery trading
    return 25000 + Math.random() * 25000;
  }

  /**
   * Update bot mode based on elapsed time and current state
   */
  private updateBotMode(): void {
    const elapsed = Date.now() - this.modeStartTime;
    if (elapsed < this.modeDuration) return;

    // Transition to next mode
    switch (this.currentBotMode) {
      case 'smart':
        // After smart mode, sometimes go dumb (40% chance) or stay smart (60%)
        if (Math.random() < 0.4) {
          this.currentBotMode = 'dumb';
          this.modeDuration = this.getDumbModeDuration();
          this.dumbModeAccumulatedLoss = 0;
        } else {
          this.modeDuration = this.getSmartModeDuration();
        }
        break;
      case 'dumb':
        // After dumb mode, always go to recovering to reclaim losses
        this.currentBotMode = 'recovering';
        this.modeDuration = this.getRecoveringModeDuration();
        break;
      case 'recovering':
        // After recovering, go back to smart mode
        this.currentBotMode = 'smart';
        this.modeDuration = this.getSmartModeDuration();
        this.dumbModeAccumulatedLoss = 0;
        break;
    }
    this.modeStartTime = Date.now();
  }

  /**
   * Get current bot mode
   */
  public getCurrentBotMode(): BotMode {
    return this.currentBotMode;
  }

  /**
   * Check if a symbol is a valid crypto trading pair (not a stock)
   */
  private isCryptoTradingPair(symbol: string): boolean {
    return this.CRYPTO_SUFFIX_PATTERNS.some(suffix => symbol.endsWith(suffix));
  }

  /**
   * Filter tickers to only include crypto trading pairs
   */
  private getCryptoTickers(): Map<string, { symbol: string; closePrice: string; openPrice: string }> {
    const tickers = useMarketStore.getState().tickers;
    const cryptoTickers = new Map<string, { symbol: string; closePrice: string; openPrice: string }>();
    
    for (const [symbol, ticker] of tickers) {
      if (this.isCryptoTradingPair(symbol)) {
        cryptoTickers.set(symbol, ticker);
      }
    }
    
    return cryptoTickers;
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
    if (this.tradeInterval) clearTimeout(this.tradeInterval);
    if (this.activityInterval) clearTimeout(this.activityInterval);
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
   * Now includes bot mode context for more realistic feedback
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

    // Bot mode specific messages
    const botModeActions = {
      smart: [
        '🎯 Strategy optimized, executing calculated entries...',
        '🎯 Pattern confidence high, proceeding with plan...',
        '🎯 Risk/reward favorable, increasing position...',
        '🎯 Market conditions ideal for strategy...',
        '🎯 Precision mode: tight stop-losses set...',
      ],
      dumb: [
        '⚠️ Signal unclear, taking speculative position...',
        '⚠️ High uncertainty, reducing confidence threshold...',
        '⚠️ Conflicting indicators, proceeding with caution...',
        '⚠️ Market noise elevated, signals degraded...',
        '⚠️ Strategy deviation detected, recalibrating...',
        '⚠️ Unexpected price action, adjusting model...',
      ],
      recovering: [
        '🔄 Recovery mode: targeting previous loss levels...',
        '🔄 Reclaiming position, strategy realigning...',
        '🔄 Profit target locked, executing recovery...',
        '🔄 Drawdown recovery in progress...',
        '🔄 Strategy confidence restored, accelerating...',
      ],
    };

    const runActivity = () => {
      if (!this.isRunning) return;

      const volatility = this.calculateMarketVolatility();
      const botMode = this.currentBotMode;
      
      // Use crypto tickers only
      const cryptoTickers = this.getCryptoTickers();
      
      // Mix between volatility actions and bot mode actions
      let action: string;
      const roll = Math.random();
      
      if (roll < 0.35) {
        // Show bot mode specific message
        const modeActions = botModeActions[botMode];
        action = modeActions[Math.floor(Math.random() * modeActions.length)];
      } else if (roll < 0.55 && cryptoTickers.size > 0) {
        // Show symbol specific log with market context
        const symbols = Array.from(cryptoTickers.keys());
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const ticker = cryptoTickers.get(symbol);
        if (ticker) {
          const price = parseFloat(ticker.closePrice);
          const trend = this.getMarketTrend(symbol);
          const trendEmoji = trend === 'bullish' ? '↑' : trend === 'bearish' ? '↓' : '→';
          action = `${trendEmoji} ${symbol.replace('USDT', '')} @ $${price.toFixed(2)} - Analyzing crypto pair...`;
        } else {
          const actions = volatilityActions[volatility];
          action = actions[Math.floor(Math.random() * actions.length)];
        }
      } else {
        // Show volatility-based action
        const actions = volatilityActions[volatility];
        action = actions[Math.floor(Math.random() * actions.length)];
      }

      usePortfolioStore.getState().addLog(action, 'system');

      // Adjust interval based on volatility and bot mode
      // Dumb mode = faster, more chaotic logging to increase tension
      let baseDelay: number;
      if (botMode === 'dumb') {
        baseDelay = volatility === 'high' ? 50 : volatility === 'low' ? 120 : 70;
      } else if (botMode === 'recovering') {
        baseDelay = volatility === 'high' ? 70 : volatility === 'low' ? 150 : 90;
      } else {
        baseDelay = volatility === 'high' ? 80 : volatility === 'low' ? 200 : 100;
      }
      
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
   * Includes smart/dumb bot mode cycles to create variance and tension
   */
  private startTradeCycle() {
    const executeTrade = () => {
      if (!this.isRunning) return;
      
      // Update bot mode based on elapsed time
      this.updateBotMode();
      
      // Only use crypto trading pairs (filter out stocks)
      const cryptoTickers = this.getCryptoTickers();
      if (cryptoTickers.size === 0) {
        this.scheduleNextTrade();
        return;
      }

      const currentDayIndex = this.getCurrentDayIndex();
      if (currentDayIndex !== this.lastDayIndex) {
        this.recentPnL = [];
        this.lastDayIndex = currentDayIndex;
        // Reset start of day equity for new day
        const { walletBalance } = usePortfolioStore.getState();
        usePortfolioStore.getState().resetDailyEquity(walletBalance);
        // Reset dumb mode accumulated loss for new day
        this.dumbModeAccumulatedLoss = 0;
      }

      // Pick a random crypto symbol
      const symbols = Array.from(cryptoTickers.keys());
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const ticker = cryptoTickers.get(symbol);
      
      if (!ticker) {
        this.scheduleNextTrade();
        return;
      }

      const price = parseFloat(ticker.closePrice);
      if (isNaN(price) || price <= 0) {
        this.scheduleNextTrade();
        return;
      }

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

      // Get base market modifiers
      const marketModifier = this.getMarketContextModifier(volatility, trend);
      
      // Apply bot mode modifiers for variance
      const botModeModifier = this.getBotModeModifier();

      // Calculate PnL based on bot mode
      pnl = this.calculateTradeOutcome(
        currentReturn,
        targetReturnNow,
        targetDailyMax,
        dayProgress,
        scaleFactor,
        marketModifier,
        botModeModifier
      );

      // Apply PnL guards to ensure we stay on track for daily target
      pnl = this.applyPnLGuards(pnl, currentReturn, dayProgress);
      
      // Apply variance to trade amount (dumb mode = larger risky trades, smart mode = calculated)
      const amountVariance = this.getAmountVariance();
      pnl = pnl * amountVariance;
      
      const normalizedPnL = Number(pnl.toFixed(2));
      const side: 'BUY' | 'SELL' = normalizedPnL >= 0 ? 'BUY' : 'SELL';
      
      // Quantity also varies based on bot mode
      const baseQuantity = (Math.random() * 500 * scaleFactor) / price;
      const quantity = baseQuantity * amountVariance;

      // Track accumulated losses in dumb mode for recovery calculation
      if (this.currentBotMode === 'dumb' && normalizedPnL < 0) {
        this.dumbModeAccumulatedLoss += Math.abs(normalizedPnL);
      }

      // Execute trade (Ledger update)
      usePortfolioStore.getState().addTrade({
        symbol: symbol.replace('USDT', ''),
        side,
        price,
        quantity,
        pnl: normalizedPnL
      });

      // Log the trade execution with bot mode context
      const pnlText = normalizedPnL >= 0 ? `+${normalizedPnL.toFixed(2)}` : normalizedPnL.toFixed(2);
      const modeIndicator = this.getBotModeIndicator();
      const volIndicator = volatility === 'high' ? '⚡' : volatility === 'low' ? '💤' : '';
      const msg = `EXECUTED: ${side === 'BUY' ? 'Long' : 'Short'} ${symbol.replace('USDT', '')} | PnL: ${pnlText} ${modeIndicator}${volIndicator}`;
      usePortfolioStore.getState().addLog(msg, 'trade');
      this.recordPnL(normalizedPnL);

      // Schedule next trade with variance based on bot mode
      this.scheduleNextTrade();
    };

    executeTrade();
  }

  /**
   * Schedule next trade with timing variance based on bot mode
   * Smart mode: slower, more calculated (6-12s)
   * Dumb mode: faster, more chaotic (2-5s) 
   * Recovering mode: moderate pace (4-8s)
   */
  private scheduleNextTrade(): void {
    let baseDelay: number;
    let variance: number;
    
    switch (this.currentBotMode) {
      case 'smart':
        baseDelay = 6000;
        variance = 6000;
        break;
      case 'dumb':
        baseDelay = 2000;
        variance = 3000;
        break;
      case 'recovering':
        baseDelay = 4000;
        variance = 4000;
        break;
      default:
        baseDelay = 5000;
        variance = 8000;
    }
    
    const nextDelay = baseDelay + Math.random() * variance;
    this.tradeInterval = setTimeout(() => this.startTradeCycle(), nextDelay);
  }

  /**
   * Get bot mode modifier for trade outcomes
   */
  private getBotModeModifier(): {
    winRateMultiplier: number;
    profitMultiplier: number;
    lossMultiplier: number;
  } {
    const modifiers = {
      winRateMultiplier: 1,
      profitMultiplier: 1,
      lossMultiplier: 1,
    };

    switch (this.currentBotMode) {
      case 'smart':
        // Smart mode: high win rate, moderate profits, small losses
        modifiers.winRateMultiplier = 1.3;
        modifiers.profitMultiplier = 1.2;
        modifiers.lossMultiplier = 0.6;
        break;
      case 'dumb':
        // Dumb mode: low win rate, smaller profits when winning, larger losses (scary!)
        modifiers.winRateMultiplier = 0.35;
        modifiers.profitMultiplier = 0.5;
        modifiers.lossMultiplier = 1.8;
        break;
      case 'recovering':
        // Recovery mode: very high win rate to reclaim losses, good profits
        modifiers.winRateMultiplier = 1.6;
        modifiers.profitMultiplier = 1.5;
        modifiers.lossMultiplier = 0.3;
        
        // If we have accumulated losses to recover, boost even more
        if (this.dumbModeAccumulatedLoss > 0) {
          modifiers.winRateMultiplier = 1.9;
          modifiers.profitMultiplier = 2.0;
        }
        break;
    }

    return modifiers;
  }

  /**
   * Calculate trade outcome based on all modifiers
   */
  private calculateTradeOutcome(
    currentReturn: number,
    targetReturnNow: number,
    targetDailyMax: number,
    dayProgress: number,
    scaleFactor: number,
    marketModifier: { winRateMultiplier: number; profitMultiplier: number; lossMultiplier: number },
    botModeModifier: { winRateMultiplier: number; profitMultiplier: number; lossMultiplier: number }
  ): number {
    let pnl = 0;
    const combinedWinRate = 0.55 * marketModifier.winRateMultiplier * botModeModifier.winRateMultiplier;
    const combinedProfitMult = marketModifier.profitMultiplier * botModeModifier.profitMultiplier;
    const combinedLossMult = marketModifier.lossMultiplier * botModeModifier.lossMultiplier;

    // In recovery mode with accumulated losses, ensure we're winning
    if (this.currentBotMode === 'recovering' && this.dumbModeAccumulatedLoss > 0) {
      // 90% chance to win in recovery with accumulated losses
      if (Math.random() < 0.9) {
        // Win back a portion of accumulated losses
        const recoverAmount = Math.min(
          this.dumbModeAccumulatedLoss * 0.3,
          (Math.random() * 60 + 30) * scaleFactor
        );
        pnl = recoverAmount * combinedProfitMult;
        this.dumbModeAccumulatedLoss -= recoverAmount;
      } else {
        pnl = (Math.random() * -15 - 5) * scaleFactor * combinedLossMult;
      }
    }
    // If we are BEHIND schedule, we generally want to win (unless in dumb mode)
    else if (currentReturn < targetReturnNow) {
      if (Math.random() < combinedWinRate) {
        pnl = (Math.random() * 40 + 10) * scaleFactor * combinedProfitMult;
      } else {
        pnl = (Math.random() * -20 - 5) * scaleFactor * combinedLossMult;
      }
    }
    // If we are AHEAD of schedule, force a correction (use this as a "dumb mode" opportunity)
    else if (currentReturn > targetDailyMax * dayProgress * 1.2) {
      pnl = (Math.random() * -30 - 5) * scaleFactor * combinedLossMult;
    }
    // Otherwise, mixed outcome based on bot mode
    else {
      const basePnL = (Math.random() - 0.45) * 60;
      if (Math.random() < combinedWinRate) {
        pnl = (Math.abs(basePnL) + 5) * scaleFactor * combinedProfitMult;
      } else {
        pnl = -Math.abs(basePnL) * scaleFactor * combinedLossMult;
      }
    }

    return pnl;
  }

  /**
   * Get amount variance multiplier based on bot mode
   * Dumb mode: larger, riskier position sizes
   * Smart mode: calculated, optimal position sizes
   */
  private getAmountVariance(): number {
    switch (this.currentBotMode) {
      case 'smart':
        // Consistent, calculated trades (0.8 - 1.2x)
        return 0.8 + Math.random() * 0.4;
      case 'dumb':
        // Wild variance - sometimes too big, sometimes too small (0.5 - 2.5x)
        return 0.5 + Math.random() * 2.0;
      case 'recovering':
        // Slightly larger to recover faster (1.0 - 1.5x)
        return 1.0 + Math.random() * 0.5;
      default:
        return 1.0;
    }
  }

  /**
   * Get visual indicator for current bot mode
   */
  private getBotModeIndicator(): string {
    switch (this.currentBotMode) {
      case 'smart':
        return '🎯';
      case 'dumb':
        return '⚠️';
      case 'recovering':
        return '🔄';
      default:
        return '';
    }
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
    const cryptoTickers = this.getCryptoTickers();
    
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
        bot_mode: this.currentBotMode,
        bot_mode_description: this.getBotModeDescription(),
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
          active_crypto_pairs: cryptoTickers.size,
          total_pairs: useMarketStore.getState().tickers.size,
        },
        active_trades_count: state.trades.length,
        system_status: 'OPERATIONAL'
      }
    };
  }

  /**
   * Get human-readable description of current bot mode
   */
  private getBotModeDescription(): string {
    switch (this.currentBotMode) {
      case 'smart':
        return 'Optimized trading - high accuracy, calculated positions';
      case 'dumb':
        return 'Volatile trading - experiencing temporary setbacks';
      case 'recovering':
        return 'Recovery mode - reclaiming previous losses';
      default:
        return 'Normal operation';
    }
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
