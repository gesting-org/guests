import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      '/api/carrefour': {
        target: 'https://www.carrefour.com.ar',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/carrefour/, ''),
      },
      '/api/dolar': {
        target: 'https://dolarapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dolar/, ''),
      },
      '/api/callmebot': {
        target: 'https://api.callmebot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/callmebot/, ''),
      },
    },
  },

  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
