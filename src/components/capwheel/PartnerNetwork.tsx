/**
 * Partner Network Page - Enterprise Edition
 * 
 * Network visualization and partner management with:
 * - Network tier tracking
 * - Partner volume by level
 * - Commission history
 * - Invite code integration
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Loader2,
  GitBranch,
  Award,
  BarChart3,
  Clock,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { OrionSidebar } from './OrionSidebar';
import { MobileNavDrawer, SwipeEdgeDetector } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { Menu, ArrowLeft } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  directReferrals: number;
  totalVolume: number;
  totalCommissions: number;
  pendingCommissions: number;
}

interface VolumeByLevel {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  created_at: number;
}

// Commission rates by level
const COMMISSION_RATES: Record<number, number> = {
  1: 10,  // 10% for direct referrals
  2: 5,   // 5% for level 2
  3: 3,   // 3% for level 3
  4: 2,   // 2% for level 4
  5: 1,   // 1% for level 5
};

const LEVEL_COLORS: Record<number, string> = {
  1: '#00FF9D',
  2: '#00B8D4',
  3: '#6B7FD7',
  4: '#D4AF37',
  5: '#FF6B6B',
};

const PartnerNetworkContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [volumeByLevel, setVolumeByLevel] = useState<VolumeByLevel | null>(null);
  const [directReferrals, setDirectReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    const fetchNetworkData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, volumeRes, referralsRes] = await Promise.all([
          apiClient.get('/api/referrals/stats'),
          apiClient.get('/api/referrals/volume/breakdown'),
          apiClient.get('/api/referrals')
        ]);
        
        if (statsRes.data.status === 'success') {
          setStats(statsRes.data.data);
        }
        if (volumeRes.data.status === 'success') {
          setVolumeByLevel(volumeRes.data.data);
        }
        if (referralsRes.data.status === 'success') {
          setDirectReferrals(referralsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch network data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchNetworkData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0B1015]">
        <Loader2 className="w-8 h-8 text-[#00FF9D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B1015]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00B8D4]/10 rounded-lg">
              <Users className="w-5 h-5 text-[#00B8D4]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Partner Network</h1>
              <p className="text-xs text-slate-500">Grow and manage your network</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/capwheel/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-[#00B8D4]/10 hover:bg-[#00B8D4]/20 border border-[#00B8D4]/30 rounded-lg text-[#00B8D4] text-sm font-medium transition-colors"
          >
            <span className="hidden sm:inline">Generate Invite</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {/* Total Partners */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#00FF9D]" />
              <span className="text-xs text-slate-500 uppercase">Total Partners</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.totalReferrals ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.directReferrals ?? 0} direct
            </p>
          </div>

          {/* Total Volume */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#00B8D4]" />
              <span className="text-xs text-slate-500 uppercase">Network Volume</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.totalVolume ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all levels</p>
          </div>

          {/* Total Commissions */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs text-slate-500 uppercase">Earned</span>
            </div>
            <p className="text-2xl font-bold text-[#00FF9D]">
              {formatCurrency(stats?.totalCommissions ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total commissions</p>
          </div>

          {/* Pending Commissions */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-slate-500 uppercase">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">
              {formatCurrency(stats?.pendingCommissions ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Awaiting payout</p>
          </div>
        </motion.div>

        {/* Network Tier Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#6B7FD7]/10 rounded-lg">
                <GitBranch className="w-4 h-4 text-[#6B7FD7]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Network Tier Breakdown</h3>
                <p className="text-xs text-slate-500">Volume and commission rates by level</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((level) => {
                const volume = volumeByLevel?.[level as keyof VolumeByLevel] ?? 0;
                const maxVolume = Math.max(...Object.values(volumeByLevel ?? { 1: 1 }), 1);
                const percentage = (volume / maxVolume) * 100;
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ 
                            backgroundColor: LEVEL_COLORS[level] + '20',
                            color: LEVEL_COLORS[level]
                          }}
                        >
                          L{level}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">
                            Level {level} {level === 1 ? '(Direct)' : ''}
                          </p>
                          <p className="text-xs text-slate-500">
                            {COMMISSION_RATES[level]}% commission rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(volume)}</p>
                        <p className="text-xs text-slate-500">Volume</p>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: LEVEL_COLORS[level] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + level * 0.1, duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Direct Partners List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl overflow-hidden"
        >
          <div className="p-4 sm:p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
                  <Award className="w-4 h-4 text-[#00FF9D]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Partners</h3>
                  <p className="text-xs text-slate-500">{directReferrals.length} partners in your network</p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {directReferrals.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">No partners yet</p>
                <p className="text-xs text-slate-500">
                  Share your invite codes to grow your network
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/capwheel/profile')}
                  className="mt-4 px-4 py-2 bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded-lg text-[#00FF9D] text-sm font-medium transition-colors"
                >
                  Get Invite Codes
                </motion.button>
              </div>
            ) : (
              directReferrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FF9D]/20 to-[#00B8D4]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">Partner #{referral.referred_id}</p>
                      <p className="text-xs text-slate-500">
                        Joined {new Date(referral.created_at * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-1 text-[10px] font-bold uppercase rounded"
                      style={{ 
                        backgroundColor: LEVEL_COLORS[1] + '20',
                        color: LEVEL_COLORS[1]
                      }}
                    >
                      Level 1
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Commission Rates Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0F1419] border border-white/5 rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
              <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Commission Structure</h3>
              <p className="text-xs text-slate-500">Earn on 5 levels of referrals</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <div 
                key={level}
                className="text-center p-3 rounded-lg"
                style={{ backgroundColor: LEVEL_COLORS[level] + '10' }}
              >
                <p 
                  className="text-lg font-bold"
                  style={{ color: LEVEL_COLORS[level] }}
                >
                  {COMMISSION_RATES[level]}%
                </p>
                <p className="text-[10px] text-slate-500 uppercase">L{level}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <p className="text-[10px] text-slate-600 font-mono">
            CAPWHEEL • PARTNER NETWORK
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Wrapper with navigation
export const PartnerNetwork = () => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Swipe detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header with back button */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-white font-semibold">Partners</span>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <PartnerNetworkContent />
        
        {/* Mobile Bottom Nav */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default PartnerNetwork;
