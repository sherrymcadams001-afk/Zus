/**
 * ORION Transaction Ledger
 * 
 * REAL transaction data from backend API
 * - Fetches from /api/wallet/transactions
 * - Zebra striping, monospaced fonts
 * - Filters and CSV export
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { TransactionData } from '../../core/DataOrchestrator';

type FilterType = 'all' | 'deposits' | 'withdrawals' | 'roi';

// Map backend transaction types to display names
const TYPE_LABELS: Record<string, string> = {
  deposit: 'Capital Boost',
  withdraw: 'Withdrawal',
  trade_profit: 'Trading Profit',
  trade_loss: 'Trading Loss',
  pool_stake: 'Pool Stake',
  pool_unstake: 'Pool Unstake',
  roi_payout: 'ROI Payout',
  referral_commission: 'Referral Commission',
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

export const OrionTransactionLedger = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 30000 });
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredTransactions = useMemo(() => {
    const txns = data.transactions;
    
    return txns.filter((txn: TransactionData) => {
      if (filter === 'deposits') return txn.type === 'deposit';
      if (filter === 'withdrawals') return txn.type === 'withdraw';
      if (filter === 'roi') return txn.type === 'roi_payout' || txn.type === 'trade_profit';
      return true;
    });
  }, [data.transactions, filter]);

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
    const headers = ['Timestamp', 'ID', 'Type', 'Description', 'Amount', 'Status'];
    const rows = filteredTransactions.map((txn: TransactionData) => [
      formatTimestamp(txn.created_at),
      `txn_${txn.id}`,
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
    a.download = `capwheel-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterLabels: Record<FilterType, string> = {
    all: 'All', deposits: 'Capital Boosts', withdrawals: 'Withdrawals', roi: 'ROI Only',
  };

  // Show empty state if no transactions
  const hasTransactions = filteredTransactions.length > 0;

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
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Transaction Ledger</h3>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
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
            disabled={!hasTransactions}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#00FF9D] bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded transition-colors disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {hasTransactions ? (
          <table className="w-full text-xs">
            <thead className="bg-white/5 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">ID</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Counterparty</th>
                <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                <th className="text-right px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 8).map((txn: TransactionData, index: number) => {
                const isPositive = ['deposit', 'roi_payout', 'trade_profit', 'referral_commission'].includes(txn.type);
                return (
                  <tr key={txn.id} className={`border-b border-white/5 hover:bg-white/5 ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                    <td className="px-3 py-1.5 font-mono text-slate-400">{formatTimestamp(txn.created_at)}</td>
                    <td className="px-3 py-1.5 font-mono text-[#00B8D4]">txn_{txn.id}</td>
                    <td className="px-3 py-1.5 text-slate-300 truncate max-w-[150px]">{TYPE_COUNTERPARTY[txn.type] ?? 'System'}</td>
                    <td className="px-3 py-1.5 text-slate-400 truncate max-w-[120px]">{TYPE_LABELS[txn.type] ?? txn.type}</td>
                    <td className={`px-3 py-1.5 font-mono text-right font-medium ${isPositive ? 'text-[#00FF9D]' : 'text-white'}`}>
                      {formatAmount(txn.amount, txn.type)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            {isLoading ? 'Loading transactions...' : 'No transactions yet'}
          </div>
        )}
      </div>
    </motion.div>
  );
};
