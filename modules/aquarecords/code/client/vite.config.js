import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3131,
    proxy: {
      '/api': {
        target: 'http://localhost:3031',
        changeOrigin: true,
      },
      '/.auth': {
        target: 'http://localhost:3031',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@saws/auth': '../../../../shared/auth',
    },
  },
});
