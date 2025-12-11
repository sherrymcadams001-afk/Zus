/**
 * ORION Metrics Cards
 * 
 * Bento Grid: AUM, ROI, Partner Volume, Vesting Schedule
 * 4 cards in a row - REAL DATA from backend via DataOrchestrator
 */

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock, ArrowUpRight, Percent, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { CollapsibleCard } from '../mobile/CollapsibleCard';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  subValueColor?: 'green' | 'red' | 'neutral';
  icon?: React.ReactNode;
  delay?: number;
  isLoading?: boolean;
  isMobile?: boolean;
}

const MetricCard = ({ title, value, subValue, subValueColor = 'neutral', icon, delay = 0, isLoading = false, isMobile = false }: MetricCardProps) => {
  const subColors = {
    green: 'text-[#00FF9D]',
    red: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const content = (
    <>
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
    </>
  );

  if (isMobile) {
    return (
      <div className="bg-[#0F1419] border border-white/5 rounded-lg p-4">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-[#0F1419] border border-white/5 rounded-lg p-4 hover:border-[#00FF9D]/20 transition-colors"
    >
      {content}
    </motion.div>
  );
};

export const OrionMetricsGrid = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 30000 });
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Determine ROI display color based on rate multiplier
  const roiColor = data.rateMultiplier >= 1.1 ? "green" as const :
                   data.rateMultiplier <= 0.9 ? "red" as const : "green" as const;
  
  // Format sentiment for display
  const sentimentText = data.marketSentiment === 'bullish' ? '▲ Bullish' :
                        data.marketSentiment === 'bearish' ? '▼ Bearish' : '◆ Neutral';

  const metrics = [
    {
      title: "AUM",
      value: formatCurrency(data.aum),
      subValue: `+${formatCurrency(data.dailyEarnings)} Today`,
      subValueColor: "green" as const,
      icon: <ArrowUpRight className="w-3 h-3" />,
    },
    {
      title: "ROI",
      value: data.displayRate || `${data.netYieldPercent.toFixed(2)}%`,
      subValue: `${sentimentText} · ${data.volatility} vol`,
      subValueColor: roiColor,
      icon: <Percent className="w-3 h-3" />,
    },
    {
      title: "Partner Volume",
      value: formatCurrency(data.partnerVolume),
      subValue: "Downstream investments",
      subValueColor: "neutral" as const,
      icon: <Users className="w-3 h-3" />,
    },
    {
      title: "Vesting",
      value: data.vestingRunway > 0 ? `${data.vestingRunway} Days` : "Available",
      subValue: data.vestingRunway > 0 
        ? `Unlock: ${new Date(Date.now() + data.vestingRunway * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : "No lock period",
      subValueColor: "neutral" as const,
      icon: <Clock className="w-3 h-3" />,
    }
  ];

  if (isMobile) {
    return (
      <CollapsibleCard title="Key Metrics" defaultOpen={true} className="mb-3">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              {...metric}
              isLoading={isLoading}
              isMobile={true}
            />
          ))}
        </div>
      </CollapsibleCard>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map((metric, idx) => (
        <MetricCard
          key={idx}
          {...metric}
          delay={idx * 0.05}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};
