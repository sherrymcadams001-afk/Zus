import { Cpu, Zap } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { motion } from 'framer-motion';

function highlightMessage(message: string): React.ReactNode {
  const keywords = ['Long', 'Short', 'Exit', 'Signal', 'System', 'Risk', 'BTC', 'ETH', 'SOL', 'BNB', 'EXECUTING', 'CONFIRMED', 'FILLED'];
  const parts = message.split(/(\s+)/);
  return parts.map((part, idx) => {
    const isPositive = part.includes('+');
    const isNegative = part.includes('-') && part.match(/-\d/);
    const isKeyword = keywords.some(kw => part.toUpperCase().includes(kw.toUpperCase()));
    if (isPositive) return <span key={idx} className="text-emerald-400">{part}</span>;
    if (isNegative) return <span key={idx} className="text-slate-400">{part}</span>;
    if (isKeyword) return <span key={idx} className="text-cyan-400">{part}</span>;
    return <span key={idx}>{part}</span>;
  });
}

export function BotActivityLog() {
  const logs = usePortfolioStore((state) => state.logs);

  return (
    <div className="h-full flex flex-col rounded-lg border border-white/5 bg-[#0F1419] overflow-hidden hover:border-[#00FF9D]/10 transition-colors">
      {/* Terminal Header */}
      <div className="h-9 flex-shrink-0 flex items-center justify-between border-b border-white/5 px-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Cpu className="h-4 w-4 text-[#00FF9D]" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#00FF9D] rounded-full animate-pulse" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">Agent Logs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-[#00FF9D] animate-pulse" />
          <span className="text-[9px] font-mono text-[#00FF9D]">ACTIVE</span>
        </div>
      </div>
      
      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-2 font-mono bg-[#0B1015]">
        {logs.map((log, idx) => (
          <motion.div 
            key={log.id} 
            initial={idx === 0 ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={`px-2 py-1 text-[10px] leading-relaxed rounded ${
              idx === 0 
                ? 'bg-[#00FF9D]/5 border-l-2 border-[#00FF9D] shadow-[0_0_10px_rgba(0,255,157,0.1)]' 
                : 'border-l-2 border-transparent hover:bg-white/5'
            }`}
          >
            <span className="tabular-nums text-slate-500 mr-2">
              [{new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span className="text-cyan-300">{highlightMessage(log.message)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
