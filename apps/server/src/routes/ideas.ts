import { Hono } from 'hono';
import {
  convertIdea,
  createIdea,
  deleteIdea,
  getIdea,
  listIdeas,
  updateIdea,
} from '@cairn/core';
import { convertIdeaSchema, createIdeaSchema, updateIdeaSchema } from '@cairn/shared';
import { notFound, parseBody } from '../http.js';

export const ideasRoute = new Hono();

ideasRoute.get('/', (c) => c.json(listIdeas({ status: c.req.query('status') ?? undefined })));

ideasRoute.get('/:id', (c) => {
  const idea = getIdea(c.req.param('id'));
  return idea ? c.json(idea) : notFound(c);
});

ideasRoute.post('/', async (c) => {
  const p = await parseBody(c, createIdeaSchema);
  if (!p.ok) return p.res;
  return c.json(createIdea(p.data), 201);
});

ideasRoute.patch('/:id', async (c) => {
  const p = await parseBody(c, updateIdeaSchema);
  if (!p.ok) return p.res;
  const updated = updateIdea(c.req.param('id'), p.data);
  return updated ? c.json(updated) : notFound(c);
});

ideasRoute.post('/:id/convert', async (c) => {
  const p = await parseBody(c, convertIdeaSchema);
  if (!p.ok) return p.res;
  const result = convertIdea(c.req.param('id'), p.data.target);
  return result ? c.json(result) : notFound(c);
});

ideasRoute.delete('/:id', (c) => c.json({ deleted: deleteIdea(c.req.param('id')) }));
