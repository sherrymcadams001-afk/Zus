import { useEffect, useState } from 'react';

interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'trade' | 'signal' | 'system';
}

// Sample trading log messages
const SAMPLE_LOGS = [
  { msg: 'Long BTC @ $97,450 - RSI divergence detected on 15m', type: 'trade' as const },
  { msg: 'Signal: MACD crossover bullish on ETH/USDT', type: 'signal' as const },
  { msg: 'Exit SOL short @ $185.20 - Target reached +2.3%', type: 'trade' as const },
  { msg: 'System: Order book depth analysis complete', type: 'system' as const },
  { msg: 'Signal: Volume spike 340% above average BNB', type: 'signal' as const },
  { msg: 'Long ETH @ $3,420 - Golden cross confirmed', type: 'trade' as const },
  { msg: 'Risk alert: Position size adjusted -15%', type: 'system' as const },
  { msg: 'Signal: Support level test @ $96,800 BTC', type: 'signal' as const },
  { msg: 'Short DOGE @ $0.42 - Head & shoulders pattern', type: 'trade' as const },
  { msg: 'System: Latency optimized to 12ms', type: 'system' as const },
  { msg: 'Signal: Bollinger band squeeze detected SOL', type: 'signal' as const },
  { msg: 'Take profit: BTC +1.8% realized', type: 'trade' as const },
];

/**
 * Highlight keywords in log message
 */
function highlightMessage(message: string): React.ReactNode {
  const keywords = ['Long', 'Short', 'Exit', 'Signal', 'System', 'BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'RSI', 'MACD', '+', '-'];
  
  const parts = message.split(/(\s+)/);
  
  return parts.map((part, idx) => {
    const isKeyword = keywords.some(kw => part.includes(kw));
    const isPositive = part.includes('+');
    const isNegative = part.includes('-') && part.match(/-\d/);
    
    if (isPositive) {
      return <span key={idx} className="text-orion-neon-green">{part}</span>;
    }
    if (isNegative) {
      return <span key={idx} className="text-orion-neon-red">{part}</span>;
    }
    if (isKeyword) {
      return <span key={idx} className="text-orion-neon-cyan">{part}</span>;
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * BotActivityLog - Glassmorphism styled activity feed with living machine pulse
 */
export function BotActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Generate initial logs and add new ones periodically
  useEffect(() => {
    // Initial logs
    const initialLogs: LogEntry[] = SAMPLE_LOGS.slice(0, 5).map((log, idx) => ({
      id: idx,
      timestamp: new Date(Date.now() - (5 - idx) * 3000),
      message: log.msg,
      type: log.type,
    }));
    setLogs(initialLogs);

    let logId = 5;
    const interval = setInterval(() => {
      const randomLog = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
      const newLog: LogEntry = {
        id: logId++,
        timestamp: new Date(),
        message: randomLog.msg,
        type: randomLog.type,
      };

      setLogs(prev => [newLog, ...prev].slice(0, 20)); // Keep last 20 logs
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel machine-pulse flex h-full flex-col overflow-hidden rounded">
      {/* Header */}
      <div className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orion-neon-green animate-pulse" />
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Bot Activity
          </h3>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-2">
        {logs.map((log, idx) => (
          <div
            key={log.id}
            className={`mb-1 rounded px-2 py-1.5 text-[10px] transition-all duration-300 ${
              idx === 0 ? 'animate-slide-down bg-white/5' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 tabular-nums text-slate-600">
                {log.timestamp.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </span>
              <span className="text-slate-300 leading-relaxed">
                {highlightMessage(log.message)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
