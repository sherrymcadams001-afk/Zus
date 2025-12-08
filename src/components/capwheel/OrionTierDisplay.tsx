/**
 * ORION Tier Display Component
 * 
 * Shows current plan/tier status with upgrade messaging
 * Creates psychological pressure to upgrade through tier comparison
 */

import { motion } from 'framer-motion';
import { Award, TrendingUp, Lock } from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { BOT_TIERS } from '../../core/DataOrchestrator';
import type { BotTier } from '../../core/DataOrchestrator';

interface TierCardProps {
  tier: BotTier;
  config: typeof BOT_TIERS[BotTier];
  isCurrentTier: boolean;
  isAccessible: boolean;
  currentAUM: number;
}

const TierCard = ({ tier, config, isCurrentTier, isAccessible, currentAUM }: TierCardProps) => {
  const gapToTier = config.minimumStake - currentAUM;
  const hasGap = gapToTier > 0;

  const tierColors: Record<BotTier, { border: string; bg: string; text: string }> = {
    protobot: { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400' },
    chainpulse: { border: 'border-[#00B8D4]/30', bg: 'bg-[#00B8D4]/10', text: 'text-[#00B8D4]' },
    titan: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400' },
    omega: { border: 'border-[#00FF9D]/30', bg: 'bg-[#00FF9D]/10', text: 'text-[#00FF9D]' },
  };

  const colors = tierColors[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-3 rounded-lg border transition-all ${
        isCurrentTier 
          ? `${colors.border} ${colors.bg} shadow-[0_0_20px_rgba(0,255,157,0.1)]` 
          : isAccessible 
            ? 'border-white/10 bg-white/5 hover:border-white/20'
            : 'border-white/5 bg-white/[0.02] opacity-60'
      }`}
    >
      {/* Tier Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCurrentTier && <Award className={`w-3 h-3 ${colors.text}`} />}
          {!isAccessible && <Lock className="w-3 h-3 text-slate-500" />}
          <h4 className={`text-xs font-bold uppercase tracking-wider ${
            isCurrentTier ? colors.text : 'text-slate-400'
          }`}>
            {config.name}
          </h4>
        </div>
        {isCurrentTier && (
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${colors.bg} ${colors.text}`}>
            CURRENT
          </span>
        )}
      </div>

      {/* Key Metrics */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Daily ROI</span>
          <span className="font-mono font-bold text-white">
            {(config.dailyRoiMax * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Min. Capital</span>
          <span className="font-mono font-semibold text-slate-300">
            ${config.minimumStake.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Lock Period</span>
          <span className="font-mono text-slate-400">
            {config.capitalWithdrawalDays}d
          </span>
        </div>
      </div>

      {/* Upgrade Message */}
      {!isCurrentTier && hasGap && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-amber-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Boost ${gapToTier.toLocaleString()} to unlock
          </p>
        </div>
      )}

      {/* Already Accessible */}
      {!isCurrentTier && !hasGap && isAccessible && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[9px] text-[#00FF9D] flex items-center gap-1">
            ✓ Available - boost to activate
          </p>
        </div>
      )}
    </motion.div>
  );
};

export const OrionTierDisplay = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 60000 });

  const tiers: BotTier[] = ['protobot', 'chainpulse', 'titan', 'omega'];

  return (
    <div className="bg-[#0F1419] border border-white/5 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Current Plan
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            AUM: ${data.aum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Tier Grid */}
      <div className="p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-500 text-xs">
            Loading tiers...
          </div>
        ) : (
          tiers.map((tier) => {
            const config = BOT_TIERS[tier];
            const isCurrentTier = tier === data.currentTier;
            const isAccessible = data.aum >= config.minimumStake;

            return (
              <TierCard
                key={tier}
                tier={tier}
                config={config}
                isCurrentTier={isCurrentTier}
                isAccessible={isAccessible}
                currentAUM={data.aum}
              />
            );
          })
        )}
      </div>

      {/* Footer Message */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[9px] text-slate-500 text-center">
          Boost capital to unlock higher tiers and increased daily returns
        </p>
      </div>
    </div>
  );
};
