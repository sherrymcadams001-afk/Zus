import { Database, TrendingDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '../store/usePortfolioStore';

export function LiveTrades() {
  const trades = usePortfolioStore((state) => state.trades);

  return (
    <div className="h-full flex flex-col rounded-lg border border-white/5 bg-[#0F1419] overflow-hidden hover:border-[#00FF9D]/10 transition-colors">
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-white/5 px-3">
        <Database className="h-3.5 w-3.5 text-[#00FF9D]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">Trade History</span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 px-2 py-1.5 text-[8px] font-semibold uppercase text-slate-500 bg-white/[0.02] border-b border-white/5">
        <span>Asset</span>
        <span className="text-right hidden sm:block">Exec</span>
        <span className="text-right">Qty</span>
        <span className="text-right">P&L</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence initial={false}>
          {trades.map((trade, idx) => {
            const isNewest = idx === 0;
            const isSell = trade.side === 'SELL';
            const isBuy = trade.side === 'BUY';
            // Flash red for SELL, green for BUY on newest trade
            const showRedFlash = isNewest && isSell;
            const showGreenFlash = isNewest && isBuy;

            // Determine background color animation based on trade side
            const getBackgroundAnimation = () => {
              if (showRedFlash) {
                return ['rgba(239, 68, 68, 0.15)', 'rgba(255, 255, 255, 0.05)'];
              }
              if (showGreenFlash) {
                return ['rgba(16, 185, 129, 0.15)', 'rgba(255, 255, 255, 0.05)'];
              }
              if (isNewest) {
                return 'rgba(255, 255, 255, 0.05)';
              }
              return 'transparent';
            };

            // Determine box shadow animation based on trade side
            const getBoxShadowAnimation = () => {
              if (showRedFlash) {
                return ['0 0 15px rgba(239, 68, 68, 0.2)', '0 0 0px rgba(239, 68, 68, 0)'];
              }
              if (showGreenFlash) {
                return ['0 0 15px rgba(16, 185, 129, 0.2)', '0 0 0px rgba(16, 185, 129, 0)'];
              }
              return '0 0 0px rgba(0, 0, 0, 0)';
            };

            const hasFlashEffect = showRedFlash || showGreenFlash;

            return (
              <motion.div
                key={trade.id}
                initial={isNewest ? { opacity: 0, y: -10 } : false}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  backgroundColor: getBackgroundAnimation(),
                  boxShadow: getBoxShadowAnimation()
                }}
                transition={{ 
                  duration: hasFlashEffect ? 0.8 : 0.3,
                  backgroundColor: { duration: hasFlashEffect ? 1.2 : 0 },
                  boxShadow: { duration: hasFlashEffect ? 1.2 : 0 }
                }}
                className="grid grid-cols-3 sm:grid-cols-4 gap-1 px-2 py-1 text-[9px] border-b border-white/5 items-center hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-bold text-slate-300 truncate">{trade.symbol}</span>
                  <span className={`text-[7px] px-1 rounded font-bold flex-shrink-0 ${trade.side === 'BUY' ? 'bg-[#00FF9D]/15 text-[#00FF9D]' : 'bg-slate-500/15 text-slate-400'}`}>
                    {trade.side}
                  </span>
                </div>
                <div className="text-right tabular-nums text-slate-500 font-mono hidden sm:block">
                  {trade.price < 10 ? trade.price.toFixed(4) : trade.price < 1000 ? trade.price.toFixed(2) : trade.price.toFixed(0)}
                </div>
                <div className="text-right tabular-nums text-slate-500 font-mono">
                  {trade.quantity.toFixed(trade.symbol === 'BTC' ? 4 : 2)}
                </div>
                <div className={`flex items-center justify-end gap-0.5 tabular-nums font-bold font-mono ${trade.pnl >= 0 ? 'text-[#00FF9D]' : 'text-slate-400'}`}>
                  {isSell && (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {isBuy && (
                    <TrendingUp className="h-2.5 w-2.5" />
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
