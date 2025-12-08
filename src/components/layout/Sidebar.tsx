/**
 * Sidebar Component
 * 
 * Collapsible navigation sidebar with icons and smooth animations
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  Wallet,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

export interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (item: NavItem) => void;
  defaultCollapsed?: boolean;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Trading', icon: BarChart3 },
  { id: 'bots', label: 'AI Bots', icon: Bot, badge: 'PRO' },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar({
  items = defaultNavItems,
  activeItem = 'dashboard',
  onItemClick,
  defaultCollapsed = false,
  className,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  return (
    <aside
      className={twMerge(
        clsx(
          'flex flex-col bg-orion-panel border-r border-[rgba(255,255,255,0.05)] transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-60'
        ),
        className
      )}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-orion-cyan/10 text-orion-cyan border-l-2 border-orion-cyan'
                  : 'text-orion-slate hover:text-orion-text-primary hover:bg-orion-bg-hover border-l-2 border-transparent'
              )}
            >
              <Icon className={clsx('h-5 w-5 flex-shrink-0', isActive && 'text-orion-cyan')} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orion-cyan/20 text-orion-cyan rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[rgba(255,255,255,0.05)]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 text-orion-slate hover:text-orion-text-primary hover:bg-orion-bg-hover rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
