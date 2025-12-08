/**
 * Card Component
 * 
 * Glassmorphism card with multiple variants and hover effects
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  glow?: boolean;
  hoverable?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = false, hoverable = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-orion-bg-secondary border border-[rgba(255,255,255,0.08)]',
      glass: 'bg-[rgba(31,40,51,0.6)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)]',
      elevated: 'bg-orion-bg-elevated border border-[rgba(255,255,255,0.08)] shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-xl transition-all duration-200',
            variants[variant],
            glow && 'shadow-glow-cyan',
            hoverable && 'hover:border-[rgba(255,255,255,0.15)] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(69,162,158,0.2)]'
          ),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, gradient = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'px-6 py-4 border-b border-[rgba(255,255,255,0.08)]',
            gradient && 'bg-gradient-to-r from-orion-cyan/10 to-transparent'
          ),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={twMerge('p-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge('px-6 py-4 border-t border-[rgba(255,255,255,0.08)]', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
