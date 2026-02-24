import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable code splitting and optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React vendor chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI library vendor chunk
          'ui-vendor': ['lucide-react', 'clsx', 'tailwind-merge'],
          
          // Data visualization vendor chunk
          'chart-vendor': ['recharts'],
          
          // 3D visualization vendor chunk
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // State management vendor chunk
          'state-vendor': ['zustand', '@tanstack/react-query'],
          
          // HTTP client vendor chunk
          'http-vendor': ['axios'],
        },
      },
    },
    // Chunk size warning limit (1000 KB)
    chunkSizeWarningLimit: 1000,
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      format: {
        // Remove comments
        comments: false,
      },
    },
    
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      '@tanstack/react-query',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
