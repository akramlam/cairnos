import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type { CreateNoteInput, Note, UpdateNoteInput } from '@cairn/shared';
import { attachTags, logActivity, nowIso, resolveTags, setTags, toNote } from './internal.js';

export function listNotes(opts: { projectId?: string | null } = {}): Note[] {
  const db = getDb();
  let rows = db.select().from(schema.notes).orderBy(desc(schema.notes.updatedAt)).all();
  if (opts.projectId !== undefined && opts.projectId !== null) {
    rows = rows.filter((r) => r.projectId === opts.projectId);
  }
  return attachTags('note', rows, toNote);
}

export function getNote(id: string): Note | null {
  const db = getDb();
  const row = db.select().from(schema.notes).where(eq(schema.notes.id, id)).get();
  if (!row) return null;
  return toNote(row, resolveTags('note', [id]).get(id) ?? []);
}

export function createNote(input: CreateNoteInput): Note {
  const db = getDb();
  const row = db
    .insert(schema.notes)
    .values({
      title: input.title,
      body: input.body ?? '',
      projectId: input.projectId ?? null,
    })
    .returning()
    .get();
  setTags('note', row.id, input.tags);
  logActivity('created', 'note', row.id, `Created note "${row.title}"`);
  return getNote(row.id)!;
}

export function updateNote(id: string, input: UpdateNoteInput): Note | null {
  const db = getDb();
  const existing = db.select().from(schema.notes).where(eq(schema.notes.id, id)).get();
  if (!existing) return null;

  const patch: Partial<typeof schema.notes.$inferInsert> = { updatedAt: nowIso() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.projectId !== undefined) patch.projectId = input.projectId;

  db.update(schema.notes).set(patch).where(eq(schema.notes.id, id)).run();
  if (input.tags !== undefined) setTags('note', id, input.tags);
  logActivity('updated', 'note', id, `Updated note "${patch.title ?? existing.title}"`);
  return getNote(id);
}

export function deleteNote(id: string): boolean {
  const db = getDb();
  const res = db.delete(schema.notes).where(eq(schema.notes.id, id)).run();
  if (res.changes > 0) logActivity('deleted', 'note', id, `Deleted a note`);
  return res.changes > 0;
}
