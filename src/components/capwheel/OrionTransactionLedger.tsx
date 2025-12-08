/**
 * ORION Transaction Ledger
 * 
 * High-density audit trail table with:
 * - Zebra striping for readability
 * - Monospaced fonts for numerical alignment
 * - Filters and export functionality
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ChevronDown, ExternalLink } from 'lucide-react';

type TransactionType = 'yield' | 'injection' | 'withdrawal' | 'fee';

interface Transaction {
  id: string;
  timestamp: Date;
  hash: string;
  counterparty: string;
  classification: string;
  type: TransactionType;
  amount: number;
}

// Generate realistic transaction data
const generateTransactions = (count: number = 50): Transaction[] => {
  const counterparties = [
    'LTSP Liquidity Pool A',
    'LTSP Liquidity Pool B',
    'RWA Hedge Fund Alpha',
    'Staking Validator Node',
    'Treasury Reserve',
  ];

  const classifications: Array<{ name: string; type: TransactionType }> = [
    { name: 'Yield Distribution', type: 'yield' },
    { name: 'Capital Injection', type: 'injection' },
    { name: 'Yield Distribution/Capital Injection', type: 'yield' },
    { name: 'Protocol Fee', type: 'fee' },
  ];

  const transactions: Transaction[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - i * 60000 * (Math.random() * 10 + 1));
    const classInfo = classifications[Math.floor(Math.random() * classifications.length)];
    const isNegative = classInfo.type === 'injection' && Math.random() > 0.7;
    
    transactions.push({
      id: `txn_${Math.random().toString(36).substring(2, 11)}`,
      timestamp,
      hash: `txn_${Math.random().toString(36).substring(2, 5)}...${Math.random().toString(36).substring(2, 4)}`,
      counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
      classification: classInfo.name,
      type: classInfo.type,
      amount: isNegative 
        ? -(Math.random() * 100 + 50) 
        : (Math.random() * 2 + 0.20),
    });
  }

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

type FilterType = 'all' | 'yield' | 'injections' | 'last24h';

export const OrionTransactionLedger = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const transactions = useMemo(() => generateTransactions(30), []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return transactions.filter(txn => {
      if (filter === 'yield') return txn.type === 'yield';
      if (filter === 'injections') return txn.type === 'injection';
      if (filter === 'last24h') return txn.timestamp > oneDayAgo;
      return true;
    });
  }, [transactions, filter]);

  const formatTimestamp = (date: Date) => {
    return date.toISOString().replace('T', ' ').substring(0, 23);
  };

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp (UTC)', 'Hash / ID', 'Counterparty', 'Classification', 'Net Change'];
    const rows = filteredTransactions.map(txn => [
      formatTimestamp(txn.timestamp),
      txn.hash,
      txn.counterparty,
      txn.classification,
      formatAmount(txn.amount),
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
    all: 'All Transactions',
    yield: 'Yield Only',
    injections: 'Withdrawals Only',
    last24h: 'Last 24h',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Transaction Ledger
        </h3>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Filter className="w-3 h-3" />
              {filterLabels[filter]}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#0B1015] border border-white/10 rounded-lg shadow-xl z-20 min-w-[160px]">
                {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilter(key);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      filter === key
                        ? 'text-[#00FF9D] bg-[#00FF9D]/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {filterLabels[key]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#00FF9D] bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded-lg transition-colors"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>

          {/* Tax Report */}
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <ExternalLink className="w-3 h-3" />
            Tax Report
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
        <table className="w-full">
          <thead className="bg-white/5 sticky top-0">
            <tr>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Timestamp (UTC)
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Hash / ID
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Counterparty
              </th>
              <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Classification
              </th>
              <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Net Change
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn, index) => (
              <tr
                key={txn.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'
                }`}
              >
                <td className="px-5 py-3 font-mono text-xs text-slate-400">
                  {formatTimestamp(txn.timestamp)}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-[#00B8D4]">
                  {txn.hash}
                </td>
                <td className="px-5 py-3 text-xs text-slate-300">
                  {txn.counterparty}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {txn.classification}
                </td>
                <td className={`px-5 py-3 font-mono text-xs text-right font-medium ${
                  txn.amount >= 0 ? 'text-[#00FF9D]' : 'text-white'
                }`}>
                  {formatAmount(txn.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
        <span className="font-mono">Last sync: {new Date().toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
};
