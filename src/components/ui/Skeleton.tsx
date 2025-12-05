/**
 * Skeleton Component
 * 
 * Shimmer loading skeleton with cyan-tinted animation
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps {
  variant?: 'text' | 'card' | 'chart' | 'avatar' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'bg-orion-bg-secondary rounded animate-shimmer';
  
  const shimmerGradient = {
    background: 'linear-gradient(90deg, var(--orion-bg-secondary, #1F2833) 25%, rgba(69, 162, 158, 0.1) 50%, var(--orion-bg-secondary, #1F2833) 75%)',
    backgroundSize: '200% 100%',
  };

  const variants = {
    text: 'h-4 rounded',
    card: 'h-32 rounded-xl',
    chart: 'h-64 rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
    rectangular: 'rounded-lg',
  };

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className={twMerge('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(baseStyles, variants.text)}
            style={{
              ...shimmerGradient,
              width: i === lines - 1 ? '70%' : width || '100%',
              height: height,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={twMerge(clsx(baseStyles, variants[variant]), className)}
      style={{
        ...shimmerGradient,
        width: width || (variant === 'avatar' ? '40px' : '100%'),
        height: height || undefined,
      }}
    />
  );
}

/**
 * Skeleton wrapper for content that's loading
 */
export interface SkeletonWrapperProps {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SkeletonWrapper({
  loading,
  skeleton,
  children,
  className,
}: SkeletonWrapperProps) {
  return (
    <div className={className}>
      {loading ? skeleton : children}
    </div>
  );
}

/**
 * Common skeleton presets
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={twMerge('p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height="80px" />
      <Skeleton lines={3} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === 0 ? '30%' : '20%'} 
          className="flex-shrink-0"
        />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={twMerge('space-y-4', className)}>
      <div className="flex justify-between items-center">
        <Skeleton width="120px" />
        <div className="flex gap-2">
          <Skeleton width="40px" />
          <Skeleton width="40px" />
          <Skeleton width="40px" />
        </div>
      </div>
      <Skeleton variant="chart" />
    </div>
  );
}
