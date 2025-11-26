import { Receipt } from 'lucide-react';
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
        <span className="text-right">P&L</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {trades.map((trade, idx) => (
          <div key={trade.id} className={`grid grid-cols-4 gap-1 px-2 py-1 text-[10px] border-b border-white/5 items-center ${idx === 0 ? 'bg-white/5' : ''}`}>
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
            <div className={`text-right tabular-nums font-bold font-mono ${trade.pnl >= 0 ? 'text-orion-neon-green' : 'text-orion-neon-red'}`}>
              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
