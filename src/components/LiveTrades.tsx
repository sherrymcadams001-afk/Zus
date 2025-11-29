import { Receipt, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '../store/usePortfolioStore';

export function LiveTrades() {
  const trades = usePortfolioStore((state) => state.trades);

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-white/5 px-3 bg-[#0B0E11]">
        <Receipt className="h-3.5 w-3.5 text-orion-neon-cyan" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Ledger</span>
      </div>
      
      <div className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[9px] font-semibold uppercase text-slate-500 bg-[#0B0E11]/50 border-b border-white/5">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Cash Flow</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {trades.map((trade, idx) => {
            const isNewest = idx === 0;
            const isNegativePnL = trade.pnl < 0;
            const showFlashEffect = isNewest && isNegativePnL;

            return (
              <motion.div
                key={trade.id}
                initial={isNewest ? { opacity: 0, y: -10 } : false}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  backgroundColor: showFlashEffect 
                    ? ['rgba(255, 0, 85, 0.15)', 'rgba(255, 255, 255, 0.05)']
                    : isNewest 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'transparent'
                }}
                transition={{ 
                  duration: showFlashEffect ? 0.8 : 0.3,
                  backgroundColor: { duration: showFlashEffect ? 1.2 : 0 }
                }}
                className={`grid grid-cols-4 gap-1 px-2 py-1 text-[10px] border-b border-white/5 items-center ${showFlashEffect ? 'shadow-glow-red' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200">{trade.symbol}</span>
                  <span className={`text-[8px] px-1 rounded-sm font-bold ${trade.side === 'BUY' ? 'bg-orion-neon-green/10 text-orion-neon-green' : 'bg-orion-neon-red/10 text-orion-neon-red'}`}>
                    {trade.side}
                  </span>
                </div>
                <div className="text-right tabular-nums text-slate-400 font-mono">
                  {trade.price < 10 ? trade.price.toFixed(4) : trade.price < 1000 ? trade.price.toFixed(2) : trade.price.toFixed(0)}
                </div>
                <div className="text-right tabular-nums text-slate-500 font-mono">
                  {trade.quantity.toFixed(trade.symbol === 'BTC' ? 4 : 2)}
                </div>
                <div className={`flex items-center justify-end gap-1 tabular-nums font-bold font-mono ${trade.pnl >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}>
                  {isNegativePnL && (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
