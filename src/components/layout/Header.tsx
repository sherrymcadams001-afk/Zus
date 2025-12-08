/**
 * Header Component
 * 
 * Top header bar with logo, status indicator, and user controls
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { Bell, User, ChevronDown, Zap } from 'lucide-react';
import { StatusIndicator, type StatusType } from '../ui/StatusIndicator';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface HeaderProps {
  variant?: 'compact' | 'spacious';
  status?: StatusType;
  showNotifications?: boolean;
  showProfile?: boolean;
  notificationCount?: number;
  userName?: string;
  className?: string;
}

export function Header({
  variant = 'compact',
  status = 'connected',
  showNotifications = true,
  showProfile = true,
  notificationCount = 0,
  userName = 'User',
  className,
}: HeaderProps) {
  const heights = {
    compact: 'h-12',
    spacious: 'h-16',
  };

  return (
    <header
      className={twMerge(
        clsx(
          'flex items-center justify-between bg-orion-panel border-b border-[rgba(255,255,255,0.05)] px-4',
          heights[variant]
        ),
        className
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded bg-orion-cyan/10 border border-orion-cyan/20">
          <Zap className="h-5 w-5 text-orion-cyan" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold tracking-widest text-white leading-none">
            TRADING <span className="text-orion-cyan">AGENT</span>
          </h1>
          <span className="text-[9px] uppercase tracking-widest text-orion-slate-dark leading-none mt-1">
            Autonomous Trading System
          </span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center">
          <StatusIndicator status={status} size="sm" />
        </div>

        {/* Notifications */}
        {showNotifications && (
          <button className="relative p-2 text-orion-slate hover:text-orion-text-primary hover:bg-orion-bg-hover rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-orion-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        )}

        {/* User Profile Dropdown */}
        {showProfile && (
          <button className="flex items-center gap-2 p-2 text-orion-slate hover:text-orion-text-primary hover:bg-orion-bg-hover rounded-lg transition-colors">
            <div className="h-7 w-7 bg-orion-bg-elevated rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.08)]">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden md:block text-sm font-medium">{userName}</span>
            <ChevronDown className="h-4 w-4 hidden md:block" />
          </button>
        )}
      </div>
    </header>
  );
}
