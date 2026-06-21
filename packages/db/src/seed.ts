/**
 * CLI entry for `pnpm db:seed`. Delegates the dataset to seedSampleData() so
 * the engine's onboarding endpoint reuses the exact same data.
 * Idempotent: skips if data already exists unless CAIRN_SEED_FORCE=1.
 */
import { sql } from 'drizzle-orm';
import { closeDb, getDb } from './client.js';
import {
  activityLogs,
  ideas,
  itemTags,
  notes,
  projects,
  reminders,
  tags,
  tasks,
} from './schema.js';
import { seedSampleData } from './sample-data.js';

const db = getDb();
const force = process.env.CAIRN_SEED_FORCE === '1';
const existing = db.select({ n: sql<number>`count(*)` }).from(projects).get();

if (existing && existing.n > 0 && !force) {
  console.log(
    `✓ Database already has ${existing.n} projects - skipping seed (CAIRN_SEED_FORCE=1 to reseed).`,
  );
  closeDb();
  process.exit(0);
}

if (force) {
  // Order respects foreign keys.
  for (const table of [itemTags, tags, reminders, notes, ideas, tasks, projects, activityLogs]) {
    db.delete(table).run();
  }
}

const summary = seedSampleData();
console.log(
  `✓ Seed complete - ${summary.projects} projects, ${summary.tasks} tasks, ${summary.ideas} ideas, ${summary.notes} note(s), ${summary.reminders} reminders.`,
);
closeDb();
