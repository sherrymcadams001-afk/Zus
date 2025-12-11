/**
 * Capital Partners - Network Tree Orchestration
 * 
 * Visual network hierarchy with user as root orchestrator:
 * - Tree visualization showing downstream capital flow
 * - User node at top with branching LP tiers
 * - Capital flow metrics per tier
 * - Interactive tree expansion
 * 
 * Enterprise UI/UX Principles:
 * - Spring cascade on tier node reveals
 * - Connection line stroke animation
 * - Lume-elevation hierarchy (root=lume3, tiers=lume2)
 * - Parallax micro-movement on hover
 * - Atmospheric depth with gradient overlays
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
import { springPhysics, lumeElevation } from '../../theme/capwheel';

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

// Tier configuration with enhanced styling
const TIER_CONFIG: Record<number, { label: string; shortLabel: string; color: string; bgColor: string; glow: string }> = {
  1: { label: 'Tier 1', shortLabel: 'T1', color: '#00FF9D', bgColor: 'rgba(0, 255, 157, 0.15)', glow: 'rgba(0,255,157,0.4)' },
  2: { label: 'Tier 2', shortLabel: 'T2', color: '#00B8D4', bgColor: 'rgba(0, 184, 212, 0.15)', glow: 'rgba(0,184,212,0.4)' },
  3: { label: 'Tier 3', shortLabel: 'T3', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(139,92,246,0.4)' },
  4: { label: 'Tier 4', shortLabel: 'T4', color: '#D4AF37', bgColor: 'rgba(212, 175, 55, 0.15)', glow: 'rgba(212,175,55,0.4)' },
  5: { label: 'Tier 5', shortLabel: 'T5', color: '#FF6B6B', bgColor: 'rgba(255, 107, 107, 0.15)', glow: 'rgba(255,107,107,0.4)' },
};

const TIER_RATES: Record<number, number> = { 1: 10, 2: 5, 3: 3, 4: 2, 5: 1 };

// Animated connection line component
const AnimatedConnectionLine = ({ tier, isActive }: { tier: number; isActive: boolean }) => {
  const config = TIER_CONFIG[tier];
  
  return (
    <motion.div 
      className="absolute -left-6 top-1/2 w-6 h-px overflow-hidden"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: tier * 0.1, duration: 0.3 }}
      style={{ transformOrigin: 'left' }}
    >
      <motion.div
        className="w-full h-full"
        style={{ 
          backgroundColor: isActive ? config.color : config.color + '40',
          boxShadow: isActive ? `0 0 8px ${config.glow}` : 'none'
        }}
        animate={{ opacity: isActive ? 1 : 0.4 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// Network Tree Node Component with spring cascade
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
      initial={{ opacity: 0, x: -24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay, 
        type: 'spring',
        stiffness: springPhysics.gentle.stiffness,
        damping: springPhysics.gentle.damping
      }}
      className="relative group"
    >
      {/* Animated connection line from parent */}
      <AnimatedConnectionLine tier={tier} isActive={isExpanded} />
      
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.01, x: 4 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: springPhysics.snappy.stiffness, damping: springPhysics.snappy.damping }}
        className={`w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all ${
          isExpanded 
            ? 'bg-[#0F1419]' 
            : 'bg-[#0B1015]/80 hover:bg-[#0D1318]'
        }`}
        style={{ 
          boxShadow: isExpanded 
            ? `${lumeElevation.lume2.shadow}, ${lumeElevation.lume2.glow}` 
            : `${lumeElevation.lume1.shadow}, ${lumeElevation.lume1.glow}`,
          border: `1px solid ${isExpanded ? config.color + '30' : 'rgba(255,255,255,0.05)'}`
        }}
      >
        {/* Node indicator with glow */}
        <motion.div 
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 relative"
          style={{ backgroundColor: config.bgColor, color: config.color }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: springPhysics.bouncy.stiffness, damping: springPhysics.bouncy.damping }}
        >
          {config.shortLabel}
          {/* Glow ring on active */}
          {isExpanded && (
            <motion.div
              className="absolute inset-0 rounded-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                boxShadow: `0 0 20px ${config.glow}, inset 0 0 10px ${config.glow}30`
              }}
            />
          )}
        </motion.div>
        
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
        
        {/* Expand indicator with spring rotation */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: springPhysics.quick.stiffness, damping: springPhysics.quick.damping }}
        >
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </motion.div>
      </motion.button>
      
      {/* Expanded details with spring animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ 
              type: 'spring',
              stiffness: springPhysics.gentle.stiffness,
              damping: springPhysics.gentle.damping
            }}
            className="overflow-hidden"
          >
            <motion.div 
              className="pt-3 pl-4 grid grid-cols-3 gap-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center"
                style={{ boxShadow: `${lumeElevation.lume1.shadow}, ${lumeElevation.lume1.glow}` }}
              >
                <p className="text-lg font-bold text-white font-mono">{count}</p>
                <p className="text-[10px] text-slate-500 uppercase">LPs</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center"
                style={{ boxShadow: `${lumeElevation.lume1.shadow}, ${lumeElevation.lume1.glow}` }}
              >
                <p className="text-lg font-bold font-mono" style={{ color: config.color }}>
                  {formatCurrency(capital * (rate / 100))}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">Revenue</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="bg-[#0B1015] border border-white/5 rounded-lg p-3 text-center"
                style={{ boxShadow: `${lumeElevation.lume1.shadow}, ${lumeElevation.lume1.glow}` }}
              >
                <p className="text-lg font-bold text-white">{rate}%</p>
                <p className="text-[10px] text-slate-500 uppercase">Rate</p>
              </motion.div>
            </motion.div>
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
    <div className="h-full overflow-y-auto bg-[#0B1015] relative">
      {/* Atmospheric background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0B1015] via-[#0D1318] to-[#0A0E12] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,157,0.04),transparent_60%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,184,212,0.03),transparent_60%)] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 relative z-10">
        
        {/* Page Header with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 bg-[#00FF9D]/10 rounded-2xl relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Network className="w-6 h-6 text-[#00FF9D]" />
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-60" 
                style={{ boxShadow: '0 0 20px rgba(0,255,157,0.3)' }} 
              />
            </motion.div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Network Tree</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Capital flow orchestration</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(0,255,157,0.3)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => navigate('/capwheel/profile')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00FF9D]/10 hover:bg-[#00FF9D]/15 border border-[#00FF9D]/30 rounded-xl text-[#00FF9D] text-sm font-medium transition-colors"
            style={{ boxShadow: '0 0 16px rgba(0,255,157,0.15)' }}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </motion.button>
        </motion.div>

        {/* Network Tree Visualization with lume-elevation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100, damping: 20 }}
          className="bg-gradient-to-br from-[#0F1419] via-[#111820] to-[#0D1318] border border-white/[0.06] rounded-2xl overflow-hidden relative"
          style={{ boxShadow: `${lumeElevation.lume3.shadow}, ${lumeElevation.lume3.glow}` }}
        >
          {/* Rim light on top edge */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/20 to-transparent" />
          
          {/* Tree Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <GitBranch className="w-4 h-4" />
              <span className="uppercase tracking-wider">Downstream Capital Distribution</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Root Node - YOU - with lume-elevation and parallax */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 100, damping: 20 }}
              whileHover={{ scale: 1.01, y: -2 }}
              className="relative group"
            >
              <motion.div 
                className="bg-gradient-to-br from-[#00FF9D]/12 via-[#00B8D4]/10 to-[#8B5CF6]/08 rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                style={{ 
                  boxShadow: `${lumeElevation.lume3.shadow}, ${lumeElevation.lume3.glow}, 0 0 40px rgba(0,255,157,0.1)`,
                  border: '1px solid rgba(0,255,157,0.15)'
                }}
              >
                {/* Animated gradient rim */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/50 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00B8D4]/30 to-transparent" />
                
                <div className="flex items-center gap-4 relative z-10">
                  {/* User avatar/node with breathing glow */}
                  <div className="relative">
                    <motion.div 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center"
                      style={{ boxShadow: '0 0 30px rgba(0,255,157,0.35), 0 4px 20px rgba(0,0,0,0.3)' }}
                      animate={{ 
                        boxShadow: [
                          '0 0 30px rgba(0,255,157,0.35), 0 4px 20px rgba(0,0,0,0.3)',
                          '0 0 40px rgba(0,255,157,0.5), 0 4px 20px rgba(0,0,0,0.3)',
                          '0 0 30px rgba(0,255,157,0.35), 0 4px 20px rgba(0,0,0,0.3)'
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <User className="w-7 h-7 sm:w-8 sm:h-8 text-[#0B1015]" />
                    </motion.div>
                    <motion.div 
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0B1015] rounded-full flex items-center justify-center border-2 border-[#00FF9D]"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CircleDot className="w-2.5 h-2.5 text-[#00FF9D]" />
                    </motion.div>
                  </div>
                  
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg sm:text-xl font-bold text-white truncate">
                        {user?.email?.split('@')[0] || 'You'}
                      </span>
                      <motion.span 
                        className="px-2.5 py-1 bg-[#00FF9D]/20 rounded-lg text-[10px] font-bold text-[#00FF9D] uppercase tracking-wide"
                        style={{ boxShadow: '0 0 12px rgba(0,255,157,0.2)' }}
                        animate={{ opacity: [0.9, 1, 0.9] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Root
                      </motion.span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400">Network Orchestrator</p>
                  </div>
                  
                  {/* Total stats with glow */}
                  <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold text-white font-mono" style={{ textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                      {formatCurrency(totalAUM, true)}
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Total AUM</p>
                  </div>
                </div>
                
                {/* Quick stats row with kinetic cards */}
                <div className="mt-5 pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-3">
                  <motion.div 
                    className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <p className="text-lg sm:text-xl font-bold text-white">{lpCount}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Total LPs</p>
                  </motion.div>
                  <motion.div 
                    className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <p className="text-lg sm:text-xl font-bold text-[#00FF9D] font-mono">{formatCurrency(earnedRevenue, true)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Earned</p>
                  </motion.div>
                  <motion.div 
                    className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <p className="text-lg sm:text-xl font-bold text-amber-400 font-mono">{formatCurrency(pendingRevenue, true)}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">Pending</p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Animated vertical connector from root to tiers */}
            <div className="flex justify-center py-3">
              <motion.div 
                className="w-px h-8 bg-gradient-to-b from-[#00FF9D]/50 via-[#00FF9D]/30 to-[#00FF9D]/10"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                style={{ transformOrigin: 'top', boxShadow: '0 0 8px rgba(0,255,157,0.3)' }}
              />
            </div>

            {/* Tier Branches with animated vertical connector */}
            <div className="relative pl-6 space-y-3">
              {/* Vertical line connecting all tiers with gradient */}
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#00FF9D]/40 via-[#00B8D4]/25 to-[#FF6B6B]/15"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                style={{ transformOrigin: 'top' }}
              />
              
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
