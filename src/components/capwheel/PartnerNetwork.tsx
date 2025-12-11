/**
 * Capital Partners - Network Tree Orchestration
 * 
 * Visual network hierarchy with user as root orchestrator:
 * - Tree visualization showing downstream capital flow
 * - User node at top with branching LP tiers
 * - Capital flow metrics per tier
 * - Interactive tree expansion
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  Loader2,
  PieChart,
  Target,
  ChevronDown,
  Zap,
  User,
  GitBranch,
  Network,
  CircleDot
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

// Tier configuration
const TIER_CONFIG: Record<number, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  1: { label: 'Tier 1', shortLabel: 'T1', color: '#00FF9D', bgColor: 'rgba(0, 255, 157, 0.15)' },
  2: { label: 'Tier 2', shortLabel: 'T2', color: '#00B8D4', bgColor: 'rgba(0, 184, 212, 0.15)' },
  3: { label: 'Tier 3', shortLabel: 'T3', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  4: { label: 'Tier 4', shortLabel: 'T4', color: '#D4AF37', bgColor: 'rgba(212, 175, 55, 0.15)' },
  5: { label: 'Tier 5', shortLabel: 'T5', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)' },
};

const TIER_RATES: Record<number, number> = { 1: 10, 2: 5, 3: 3, 4: 2, 5: 1 };

// Network Tree Node Component
const TreeNode = ({ 
  tier, 
  count, 
  capital, 
  isExpanded, 
  onToggle,
  delay = 0 
}: { 
  tier: number; 
  count: number; 
  capital: number; 
  isExpanded: boolean;
  onToggle: () => void;
  delay?: number;
}) => {
  const config = TIER_CONFIG[tier];
  const rate = TIER_RATES[tier];
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative"
    >
      {/* Connection line from parent */}
      <div 
        className="absolute -left-6 top-1/2 w-6 h-px"
        style={{ backgroundColor: config.color + '40' }}
      />
      
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all ${
          isExpanded 
            ? 'bg-[#0F1419] border-white/10' 
            : 'bg-[#0B1015] border-white/5 hover:border-white/10'
        }`}
      >
        {/* Node indicator */}
        <div 
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          {config.shortLabel}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm sm:text-base font-semibold text-white">{config.label}</span>
            <span 
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: config.bgColor, color: config.color }}
            >
              {rate}%
            </span>
          </div>
          <p className="text-xs text-slate-500">{count} LPs • {formatCurrency(capital)} capital</p>
        </div>
        
        {/* Expand indicator */}
        <ChevronDown 
          className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-4 grid grid-cols-3 gap-2">
              <div className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white font-mono">{count}</p>
                <p className="text-[10px] text-slate-500 uppercase">LPs</p>
              </div>
              <div className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-mono" style={{ color: config.color }}>
                  {formatCurrency(capital * (rate / 100))}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">Revenue</p>
              </div>
              <div className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">{rate}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Rate</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PartnerNetworkContent = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [capitalByTier, setCapitalByTier] = useState<CapitalByTier | null>(null);
  const [limitedPartners, setLimitedPartners] = useState<LimitedPartner[]>([]);
  const [expandedTier, setExpandedTier] = useState<number | null>(1);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, capitalRes, lpRes] = await Promise.all([
          apiClient.get('/api/referrals/stats'),
          apiClient.get('/api/referrals/volume/breakdown'),
          apiClient.get('/api/referrals')
        ]);
        
        if (statsRes.data.status === 'success') setStats(statsRes.data.data);
        if (capitalRes.data.status === 'success') setCapitalByTier(capitalRes.data.data);
        if (lpRes.data.status === 'success') setLimitedPartners(lpRes.data.data);
      } catch (err) {
        console.error('Failed to fetch portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) fetchPortfolioData();
  }, [user]);

  const formatCurrency = (value: number, compact = false) => {
    if (compact && value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (compact && value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
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

  // Calculate LP count per tier (mock based on direct referrals distribution)
  const getLPCountForTier = (tier: number) => {
    if (tier === 1) return directLPCount;
    // Simulate downstream distribution
    const remaining = lpCount - directLPCount;
    const distribution = [0, 0.4, 0.3, 0.2, 0.1]; // Distribution for tiers 2-5
    return Math.floor(remaining * (distribution[tier - 1] || 0));
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0B1015] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#00FF9D]/20 flex items-center justify-center">
            <Network className="w-7 h-7 text-[#00FF9D]/50" />
          </div>
          <Loader2 className="w-16 h-16 text-[#00FF9D] animate-spin absolute inset-0" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading Network...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0B1015]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00FF9D]/10 rounded-xl">
              <Network className="w-5 h-5 text-[#00FF9D]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Network Tree</h1>
              <p className="text-xs sm:text-sm text-slate-500">Capital flow orchestration</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/capwheel/profile')}
            className="flex items-center gap-2 px-4 py-2 bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded-xl text-[#00FF9D] text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </motion.button>
        </motion.div>

        {/* Network Tree Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl overflow-hidden"
        >
          {/* Tree Header */}
          <div className="p-4 sm:p-5 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <GitBranch className="w-4 h-4" />
              <span>Downstream Capital Distribution</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Root Node - YOU */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-[#00FF9D]/10 via-[#00B8D4]/10 to-[#8B5CF6]/10 border border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-4">
                  {/* User avatar/node */}
                  <div className="relative">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center shadow-lg shadow-[#00FF9D]/20">
                      <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#0B1015]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0B1015] rounded-full flex items-center justify-center border-2 border-[#00FF9D]">
                      <CircleDot className="w-2.5 h-2.5 text-[#00FF9D]" />
                    </div>
                  </div>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg sm:text-xl font-bold text-white truncate">
                        {user?.email?.split('@')[0] || 'You'}
                      </span>
                      <span className="px-2 py-0.5 bg-[#00FF9D]/20 rounded text-[10px] font-bold text-[#00FF9D] uppercase">
                        Root
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400">Network Orchestrator</p>
                  </div>
                  
                  {/* Total stats */}
                  <div className="text-right hidden sm:block">
                    <p className="text-xl font-bold text-white font-mono">{formatCurrency(totalAUM, true)}</p>
                    <p className="text-xs text-slate-500">Total AUM</p>
                  </div>
                </div>
                
                {/* Quick stats row */}
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-white">{lpCount}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Total LPs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-[#00FF9D] font-mono">{formatCurrency(earnedRevenue, true)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-amber-400 font-mono">{formatCurrency(pendingRevenue, true)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">Pending</p>
                  </div>
                </div>
              </div>
              
              {/* Vertical connector line */}
              <div className="flex justify-center py-2">
                <div className="w-px h-6 bg-gradient-to-b from-[#00FF9D]/40 to-[#00FF9D]/10" />
              </div>
            </motion.div>

            {/* Tier Branches */}
            <div className="relative pl-6 space-y-2">
              {/* Vertical line connecting all tiers */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#00FF9D]/30 via-[#00B8D4]/20 to-[#FF6B6B]/10" />
              
              {[1, 2, 3, 4, 5].map((tier) => {
                const capital = capitalByTier?.[tier as keyof CapitalByTier] ?? 0;
                const count = getLPCountForTier(tier);
                
                return (
                  <TreeNode
                    key={tier}
                    tier={tier}
                    count={count}
                    capital={capital}
                    isExpanded={expandedTier === tier}
                    onToggle={() => setExpandedTier(expandedTier === tier ? null : tier)}
                    delay={0.2 + tier * 0.05}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Direct LPs List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00FF9D]/10 rounded-lg">
                  <Target className="w-4 h-4 text-[#00FF9D]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct LPs</h3>
                  <p className="text-xs text-slate-500">{directLPCount} tier 1 connections</p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {limitedPartners.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-[#00FF9D]/10 flex items-center justify-center">
                  <Network className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-400 mb-1">No LPs in your network yet</p>
                <p className="text-xs text-slate-500 mb-4">Invite partners to start building your tree</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/capwheel/profile')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 rounded-lg text-[#00FF9D] text-sm font-medium transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Invite Codes</span>
                </motion.button>
              </div>
            ) : (
              limitedPartners.slice(0, 8).map((lp, index) => (
                <motion.div
                  key={lp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.03 }}
                  className="p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00FF9D]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#00FF9D]">T1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">LP-{String(lp.referred_id).padStart(4, '0')}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(lp.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </motion.div>
              ))
            )}
            
            {limitedPartners.length > 8 && (
              <div className="p-3 text-center">
                <button className="text-sm text-[#00B8D4] hover:text-[#00B8D4]/80 font-medium">
                  View all {limitedPartners.length} →
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Revenue Distribution Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0F1419] border border-white/5 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
              <PieChart className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <span className="text-sm font-bold text-white">Revenue by Tier</span>
          </div>
          
          <div className="flex gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((tier) => {
              const config = TIER_CONFIG[tier];
              const rate = TIER_RATES[tier];
              
              return (
                <div 
                  key={tier}
                  className="flex-1 text-center p-2 sm:p-3 rounded-lg"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <p className="text-base sm:text-lg font-bold" style={{ color: config.color }}>
                    {rate}%
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase">{config.shortLabel}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-4"
        >
          <p className="text-[10px] text-slate-600 font-mono tracking-widest">
            CAPWHEEL • NETWORK TREE
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
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />
      
      <div className="hidden lg:block flex-shrink-0">
        <OrionSidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
          <button
            onClick={() => navigate('/capwheel/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className="text-white font-semibold">Network</span>
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <PartnerNetworkContent />
        
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default PartnerNetwork;
