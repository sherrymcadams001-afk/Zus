/**
 * Mobile Navigation Drawer Component
 * 
 * Slide-in/slide-out sidebar with smooth Framer Motion animations
 * Premium hedge fund aesthetic with glass morphism
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  PieChart,
  ArrowRightLeft,
  FileText,
  Users,
  Shield,
  Activity,
  CheckCircle2,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { CapWheelLogo } from '../../assets/capwheel-logo';
import { useDashboardData } from '../../hooks/useDashboardData';
import { ORION_MOTION } from '../../theme/orion-design-system';
import { useState } from 'react';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  onClick?: () => void;
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const NavItem = ({ to, icon, label, badge, onClick }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
        transition-all duration-200 min-h-[48px] touch-manipulation
        ${isActive
          ? 'bg-[#00FF9D]/10 text-[#00FF9D] border-l-2 border-[#00FF9D]'
          : 'text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10'
        }
      `}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00FF9D]/20 text-[#00FF9D]">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

const NavGroup = ({ title, children, defaultOpen = true }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors touch-manipulation min-h-[44px]"
      >
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3" />
        </motion.span>
        {title}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pl-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Animation variants for premium hedge fund feel
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants = {
  hidden: { x: '-100%', opacity: 0.5 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
      mass: 0.8,
    }
  },
  exit: { 
    x: '-100%', 
    opacity: 0.5,
    transition: {
      type: 'spring',
      damping: 35,
      stiffness: 400,
    }
  },
};

export const MobileNavDrawer = ({ isOpen, onClose }: MobileNavDrawerProps) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { data } = useDashboardData({ pollingInterval: 60000 });
  const [latency] = useState(() => Math.floor(Math.random() * 15) + 8);

  // Get tier display info
  const tierColors: Record<string, string> = {
    protobot: 'text-slate-400',
    chainpulse: 'text-[#00B8D4]',
    titan: 'text-purple-400',
    omega: 'text-[#00FF9D]',
  };

  const tierColor = tierColors[data.currentTier] || 'text-[#00B8D4]';

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: ORION_MOTION.duration.normal / 1000 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            ref={drawerRef}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-[#0B1015]/95 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <CapWheelLogo size={36} animate={false} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-wider text-white">
                    CAP<span className="text-[#00FF9D]">WHEEL</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-500">
                    Brokerage Collective
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              {/* Overview Module */}
              <NavGroup title="Overview" defaultOpen={true}>
                <NavItem
                  to="/capwheel/dashboard"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Dashboard"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/markets"
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Live Markets"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/trading"
                  icon={<Zap className="w-4 h-4" />}
                  label="Trading Agent"
                  badge="LIVE"
                  onClick={onClose}
                />
              </NavGroup>

              {/* Capital Management Module */}
              <NavGroup title="Capital Management" defaultOpen={true}>
                <NavItem
                  to="/capwheel/strategy-pools"
                  icon={<Wallet className="w-4 h-4" />}
                  label="Strategy Pools"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/allocation"
                  icon={<PieChart className="w-4 h-4" />}
                  label="Asset Allocation"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/liquidity"
                  icon={<ArrowRightLeft className="w-4 h-4" />}
                  label="Liquidity Events"
                  onClick={onClose}
                />
              </NavGroup>

              {/* Governance & Audit Module */}
              <NavGroup title="Governance & Audit" defaultOpen={false}>
                <NavItem
                  to="/capwheel/ledger"
                  icon={<FileText className="w-4 h-4" />}
                  label="General Ledger"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/partners"
                  icon={<Users className="w-4 h-4" />}
                  label="Partner Network"
                  onClick={onClose}
                />
                <NavItem
                  to="/capwheel/security"
                  icon={<Shield className="w-4 h-4" />}
                  label="Security Center"
                  onClick={onClose}
                />
              </NavGroup>
            </nav>

            {/* Status Footer */}
            <div className="border-t border-white/5 p-4 space-y-3 flex-shrink-0">
              {/* System Latency */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF9D] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF9D]" />
                </span>
                <span className="text-xs text-slate-400">
                  System Latency: <span className="text-[#00FF9D] font-mono">{latency}ms</span>
                </span>
              </div>

              {/* User Status */}
              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00FF9D]" />
                  <span className="text-xs text-slate-300">KYC: <span className="text-[#00FF9D]">Verified</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00B8D4]" />
                  <span className="text-xs text-slate-300">
                    Plan: <span className={`font-bold ${tierColor}`}>{data.tierConfig.name}</span>
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 pt-1 border-t border-white/5">
                  AUM: ${data.aum.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNavDrawer;
