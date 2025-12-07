/**
 * Executive Summary Component
 * 
 * Top-level metric cards displaying key portfolio performance indicators
 */

import { motion } from 'framer-motion';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Activity, 
  Award 
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  index: number;
}

const MetricCard = ({ title, value, subtitle, trend, icon, index }: MetricCardProps) => {
  const trendColor = trend && trend > 0 ? 'text-capwheel-profit' : 'text-capwheel-loss';
  const trendSign = trend && trend > 0 ? '+' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.05, 
        duration: 0.2, 
        ease: [0.2, 0, 0.1, 1] 
      }}
      className="capwheel-card p-6 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-capwheel-surface rounded-lg">
          <div className="text-capwheel-gold">
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`text-sm font-mono font-semibold ${trendColor}`}>
            {trendSign}{trend.toFixed(2)}%
          </div>
        )}
      </div>

      <h3 className="text-sm text-gray-400 font-medium mb-2">
        {title}
      </h3>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-white font-mono tabular-nums">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 font-mono">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export const ExecutiveSummary = () => {
  const { portfolioMetrics } = useCapWheel();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const metrics = [
    {
      title: 'Total AUM',
      value: formatCurrency(portfolioMetrics.totalAUM),
      subtitle: 'Assets Under Management',
      icon: <DollarSign size={20} />,
      trend: undefined,
    },
    {
      title: '24h P&L',
      value: formatCurrency(portfolioMetrics.dailyPnL),
      subtitle: `${portfolioMetrics.dailyPnLPercent >= 0 ? '+' : ''}${portfolioMetrics.dailyPnLPercent.toFixed(2)}% change`,
      icon: <TrendingUp size={20} />,
      trend: portfolioMetrics.dailyPnLPercent,
    },
    {
      title: 'Sharpe Ratio',
      value: portfolioMetrics.sharpeRatio.toFixed(2),
      subtitle: 'Risk-adjusted returns',
      icon: <BarChart3 size={20} />,
      trend: undefined,
    },
    {
      title: 'Win Rate',
      value: `${portfolioMetrics.winRate.toFixed(1)}%`,
      subtitle: 'Profitable trades',
      icon: <Target size={20} />,
      trend: undefined,
    },
    {
      title: 'Volatility Captured',
      value: `${portfolioMetrics.volatilityCaptured.toFixed(1)}%`,
      subtitle: 'Market volatility harvested',
      icon: <Activity size={20} />,
      trend: undefined,
    },
    {
      title: 'Time-Weighted Return',
      value: `${portfolioMetrics.timeWeightedReturn.toFixed(1)}%`,
      subtitle: 'Annual return',
      icon: <Award size={20} />,
      trend: portfolioMetrics.timeWeightedReturn,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          index={index}
        />
      ))}
    </div>
  );
};
