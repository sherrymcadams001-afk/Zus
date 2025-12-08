/**
 * ORION Strategy Performance Module
 * 
 * The "Product" view featuring:
 * - Sharpe Ratio, Max Drawdown, Win Rate metrics
 * - Live Terminal code view
 * - Dynamic Data Matrix
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Target, Terminal } from 'lucide-react';

interface MetricProps {
  label: string;
  value: string;
  subLabel?: string;
  color?: 'green' | 'cyan' | 'amber';
}

const Metric = ({ label, value, subLabel, color = 'green' }: MetricProps) => {
  const colors = {
    green: 'text-[#00FF9D]',
    cyan: 'text-[#00B8D4]',
    amber: 'text-amber-400',
  };

  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${colors[color]}`}>{value}</p>
      {subLabel && <p className="text-[10px] text-slate-600 mt-0.5">{subLabel}</p>}
    </div>
  );
};

const LiveTerminalView = () => {
  const [logs, setLogs] = useState<Array<{ text: string; type: 'scan' | 'signal' | 'action' | 'status' | 'profit' }>>([]);

  useEffect(() => {
    const actions: Array<{ text: string; type: 'scan' | 'signal' | 'action' | 'status' | 'profit' }> = [
      { text: '> SCANNING: BTC/USDT Pair', type: 'scan' },
      { text: '> SIGNAL DETECTED: RSI Oversold (32.0)', type: 'signal' },
      { text: '> ACTION: Long Entry @ 44,201', type: 'action' },
      { text: '> STATUS: Executing...', type: 'status' },
      { text: '> PROFIT SECURED: +$1.86', type: 'profit' },
      { text: '> SCANNING: ETH/USDT Pair', type: 'scan' },
      { text: '> SIGNAL DETECTED: MACD Bullish Cross', type: 'signal' },
      { text: '> ACTION: Long Entry @ 2,341', type: 'action' },
      { text: '> STATUS: Executing...', type: 'status' },
      { text: '> PROFIT SECURED: +$0.94', type: 'profit' },
      { text: '> SCANNING: SOL/USDT Pair', type: 'scan' },
      { text: '> SIGNAL DETECTED: BB Squeeze', type: 'signal' },
      { text: '> ACTION: Long Entry @ 98.42', type: 'action' },
      { text: '> STATUS: Executing...', type: 'status' },
      { text: '> PROFIT SECURED: +$2.14', type: 'profit' },
    ];

    let index = 0;
    const addLog = () => {
      setLogs(prev => {
        const newLogs = [...prev, actions[index % actions.length]];
        index++;
        return newLogs.slice(-5);
      });
    };

    // Initial logs
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
    <div className="bg-[#0B1015] rounded-lg border border-white/10 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
        <Terminal className="w-3 h-3 text-[#00FF9D]" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Terminal</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
          <span className="text-[10px] text-[#00FF9D]">LIVE</span>
        </span>
      </div>

      {/* Terminal Content */}
      <div className="p-4 font-mono text-xs space-y-1.5 h-32 overflow-hidden">
        {logs.map((log, i) => (
          <motion.div
            key={`${log.text}-${i}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={getColor(log.type)}
          >
            {log.text}
          </motion.div>
        ))}
        <span className="inline-block w-2 h-4 bg-[#00FF9D] animate-pulse" />
      </div>
    </div>
  );
};

interface DataMatrixRowProps {
  label: string;
  earnings: string;
  projected: string;
}

const DataMatrixRow = ({ label, earnings, projected }: DataMatrixRowProps) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-xs text-white font-mono text-right">{earnings}</span>
    <span className="text-xs text-[#00FF9D] font-mono text-right">{projected}</span>
  </div>
);

export const OrionStrategyPerformance = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Strategy Performance Card */}
      <div className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00FF9D]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Strategy Performance
          </h3>
          <span className="ml-auto text-[10px] text-slate-500">
            Sharpe Ratio: 3.1 | Max Drawdown: -0.5% | Win Rate: 98.2%
          </span>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 p-5 border-b border-white/5">
          <Metric label="Sharpe Ratio" value="3.1" subLabel="Risk-Adjusted" color="green" />
          <Metric label="Max Drawdown" value="-0.5%" subLabel="Worst Case" color="cyan" />
          <Metric label="Win Rate" value="98.2%" subLabel="All Trades" color="amber" />
        </div>

        {/* Live Terminal */}
        <div className="p-5">
          <LiveTerminalView />
        </div>
      </div>

      {/* Dynamic Data Matrix & Additional Info */}
      <div className="space-y-4">
        {/* Dynamic Data Matrix */}
        <div className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00B8D4]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dynamic Data Matrix
            </h3>
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Module</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 text-right">Earnings</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 text-right">Projected</span>
            </div>

            <DataMatrixRow label="Daily" earnings="$1.88" projected="$1.88" />
            <DataMatrixRow label="Weekly" earnings="$11.56" projected="$11.56" />
            <DataMatrixRow label="Monthly" earnings="$50.71" projected="$50.71" />
          </div>
        </div>

        {/* Live Terminal Status */}
        <div className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00FF9D]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Terminal
            </h3>
          </div>

          <div className="p-5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">&gt; SCANNING:</span>
              <span className="text-[#00B8D4]">BTC/USDT Pair</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">&gt; SIGNAL DETECTED:</span>
              <span className="text-amber-400">RSI Oversold (32.0)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">&gt; ACTION:</span>
              <span className="text-purple-400">Long Entry @ 44,201</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">&gt; STATUS:</span>
              <span className="text-[#00FF9D]">Executing...</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
