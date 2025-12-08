/**
 * User Profile Widget Component
 * 
 * Displays user avatar, username, and current tier badge
 * Position: Bottom-left on desktop, top-right on mobile
 * Click action: Navigate to /capwheel/profile
 */

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { ORION_MOTION } from '../../theme/orion-design-system';

// Constants
const DEFAULT_USERNAME = 'Trader';

interface UserProfileWidgetProps {
  variant?: 'desktop' | 'mobile';
}

export const UserProfileWidget = ({ variant = 'desktop' }: UserProfileWidgetProps) => {
  const navigate = useNavigate();
  const { data } = useDashboardData({ pollingInterval: 60000 });
  const { enterpriseUser } = useCapWheel();

  const tierColors: Record<string, string> = {
    protobot: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    chainpulse: 'bg-[#00B8D4]/20 text-[#00B8D4] border-[#00B8D4]/30',
    titan: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    omega: 'bg-[#00FF9D]/20 text-[#00FF9D] border-[#00FF9D]/30',
  };

  // Default to chainpulse as it's the most common starter tier after protobot
  const tierColor = tierColors[data.currentTier] || tierColors.chainpulse;
  const avatarSize = variant === 'desktop' ? 'w-12 h-12' : 'w-10 h-10';
  const username = enterpriseUser?.name || DEFAULT_USERNAME;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: ORION_MOTION.duration.normal / 1000 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/capwheel/profile')}
      className={`
        flex items-center gap-3 p-3 rounded-xl
        bg-white/5 border border-white/10
        hover:bg-white/10 hover:border-white/20
        transition-all duration-200
        ${variant === 'desktop' ? 'fixed bottom-4 left-4 z-40' : ''}
      `}
    >
      {/* Avatar */}
      <div className={`${avatarSize} rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center flex-shrink-0`}>
        <User className={`${variant === 'desktop' ? 'w-6 h-6' : 'w-5 h-5'} text-black`} />
      </div>

      {/* User Info */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-semibold text-white truncate max-w-[120px]">
          {username}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierColor}`}>
          {data.tierConfig.name} Active
        </span>
      </div>
    </motion.button>
  );
};
