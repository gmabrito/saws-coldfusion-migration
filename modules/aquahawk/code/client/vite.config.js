import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3132,
    proxy: {
      '/api':   { target: 'http://localhost:3032', changeOrigin: true },
      '/.auth': { target: 'http://localhost:3032', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@saws/auth/client': r('../../../../shared/auth/src/useAuth.jsx'),
      '@saws/auth/server': r('../../../../shared/auth/src/middleware.js'),
      '@saws/auth':        r('../../../../shared/auth/src/index.js'),
      '@saws/ui-shell':    r('../../../../shared/ui-shell/src/index.js'),
      '@saws/styles':      r('../../../../shared/styles'),
    },
  },
});
