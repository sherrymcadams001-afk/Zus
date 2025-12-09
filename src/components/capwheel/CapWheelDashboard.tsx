/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * NO-SCROLL single viewport cockpit layout
 * - Sidebar navigation (Command Center)
 * - 4 metric cards (AUM, Yield, Partners, Vesting)
 * - Wealth chart + Dynamic Data Matrix side by side
 * - Transaction Ledger + Strategy Performance side by side
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionSidebar } from './OrionSidebar';
import { OrionMetricsGrid } from './OrionMetricsGrid';
import { OrionWealthChart } from './OrionWealthChart';
import { OrionTransactionLedger } from './OrionTransactionLedger';
import { OrionWealthProjection } from './OrionWealthProjection';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Settings, User, Menu, Wallet, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import { MobileNavDrawer, SwipeEdgeDetector } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { CollapsibleCard } from '../mobile/CollapsibleCard';
import { DepositModal } from './DepositModal';

// Compact Header Bar with Profile Dropdown
const DashboardHeader = ({ onMenuClick, onDepositClick }: { onMenuClick: () => void; onDepositClick: () => void }) => {
  const [time, setTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/capwheel/login');
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-[#0B1015] flex-shrink-0">
      <div className="flex items-center gap-2">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1.5 text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:inline">Overview /</span>
        <span className="text-xs font-semibold text-white">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onDepositClick}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#00FF9D] text-black text-xs font-bold rounded hover:bg-[#00E88A] transition-colors"
        >
          <Wallet className="w-3.5 h-3.5" />
          Deposit
        </button>

        <span className="text-xs font-mono text-[#00FF9D] hidden sm:inline">
          {time.toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors hidden sm:block">
          <Settings className="w-4 h-4" />
        </button>
        
        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-black" />
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[#0F1419] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white truncate">{user?.email || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{user?.role || 'Member'}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/capwheel/profile'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export const CapWheelDashboard = () => {
  const initFromBackend = usePortfolioStore((state) => state.initFromBackend);
  const user = useAuthStore((state) => state.user);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Initialize portfolio data from backend when user is authenticated
  useEffect(() => {
    if (user) {
      initFromBackend();
    }
  }, [initFromBackend, user]);

  return (
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden">
      {/* Swipe Edge Detector for mobile */}
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

      {/* Main Content - NO SCROLL on Desktop, Scroll on Mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <DashboardHeader 
          onMenuClick={() => setIsMobileNavOpen(true)} 
          onDepositClick={() => setIsDepositModalOpen(true)}
        />

        {/* Dashboard Grid */}
        <main className={`flex-1 p-4 flex flex-col gap-3 ${isMobile ? 'overflow-y-auto pb-24' : 'overflow-hidden'}`}>
          {/* Row 1: Metrics */}
          <div className="flex-shrink-0">
            <OrionMetricsGrid />
          </div>

          {/* Row 2: Chart + Projection */}
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <CollapsibleCard title="Wealth Performance" defaultOpen={true}>
                <div className="h-[300px]">
                  <OrionWealthChart />
                </div>
              </CollapsibleCard>
              
              <CollapsibleCard title="Transaction Ledger">
                <div className="h-[300px]">
                  <OrionTransactionLedger />
                </div>
              </CollapsibleCard>

              <CollapsibleCard title="Projections">
                <div className="h-[300px]">
                  <OrionWealthProjection />
                </div>
              </CollapsibleCard>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
              <div className="col-span-2 min-h-0 flex flex-col gap-3">
                <div className="h-[55%] min-h-0">
                  <OrionWealthChart />
                </div>
                <div className="flex-1 min-h-0">
                  <OrionTransactionLedger />
                </div>
              </div>
              <div className="col-span-1 min-h-[340px] flex flex-col">
                <div className="flex-1">
                  <OrionWealthProjection />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Nav */}
        <MobileBottomNav onDepositClick={() => setIsDepositModalOpen(true)} />
      </div>

      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)} 
      />
    </div>
  );
};
