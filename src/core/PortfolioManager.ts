import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';

/**
 * PortfolioManager
 * 
 * Handles the "business logic" of the autonomous trading system.
 * - Generates consistent payouts (Treasury Reactor)
 * - Executes simulated trades based on market movements
 * - Ensures mathematical consistency across the dashboard
 * - Enforces a 1.1% - 1.4% daily profit target
 */
class PortfolioManager {
  private static instance: PortfolioManager | null = null;
  private isRunning = false;
  private payoutInterval: ReturnType<typeof setInterval> | null = null;
  private tradeInterval: ReturnType<typeof setInterval> | null = null;
  private activityInterval: ReturnType<typeof setInterval> | null = null;

  // Daily Target Configuration
  private readonly TARGET_DAILY_MIN = 0.011; // 1.1%
  private readonly TARGET_DAILY_MAX = 0.014; // 1.4%
  private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
  private startTime: number = Date.now();
  private recentPnL: number[] = [];
  private readonly MAX_RECENT_TRADES = 18;
  private readonly MIN_LOSS_RATIO = 0.35;
  private lastDayIndex: number = 0;

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
   * Simulates constant payouts from Pool to Wallet
   * Keeps Wallet balance smaller than Pool but growing
   */
  private startPayoutCycle() {
    const runPayout = () => {
      if (!this.isRunning) return;

      // Small payouts to keep movement constant but not drain pool
      const amount = Math.random() * 150 + 20; 
      
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
    const actions = [
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
    ];

    const runActivity = () => {
      if (!this.isRunning) return;

      const action = actions[Math.floor(Math.random() * actions.length)];
      const tickers = useMarketStore.getState().tickers;
      
      // Occasionally add a symbol specific log
      if (Math.random() > 0.7 && tickers.size > 0) {
        const symbols = Array.from(tickers.keys());
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const ticker = tickers.get(symbol);
        if (ticker) {
          const price = parseFloat(ticker.closePrice);
          usePortfolioStore.getState().addLog(
            `Tracking ${symbol.replace('USDT', '')} @ $${price.toFixed(2)} - Vol: ${parseFloat(ticker.volume).toFixed(0)}`, 
            'system'
          );
        }
      } else {
        usePortfolioStore.getState().addLog(action, 'system');
      }

      // Very fast interval: 100ms - 600ms
      const nextDelay = 100 + Math.random() * 500;
      this.activityInterval = setTimeout(runActivity, nextDelay);
    };

    runActivity();
  }

  /**
   * Simulates trading activity based on current market prices
   * "Ledger should be the averagely moving like a balance sheet"
   * Enforces 1.1% - 1.4% daily profit target
   */
  private startTradeCycle() {
    this.tradeInterval = setInterval(() => {
      const tickers = useMarketStore.getState().tickers;
      if (tickers.size === 0) return;

      const currentDayIndex = this.getCurrentDayIndex();
      if (currentDayIndex !== this.lastDayIndex) {
        this.recentPnL = [];
        this.lastDayIndex = currentDayIndex;
      }

      // Pick a random symbol
      const symbols = Array.from(tickers.keys());
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const ticker = tickers.get(symbol);
      
      if (!ticker) return;

      const price = parseFloat(ticker.closePrice);
      if (isNaN(price) || price <= 0) return;

      // --- Target Logic ---
      const { startOfDayEquity, totalEquity } = usePortfolioStore.getState();
      const currentReturn = (totalEquity - startOfDayEquity) / startOfDayEquity;
      
      // Calculate where we should be right now
      const elapsedTime = Date.now() - this.startTime;
      const dayProgress = (elapsedTime % this.MS_PER_DAY) / this.MS_PER_DAY;
      
      // Target return for this specific moment in the day
      const targetReturnNow = this.TARGET_DAILY_MIN * dayProgress;
      
      let pnl = 0;

      // If we are BEHIND schedule, we generally want to win, but not always
      if (currentReturn < targetReturnNow) {
        // 80% chance to win, 20% chance to lose (realistic volatility)
        if (Math.random() > 0.2) {
          pnl = Math.random() * 40 + 10; // Win $10 - $50
        } else {
          pnl = (Math.random() * -20) - 5; // Loss $5 - $25
        }
      } 
      // If we are AHEAD of schedule, force a correction
      else if (currentReturn > this.TARGET_DAILY_MAX * dayProgress * 1.2) {
        pnl = (Math.random() * -30) - 5; // Loss $5 - $35
      }
      // Otherwise, random outcome
      else {
        // Mixed bag: -25 to +35
        pnl = (Math.random() - 0.45) * 60; 
      }

      pnl = this.applyPnLGuards(pnl, currentReturn, dayProgress);
      const normalizedPnL = Number(pnl.toFixed(2));
      const side: 'BUY' | 'SELL' = normalizedPnL >= 0 ? 'BUY' : 'SELL';
      const quantity = (Math.random() * 500) / price; // Smaller position size

      // Execute trade (Ledger update)
      usePortfolioStore.getState().addTrade({
        symbol: symbol.replace('USDT', ''),
        side,
        price,
        quantity,
        pnl: normalizedPnL
      });

      // Log the trade execution (distinct from the fast scanning logs)
      const pnlText = normalizedPnL >= 0 ? `+${normalizedPnL.toFixed(2)}` : normalizedPnL.toFixed(2);
      const msg = `EXECUTED: ${side === 'BUY' ? 'Long' : 'Short'} ${symbol.replace('USDT', '')} | PnL: ${pnlText}`;
      usePortfolioStore.getState().addLog(msg, 'trade');
      this.recordPnL(normalizedPnL);

    }, 5000 + Math.random() * 8000); // Trade every 5-13 seconds (Slower than logs)
  }

  private applyPnLGuards(pnl: number, currentReturn: number, dayProgress: number): number {
    const lossRatio = this.getLossRatio();
    const insufficientLosses = this.recentPnL.length >= 6 && lossRatio < this.MIN_LOSS_RATIO;
    const aheadOfSchedule = currentReturn > this.TARGET_DAILY_MAX * dayProgress;
    const behindSchedule = currentReturn < this.TARGET_DAILY_MIN * dayProgress;

    if ((aheadOfSchedule || insufficientLosses) && pnl > 0) {
      return -Math.abs(Math.random() * 30 + 5);
    }

    if (behindSchedule && pnl < 0) {
      return Math.abs(Math.random() * 45 + 10);
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
   * Simulates an API endpoint response
   */
  public getPortfolioStateAPI() {
    const state = usePortfolioStore.getState();
    return {
      status: 'success',
      timestamp: Date.now(),
      data: {
        wallet_balance: state.walletBalance,
        pool_balance: state.poolBalance,
        total_equity: state.totalEquity,
        session_pnl: state.sessionPnL,
        daily_target_pct: {
          min: this.TARGET_DAILY_MIN,
          max: this.TARGET_DAILY_MAX
        },
        active_trades_count: state.trades.length,
        system_status: 'OPERATIONAL'
      }
    };
  }
}

// Expose API globally for "Open API" requirement
(window as any).getOrionStatus = () => PortfolioManager.getInstance().getPortfolioStateAPI();
(window as any).setOrionBalance = (amount: number) => {
  if (typeof amount === 'number' && !isNaN(amount)) {
    usePortfolioStore.getState().setWalletBalance(amount);
    return { status: 'success', new_balance: amount };
  }
  return { status: 'error', message: 'Invalid amount' };
};

export const portfolioManager = PortfolioManager.getInstance();
