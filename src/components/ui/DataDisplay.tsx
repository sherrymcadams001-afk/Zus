/**
 * Data Display Component
 * 
 * Formatted data display with monospace font and trend colors
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface DataDisplayProps {
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  monospace?: boolean;
  showIcon?: boolean;
  className?: string;
}

const sizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

const trendConfig = {
  up: {
    color: 'text-orion-success',
    Icon: TrendingUp,
  },
  down: {
    color: 'text-orion-danger',
    Icon: TrendingDown,
  },
  neutral: {
    color: 'text-orion-slate',
    Icon: Minus,
  },
};

export function DataDisplay({
  value,
  trend,
  prefix,
  suffix,
  size = 'md',
  monospace = true,
  showIcon = true,
  className,
}: DataDisplayProps) {
  const config = trend ? trendConfig[trend] : null;
  const TrendIcon = config?.Icon;

  // Format number values
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : value;

  return (
    <div
      className={twMerge(
        clsx(
          'flex items-center gap-1.5',
          sizes[size],
          monospace && 'font-mono tabular-nums',
          config?.color || 'text-orion-text-primary',
          'font-semibold tracking-tight'
        ),
        className
      )}
    >
      {showIcon && TrendIcon && (
        <TrendIcon className={clsx('flex-shrink-0', {
          'h-3 w-3': size === 'sm',
          'h-4 w-4': size === 'md',
          'h-5 w-5': size === 'lg',
          'h-6 w-6': size === 'xl',
        })} />
      )}
      <span>
        {prefix}
        {formattedValue}
        {suffix}
      </span>
    </div>
  );
}

/**
 * Price Display variant for financial data
 */
export interface PriceDisplayProps {
  price: number;
  change?: number;
  changePercent?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  size = 'md',
  showChange = true,
  className,
}: PriceDisplayProps) {
  const trend = change !== undefined 
    ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral')
    : undefined;

  return (
    <div className={twMerge('flex flex-col gap-0.5', className)}>
      <DataDisplay
        value={price}
        prefix="$"
        size={size}
        trend={trend}
        showIcon={false}
      />
      {showChange && change !== undefined && (
        <div className={clsx(
          'flex items-center gap-2 text-xs font-mono tabular-nums',
          trend === 'up' ? 'text-orion-success' : trend === 'down' ? 'text-orion-danger' : 'text-orion-slate'
        )}>
          <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}</span>
          {changePercent !== undefined && (
            <span>({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)</span>
          )}
        </div>
      )}
    </div>
  );
}
