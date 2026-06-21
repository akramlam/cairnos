import { Hono } from 'hono';
import { smartPreview, saveExtracted } from '@cairn/core';
import { brainDumpSchema, saveExtractedSchema } from '@cairn/shared';
import { parseBody } from '../http.js';

export const braindumpRoute = new Hono();

/** Classify messy text into reviewable items (no persistence yet). */
braindumpRoute.post('/classify', async (c) => {
  const p = await parseBody(c, brainDumpSchema);
  if (!p.ok) return p.res;
  return c.json({ items: await smartPreview(p.data.text) });
});

/** Persist the user-reviewed items as real entities. */
braindumpRoute.post('/save', async (c) => {
  const p = await parseBody(c, saveExtractedSchema);
  if (!p.ok) return p.res;
  return c.json(saveExtracted(p.data), 201);
});
