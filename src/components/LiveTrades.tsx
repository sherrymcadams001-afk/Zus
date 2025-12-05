import { Receipt, TrendingDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '../store/usePortfolioStore';

export function LiveTrades() {
  const trades = usePortfolioStore((state) => state.trades);

  return (
    <div className="h-full flex flex-col rounded border border-[rgba(255,255,255,0.08)] bg-orion-bg overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] px-3 bg-orion-bg-secondary">
        <Receipt className="h-3.5 w-3.5 text-orion-cyan" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-orion-slate">Ledger</span>
      </div>
      
      <div className="grid grid-cols-4 gap-1 px-2 py-1.5 text-[9px] font-semibold uppercase text-orion-slate-dark bg-orion-bg-secondary/50 border-b border-[rgba(255,255,255,0.08)]">
        <span>Pair</span>
        <span className="text-right">Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Cash Flow</span>
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
                className="grid grid-cols-4 gap-1 px-2 py-1 text-[10px] border-b border-[rgba(255,255,255,0.05)] items-center"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-orion-slate">{trade.symbol}</span>
                  <span className={`text-[8px] px-1 rounded-sm font-bold ${trade.side === 'BUY' ? 'bg-orion-success/10 text-orion-success' : 'bg-orion-danger/10 text-orion-danger'}`}>
                    {trade.side}
                  </span>
                </div>
                <div className="text-right tabular-nums text-orion-slate-dark font-mono">
                  {trade.price < 10 ? trade.price.toFixed(4) : trade.price < 1000 ? trade.price.toFixed(2) : trade.price.toFixed(0)}
                </div>
                <div className="text-right tabular-nums text-orion-slate-dark font-mono">
                  {trade.quantity.toFixed(trade.symbol === 'BTC' ? 4 : 2)}
                </div>
                <div className={`flex items-center justify-end gap-1 tabular-nums font-bold font-mono ${trade.pnl >= 0 ? 'text-orion-success' : 'text-orion-danger'}`}>
                  {isSell && (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {isBuy && (
                    <TrendingUp className="h-3 w-3" />
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
