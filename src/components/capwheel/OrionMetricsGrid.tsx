/**
 * ORION Metrics Cards
 * 
 * Bento Grid: AUM, Net Yield, Partner Volume, Vesting Schedule
 * Responsive layout: 4 cols desktop, 2 cols tablet, 1 col mobile (collapsible)
 * REAL DATA from backend via DataOrchestrator
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock, ArrowUpRight, Percent, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useResponsive } from '../../hooks/useMediaQuery';
import { CollapsibleMetricCard } from '../mobile/CollapsibleCard';
import { ORION_MOTION } from '../../theme/orion-design-system';

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
      className="bg-[#0F1419] border border-white/5 rounded-lg p-3 sm:p-4 hover:border-[#00FF9D]/20 transition-colors active:scale-[0.98] touch-manipulation"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && (
          <span className="p-1 rounded bg-[#00FF9D]/10 text-[#00FF9D]">
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
          </span>
        )}
      </div>
      <p className="text-lg sm:text-xl font-bold text-white tracking-tight">
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
  const { isMobile } = useResponsive();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format currency compact for mobile
  const formatCurrencyCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
  };

  // Mobile: Use collapsible cards for data density management
  if (isMobile) {
    return (
      <div className="space-y-2">
        {/* Primary Metrics - Always visible */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            title="AUM"
            value={formatCurrencyCompact(data.aum)}
            subValue={`+${formatCurrencyCompact(data.dailyEarnings)}`}
            subValueColor="green"
            icon={<ArrowUpRight className="w-3 h-3" />}
            delay={0}
            isLoading={isLoading}
          />
          <MetricCard
            title="Net Yield"
            value={`${data.netYieldPercent.toFixed(2)}%`}
            subValue={data.currentTier.toUpperCase()}
            subValueColor="green"
            icon={<Percent className="w-3 h-3" />}
            delay={0.05}
            isLoading={isLoading}
          />
        </div>

        {/* Secondary Metrics - Collapsible */}
        <CollapsibleMetricCard
          title="Partner Volume"
          value={formatCurrencyCompact(data.partnerVolume)}
          change="Downstream investments"
          changeType="neutral"
          icon={<Users className="w-4 h-4" />}
        >
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Volume</span>
              <span className="text-sm font-medium text-white">{formatCurrency(data.partnerVolume)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Referral Count</span>
              <span className="text-sm font-medium text-white">{data.referralCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Bonus Rate</span>
              <span className="text-sm font-medium text-[#00FF9D]">{data.tierConfig.referralBonus}%</span>
            </div>
          </div>
        </CollapsibleMetricCard>

        <CollapsibleMetricCard
          title="Vesting Runway"
          value={`${data.vestingRunway} Days`}
          change={`${data.tierConfig.capitalWithdrawalDays}d lock`}
          changeType="neutral"
          icon={<Clock className="w-4 h-4" />}
        >
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Days Remaining</span>
              <span className="text-sm font-medium text-white">{data.vestingRunway}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Lock Period</span>
              <span className="text-sm font-medium text-white">{data.tierConfig.capitalWithdrawalDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Current Tier</span>
              <span className="text-sm font-medium text-[#00FF9D]">{data.tierConfig.name}</span>
            </div>
          </div>
        </CollapsibleMetricCard>
      </div>
    );
  }

  // Desktop/Tablet: Standard grid layout
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
