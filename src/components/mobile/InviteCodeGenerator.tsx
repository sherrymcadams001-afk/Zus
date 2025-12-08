/**
 * Invite Code Generator Component
 * 
 * Generate and share referral codes with copy-to-clipboard functionality
 * Displays tier tracking and partner volume metrics
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Users, Share2, Gift, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useDashboardData } from '../../hooks/useDashboardData';
import { ORION_MOTION, formatCurrency } from '../../theme/orion-design-system';

interface InviteCodeGeneratorProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const InviteCodeGenerator = ({ variant = 'full', className = '' }: InviteCodeGeneratorProps) => {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useDashboardData({ pollingInterval: 60000 });
  const [copied, setCopied] = useState(false);

  // Get the user's referral code from auth store
  const referralCode = user?.referral_code || 'LOADING...';

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers using deprecated execCommand
      // Note: This is deprecated but kept as fallback for maximum compatibility
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const success = document.execCommand('copy');
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Provide manual copy feedback
          console.warn('Automatic copy failed. Please copy manually:', referralCode);
        }
      } catch {
        console.warn('Copy not supported. Referral code:', referralCode);
      }
      document.body.removeChild(textArea);
    }
  }, [referralCode]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: 'Join CapWheel',
      text: `Join CapWheel using my invite code: ${referralCode}`,
      url: `${window.location.origin}/capwheel/register?code=${referralCode}`,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback to copy
      handleCopyCode();
    }
  }, [referralCode, handleCopyCode]);

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Your Invite Code</p>
          <p className="text-sm font-mono font-bold text-[#00FF9D] truncate">{referralCode}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyCode}
          className="p-2 rounded-lg bg-[#00FF9D]/10 text-[#00FF9D] hover:bg-[#00FF9D]/20 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={copied ? 'Copied!' : 'Copy invite code'}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="w-4 h-4" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="w-4 h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }

  return (
    <div className={`bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#00FF9D]/10">
          <Gift className="w-4 h-4 text-[#00FF9D]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Invite Partners</h3>
          <p className="text-[10px] text-slate-500">Earn rewards for referrals</p>
        </div>
      </div>

      {/* Invite Code Section */}
      <div className="p-4 space-y-4">
        {/* Code Display */}
        <div className="bg-[#0B1015] rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Your Invite Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <motion.p 
                key={referralCode}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-mono font-bold tracking-wider text-[#00FF9D]"
              >
                {referralCode}
              </motion.p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyCode}
                className={`
                  p-3 rounded-xl transition-all duration-200 touch-manipulation
                  min-w-[48px] min-h-[48px] flex items-center justify-center
                  ${copied 
                    ? 'bg-[#00FF9D]/20 text-[#00FF9D]' 
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }
                `}
                aria-label={copied ? 'Copied!' : 'Copy invite code'}
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: ORION_MOTION.duration.fast / 1000, ease: ORION_MOTION.easing.default }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: ORION_MOTION.duration.fast / 1000 }}
                    >
                      <Copy className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                className="p-3 rounded-xl bg-[#00FF9D] text-black hover:bg-[#00FF9D]/90 transition-colors touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Share invite code"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Partners Count */}
          <div className="bg-[#0B1015] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Partners</span>
            </div>
            <p className="text-lg font-bold text-white">
              {isLoading ? '—' : data.referralCount || 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active referrals</p>
          </div>

          {/* Partner Volume */}
          <div className="bg-[#0B1015] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Volume</span>
            </div>
            <p className="text-lg font-bold text-white">
              {isLoading ? '—' : formatCurrency(data.partnerVolume, false)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Downstream AUM</p>
          </div>
        </div>

        {/* Tier Info */}
        <div className="bg-gradient-to-r from-[#00FF9D]/5 to-transparent rounded-xl p-3 border border-[#00FF9D]/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Current Tier</p>
              <p className="text-sm font-bold text-[#00FF9D]">{data.tierConfig.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Referral Bonus</p>
              <p className="text-sm font-bold text-white">{data.tierConfig.referralBonus}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeGenerator;
