import { sqlite } from '../db/index.js';
import logger from './logger.js';

// Ensure the settings table exists.  This module is imported before any route
// handler runs, so the CREATE is guaranteed to fire before the first auth check.
sqlite
  .prepare(
    `CREATE TABLE IF NOT EXISTS admin_settings (
       key   TEXT PRIMARY KEY NOT NULL,
       value TEXT NOT NULL
     )`
  )
  .run();

// ─── Persistent logout timestamp ─────────────────────────────────────────────
// The in-memory variable acts as a cache so the hot path (every authenticated
// request) pays zero DB I/O.  On logout it is updated in both memory and SQLite
// so the value survives a process restart — fixing the 24-hour re-validating
// window that existed when it was purely in-memory.
let lastLogoutAt: number = (() => {
  const row = sqlite
    .prepare("SELECT value FROM admin_settings WHERE key = 'lastLogoutAt' LIMIT 1")
    .get() as { value: string } | undefined;
  const ts = row ? parseInt(row.value, 10) : 0;
  if (ts > 0) {
    logger.info({ lastLogoutAt: new Date(ts).toISOString() }, '[adminSession] Restored lastLogoutAt from DB');
  }
  return ts;
})();

export function getLastLogoutAt(): number {
  return lastLogoutAt;
}

export function recordLogout(): void {
  lastLogoutAt = Date.now();
  sqlite
    .prepare("INSERT OR REPLACE INTO admin_settings (key, value) VALUES ('lastLogoutAt', ?)")
    .run(lastLogoutAt.toString());
  logger.info({ lastLogoutAt: new Date(lastLogoutAt).toISOString() }, 'admin logout');
}
