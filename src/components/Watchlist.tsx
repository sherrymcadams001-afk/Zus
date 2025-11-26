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
      className="flex items-center justify-between border-b border-gray-800 px-3 py-2 transition-colors duration-300"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-white">{symbol}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm text-white">${price}</span>
        <span
          className={`font-mono text-xs ${isPositive ? 'text-[#00C087]' : 'text-[#F6465D]'}`}
        >
          {isPositive ? '+' : ''}
          {change}%
        </span>
      </div>
    </div>
  );
});

/**
 * Watchlist component - displays 20 trading pairs with flash animations
 */
export function Watchlist() {
  const tickers = useMarketStore((state) => state.tickers);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-800 bg-[#0B0E11]">
      <div className="border-b border-gray-800 bg-[#161A1E] px-3 py-2">
        <h2 className="text-sm font-semibold text-white">Watchlist</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {WATCHLIST_PAIRS.map((symbol) => (
          <WatchlistRow key={symbol} symbol={symbol} ticker={tickers.get(symbol)} />
        ))}
      </div>
    </div>
  );
}
