import { Hono } from 'hono';
import { createNote, deleteNote, getNote, listNotes, updateNote } from '@cairn/core';
import { createNoteSchema, updateNoteSchema } from '@cairn/shared';
import { notFound, parseBody } from '../http.js';

export const notesRoute = new Hono();

notesRoute.get('/', (c) => c.json(listNotes({ projectId: c.req.query('projectId') ?? undefined })));

notesRoute.get('/:id', (c) => {
  const note = getNote(c.req.param('id'));
  return note ? c.json(note) : notFound(c);
});

notesRoute.post('/', async (c) => {
  const p = await parseBody(c, createNoteSchema);
  if (!p.ok) return p.res;
  return c.json(createNote(p.data), 201);
});

notesRoute.patch('/:id', async (c) => {
  const p = await parseBody(c, updateNoteSchema);
  if (!p.ok) return p.res;
  const updated = updateNote(c.req.param('id'), p.data);
  return updated ? c.json(updated) : notFound(c);
});

notesRoute.delete('/:id', (c) => c.json({ deleted: deleteNote(c.req.param('id')) }));
