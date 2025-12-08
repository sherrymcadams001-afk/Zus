/**
 * ORION Metrics Cards
 * 
 * Bento Grid: AUM, Net Yield, Partner Volume, Vesting Schedule
 * 4 cards in a row - realistic user amounts
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-[#0F1419] border border-white/5 rounded-lg p-4 hover:border-[#00FF9D]/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && (
          <span className="p-1 rounded bg-[#00FF9D]/10 text-[#00FF9D]">
            {icon}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-white tracking-tight">{value}</p>
      {subValue && (
        <p className={`text-[10px] font-medium ${subColors[subValueColor]} flex items-center gap-1 mt-1`}>
          {subValueColor === 'green' && <TrendingUp className="w-3 h-3" />}
          {subValueColor === 'red' && <TrendingDown className="w-3 h-3" />}
          {subValue}
        </p>
      )}
    </motion.div>
  );
};

export const OrionMetricsGrid = () => {
  const walletBalance = usePortfolioStore((state) => state.walletBalance);
  
  // Format currency - realistic user amount
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Realistic user metrics - tied to actual wallet balance
  const aum = walletBalance || 4500.25;
  const dailyYield = aum * 0.000715; // 0.0715% daily
  
  const metrics = {
    aum: aum,
    aumDelta: dailyYield,
    netYield: 7.15,
    yieldDelta: 1.18,
    partnerVolume: 15250,
    activePartners: 8,
    vestingDays: 809,
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Card 1: AUM - User's actual balance */}
      <MetricCard
        title="AUM"
        value={formatCurrency(metrics.aum)}
        subValue={`+${formatCurrency(metrics.aumDelta)} Today`}
        subValueColor="green"
        icon={<ArrowUpRight className="w-3 h-3" />}
        delay={0}
      />
      
      {/* Card 2: Net Yield */}
      <MetricCard
        title="Net Yield"
        value={`${metrics.netYield.toFixed(2)}%`}
        subValue={`↑${metrics.yieldDelta.toFixed(2)}% LAST MONTH`}
        subValueColor="green"
        icon={<Percent className="w-3 h-3" />}
        delay={0.05}
      />
      
      {/* Card 3: Partner Volume - MUST be visible */}
      <MetricCard
        title="Partner Volume"
        value={formatCurrency(metrics.partnerVolume)}
        subValue={`${metrics.activePartners} Active Partners`}
        subValueColor="neutral"
        icon={<Users className="w-3 h-3" />}
        delay={0.1}
      />
      
      {/* Card 4: Vesting Schedule */}
      <MetricCard
        title="Vesting Schedule"
        value={`${metrics.vestingDays} Days`}
        subValue="Early withdrawal: 20%"
        subValueColor="neutral"
        icon={<Clock className="w-3 h-3" />}
        delay={0.15}
      />
    </div>
  );
};
