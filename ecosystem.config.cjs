// PM2 process configuration for the wedding invitation server.
// CJS extension required because the root package.json does not declare
// "type": "module", and PM2 expects a CommonJS config file.
//
// Usage:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 reload ecosystem.config.cjs --update-env   (zero-downtime restart)
//   pm2 save                                        (persist across reboots)

'use strict';

module.exports = {
  apps: [
    {
      name: 'invitation',

      // Entry point is the compiled TypeScript output.
      // The build step (npm run build) must have run before starting.
      script: 'server/dist/index.js',

      // Run from the repo root so relative paths (client/dist, etc.) resolve.
      cwd: '/opt/invitation',

      // Single instance — the app uses in-memory rate limiting and SQLite,
      // both of which require a single process. Do not set instances > 1
      // without first migrating rate limiting to Redis.
      instances: 1,
      exec_mode: 'fork',

      // Load .env from the repo root automatically.
      env_file: '/opt/invitation/.env',

      // Production environment overrides (merged with .env on disk).
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Structured logs — one line per event, prefixed with UTC timestamp.
      error_file: '/var/log/invitation/error.log',
      out_file: '/var/log/invitation/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Back off 3 s between automatic restarts, give up after 10 crashes
      // within the restart_delay window to prevent a crash loop.
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',

      // Never watch the filesystem for changes — restarts are controlled
      // exclusively by the CI/CD pipeline.
      watch: false,

      // Graceful shutdown: wait up to 5 s for the SIGTERM handler in
      // index.ts to drain connections before SIGKILL.
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
