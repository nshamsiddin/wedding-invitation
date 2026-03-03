import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@invitation/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    // allowedHosts lists domains the Vite dev server will accept Host headers from.
    // The ngrok domain is needed here so the dev server serves requests tunnelled
    // through ngrok. This file is dev-only; production serves the built static assets
    // directly from Express and Vite is not involved.
    allowedHosts: ['towy-delaine-wanderingly.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
