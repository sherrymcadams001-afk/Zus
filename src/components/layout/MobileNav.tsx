/**
 * Mobile Navigation Component
 * 
 * Bottom navigation bar for mobile devices
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  Wallet,
  Menu,
  type LucideIcon,
} from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

export interface MobileNavProps {
  items?: MobileNavItem[];
  activeItem?: string;
  onItemClick?: (item: MobileNavItem) => void;
  className?: string;
}

const defaultNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Trading', icon: BarChart3 },
  { id: 'bots', label: 'Bots', icon: Bot },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'menu', label: 'More', icon: Menu },
];

export function MobileNav({
  items = defaultNavItems,
  activeItem = 'dashboard',
  onItemClick,
  className,
}: MobileNavProps) {
  const handleItemClick = (item: MobileNavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <nav
      className={twMerge(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-orion-panel/95 backdrop-blur-lg border-t border-[rgba(255,255,255,0.05)]',
        'safe-area-pb',
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-orion-cyan'
                  : 'text-orion-slate-dark hover:text-orion-slate'
              )}
            >
              <div
                className={clsx(
                  'relative p-1.5 rounded-lg transition-colors',
                  isActive && 'bg-orion-cyan/10'
                )}
              >
                <Icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-orion-cyan rounded-full shadow-glow-cyan" />
                )}
              </div>
              <span className={clsx(
                'text-[10px] font-medium',
                isActive ? 'text-orion-cyan' : 'text-orion-slate-dark'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
