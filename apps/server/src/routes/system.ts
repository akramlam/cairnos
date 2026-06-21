import { Hono } from 'hono';
import { getDb, schema, isDatabaseEmpty, seedSampleData } from '@cairn/db';
import {
  getSettings,
  getTodaySnapshot,
  listActivity,
  pingOllama,
  searchItems,
  updateSettings,
} from '@cairn/core';
import { settingsSchema, type ItemType } from '@cairn/shared';
import { parseBody } from '../http.js';
import { isSemanticEnabled } from '../semantic.js';

const ALL_TYPES: ItemType[] = ['task', 'project', 'idea', 'note', 'reminder'];

export const systemRoute = new Hono();

systemRoute.get('/health', (c) =>
  c.json({ ok: true, service: 'cairn-engine', time: new Date().toISOString() }),
);

systemRoute.get('/dashboard/today', (c) => c.json(getTodaySnapshot()));

systemRoute.get('/search', async (c) => {
  const query = (c.req.query('q') ?? '').trim();
  if (!query) return c.json([]);
  const typesParam = c.req.query('types');
  const types = typesParam ? (typesParam.split(',') as ItemType[]) : undefined;

  if (isSemanticEnabled()) {
    try {
      const { semanticSearch } = await import('../semantic.js');
      return c.json(await semanticSearch(query, types ?? ALL_TYPES, 30));
    } catch (error) {
      console.error('[search] semantic failed, falling back to ranked:', (error as Error).message);
    }
  }
  return c.json(searchItems({ query, types, limit: 30 }));
});

systemRoute.get('/settings', (c) => c.json(getSettings()));

/** Reachability + model list for an Ollama host (Settings "Test connection"). */
systemRoute.get('/ai/status', async (c) => {
  const host = c.req.query('host') || getSettings().ollamaHost;
  return c.json(await pingOllama(host));
});

systemRoute.patch('/settings', async (c) => {
  const p = await parseBody(c, settingsSchema);
  if (!p.ok) return p.res;
  return c.json(updateSettings(p.data));
});

/**
 * Load the sample dataset on demand - first-run onboarding's "Load sample data"
 * choice. No-op (and reports it) when content already exists, so it's safe to
 * call more than once.
 */
systemRoute.post('/seed', (c) => {
  if (!isDatabaseEmpty()) return c.json({ seeded: false, reason: 'not-empty' });
  return c.json({ seeded: true, summary: seedSampleData() });
});

systemRoute.get('/activity', (c) => {
  const limit = Number(c.req.query('limit') ?? '20');
  return c.json(listActivity(Number.isFinite(limit) ? limit : 20));
});

/** Full local export as JSON - the "your data is yours" promise. */
systemRoute.get('/export', (c) => {
  const db = getDb();
  return c.json({
    app: 'CairnOS',
    exportedAt: new Date().toISOString(),
    projects: db.select().from(schema.projects).all(),
    tasks: db.select().from(schema.tasks).all(),
    ideas: db.select().from(schema.ideas).all(),
    notes: db.select().from(schema.notes).all(),
    reminders: db.select().from(schema.reminders).all(),
    tags: db.select().from(schema.tags).all(),
    itemTags: db.select().from(schema.itemTags).all(),
    brainDumps: db.select().from(schema.brainDumps).all(),
    activityLogs: db.select().from(schema.activityLogs).all(),
    settings: db.select().from(schema.settings).all(),
  });
});
