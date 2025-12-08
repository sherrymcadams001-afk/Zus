/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * Mobile-first responsive dashboard with:
 * - Sidebar navigation (Command Center) with Tier Display
 * - 4 metric cards (AUM, Yield, Partners, Vesting)
 * - Wealth chart + Dynamic Data Matrix side by side
 * - Transaction Ledger + Strategy Performance side by side
 * - Boost Capital button prominently placed
 * - Invite code generator for referrals
 * - Mobile slide-in navigation and bottom nav
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { OrionSidebar } from './OrionSidebar';
import { OrionMetricsGrid } from './OrionMetricsGrid';
import { OrionWealthChart } from './OrionWealthChart';
import { OrionTransactionLedger } from './OrionTransactionLedger';
import { OrionWealthProjection } from './OrionWealthProjection';
import { OrionStrategyPerformance } from './OrionStrategyPerformance';
import { OrionTierDisplay } from './OrionTierDisplay';
import { BoostCapitalButton } from './BoostCapital';
import { MobileNavDrawer, MobileBottomNav, InviteCodeGenerator } from '../mobile';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useResponsive, useViewportHeight } from '../../hooks';
import { Bell, Settings, User, Menu, Gift } from 'lucide-react';
import { ORION_MOTION } from '../../theme/orion-design-system';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

// Compact Header Bar - Mobile Responsive
const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const [time, setTime] = useState(new Date());
  const { isMobile, isTablet } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 lg:h-12 flex items-center justify-between px-3 lg:px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Mobile Menu Button */}
        {isMobileOrTablet && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">Overview /</span>
          <span className="text-xs font-semibold text-white">Dashboard</span>
        </div>
        {/* Boost Capital Button in Header - Hide on mobile */}
        <div className="hidden md:block">
          <BoostCapitalButton variant="compact" />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <span className="text-xs font-mono text-[#00FF9D] hidden sm:inline">
          {time.toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
        <button className="p-2 lg:p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center">
          <Bell className="w-5 h-5 lg:w-4 lg:h-4" />
        </button>
        <button className="p-2 lg:p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 flex items-center justify-center hidden sm:flex">
          <Settings className="w-5 h-5 lg:w-4 lg:h-4" />
        </button>
        <div className="w-8 h-8 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center">
          <User className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-black" />
        </div>
      </div>
    </header>
  );
};

// Mobile Invite Code Floating Button
const MobileInviteButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="fixed right-4 bottom-24 z-30 p-4 bg-[#00FF9D] text-black rounded-full shadow-lg shadow-[#00FF9D]/20 touch-manipulation lg:hidden"
    aria-label="Generate invite code"
  >
    <Gift className="w-5 h-5" />
  </motion.button>
);

// Mobile Invite Code Modal
const MobileInviteModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute bottom-0 left-0 right-0 bg-[#0B1015] rounded-t-3xl p-4 pb-safe max-h-[80vh] overflow-auto"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
        <InviteCodeGenerator variant="full" />
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-slate-400 text-sm font-medium touch-manipulation"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

export const CapWheelDashboard = () => {
  const setWalletBalance = usePortfolioStore((state) => state.setWalletBalance);
  const user = useAuthStore((state) => state.user);
  const { isDesktop } = useResponsive();
  const { isKeyboardOpen } = useViewportHeight();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await apiClient.get('/api/wallet');
        if (response.data.status === 'success') {
          setWalletBalance(response.data.data.available_balance);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };

    if (user) {
      fetchBalance();
    }
  }, [setWalletBalance, user]);

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <OrionSidebar />
        </div>

        {/* Main Content - NO SCROLL */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <DashboardHeader />

          {/* Dashboard Grid - Fills viewport */}
          <main className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
            {/* Row 1: 4 Metric Cards */}
            <div className="flex-shrink-0">
              <OrionMetricsGrid />
            </div>

            {/* Row 2: Chart (2/5) + Data Matrix (2/5) + Tier Display (1/5) */}
            <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
              <div className="col-span-2 min-h-0">
                <OrionWealthChart />
              </div>
              <div className="col-span-2 min-h-0">
                <OrionWealthProjection />
              </div>
              <div className="col-span-1 min-h-0 overflow-auto">
                <OrionTierDisplay />
              </div>
            </div>

            {/* Row 3: Ledger + Strategy + Invite Code */}
            <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
              <div className="col-span-2 min-h-0 overflow-hidden">
                <OrionTransactionLedger />
              </div>
              <div className="col-span-2 min-h-0 overflow-hidden">
                <OrionStrategyPerformance />
              </div>
              <div className="col-span-1 min-h-0 overflow-auto">
                <InviteCodeGenerator variant="full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Mobile/Tablet Layout
  return (
    <div 
      className="h-screen w-screen flex flex-col bg-[#0B1015] overflow-hidden"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      {/* Mobile Nav Drawer */}
      <MobileNavDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Mobile Invite Modal */}
      <MobileInviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />

      {/* Header */}
      <DashboardHeader onMenuClick={() => setIsDrawerOpen(true)} />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-auto p-3 pb-24 space-y-3">
        {/* Mobile Boost Capital Button */}
        <div className="md:hidden">
          <BoostCapitalButton variant="primary" />
        </div>

        {/* Metrics Grid - Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000, delay: 0 }}
        >
          <OrionMetricsGrid />
        </motion.div>

        {/* Charts Row - Stack on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000, delay: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div className="min-h-[280px]">
            <OrionWealthChart />
          </div>
          <div className="min-h-[280px]">
            <OrionWealthProjection />
          </div>
        </motion.div>

        {/* Tier Display - Full width on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000, delay: 0.1 }}
        >
          <OrionTierDisplay />
        </motion.div>

        {/* Ledger & Strategy - Stack on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ORION_MOTION.duration.normal / 1000, delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div className="min-h-[200px]">
            <OrionTransactionLedger />
          </div>
          <div className="min-h-[200px]">
            <OrionStrategyPerformance />
          </div>
        </motion.div>
      </main>

      {/* Mobile Invite Button */}
      {!isKeyboardOpen && (
        <MobileInviteButton onClick={() => setIsInviteModalOpen(true)} />
      )}

      {/* Bottom Navigation */}
      {!isKeyboardOpen && (
        <MobileBottomNav onMenuClick={() => setIsDrawerOpen(true)} />
      )}
    </div>
  );
};
