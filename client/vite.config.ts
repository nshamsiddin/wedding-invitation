import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Browsers request /favicon.ico directly (outside of HTML parsing).
// Vite has no built-in .ico → .svg redirect, so we intercept the request here
// and respond with a 302 to /favicon.svg which Vite already serves from /public.
function faviconIcoRedirectPlugin(): Plugin {
  return {
    name: 'favicon-ico-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/favicon.ico') {
          res.writeHead(302, { Location: '/favicon.svg' });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), faviconIcoRedirectPlugin()],
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
