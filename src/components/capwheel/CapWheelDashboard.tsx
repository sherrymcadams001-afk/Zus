/**
 * CapWheel Dashboard Component - ORION Design
 * 
 * NO-SCROLL single viewport cockpit layout
 * - Sidebar navigation (Command Center)
 * - 4 metric cards (AUM, Yield, Partners, Vesting)
 * - Wealth chart + Dynamic Data Matrix side by side
 * - Transaction Ledger + Strategy Performance side by side
 * 
 * Enterprise UI/UX Principles:
 * - Jet gliding movements (spring physics)
 * - Atmospheric depth with lume-elevation
 * - Surgical accents on interactive elements
 * - Sensory lighting and feedback
 * - Progressive disclosure animations
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
import { User, Menu, Wallet, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import { MobileNavDrawer, SwipeEdgeDetector } from '../mobile/MobileNavDrawer';
import { MobileBottomNav } from '../mobile/MobileBottomNav';
import { NotificationCenter } from './NotificationCenter';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { CollapsibleCard } from '../mobile/CollapsibleCard';
import { DepositModal } from './DepositModal';
import { springPhysics, lumeElevation } from '../../theme/capwheel';

// Spring configurations for kinetic movements
const dropdownSpring = springPhysics.quick;
const hoverSpring = springPhysics.snappy;

// Stagger animation for progressive disclosure
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springPhysics.gentle
  }
};

// Compact Header Bar with Profile Dropdown - Enhanced with kinetic physics
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
    <motion.header 
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPhysics.gentle}
      className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-gradient-to-r from-[#0B1015] via-[#0D1318] to-[#0B1015] flex-shrink-0 relative"
      style={{ boxShadow: `${lumeElevation.lume1.shadow}, ${lumeElevation.lume1.glow}` }}
    >
      {/* Subtle rim light on bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/10 to-transparent" />
      
      <div className="flex items-center gap-3">
        <motion.button 
          onClick={onMenuClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={hoverSpring}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <Menu size={20} />
        </motion.button>
        <span className="text-[10px] text-slate-500 uppercase tracking-[0.15em] hidden sm:inline">Overview /</span>
        <span className="text-sm font-semibold text-white tracking-tight">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Deposit CTA with accent glow */}
        <motion.button 
          onClick={onDepositClick}
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,255,157,0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={hoverSpring}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FF9D] to-[#00E88A] text-black text-xs font-bold rounded-lg shadow-lg shadow-[#00FF9D]/20"
        >
          <Wallet className="w-3.5 h-3.5" />
          Deposit
        </motion.button>

        {/* Live clock with accent color */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF9D] animate-pulse" />
          <span className="text-xs font-mono text-[#00FF9D] tracking-wider">
            {time.toLocaleTimeString('en-US', { hour12: false })} UTC
          </span>
        </div>

        {/* Icon buttons with kinetic hover */}
        <NotificationCenter />
        
        {/* Profile Dropdown with spring animation */}
        <div ref={profileRef} className="relative">
          <motion.button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={hoverSpring}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/[0.08]"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center shadow-lg shadow-[#00FF9D]/20">
              <User className="w-4 h-4 text-black" />
            </div>
            <motion.div
              animate={{ rotate: showProfileMenu ? 180 : 0 }}
              transition={springPhysics.quick}
            >
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.95 }}
                transition={dropdownSpring}
                className="absolute right-0 top-full mt-3 w-52 bg-[#0F1419]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: `${lumeElevation.lume3.shadow}, ${lumeElevation.lume3.glow}, 0 0 40px rgba(0,0,0,0.5)` }}
              >
                {/* User Info with gradient border accent */}
                <div className="px-4 py-4 border-b border-white/[0.06] relative">
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#00FF9D]/30 to-transparent" />
                  <p className="text-sm font-semibold text-white truncate">{user?.email || 'User'}</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{user?.role || 'Member'}</p>
                </div>

                {/* Menu Items with stagger animation */}
                <motion.div 
                  className="py-2"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.button
                    variants={staggerItem}
                    onClick={() => { navigate('/capwheel/profile'); setShowProfileMenu(false); }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                    transition={hoverSpring}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    <UserCircle className="w-4 h-4 text-[#00B8D4]" />
                    Profile Settings
                  </motion.button>
                  <motion.button
                    variants={staggerItem}
                    onClick={handleLogout}
                    whileHover={{ x: 4, backgroundColor: 'rgba(239,68,68,0.1)' }}
                    transition={hoverSpring}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
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
    <div className="h-screen w-screen flex bg-[#0B1015] overflow-hidden relative">
      {/* Atmospheric background with gradient depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1015] via-[#0D1318] to-[#0A0E12] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,255,157,0.03),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,184,212,0.02),transparent_60%)] pointer-events-none" />
      
      {/* Noise texture overlay for depth */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none noise-texture" />
      
      {/* Swipe Edge Detector for mobile */}
      <SwipeEdgeDetector onSwipeOpen={() => setIsMobileNavOpen(true)} />
      
      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)} 
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 relative z-10">
        <OrionSidebar />
      </div>

      {/* Main Content - NO SCROLL on Desktop, Scroll on Mobile */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
                <DashboardHeader 
          onMenuClick={() => setIsMobileNavOpen(true)} 
          onDepositClick={() => setIsDepositModalOpen(true)}
        />

        {/* Dashboard Grid with staggered entrance */}
        <motion.main 
          className={`flex-1 p-5 flex flex-col gap-4 ${isMobile ? 'overflow-y-auto pb-24' : 'overflow-hidden'}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Row 1: Metrics */}
          <motion.div variants={staggerItem} className="flex-shrink-0">
            <OrionMetricsGrid />
          </motion.div>

          {/* Row 2: Chart + Projection */}
          {isMobile ? (
            <motion.div variants={staggerItem} className="flex flex-col gap-4">
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
            </motion.div>
          ) : (
            <motion.div variants={staggerItem} className="flex-1 grid grid-cols-3 gap-4 min-h-0">
              <div className="col-span-2 min-h-0 flex flex-col gap-4">
                <motion.div 
                  className="h-[55%] min-h-0"
                  // Removed expensive scale animation on large container
                  transition={springPhysics.gentle}
                >
                  <OrionWealthChart />
                </motion.div>
                <motion.div 
                  className="flex-1 min-h-0"
                  // Removed expensive scale animation on large container
                  transition={springPhysics.gentle}
                >
                  <OrionTransactionLedger />
                </motion.div>
              </div>
              <motion.div 
                className="col-span-1 min-h-[340px] flex flex-col"
                // Removed expensive scale animation on large container
                transition={springPhysics.gentle}
              >
                <div className="flex-1">
                  <OrionWealthProjection />
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.main>

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
