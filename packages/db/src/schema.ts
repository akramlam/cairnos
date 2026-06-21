/**
 * CairnOS - Drizzle SQLite schema.
 *
 * All timestamps are ISO-8601 TEXT (see packages/shared/types.ts for the why).
 * IDs are UUID v4 TEXT. Foreign keys cascade/SET NULL so deleting a project
 * never orphans rows. `PRAGMA foreign_keys = ON` is enabled in client.ts.
 */

import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

const pk = () =>
  text('id')
    .primaryKey()
    .$defaultFn(uuid);

const createdAt = () =>
  text('created_at')
    .notNull()
    .$defaultFn(nowIso);

const updatedAt = () =>
  text('updated_at')
    .notNull()
    .$defaultFn(nowIso)
    .$onUpdateFn(nowIso);

/* ----------------------------------------------------------------- projects */

export const projects = sqliteTable(
  'projects',
  {
    id: pk(),
    name: text('name').notNull(),
    description: text('description'),
    objective: text('objective'),
    status: text('status').notNull().default('active'),
    priority: text('priority').notNull().default('medium'),
    color: text('color').notNull().default('#3B82F6'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('projects_status_idx').on(t.status)],
);

/* -------------------------------------------------------------------- tasks */

export const tasks = sqliteTable(
  'tasks',
  {
    id: pk(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('todo'),
    priority: text('priority').notNull().default('medium'),
    dueDate: text('due_date'),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    completedAt: text('completed_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('tasks_status_idx').on(t.status),
    index('tasks_due_idx').on(t.dueDate),
    index('tasks_project_idx').on(t.projectId),
  ],
);

/* -------------------------------------------------------------------- ideas */

export const ideas = sqliteTable(
  'ideas',
  {
    id: pk(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('captured'),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('ideas_status_idx').on(t.status)],
);

/* -------------------------------------------------------------------- notes */

export const notes = sqliteTable(
  'notes',
  {
    id: pk(),
    title: text('title').notNull(),
    body: text('body').notNull().default(''),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('notes_project_idx').on(t.projectId)],
);

/* ---------------------------------------------------------------- reminders */

export const reminders = sqliteTable(
  'reminders',
  {
    id: pk(),
    title: text('title').notNull(),
    description: text('description'),
    remindAt: text('remind_at').notNull(),
    status: text('status').notNull().default('scheduled'),
    projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('reminders_status_idx').on(t.status),
    index('reminders_remind_idx').on(t.remindAt),
  ],
);

/* --------------------------------------------------------------------- tags */

export const tags = sqliteTable('tags', {
  id: pk(),
  name: text('name').notNull().unique(),
  createdAt: createdAt(),
});

/** Polymorphic join: a tag attached to any item (task/project/idea/note). */
export const itemTags = sqliteTable(
  'item_tags',
  {
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    itemType: text('item_type').notNull(),
    itemId: text('item_id').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tagId, t.itemType, t.itemId] }),
    index('item_tags_item_idx').on(t.itemType, t.itemId),
  ],
);

/* -------------------------------------------------------------- brain_dumps */

export const brainDumps = sqliteTable('brain_dumps', {
  id: pk(),
  text: text('text').notNull(),
  itemCount: integer('item_count').notNull().default(0),
  createdAt: createdAt(),
});

export const classificationResults = sqliteTable('classification_results', {
  id: pk(),
  brainDumpId: text('brain_dump_id')
    .notNull()
    .references(() => brainDumps.id, { onDelete: 'cascade' }),
  /** JSON-encoded ExtractedItem[]. */
  payload: text('payload').notNull(),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------ activity_logs */

export const activityLogs = sqliteTable(
  'activity_logs',
  {
    id: pk(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    summary: text('summary').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('activity_created_idx').on(t.createdAt)],
);

/* ----------------------------------------------------------------- settings */

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdateFn(nowIso),
});

export type ProjectRow = typeof projects.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type IdeaRow = typeof ideas.$inferSelect;
export type NoteRow = typeof notes.$inferSelect;
export type ReminderRow = typeof reminders.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type ItemTagRow = typeof itemTags.$inferSelect;
export type BrainDumpRow = typeof brainDumps.$inferSelect;
export type ActivityLogRow = typeof activityLogs.$inferSelect;
export type SettingRow = typeof settings.$inferSelect;
