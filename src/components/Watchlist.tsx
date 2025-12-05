import { memo, useEffect, useRef, useCallback } from 'react';
import { useMarketStore, type Ticker } from '../store/useMarketStore';
import { streamEngine } from '../core/StreamEngine';
import { Eye, Search } from 'lucide-react';

const WATCHLIST_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT',
  'LINKUSDT', 'LTCUSDT', 'SHIBUSDT', 'ATOMUSDT', 'UNIUSDT',
  'NEARUSDT', 'APTUSDT', 'ARBUSDT', 'OPUSDT', 'FILUSDT',
];

interface WatchlistRowProps {
  symbol: string;
  ticker: Ticker | undefined;
  isActive: boolean;
  onSelect: (symbol: string) => void;
}

function formatVolume(vol: string): string {
  const v = parseFloat(vol);
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + 'B';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
  return v.toFixed(0);
}

const WatchlistRow = memo(function WatchlistRow({ symbol, ticker, isActive, onSelect }: WatchlistRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prevPriceRef = useRef<string | null>(null);

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
        const timeout = setTimeout(() => rowRef.current?.classList.remove(flashClass), 300);
        prevPriceRef.current = currentPrice;
        return () => clearTimeout(timeout);
      }
    }
    prevPriceRef.current = currentPrice;
  }, [ticker]);

  const handleClick = useCallback(() => onSelect(symbol), [symbol, onSelect]);

  const price = ticker ? parseFloat(ticker.closePrice) : null;
  const change = ticker
    ? ((parseFloat(ticker.closePrice) - parseFloat(ticker.openPrice)) / parseFloat(ticker.openPrice)) * 100
    : null;
  const volume = ticker ? ticker.quoteVolume : null;

  return (
    <div
      ref={rowRef}
      onClick={handleClick}
      className={`grid grid-cols-[1fr_80px_60px] gap-2 px-2 py-1 text-[10px] cursor-pointer transition-all hover:bg-orion-bg-hover border-l-2 items-center ${
        isActive ? 'border-l-orion-cyan bg-orion-cyan/5' : 'border-l-transparent border-b border-[rgba(255,255,255,0.05)]'
      }`}
    >
      <div className="flex flex-col">
        <span className={`font-bold leading-none ${isActive ? 'text-orion-cyan' : 'text-orion-slate'}`}>
          {symbol.replace('USDT', '')}
        </span>
        <span className="text-[8px] text-orion-slate-dark leading-none mt-0.5">
          {volume ? `Vol ${formatVolume(volume)}` : 'Loading...'}
        </span>
      </div>
      
      <div className="text-right font-mono text-orion-slate">
        {price ? price.toFixed(price < 1 ? 4 : 2) : '---'}
      </div>
      
      <div className={`text-right font-medium ${
        change === null ? 'text-orion-slate-dark' : change >= 0 ? 'text-orion-success' : 'text-orion-danger'
      }`}>
        {change === null ? '---' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
      </div>
    </div>
  );
});

export function Watchlist() {
  const tickers = useMarketStore((state) => state.tickers);
  const activeSymbol = useMarketStore((state) => state.activeSymbol);
  const setActiveSymbol = useMarketStore((state) => state.setActiveSymbol);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setActiveSymbol(symbol);
    streamEngine.subscribeToChart(symbol);
  }, [setActiveSymbol]);

  return (
    <div className="h-full flex flex-col rounded border border-[rgba(255,255,255,0.08)] bg-orion-bg overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-3 bg-orion-bg-secondary">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-orion-cyan" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-orion-slate">Market Watch</span>
        </div>
        <Search className="h-3 w-3 text-orion-slate-dark" />
      </div>
      
      <div className="grid grid-cols-[1fr_80px_60px] gap-2 px-2 py-1.5 text-[9px] font-semibold uppercase text-orion-slate-dark bg-orion-bg-secondary/50 border-b border-[rgba(255,255,255,0.08)]">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h %</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {WATCHLIST_PAIRS.map((symbol) => (
          <WatchlistRow 
            key={symbol} 
            symbol={symbol} 
            ticker={tickers.get(symbol)}
            isActive={activeSymbol === symbol}
            onSelect={handleSelectSymbol}
          />
        ))}
        {/* Fill remaining space with empty rows if needed to maintain grid look */}
        {Array.from({ length: Math.max(0, 15 - WATCHLIST_PAIRS.length) }).map((_, i) => (
           <div key={`empty-${i}`} className="h-[34px] border-b border-[rgba(255,255,255,0.05)]" />
        ))}
      </div>
    </div>
  );
}
