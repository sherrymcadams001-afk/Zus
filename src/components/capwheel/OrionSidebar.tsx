/**
 * ORION Sidebar Navigation
 * 
 * Command Center - Enterprise hierarchical navigation
 * Modules: Overview, Capital Management, Governance & Audit
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  User,
  ChevronDown,
  Wallet,
  PieChart,
  ArrowRightLeft,
  FileText,
  Users,
  Shield,
  Activity,
  Zap,
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
    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
    transition-all duration-200 group relative
  `;

  const activeClasses = isActive
    ? 'bg-[#00FF9D]/10 text-[#00FF9D] border-l-2 border-[#00FF9D] ml-[-1px]'
    : 'text-slate-400 hover:text-white hover:bg-white/5';

  if (external) {
    return (
      <a href={to} className={`${baseClasses} ${activeClasses}`} target="_blank" rel="noopener noreferrer">
        <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00FF9D]/20 text-[#00FF9D]">
            {badge}
          </span>
        )}
      </a>
    );
  }

  return (
    <NavLink to={to} className={`${baseClasses} ${activeClasses}`}>
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#00FF9D]/20 text-[#00FF9D]">
          {badge}
        </span>
      )}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00FF9D]"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </NavLink>
  );
};

const NavGroup = ({ title, children, defaultOpen = true }: NavGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 w-full text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-400 transition-colors"
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
            <div className="space-y-0.5 pl-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OrionSidebar = () => {
  const [latency] = useState(() => Math.floor(Math.random() * 15) + 8);
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-64 h-screen bg-[#0B1015] border-r border-white/5 flex flex-col">
      {/* Logo Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/5">
        <CapWheelLogo size={40} animate={false} />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-wider text-white">
            CAP<span className="text-[#00FF9D]">WHEEL</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-500">
            Brokerage Collective
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
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
            to="/capwheel/trading"
            icon={<Zap className="w-4 h-4" />}
            label="Trading Agent"
            badge="LIVE"
          />
        </NavGroup>

        {/* Capital Management Module */}
        <NavGroup title="Capital Management" defaultOpen={true}>
          <NavItem
            to="/capwheel/strategy-pools"
            icon={<Wallet className="w-4 h-4" />}
            label="Strategy Pools"
          />
          <NavItem
            to="/capwheel/allocation"
            icon={<PieChart className="w-4 h-4" />}
            label="Asset Allocation"
          />
          <NavItem
            to="/capwheel/liquidity"
            icon={<ArrowRightLeft className="w-4 h-4" />}
            label="Liquidity Events"
          />
        </NavGroup>

        {/* Governance & Audit Module */}
        <NavGroup title="Governance & Audit" defaultOpen={false}>
          {user?.role === 'admin' && (
            <NavItem
              to="/capwheel/admin"
              icon={<Shield className="w-4 h-4" />}
              label="Admin Panel"
              badge="ADMIN"
            />
          )}
          <NavItem
            to="/capwheel/ledger"
            icon={<FileText className="w-4 h-4" />}
            label="General Ledger"
          />
          <NavItem
            to="/capwheel/partners"
            icon={<Users className="w-4 h-4" />}
            label="Partner Network"
          />
          <NavItem
            to="/capwheel/security"
            icon={<Shield className="w-4 h-4" />}
            label="Security Center"
          />
        </NavGroup>
      </nav>

      {/* Status Footer */}
      <div className="border-t border-white/5 p-4 space-y-3">
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
        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] flex items-center justify-center text-black font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{user?.email || 'User'}</span>
              <span className="text-[10px] text-slate-400">ID: {user?.id || '---'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Activity className="w-3 h-3 text-[#00B8D4]" />
            <span className="text-[10px] text-slate-300">Tier: <span className="text-[#00B8D4] font-bold">PROTOBOT</span></span>
          </div>
        </div>
      </div>
    </aside>
  );
};
