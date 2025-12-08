/**
 * ORION Metrics Cards
 * 
 * Bento Grid AUM, Net Yield, Partner Volume, Vesting Schedule
 * Enterprise cockpit design with real-time data
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock, ArrowUpRight, Percent } from 'lucide-react';
import { usePortfolioStore } from '../../store/usePortfolioStore';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueColor?: 'green' | 'red' | 'neutral';
  icon?: React.ReactNode;
  delay?: number;
}

const MetricCard = ({ title, value, subValue, subValueColor = 'neutral', icon, delay = 0 }: MetricCardProps) => {
  const subColors = {
    green: 'text-[#00FF9D]',
    red: 'text-red-400',
    neutral: 'text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#0F1419] border border-white/5 rounded-xl p-5 hover:border-[#00FF9D]/20 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && (
          <span className="p-1.5 rounded-lg bg-[#00FF9D]/10 text-[#00FF9D] opacity-60 group-hover:opacity-100 transition-opacity">
            {icon}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {subValue && (
          <p className={`text-xs font-medium ${subColors[subValueColor]} flex items-center gap-1`}>
            {subValueColor === 'green' && <TrendingUp className="w-3 h-3" />}
            {subValueColor === 'red' && <TrendingDown className="w-3 h-3" />}
            {subValue}
          </p>
        )}
      </div>
    </motion.div>
  );
};

interface VestingCardProps {
  daysRemaining: number;
  withdrawalPenalty: number;
  delay?: number;
}

const VestingCard = ({ daysRemaining, withdrawalPenalty, delay = 0 }: VestingCardProps) => {
  const progress = Math.max(0, Math.min(100, ((1000 - daysRemaining) / 1000) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#0F1419] border border-white/5 rounded-xl p-5 hover:border-[#00B8D4]/20 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Vesting Schedule</span>
        <span className="p-1.5 rounded-lg bg-[#00B8D4]/10 text-[#00B8D4] opacity-60 group-hover:opacity-100 transition-opacity">
          <Clock className="w-4 h-4" />
        </span>
      </div>
      
      <div className="space-y-3">
        <p className="text-lg font-bold text-white">
          Days until maturity: <span className="text-[#00B8D4]">{daysRemaining}</span>
        </p>
        
        {/* Progress Bar */}
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className="absolute h-full bg-gradient-to-r from-[#00B8D4] to-[#00FF9D] rounded-full"
          />
        </div>
        
        {/* Tooltip-style penalty info */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 rounded-lg px-3 py-2">
          <Percent className="w-3 h-3 text-amber-400" />
          <span>Early withdrawal penalty: <span className="text-amber-400 font-medium">{withdrawalPenalty}%</span></span>
        </div>
      </div>
    </motion.div>
  );
};

export const OrionMetricsGrid = () => {
  const walletBalance = usePortfolioStore((state) => state.walletBalance);
  
  // Format AUM
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Simulated metrics (would come from backend in production)
  const metrics = {
    aum: walletBalance || 4500.25,
    aumDelta: 12.40,
    netYield: 7.15,
    yieldDelta: 1.18,
    partnerVolume: 15250,
    activePartners: 8,
    vestingDays: 809,
    withdrawalPenalty: 20,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="AUM"
        value={formatCurrency(metrics.aum)}
        subValue={`+${formatCurrency(metrics.aumDelta)} Today`}
        subValueColor="green"
        icon={<ArrowUpRight className="w-4 h-4" />}
        delay={0}
      />
      
      <MetricCard
        title="Net Yield"
        value={`${metrics.netYield.toFixed(2)}%`}
        subValue={`↑${metrics.yieldDelta.toFixed(2)}% LAST MONTH`}
        subValueColor="green"
        icon={<Percent className="w-4 h-4" />}
        delay={0.1}
      />
      
      <MetricCard
        title="Partner Volume"
        value={formatCurrency(metrics.partnerVolume)}
        subValue={`${metrics.activePartners} Active Partners`}
        subValueColor="neutral"
        icon={<Users className="w-4 h-4" />}
        delay={0.2}
      />
      
      <VestingCard
        daysRemaining={metrics.vestingDays}
        withdrawalPenalty={metrics.withdrawalPenalty}
        delay={0.3}
      />
    </div>
  );
};
