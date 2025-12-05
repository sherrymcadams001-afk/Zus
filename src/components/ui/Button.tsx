/**
 * Button Component
 * 
 * Enhanced button with glow effects, variants, and loading states
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  pulse?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      glow = false,
      pulse = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-orion-bg disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-orion-cyan text-white hover:bg-orion-cyan-bright focus:ring-orion-cyan',
      secondary: 'bg-orion-bg-secondary text-orion-text-primary border border-orion-border hover:bg-orion-bg-elevated hover:border-orion-border-hover focus:ring-orion-slate-dark',
      outline: 'bg-transparent border border-orion-cyan/30 text-orion-cyan hover:bg-orion-cyan/10 hover:border-orion-cyan focus:ring-orion-cyan',
      ghost: 'bg-transparent text-orion-text-secondary hover:bg-orion-bg-hover hover:text-orion-text-primary focus:ring-orion-slate-dark',
      danger: 'bg-orion-danger text-white hover:bg-red-500 focus:ring-orion-danger',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const glowStyles = {
      primary: 'shadow-glow-cyan-md hover:shadow-glow-cyan-lg',
      secondary: '',
      outline: 'hover:shadow-glow-cyan',
      ghost: '',
      danger: 'shadow-glow-red hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]',
    };

    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            baseStyles,
            variants[variant],
            sizes[size],
            glow && glowStyles[variant],
            pulse && 'animate-pulse-glow',
            loading && 'cursor-wait'
          ),
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
