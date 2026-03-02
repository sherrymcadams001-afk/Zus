import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'logo.svg',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'robots.txt',
        'sitemap.xml',
      ],
      manifest: {
        name: 'CapWheel - Institutional Capital Management',
        short_name: 'CapWheel',
        description: 'Enterprise-grade capital management platform with automated trading strategies and yield optimization.',
        start_url: '/capwheel',
        display: 'standalone',
        background_color: '#0B1015',
        theme_color: '#10b981',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'en-US',
        categories: ['finance', 'business', 'productivity'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        // Cache app shell and static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't precache PDF documents (they're large, let browser handle them)
        globIgnores: ['**/*.pdf'],
        runtimeCaching: [
          {
            // Cache Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor chunk - React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI/Animation vendor chunk
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Utility vendor chunk
          'vendor-utils': ['zustand', 'date-fns'],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2022',
    // Chunk size warning threshold (KB)
    chunkSizeWarningLimit: 500,
  },
})
