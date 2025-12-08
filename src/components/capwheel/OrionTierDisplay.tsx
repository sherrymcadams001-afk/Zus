/**
 * ORION Tier Display Component
 * 
 * Shows ONLY current tier on main dashboard
 * Links to Profile page for full tier comparison
 */

import { motion } from 'framer-motion';
import { Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';

export const OrionTierDisplay = () => {
  const { data, isLoading } = useDashboardData({ pollingInterval: 60000 });
  const navigate = useNavigate();

  const tierColors: Record<string, { border: string; bg: string; text: string; glow: string }> = {
    protobot: { 
      border: 'border-slate-500/30', 
      bg: 'bg-slate-500/10', 
      text: 'text-slate-400',
      glow: 'shadow-[0_0_20px_rgba(148,163,184,0.1)]'
    },
    chainpulse: { 
      border: 'border-[#00B8D4]/30', 
      bg: 'bg-[#00B8D4]/10', 
      text: 'text-[#00B8D4]',
      glow: 'shadow-[0_0_20px_rgba(0,184,212,0.15)]'
    },
    titan: { 
      border: 'border-purple-500/30', 
      bg: 'bg-purple-500/10', 
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]'
    },
    omega: { 
      border: 'border-[#00FF9D]/30', 
      bg: 'bg-[#00FF9D]/10', 
      text: 'text-[#00FF9D]',
      glow: 'shadow-[0_0_20px_rgba(0,255,157,0.15)]'
    },
  };

  const colors = tierColors[data.currentTier] || tierColors.chainpulse;

  return (
    <div className="bg-[#0F1419] border border-white/5 rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Current Plan
        </h3>
      </div>

      {/* Current Tier Display */}
      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Loading tier...
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-4 rounded-lg border transition-all ${colors.border} ${colors.bg} ${colors.glow} h-full flex flex-col`}
          >
            {/* Tier Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${colors.text}`} />
                <h4 className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>
                  {data.tierConfig.name}
                </h4>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${colors.bg} ${colors.text}`}>
                ACTIVE
              </span>
            </div>

            {/* Key Metrics */}
            <div className="space-y-3 mb-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Daily ROI Range</span>
                <span className={`font-mono font-bold text-sm ${colors.text}`}>
                  {(data.tierConfig.dailyRoiMin * 100).toFixed(2)}% - {(data.tierConfig.dailyRoiMax * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Current Stake</span>
                <span className="font-mono font-semibold text-sm text-white">
                  ${data.aum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Lock Period</span>
                <span className="font-mono text-sm text-slate-400">
                  {data.tierConfig.capitalWithdrawalDays} days
                </span>
              </div>
            </div>

            {/* View All Tiers Button */}
            <button
              onClick={() => navigate('/capwheel/profile')}
              className="w-full group px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              View All Tiers
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
        <p className="text-[9px] text-slate-500 text-center">
          Upgrade tiers for higher returns and benefits
        </p>
      </div>
    </div>
  );
};
