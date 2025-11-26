import { memo, useEffect, useRef, useState } from 'react';

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

/**
 * Memoized order book row with gradient depth visualization
 */
const OrderBookRow = memo(function OrderBookRow({ level, side, maxTotal }: OrderBookRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Flash on price update
  useEffect(() => {
    if (!rowRef.current) return;

    const prevPrice = prevPriceRef.current;
    if (prevPrice !== null && prevPrice !== level.price) {
      const flashClass = level.price > prevPrice ? 'cell-flash-green' : 'cell-flash-red';
      rowRef.current.classList.add(flashClass);

      const timeout = setTimeout(() => {
        rowRef.current?.classList.remove(flashClass);
      }, 300);

      return () => clearTimeout(timeout);
    }

    prevPriceRef.current = level.price;
  }, [level.price]);

  const depthPercent = (level.total / maxTotal) * 100;
  const isBid = side === 'bid';

  return (
    <div
      ref={rowRef}
      className="relative grid grid-cols-3 gap-0.5 px-1.5 py-px text-[9px] tabular-nums transition-colors"
    >
      {/* Depth gradient background */}
      <div
        className={`absolute inset-0 ${isBid ? 'depth-bar-bid' : 'depth-bar-ask'}`}
        style={{ width: `${depthPercent}%`, [isBid ? 'right' : 'left']: 0 }}
      />
      
      {/* Content */}
      <span className={`relative z-10 ${isBid ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}>
        {level.price.toFixed(2)}
      </span>
      <span className="relative z-10 text-right text-slate-300">
        {level.quantity.toFixed(4)}
      </span>
      <span className="relative z-10 text-right text-slate-500">
        {level.total.toFixed(4)}
      </span>
    </div>
  );
});

/**
 * Generate simulated order book with client-side jitter
 */
function generateOrderBook(basePrice: number): { bids: OrderLevel[]; asks: OrderLevel[] } {
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];
  
  let bidTotal = 0;
  let askTotal = 0;
  
  for (let i = 0; i < 12; i++) {
    // Bid side (below market price)
    const bidPrice = basePrice - (i + 1) * (basePrice * 0.0001) - Math.random() * 0.5;
    const bidQty = Math.random() * 2 + 0.1;
    bidTotal += bidQty;
    bids.push({ price: bidPrice, quantity: bidQty, total: bidTotal });
    
    // Ask side (above market price)
    const askPrice = basePrice + (i + 1) * (basePrice * 0.0001) + Math.random() * 0.5;
    const askQty = Math.random() * 2 + 0.1;
    askTotal += askQty;
    asks.push({ price: askPrice, quantity: askQty, total: askTotal });
  }
  
  return { bids, asks };
}

// Generate a stable base price outside of render
const INITIAL_BASE_PRICE = 97500;

/**
 * OrderBook component with spatial syntax and gradient depth visualization
 */
export function OrderBook() {
  const [orderBook, setOrderBook] = useState<{ bids: OrderLevel[]; asks: OrderLevel[] }>({ 
    bids: [], 
    asks: [] 
  });
  const [currentPrice, setCurrentPrice] = useState(INITIAL_BASE_PRICE);

  // Client-side jitter simulation
  useEffect(() => {
    // Initialize with random offset
    const basePrice = INITIAL_BASE_PRICE + (Math.random() - 0.5) * 100;
    
    const updateOrderBook = () => {
      const jitteredPrice = basePrice + (Math.random() - 0.5) * 20;
      setCurrentPrice(jitteredPrice);
      setOrderBook(generateOrderBook(jitteredPrice));
    };

    updateOrderBook();
    const interval = setInterval(updateOrderBook, 100); // 10Hz update rate

    return () => clearInterval(interval);
  }, []);

  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
  const maxAskTotal = orderBook.asks[orderBook.asks.length - 1]?.total || 1;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-white/5 bg-orion-panel">
      {/* Header */}
      <div className="border-b border-white/5 px-1.5 py-0.5">
        <h3 className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
          Order Book
        </h3>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-0.5 border-b border-white/5 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-slate-600">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Ask Side (Sells) - Reversed */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-1/2 flex-col-reverse overflow-hidden">
          {orderBook.asks.slice().reverse().map((level, idx) => (
            <OrderBookRow
              key={`ask-${idx}`}
              level={level}
              side="ask"
              maxTotal={maxAskTotal}
            />
          ))}
        </div>

        {/* Spread Indicator */}
        <div className="border-y border-white/10 bg-orion-bg px-1.5 py-0.5">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-orion-neon-cyan font-medium">
              {currentPrice.toFixed(2)}
            </span>
            <span className="text-slate-600">
              Spread: {((orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0)).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bid Side (Buys) */}
        <div className="flex h-1/2 flex-col overflow-hidden">
          {orderBook.bids.map((level, idx) => (
            <OrderBookRow
              key={`bid-${idx}`}
              level={level}
              side="bid"
              maxTotal={maxBidTotal}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
