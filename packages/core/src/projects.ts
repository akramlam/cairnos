import { and, asc, desc, eq, ne } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import {
  DEFAULT_PROJECT_COLOR,
  type CreateProjectInput,
  type Idea,
  type Note,
  type Project,
  type Reminder,
  type Task,
  type UpdateProjectInput,
} from '@cairn/shared';
import {
  attachTags,
  logActivity,
  nowIso,
  resolveTags,
  setTags,
  toIdea,
  toNote,
  toProject,
  toReminder,
  toTask,
} from './internal.js';

export interface ProjectDetails {
  project: Project;
  tasks: Task[];
  notes: Note[];
  ideas: Idea[];
  reminders: Reminder[];
  progress: number;
  nextAction: Task | null;
}

export function listProjects(opts: { includeArchived?: boolean } = {}): Project[] {
  const db = getDb();
  const rows = db.select().from(schema.projects).orderBy(desc(schema.projects.updatedAt)).all();
  const filtered = opts.includeArchived ? rows : rows.filter((r) => r.status !== 'archived');
  return attachTags('project', filtered, toProject);
}

export function getProject(id: string): Project | null {
  const db = getDb();
  const row = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
  if (!row) return null;
  return toProject(row, resolveTags('project', [id]).get(id) ?? []);
}

/** Resolve a project either by exact id or, failing that, case-insensitive name. */
export function findProjectByNameOrId(needle: string): Project | null {
  const direct = getProject(needle);
  if (direct) return direct;
  const db = getDb();
  const all = db.select().from(schema.projects).all();
  const match = all.find((p) => p.name.toLowerCase() === needle.trim().toLowerCase());
  return match ? toProject(match, resolveTags('project', [match.id]).get(match.id) ?? []) : null;
}

export function createProject(input: CreateProjectInput): Project {
  const db = getDb();
  const row = db
    .insert(schema.projects)
    .values({
      name: input.name,
      description: input.description ?? null,
      objective: input.objective ?? null,
      status: input.status ?? 'active',
      priority: input.priority ?? 'medium',
      color: input.color ?? DEFAULT_PROJECT_COLOR,
    })
    .returning()
    .get();
  setTags('project', row.id, input.tags);
  logActivity('created', 'project', row.id, `Created project "${row.name}"`);
  return getProject(row.id)!;
}

export function updateProject(id: string, input: UpdateProjectInput): Project | null {
  const db = getDb();
  const existing = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
  if (!existing) return null;

  const patch: Partial<typeof schema.projects.$inferInsert> = { updatedAt: nowIso() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.objective !== undefined) patch.objective = input.objective;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.color !== undefined) patch.color = input.color;

  db.update(schema.projects).set(patch).where(eq(schema.projects.id, id)).run();
  if (input.tags !== undefined) setTags('project', id, input.tags);
  logActivity('updated', 'project', id, `Updated project "${patch.name ?? existing.name}"`);
  return getProject(id);
}

export function archiveProject(id: string): Project | null {
  const result = updateProject(id, { status: 'archived' });
  if (result) logActivity('archived', 'project', id, `Archived project "${result.name}"`);
  return result;
}

export function deleteProject(id: string): boolean {
  const db = getDb();
  const res = db.delete(schema.projects).where(eq(schema.projects.id, id)).run();
  if (res.changes > 0) logActivity('deleted', 'project', id, `Deleted a project`);
  return res.changes > 0;
}

/** Full project context for the project page + the MCP get_project_context tool. */
export function getProjectDetails(id: string): ProjectDetails | null {
  const db = getDb();
  const project = getProject(id);
  if (!project) return null;

  const taskRows = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.projectId, id))
    .orderBy(asc(schema.tasks.dueDate))
    .all();
  const tasks = attachTags('task', taskRows, toTask);

  const notes = attachTags(
    'note',
    db.select().from(schema.notes).where(eq(schema.notes.projectId, id)).all(),
    toNote,
  );
  const ideas = attachTags(
    'idea',
    db.select().from(schema.ideas).where(eq(schema.ideas.projectId, id)).all(),
    toIdea,
  );
  const reminders = db
    .select()
    .from(schema.reminders)
    .where(eq(schema.reminders.projectId, id))
    .orderBy(asc(schema.reminders.remindAt))
    .all()
    .map(toReminder);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const nextAction =
    tasks
      .filter((t) => t.status !== 'done')
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))[0] ?? null;

  return { project, tasks, notes, ideas, reminders, progress, nextAction };
}

export function listActiveProjects(): Project[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.status, 'active'), ne(schema.projects.status, 'archived')))
    .orderBy(desc(schema.projects.updatedAt))
    .all();
  return attachTags('project', rows, toProject);
}
