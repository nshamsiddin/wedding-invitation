import Database, { type Database as BetterSQLite3Database } from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import path from 'path';

const dbPath = process.env.DATABASE_PATH ?? './guests.db';
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

const sqlite: BetterSQLite3Database = new Database(resolvedPath);
sqlite.pragma('journal_mode = WAL'); // Improves concurrent read performance
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { schema, sqlite };
