/**
 * Status Indicator Component
 * 
 * Connection status light with pulsing animations
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type StatusType = 'connected' | 'active' | 'error' | 'latency' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  connected: {
    color: 'bg-orion-cyan',
    glow: 'shadow-[0_0_8px_rgba(69,162,158,0.6)]',
    text: 'text-orion-cyan',
    label: 'Connected',
  },
  active: {
    color: 'bg-orion-success',
    glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    text: 'text-orion-success',
    label: 'Active',
  },
  error: {
    color: 'bg-orion-danger',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    text: 'text-orion-danger',
    label: 'Error',
  },
  latency: {
    color: 'bg-orion-warning',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    text: 'text-orion-warning',
    label: 'High Latency',
  },
  offline: {
    color: 'bg-orion-slate-dark',
    glow: '',
    text: 'text-orion-slate-dark',
    label: 'Offline',
  },
};

const sizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
};

export function StatusIndicator({
  status,
  label,
  showLabel = true,
  size = 'md',
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <div className={twMerge('flex items-center gap-2', className)}>
      <span
        className={clsx(
          'rounded-full',
          sizes[size],
          config.color,
          config.glow,
          status !== 'offline' && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span
          className={clsx(
            'text-xs font-medium uppercase tracking-wider',
            config.text
          )}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}
