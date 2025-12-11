/**
 * Kinetic UI Components - Enterprise Edition
 * 
 * Reusable components with:
 * - Spring physics animations
 * - Lume-elevation system
 * - Surgical accents
 * - Sensory feedback
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { springPhysics } from '../../theme/capwheel';

// ============================================
// KINETIC CARD
// Card with spring physics hover and lume elevation
// ============================================

interface KineticCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  lume?: 1 | 2 | 3 | 4 | 5;
  accent?: 'primary' | 'secondary' | 'gold' | 'none';
  hover?: 'lift' | 'glow' | 'both' | 'none';
  className?: string;
}

export const KineticCard = ({ 
  children, 
  lume = 2, 
  accent = 'none',
  hover = 'both',
  className = '',
  ...props 
}: KineticCardProps) => {
  const lumeClasses: Record<number, string> = {
    1: 'lume-1',
    2: 'lume-2',
    3: 'lume-3',
    4: 'lume-4',
    5: 'lume-5',
  };

  const accentClasses: Record<string, string> = {
    primary: 'border-[#00FF9D]/20 hover:border-[#00FF9D]/40',
    secondary: 'border-[#00B8D4]/20 hover:border-[#00B8D4]/40',
    gold: 'border-[#D4AF37]/20 hover:border-[#D4AF37]/40',
    none: 'border-white/5 hover:border-white/10',
  };

  const hoverVariants = {
    lift: { y: -4, scale: 1.01 },
    glow: { scale: 1 },
    both: { y: -4, scale: 1.01 },
    none: {},
  };

  return (
    <motion.div
      className={`
        relative bg-[#0F1419] border rounded-xl overflow-hidden
        ${lumeClasses[lume]}
        ${accentClasses[accent]}
        transition-colors duration-200
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover !== 'none' ? hoverVariants[hover] : undefined}
      whileTap={{ scale: 0.98 }}
      transition={springPhysics.snappy}
      {...props}
    >
      {/* Rim light effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Accent glow overlay (on hover) */}
      {accent !== 'none' && (hover === 'glow' || hover === 'both') && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: accent === 'primary' 
              ? 'radial-gradient(ellipse at center, rgba(0, 255, 157, 0.05) 0%, transparent 70%)'
              : accent === 'secondary'
              ? 'radial-gradient(ellipse at center, rgba(0, 184, 212, 0.05) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
          }}
        />
      )}
      
      {children}
    </motion.div>
  );
};

// ============================================
// GLOW BADGE
// Badge with pulsing accent ring and blur backdrop
// ============================================

interface GlowBadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'gold' | 'success' | 'danger';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlowBadge = ({ 
  children, 
  variant = 'primary',
  pulse = false,
  size = 'md',
  className = '' 
}: GlowBadgeProps) => {
  const variantStyles: Record<string, { bg: string; text: string; glow: string }> = {
    primary: {
      bg: 'bg-[#00FF9D]/15',
      text: 'text-[#00FF9D]',
      glow: 'shadow-[0_0_12px_rgba(0,255,157,0.3)]',
    },
    secondary: {
      bg: 'bg-[#00B8D4]/15',
      text: 'text-[#00B8D4]',
      glow: 'shadow-[0_0_12px_rgba(0,184,212,0.3)]',
    },
    gold: {
      bg: 'bg-[#D4AF37]/15',
      text: 'text-[#D4AF37]',
      glow: 'shadow-[0_0_12px_rgba(212,175,55,0.3)]',
    },
    success: {
      bg: 'bg-[#00FF88]/15',
      text: 'text-[#00FF88]',
      glow: 'shadow-[0_0_12px_rgba(0,255,136,0.3)]',
    },
    danger: {
      bg: 'bg-[#FF3366]/15',
      text: 'text-[#FF3366]',
      glow: 'shadow-[0_0_12px_rgba(255,51,102,0.3)]',
    },
  };

  const sizeClasses: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2 py-0.5 text-[10px]',
    lg: 'px-2.5 py-1 text-xs',
  };

  const styles = variantStyles[variant];

  return (
    <motion.span
      className={`
        inline-flex items-center justify-center
        ${styles.bg} ${styles.text} ${styles.glow}
        ${sizeClasses[size]}
        font-bold uppercase tracking-wider
        rounded-md backdrop-blur-sm
        ${pulse ? 'animate-glow-pulse' : ''}
        ${className}
      `}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springPhysics.bouncy}
    >
      {children}
    </motion.span>
  );
};

// ============================================
// FLUID VALUE
// Animated number ticker with trend indicator
// ============================================

interface FluidValueProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

export const FluidValue = ({ 
  value, 
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  size = 'md',
  animate = true,
  className = '' 
}: FluidValueProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  
  // Spring animation for value changes
  const springValue = useSpring(value, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });
  
  const animatedValue = useTransform(springValue, (v) => v.toFixed(decimals));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsubscribe = animatedValue.on('change', (v) => {
      setDisplayValue(parseFloat(v));
    });
    return unsubscribe;
  }, [animatedValue]);

  const sizeClasses: Record<string, string> = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const trendColors: Record<string, string> = {
    up: 'text-[#00FF88]',
    down: 'text-[#FF3366]',
    neutral: 'text-white',
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${prefix}${(val / 1000000).toFixed(decimals)}M${suffix}`;
    }
    if (val >= 1000) {
      return `${prefix}${(val / 1000).toFixed(decimals)}K${suffix}`;
    }
    return `${prefix}${val.toFixed(decimals)}${suffix}`;
  };

  return (
    <motion.span
      className={`
        font-bold font-mono tabular-nums
        ${sizeClasses[size]}
        ${trend ? trendColors[trend] : 'text-white'}
        ${className}
      `}
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={springPhysics.snappy}
    >
      {animate ? formatValue(displayValue) : formatValue(value)}
    </motion.span>
  );
};

// ============================================
// ACCENT ICON
// Icon wrapper with glow effect
// ============================================

interface AccentIconProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
}

export const AccentIcon = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  className = '',
}: AccentIconProps) => {
  const variantStyles: Record<string, { bg: string; icon: string; shadow: string }> = {
    primary: {
      bg: 'bg-[#00FF9D]/10',
      icon: 'text-[#00FF9D]',
      shadow: glow ? 'shadow-[0_0_20px_rgba(0,255,157,0.2)]' : '',
    },
    secondary: {
      bg: 'bg-[#00B8D4]/10',
      icon: 'text-[#00B8D4]',
      shadow: glow ? 'shadow-[0_0_20px_rgba(0,184,212,0.2)]' : '',
    },
    gold: {
      bg: 'bg-[#D4AF37]/10',
      icon: 'text-[#D4AF37]',
      shadow: glow ? 'shadow-[0_0_20px_rgba(212,175,55,0.2)]' : '',
    },
  };

  const sizeClasses: Record<string, string> = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`
        rounded-xl flex items-center justify-center
        ${styles.bg} ${styles.shadow}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <div className={styles.icon}>{children}</div>
    </div>
  );
};

// ============================================
// SECTION HEADER
// Header with accent underline and proper spacing
// ============================================

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  accent?: 'primary' | 'secondary' | 'gold';
  className?: string;
}

export const SectionHeader = ({
  title,
  subtitle,
  icon,
  action,
  accent = 'primary',
  className = '',
}: SectionHeaderProps) => {
  const accentColors: Record<string, string> = {
    primary: '#00FF9D',
    secondary: '#00B8D4',
    gold: '#D4AF37',
  };

  return (
    <motion.div
      className={`flex items-center justify-between mb-4 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springPhysics.snappy}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <AccentIcon variant={accent} size="md">
            {icon}
          </AccentIcon>
        )}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
      
      {/* Accent underline */}
      <motion.div
        className="absolute bottom-0 left-0 h-px"
        style={{ backgroundColor: accentColors[accent] }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />
    </motion.div>
  );
};

// ============================================
// STAGGER CONTAINER
// Container for staggered child animations
// ============================================

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer = ({
  children,
  staggerDelay = 0.05,
  className = '',
}: StaggerContainerProps) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// STAGGER ITEM
// Item wrapper for staggered animations
// ============================================

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className = '' }: StaggerItemProps) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: springPhysics.snappy,
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export default {
  KineticCard,
  GlowBadge,
  FluidValue,
  AccentIcon,
  SectionHeader,
  StaggerContainer,
  StaggerItem,
};
