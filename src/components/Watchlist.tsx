import { memo, useEffect, useRef } from 'react';
import { useMarketStore, type Ticker } from '../store/useMarketStore';

// Hardcoded 20 trading pairs
const WATCHLIST_PAIRS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'LINKUSDT',
  'LTCUSDT',
  'SHIBUSDT',
  'ATOMUSDT',
  'UNIUSDT',
  'NEARUSDT',
  'APTUSDT',
  'ARBUSDT',
  'OPUSDT',
  'FILUSDT',
];

interface WatchlistRowProps {
  symbol: string;
  ticker: Ticker | undefined;
}

/**
 * Memoized row component to prevent unnecessary re-renders
 * Uses tabular-nums for perfect alignment
 */
const WatchlistRow = memo(function WatchlistRow({ symbol, ticker }: WatchlistRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prevPriceRef = useRef<string | null>(null);

  // Handle flash animation using DOM manipulation to avoid cascading renders
  useEffect(() => {
    if (!ticker || !rowRef.current) return;

    const currentPrice = ticker.closePrice;
    const prevPrice = prevPriceRef.current;

    if (prevPrice !== null && prevPrice !== currentPrice) {
      const current = parseFloat(currentPrice);
      const prev = parseFloat(prevPrice);

      if (current !== prev) {
        const flashClass = current > prev ? 'flash-green' : 'flash-red';
        rowRef.current.classList.add(flashClass);

        const timeout = setTimeout(() => {
          rowRef.current?.classList.remove(flashClass);
        }, 300);

        prevPriceRef.current = currentPrice;
        return () => clearTimeout(timeout);
      }
    }

    prevPriceRef.current = currentPrice;
  }, [ticker]);

  const price = ticker ? parseFloat(ticker.closePrice).toFixed(2) : '—';
  const change = ticker
    ? (
        ((parseFloat(ticker.closePrice) - parseFloat(ticker.openPrice)) /
          parseFloat(ticker.openPrice)) *
        100
      ).toFixed(2)
    : '0.00';
  const isPositive = ticker
    ? parseFloat(ticker.closePrice) >= parseFloat(ticker.openPrice)
    : true;

  return (
    <div
      ref={rowRef}
      className="grid grid-cols-3 gap-1 border-b border-white/5 px-2 py-1 text-[10px] transition-colors"
    >
      <span className="font-medium text-white">{symbol.replace('USDT', '')}</span>
      <span className="text-right tabular-nums text-slate-300">${price}</span>
      <span
        className={`text-right tabular-nums font-medium ${isPositive ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}
      >
        {isPositive ? '+' : ''}
        {change}%
      </span>
    </div>
  );
});

/**
 * Watchlist component - High-density display with 4px spatial syntax
 */
export function Watchlist() {
  const tickers = useMarketStore((state) => state.tickers);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-white/5 bg-orion-panel shadow-glow-cyan">
      {/* Header */}
      <div className="border-b border-white/5 px-2 py-1.5">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Watchlist
        </h2>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-1 border-b border-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-600">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h</span>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {WATCHLIST_PAIRS.map((symbol) => (
          <WatchlistRow key={symbol} symbol={symbol} ticker={tickers.get(symbol)} />
        ))}
      </div>
    </div>
  );
}
