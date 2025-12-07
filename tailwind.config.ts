import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
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
      boxShadow: {
        // Orion glows
        'glow-cyan': '0 0 10px rgba(69, 162, 158, 0.4)',
        'glow-cyan-md': '0 0 20px rgba(69, 162, 158, 0.5)',
        'glow-cyan-lg': '0 0 30px rgba(69, 162, 158, 0.6), 0 0 60px rgba(69, 162, 158, 0.3)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        // CapWheel glows
        'capwheel-glow-gold': '0 0 20px rgba(212, 175, 55, 0.4), 0 0 40px rgba(212, 175, 55, 0.2)',
        'capwheel-glow-electric': '0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.15)',
        'capwheel-card': '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 1px rgba(212, 175, 55, 0.1)',
        'capwheel-rim': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-machine': 'pulseMachine 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
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
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
