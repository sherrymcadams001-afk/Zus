import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Zap, Clock } from 'lucide-react';

interface ActivePosition {
  id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  current: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  openTime: Date;
}

interface SettledTrade {
  id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  exit: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  closedAt: Date;
}

// Mock data generators
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const PRICES: Record<string, number> = {
  BTC: 97450, ETH: 3420, SOL: 185, BNB: 618,
  XRP: 2.52, ADA: 0.85, DOGE: 0.42, AVAX: 42,
};

function generateActivePosition(id: number): ActivePosition {
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const basePrice = PRICES[symbol];
  const entry = basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const current = basePrice * (1 + (Math.random() - 0.5) * 0.01);
  const size = symbol === 'BTC' ? 0.1 + Math.random() * 0.5 : 
               symbol === 'ETH' ? 1 + Math.random() * 5 : 
               10 + Math.random() * 100;
  
  const priceDiff = side === 'LONG' ? current - entry : entry - current;
  const pnl = priceDiff * size;
  const pnlPercent = (priceDiff / entry) * 100;
  
  return {
    id,
    symbol,
    side,
    entry,
    current,
    size,
    pnl,
    pnlPercent,
    openTime: new Date(Date.now() - Math.random() * 3600000),
  };
}

function generateSettledTrade(id: number, fromPosition?: ActivePosition): SettledTrade {
  if (fromPosition) {
    const exitVariation = fromPosition.current * (1 + (Math.random() - 0.5) * 0.005);
    const priceDiff = fromPosition.side === 'LONG' 
      ? exitVariation - fromPosition.entry 
      : fromPosition.entry - exitVariation;
    const pnl = priceDiff * fromPosition.size;
    const pnlPercent = (priceDiff / fromPosition.entry) * 100;
    
    return {
      id,
      symbol: fromPosition.symbol,
      side: fromPosition.side,
      entry: fromPosition.entry,
      exit: exitVariation,
      size: fromPosition.size,
      pnl,
      pnlPercent,
      closedAt: new Date(),
    };
  }
  
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
  const basePrice = PRICES[symbol];
  const entry = basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const exit = basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const size = symbol === 'BTC' ? 0.1 + Math.random() * 0.5 : 
               symbol === 'ETH' ? 1 + Math.random() * 5 : 
               10 + Math.random() * 100;
  
  const priceDiff = side === 'LONG' ? exit - entry : entry - exit;
  const pnl = priceDiff * size;
  const pnlPercent = (priceDiff / entry) * 100;
  
  return {
    id,
    symbol,
    side,
    entry,
    exit,
    size,
    pnl,
    pnlPercent,
    closedAt: new Date(Date.now() - Math.random() * 3600000),
  };
}

function formatPrice(price: number): string {
  if (price < 10) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * PositionCard - Individual active position with pulsing border
 */
function PositionCard({ position, isNew }: { position: ActivePosition; isNew?: boolean }) {
  const [currentPrice, setCurrentPrice] = useState(position.current);
  const [pnl, setPnl] = useState(position.pnl);
  const [pnlPercent, setPnlPercent] = useState(position.pnlPercent);
  
  // Simulate live price updates
  useEffect(() => {
    const interval = setInterval(() => {
      const variation = position.current * (Math.random() - 0.5) * 0.001;
      const newPrice = position.current + variation;
      setCurrentPrice(newPrice);
      
      const priceDiff = position.side === 'LONG' 
        ? newPrice - position.entry 
        : position.entry - newPrice;
      setPnl(priceDiff * position.size);
      setPnlPercent((priceDiff / position.entry) * 100);
    }, 500);
    
    return () => clearInterval(interval);
  }, [position]);
  
  const isProfit = pnl >= 0;
  const borderColor = isProfit ? 'border-orion-neon-green/50' : 'border-orion-neon-red/50';
  const glowColor = isProfit ? 'shadow-orion-neon-green/20' : 'shadow-orion-neon-red/20';
  
  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`relative rounded-lg border ${borderColor} bg-orion-panel p-2 shadow-lg ${glowColor}`}
    >
      {/* Pulsing border effect */}
      <motion.div
        className={`absolute inset-0 rounded-lg border ${borderColor}`}
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">{position.symbol}</span>
            <span className={`text-[9px] font-semibold px-1 rounded ${
              position.side === 'LONG' 
                ? 'bg-orion-neon-green/20 text-orion-neon-green' 
                : 'bg-orion-neon-red/20 text-orion-neon-red'
            }`}>
              {position.side}
            </span>
          </div>
          {position.side === 'LONG' ? (
            <TrendingUp className="h-3 w-3 text-orion-neon-green" />
          ) : (
            <TrendingDown className="h-3 w-3 text-orion-neon-red" />
          )}
        </div>
        
        {/* Price Info */}
        <div className="grid grid-cols-2 gap-x-2 text-[9px]">
          <div>
            <span className="text-slate-500">Entry</span>
            <span className="ml-1 tabular-nums text-slate-300">{formatPrice(position.entry)}</span>
          </div>
          <div>
            <span className="text-slate-500">Now</span>
            <motion.span 
              className="ml-1 tabular-nums text-white"
              key={currentPrice}
              initial={{ color: isProfit ? '#00FF94' : '#FF0055' }}
              animate={{ color: '#ffffff' }}
              transition={{ duration: 0.3 }}
            >
              {formatPrice(currentPrice)}
            </motion.span>
          </div>
        </div>
        
        {/* P&L */}
        <div className={`mt-1.5 text-right text-xs font-bold tabular-nums ${
          isProfit ? 'text-orion-neon-green' : 'text-orion-neon-red'
        }`}>
          <motion.span
            key={pnl}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
          >
            {isProfit ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ExecutionDeck - Operations monitor with active positions and settled trades
 */
export function ExecutionDeck() {
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);
  const [settledTrades, setSettledTrades] = useState<SettledTrade[]>([]);
  const [newPositionId, setNewPositionId] = useState<number | null>(null);
  const positionIdRef = useRef(0);
  const tradeIdRef = useRef(0);
  
  // Initialize with some data
  useEffect(() => {
    // Start with 2 active positions
    const initialPositions = [
      generateActivePosition(positionIdRef.current++),
      generateActivePosition(positionIdRef.current++),
    ];
    setActivePositions(initialPositions);
    
    // Start with some settled trades
    const initialTrades = Array.from({ length: 6 }, () => 
      generateSettledTrade(tradeIdRef.current++)
    ).sort((a, b) => b.closedAt.getTime() - a.closedAt.getTime());
    setSettledTrades(initialTrades);
  }, []);
  
  // Simulation: Every 10 seconds, close one position and open a new one
  const cyclePosition = useCallback(() => {
    setActivePositions(prev => {
      if (prev.length === 0) return prev;
      
      // Close random position
      const closeIndex = Math.floor(Math.random() * prev.length);
      const closedPosition = prev[closeIndex];
      
      // Add to settled trades
      const settledTrade = generateSettledTrade(tradeIdRef.current++, closedPosition);
      setSettledTrades(trades => [settledTrade, ...trades].slice(0, 15));
      
      // Remove from active
      const remaining = prev.filter((_, i) => i !== closeIndex);
      
      // Add new position
      const newPosition = generateActivePosition(positionIdRef.current++);
      setNewPositionId(newPosition.id);
      setTimeout(() => setNewPositionId(null), 500);
      
      return [...remaining, newPosition];
    });
  }, []);
  
  useEffect(() => {
    const interval = setInterval(cyclePosition, 10000);
    return () => clearInterval(interval);
  }, [cyclePosition]);
  
  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-white/5 bg-orion-panel">
      {/* Header */}
      <div className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-orion-neon-cyan animate-pulse" />
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Operations Monitor
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-slate-500">
            <Activity className="h-3 w-3" />
            <span>{activePositions.length} Active</span>
          </div>
        </div>
      </div>
      
      {/* Section A: Active Positions */}
      <div className="border-b border-white/5 p-2">
        <div className="mb-1.5 flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-orion-neon-green animate-pulse" />
          <span className="text-[9px] uppercase text-slate-500">Active Positions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence mode="popLayout">
            {activePositions.map(position => (
              <PositionCard 
                key={position.id} 
                position={position}
                isNew={position.id === newPositionId}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Section B: Settled Trades */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-[9px] uppercase text-slate-500">Settled</span>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {settledTrades.map((trade, idx) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`grid grid-cols-5 gap-1 border-b border-white/5 px-2 py-1 text-[9px] ${
                  idx === 0 ? 'bg-white/5' : ''
                }`}
              >
                {/* Symbol & Side */}
                <div className="flex items-center gap-1">
                  <span className="font-medium text-white">{trade.symbol}</span>
                  <span className={`text-[8px] ${
                    trade.side === 'LONG' ? 'text-orion-neon-green' : 'text-orion-neon-red'
                  }`}>
                    {trade.side === 'LONG' ? '↑' : '↓'}
                  </span>
                </div>
                
                {/* Entry */}
                <div className="text-right tabular-nums text-slate-500">
                  {formatPrice(trade.entry)}
                </div>
                
                {/* Exit */}
                <div className="text-right tabular-nums text-slate-400">
                  {formatPrice(trade.exit)}
                </div>
                
                {/* P&L */}
                <div className={`text-right tabular-nums font-medium ${
                  trade.pnl >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'
                }`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                </div>
                
                {/* Time */}
                <div className="text-right tabular-nums text-slate-600">
                  {formatTime(trade.closedAt)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
