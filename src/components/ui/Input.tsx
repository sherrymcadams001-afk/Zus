/**
 * Input Component
 * 
 * Terminal-style input with neon underline and focus glow effects
 * Part of the Orion Design System - "Institutional Cybernetics"
 */

import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  terminal?: boolean;
  monospace?: boolean;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      terminal = false,
      monospace = false,
      helperText,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full bg-transparent text-white placeholder-orion-slate-dark transition-all duration-200 focus:outline-none';
    
    const standardStyles = 'px-4 py-3 bg-orion-bg-secondary border border-[rgba(255,255,255,0.08)] rounded-lg focus:border-orion-cyan/50 focus:ring-2 focus:ring-orion-cyan/20';
    
    const terminalStyles = 'py-2 border-0 border-b border-[rgba(255,255,255,0.08)] rounded-none focus:border-b-orion-cyan focus:shadow-[0_2px_10px_rgba(69,162,158,0.2)]';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-orion-slate mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              baseStyles,
              terminal ? terminalStyles : standardStyles,
              monospace && 'font-mono',
              error && (terminal ? 'border-b-orion-danger' : 'border-orion-danger focus:border-orion-danger focus:ring-orion-danger/20')
            ),
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs text-orion-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-xs text-orion-slate-dark">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
