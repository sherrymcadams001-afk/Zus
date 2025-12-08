/**
 * ORION Design System - Single Source of Truth
 * 
 * "Glass & Steel" Aesthetic Constants
 * All dashboard components MUST use these values for consistency
 */

// ========== Color Palette ==========

export const ORION_COLORS = {
  // Brand Colors
  primary: '#00FF9D',      // Neon Green (primary actions, success)
  secondary: '#00B8D4',    // Neon Cyan (secondary actions, info)
  accent: '#00D4FF',       // Bright Cyan (highlights)
  
  // Background Layers
  background: {
    base: '#0B1015',       // Deepest background (page level)
    panel: '#0F1419',      // Card/panel background (primary container)
    elevated: '#141A20',   // Elevated elements (modals, dropdowns)
    overlay: '#0B1015',    // Modal backdrop overlay
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',    // White (headings, primary text)
    secondary: '#CBD5E1',  // Slate-300 (body text)
    tertiary: '#94A3B8',   // Slate-400 (supporting text)
    muted: '#64748B',      // Slate-500 (labels, hints)
    disabled: '#475569',   // Slate-600 (disabled state)
  },
  
  // Semantic Colors
  success: '#00FF9D',      // Positive values, profits
  danger: '#FF4444',       // Negative values, losses
  warning: '#FFA500',      // Warnings, cautions
  info: '#00B8D4',         // Info messages
  
  // Border & Divider
  border: {
    subtle: 'rgba(255, 255, 255, 0.05)',     // 1px borders on cards
    medium: 'rgba(255, 255, 255, 0.10)',     // Dividers, active states
    strong: 'rgba(255, 255, 255, 0.20)',     // Focus states
    accent: 'rgba(0, 255, 157, 0.30)',       // Primary border
  },
} as const;

// ========== Typography ==========

export const ORION_TYPOGRAPHY = {
  // Font Families
  fontFamily: {
    base: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  
  // Font Sizes (in pixels, convert to rem/tailwind classes)
  fontSize: {
    xs: '10px',      // Labels, tags, micro text
    sm: '11px',      // Small text, captions
    base: '13px',    // Body text, default
    md: '14px',      // Emphasized text
    lg: '16px',      // Subheadings
    xl: '18px',      // Headings
    '2xl': '20px',   // Large headings
    '3xl': '24px',   // Page titles
  },
  
  // Font Weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ========== Spacing & Layout ==========

export const ORION_SPACING = {
  // Border Radius (squircle/superellipse effect via border-radius)
  borderRadius: {
    none: '0',
    sm: '0.375rem',    // 6px - small elements
    md: '0.5rem',      // 8px - buttons, inputs
    lg: '0.75rem',     // 12px - cards, panels
    xl: '1rem',        // 16px - large containers
    full: '9999px',    // Pills, badges
  },
  
  // Spacing Scale
  spacing: {
    xs: '0.25rem',     // 4px
    sm: '0.5rem',      // 8px
    md: '0.75rem',     // 12px
    lg: '1rem',        // 16px
    xl: '1.5rem',      // 24px
    '2xl': '2rem',     // 32px
  },
  
  // Container Padding
  containerPadding: {
    sm: '0.75rem',     // 12px
    md: '1rem',        // 16px
    lg: '1.5rem',      // 24px
  },
} as const;

// ========== Shadows (Diffused Elevation) ==========

export const ORION_SHADOWS = {
  // Low elevation - subtle lift
  sm: '0 2px 8px rgba(0, 0, 0, 0.15)',
  
  // Medium elevation - cards, dropdowns
  md: '0 4px 16px rgba(0, 0, 0, 0.25)',
  
  // High elevation - modals, popovers
  lg: '0 8px 32px rgba(0, 0, 0, 0.35)',
  
  // Accent shadows (colored glow)
  glowGreen: '0 0 20px rgba(0, 255, 157, 0.15)',
  glowCyan: '0 0 20px rgba(0, 184, 212, 0.15)',
} as const;

// ========== Motion (Jet-Glide Physics) ==========

export const ORION_MOTION = {
  // Easing curves - all use ease-out (fast start, slow landing)
  easing: {
    default: [0.2, 0, 0.1, 1],           // Fast out, slow in
    smooth: [0.4, 0, 0.2, 1],            // Smooth deceleration
    sharp: [0.4, 0, 0.6, 1],             // Sharp but smooth
  },
  
  // Duration (in milliseconds)
  duration: {
    instant: 100,      // Micro-interactions
    fast: 150,         // Button states, toggles
    normal: 200,       // Default (SUB-200ms cap)
    slow: 300,         // Panel slides, large movements
  },
  
  // Common animation configs for framer-motion
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, ease: [0.2, 0, 0.1, 1] },
    },
    slideIn: {
      initial: { opacity: 0, x: -10 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.15, ease: [0.2, 0, 0.1, 1] },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.15, ease: [0.2, 0, 0.1, 1] },
    },
  },
} as const;

// ========== Component Presets ==========

export const ORION_COMPONENTS = {
  // Card/Panel preset
  card: {
    className: 'bg-[#0F1419] border border-white/5 rounded-lg',
    hoverClassName: 'hover:border-[#00FF9D]/20 transition-colors',
  },
  
  // Button presets
  button: {
    primary: 'bg-[#00FF9D] text-black font-medium rounded-lg hover:bg-[#00FF9D]/90 active:scale-[0.98] transition-all',
    secondary: 'bg-white/5 text-slate-400 font-medium rounded-lg hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all',
    ghost: 'text-slate-400 font-medium rounded-lg hover:bg-white/5 hover:text-white active:scale-[0.98] transition-all',
  },
  
  // Input preset
  input: {
    className: 'bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:border-[#00FF9D]/50 focus:outline-none transition-colors',
  },
  
  // Badge/Tag preset
  badge: {
    default: 'px-2 py-0.5 text-xs font-bold rounded-full bg-white/10 text-slate-400',
    success: 'px-2 py-0.5 text-xs font-bold rounded-full bg-[#00FF9D]/20 text-[#00FF9D]',
    info: 'px-2 py-0.5 text-xs font-bold rounded-full bg-[#00B8D4]/20 text-[#00B8D4]',
  },
} as const;

// ========== Utility Functions ==========

/**
 * Generate consistent hover states
 */
export const getHoverState = (baseColor: string) => ({
  hover: `${baseColor}/90`,
  active: 'scale-[0.98]',
});

/**
 * Generate rim lighting effect (inner shadow top edge)
 */
export const getRimLighting = () => ({
  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
});

/**
 * Generate frosted glass effect
 */
export const getFrostedGlass = () => ({
  backdropFilter: 'blur(12px)',
  backgroundColor: 'rgba(11, 16, 21, 0.8)',
});

/**
 * Format currency with consistent style
 */
export const formatCurrency = (value: number, showCents = true): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(value);
};

/**
 * Format percentage with consistent style
 */
export const formatPercent = (value: number, decimals = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};
