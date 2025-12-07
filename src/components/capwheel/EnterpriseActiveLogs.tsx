/**
 * Enterprise Active Logs Component
 * 
 * Filterable execution log with expandable trade details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Filter, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Clock
} from 'lucide-react';

interface TradeLog {
  id: string;
  timestamp: string;
  type: 'CRYPTO_BUY' | 'CRYPTO_SELL' | 'RWA_REBALANCE' | 'HEDGE_ADJUST';
  symbol: string;
  quantity: number;
  price: number;
  pnl?: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  details?: string;
}

// Mock trade logs
const generateMockLogs = (): TradeLog[] => [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'CRYPTO_BUY',
    symbol: 'BTC/USDT',
    quantity: 0.5,
    price: 43250.00,
    pnl: 1250.00,
    status: 'SUCCESS',
    details: 'Volatility capture entry - momentum confirmed',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'RWA_REBALANCE',
    symbol: 'T-Bills',
    quantity: 500000,
    price: 1.0,
    status: 'SUCCESS',
    details: 'Auto-rebalance triggered - hedge ratio target: 60%',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    type: 'CRYPTO_SELL',
    symbol: 'ETH/USDT',
    quantity: 15.0,
    price: 2280.50,
    pnl: -450.00,
    status: 'SUCCESS',
    details: 'Stop loss triggered - risk management',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    type: 'HEDGE_ADJUST',
    symbol: 'Gold',
    quantity: 25000,
    price: 2050.00,
    status: 'SUCCESS',
    details: 'Hedge efficiency optimization',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    type: 'CRYPTO_BUY',
    symbol: 'SOL/USDT',
    quantity: 100,
    price: 98.75,
    pnl: 850.00,
    status: 'SUCCESS',
    details: 'High volatility opportunity - regime: HIGH_VOL',
  },
];

export const EnterpriseActiveLogs = () => {
  const [logs] = useState<TradeLog[]>(generateMockLogs());
  const [filter, setFilter] = useState<'ALL' | 'CRYPTO' | 'RWA'>('ALL');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'CRYPTO') return log.type.startsWith('CRYPTO');
    if (filter === 'RWA') return log.type.includes('RWA') || log.type.includes('HEDGE');
    return true;
  });

  const getTypeColor = (type: TradeLog['type']) => {
    if (type.startsWith('CRYPTO')) return 'text-capwheel-electric';
    if (type.includes('RWA') || type.includes('HEDGE')) return 'text-capwheel-gold';
    return 'text-gray-400';
  };

  const getTypeLabel = (type: TradeLog['type']) => {
    const labels: Record<TradeLog['type'], string> = {
      CRYPTO_BUY: 'CRYPTO BUY',
      CRYPTO_SELL: 'CRYPTO SELL',
      RWA_REBALANCE: 'RWA REBALANCE',
      HEDGE_ADJUST: 'HEDGE ADJUST',
    };
    return labels[type];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0.1, 1] }}
      className="capwheel-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-capwheel-surface rounded-lg">
            <FileText size={20} className="text-capwheel-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Execution Logs</h2>
            <p className="text-xs text-gray-500 font-mono">
              Real-time trade activity
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          {(['ALL', 'CRYPTO', 'RWA'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === f
                  ? 'bg-capwheel-gold text-capwheel-navy'
                  : 'bg-capwheel-surface text-gray-400 hover:text-white border border-capwheel-border-subtle'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="bg-capwheel-surface rounded-lg border border-capwheel-border-subtle overflow-hidden"
            >
              {/* Log Header */}
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-capwheel-surface-hover transition-all duration-150"
              >
                <div className="flex items-center gap-4">
                  {/* Timestamp */}
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Clock size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>

                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded text-xs font-mono font-semibold ${getTypeColor(log.type)}`}>
                    {getTypeLabel(log.type)}
                  </div>

                  {/* Symbol */}
                  <div className="text-sm font-semibold text-white font-mono">
                    {log.symbol}
                  </div>

                  {/* Quantity & Price */}
                  <div className="text-xs text-gray-400 font-mono">
                    {log.quantity.toLocaleString()} @ {formatCurrency(log.price)}
                  </div>

                  {/* P&L */}
                  {log.pnl !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${
                      log.pnl >= 0 ? 'text-capwheel-profit' : 'text-capwheel-loss'
                    }`}>
                      {log.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {log.pnl >= 0 ? '+' : ''}{formatCurrency(log.pnl)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Status */}
                  <div className={`w-2 h-2 rounded-full ${
                    log.status === 'SUCCESS' ? 'bg-capwheel-profit' :
                    log.status === 'PENDING' ? 'bg-capwheel-electric animate-pulse' :
                    'bg-capwheel-loss'
                  }`}></div>

                  <ChevronDown 
                    size={16} 
                    className={`text-gray-500 transition-transform duration-200 ${
                      expandedLog === log.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Expandable Details */}
              <AnimatePresence>
                {expandedLog === log.id && log.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-t border-capwheel-border-subtle"
                  >
                    <div className="p-4 bg-capwheel-navy">
                      <p className="text-sm text-gray-400 font-mono">
                        {log.details}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 font-mono">
                        <span>ID: {log.id}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-capwheel-border-subtle">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono">
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          <button className="text-capwheel-gold hover:text-capwheel-gold-light transition-colors duration-150 font-medium">
            Export All →
          </button>
        </div>
      </div>
    </motion.div>
  );
};
