import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type { CreateIdeaInput, Idea, ItemType, UpdateIdeaInput } from '@cairn/shared';
import { attachTags, logActivity, nowIso, resolveTags, setTags, toIdea } from './internal.js';
import { createTask } from './tasks.js';
import { createProject } from './projects.js';
import { createNote } from './notes.js';

export function listIdeas(opts: { status?: string } = {}): Idea[] {
  const db = getDb();
  let rows = db.select().from(schema.ideas).orderBy(desc(schema.ideas.updatedAt)).all();
  if (opts.status) rows = rows.filter((r) => r.status === opts.status);
  return attachTags('idea', rows, toIdea);
}

export function getIdea(id: string): Idea | null {
  const db = getDb();
  const row = db.select().from(schema.ideas).where(eq(schema.ideas.id, id)).get();
  if (!row) return null;
  return toIdea(row, resolveTags('idea', [id]).get(id) ?? []);
}

export function createIdea(input: CreateIdeaInput): Idea {
  const db = getDb();
  const row = db
    .insert(schema.ideas)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'captured',
      projectId: input.projectId ?? null,
    })
    .returning()
    .get();
  setTags('idea', row.id, input.tags);
  logActivity('created', 'idea', row.id, `Captured idea "${row.title}"`);
  return getIdea(row.id)!;
}

export function updateIdea(id: string, input: UpdateIdeaInput): Idea | null {
  const db = getDb();
  const existing = db.select().from(schema.ideas).where(eq(schema.ideas.id, id)).get();
  if (!existing) return null;

  const patch: Partial<typeof schema.ideas.$inferInsert> = { updatedAt: nowIso() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.projectId !== undefined) patch.projectId = input.projectId;

  db.update(schema.ideas).set(patch).where(eq(schema.ideas.id, id)).run();
  if (input.tags !== undefined) setTags('idea', id, input.tags);
  logActivity('updated', 'idea', id, `Updated idea "${patch.title ?? existing.title}"`);
  return getIdea(id);
}

export function deleteIdea(id: string): boolean {
  const db = getDb();
  const res = db.delete(schema.ideas).where(eq(schema.ideas.id, id)).run();
  if (res.changes > 0) logActivity('deleted', 'idea', id, `Deleted an idea`);
  return res.changes > 0;
}

export interface ConvertResult {
  type: ItemType;
  id: string;
}

/** Convert an idea into a task, project, or note; marks the idea as converted. */
export function convertIdea(id: string, target: 'task' | 'project' | 'note'): ConvertResult | null {
  const idea = getIdea(id);
  if (!idea) return null;

  let result: ConvertResult;
  if (target === 'task') {
    const task = createTask({
      title: idea.title,
      description: idea.description,
      priority: 'medium',
      status: 'todo',
      projectId: idea.projectId,
      tags: idea.tags,
    });
    result = { type: 'task', id: task.id };
  } else if (target === 'project') {
    const project = createProject({
      name: idea.title,
      description: idea.description,
      objective: null,
      status: 'active',
      priority: 'medium',
      tags: idea.tags,
    });
    result = { type: 'project', id: project.id };
  } else {
    const note = createNote({
      title: idea.title,
      body: idea.description ?? '',
      projectId: idea.projectId,
      tags: idea.tags,
    });
    result = { type: 'note', id: note.id };
  }

  updateIdea(id, { status: 'converted' });
  logActivity('converted', 'idea', id, `Converted idea "${idea.title}" → ${target}`);
  return result;
}
