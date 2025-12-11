/**
 * CapWheel Profile Page - Enterprise Edition
 * 
 * Clean, mobile-responsive profile management with:
 * - User info with strategy insignia
 * - Invite code generation for network building
 * - Account settings and security
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Mail,
  Shield,
  Edit2, 
  Save, 
  Loader2,
  Copy,
  Check,
  Plus,
  Clock,
  Users,
  Share2,
  ChevronRight,
  Globe,
  Bell,
  Lock,
  Smartphone
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { StrategyInsignia, getStrategyById } from './StrategyPools';

interface InviteCode {
  id: number;
  code: string;
  status: 'active' | 'used' | 'expired';
  created_at: number;
  expires_at: number;
  used_at: number | null;
}

interface InviteStats {
  totalCreated: number;
  activeCount: number;
  usedCount: number;
  expiredCount: number;
}

export const CapWheelProfile = () => {
  const { user } = useAuthStore();
  const { currentTier } = usePortfolioStore();
  const strategy = getStrategyById(currentTier || 'delta');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    phone: '',
    timezone: '',
    notifications_enabled: true
  });
  
  // Invite code state
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/profile');
        if (res.data.status === 'success') {
          setProfile(res.data.data.profile);
          setFormData({
            username: res.data.data.profile?.username || '',
            bio: res.data.data.profile?.bio || '',
            avatar_url: res.data.data.profile?.avatar_url || '',
            phone: res.data.data.profile?.phone || '',
            timezone: res.data.data.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications_enabled: res.data.data.profile?.notifications_enabled ?? true
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchProfile();
  }, [user]);

  // Fetch invite codes
  useEffect(() => {
    const fetchInviteCodes = async () => {
      try {
        const [codesRes, statsRes] = await Promise.all([
          apiClient.get('/api/invite-codes'),
          apiClient.get('/api/invite-codes/stats')
        ]);
        
        if (codesRes.data.status === 'success') {
          setInviteCodes(codesRes.data.data);
        }
        if (statsRes.data.status === 'success') {
          setInviteStats(statsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch invite codes:', err);
      }
    };
    
    if (user) fetchInviteCodes();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiClient.put('/api/profile', formData);
      if (res.data.status === 'success') {
        setProfile(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInviteCode = async () => {
    setIsCreatingCode(true);
    try {
      const res = await apiClient.post('/api/invite-codes');
      if (res.data.status === 'success') {
        setInviteCodes(prev => [res.data.data.inviteCode, ...prev]);
        setInviteStats(prev => prev ? {
          ...prev,
          totalCreated: prev.totalCreated + 1,
          activeCount: prev.activeCount + 1
        } : null);
      }
    } catch (err) {
      console.error('Failed to create invite code:', err);
    } finally {
      setIsCreatingCode(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatExpiryTime = (expiresAt: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Expiring soon';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-[#00FF9D]';
      case 'used': return 'text-[#00B8D4]';
      case 'expired': return 'text-slate-500';
      default: return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B1015]">
        <Loader2 className="w-8 h-8 text-[#00FF9D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto mobile-scroll bg-[#0B1015]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
              <User className="w-5 h-5 text-[#00FF9D]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Profile</h1>
              <p className="text-xs text-slate-500">Manage your account</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              isEditing 
                ? 'bg-[#00FF9D] text-black hover:bg-[#00E88A]' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              <Save className="w-4 h-4" />
            ) : (
              <Edit2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isEditing ? 'Save' : 'Edit'}</span>
          </motion.button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
        >
          {/* Profile Header */}
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center text-2xl sm:text-3xl font-bold text-black overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.charAt(0).toUpperCase()
                  )}
                </div>
                {/* Strategy Insignia */}
                {strategy && (
                  <div className="absolute -bottom-1 -right-1">
                    <StrategyInsignia strategyId={strategy.id} size="md" />
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-white truncate">
                    {profile?.username || 'Set Username'}
                  </h2>
                  {strategy && (
                    <span 
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded"
                      style={{ 
                        backgroundColor: strategy.color + '20',
                        color: strategy.color
                      }}
                    >
                      {strategy.id}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Member since {profile?.created_at 
                    ? new Date(profile.created_at * 1000).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5" />
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]/20 outline-none transition-colors"
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-white text-sm py-2">{profile?.username || 'Not set'}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                <Mail className="w-3.5 h-3.5" />
                Email
              </label>
              <div className="flex items-center gap-2">
                <p className="text-slate-400 text-sm py-2 flex-1">{user?.email}</p>
                <span className="px-2 py-1 text-[10px] font-medium rounded bg-[#00FF9D]/10 text-[#00FF9D]">
                  Verified
                </span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                <Edit2 className="w-3.5 h-3.5" />
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]/20 outline-none transition-colors resize-none h-20"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-slate-300 text-sm py-2">{profile?.bio || 'No bio yet.'}</p>
              )}
            </div>

            {/* Phone (Editing only) */}
            {isEditing && (
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                  <Smartphone className="w-3.5 h-3.5" />
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]/20 outline-none transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}

            {/* Timezone */}
            {isEditing && (
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  Timezone
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]/20 outline-none transition-colors"
                  placeholder="America/New_York"
                />
              </div>
            )}

            {/* Avatar URL (Editing only) */}
            {isEditing && (
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
                  <User className="w-3.5 h-3.5" />
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-[#00FF9D] focus:ring-1 focus:ring-[#00FF9D]/20 outline-none transition-colors"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Invite Codes Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
        >
          {/* Section Header */}
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00B8D4]/10 rounded-lg">
                  <Share2 className="w-4 h-4 text-[#00B8D4]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Invite Partners</h3>
                  <p className="text-xs text-slate-500">Grow your network with invite codes</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateInviteCode}
                disabled={isCreatingCode}
                className="flex items-center gap-2 px-4 py-2 bg-[#00B8D4]/10 hover:bg-[#00B8D4]/20 border border-[#00B8D4]/30 rounded-lg text-[#00B8D4] text-sm font-medium transition-colors"
              >
                {isCreatingCode ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Request Invite</span>
              </motion.button>
            </div>

            {/* Stats */}
            {inviteStats && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#00FF9D]">{inviteStats.activeCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Active</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-[#00B8D4]">{inviteStats.usedCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Used</p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{inviteStats.totalCreated}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Total</p>
                </div>
              </div>
            )}
          </div>

          {/* Invite Codes List */}
          <div className="divide-y divide-white/5">
            {inviteCodes.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No invite codes yet</p>
                <p className="text-xs text-slate-500 mt-1">Request an invite to share with partners</p>
              </div>
            ) : (
              <AnimatePresence>
                {inviteCodes.slice(0, 5).map((code, index) => (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        code.status === 'active' ? 'bg-[#00FF9D]/10' : 
                        code.status === 'used' ? 'bg-[#00B8D4]/10' : 'bg-slate-800'
                      }`}>
                        {code.status === 'active' ? (
                          <Clock className="w-4 h-4 text-[#00FF9D]" />
                        ) : code.status === 'used' ? (
                          <Check className="w-4 h-4 text-[#00B8D4]" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-mono text-sm text-white">{code.code}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium uppercase ${getStatusColor(code.status)}`}>
                            {code.status}
                          </span>
                          {code.status === 'active' && (
                            <span className="text-[10px] text-slate-500">
                              • {formatExpiryTime(code.expires_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {code.status === 'active' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => copyToClipboard(code.code)}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4 text-[#00FF9D]" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* View All Link */}
          {inviteCodes.length > 5 && (
            <div className="p-4 border-t border-white/5">
              <button className="flex items-center gap-2 text-sm text-[#00B8D4] hover:text-[#00B8D4]/80 transition-colors mx-auto">
                View all {inviteCodes.length} codes
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Account Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Account & Security</h3>
                <p className="text-xs text-slate-500">Manage your account settings</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {/* Notifications */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-white">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive updates about your account</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({...formData, notifications_enabled: !formData.notifications_enabled})}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  formData.notifications_enabled ? 'bg-[#00FF9D]' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                  formData.notifications_enabled ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>

            {/* Change Password */}
            <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-white">Change Password</p>
                  <p className="text-xs text-slate-500">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* Two-Factor Auth */}
            <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security</p>
                </div>
              </div>
              <span className="px-2 py-1 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-500">
                Not Set
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          <p className="text-[10px] text-slate-600 font-mono">
            CAPWHEEL • ACCOUNT ID: {user?.id || '---'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CapWheelProfile;
