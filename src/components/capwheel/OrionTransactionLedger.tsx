/**
 * ORION Transaction Ledger
 * 
 * SYSTEM-WIDE platform activity feed showing all CapWheel transactions
 * - Synthetic platform-wide transactions (not user-specific)
 * - Always populated with activity, never empty
 * - New entries animate in every 3-5 seconds
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Filter, ChevronDown, Activity } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

type FilterType = 'all' | 'deposits' | 'withdrawals' | 'roi';

// Synthetic transaction type for system-wide display
interface SystemTransaction {
  id: number;
  type: string;
  amount: number;
  status: 'completed';
  description: string;
  created_at: number;
  user_hash: string; // Anonymized user identifier
}

// Map backend transaction types to display names
const TYPE_LABELS: Record<string, string> = {
  deposit: 'Capital Injection',
  withdraw: 'Withdrawal',
  trade_profit: 'Trading Profit',
  trade_loss: 'Trading Loss',
  pool_stake: 'Pool Stake',
  pool_unstake: 'Pool Unstake',
  roi_payout: 'ROI Payout',
  referral_commission: 'Partner Commission',
};

// Map to counterparty display
const TYPE_COUNTERPARTY: Record<string, string> = {
  deposit: 'User Wallet',
  withdraw: 'User Wallet',
  trade_profit: 'Trading Engine',
  trade_loss: 'Trading Engine',
  pool_stake: 'LTSP Liquidity Pool',
  pool_unstake: 'LTSP Liquidity Pool',
  roi_payout: 'Yield Distribution',
  referral_commission: 'Partner Network',
};

// Generate random user hash for anonymized display
const generateUserHash = () => {
  const chars = 'ABCDEF0123456789';
  let hash = '0x';
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash + '...';
};

// Generate a single synthetic transaction
const generateTransaction = (id: number): SystemTransaction => {
  const types = ['deposit', 'trade_profit', 'roi_payout', 'pool_stake', 'referral_commission', 'withdraw'];
  const weights = [0.25, 0.30, 0.20, 0.10, 0.10, 0.05]; // Mostly positive activity
  
  let random = Math.random();
  let typeIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      typeIndex = i;
      break;
    }
  }
  
  const type = types[typeIndex];
  
  // Amount ranges by type
  const amountRanges: Record<string, [number, number]> = {
    deposit: [500, 50000],
    trade_profit: [10, 2000],
    roi_payout: [50, 5000],
    pool_stake: [1000, 100000],
    referral_commission: [25, 500],
    withdraw: [100, 10000],
  };
  
  const [min, max] = amountRanges[type];
  const amount = Math.random() * (max - min) + min;
  
  return {
    id,
    type,
    amount,
    status: 'completed',
    description: TYPE_LABELS[type],
    created_at: Math.floor(Date.now() / 1000),
    user_hash: generateUserHash(),
  };
};

// Generate initial batch of transactions
const generateInitialTransactions = (count: number): SystemTransaction[] => {
  const transactions: SystemTransaction[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = 0; i < count; i++) {
    const tx = generateTransaction(i + 1);
    // Space them out over the last hour
    tx.created_at = now - (i * 120) - Math.floor(Math.random() * 60);
    transactions.push(tx);
  }
  
  return transactions.sort((a, b) => b.created_at - a.created_at);
};

export const OrionTransactionLedger = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [transactions, setTransactions] = useState<SystemTransaction[]>(() => generateInitialTransactions(15));
  const nextIdRef = useRef(16);

  // Add new transactions periodically (3-5 seconds)
  useEffect(() => {
    const addTransaction = () => {
      const newTx = generateTransaction(nextIdRef.current++);
      setTransactions(prev => [newTx, ...prev.slice(0, 14)]); // Keep max 15 transactions
    };

    const interval = setInterval(() => {
      addTransaction();
    }, 3000 + Math.random() * 2000); // 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filter === 'deposits') return txn.type === 'deposit';
      if (filter === 'withdrawals') return txn.type === 'withdraw';
      if (filter === 'roi') return txn.type === 'roi_payout' || txn.type === 'trade_profit';
      return true;
    });
  }, [transactions, filter]);

  const formatTimestamp = (unixTime: number) => {
    const date = new Date(unixTime * 1000);
    return date.toISOString().replace('T', ' ').substring(0, 19);
  };
  
  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
    
    // Deposits and payouts are positive, withdrawals and losses are negative display
    const isPositive = ['deposit', 'roi_payout', 'trade_profit', 'referral_commission'].includes(type);
    return isPositive ? `+${formatted}` : `-${formatted}`;
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Type', 'Description', 'Amount', 'Status'];
    const rows = filteredTransactions.map((txn) => [
      formatTimestamp(txn.created_at),
      txn.user_hash,
      TYPE_LABELS[txn.type] ?? txn.type,
      txn.description ?? '',
      formatAmount(txn.amount, txn.type),
      txn.status,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capwheel-platform-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterLabels: Record<FilterType, string> = {
    all: 'All', deposits: 'Deposits', withdrawals: 'Withdrawals', roi: 'ROI Only',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="bg-[#0F1419] border border-white/5 rounded-lg overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00FF9D]" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Platform Activity</h3>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#00FF9D]/10 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
            <span className="text-[9px] text-[#00FF9D] uppercase">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-slate-400 bg-white/5 hover:bg-white/10 rounded transition-colors"
            >
              <Filter className="w-3 h-3" />
              {filterLabels[filter]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#0B1015] border border-white/10 rounded shadow-xl z-20 min-w-[100px]">
                {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { setFilter(key); setShowFilterMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${
                      filter === key ? 'text-[#00FF9D] bg-[#00FF9D]/10' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#00FF9D] bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isMobile ? (
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {filteredTransactions.slice(0, 8).map((txn, index) => {
                const isPositive = ['deposit', 'roi_payout', 'trade_profit', 'referral_commission'].includes(txn.type);
                return (
                  <motion.div 
                    key={txn.id}
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 border-b border-white/5 ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#00B8D4] font-mono">{txn.user_hash}</span>
                        <span className="text-xs font-medium text-slate-200">{TYPE_LABELS[txn.type] ?? txn.type}</span>
                      </div>
                      <span className={`text-xs font-mono font-medium ${isPositive ? 'text-[#00FF9D]' : 'text-white'}`}>
                        {formatAmount(txn.amount, txn.type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{TYPE_COUNTERPARTY[txn.type] ?? 'System'}</span>
                      <span className="font-mono">{formatTimestamp(txn.created_at)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Timestamp (UTC)</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">User</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Counterparty</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Classification</th>
                <th className="text-right px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Net Change</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredTransactions.slice(0, 8).map((txn, index) => {
                  const isPositive = ['deposit', 'roi_payout', 'trade_profit', 'referral_commission'].includes(txn.type);
                  return (
                    <motion.tr 
                      key={txn.id} 
                      initial={{ opacity: 0, backgroundColor: 'rgba(0, 255, 157, 0.1)' }}
                      animate={{ opacity: 1, backgroundColor: index % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                      transition={{ duration: 0.5 }}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="px-3 py-1.5 font-mono text-slate-400">{formatTimestamp(txn.created_at)}</td>
                      <td className="px-3 py-1.5 font-mono text-[#00B8D4]">{txn.user_hash}</td>
                      <td className="px-3 py-1.5 text-slate-300 truncate max-w-[150px]">{TYPE_COUNTERPARTY[txn.type] ?? 'System'}</td>
                      <td className="px-3 py-1.5 text-slate-400 truncate max-w-[120px]">{TYPE_LABELS[txn.type] ?? txn.type}</td>
                      <td className={`px-3 py-1.5 font-mono text-right font-medium ${isPositive ? 'text-[#00FF9D]' : 'text-white'}`}>
                        {formatAmount(txn.amount, txn.type)}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};
