/**
 * Strategy Pools - Kinetic Strategies
 * 
 * 2x2 Bento Grid layout for the 4 Kinetic strategy tiers
 * With Yield Projection Engine calculator
 */

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  Crown,
  Lock,
  Calculator,
  DollarSign,
  Calendar,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { apiClient } from '../../api/client';
import { usePortfolioStore } from '../../store/usePortfolioStore';

// Strategy tier configuration - mapped from Kinetic tiers
export interface StrategyConfig {
  id: 'delta' | 'gamma' | 'alpha' | 'omega';
  name: string;
  tagline: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  icon: React.ReactNode;
  minimumStake: number;
  dailyRoiMin: number;
  dailyRoiMax: number;
  capitalWithdrawalDays: number;
  features: string[];
  isHighlighted?: boolean;
  isRestricted?: boolean;
}

export const KINETIC_STRATEGIES: StrategyConfig[] = [
  {
    id: 'delta',
    name: 'KINETIC DELTA',
    tagline: 'Conservative Growth',
    color: '#6B7FD7',
    bgGradient: 'from-[#6B7FD7]/10 to-transparent',
    borderColor: 'border-[#6B7FD7]/30',
    icon: <Shield className="w-6 h-6" />,
    minimumStake: 100,
    dailyRoiMin: 0.008,
    dailyRoiMax: 0.0096,
    capitalWithdrawalDays: 40,
    features: ['Low risk entry', '0.8% - 0.96% daily', '40-day capital lock'],
  },
  {
    id: 'gamma',
    name: 'KINETIC GAMMA',
    tagline: 'Balanced Momentum',
    color: '#00B8D4',
    bgGradient: 'from-[#00B8D4]/10 to-transparent',
    borderColor: 'border-[#00B8D4]/30',
    icon: <TrendingUp className="w-6 h-6" />,
    minimumStake: 4000,
    dailyRoiMin: 0.0096,
    dailyRoiMax: 0.0112,
    capitalWithdrawalDays: 45,
    features: ['Optimized returns', '0.96% - 1.12% daily', '45-day capital lock'],
  },
  {
    id: 'alpha',
    name: 'KINETIC ALPHA',
    tagline: 'Aggressive Performance',
    color: '#00FF9D',
    bgGradient: 'from-[#00FF9D]/15 to-transparent',
    borderColor: 'border-[#00FF9D]/50',
    icon: <Zap className="w-6 h-6" />,
    minimumStake: 25000,
    dailyRoiMin: 0.0112,
    dailyRoiMax: 0.0128,
    capitalWithdrawalDays: 65,
    features: ['Maximum velocity', '1.12% - 1.28% daily', '65-day capital lock'],
    isHighlighted: true,
  },
  {
    id: 'omega',
    name: 'KINETIC OMEGA',
    tagline: 'Elite Reserved',
    color: '#D4AF37',
    bgGradient: 'from-[#3A3A3A]/20 to-transparent',
    borderColor: 'border-[#3A3A3A]/50',
    icon: <Crown className="w-6 h-6" />,
    minimumStake: 50000,
    dailyRoiMin: 0.018,
    dailyRoiMax: 0.018,
    capitalWithdrawalDays: 85,
    features: ['Fixed 1.8% daily', 'Priority support', 'Invite only'],
    isRestricted: true,
  },
];

// Get strategy by ID
export const getStrategyById = (id: string): StrategyConfig | undefined => {
  return KINETIC_STRATEGIES.find(s => s.id === id);
};

// Insignia component for profile/sidebar display
export const StrategyInsignia = ({ 
  strategyId, 
  size = 'md',
  showLabel = false 
}: { 
  strategyId: string; 
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) => {
  const strategy = KINETIC_STRATEGIES.find(s => s.id === strategyId);
  if (!strategy) return null;

  const sizeClasses = {
    sm: 'w-5 h-5 text-[7px]',
    md: 'w-7 h-7 text-[9px]',
    lg: 'w-10 h-10 text-xs',
  };

  return (
    <div className="flex items-center gap-1.5">
      <div 
        className={`${sizeClasses[size]} rounded flex items-center justify-center font-bold tracking-wider`}
        style={{ 
          backgroundColor: strategy.color + '25',
          color: strategy.color,
          border: `1px solid ${strategy.color}50`
        }}
      >
        {strategy.id.charAt(0).toUpperCase()}
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium" style={{ color: strategy.color }}>
          {strategy.id.toUpperCase()}
        </span>
      )}
    </div>
  );
};

// Strategy Card Component
const StrategyCard = ({ 
  strategy, 
  isSelected,
  isEligible,
  onSelect,
  isSelecting
}: { 
  strategy: StrategyConfig;
  isSelected: boolean;
  isEligible: boolean;
  onSelect: () => void;
  isSelecting: boolean;
}) => {
  const dailyRoiDisplay = strategy.dailyRoiMin === strategy.dailyRoiMax
    ? `${(strategy.dailyRoiMin * 100).toFixed(1)}%`
    : `${(strategy.dailyRoiMin * 100).toFixed(2)}% - ${(strategy.dailyRoiMax * 100).toFixed(2)}%`;

  const canSelect = isEligible && !strategy.isRestricted && !isSelected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={canSelect ? { scale: 1.02, y: -4 } : undefined}
      className="relative h-full"
    >
      <Card 
        className={`
          relative overflow-hidden p-5 h-full flex flex-col
          bg-gradient-to-br ${strategy.bgGradient}
          ${strategy.borderColor}
          ${strategy.isHighlighted ? 'ring-2 ring-[#00FF9D]/30' : ''}
          ${isSelected ? 'ring-2 ring-white/50' : ''}
          ${strategy.isRestricted || !isEligible ? 'opacity-60' : ''}
          ${canSelect ? 'cursor-pointer hover:border-opacity-60' : 'cursor-not-allowed'}
          transition-all duration-300
        `}
      >
        {/* Highlighted glow effect for Alpha */}
        {strategy.isHighlighted && (
          <div className="absolute inset-0 bg-[#00FF9D]/5 animate-pulse" />
        )}

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 z-20">
            <div className="w-6 h-6 rounded-full bg-[#00FF9D] flex items-center justify-center">
              <Check className="w-4 h-4 text-black" />
            </div>
          </div>
        )}

        {/* Restricted overlay for Omega */}
        {strategy.isRestricted && (
          <div className="absolute top-3 right-3">
            <Lock className="w-4 h-4 text-gray-500" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div 
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: strategy.color + '20' }}
          >
            <div style={{ color: strategy.color }}>
              {strategy.icon}
            </div>
          </div>
          <div className="text-right">
            <div 
              className="text-2xl font-bold font-mono"
              style={{ color: strategy.isRestricted ? '#6B7280' : strategy.color }}
            >
              {dailyRoiDisplay}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Daily Return</div>
          </div>
        </div>

        {/* Title */}
        <h3 
          className="text-lg font-bold tracking-wide mb-1"
          style={{ color: strategy.isRestricted ? '#9CA3AF' : strategy.color }}
        >
          {strategy.name}
        </h3>
        <p className="text-xs text-gray-500 mb-4">{strategy.tagline}</p>

        {/* Minimum Stake */}
        <div className="bg-black/30 rounded-lg p-3 mb-4">
          <div className="text-[10px] text-gray-500 uppercase mb-1">Minimum Capital</div>
          <div className="text-lg font-bold text-white font-mono">
            ${strategy.minimumStake.toLocaleString()}
          </div>
          {!isEligible && !strategy.isRestricted && (
            <p className="text-[10px] text-red-400 mt-1">Insufficient balance</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {strategy.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-gray-400">
              <div 
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: strategy.color }}
              />
              {feature}
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {!strategy.isRestricted && (
          <button
            onClick={canSelect ? onSelect : undefined}
            disabled={!canSelect || isSelecting}
            className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
              ${isSelected 
                ? 'bg-white/10 text-white border border-white/20' 
                : canSelect 
                  ? 'hover:opacity-90' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            style={!isSelected ? { 
              backgroundColor: strategy.color + '20',
              color: strategy.color,
              border: `1px solid ${strategy.color}40`
            } : undefined}
          >
            {isSelecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSelected ? (
              <>
                <Check className="w-4 h-4" />
                Active Strategy
              </>
            ) : (
              'Select Strategy'
            )}
          </button>
        )}

        {strategy.isRestricted && (
          <div className="w-full mt-4 py-2.5 rounded-lg font-semibold text-sm text-center bg-gray-800/50 text-gray-500 border border-gray-700">
            Invite Only
          </div>
        )}
      </Card>
    </motion.div>
  );
};

// Yield Projection Engine Component
const YieldProjectionEngine = () => {
  const [capital, setCapital] = useState(5000);
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState(0);

  const availableStrategies = KINETIC_STRATEGIES.filter(s => !s.isRestricted);
  const selectedStrategy = availableStrategies[selectedStrategyIndex];

  const projections = useMemo(() => {
    const avgDailyRoi = (selectedStrategy.dailyRoiMin + selectedStrategy.dailyRoiMax) / 2;
    const dailyPayout = capital * avgDailyRoi;
    const tradingDaysPerMonth = 26;
    const monthlyPayout = dailyPayout * tradingDaysPerMonth;
    const tradingDaysPerYear = 312;
    let annualCompounded = capital;
    for (let i = 0; i < tradingDaysPerYear; i++) {
      annualCompounded *= (1 + avgDailyRoi);
    }
    
    return {
      daily: dailyPayout,
      monthly: monthlyPayout,
      annual: annualCompounded - capital,
      annualTotal: annualCompounded,
    };
  }, [capital, selectedStrategy]);

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(2) + 'M';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-[#0F1419] border-white/5 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#00FF9D]/10 rounded-xl">
            <Calculator className="w-5 h-5 text-[#00FF9D]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Yield Projection Engine</h3>
            <p className="text-xs text-gray-500">Calculate your potential returns</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Initial Capital
              </label>
              <Input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Math.max(100, Number(e.target.value)))}
                className="text-lg font-mono"
                min={100}
                step={100}
              />
              <p className="text-[10px] text-gray-500 mt-1">Minimum: $100</p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase mb-3">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Select Strategy
              </label>
              
              <div className="flex justify-between mb-2 px-1">
                {availableStrategies.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStrategyIndex(idx)}
                    className={`text-[10px] font-medium transition-all ${
                      selectedStrategyIndex === idx ? 'scale-110' : 'text-gray-500 hover:text-gray-400'
                    }`}
                    style={{ color: selectedStrategyIndex === idx ? s.color : undefined }}
                  >
                    {s.id.toUpperCase()}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={0}
                max={availableStrategies.length - 1}
                value={selectedStrategyIndex}
                onChange={(e) => setSelectedStrategyIndex(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${selectedStrategy.color} 0%, ${selectedStrategy.color} ${(selectedStrategyIndex / (availableStrategies.length - 1)) * 100}%, #374151 ${(selectedStrategyIndex / (availableStrategies.length - 1)) * 100}%, #374151 100%)`
                }}
              />

              <div 
                className="mt-3 p-3 rounded-lg border"
                style={{ 
                  backgroundColor: selectedStrategy.color + '10',
                  borderColor: selectedStrategy.color + '30'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: selectedStrategy.color }}>
                    {selectedStrategy.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {((selectedStrategy.dailyRoiMin + selectedStrategy.dailyRoiMax) / 2 * 100).toFixed(2)}% avg daily
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">Daily Payout</span>
                </div>
                <span className="text-xl font-bold text-white font-mono">
                  {formatCurrency(projections.daily)}
                </span>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">Monthly Payout</span>
                </div>
                <span className="text-xl font-bold text-white font-mono">
                  {formatCurrency(projections.monthly)}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Based on 26 trading days/month</p>
            </div>

            <div className="relative bg-black/30 rounded-lg p-4 border border-[#00FF9D]/30 overflow-hidden">
              <div className="absolute inset-0 bg-[#00FF9D]/5 animate-pulse" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00FF9D]" />
                    <span className="text-xs text-[#00FF9D]">Annual (Compounded)</span>
                  </div>
                  <span className="text-2xl font-bold text-[#00FF9D] font-mono animate-pulse">
                    {formatCurrency(projections.annualTotal)}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-gray-500">Net profit from ${capital.toLocaleString()}</p>
                  <p className="text-xs text-[#00FF9D]/80 font-mono">
                    +{formatCurrency(projections.annual)}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center mt-4">
              *Projections based on historical performance. Returns may vary.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Main Strategy Pools Component
export const StrategyPools = () => {
  const { walletBalance, currentTier, setCurrentTier } = usePortfolioStore();
  const [currentStrategy, setCurrentStrategy] = useState<string>('delta');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const userBalance = walletBalance;

  // Load current strategy from store
  useEffect(() => {
    if (currentTier) {
      // Map old tier names to new Kinetic names
      const tierMap: Record<string, string> = {
        protobot: 'delta',
        chainpulse: 'gamma',
        titan: 'alpha',
        omega: 'omega',
        delta: 'delta',
        gamma: 'gamma',
        alpha: 'alpha',
      };
      const mapped = tierMap[currentTier] || 'delta';
      setCurrentStrategy(mapped);
    }
  }, [currentTier]);

  const handleSelectStrategy = async (strategyId: string) => {
    setIsSelecting(true);
    setSelectingId(strategyId);

    try {
      const res = await apiClient.post('/api/profile/strategy', { tier: strategyId });
      if (res.data.status === 'success') {
        setCurrentStrategy(strategyId);
        setCurrentTier(strategyId);
      }
    } catch (error) {
      console.error('Failed to select strategy:', error);
    } finally {
      setIsSelecting(false);
      setSelectingId(null);
    }
  };

  return (
    <div className="min-h-full p-4 lg:p-6 space-y-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h1 className="text-2xl font-bold text-white tracking-tight">Strategy Pools</h1>
        <p className="text-sm text-gray-500">Select your Kinetic strategy to optimize returns</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {KINETIC_STRATEGIES.map((strategy, idx) => (
          <motion.div
            key={strategy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <StrategyCard 
              strategy={strategy}
              isSelected={currentStrategy === strategy.id}
              isEligible={userBalance >= strategy.minimumStake}
              onSelect={() => handleSelectStrategy(strategy.id)}
              isSelecting={isSelecting && selectingId === strategy.id}
            />
          </motion.div>
        ))}
      </div>

      <YieldProjectionEngine />
    </div>
  );
};

export default StrategyPools;
