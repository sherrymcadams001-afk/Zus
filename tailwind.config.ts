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
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        // Subtle glow - for accents
        'glow-cyan': '0 0 10px rgba(69, 162, 158, 0.4)',
        // Medium glow - for buttons
        'glow-cyan-md': '0 0 20px rgba(69, 162, 158, 0.5)',
        // Intense glow - for primary CTAs
        'glow-cyan-lg': '0 0 30px rgba(69, 162, 158, 0.6), 0 0 60px rgba(69, 162, 158, 0.3)',
        // Status glows
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.4)',
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
