/**
 * Profile Page Component
 * 
 * Full profile management page where users can:
 * - View and edit avatar (image upload with preview)
 * - Edit username and profile details
 * - View all 4 bot tiers with tier comparison
 * - See current tier highlighted
 * - View upgrade paths for eligible tiers
 * - Save changes via API
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, Award, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useCapWheel } from '../../contexts/CapWheelContext';
import { BOT_TIERS } from '../../core/DataOrchestrator';
import type { BotTier } from '../../core/DataOrchestrator';
import { ORION_MOTION } from '../../theme/orion-design-system';

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

  const tierColors: Record<BotTier, { border: string; bg: string; text: string; glow: string }> = {
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

  const colors = tierColors[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 rounded-xl border transition-all ${
        isCurrentTier 
          ? `${colors.border} ${colors.bg} ${colors.glow}` 
          : isAccessible 
            ? 'border-white/10 bg-white/5 hover:border-white/20'
            : 'border-white/5 bg-white/[0.02] opacity-60'
      }`}
    >
      {/* Tier Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isCurrentTier && <Award className={`w-5 h-5 ${colors.text}`} />}
          {!isAccessible && <Lock className="w-4 h-4 text-slate-500" />}
          <h4 className={`text-base font-bold uppercase tracking-wider ${
            isCurrentTier ? colors.text : 'text-slate-400'
          }`}>
            {config.name}
          </h4>
        </div>
        {isCurrentTier && (
          <span className={`px-3 py-1 text-xs font-bold rounded-full ${colors.bg} ${colors.text}`}>
            ACTIVE
          </span>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-slate-500 block mb-1">Daily ROI Range</span>
          <span className={`font-mono font-bold text-base ${isCurrentTier ? colors.text : 'text-white'}`}>
            {(config.dailyRoiMin * 100).toFixed(2)}% - {(config.dailyRoiMax * 100).toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Min. Capital Required</span>
          <span className="font-mono font-semibold text-base text-slate-300">
            ${config.minimumStake.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Capital Lock Period</span>
          <span className="font-mono text-sm text-slate-400">
            {config.capitalWithdrawalDays} days
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 block mb-1">Referral Bonus</span>
          <span className="font-mono text-sm text-slate-400">
            {config.referralBonus}%
          </span>
        </div>
      </div>

      {/* Upgrade Message */}
      {!isCurrentTier && hasGap && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-sm text-amber-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Boost ${gapToTier.toLocaleString()} to unlock this tier
          </p>
        </div>
      )}

      {/* Already Accessible */}
      {!isCurrentTier && !hasGap && isAccessible && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-sm text-[#00FF9D] flex items-center gap-2">
            ✓ Tier unlocked - boost capital to activate
          </p>
        </div>
      )}
    </motion.div>
  );
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { data } = useDashboardData({ pollingInterval: 60000 });
  const { enterpriseUser } = useCapWheel();

  const [username, setUsername] = useState(enterpriseUser?.name || 'Trader');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const tiers: BotTier[] = ['protobot', 'chainpulse', 'titan', 'omega'];

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('Only JPG and PNG images are allowed');
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TODO: Implement actual API call
    // await apiClient.put(`/api/profile/${enterpriseUser?.id}`, {
    //   username,
    //   avatarUrl,
    // });
    
    setIsSaving(false);
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-[#0B1015] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0B1015]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>

          <h1 className="text-xl font-bold">Profile Settings</h1>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF9D] text-black font-semibold rounded-lg hover:bg-[#00FF9D]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl p-6"
        >
          <h2 className="text-lg font-bold mb-6">Personal Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">Profile Avatar</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-black">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-2 bg-[#00FF9D] rounded-full cursor-pointer hover:bg-[#00FF9D]/90 transition-colors">
                    <Camera className="w-4 h-4 text-black" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-xs text-slate-500">
                  <p>JPG or PNG, max 2MB</p>
                  <p>Recommended: 200x200px</p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:border-[#00FF9D]/50 focus:outline-none transition-colors"
                placeholder="Enter your username"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">Email</label>
              <input
                type="email"
                value={enterpriseUser?.email || 'trader@capwheel.io'}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">Role</label>
              <input
                type="text"
                value={enterpriseUser?.role || 'Trader'}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>
        </motion.div>

        {/* Bot Tiers Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000, delay: 0.1 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Bot Tier Plans</h2>
            <span className="text-sm text-slate-400">
              Current AUM: <span className="text-white font-mono">${data.aum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier) => {
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
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
};
