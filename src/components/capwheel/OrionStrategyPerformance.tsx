/**
 * ORION Strategy Performance Module
 * 
 * REAL DATA from DataOrchestrator:
 * - Sharpe Ratio calculated from trade history
 * - Max Drawdown from peak-to-trough analysis
 * - Win Rate from portfolio stats
 * - Live Terminal shows actual trade activity
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Terminal, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

interface MetricProps {
  label: string;
  value: string;
  color?: 'green' | 'cyan' | 'amber';
  isLoading?: boolean;
}

const Metric = ({ label, value, color = 'green', isLoading = false }: MetricProps) => {
  const colors = {
    green: 'text-[#00FF9D]',
    cyan: 'text-[#00B8D4]',
    amber: 'text-amber-400',
  };

  return (
    <div className="text-center px-3 py-2 bg-white/5 rounded">
      <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold font-mono ${colors[color]}`}>
        {isLoading ? '—' : value}
      </p>
    </div>
  );
};

export const OrionStrategyPerformance = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 30000 });
  const [logs, setLogs] = useState<Array<{ text: string; type: 'scan' | 'signal' | 'action' | 'status' | 'profit' }>>([]);

  // Generate terminal logs from actual trade data
  useEffect(() => {
    if (data.trades.length > 0) {
      // Show recent trades in terminal
      const tradeLogs = data.trades.slice(0, 3).map(trade => ({
        text: `> ${trade.side}: ${trade.symbol} @ $${trade.price.toFixed(2)} | PnL: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`,
        type: trade.pnl >= 0 ? 'profit' as const : 'action' as const,
      }));
      setLogs([
        { text: `> ENGINE: ${data.tierConfig.name} Active`, type: 'status' },
        ...tradeLogs,
      ]);
    } else {
      // Default status when no trades
      setLogs([
        { text: `> ENGINE: ${data.tierConfig.name} Active`, type: 'status' },
        { text: '> SCANNING: Market conditions...', type: 'scan' },
        { text: '> STATUS: Awaiting signals', type: 'status' },
        { text: `> AUM: $${data.aum.toFixed(2)}`, type: 'signal' },
      ]);
    }
  }, [data.trades, data.tierConfig.name, data.aum]);

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
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </div>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${data.dataFreshness === 'live' ? 'bg-[#00FF9D] animate-pulse' : 'bg-amber-400'}`} />
            <span className={`text-[10px] ${data.dataFreshness === 'live' ? 'text-[#00FF9D]' : 'text-amber-400'}`}>
              {data.dataFreshness === 'live' ? 'LIVE' : 'CACHED'}
            </span>
          </span>
        </div>
        
        {/* Compact Metrics Row - REAL DATA */}
        <div className="grid grid-cols-3 gap-2">
          <Metric 
            label="Sharpe Ratio" 
            value={data.sharpeRatio.toFixed(1)} 
            color="green" 
            isLoading={isLoading}
          />
          <Metric 
            label="Max Drawdown" 
            value={`-${data.maxDrawdown.toFixed(1)}%`} 
            color="cyan" 
            isLoading={isLoading}
          />
          <Metric 
            label="Win Rate" 
            value={`${data.winRate.toFixed(1)}%`} 
            color="amber" 
            isLoading={isLoading}
          />
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
