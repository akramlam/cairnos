/**
 * Apply all pending Drizzle migrations to the local database.
 * Run with: pnpm db:migrate
 */

import { closeDb } from './client.js';
import { runMigrations } from './migrator.js';
import { resolveDbPath } from './paths.js';

try {
  runMigrations();
  console.log(`✓ Migrations applied → ${resolveDbPath()}`);
} catch (error) {
  console.error('✗ Migration failed:', error);
  process.exitCode = 1;
} finally {
  closeDb();
}
