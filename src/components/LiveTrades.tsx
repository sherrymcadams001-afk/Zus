import { useEffect, useState } from 'react';

interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl: number;
  timestamp: Date;
}

// Generate random trade
function generateTrade(id: number): Trade {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE'];
  const prices: Record<string, number> = {
    BTC: 97450,
    ETH: 3420,
    SOL: 185,
    BNB: 618,
    XRP: 2.52,
    ADA: 0.85,
    DOGE: 0.42,
  };

  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const basePrice = prices[symbol];
  const priceVariation = basePrice * (Math.random() * 0.002 - 0.001);
  const price = basePrice + priceVariation;
  const quantity = Math.random() * (symbol === 'BTC' ? 0.5 : symbol === 'ETH' ? 5 : 100);
  const pnl = (Math.random() - 0.4) * 500; // Slight positive bias

  return {
    id,
    symbol,
    side,
    price,
    quantity,
    pnl,
    timestamp: new Date(),
  };
}

/**
 * LiveTrades - Real-time trade feed with slide-down animation
 */
export function LiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Initial trades
    const initialTrades = Array.from({ length: 8 }, (_, i) => ({
      ...generateTrade(i),
      timestamp: new Date(Date.now() - (8 - i) * 2000),
    }));
    setTrades(initialTrades);

    let tradeId = 8;
    const interval = setInterval(() => {
      const newTrade = generateTrade(tradeId++);
      setTrades(prev => [newTrade, ...prev].slice(0, 15));
    }, 800 + Math.random() * 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-white/5 bg-orion-panel">
      {/* Header */}
      <div className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orion-neon-cyan animate-pulse" />
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Live Trades
          </h3>
        </div>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-y-auto">
        {trades.map((trade, idx) => (
          <div
            key={trade.id}
            className={`grid grid-cols-4 gap-1 border-b border-white/5 px-2 py-1.5 text-[10px] transition-all duration-300 ${
              idx === 0 ? 'animate-slide-down bg-white/5' : ''
            }`}
          >
            {/* Symbol & Side */}
            <div className="flex items-center gap-1">
              <span className="font-medium text-white">{trade.symbol}</span>
              <span
                className={`text-[8px] font-medium ${
                  trade.side === 'BUY' ? 'text-orion-neon-green' : 'text-orion-neon-red'
                }`}
              >
                {trade.side}
              </span>
            </div>

            {/* Price */}
            <div className="text-right tabular-nums text-slate-400">
              {trade.price < 10
                ? trade.price.toFixed(4)
                : trade.price < 1000
                  ? trade.price.toFixed(2)
                  : trade.price.toFixed(0)}
            </div>

            {/* Quantity */}
            <div className="text-right tabular-nums text-slate-500">
              {trade.quantity.toFixed(trade.symbol === 'BTC' ? 4 : 2)}
            </div>

            {/* P&L */}
            <div
              className={`text-right tabular-nums font-medium ${
                trade.pnl >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'
              }`}
            >
              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
