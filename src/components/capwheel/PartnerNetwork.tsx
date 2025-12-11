/**
 * Capital Partners - Managing Partner Portal
 * 
 * Enterprise-grade portfolio liquidity management interface:
 * - Downstream Capital Overview (AUM under management)
 * - LP Performance Tiers (fund hierarchy)
 * - Revenue Attribution (carried interest & management fees)
 * - Portfolio LP Directory
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase,
  DollarSign,
  ChevronRight,
  Loader2,
  Layers,
  PieChart,
  Building2,
  Crown,
  Target,
  Activity,
  ChevronDown,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { OrionSidebar } from './OrionSidebar';
import { MobileNavDrawer, SwipeEdgeDetector } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { Menu, ArrowLeft } from 'lucide-react';

interface PortfolioStats {
  totalReferrals: number;
  directReferrals: number;
  totalVolume: number;
  totalCommissions: number;
  pendingCommissions: number;
}

interface CapitalByTier {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface LimitedPartner {
  id: number;
  referrer_id: number;
  referred_id: number;
  level: number;
  created_at: number;
}

// Revenue share rates by LP tier (basis points style)
const TIER_REVENUE_SHARE: Record<number, { rate: number; label: string; description: string }> = {
  1: { rate: 10, label: 'Principal LP', description: 'Direct portfolio allocation' },
  2: { rate: 5, label: 'Senior LP', description: 'Secondary liquidity tier' },
  3: { rate: 3, label: 'Associate LP', description: 'Growth capital pool' },
  4: { rate: 2, label: 'Contributing LP', description: 'Extended network capital' },
  5: { rate: 1, label: 'Affiliate LP', description: 'Downstream participation' },
};

const TIER_STYLES: Record<number, { gradient: string; accent: string; glow: string }> = {
  1: { gradient: 'from-emerald-500 to-emerald-600', accent: '#00FF9D', glow: 'shadow-emerald-500/20' },
  2: { gradient: 'from-cyan-500 to-cyan-600', accent: '#00B8D4', glow: 'shadow-cyan-500/20' },
  3: { gradient: 'from-violet-500 to-violet-600', accent: '#8B5CF6', glow: 'shadow-violet-500/20' },
  4: { gradient: 'from-amber-500 to-amber-600', accent: '#D4AF37', glow: 'shadow-amber-500/20' },
  5: { gradient: 'from-rose-500 to-rose-600', accent: '#FF6B6B', glow: 'shadow-rose-500/20' },
};

const PartnerNetworkContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [capitalByTier, setCapitalByTier] = useState<CapitalByTier | null>(null);
  const [limitedPartners, setLimitedPartners] = useState<LimitedPartner[]>([]);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, capitalRes, lpRes] = await Promise.all([
          apiClient.get('/api/referrals/stats'),
          apiClient.get('/api/referrals/volume/breakdown'),
          apiClient.get('/api/referrals')
        ]);
        
        if (statsRes.data.status === 'success') {
          setStats(statsRes.data.data);
        }
        if (capitalRes.data.status === 'success') {
          setCapitalByTier(capitalRes.data.data);
        }
        if (lpRes.data.status === 'success') {
          setLimitedPartners(lpRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchPortfolioData();
  }, [user]);

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (compact && value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalAUM = stats?.totalVolume ?? 0;
  const earnedRevenue = stats?.totalCommissions ?? 0;
  const pendingRevenue = stats?.pendingCommissions ?? 0;
  const lpCount = stats?.totalReferrals ?? 0;
  const directLPCount = stats?.directReferrals ?? 0;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0B1015] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#00FF9D]/20 flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-[#00FF9D]/50" />
          </div>
          <Loader2 className="w-16 h-16 text-[#00FF9D] animate-spin absolute inset-0" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading Portfolio...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B1015]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Managing Partner Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FF9D]/5 via-transparent to-[#00B8D4]/5 rounded-2xl blur-xl" />
          
          <div className="relative bg-[#0F1419]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#00FF9D]/20 to-[#00B8D4]/20 flex items-center justify-center border border-white/10">
                    <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4AF37]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00FF9D] rounded-full flex items-center justify-center border-2 border-[#0B1015]">
                    <Shield className="w-2.5 h-2.5 text-[#0B1015]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Capital Partners</h1>
                    <span className="px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      Managing Partner
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Portfolio liquidity & LP management
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/capwheel/profile')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00FF9D] to-[#00B8D4] rounded-xl text-[#0B1015] text-sm font-bold shadow-lg shadow-[#00FF9D]/20 hover:shadow-[#00FF9D]/30 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>Invite LPs</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Executive Portfolio Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {/* Total AUM */}
          <div className="col-span-2 sm:col-span-1 bg-[#0F1419] border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#00FF9D]/20 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00FF9D]/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-[#00FF9D]/10 rounded-lg">
                  <Building2 className="w-4 h-4 text-[#00FF9D]" />
                </div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Total AUM</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
                {formatCurrency(totalAUM, true)}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">Assets Under Management</p>
            </div>
          </div>

          {/* LP Count */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#00B8D4]/20 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#00B8D4]/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-[#00B8D4]/10 rounded-lg">
                  <Briefcase className="w-4 h-4 text-[#00B8D4]" />
                </div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">LPs</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{lpCount}</p>
              <p className="text-xs text-slate-500 mt-1.5">{directLPCount} Principal</p>
            </div>
          </div>

          {/* Realized Revenue */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#00FF9D]/20 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Realized</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#00FF9D] font-mono tabular-nums">
                {formatCurrency(earnedRevenue, true)}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">Carried interest</p>
            </div>
          </div>

          {/* Pending Revenue */}
          <div className="bg-[#0F1419] border border-white/5 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/20 transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Accruing</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
                {formatCurrency(pendingRevenue, true)}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">Pending distribution</p>
            </div>
          </div>
        </motion.div>

        {/* LP Tier Capital Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-violet-500/20 to-violet-500/5 rounded-xl">
                  <Layers className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">LP Tier Capital Allocation</h3>
                  <p className="text-xs text-slate-500">Downstream liquidity distribution by tier</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-[#00FF9D] animate-pulse" />
                <span>Live allocation</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((tier) => {
                const capital = capitalByTier?.[tier as keyof CapitalByTier] ?? 0;
                const maxCapital = Math.max(...Object.values(capitalByTier ?? { 1: 1 }), 1);
                const percentage = (capital / maxCapital) * 100;
                const tierInfo = TIER_REVENUE_SHARE[tier];
                const tierStyle = TIER_STYLES[tier];
                const isExpanded = expandedTier === tier;
                
                return (
                  <motion.div 
                    key={tier} 
                    className={`bg-[#0B1015] border border-white/5 rounded-xl overflow-hidden transition-all ${
                      isExpanded ? 'ring-1 ring-white/10' : ''
                    }`}
                    layout
                  >
                    <button
                      onClick={() => setExpandedTier(isExpanded ? null : tier)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Tier Badge */}
                      <div 
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg ${tierStyle.glow}`}
                      >
                        T{tier}
                      </div>
                      
                      {/* Tier Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm sm:text-base text-white font-semibold truncate">
                            {tierInfo.label}
                          </p>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ 
                              backgroundColor: tierStyle.accent + '20',
                              color: tierStyle.accent
                            }}
                          >
                            {tierInfo.rate}% Share
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{tierInfo.description}</p>
                      </div>
                      
                      {/* Capital Amount */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                          {formatCurrency(capital, true)}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">Capital</p>
                      </div>
                      
                      {/* Expand Arrow */}
                      <ChevronDown 
                        className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {/* Progress Bar */}
                    <div className="px-4 pb-4">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${tierStyle.gradient}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.3 + tier * 0.08, duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/5"
                        >
                          <div className="p-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-white font-mono">
                                {formatCurrency(capital * (tierInfo.rate / 100), true)}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase">Revenue Share</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{tierInfo.rate}%</p>
                              <p className="text-[10px] text-slate-500 uppercase">Carry Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">
                                {((capital / totalAUM) * 100 || 0).toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase">AUM Weight</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Principal LP Directory */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-[#00FF9D]/20 to-[#00FF9D]/5 rounded-xl">
                  <Target className="w-5 h-5 text-[#00FF9D]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Principal LP Directory</h3>
                  <p className="text-xs text-slate-500">{limitedPartners.length} direct capital partners</p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {limitedPartners.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00FF9D]/10 to-[#00B8D4]/10 flex items-center justify-center">
                  <Briefcase className="w-10 h-10 text-slate-600" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No Limited Partners Yet</h4>
                <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
                  Expand your portfolio by inviting qualified LPs to participate in downstream capital allocation.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/capwheel/profile')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FF9D] to-[#00B8D4] rounded-xl text-[#0B1015] text-sm font-bold shadow-lg shadow-[#00FF9D]/20"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generate LP Invite</span>
                </motion.button>
              </div>
            ) : (
              limitedPartners.slice(0, 10).map((lp, index) => (
                <motion.div
                  key={lp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.04 }}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FF9D]/20 to-[#00B8D4]/10 flex items-center justify-center border border-white/5">
                        <span className="text-lg font-bold text-white/60">LP</span>
                      </div>
                      <div 
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#0F1419]"
                        style={{ 
                          backgroundColor: TIER_STYLES[1].accent,
                          color: '#0B1015'
                        }}
                      >
                        1
                      </div>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base text-white font-semibold">
                        LP-{String(lp.referred_id).padStart(4, '0')}
                      </p>
                      <p className="text-xs text-slate-500">
                        Onboarded {new Date(lp.created_at * 1000).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider"
                      style={{ 
                        backgroundColor: TIER_STYLES[1].accent + '15',
                        color: TIER_STYLES[1].accent
                      }}
                    >
                      Principal
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </motion.div>
              ))
            )}
            
            {limitedPartners.length > 10 && (
              <div className="p-4 text-center">
                <button className="text-sm text-[#00B8D4] hover:text-[#00B8D4]/80 font-medium transition-colors">
                  View all {limitedPartners.length} LPs →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Revenue Share Structure */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl">
                <PieChart className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Revenue Share Structure</h3>
                <p className="text-xs text-slate-500">Tiered carried interest on downstream capital</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map((tier) => {
                const tierInfo = TIER_REVENUE_SHARE[tier];
                const tierStyle = TIER_STYLES[tier];
                
                return (
                  <motion.div 
                    key={tier}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + tier * 0.05 }}
                    className="text-center p-3 sm:p-4 rounded-xl border border-white/5 bg-[#0B1015] hover:border-white/10 transition-colors group"
                  >
                    <div 
                      className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${tierStyle.gradient} flex items-center justify-center shadow-lg ${tierStyle.glow} group-hover:scale-105 transition-transform`}
                    >
                      <span className="text-white font-bold text-sm">T{tier}</span>
                    </div>
                    <p 
                      className="text-xl sm:text-2xl font-bold mb-0.5"
                      style={{ color: tierStyle.accent }}
                    >
                      {tierInfo.rate}%
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-medium tracking-wider">Carry</p>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-[#0B1015] rounded-xl border border-white/5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#00B8D4]/10 rounded-lg mt-0.5">
                  <Globe className="w-4 h-4 text-[#00B8D4]" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Multi-Tier Attribution</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    As a Managing Partner, you earn carried interest across 5 tiers of downstream LP capital. 
                    Principal LPs (Tier 1) generate the highest yield at 10%, with descending rates through Affiliate LPs (Tier 5) at 1%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6"
        >
          <p className="text-[10px] text-slate-600 font-mono tracking-widest">
            CAPWHEEL • CAPITAL PARTNERS
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
          <span className="text-white font-semibold">Capital Partners</span>
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
