/**
 * @cairn/core - the shared business logic for CairnOS.
 *
 * Every service is a plain function over the local SQLite database. Both the
 * desktop engine (apps/server) and the MCP server import from here, which is
 * exactly why Claude Code and the app stay in sync: one brain, one database.
 */

export * from './projects.js';
export * from './tasks.js';
export * from './ideas.js';
export * from './notes.js';
export * from './reminders.js';
export * from './search.js';
export * from './dashboard.js';
export * from './settings.js';
export * from './activity.js';
export * from './brain-dump.js';
export * from './classifier/index.js';
export { getDb, closeDb } from '@cairn/db';
