import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Run each test file in its own isolated worker so in-memory DB state,
    // rate-limit counters, and lastLogoutAt do not leak between files.
    isolate: true,
    // Runs before any test module is imported — sets env vars so modules
    // (db/index.ts, auth middleware, etc.) initialise with test values.
    setupFiles: ['src/__tests__/setup.ts'],
    alias: {
      '@invitation/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
    include: ['src/**/*.test.ts'],
    reporters: ['verbose'],
  },
});
