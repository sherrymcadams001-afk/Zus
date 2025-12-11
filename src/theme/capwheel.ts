/**
 * CapWheel Design System - Enterprise Edition
 * 
 * Premium enterprise-grade theme with:
 * - Kinetic physics (spring-based animations)
 * - Lume-elevation system (atmospheric depth)
 * - Surgical accents (purposeful color highlights)
 * - Fluid typography (responsive scaling)
 * - Sensory feedback (micro-interactions)
 */

// ============================================
// SPRING PHYSICS CONFIGURATIONS
// Framer Motion spring presets for jet-glide motion
// ============================================
export const springPhysics = {
  // Snappy but smooth - primary interactions
  snappy: { type: 'spring', stiffness: 400, damping: 30, mass: 1 },
  // Bouncy entrance - card reveals
  bouncy: { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 },
  // Gentle float - ambient motion
  gentle: { type: 'spring', stiffness: 150, damping: 25, mass: 1.2 },
  // Quick snap - micro-interactions
  quick: { type: 'spring', stiffness: 500, damping: 35, mass: 0.6 },
  // Elastic - playful hovers
  elastic: { type: 'spring', stiffness: 200, damping: 15, mass: 0.5 },
  // Smooth glide - page transitions
  glide: { type: 'spring', stiffness: 100, damping: 20, mass: 1.5 },
} as const;

// ============================================
// LUME-ELEVATION SYSTEM
// Atmospheric depth with progressive glow + shadow
// ============================================
export const lumeElevation = {
  // Level 0 - Recessed (inputs, nested elements)
  lume0: {
    shadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
    glow: 'none',
    blur: '0',
  },
  // Level 1 - Surface (base cards)
  lume1: {
    shadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    glow: '0 0 0 1px rgba(255, 255, 255, 0.03)',
    blur: '0',
  },
  // Level 2 - Raised (interactive cards)
  lume2: {
    shadow: '0 4px 16px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.15)',
    glow: '0 0 20px rgba(0, 255, 157, 0.05)',
    blur: '0',
  },
  // Level 3 - Elevated (primary metrics, focused elements)
  lume3: {
    shadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 255, 157, 0.05)',
    blur: '0', // Removed blur for performance
  },
  // Level 4 - Floating (modals, dropdowns)
  lume4: {
    shadow: '0 16px 32px rgba(0, 0, 0, 0.3)',
    glow: '0 0 30px rgba(0, 255, 157, 0.08)',
    blur: '4px', // Reduced from 8px
  },
  // Level 5 - Prominent (featured CTAs, hero elements)
  lume5: {
    shadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
    glow: '0 0 40px rgba(0, 255, 157, 0.1)',
    blur: '8px', // Reduced from 12px
  },
} as const;

// ============================================
// FLUID TYPOGRAPHY SCALE
// Responsive font sizes using clamp()
// ============================================
export const fluidType = {
  // Display - Hero headings
  display: 'clamp(2rem, 5vw, 3.5rem)',      // 32px → 56px
  // H1 - Page titles
  h1: 'clamp(1.5rem, 3vw, 2.25rem)',        // 24px → 36px
  // H2 - Section headings
  h2: 'clamp(1.25rem, 2.5vw, 1.75rem)',     // 20px → 28px
  // H3 - Card titles
  h3: 'clamp(1rem, 2vw, 1.25rem)',          // 16px → 20px
  // Body large - Primary content
  bodyLg: 'clamp(0.9375rem, 1.5vw, 1.125rem)', // 15px → 18px
  // Body - Standard text
  body: 'clamp(0.875rem, 1.25vw, 1rem)',    // 14px → 16px
  // Small - Secondary text
  small: 'clamp(0.75rem, 1vw, 0.875rem)',   // 12px → 14px
  // Micro - Labels, badges
  micro: 'clamp(0.625rem, 0.8vw, 0.75rem)', // 10px → 12px
} as const;

// ============================================
// SURGICAL ACCENT SYSTEM
// Purposeful color highlights for visual hierarchy
// ============================================
export const surgicalAccents = {
  // Primary accent - Main interactive elements
  primary: {
    color: '#00FF9D',
    glow: '0 0 20px rgba(0, 255, 157, 0.4), 0 0 40px rgba(0, 255, 157, 0.2)',
    ring: '0 0 0 2px rgba(0, 255, 157, 0.3)',
    gradient: 'linear-gradient(135deg, #00FF9D 0%, #00B8D4 100%)',
  },
  // Secondary accent - Supporting elements
  secondary: {
    color: '#00B8D4',
    glow: '0 0 20px rgba(0, 184, 212, 0.4), 0 0 40px rgba(0, 184, 212, 0.2)',
    ring: '0 0 0 2px rgba(0, 184, 212, 0.3)',
    gradient: 'linear-gradient(135deg, #00B8D4 0%, #6B7FD7 100%)',
  },
  // Tertiary accent - Subtle highlights
  tertiary: {
    color: '#8B5CF6',
    glow: '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)',
    ring: '0 0 0 2px rgba(139, 92, 246, 0.3)',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)',
  },
  // Gold accent - Premium/featured elements
  gold: {
    color: '#D4AF37',
    glow: '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.25)',
    ring: '0 0 0 2px rgba(212, 175, 55, 0.4)',
    gradient: 'linear-gradient(135deg, #D4AF37 0%, #E5C158 50%, #D4AF37 100%)',
  },
  // Success accent - Profit indicators
  success: {
    color: '#00FF88',
    glow: '0 0 15px rgba(0, 255, 136, 0.4)',
    ring: '0 0 0 2px rgba(0, 255, 136, 0.3)',
  },
  // Danger accent - Loss indicators
  danger: {
    color: '#FF3366',
    glow: '0 0 15px rgba(255, 51, 102, 0.4)',
    ring: '0 0 0 2px rgba(255, 51, 102, 0.3)',
  },
} as const;

// ============================================
// SENSORY FEEDBACK ANIMATIONS
// Keyframe definitions for ambient motion
// ============================================
export const sensoryAnimations = {
  // Breathing pulse - ambient life
  breathe: {
    keyframes: {
      '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
      '50%': { opacity: 1, transform: 'scale(1.02)' },
    },
    duration: '3s',
    timing: 'ease-in-out',
  },
  // Glow pulse - attention draw
  glowPulse: {
    keyframes: {
      '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 157, 0.2)' },
      '50%': { boxShadow: '0 0 40px rgba(0, 255, 157, 0.4)' },
    },
    duration: '2s',
    timing: 'ease-in-out',
  },
  // Float - gentle vertical motion
  float: {
    keyframes: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-4px)' },
    },
    duration: '4s',
    timing: 'ease-in-out',
  },
  // Shimmer - loading/processing
  shimmer: {
    keyframes: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    duration: '2s',
    timing: 'linear',
  },
} as const;

export const capwheelTheme = {
  // Brand Colors - Premium institutional palette
  colors: {
    // Primary - Deep Navy foundation
    navy: {
      DEFAULT: '#0A1628',
      light: '#0F1E35',
      dark: '#050B14',
    },
    
    // Accent - Luxe Gold
    gold: {
      DEFAULT: '#D4AF37',
      light: '#E5C158',
      dark: '#B89421',
      muted: 'rgba(212, 175, 55, 0.2)',
    },
    
    // Primary Accent - Neon Green
    accent: {
      DEFAULT: '#00FF9D',
      light: '#33FFB1',
      dark: '#00CC7D',
      muted: 'rgba(0, 255, 157, 0.15)',
    },
    
    // Secondary Accent - Cyan
    cyan: {
      DEFAULT: '#00B8D4',
      light: '#33C9E0',
      dark: '#0093A8',
      muted: 'rgba(0, 184, 212, 0.15)',
    },
    
    // Electric Blue - High-tech accent
    electric: {
      DEFAULT: '#00D4FF',
      light: '#33DDFF',
      dark: '#00A8CC',
      glow: 'rgba(0, 212, 255, 0.3)',
    },
    
    // Status - Financial metrics
    profit: {
      DEFAULT: '#00FF88',
      muted: 'rgba(0, 255, 136, 0.15)',
    },
    loss: {
      DEFAULT: '#FF3366',
      muted: 'rgba(255, 51, 102, 0.15)',
    },
    
    // Surface & Borders
    surface: {
      DEFAULT: '#111827',
      elevated: '#1A2332',
      hover: '#212D3F',
    },
    border: {
      DEFAULT: 'rgba(212, 175, 55, 0.2)',
      subtle: 'rgba(255, 255, 255, 0.08)',
      hover: 'rgba(212, 175, 55, 0.4)',
      accent: 'rgba(0, 255, 157, 0.2)',
    },
  },

  // Typography - Institutional precision
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      display: ['Inter', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing - Consistent rhythm
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },

  // Shadows - Diffuse elevation (Glass & Steel principle)
  shadows: {
    // Subtle lift
    sm: '0 2px 8px rgba(0, 0, 0, 0.1)',
    // Card elevation
    md: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 1px rgba(212, 175, 55, 0.1)',
    // Prominent elevation
    lg: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 2px rgba(212, 175, 55, 0.15)',
    // Gold glow effects
    glow: {
      gold: '0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)',
      electric: '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.15)',
      profit: '0 0 15px rgba(0, 255, 136, 0.3)',
      loss: '0 0 15px rgba(255, 51, 102, 0.3)',
    },
    // Inner rim lighting (top edge highlight)
    rim: 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
  },

  // Border Radius - Superellipse approximation
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Animation - Jet-Glide physics
  animation: {
    duration: {
      instant: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      // Momentum easing - fast start, slow landing
      jetGlide: 'cubic-bezier(0.2, 0, 0.1, 1)',
      // Standard ease-out
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      // Precise, damped
      precise: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Backdrop Blur - Frosted context
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
  },
} as const;

// CSS Custom Properties helper
export const capwheelCSSVars = `
  --cw-navy: ${capwheelTheme.colors.navy.DEFAULT};
  --cw-navy-light: ${capwheelTheme.colors.navy.light};
  --cw-navy-dark: ${capwheelTheme.colors.navy.dark};
  
  --cw-gold: ${capwheelTheme.colors.gold.DEFAULT};
  --cw-gold-light: ${capwheelTheme.colors.gold.light};
  --cw-gold-dark: ${capwheelTheme.colors.gold.dark};
  --cw-gold-muted: ${capwheelTheme.colors.gold.muted};
  
  --cw-accent: ${capwheelTheme.colors.accent.DEFAULT};
  --cw-accent-light: ${capwheelTheme.colors.accent.light};
  --cw-accent-muted: ${capwheelTheme.colors.accent.muted};
  
  --cw-cyan: ${capwheelTheme.colors.cyan.DEFAULT};
  --cw-cyan-muted: ${capwheelTheme.colors.cyan.muted};
  
  --cw-electric: ${capwheelTheme.colors.electric.DEFAULT};
  --cw-electric-light: ${capwheelTheme.colors.electric.light};
  --cw-electric-dark: ${capwheelTheme.colors.electric.dark};
  
  --cw-profit: ${capwheelTheme.colors.profit.DEFAULT};
  --cw-profit-muted: ${capwheelTheme.colors.profit.muted};
  
  --cw-loss: ${capwheelTheme.colors.loss.DEFAULT};
  --cw-loss-muted: ${capwheelTheme.colors.loss.muted};
  
  --cw-surface: ${capwheelTheme.colors.surface.DEFAULT};
  --cw-surface-elevated: ${capwheelTheme.colors.surface.elevated};
  
  --cw-border: ${capwheelTheme.colors.border.DEFAULT};
  --cw-border-subtle: ${capwheelTheme.colors.border.subtle};
  --cw-border-accent: ${capwheelTheme.colors.border.accent};
`;

export type CapWheelTheme = typeof capwheelTheme;
export type SpringPhysics = typeof springPhysics;
export type LumeElevation = typeof lumeElevation;
export type FluidType = typeof fluidType;
export type SurgicalAccents = typeof surgicalAccents;
