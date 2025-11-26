import { Terminal } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';

function highlightMessage(message: string): React.ReactNode {
  const keywords = ['Long', 'Short', 'Exit', 'Signal', 'System', 'Risk', 'BTC', 'ETH', 'SOL', 'BNB'];
  const parts = message.split(/(\s+)/);
  return parts.map((part, idx) => {
    const isPositive = part.includes('+');
    const isNegative = part.includes('-') && part.match(/-\d/);
    const isKeyword = keywords.some(kw => part.includes(kw));
    if (isPositive) return <span key={idx} className="text-orion-neon-green">{part}</span>;
    if (isNegative) return <span key={idx} className="text-orion-neon-red">{part}</span>;
    if (isKeyword) return <span key={idx} className="text-orion-neon-cyan">{part}</span>;
    return <span key={idx}>{part}</span>;
  });
}

export function BotActivityLog() {
  const logs = usePortfolioStore((state) => state.logs);

  return (
    <div className="h-full flex flex-col rounded border border-white/5 bg-orion-panel overflow-hidden">
      <div className="h-8 flex-shrink-0 flex items-center gap-2 border-b border-white/5 px-3 bg-[#0B0E11]">
        <Terminal className="h-3.5 w-3.5 text-orion-neon-green" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">System Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 font-mono">
        {logs.map((log, idx) => (
          <div key={log.id} className={`px-2 py-0.5 text-[10px] leading-relaxed ${idx === 0 ? 'bg-white/5 border-l-2 border-orion-neon-green' : 'border-l-2 border-transparent'}`}>
            <span className="tabular-nums text-slate-500 mr-2">
              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-slate-300">{highlightMessage(log.message)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
