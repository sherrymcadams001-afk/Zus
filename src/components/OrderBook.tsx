import { memo, useEffect, useState } from 'react';
import { BookOpen, MoreHorizontal } from 'lucide-react';
import { useMarketStore } from '../store/useMarketStore';

interface OrderLevel {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookRowProps {
  level: OrderLevel;
  side: 'bid' | 'ask';
  maxTotal: number;
}

const OrderBookRow = memo(function OrderBookRow({ level, side, maxTotal }: OrderBookRowProps) {
  const depthPercent = (level.total / maxTotal) * 100;
  const isBid = side === 'bid';

  return (
    <div className="relative grid grid-cols-3 gap-1 px-2 py-0.5 text-[10px] tabular-nums font-mono cursor-pointer hover:bg-white/5">
      <div
        className={`absolute inset-y-0 right-0 opacity-10 ${isBid ? 'bg-orion-neon-green' : 'bg-orion-neon-red'}`}
        style={{ width: `${depthPercent}%` }}
      />
      <span className={`relative z-10 ${isBid ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}>
        {level.price.toFixed(2)}
      </span>
      <span className="relative z-10 text-right text-slate-300">{level.quantity.toFixed(4)}</span>
      <span className="relative z-10 text-right text-slate-500">{level.total.toFixed(2)}</span>
    </div>
  );
});

function generateOrderBook(basePrice: number): { bids: OrderLevel[]; asks: OrderLevel[] } {
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < 15; i++) {
    const bidPrice = basePrice - (i + 1) * (basePrice * 0.0005) - Math.random() * (basePrice * 0.0002);
    const bidQty = Math.random() * 2 + 0.1;
    bidTotal += bidQty;
    bids.push({ price: bidPrice, quantity: bidQty, total: bidTotal });

    const askPrice = basePrice + (i + 1) * (basePrice * 0.0005) + Math.random() * (basePrice * 0.0002);
    const askQty = Math.random() * 2 + 0.1;
    askTotal += askQty;
    asks.push({ price: askPrice, quantity: askQty, total: askTotal });
  }
  return { bids, asks };
}

export function OrderBook() {
  const [orderBook, setOrderBook] = useState<{ bids: OrderLevel[]; asks: OrderLevel[] }>({ bids: [], asks: [] });
  const { activeSymbol, tickers } = useMarketStore();
  
  // Get current price from ticker or default
  const ticker = tickers.get(activeSymbol);
  const currentPrice = ticker ? parseFloat(ticker.closePrice) : 0;

  useEffect(() => {
    if (!currentPrice) return;

    const updateOrderBook = () => {
      // Add slight jitter to make it look alive even if price is static
      const jitteredPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.0002);
      setOrderBook(generateOrderBook(jitteredPrice));
    };

    updateOrderBook();
    const interval = setInterval(updateOrderBook, 500); // Update every 500ms
    return () => clearInterval(interval);
  }, [currentPrice, activeSymbol]);

  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
  const maxAskTotal = orderBook.asks[orderBook.asks.length - 1]?.total || 1;

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center justify-between border-b border-white/5 px-3 bg-[#0B0E11]">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-orion-neon-cyan" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Order Book</span>
        </div>
        <MoreHorizontal className="h-3 w-3 text-slate-500" />
      </div>

      <div className="grid grid-cols-3 gap-1 px-2 py-1.5 text-[9px] font-semibold uppercase text-slate-500 bg-[#0B0E11]/50 border-b border-white/5">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Asks */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden pb-1">
          {orderBook.asks.slice(0, 12).reverse().map((level, idx) => (
            <OrderBookRow key={`ask-${idx}`} level={level} side="ask" maxTotal={maxAskTotal} />
          ))}
        </div>

        {/* Spread */}
        <div className="h-6 flex-shrink-0 flex items-center justify-between border-y border-white/10 bg-[#0B0E11] px-2 text-[10px]">
          <span className={`font-bold text-lg ${
            ticker && parseFloat(ticker.closePrice) >= parseFloat(ticker.openPrice) 
              ? 'text-orion-neon-green' 
              : 'text-orion-neon-red'
          }`}>
            {currentPrice > 0 ? currentPrice.toFixed(2) : '---'}
          </span>
          <span className="text-slate-500 text-[9px]">Spread: {((orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0)).toFixed(2)}</span>
        </div>

        {/* Bids */}
        <div className="flex-1 flex flex-col overflow-hidden pt-1">
          {orderBook.bids.slice(0, 12).map((level, idx) => (
            <OrderBookRow key={`bid-${idx}`} level={level} side="bid" maxTotal={maxBidTotal} />
          ))}
        </div>
      </div>
    </div>
  );
}
