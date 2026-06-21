import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './client.js';

/**
 * Resolve the migrations folder across runtimes:
 * - CAIRN_MIGRATIONS_DIR wins (set by the packaged Tauri app).
 * - ESM (tsx/dev): relative to this module → packages/db/migrations.
 * - CJS bundle / packaged sidecar: migrations ship next to the entry (cwd).
 */
function resolveMigrationsDir(): string {
  if (process.env.CAIRN_MIGRATIONS_DIR) return process.env.CAIRN_MIGRATIONS_DIR;

  const url = (import.meta as { url?: string }).url;
  if (url) {
    try {
      return join(dirname(fileURLToPath(url)), '..', 'migrations');
    } catch {
      /* not a file URL - fall through */
    }
  }
  return join(process.cwd(), 'migrations');
}

/** Apply any pending migrations. Safe to call on every process startup. */
export function runMigrations(folder?: string): void {
  migrate(getDb(), { migrationsFolder: folder ?? resolveMigrationsDir() });
}
