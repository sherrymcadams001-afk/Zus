import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
