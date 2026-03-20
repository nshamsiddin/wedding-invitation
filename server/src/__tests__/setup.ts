/**
 * Vitest global setup — runs before any test module is imported.
 * Sets required environment variables so all server modules (db, auth, routes)
 * initialise correctly with test values when they are first imported.
 */

process.env['NODE_ENV']       = 'test';
process.env['JWT_SECRET']     = 'test-secret-minimum-32-chars-long!!';
process.env['ADMIN_USERNAME'] = 'admin';
process.env['ADMIN_PASSWORD'] = 'testpassword';
process.env['BASE_URL']       = 'http://localhost:5173';
// Special SQLite in-memory identifier — handled in db/index.ts
process.env['DATABASE_PATH']  = ':memory:';
