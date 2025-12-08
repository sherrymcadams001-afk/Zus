/**
 * ORION Wealth Projection Engine
 * 
 * Dynamic Data Matrix - THE GREED ENGINE
 * Shows exact cash flow: Daily, Weekly, Monthly earnings
 * REAL DATA from DataOrchestrator - tied to actual bot tier ROI
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calculator, Loader2, Lock, LockOpen } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';

interface ToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  description?: string;
}

const Toggle = ({ label, enabled, onChange, description }: ToggleProps) => (
  <div className="space-y-1">
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.98] ${
        enabled 
          ? 'bg-[#00FF9D] text-black shadow-[0_0_20px_rgba(0,255,157,0.15)]' 
          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {enabled ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
      <span>{label}</span>
      <span className={`text-[9px] uppercase tracking-wider ${enabled ? 'text-black/70' : 'text-slate-500'}`}>
        {enabled ? 'ON' : 'OFF'}
      </span>
    </button>
    {description && (
      <p className={`text-[9px] px-1 ${enabled ? 'text-[#00FF9D]' : 'text-slate-500'}`}>
        {description}
      </p>
    )}
  </div>
);

export const OrionWealthProjection = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 60000 });
  const [autoCompound, setAutoCompound] = useState(true);

  // Calculate compound vs simple annual projections
  const dailyRate = (data.tierConfig.dailyRoiMin + data.tierConfig.dailyRoiMax) / 2;
  const tradingDaysPerYear = data.tierConfig.tradingDaysPerWeek * 52;
  
  const compoundGain = data.aum * (Math.pow(1 + dailyRate, tradingDaysPerYear) - 1);
  const simpleGain = data.dailyEarnings * tradingDaysPerYear;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-[#0F1419] border border-white/5 rounded-lg overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00FF9D]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dynamic Data Matrix
            </h3>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </div>
        </div>
        <Toggle
          label="Auto-Compound Profits"
          enabled={autoCompound}
          onChange={setAutoCompound}
          description={autoCompound ? '✓ Profits locked in capital for maximum growth' : '○ Profits available for immediate withdrawal'}
        />
      </div>

      {/* THE GREED ENGINE - Exact Cash Flow Table */}
      <div className="flex-1 p-4">
        {/* Header Row */}
        <div className="grid grid-cols-3 gap-2 mb-3 pb-2 border-b border-white/10">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Period</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-right">Rate</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold text-right">Earnings</span>
        </div>

        {/* Daily Row - THE DOPAMINE HOOK */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors">
          <span className="text-sm text-white font-medium">Daily</span>
          <span className="text-sm text-slate-400 font-mono text-right">
            {(dailyRate * 100).toFixed(2)}%
          </span>
          <span className="text-sm text-[#00FF9D] font-mono font-bold text-right">
            {formatCurrency(data.dailyEarnings)}
          </span>
        </div>

        {/* Weekly Row */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors">
          <span className="text-sm text-white font-medium">Weekly</span>
          <span className="text-sm text-slate-400 font-mono text-right">
            {(dailyRate * data.tierConfig.tradingDaysPerWeek * 100).toFixed(2)}%
          </span>
          <span className="text-sm text-[#00FF9D] font-mono text-right">
            {formatCurrency(data.weeklyEarnings)}
          </span>
        </div>

        {/* Monthly Row */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors">
          <span className="text-sm text-white font-medium">Monthly</span>
          <span className="text-sm text-slate-400 font-mono text-right">
            {(dailyRate * data.tierConfig.tradingDaysPerWeek * 4.33 * 100).toFixed(2)}%
          </span>
          <span className="text-sm text-[#00FF9D] font-mono text-right">
            {formatCurrency(data.monthlyEarnings)}
          </span>
        </div>

        {/* Compound vs Payout Comparison */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3 h-3 text-[#00B8D4]" />
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Annual Projection</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${!autoCompound ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/30' : 'bg-white/5'}`}>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">With Payouts</p>
              <p className="text-lg font-bold font-mono text-white">
                {formatCurrency(simpleGain)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${autoCompound ? 'bg-[#00FF9D]/10 border border-[#00FF9D]/30' : 'bg-white/5'}`}>
              <p className="text-[10px] uppercase tracking-wider text-[#00FF9D] mb-1">With Compounding</p>
              <p className="text-lg font-bold font-mono text-[#00FF9D]">
                {formatCurrency(compoundGain)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Current Tier & AUM */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            {data.tierConfig.name} • AUM: {formatCurrency(data.aum)}
          </span>
          <span className="text-[10px] font-mono text-[#00B8D4]">
            {data.dataFreshness === 'live' ? '● LIVE' : '○ CACHED'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
