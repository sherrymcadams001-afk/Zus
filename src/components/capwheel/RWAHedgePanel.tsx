/**
 * RWA Hedge Panel Component
 * 
 * Displays Real World Asset allocation with donut chart and hedge efficiency metrics
 */

import { motion } from 'framer-motion';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { Shield, RefreshCw, TrendingUp, PieChart } from 'lucide-react';

export const RWAHedgePanel = () => {
  const { rwaPositions, hedgeMetrics, toggleAutoRebalance } = useCapWheel();

  // Calculate total RWA value
  const totalRWAValue = rwaPositions.reduce((sum, pos) => sum + pos.value, 0);

  // Donut chart data
  const chartRadius = 80;
  const chartCenterX = 100;
  const chartCenterY = 100;
  const strokeWidth = 20;

  // Colors for each RWA type
  const rwaColors: Record<string, string> = {
    'T-Bills': '#D4AF37',
    'Gold': '#E5C158',
    'Real Estate': '#00D4FF',
    'Private Credit': '#00FF88',
    'Commodities': '#B89421',
  };

  // Calculate donut segments
  let currentAngle = -90; // Start from top
  const segments = rwaPositions.map((position) => {
    const percentage = position.allocation;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = chartCenterX + chartRadius * Math.cos(startRad);
    const y1 = chartCenterY + chartRadius * Math.sin(startRad);
    const x2 = chartCenterX + chartRadius * Math.cos(endRad);
    const y2 = chartCenterY + chartRadius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...position,
      path: `M ${chartCenterX} ${chartCenterY} L ${x1} ${y1} A ${chartRadius} ${chartRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: rwaColors[position.type] || '#888',
    };
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0.1, 1] }}
      className="capwheel-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-capwheel-surface rounded-lg">
            <Shield size={20} className="text-capwheel-gold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">RWA Hedge Allocation</h2>
            <p className="text-xs text-gray-500 font-mono">
              Real World Asset Positions
            </p>
          </div>
        </div>
        <button
          onClick={toggleAutoRebalance}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
            hedgeMetrics.autoRebalanceEnabled
              ? 'bg-capwheel-profit/10 border-capwheel-profit text-capwheel-profit'
              : 'bg-capwheel-surface border-capwheel-border-subtle text-gray-400 hover:border-capwheel-gold'
          }`}
        >
          <RefreshCw size={16} className={hedgeMetrics.autoRebalanceEnabled ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">
            Auto-Rebalance {hedgeMetrics.autoRebalanceEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex flex-col items-center justify-center">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={chartCenterX}
              cy={chartCenterY}
              r={chartRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            
            {/* Segments */}
            {segments.map((segment, index) => (
              <motion.path
                key={segment.id}
                d={segment.path}
                fill={segment.color}
                opacity={0.8}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              />
            ))}
          </svg>

          {/* Center stats */}
          <div className="text-center -mt-32 z-10">
            <p className="text-sm text-gray-400 font-medium mb-1">Total RWA</p>
            <p className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalRWAValue)}
            </p>
            <p className="text-sm text-capwheel-gold font-semibold">
              {hedgeMetrics.totalRWAAllocation}%
            </p>
          </div>
        </div>

        {/* Position List */}
        <div className="space-y-3">
          {rwaPositions.map((position, index) => (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="flex items-center justify-between p-3 bg-capwheel-surface rounded-lg border border-capwheel-border-subtle hover:border-capwheel-gold transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: rwaColors[position.type] }}
                ></div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {position.type}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {position.allocation}% • {formatCurrency(position.value)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-capwheel-profit">
                  {position.yield.toFixed(1)}% APY
                </p>
                {position.maturity && (
                  <p className="text-xs text-gray-500">
                    {formatDate(position.maturity)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hedge Efficiency Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-capwheel-border-subtle">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp size={16} className="text-capwheel-gold" />
            <p className="text-xs text-gray-400">Hedge Efficiency</p>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {hedgeMetrics.hedgeEfficiency.toFixed(1)}%
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <PieChart size={16} className="text-capwheel-electric" />
            <p className="text-xs text-gray-400">Crypto Allocation</p>
          </div>
          <p className="text-xl font-bold text-white font-mono">
            {hedgeMetrics.cryptoAllocation}%
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <RefreshCw size={16} className="text-capwheel-profit" />
            <p className="text-xs text-gray-400">Last Rebalance</p>
          </div>
          <p className="text-xs text-gray-400 font-mono">
            {new Date(hedgeMetrics.lastRebalance).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
