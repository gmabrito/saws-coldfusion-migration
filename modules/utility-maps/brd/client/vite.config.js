import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3113,
    proxy: {
      '/api': { target: 'http://localhost:3013', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@saws/ui-shell': r('../../../../shared/ui-shell/src/index.js'),
      '@saws/styles':   r('../../../../shared/styles'),
    },
  },
});
