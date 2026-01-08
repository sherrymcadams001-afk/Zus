import { TrendingUp, Zap, Clock, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { portfolioManager, STRATEGY_TIERS, type StrategyTier } from '../core/PortfolioManager';

interface CashflowData {
  dailyCashflow: number;
  sessionDuration: number;
  projectedDaily: number;
  projectedWeekly: number;
  projectedMonthly: number;
  tierName: string;
  tierRoiRange: string;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
}

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}k`;
  }
  return `$${amount.toFixed(2)}`;
}

export function TierCashflowPanel() {
  const { sessionPnL, currentTier, walletBalance } = usePortfolioStore();
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null);

  useEffect(() => {
    const updateCashflow = () => {
      const data = portfolioManager.getCashflowData();
      setCashflowData(data);
    };

    updateCashflow();
    const interval = setInterval(updateCashflow, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!cashflowData) return null;

  const tierKey = (currentTier || 'anchor') as StrategyTier;
  const tierConfig = STRATEGY_TIERS[tierKey];
  const dailyRoiPercent = ((tierConfig.dailyRoiMin + tierConfig.dailyRoiMax) / 2 * 100).toFixed(2);
  
  const isPositive = sessionPnL >= 0;

  return (
    <div className="h-full flex flex-col rounded-lg border border-white/5 bg-[#0F1419] overflow-hidden hover:border-[#00FF9D]/10 transition-colors">
      {/* Header */}
      <div className="h-8 flex-shrink-0 flex items-center justify-between border-b border-white/5 px-3">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#00FF9D]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">Cashflow</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#00FF9D]/10 border border-[#00FF9D]/20">
          <span className="text-[9px] font-bold text-[#00FF9D]">{cashflowData.tierName}</span>
          <span className="text-[8px] text-[#00FF9D]/70">{cashflowData.tierRoiRange}</span>
        </div>
      </div>

      {/* Session Cashflow - Primary Metric */}
      <div className="px-3 py-3 border-b border-white/5 bg-gradient-to-r from-[#00FF9D]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">Session Earnings</p>
            <p className={`text-xl font-bold ${isPositive ? 'text-[#00FF9D]' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{formatCurrency(sessionPnL)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-[#00FF9D]/10' : 'bg-red-500/10'}`}>
            <TrendingUp className={`h-5 w-5 ${isPositive ? 'text-[#00FF9D]' : 'text-red-400'}`} />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-[9px] text-slate-500">{formatDuration(cashflowData.sessionDuration)}</span>
        </div>
      </div>

      {/* Projected Earnings Grid */}
      <div className="flex-1 p-3 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center p-2 rounded bg-white/[0.02] border border-white/5">
          <p className="text-[8px] text-slate-500 uppercase mb-0.5">Daily</p>
          <p className="text-xs font-semibold text-white">{formatCurrency(cashflowData.projectedDaily)}</p>
          <p className="text-[8px] text-[#00FF9D]">~{dailyRoiPercent}%</p>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded bg-white/[0.02] border border-white/5">
          <p className="text-[8px] text-slate-500 uppercase mb-0.5">Weekly</p>
          <p className="text-xs font-semibold text-white">{formatCurrency(cashflowData.projectedWeekly)}</p>
          <p className="text-[8px] text-slate-400">6 days</p>
        </div>
        <div className="flex flex-col items-center justify-center p-2 rounded bg-white/[0.02] border border-white/5">
          <p className="text-[8px] text-slate-500 uppercase mb-0.5">Monthly</p>
          <p className="text-xs font-semibold text-white">{formatCurrency(cashflowData.projectedMonthly)}</p>
          <p className="text-[8px] text-slate-400">~24 days</p>
        </div>
      </div>

      {/* Tier Info Footer */}
      <div className="px-3 py-2 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Target className="h-3 w-3 text-slate-500" />
            <span className="text-[8px] text-slate-500">Balance: {formatCurrency(walletBalance)}</span>
          </div>
          <span className="text-[8px] text-slate-500">Min: ${tierConfig.minimumStake.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
