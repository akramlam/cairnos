/**
 * Internal helpers shared by every service: tag resolution, activity logging,
 * and row→domain serializers. Not part of the public API surface.
 */

import { and, eq, inArray } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type {
  ActivityAction,
  Idea,
  ItemType,
  Note,
  Project,
  Reminder,
  Task,
} from '@cairn/shared';
import type {
  IdeaRow,
  NoteRow,
  ProjectRow,
  ReminderRow,
  TaskRow,
} from '@cairn/db';

export const nowIso = (): string => new Date().toISOString();

/** Resolve tag names for a set of items of one type in a single query. */
export function resolveTags(itemType: ItemType, itemIds: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const id of itemIds) map.set(id, []);
  if (itemIds.length === 0) return map;

  const db = getDb();
  const rows = db
    .select({ itemId: schema.itemTags.itemId, name: schema.tags.name })
    .from(schema.itemTags)
    .innerJoin(schema.tags, eq(schema.itemTags.tagId, schema.tags.id))
    .where(
      and(eq(schema.itemTags.itemType, itemType), inArray(schema.itemTags.itemId, itemIds)),
    )
    .all();

  for (const row of rows) map.get(row.itemId)?.push(row.name);
  return map;
}

/** Replace the tag set for a single item. Creates tag rows on demand. */
export function setTags(itemType: ItemType, itemId: string, tagNames: string[] | undefined): void {
  if (!tagNames) return;
  const db = getDb();
  db.delete(schema.itemTags)
    .where(and(eq(schema.itemTags.itemType, itemType), eq(schema.itemTags.itemId, itemId)))
    .run();

  for (const raw of tagNames) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const existing = db.select().from(schema.tags).where(eq(schema.tags.name, name)).get();
    const tagId = existing?.id ?? db.insert(schema.tags).values({ name }).returning().get().id;
    db.insert(schema.itemTags)
      .values({ tagId, itemType, itemId })
      .onConflictDoNothing()
      .run();
  }
}

/** Append an entry to the activity log (best-effort audit trail). */
export function logActivity(
  action: ActivityAction,
  entityType: ItemType | 'brain_dump',
  entityId: string,
  summary: string,
): void {
  getDb().insert(schema.activityLogs).values({ action, entityType, entityId, summary }).run();
}

/* ----------------------------------------------------------- serializers */

export const toProject = (row: ProjectRow, tags: string[] = []): Project => ({
  ...row,
  status: row.status as Project['status'],
  priority: row.priority as Project['priority'],
  tags,
});

export const toTask = (row: TaskRow, tags: string[] = []): Task => ({
  ...row,
  status: row.status as Task['status'],
  priority: row.priority as Task['priority'],
  tags,
});

export const toIdea = (row: IdeaRow, tags: string[] = []): Idea => ({
  ...row,
  status: row.status as Idea['status'],
  tags,
});

export const toNote = (row: NoteRow, tags: string[] = []): Note => ({ ...row, tags });

export const toReminder = (row: ReminderRow): Reminder => ({
  ...row,
  status: row.status as Reminder['status'],
});

/** Attach resolved tags to a homogeneous list of rows. */
export function attachTags<Row extends { id: string }, Out>(
  itemType: ItemType,
  rows: Row[],
  map: (row: Row, tags: string[]) => Out,
): Out[] {
  const tagMap = resolveTags(itemType, rows.map((r) => r.id));
  return rows.map((r) => map(r, tagMap.get(r.id) ?? []));
}
