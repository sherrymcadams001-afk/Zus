import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        orion: {
          bg: '#020408',
          panel: '#0B0E11',
          'neon-cyan': '#00F0FF',
          'neon-green': '#00FF94',
          'neon-red': '#FF0055',
          'neon-blue': '#00A3FF',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.05)',
        'glow-green': '0 0 15px rgba(0, 255, 148, 0.1)',
        'glow-red': '0 0 15px rgba(255, 0, 85, 0.1)',
      },
      animation: {
        'pulse-machine': 'pulseMachine 2s ease-in-out infinite',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        pulseMachine: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
