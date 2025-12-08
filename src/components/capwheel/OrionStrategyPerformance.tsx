/**
 * ORION Strategy Performance Module
 * 
 * Compact single-panel view:
 * - Sharpe Ratio, Max Drawdown, Win Rate metrics
 * - Live Terminal code view
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Terminal } from 'lucide-react';

interface MetricProps {
  label: string;
  value: string;
  color?: 'green' | 'cyan' | 'amber';
}

const Metric = ({ label, value, color = 'green' }: MetricProps) => {
  const colors = {
    green: 'text-[#00FF9D]',
    cyan: 'text-[#00B8D4]',
    amber: 'text-amber-400',
  };

  return (
    <div className="text-center px-3 py-2 bg-white/5 rounded">
      <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold font-mono ${colors[color]}`}>{value}</p>
    </div>
  );
};

export const OrionStrategyPerformance = () => {
  const [logs, setLogs] = useState<Array<{ text: string; type: 'scan' | 'signal' | 'action' | 'status' | 'profit' }>>([]);

  useEffect(() => {
    const actions: Array<{ text: string; type: 'scan' | 'signal' | 'action' | 'status' | 'profit' }> = [
      { text: '> SCANNING: BTC/USDT Pair', type: 'scan' },
      { text: '> SIGNAL DETECTED: RSI Oversold (32.0)', type: 'signal' },
      { text: '> ACTION: Long Entry @ 44,201', type: 'action' },
      { text: '> STATUS: Executing...', type: 'status' },
      { text: '> PROFIT SECURED: +$1.86', type: 'profit' },
    ];

    let index = 0;
    const addLog = () => {
      setLogs(prev => {
        const newLogs = [...prev, actions[index % actions.length]];
        index++;
        return newLogs.slice(-4);
      });
    };

    setLogs(actions.slice(0, 4));
    index = 4;

    const interval = setInterval(addLog, 2500);
    return () => clearInterval(interval);
  }, []);

  const getColor = (type: string) => {
    switch (type) {
      case 'scan': return 'text-[#00B8D4]';
      case 'signal': return 'text-amber-400';
      case 'action': return 'text-purple-400';
      case 'status': return 'text-slate-400';
      case 'profit': return 'text-[#00FF9D]';
      default: return 'text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-[#0F1419] border border-white/5 rounded-lg overflow-hidden h-full flex flex-col"
    >
      {/* Header with Metrics */}
      <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00FF9D]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Strategy Performance
            </h3>
          </div>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
            <span className="text-[10px] text-[#00FF9D]">LIVE</span>
          </span>
        </div>
        
        {/* Compact Metrics Row */}
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Sharpe Ratio" value="3.1" color="green" />
          <Metric label="Max Drawdown" value="-0.5%" color="cyan" />
          <Metric label="Win Rate" value="98.2%" color="amber" />
        </div>
      </div>

      {/* Live Terminal */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.02] flex-shrink-0">
          <Terminal className="w-3 h-3 text-[#00FF9D]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Terminal</span>
        </div>
        
        <div className="flex-1 p-3 font-mono text-xs space-y-1 overflow-hidden">
          {logs.map((log, i) => (
            <motion.div
              key={`${log.text}-${i}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={getColor(log.type)}
            >
              {log.text}
            </motion.div>
          ))}
          <span className="inline-block w-1.5 h-3 bg-[#00FF9D] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};
