/**
 * ORION Transaction Ledger
 * 
 * Compact audit trail table - fits in half viewport
 * - Zebra striping, monospaced fonts
 * - Filters and CSV export
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, ChevronDown } from 'lucide-react';

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

const generateTransactions = (count: number = 20): Transaction[] => {
  const counterparties = ['LTSP Liquidity Pool A', 'LTSP Liquidity Pool B', 'RWA Hedge Fund Alpha'];
  const classifications: Array<{ name: string; type: TransactionType }> = [
    { name: 'Yield Distribution', type: 'yield' },
    { name: 'Capital Injection', type: 'injection' },
    { name: 'Yield Distribution/Capital Injection', type: 'yield' },
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
      amount: isNegative ? -(Math.random() * 100 + 50) : (Math.random() * 2 + 0.20),
    });
  }

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

type FilterType = 'all' | 'yield' | 'injections' | 'last24h';

export const OrionTransactionLedger = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const transactions = useMemo(() => generateTransactions(15), []);

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

  const formatTimestamp = (date: Date) => date.toISOString().replace('T', ' ').substring(0, 19);
  
  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Math.abs(amount));
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Hash', 'Counterparty', 'Classification', 'Amount'];
    const rows = filteredTransactions.map(txn => [
      formatTimestamp(txn.timestamp), txn.hash, txn.counterparty, txn.classification, formatAmount(txn.amount),
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
    all: 'All', yield: 'Yield Only', injections: 'Withdrawals', last24h: 'Last 24h',
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
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Transaction Ledger</h3>
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
        <table className="w-full text-xs">
          <thead className="bg-white/5 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Hash</th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Counterparty</th>
              <th className="text-left px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Classification</th>
              <th className="text-right px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.slice(0, 8).map((txn, index) => (
              <tr key={txn.id} className={`border-b border-white/5 hover:bg-white/5 ${index % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                <td className="px-3 py-1.5 font-mono text-slate-400">{formatTimestamp(txn.timestamp)}</td>
                <td className="px-3 py-1.5 font-mono text-[#00B8D4]">{txn.hash}</td>
                <td className="px-3 py-1.5 text-slate-300 truncate max-w-[150px]">{txn.counterparty}</td>
                <td className="px-3 py-1.5 text-slate-400 truncate max-w-[120px]">{txn.classification}</td>
                <td className={`px-3 py-1.5 font-mono text-right font-medium ${txn.amount >= 0 ? 'text-[#00FF9D]' : 'text-white'}`}>
                  {formatAmount(txn.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
