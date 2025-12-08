import { useEffect, useState } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { useSellFlashEffect } from '../hooks/useSellFlashEffect';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerItem {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  isSimulated: boolean;
}

// Real crypto symbols to track from Binance
const REAL_CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'PAXGUSDT'];

// Display names for real crypto
const CRYPTO_DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  PAXGUSDT: 'GOLD',
};

// Simulated index base prices
const SIMULATED_INDICES = {
  SPX: { displayName: 'S&P 500', basePrice: 5920.45 },
  WTI: { displayName: 'OIL', basePrice: 68.72 },
  DXY: { displayName: 'USD', basePrice: 106.85 },
};

/**
 * MacroTicker - Compact hybrid ticker bar
 */
export function MacroTicker() {
  const tickers = useMarketStore((state) => state.tickers);
  const sellFlashActive = useSellFlashEffect();
  const [simulatedPrices, setSimulatedPrices] = useState<Record<string, { price: number; change: number }>>(() => {
    const initial: Record<string, { price: number; change: number }> = {};
    for (const [key, data] of Object.entries(SIMULATED_INDICES)) {
      initial[key] = { price: data.basePrice, change: (Math.random() - 0.5) * 0.5 };
    }
    return initial;
  });

  // Simulate price noise for indices
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedPrices((prev) => {
        const next: Record<string, { price: number; change: number }> = {};
        for (const [key, data] of Object.entries(SIMULATED_INDICES)) {
          const currentPrice = prev[key]?.price ?? data.basePrice;
          const noise = currentPrice * (Math.random() - 0.5) * 0.002;
          const newPrice = currentPrice + noise;
          const changePercent = ((newPrice - data.basePrice) / data.basePrice) * 100;
          next[key] = { price: newPrice, change: changePercent };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Build combined ticker items
  const tickerItems: TickerItem[] = [];

  for (const symbol of REAL_CRYPTO_SYMBOLS) {
    const ticker = tickers.get(symbol);
    if (ticker) {
      const price = parseFloat(ticker.closePrice);
      const openPrice = parseFloat(ticker.openPrice);
      const change = ((price - openPrice) / openPrice) * 100;
      tickerItems.push({
        symbol,
        displayName: CRYPTO_DISPLAY_NAMES[symbol] || symbol,
        price,
        change,
        isSimulated: false,
      });
    } else {
      tickerItems.push({
        symbol,
        displayName: CRYPTO_DISPLAY_NAMES[symbol] || symbol,
        price: 0,
        change: 0,
        isSimulated: false,
      });
    }
  }

  for (const [key, data] of Object.entries(SIMULATED_INDICES)) {
    const simData = simulatedPrices[key];
    tickerItems.push({
      symbol: key,
      displayName: data.displayName,
      price: simData?.price ?? data.basePrice,
      change: simData?.change ?? 0,
      isSimulated: true,
    });
  }

  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="h-full w-full bg-orion-bg-secondary border-b border-[rgba(255,255,255,0.05)] flex items-center overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-orion-bg-secondary to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-orion-bg-secondary to-transparent z-10" />
      
      <div className="flex items-center animate-marquee whitespace-nowrap">
        {duplicatedItems.map((item, idx) => (
          <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 px-4 border-r border-[rgba(255,255,255,0.05)]">
            <span className="text-[10px] font-bold text-orion-slate">{item.displayName}</span>
            <span className="text-[10px] font-mono tabular-nums text-white">
              ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`flex items-center gap-0.5 text-[9px] font-medium transition-colors duration-150 ${
              sellFlashActive ? 'text-orion-danger' : (item.change >= 0 ? 'text-orion-success' : 'text-orion-danger')
            }`}>
              {item.change >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              <span>{Math.abs(item.change).toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
