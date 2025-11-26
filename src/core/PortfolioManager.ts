import { usePortfolioStore } from '../store/usePortfolioStore';
import { useMarketStore } from '../store/useMarketStore';

/**
 * PortfolioManager
 * 
 * Handles the "business logic" of the autonomous trading system.
 * - Generates consistent payouts (Treasury Reactor)
 * - Executes simulated trades based on market movements
 * - Ensures mathematical consistency across the dashboard
 */
class PortfolioManager {
  private static instance: PortfolioManager | null = null;
  private isRunning = false;
  private payoutInterval: ReturnType<typeof setInterval> | null = null;
  private tradeInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {}

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

    // Start the "Bot Execution" cycle
    this.startTradeCycle();
  }

  public stop() {
    this.isRunning = false;
    if (this.payoutInterval) clearTimeout(this.payoutInterval);
    if (this.tradeInterval) clearInterval(this.tradeInterval);
  }

  /**
   * Simulates constant payouts from Pool to Wallet
   * "The pool panel should display constant payouts"
   */
  private startPayoutCycle() {
    // High frequency payouts (every 0.8 - 2.5 seconds) to show constant movement
    const runPayout = () => {
      if (!this.isRunning) return;

      const amount = Math.random() * 250 + 50; // $50 - $300 payouts
      
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
   * Simulates trading activity based on current market prices
   */
  private startTradeCycle() {
    this.tradeInterval = setInterval(() => {
      const tickers = useMarketStore.getState().tickers;
      if (tickers.size === 0) {
        // console.warn('PortfolioManager: Waiting for market data...');
        return;
      }

      // Pick a random symbol
      const symbols = Array.from(tickers.keys());
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const ticker = tickers.get(symbol);
      
      if (!ticker) return;

      const price = parseFloat(ticker.closePrice);
      
      // Skip if price is invalid
      if (isNaN(price) || price <= 0) return;

      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const quantity = (Math.random() * 1000) / price; // ~$1000 position size
      const pnl = (Math.random() - 0.45) * 50; // Slight positive bias

      // Execute trade
      usePortfolioStore.getState().addTrade({
        symbol: symbol.replace('USDT', ''),
        side,
        price,
        quantity,
        pnl
      });

      // Add log
      const pnlText = pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);
      const msg = `${side === 'BUY' ? 'Long' : 'Short'} ${symbol.replace('USDT', '')} @ $${price.toFixed(2)} PnL: ${pnlText}`;
      usePortfolioStore.getState().addLog(msg, 'trade');

    }, 3000 + Math.random() * 5000); // Trade every 3-8 seconds
  }
}

export const portfolioManager = PortfolioManager.getInstance();
