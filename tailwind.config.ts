import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    // Mobile-first breakpoints
    screens: {
      'xs': '320px',      // Small mobile
      'sm': '480px',      // Large mobile
      'md': '768px',      // Tablet
      'lg': '1024px',     // Desktop
      'xl': '1280px',     // Wide desktop
      '2xl': '1536px',    // Ultra wide
    },
    extend: {
      colors: {
        orion: {
          // Primary Backgrounds - Deep Space
          bg: '#0B0C10',           // Deep Charcoal - primary background
          'bg-secondary': '#1F2833', // Obsidian - secondary panels
          'bg-elevated': '#2A3140',  // Elevated cards
          'bg-hover': '#343D4D',     // Hover states
          panel: '#0B0E11',          // Legacy compatibility
          
          // Primary Accent - Electric Pulse
          cyan: '#45A29E',           // Orion Cyan - primary accent
          'cyan-bright': '#66FCF1',  // Bright cyan - highlights
          
          // Secondary
          slate: '#C5C6C7',          // Muted slate - secondary text
          'slate-dark': '#8B8D8F',   // Darker slate
          
          // Status Colors
          success: '#10B981',        // Green - profits, connected
          danger: '#EF4444',         // Red - losses, errors
          warning: '#F59E0B',        // Amber - warnings
          
          // Legacy neon colors for backward compatibility
          'neon-cyan': '#45A29E',    // Updated to new cyan
          'neon-green': '#10B981',   // Updated to success green
          'neon-red': '#EF4444',     // Updated to danger red
          'neon-blue': '#45A29E',    // Updated to match cyan
        },
        // CapWheel Enterprise Theme
        capwheel: {
          navy: '#0A1628',
          'navy-light': '#0F1E35',
          'navy-dark': '#050B14',
          gold: '#D4AF37',
          'gold-light': '#E5C158',
          'gold-dark': '#B89421',
          electric: '#00D4FF',
          'electric-light': '#33DDFF',
          'electric-dark': '#00A8CC',
          profit: '#00FF88',
          loss: '#FF3366',
          surface: '#111827',
          'surface-elevated': '#1A2332',
          'surface-hover': '#212D3F',
          border: 'rgba(212, 175, 55, 0.2)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // Responsive typography with clamp()
      fontSize: {
        'responsive-xs': 'clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem)',
        'responsive-sm': 'clamp(0.75rem, 0.6rem + 0.6vw, 0.875rem)',
        'responsive-base': 'clamp(0.875rem, 0.7rem + 0.7vw, 1rem)',
        'responsive-lg': 'clamp(1rem, 0.8rem + 0.8vw, 1.125rem)',
        'responsive-xl': 'clamp(1.125rem, 0.9rem + 0.9vw, 1.25rem)',
        'responsive-2xl': 'clamp(1.25rem, 1rem + 1vw, 1.5rem)',
        'responsive-3xl': 'clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem)',
      },
      // Touch-optimized spacing
      spacing: {
        'touch-min': '44px',  // Minimum touch target
        'touch-gap': '8px',   // Minimum gap between touch targets
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      boxShadow: {
        // Orion glows - Subtle glow for accents
        'glow-cyan': '0 0 10px rgba(69, 162, 158, 0.4)',
        // Medium glow - for buttons
        'glow-cyan-md': '0 0 20px rgba(69, 162, 158, 0.5)',
        // Intense glow - for primary CTAs
        'glow-cyan-lg': '0 0 30px rgba(69, 162, 158, 0.6), 0 0 60px rgba(69, 162, 158, 0.3)',
        // Status glows
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        // CapWheel glows
        'capwheel-glow-gold': '0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)',
        'capwheel-glow-electric': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.15)',
        'capwheel-card': '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 1px rgba(212, 175, 55, 0.1)',
        'capwheel-rim': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        // Glass morphism shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-machine': 'pulseMachine 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        // Premium hedge fund animations
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-up': 'slideInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-in-down': 'slideInDown 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-subtle': 'bounceSubtle 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        pulseMachine: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(69, 162, 158, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(69, 162, 158, 0.6)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Premium motion keyframes
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      // Transition timing functions for premium feel
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'swift': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Touch manipulation utilities
      touchAction: {
        'pan-x': 'pan-x',
        'pan-y': 'pan-y',
        'pinch-zoom': 'pinch-zoom',
        'manipulation': 'manipulation',
      },
    },
  },
  plugins: [],
};

export default config;
