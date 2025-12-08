/**
 * Empty State Chart Component
 * 
 * Displays when user has no trading activity yet
 * Encourages user to fund account and start trading
 */

import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ORION_MOTION } from '../../theme/orion-design-system';

export const EmptyStateChart = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ORION_MOTION.duration.normal / 1000 }}
      className="h-full flex flex-col items-center justify-center p-8 bg-[#0F1419] border border-white/5 rounded-xl"
    >
      {/* Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#00FF9D]/20 blur-2xl rounded-full" />
        <div className="relative w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <TrendingUp className="w-8 h-8 text-slate-400" />
          <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#0B1015] border border-white/10 flex items-center justify-center">
            <span className="text-xs text-slate-500">✕</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-6 space-y-2">
        <h3 className="text-lg font-bold text-white">
          No Trading Activity Yet
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          Your wealth performance will appear here once you start trading. Deposit funds to activate your bot tier.
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => navigate('/capwheel/strategy-pools')}
        className="group px-6 py-3 bg-[#00FF9D] text-black font-semibold rounded-lg hover:bg-[#00FF9D]/90 active:scale-[0.98] transition-all flex items-center gap-2"
      >
        Fund Account
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
};
