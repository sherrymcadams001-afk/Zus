/**
 * ORION Metrics Cards
 * 
 * Bento Grid: AUM, Net Yield, Partner Volume, Vesting Schedule
 * 4 cards in a row - REAL DATA from backend via DataOrchestrator
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock, ArrowUpRight, Percent, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { ORION_COLORS, ORION_MOTION } from '../../theme/orion-design-system';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueColor?: 'green' | 'red' | 'neutral';
  icon?: React.ReactNode;
  delay?: number;
  isLoading?: boolean;
}

const MetricCard = ({ title, value, subValue, subValueColor = 'neutral', icon, delay = 0, isLoading = false }: MetricCardProps) => {
  const subColors = {
    green: 'text-[#00FF9D]',
    red: 'text-[#FF4444]',
    neutral: 'text-slate-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ORION_MOTION.duration.normal / 1000, delay, ease: ORION_MOTION.easing.default }}
      className="bg-[#0F1419] border border-white/5 rounded-lg p-4 hover:border-[#00FF9D]/20 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && (
          <span className="p-1 rounded bg-[#00FF9D]/10 text-[#00FF9D]">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-white tracking-tight">
        {isLoading ? '—' : value}
      </p>
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
  const { data, isLoading } = useDashboardData({ pollingInterval: 30000 });
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {/* Card 1: AUM - User's actual balance from DB */}
      <MetricCard
        title="AUM"
        value={formatCurrency(data.aum)}
        subValue={`+${formatCurrency(data.dailyEarnings)} Today`}
        subValueColor="green"
        icon={<ArrowUpRight className="w-3 h-3" />}
        delay={0}
        isLoading={isLoading}
      />
      
      {/* Card 2: Net Yield - From bot tier ROI */}
      <MetricCard
        title="Net Yield"
        value={`${data.netYieldPercent.toFixed(2)}%`}
        subValue={`${data.currentTier.toUpperCase()} tier rate`}
        subValueColor="green"
        icon={<Percent className="w-3 h-3" />}
        delay={0.05}
        isLoading={isLoading}
      />
      
      {/* Card 3: Partner Volume - From referral network */}
      <MetricCard
        title="Partner Volume"
        value={formatCurrency(data.partnerVolume)}
        subValue="Downstream investments"
        subValueColor="neutral"
        icon={<Users className="w-3 h-3" />}
        delay={0.1}
        isLoading={isLoading}
      />
      
      {/* Card 4: Vesting Schedule - Days until capital withdrawal */}
      <MetricCard
        title="Vesting Runway"
        value={`${data.vestingRunway} Days`}
        subValue={`${data.tierConfig.capitalWithdrawalDays}d lock period`}
        subValueColor="neutral"
        icon={<Clock className="w-3 h-3" />}
        delay={0.15}
        isLoading={isLoading}
      />
    </div>
  );
};
