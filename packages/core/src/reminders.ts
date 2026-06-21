import { addMinutes } from 'date-fns';
import { asc, eq } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type { CreateReminderInput, Reminder, UpdateReminderInput } from '@cairn/shared';
import { logActivity, nowIso, toReminder } from './internal.js';

export type ReminderView = 'upcoming' | 'overdue' | 'all' | 'active';

export function listReminders(opts: { view?: ReminderView } = {}): Reminder[] {
  const db = getDb();
  const { view = 'all' } = opts;
  const rows = db
    .select()
    .from(schema.reminders)
    .orderBy(asc(schema.reminders.remindAt))
    .all()
    .map(toReminder);

  const now = nowIso();
  switch (view) {
    case 'upcoming':
      return rows.filter((r) => r.status === 'scheduled' && r.remindAt >= now);
    case 'overdue':
      return rows.filter(
        (r) => (r.status === 'scheduled' || r.status === 'triggered') && r.remindAt < now,
      );
    case 'active':
      return rows.filter((r) => r.status === 'scheduled' || r.status === 'triggered');
    case 'all':
    default:
      return rows;
  }
}

export function getReminder(id: string): Reminder | null {
  const db = getDb();
  const row = db.select().from(schema.reminders).where(eq(schema.reminders.id, id)).get();
  return row ? toReminder(row) : null;
}

export function createReminder(input: CreateReminderInput): Reminder {
  const db = getDb();
  const row = db
    .insert(schema.reminders)
    .values({
      title: input.title,
      description: input.description ?? null,
      remindAt: input.remindAt,
      status: input.status ?? 'scheduled',
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
    })
    .returning()
    .get();
  logActivity('created', 'reminder', row.id, `Created reminder "${row.title}"`);
  return toReminder(row);
}

export function updateReminder(id: string, input: UpdateReminderInput): Reminder | null {
  const db = getDb();
  const existing = db.select().from(schema.reminders).where(eq(schema.reminders.id, id)).get();
  if (!existing) return null;

  const patch: Partial<typeof schema.reminders.$inferInsert> = { updatedAt: nowIso() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.remindAt !== undefined) patch.remindAt = input.remindAt;
  if (input.status !== undefined) patch.status = input.status;
  if (input.projectId !== undefined) patch.projectId = input.projectId;
  if (input.taskId !== undefined) patch.taskId = input.taskId;

  db.update(schema.reminders).set(patch).where(eq(schema.reminders.id, id)).run();
  return getReminder(id);
}

/** Push a reminder into the future by N minutes and re-arm it. */
export function snoozeReminder(id: string, minutes = 10): Reminder | null {
  const current = getReminder(id);
  if (!current) return null;
  const next = addMinutes(new Date(), minutes).toISOString();
  const result = updateReminder(id, { remindAt: next, status: 'scheduled' });
  if (result) logActivity('reminded', 'reminder', id, `Snoozed "${current.title}" ${minutes}m`);
  return result;
}

export function markReminderDone(id: string): Reminder | null {
  const result = updateReminder(id, { status: 'done' });
  if (result) logActivity('completed', 'reminder', id, `Marked reminder "${result.title}" done`);
  return result;
}

export function dismissReminder(id: string): Reminder | null {
  return updateReminder(id, { status: 'dismissed' });
}

/** Reminders whose time has arrived and that still need to fire. */
export function getDueReminders(): Reminder[] {
  const now = nowIso();
  return listReminders({ view: 'all' }).filter(
    (r) => r.status === 'scheduled' && r.remindAt <= now,
  );
}

/** Mark a reminder as having fired (notification shown). */
export function markReminderTriggered(id: string): Reminder | null {
  const result = updateReminder(id, { status: 'triggered' });
  if (result) logActivity('reminded', 'reminder', id, `Triggered reminder "${result.title}"`);
  return result;
}

export function getUpcomingReminders(limit = 5): Reminder[] {
  return listReminders({ view: 'upcoming' }).slice(0, limit);
}
