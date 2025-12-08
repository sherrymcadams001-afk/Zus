/**
 * CapWheel Design System
 * 
 * Premium enterprise-grade theme for CapWheel trading platform
 * "Glass & Steel" aesthetic with institutional trust
 */

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
`;

export type CapWheelTheme = typeof capwheelTheme;
