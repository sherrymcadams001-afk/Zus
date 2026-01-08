import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';

/**
 * PortfolioManager
 * 
 * Handles the "business logic" of the autonomous trading system.
 * - Generates consistent payouts (Treasury Reactor)
 * - Executes simulated trades based on market movements
 * - Ensures mathematical consistency across the dashboard
 * - Supports multi-tier strategy system with different ROI rates
 * - Integrates market context for more realistic trade outcomes
 * 
 * Note: Frontend uses "StrategyTier". Backend API uses "bot_tier" for DB compatibility.
 */

/** Market volatility levels for contextual trading */
type MarketVolatility = 'low' | 'medium' | 'high';

/** Agent mode types for smart/dumb trading simulation */
type BotMode = 'smart' | 'dumb' | 'recovering';

/** Strategy tier types for multi-tier trading system */
export type StrategyTier = 'anchor' | 'vector' | 'kinetic' | 'horizon';

/** @deprecated Use StrategyTier instead */
export type BotTier = StrategyTier;

/** Strategy tier configuration */
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

/** @deprecated Use StrategyTierConfig instead */
export type BotTierConfig = StrategyTierConfig;

/** Strategy tier configurations - mirroring backend */
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

/** Get strategy tier based on stake amount */
export function getStrategyTierForStake(stakeAmount: number): StrategyTier {
  if (stakeAmount >= STRATEGY_TIERS.horizon.minimumStake) return 'horizon';
  if (stakeAmount >= STRATEGY_TIERS.kinetic.minimumStake) return 'kinetic';
  if (stakeAmount >= STRATEGY_TIERS.vector.minimumStake) return 'vector';
  return 'anchor';
}

/** @deprecated Use getStrategyTierForStake instead */
export const getBotTierForStake = getStrategyTierForStake;

class PortfolioManager {
  private static instance: PortfolioManager | null = null;
  private isRunning = false;
  private tradeTimeout: ReturnType<typeof setTimeout> | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;
  
  // Cashflow tracking - accumulated from trades
  private sessionStartTime: number = Date.now();
  private dailyCashflow: number = 0;

  // Current strategy tier - defaults to auto-selection based on balance
  private currentStrategyTier: StrategyTier | null = null;
  
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private startTime: number = Date.now();
  private recentPnL: number[] = [];
  private readonly MAX_RECENT_TRADES = 18;
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
  
  // Bot mode probability thresholds (for initial mode selection)
  private readonly SMART_MODE_PROBABILITY = 0.6;   // 60% chance to start in smart mode
  private readonly DUMB_MODE_PROBABILITY = 0.9;    // 30% chance (0.6-0.9) to start in dumb mode
  // Remaining 10% (0.9-1.0) is recovering mode
  
  // Crypto pairs filter - only trade crypto, no stocks
  // These are common crypto quote currencies that form valid trading pairs
  private readonly CRYPTO_QUOTE_CURRENCIES = ['USDT', 'BUSD', 'USDC', 'TUSD', 'FDUSD'];

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
    // Start with a random mode using probability thresholds
    const roll = Math.random();
    if (roll < this.SMART_MODE_PROBABILITY) {
      this.currentBotMode = 'smart';
      this.modeDuration = this.getSmartModeDuration();
    } else if (roll < this.DUMB_MODE_PROBABILITY) {
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
   * Uses strict matching on known crypto quote currencies
   */
  private isCryptoTradingPair(symbol: string): boolean {
    return this.CRYPTO_QUOTE_CURRENCIES.some(suffix => symbol.endsWith(suffix));
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
   * Get the current active strategy tier
   * Returns explicitly set tier or auto-selects based on wallet balance
   */
  public getActiveStrategyTier(): StrategyTier {
    if (this.currentStrategyTier) {
      return this.currentStrategyTier;
    }
    const { walletBalance } = usePortfolioStore.getState();
    return getStrategyTierForStake(walletBalance);
  }

  /** @deprecated Use getActiveStrategyTier instead */
  public getActiveBotTier = this.getActiveStrategyTier;

  /**
   * Get the config for the current active tier
   */
  public getActiveTierConfig(): StrategyTierConfig {
    return STRATEGY_TIERS[this.getActiveStrategyTier()];
  }

  /**
   * Set the strategy tier explicitly
   */
  public setStrategyTier(tier: StrategyTier): void {
    const { walletBalance } = usePortfolioStore.getState();
    const tierConfig = STRATEGY_TIERS[tier];
    
    if (walletBalance < tierConfig.minimumStake) {
      throw new Error(`Insufficient balance for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}`);
    }
    
    this.currentStrategyTier = tier;
  }

  /** @deprecated Use setStrategyTier instead */
  public setBotTier = this.setStrategyTier;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Pre-populate historical trades so log is never empty on page load
    this.generateHistoricalTrades();

    // Start the "Bot Execution" cycle (Slow Ledger)
    this.startTradeCycle();

    // Start the "Agent Activity" cycle (Moderate Logs - 5-15s intervals)
    this.startActivityCycle();
  }

  public stop() {
    this.isRunning = false;
    if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
    if (this.activityTimeout) clearTimeout(this.activityTimeout);
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
   * Pre-populate historical trades on start
   * Generates 20-30 realistic past trades spanning the last 30-60 minutes
   * Users see an active log immediately, not an empty one
   */
  private generateHistoricalTrades(): void {
    const store = usePortfolioStore.getState();
    const { walletBalance, startOfDayWalletBalance } = store;
    const baseBalance = startOfDayWalletBalance > 0 ? startOfDayWalletBalance : Math.max(walletBalance, 1000);
    
    // Get tier config for realistic amounts
    const tierConfig = this.getActiveTierConfig();
    const hourlyTarget = baseBalance * ((tierConfig.hourlyRoiMin + tierConfig.hourlyRoiMax) / 2);
    
    // Generate 20-30 historical trades over last 30-60 mins
    const tradeCount = 20 + Math.floor(Math.random() * 11);
    const timeSpan = (30 + Math.random() * 30) * 60 * 1000; // 30-60 mins in ms
    const now = Date.now();
    
    // Common crypto symbols for variety
    const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'MATIC'];
    
    // Calculate micro-gain per trade to hit hourly target
    // ~50% wins, ~50% losses, but net positive
    const tradesPerHour = tradeCount * (60 / ((timeSpan / 1000) / 60));
    const avgGainPerTrade = hourlyTarget / tradesPerHour;
    
    let accumulatedPnL = 0;
    const historicalTrades: Array<{
      symbol: string;
      side: 'BUY' | 'SELL';
      price: number;
      quantity: number;
      pnl: number;
      timestamp: number;
    }> = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const timestamp = now - timeSpan + (i / tradeCount) * timeSpan;
      
      // ~50% win rate, varied amounts
      const isWin = Math.random() < 0.52; // Slight bias toward wins
      let pnl: number;
      
      if (isWin) {
        // Wins: 0.5x to 2.5x of average gain
        pnl = avgGainPerTrade * (0.5 + Math.random() * 2);
      } else {
        // Losses: 0.3x to 1.5x of average gain (smaller on average)
        pnl = -avgGainPerTrade * (0.3 + Math.random() * 1.2);
      }
      
      pnl = Number(pnl.toFixed(2));
      accumulatedPnL += pnl;
      
      // Approximate price based on symbol
      const basePrices: Record<string, number> = {
        BTC: 95000, ETH: 3400, SOL: 190, XRP: 2.3, DOGE: 0.35,
        ADA: 1.05, AVAX: 38, LINK: 23, DOT: 7.2, MATIC: 0.48
      };
      const price = basePrices[symbol] * (0.98 + Math.random() * 0.04);
      const quantity = Math.abs(pnl) / (price * 0.001) * (0.5 + Math.random());
      
      historicalTrades.push({
        symbol,
        side: pnl >= 0 ? 'BUY' : 'SELL',
        price,
        quantity,
        pnl,
        timestamp
      });
    }
    
    // Add trades to store in chronological order (oldest first, so newest shows at top)
    historicalTrades.forEach(trade => {
      store.addTrade(trade);
    });
    
    // Also add some historical activity logs
    const activityMessages = [
      '🎯 Pattern confidence high, proceeding with plan...',
      'Scanning market structure...',
      'Analyzing order book depth...',
      '🎯 Risk/reward favorable, position entered...',
      'Volume profile analysis complete...',
      'Cross-exchange spread detected...',
      '🎯 Multi-timeframe confluence achieved...',
      'Monitoring liquidity pools...',
      'Optimizing execution path...',
      'Sentiment analysis running...',
    ];
    
    // Add 8-12 historical log entries
    const logCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < logCount; i++) {
      const msg = activityMessages[Math.floor(Math.random() * activityMessages.length)];
      store.addLog(msg, 'system');
    }
    
    // Update daily cashflow
    this.dailyCashflow = accumulatedPnL;
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
        'Accumulation phase detected, patience mode...',
        'Volume declining, awaiting catalyst...',
        'Support level holding, watching closely...',
        'Sideways trend confirmed, range strategy active...',
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
        'Sentiment analysis running...',
        'Cross-exchange spread detected...',
        'Funding rate analysis complete...',
        'Order flow imbalance noted...',
        'VWAP deviation tracking...',
        'Ichimoku cloud alignment check...',
        'RSI divergence scanning...',
        'Fibonacci retracement levels mapped...',
        'OBV trend confirmation...',
        'Bollinger band squeeze detected...',
        'MACD crossover pending...',
        'Volume profile analysis...',
        'Liquidation heatmap loaded...',
        'Whale wallet tracking active...',
        'DEX/CEX arbitrage scanning...',
        'Mempool analysis in progress...',
      ],
      high: [
        'High volatility alert! Adjusting position size...',
        'Rapid price movement detected, hedging...',
        'Volatility spike, pausing new entries...',
        'Emergency risk assessment in progress...',
        'Large order detected, analyzing impact...',
        'Cascade liquidation risk elevated...',
        'Flash crash protocol activated...',
        'Stop-loss clusters identified, caution...',
        'Whale movement detected on-chain...',
        'Exchange outflow spike, monitoring...',
        'Fear & Greed index extreme reading...',
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
        '🎯 Alpha signal detected, capitalizing...',
        '🎯 Momentum confirmed, scaling in...',
        '🎯 Multi-timeframe confluence achieved...',
        '🎯 Smart money footprint identified...',
        '🎯 Optimal entry zone reached, executing...',
      ],
      dumb: [
        '⚠️ Signal unclear, taking speculative position...',
        '⚠️ High uncertainty, reducing confidence threshold...',
        '⚠️ Conflicting indicators, proceeding with caution...',
        '⚠️ Market noise elevated, signals degraded...',
        '⚠️ Strategy deviation detected, recalibrating...',
        '⚠️ Unexpected price action, adjusting model...',
        '⚠️ Choppy conditions, reduced position sizing...',
        '⚠️ False breakout detected, reassessing...',
        '⚠️ Whipsaw risk high, defensive mode...',
        '⚠️ Correlation breakdown, hedges adjusted...',
      ],
      recovering: [
        '🔄 Recovery mode: targeting previous loss levels...',
        '🔄 Reclaiming position, strategy realigning...',
        '🔄 Profit target locked, executing recovery...',
        '🔄 Drawdown recovery in progress...',
        '🔄 Strategy confidence restored, accelerating...',
        '🔄 Compound gains accumulating...',
        '🔄 Loss recovery: 65% complete...',
        '🔄 Momentum shift favorable, pressing advantage...',
        '🔄 Risk budget replenished, resuming normal ops...',
        '🔄 P&L trajectory improving steadily...',
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

      // Activity log interval: 5-15 seconds for realistic pacing
      // Slightly faster during high volatility or dumb mode for tension
      let baseDelay: number;
      if (botMode === 'dumb') {
        baseDelay = volatility === 'high' ? 4000 : volatility === 'low' ? 8000 : 5000;
      } else if (botMode === 'recovering') {
        baseDelay = volatility === 'high' ? 5000 : volatility === 'low' ? 10000 : 6000;
      } else {
        baseDelay = volatility === 'high' ? 6000 : volatility === 'low' ? 12000 : 8000;
      }
      
      const nextDelay = baseDelay + Math.random() * (baseDelay * 0.8);
      this.activityTimeout = setTimeout(runActivity, nextDelay);
    };

    runActivity();
  }

  /**
   * Simulates trading activity based on current market prices
   * Uses tier-based micro-gains: daily target distributed across many trades
   * ~50% wins, ~50% losses, but net positive adhering to tier ROI
   * Includes market context for realistic price-based outcomes
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
        this.dailyCashflow = 0;
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

      // --- Tier-Based Micro-Gain Calculation ---
      const { walletBalance, startOfDayWalletBalance, sessionPnL } = usePortfolioStore.getState();
      const baseBalance = startOfDayWalletBalance > 0 ? startOfDayWalletBalance : Math.max(walletBalance, 1000);
      
      // Get tier config for this user's stake
      const tierConfig = this.getActiveTierConfig();
      const hourlyRoiMid = (tierConfig.hourlyRoiMin + tierConfig.hourlyRoiMax) / 2;
      const hourlyTarget = baseBalance * hourlyRoiMid;
      
      // Estimate ~30-50 trades per hour, so each trade's net contribution
      const tradesPerHour = 40;
      const avgNetGainPerTrade = hourlyTarget / tradesPerHour;
      
      // Calculate current progress toward target
      const currentReturn = baseBalance > 0 ? sessionPnL / baseBalance : 0;
      const elapsedTime = Date.now() - this.startTime;
      const dayProgress = (elapsedTime % this.MS_PER_DAY) / this.MS_PER_DAY;
      const targetReturnNow = tierConfig.dailyRoiMin * dayProgress;
      
      // Determine win/loss for this trade (~50% each, but biased to hit target)
      const behindSchedule = currentReturn < targetReturnNow * 0.9;
      const aheadOfSchedule = currentReturn > tierConfig.dailyRoiMax * dayProgress * 1.1;
      
      // Base win probability ~52% to ensure net positive
      let winProbability = 0.52;
      
      // Adjust based on schedule
      if (behindSchedule) winProbability = 0.65; // Catch up
      if (aheadOfSchedule) winProbability = 0.40; // Slow down
      
      // Apply bot mode adjustments
      const botModeModifier = this.getBotModeModifier();
      winProbability *= botModeModifier.winRateMultiplier;
      winProbability = Math.min(0.85, Math.max(0.25, winProbability)); // Clamp
      
      const isWin = Math.random() < winProbability;
      
      // Calculate PnL as micro-gain/loss
      let pnl: number;
      const volatility = this.calculateMarketVolatility();
      const volMultiplier = volatility === 'high' ? 1.4 : volatility === 'low' ? 0.7 : 1.0;
      
      if (isWin) {
        // Wins: 0.8x to 2.2x of average net gain
        pnl = avgNetGainPerTrade * (0.8 + Math.random() * 1.4) * volMultiplier;
        pnl *= botModeModifier.profitMultiplier;
      } else {
        // Losses: 0.5x to 1.5x of average net gain (smaller than wins on average)
        pnl = -avgNetGainPerTrade * (0.5 + Math.random() * 1.0) * volMultiplier;
        pnl *= botModeModifier.lossMultiplier;
      }
      
      // Track accumulated losses in dumb mode for recovery
      if (this.currentBotMode === 'dumb' && pnl < 0) {
        this.dumbModeAccumulatedLoss += Math.abs(pnl);
      }
      
      // In recovery mode, boost wins to reclaim losses
      if (this.currentBotMode === 'recovering' && this.dumbModeAccumulatedLoss > 0 && isWin) {
        const recoverBonus = Math.min(this.dumbModeAccumulatedLoss * 0.15, avgNetGainPerTrade * 2);
        pnl += recoverBonus;
        this.dumbModeAccumulatedLoss -= recoverBonus;
      }
      
      const normalizedPnL = Number(pnl.toFixed(2));
      const side: 'BUY' | 'SELL' = normalizedPnL >= 0 ? 'BUY' : 'SELL';
      
      // Calculate quantity based on price and PnL
      const quantity = Math.abs(normalizedPnL) / (price * 0.001) * (0.5 + Math.random());
      
      // Update daily cashflow
      this.dailyCashflow += normalizedPnL;

      // Execute trade (Ledger update)
      usePortfolioStore.getState().addTrade({
        symbol: symbol.replace('USDT', ''),
        side,
        price,
        quantity,
        pnl: normalizedPnL
      });

      // Log the trade execution with bot mode context
      const pnlText = normalizedPnL >= 0 ? `+$${normalizedPnL.toFixed(2)}` : `-$${Math.abs(normalizedPnL).toFixed(2)}`;
      const modeIndicator = this.getBotModeIndicator();
      const volIndicator = volatility === 'high' ? '⚡' : volatility === 'low' ? '💤' : '';
      const msg = `EXECUTED: ${side === 'BUY' ? 'Long' : 'Short'} ${symbol.replace('USDT', '')} | PnL: ${pnlText} ${modeIndicator}${volIndicator}`;
      usePortfolioStore.getState().addLog(msg, 'trade');
      this.recordPnL(normalizedPnL);

      // Schedule next trade (5-15 seconds for micro-gains)
      this.scheduleNextTrade();
    };

    executeTrade();
  }

  /**
   * Schedule next trade with timing for micro-gains
   * Trades every 5-15 seconds to distribute daily target
   */
  private scheduleNextTrade(): void {
    let baseDelay: number;
    let variance: number;
    
    // Micro-gain pacing: 5-15 second intervals
    switch (this.currentBotMode) {
      case 'smart':
        baseDelay = 8000;  // 8-15s in smart mode
        variance = 7000;
        break;
      case 'dumb':
        baseDelay = 5000;  // 5-10s in dumb mode (faster, more chaotic)
        variance = 5000;
        break;
      case 'recovering':
        baseDelay = 6000;  // 6-12s in recovery mode
        variance = 6000;
        break;
      default:
        baseDelay = 7000;
        variance = 6000;
    }
    
    const nextDelay = baseDelay + Math.random() * variance;
    this.tradeTimeout = setTimeout(() => this.startTradeCycle(), nextDelay);
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

  private recordPnL(pnl: number): void {
    this.recentPnL.push(pnl);
    if (this.recentPnL.length > this.MAX_RECENT_TRADES) {
      this.recentPnL.shift();
    }
  }

  private getCurrentDayIndex(): number {
    return Math.floor((Date.now() - this.startTime) / this.MS_PER_DAY);
  }

  /**
   * Get current cashflow data (ROI derived from trades)
   */
  public getCashflowData(): {
    dailyCashflow: number;
    sessionDuration: number;
    projectedDaily: number;
    projectedWeekly: number;
    projectedMonthly: number;
    tierName: string;
    tierRoiRange: string;
  } {
    const tierConfig = this.getActiveTierConfig();
    const { walletBalance, startOfDayWalletBalance } = usePortfolioStore.getState();
    const baseBalance = startOfDayWalletBalance > 0 ? startOfDayWalletBalance : Math.max(walletBalance, 1000);
    
    const sessionDuration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    
    // Calculate projected earnings based on tier rates
    const dailyRoiMid = (tierConfig.dailyRoiMin + tierConfig.dailyRoiMax) / 2;
    const projectedDaily = baseBalance * dailyRoiMid;
    const projectedWeekly = projectedDaily * tierConfig.tradingDaysPerWeek;
    const projectedMonthly = projectedDaily * tierConfig.tradingDaysPerWeek * 4;
    
    const roiMin = (tierConfig.hourlyRoiMin * 100).toFixed(2);
    const roiMax = (tierConfig.hourlyRoiMax * 100).toFixed(2);
    const tierRoiRange = roiMin === roiMax ? `${roiMin}%/hr` : `${roiMin}%-${roiMax}%/hr`;
    
    return {
      dailyCashflow: this.dailyCashflow,
      sessionDuration,
      projectedDaily,
      projectedWeekly,
      projectedMonthly,
      tierName: tierConfig.name,
      tierRoiRange,
    };
  }

  /**
   * Exposes the current portfolio state as a JSON object
   * For integration with broader platforms
   */
  public getPortfolioStateAPI() {
    const state = usePortfolioStore.getState();
    const volatility = this.calculateMarketVolatility();
    const activeTier = this.getActiveStrategyTier();
    const tierConfig = STRATEGY_TIERS[activeTier];
    const cryptoTickers = this.getCryptoTickers();
    
    return {
      status: 'success',
      timestamp: Date.now(),
      data: {
        wallet_balance: state.walletBalance,
        pool_balance: state.poolBalance,
        total_equity: state.totalEquity,
        session_pnl: state.sessionPnL,
        strategy_tier: activeTier,
        strategy_tier_config: tierConfig,
        // Backward compatibility: keep bot_tier in API response
        bot_tier: activeTier,
        bot_tier_config: tierConfig,
        agent_mode: this.currentBotMode,
        agent_mode_description: this.getBotModeDescription(),
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
   * @param strategyTier - Optional strategy tier to use (auto-selected if not provided)
   */
  public setUserBalance(balance: number, strategyTier?: StrategyTier): { 
    status: string; 
    walletBalance: number; 
    strategyTier: StrategyTier;
    strategyTierConfig: StrategyTierConfig;
    projectedDailyProfit: { min: number; max: number } 
  } {
    if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
      throw new Error('Invalid balance: must be a non-negative number');
    }
    
    // Set or auto-select tier
    if (strategyTier) {
      const tierConfig = STRATEGY_TIERS[strategyTier];
      if (balance < tierConfig.minimumStake) {
        throw new Error(`Insufficient balance for ${tierConfig.name}. Minimum stake: $${tierConfig.minimumStake.toLocaleString()}`);
      }
      this.currentStrategyTier = strategyTier;
    } else {
      this.currentStrategyTier = getStrategyTierForStake(balance);
    }
    
    usePortfolioStore.getState().setWalletBalance(balance);
    usePortfolioStore.getState().resetDailyEquity(balance);
    
    const effectiveTier = this.getActiveStrategyTier();
    const tierConfig = STRATEGY_TIERS[effectiveTier];
    
    return {
      status: 'success',
      walletBalance: balance,
      strategyTier: effectiveTier,
      strategyTierConfig: tierConfig,
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
(window as any).setTradingAgentBalance = (amount: number, strategyTier?: StrategyTier) => {
  try {
    const result = PortfolioManager.getInstance().setUserBalance(amount, strategyTier);
    return { 
      status: 'success', 
      new_balance: result.walletBalance,
      strategy_tier: result.strategyTier,
      strategy_tier_config: result.strategyTierConfig,
      // Backward compatibility
      bot_tier: result.strategyTier,
      bot_tier_config: result.strategyTierConfig,
      projected_daily_profit: result.projectedDailyProfit
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Invalid amount' };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).setStrategyTier = (tier: StrategyTier) => {
  try {
    PortfolioManager.getInstance().setStrategyTier(tier);
    return { 
      status: 'success', 
      strategy_tier: tier,
      strategy_tier_config: STRATEGY_TIERS[tier]
    };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Invalid tier' };
  }
};

/** @deprecated Use setStrategyTier instead */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).setBotTier = (window as any).setStrategyTier;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getStrategyTiers = () => STRATEGY_TIERS;

/** @deprecated Use getStrategyTiers instead */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).getBotTiers = (window as any).getStrategyTiers;

export const portfolioManager = PortfolioManager.getInstance();
