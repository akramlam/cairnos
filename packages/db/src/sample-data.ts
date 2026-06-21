/**
 * Reusable sample-data seeding, shared by the `pnpm db:seed` CLI and the
 * engine's POST /api/seed onboarding endpoint. Pure data writes - no process
 * lifecycle (no closeDb / process.exit) - so it is safe to call in-process.
 */
import { sql } from 'drizzle-orm';
import { getDb } from './client.js';
import {
  activityLogs,
  ideas,
  itemTags,
  notes,
  projects,
  reminders,
  settings,
  tags,
  tasks,
} from './schema.js';

export interface SeedSummary {
  projects: number;
  tasks: number;
  ideas: number;
  notes: number;
  reminders: number;
}

function isoIn(days: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoAgo(days: number): string {
  return isoIn(-days, 9);
}

/** True when no user content exists yet - a fresh install. */
export function isDatabaseEmpty(): boolean {
  const db = getDb();
  const n = (q: { n: number } | undefined) => q?.n ?? 0;
  const total =
    n(db.select({ n: sql<number>`count(*)` }).from(projects).get()) +
    n(db.select({ n: sql<number>`count(*)` }).from(tasks).get()) +
    n(db.select({ n: sql<number>`count(*)` }).from(ideas).get()) +
    n(db.select({ n: sql<number>`count(*)` }).from(notes).get()) +
    n(db.select({ n: sql<number>`count(*)` }).from(reminders).get());
  return total === 0;
}

/** Insert the realistic CairnOS sample dataset. Returns row counts. */
export function seedSampleData(): SeedSummary {
  const db = getDb();

  const ensureTag = (name: string): string => {
    const lower = name.toLowerCase();
    const found = db.select().from(tags).where(sql`name = ${lower}`).get();
    if (found) return found.id;
    const inserted = db.insert(tags).values({ name: lower }).returning().get();
    if (!inserted) throw new Error(`Failed to insert tag "${lower}"`);
    return inserted.id;
  };
  const tagItem = (tagName: string, itemType: string, itemId: string) => {
    db.insert(itemTags)
      .values({ tagId: ensureTag(tagName), itemType, itemId })
      .onConflictDoNothing()
      .run();
  };

  // ---- Projects ----------------------------------------------------------
  const web = db
    .insert(projects)
    .values({
      name: 'Website Redesign',
      description: 'Refresh the marketing site and ship a cleaner, faster design.',
      objective: 'Launch the new homepage and pricing page.',
      status: 'active',
      priority: 'high',
      color: '#3B82F6',
    })
    .returning()
    .get();

  const career = db
    .insert(projects)
    .values({
      name: 'Career',
      description: 'Interview prep, applications, and professional growth.',
      objective: 'Land a great role and keep skills sharp.',
      status: 'active',
      priority: 'medium',
      color: '#8B5CF6',
    })
    .returning()
    .get();

  const cairn = db
    .insert(projects)
    .values({
      name: 'CairnOS',
      description: 'Building the local-first productivity desktop app.',
      objective: 'Ship a polished, working MVP.',
      status: 'active',
      priority: 'high',
      color: '#6366F1',
    })
    .returning()
    .get();

  // ---- Tasks -------------------------------------------------------------
  const t1 = db
    .insert(tasks)
    .values({
      title: 'Finish the homepage copy',
      description: 'Write the hero and features sections.',
      status: 'in_progress',
      priority: 'high',
      dueDate: isoIn(1),
      projectId: web.id,
    })
    .returning()
    .get();

  db.insert(tasks)
    .values({
      title: 'Fix the contact form',
      description: 'Submitting the form returns an error - repair the handler.',
      status: 'todo',
      priority: 'high',
      dueDate: isoIn(1),
      projectId: web.id,
    })
    .run();

  db.insert(tasks)
    .values({
      title: 'Prepare for the interview',
      description: 'Review the role, prepare STAR stories, and rehearse technical questions.',
      status: 'todo',
      priority: 'medium',
      dueDate: isoIn(3),
      projectId: career.id,
    })
    .run();

  db.insert(tasks)
    .values({
      title: 'Review overdue: submit the expense report',
      description: 'Admin task that slipped past its deadline.',
      status: 'todo',
      priority: 'high',
      dueDate: isoAgo(2),
      projectId: career.id,
    })
    .run();

  db.insert(tasks)
    .values({
      title: 'Polish dashboard cards',
      status: 'todo',
      priority: 'low',
      dueDate: isoIn(2),
      projectId: cairn.id,
    })
    .run();

  const doneTask = db
    .insert(tasks)
    .values({
      title: 'Set up project repository',
      status: 'done',
      priority: 'medium',
      projectId: cairn.id,
      completedAt: new Date().toISOString(),
    })
    .returning()
    .get();

  // ---- Ideas -------------------------------------------------------------
  const idea1 = db
    .insert(ideas)
    .values({
      title: 'Customer referral program',
      description: 'Reward users who invite friends with account credits.',
      status: 'captured',
    })
    .returning()
    .get();

  db.insert(ideas)
    .values({
      title: 'Voice-driven brain dump',
      description: 'Capture chaos by talking; transcribe and classify automatically.',
      status: 'reviewing',
      projectId: cairn.id,
    })
    .run();

  // ---- Notes -------------------------------------------------------------
  db.insert(notes)
    .values({
      title: 'Launch checklist',
      body: 'Final QA, a copy review, and an analytics check before going live.',
      projectId: web.id,
    })
    .run();

  // ---- Reminders ---------------------------------------------------------
  db.insert(reminders)
    .values({
      title: 'Email the team the update',
      description: 'Send the latest draft and ask for feedback.',
      remindAt: isoIn(1, 8),
      status: 'scheduled',
      projectId: web.id,
    })
    .run();

  db.insert(reminders)
    .values({
      title: 'Confirm interview time',
      remindAt: isoIn(2, 10),
      status: 'scheduled',
      projectId: career.id,
    })
    .run();

  // ---- Tags --------------------------------------------------------------
  tagItem('urgent', 'task', t1.id);
  tagItem('launch', 'task', t1.id);
  tagItem('startup', 'idea', idea1.id);
  tagItem('shipped', 'task', doneTask.id);

  // ---- Settings defaults -------------------------------------------------
  const defaults: Record<string, string> = {
    displayName: 'Alex',
    theme: 'dark',
    notificationsEnabled: 'true',
    reminderLeadMinutes: '10',
  };
  for (const [key, value] of Object.entries(defaults)) {
    db.insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
      .run();
  }

  // ---- Activity ----------------------------------------------------------
  db.insert(activityLogs)
    .values({
      action: 'created',
      entityType: 'brain_dump',
      entityId: 'seed',
      summary: 'Seeded CairnOS with sample projects, tasks, ideas, notes, and reminders.',
    })
    .run();

  return { projects: 3, tasks: 6, ideas: 2, notes: 1, reminders: 2 };
}
