/**
 * ORION Sidebar Navigation - Enterprise Edition
 * 
 * Command Center with:
 * - Atmospheric depth (gradient backgrounds, noise texture)
 * - Spring physics navigation
 * - Surgical accent glows on active states
 * - Breathing logo animation
 * - Lume-elevation hierarchy
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { StrategyInsignia, getStrategyById } from './StrategyPools';
import { springPhysics } from '../../theme/capwheel';
import {
  LayoutDashboard,
  User,
  ChevronDown,
  Wallet,
  Users,
  Shield,
  Zap,
  FileCode,
} from 'lucide-react';
import { CapWheelLogo } from '../../assets/capwheel-logo';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  external?: boolean;
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const NavItem = ({ to, icon, label, badge, external }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  const baseClasses = `
    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
    transition-all duration-200 group relative overflow-hidden
  `;

  const activeClasses = isActive
    ? 'bg-[#00FF9D]/10 text-[#00FF9D]'
    : 'text-slate-400 hover:text-white hover:bg-white/5';

  const content = (
    <>
      {/* Active glow background */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#00FF9D]/10 via-[#00FF9D]/5 to-transparent"
          layoutId="nav-glow-bg"
          transition={springPhysics.snappy}
        />
      )}
      
      {/* Icon with glow on active */}
      <motion.span 
        className={`w-5 h-5 flex items-center justify-center relative z-10 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : ''}`}
        whileHover={{ scale: 1.1 }}
        transition={springPhysics.quick}
      >
        {icon}
      </motion.span>
      
      <span className="flex-1 relative z-10">{label}</span>
      
      {badge && (
        <motion.span 
          className={`px-2 py-0.5 text-[10px] font-bold rounded-md relative z-10 ${
            badge === 'LIVE' 
              ? 'bg-[#00FF9D]/20 text-[#00FF9D] shadow-[0_0_12px_rgba(0,255,157,0.3)]' 
              : badge === 'ADMIN'
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
              : 'bg-[#00FF9D]/20 text-[#00FF9D]'
          }`}
          animate={badge === 'LIVE' ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {badge}
        </motion.span>
      )}
      
      {/* Active indicator line */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-[#00FF9D] to-[#00B8D4] shadow-[0_0_12px_rgba(0,255,157,0.6)]"
          transition={springPhysics.snappy}
        />
      )}
    </>
  );

  if (external) {
    return (
      <a href={to} className={`${baseClasses} ${activeClasses}`} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <NavLink to={to} className={`${baseClasses} ${activeClasses}`}>
      {content}
    </NavLink>
  );
};

const NavGroup = ({ title, children, defaultOpen = true }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors group"
      >
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={springPhysics.quick}
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
            transition={springPhysics.gentle}
            className="overflow-hidden"
          >
            <div className="space-y-1 pl-1 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OrionSidebar = () => {
  const [latency] = useState(() => Math.floor(Math.random() * 15) + 8);
  const user = useAuthStore((state) => state.user);
  const { currentTier } = usePortfolioStore();
  const strategy = getStrategyById(currentTier || 'delta');

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-[#0B1015] via-[#0B1015] to-[#0A0E12] border-r border-white/5 flex flex-col relative overflow-hidden">
      {/* Atmospheric depth - subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FF9D]/[0.02] via-transparent to-[#00B8D4]/[0.02] pointer-events-none" />
      
      {/* Noise texture for depth */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
      
      {/* Logo Header with breathing animation */}
      <motion.div 
        className="h-16 flex items-center gap-3 px-4 border-b border-white/5 relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPhysics.snappy}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="relative"
        >
          {/* Logo glow halo */}
          <div className="absolute inset-0 blur-xl bg-[#00FF9D]/20 rounded-full scale-150" />
          <CapWheelLogo size={40} animate={false} />
        </motion.div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider text-white">
            CAP<span className="text-[#00FF9D] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">WHEEL</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-500">
            Brokerage Collective
          </span>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 relative z-10">
        {/* Overview Module */}
        <NavGroup title="Overview" defaultOpen={true}>
          <NavItem
            to="/capwheel/dashboard"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          <NavItem
            to="/capwheel/profile"
            icon={<User className="w-4 h-4" />}
            label="Profile"
          />
          <NavItem
            to="/capwheel/protocol"
            icon={<FileCode className="w-4 h-4" />}
            label="Asset Protocol"
          />
          <NavItem
            to="/capwheel/trading"
            icon={<Zap className="w-4 h-4" />}
            label="Trading Agent"
            badge="LIVE"
          />
          <NavItem
            to="/capwheel/strategy-pools"
            icon={<Wallet className="w-4 h-4" />}
            label="Strategy Pools"
          />
          <NavItem
            to="/capwheel/partners"
            icon={<Users className="w-4 h-4" />}
            label="Network"
          />
          {user?.role === 'admin' && (
            <NavItem
              to="/capwheel/admin"
              icon={<Shield className="w-4 h-4" />}
              label="Admin Panel"
              badge="ADMIN"
            />
          )}
        </NavGroup>
      </nav>

      {/* Status Footer with lume elevation */}
      <motion.div 
        className="border-t border-white/5 p-4 space-y-3 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...springPhysics.snappy }}
      >
        {/* System Latency with enhanced glow */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF9D] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF9D] shadow-[0_0_8px_rgba(0,255,157,0.6)]" />
          </span>
          <span className="text-xs text-slate-400">
            Latency: <span className="text-[#00FF9D] font-mono drop-shadow-[0_0_4px_rgba(0,255,157,0.4)]">{latency}ms</span>
          </span>
        </div>

        {/* User Status Card with lume-2 */}
        <motion.div 
          className="bg-[#0F1419] border border-white/5 rounded-xl p-3 space-y-2 lume-2"
          whileHover={{ scale: 1.01 }}
          transition={springPhysics.quick}
        >
          <div className="flex items-center gap-3">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center text-black font-bold text-sm shadow-[0_0_16px_rgba(0,255,157,0.3)]">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#00FF9D] rounded-full border-2 border-[#0F1419] shadow-[0_0_6px_rgba(0,255,157,0.6)]" />
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{user?.email?.split('@')[0] || 'User'}</span>
                {strategy && <StrategyInsignia strategyId={strategy.id} size="sm" />}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ID: {user?.id || '---'}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </aside>
  );
};
