import { and, eq, isNotNull } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@cairn/shared';
import { attachTags, logActivity, nowIso, resolveTags, setTags, toTask } from './internal.js';
import { endOfTodayIso, startOfTodayIso } from './time.js';

export type TaskView = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

export interface ListTasksOptions {
  view?: TaskView;
  projectId?: string | null;
}

export function listTasks(opts: ListTasksOptions = {}): Task[] {
  const db = getDb();
  const { view = 'all', projectId } = opts;
  const rows = db.select().from(schema.tasks).all();

  const startToday = startOfTodayIso();
  const endToday = endOfTodayIso();

  let filtered = rows;
  if (projectId !== undefined && projectId !== null) {
    filtered = filtered.filter((t) => t.projectId === projectId);
  }

  switch (view) {
    case 'today':
      filtered = filtered.filter(
        (t) => t.status !== 'done' && t.dueDate != null && t.dueDate >= startToday && t.dueDate <= endToday,
      );
      break;
    case 'upcoming':
      filtered = filtered.filter((t) => t.status !== 'done' && t.dueDate != null && t.dueDate > endToday);
      break;
    case 'overdue':
      filtered = filtered.filter((t) => t.status !== 'done' && t.dueDate != null && t.dueDate < startToday);
      break;
    case 'completed':
      filtered = filtered.filter((t) => t.status === 'done');
      break;
    case 'all':
    default:
      break;
  }

  // Sort: open tasks by due date asc (nulls last), completed by completedAt desc.
  filtered.sort((a, b) => {
    if (view === 'completed') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
    return (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31');
  });

  return attachTags('task', filtered, toTask);
}

export function getTask(id: string): Task | null {
  const db = getDb();
  const row = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
  if (!row) return null;
  return toTask(row, resolveTags('task', [id]).get(id) ?? []);
}

export function createTask(input: CreateTaskInput): Task {
  const db = getDb();
  const row = db
    .insert(schema.tasks)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueDate: input.dueDate ?? null,
      projectId: input.projectId ?? null,
      completedAt: input.status === 'done' ? nowIso() : null,
    })
    .returning()
    .get();
  setTags('task', row.id, input.tags);
  logActivity('created', 'task', row.id, `Created task "${row.title}"`);
  return getTask(row.id)!;
}

export function updateTask(id: string, input: UpdateTaskInput): Task | null {
  const db = getDb();
  const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
  if (!existing) return null;

  const patch: Partial<typeof schema.tasks.$inferInsert> = { updatedAt: nowIso() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
  if (input.projectId !== undefined) patch.projectId = input.projectId;
  if (input.status !== undefined) {
    patch.status = input.status;
    // Keep completedAt consistent with status transitions.
    if (input.status === 'done' && existing.status !== 'done') patch.completedAt = nowIso();
    if (input.status !== 'done') patch.completedAt = null;
  }

  db.update(schema.tasks).set(patch).where(eq(schema.tasks.id, id)).run();
  if (input.tags !== undefined) setTags('task', id, input.tags);
  logActivity('updated', 'task', id, `Updated task "${patch.title ?? existing.title}"`);
  return getTask(id);
}

export function completeTask(id: string): Task | null {
  const result = updateTask(id, { status: 'done' });
  if (result) logActivity('completed', 'task', id, `Completed task "${result.title}"`);
  return result;
}

export function deleteTask(id: string): boolean {
  const db = getDb();
  const res = db.delete(schema.tasks).where(eq(schema.tasks.id, id)).run();
  if (res.changes > 0) logActivity('deleted', 'task', id, `Deleted a task`);
  return res.changes > 0;
}

/** Tasks due today (open). Used by the dashboard + MCP get_today_tasks. */
export function getTodayTasks(): Task[] {
  return listTasks({ view: 'today' });
}

/** Overdue open tasks. Used by the dashboard + MCP get_overdue_tasks. */
export function getOverdueTasks(): Task[] {
  return listTasks({ view: 'overdue' });
}

/** Count of tasks completed today (for the completion stat). */
export function countCompletedToday(): number {
  const db = getDb();
  return db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.status, 'done'), isNotNull(schema.tasks.completedAt)))
    .all()
    .filter((t) => (t.completedAt ?? '') >= startOfTodayIso()).length;
}
