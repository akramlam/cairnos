/**
 * Singleton better-sqlite3 + Drizzle client.
 *
 * WAL mode lets the engine and the MCP server hold the database open at the
 * same time without blocking each other; busy_timeout absorbs brief write
 * contention between the two processes.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { resolveDbPath } from './paths.js';
import * as schema from './schema.js';

let sqliteInstance: Database.Database | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getSqlite(): Database.Database {
  if (!sqliteInstance) {
    sqliteInstance = new Database(resolveDbPath());
    sqliteInstance.pragma('journal_mode = WAL');
    sqliteInstance.pragma('foreign_keys = ON');
    sqliteInstance.pragma('busy_timeout = 5000');
  }
  return sqliteInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getSqlite(), { schema });
  }
  return dbInstance;
}

export function closeDb(): void {
  sqliteInstance?.close();
  sqliteInstance = null;
  dbInstance = null;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
