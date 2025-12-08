/**
 * Mobile Bottom Navigation Component
 * 
 * Bottom action bar for mobile with touch-optimized targets
 * Premium hedge fund aesthetic with glass morphism
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  Wallet,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { ORION_MOTION } from '../../theme/orion-design-system';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface MobileBottomNavProps {
  onMenuClick?: () => void;
  className?: string;
}

const defaultNavItems: BottomNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/capwheel/dashboard' },
  { id: 'markets', label: 'Markets', icon: TrendingUp, href: '/capwheel/markets' },
  { id: 'trading', label: 'Trading', icon: Zap, href: '/capwheel/trading' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/capwheel/strategy-pools' },
];

export const MobileBottomNav = ({ onMenuClick, className = '' }: MobileBottomNavProps) => {
  const location = useLocation();

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden ${className}`}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-[#0B1015]/90 backdrop-blur-xl border-t border-white/5" />
      
      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex items-center justify-around w-full h-16">
          {defaultNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.href) {
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation min-w-[64px]"
                  aria-current={active ? 'page' : undefined}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: ORION_MOTION.duration.instant / 1000 }}
                    className={`
                      relative p-2 rounded-xl transition-all duration-200
                      min-w-[44px] min-h-[44px] flex items-center justify-center
                      ${active 
                        ? 'bg-[#00FF9D]/15 text-[#00FF9D]' 
                        : 'text-slate-500 hover:text-slate-300 active:bg-white/5'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    {active && (
                      <motion.span
                        layoutId="bottomNav-indicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 bg-[#00FF9D] rounded-full shadow-[0_0_8px_rgba(0,255,157,0.6)]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                  <span className={`
                    text-[10px] font-medium transition-colors
                    ${active ? 'text-[#00FF9D]' : 'text-slate-500'}
                  `}>
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation min-w-[64px]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: ORION_MOTION.duration.instant / 1000 }}
                  className="relative p-2 rounded-xl text-slate-500 hover:text-slate-300 active:bg-white/5 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </motion.div>
                <span className="text-[10px] font-medium text-slate-500">
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 touch-manipulation min-w-[64px]"
            aria-label="Open navigation menu"
            aria-expanded="false"
            aria-controls="mobile-nav-drawer"
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              transition={{ duration: ORION_MOTION.duration.instant / 1000 }}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-300 active:bg-white/5 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </motion.div>
            <span className="text-[10px] font-medium text-slate-500">
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
