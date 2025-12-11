/**
 * Executive Summary Component
 * 
 * Top-level metric cards displaying key portfolio performance indicators
 * 
 * Enterprise UI/UX Principles:
 * - Gradient accent borders on primary metrics
 * - Animated number ticker with spring interpolation
 * - Rim lighting on card edges for depth
 * - Glow pulse on value updates
 * - Lume-elevation hierarchy
 */

import { motion, useSpring, useTransform, useMotionValue, AnimatePresence } from 'framer-motion';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { useEffect, useRef, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Target, 
  Activity, 
  Award 
} from 'lucide-react';
import { springPhysics, lumeElevation, surgicalAccents } from '../../theme/capwheel';

// Animated number ticker component
const AnimatedValue = ({ value, prefix = '', suffix = '', decimals = 0 }: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  decimals?: number;
}) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, springPhysics.gentle);
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 500);
    }
    motionValue.set(value);
    prevValue.current = value;
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [spring]);

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return `${prefix}${(num / 1000000).toFixed(2)}M${suffix}`;
    }
    if (decimals > 0) {
      return `${prefix}${num.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(num).toLocaleString('en-US')}${suffix}`;
  };

  return (
    <span className={`transition-all duration-300 ${isUpdating ? 'text-[#00FF9D] scale-[1.02]' : ''}`}>
      {formatNumber(displayValue)}
    </span>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  rawValue?: number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  index: number;
  isPrimary?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  valueDecimals?: number;
}

const MetricCard = ({ 
  title, 
  value, 
  rawValue,
  subtitle, 
  trend, 
  icon, 
  index,
  isPrimary = false,
  valuePrefix = '',
  valueSuffix = '',
  valueDecimals = 0
}: MetricCardProps) => {
  const trendColor = trend && trend > 0 ? 'text-[#00FF9D]' : 'text-red-400';
  const trendSign = trend && trend > 0 ? '+' : '';
  const trendBg = trend && trend > 0 ? 'bg-[#00FF9D]/10' : 'bg-red-500/10';

  // Determine lume level based on priority
  const lumeLevel = isPrimary ? lumeElevation.lume3 : lumeElevation.lume2;
  const accentConfig = isPrimary ? surgicalAccents.primary : surgicalAccents.tertiary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.06, 
        type: 'spring',
        ...springPhysics.gentle
      }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { type: 'spring', ...springPhysics.snappy }
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-2xl p-5 transition-all duration-300 group overflow-hidden ${
        isPrimary 
          ? 'bg-gradient-to-br from-[#0F1419] via-[#111820] to-[#0D1318]' 
          : 'bg-[#0F1419]/80'
      }`}
      style={{ 
        boxShadow: lumeLevel.boxShadow,
        border: `1px solid ${isPrimary ? 'rgba(0,255,157,0.15)' : 'rgba(255,255,255,0.05)'}`
      }}
    >
      {/* Rim lighting effect */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{
          background: `linear-gradient(135deg, ${accentConfig.glow}15 0%, transparent 50%, ${accentConfig.glow}08 100%)`
        }}
      />
      
      {/* Top gradient accent for primary cards */}
      {isPrimary && (
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/40 to-transparent" />
      )}

      {/* Glow pulse on hover */}
      <div className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
        style={{
          boxShadow: `0 0 30px ${accentConfig.glow}20, inset 0 0 20px ${accentConfig.glow}05`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon with accent glow */}
          <motion.div 
            className={`p-2.5 rounded-xl ${isPrimary ? 'bg-[#00FF9D]/10' : 'bg-white/5'}`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', ...springPhysics.snappy }}
          >
            <div className={isPrimary ? 'text-[#00FF9D]' : 'text-[#D4AF37]'} 
              style={{ filter: isPrimary ? `drop-shadow(0 0 6px ${surgicalAccents.primary.glow}60)` : undefined }}>
              {icon}
            </div>
          </motion.div>
          
          {/* Trend badge with glow */}
          {trend !== undefined && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06 + 0.2, type: 'spring', ...springPhysics.bouncy }}
              className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${trendColor} ${trendBg}`}
              style={{
                boxShadow: trend > 0 
                  ? '0 0 12px rgba(0,255,157,0.2)' 
                  : '0 0 12px rgba(239,68,68,0.2)'
              }}
            >
              {trendSign}{trend.toFixed(2)}%
            </motion.div>
          )}
        </div>

        <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
          {title}
        </h3>

        <div className="space-y-1">
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {rawValue !== undefined ? (
              <AnimatedValue 
                value={rawValue} 
                prefix={valuePrefix} 
                suffix={valueSuffix}
                decimals={valueDecimals}
              />
            ) : (
              value
            )}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-mono tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ExecutiveSummary = () => {
  const { portfolioMetrics } = useCapWheel();

  const metrics = [
    {
      title: 'Total AUM',
      value: '',
      rawValue: portfolioMetrics.totalAUM,
      valuePrefix: '$',
      subtitle: 'Assets Under Management',
      icon: <DollarSign size={20} />,
      trend: undefined,
      isPrimary: true, // Primary metric with enhanced styling
    },
    {
      title: '24h P&L',
      value: '',
      rawValue: portfolioMetrics.dailyPnL,
      valuePrefix: '$',
      subtitle: `${portfolioMetrics.dailyPnLPercent >= 0 ? '+' : ''}${portfolioMetrics.dailyPnLPercent.toFixed(2)}% change`,
      icon: <TrendingUp size={20} />,
      trend: portfolioMetrics.dailyPnLPercent,
      isPrimary: true,
    },
    {
      title: 'Sharpe Ratio',
      value: '',
      rawValue: portfolioMetrics.sharpeRatio,
      valueDecimals: 2,
      subtitle: 'Risk-adjusted returns',
      icon: <BarChart3 size={20} />,
      trend: undefined,
      isPrimary: false,
    },
    {
      title: 'Win Rate',
      value: '',
      rawValue: portfolioMetrics.winRate,
      valueSuffix: '%',
      valueDecimals: 1,
      subtitle: 'Profitable trades',
      icon: <Target size={20} />,
      trend: undefined,
      isPrimary: false,
    },
    {
      title: 'Volatility Captured',
      value: '',
      rawValue: portfolioMetrics.volatilityCaptured,
      valueSuffix: '%',
      valueDecimals: 1,
      subtitle: 'Market volatility harvested',
      icon: <Activity size={20} />,
      trend: undefined,
      isPrimary: false,
    },
    {
      title: 'Time-Weighted Return',
      value: '',
      rawValue: portfolioMetrics.timeWeightedReturn,
      valueSuffix: '%',
      valueDecimals: 1,
      subtitle: 'Annual return',
      icon: <Award size={20} />,
      trend: portfolioMetrics.timeWeightedReturn,
      isPrimary: false,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          rawValue={metric.rawValue}
          valuePrefix={metric.valuePrefix}
          valueSuffix={metric.valueSuffix}
          valueDecimals={metric.valueDecimals}
          subtitle={metric.subtitle}
          icon={metric.icon}
          trend={metric.trend}
          isPrimary={metric.isPrimary}
          index={index}
        />
      ))}
    </motion.div>
  );
};
