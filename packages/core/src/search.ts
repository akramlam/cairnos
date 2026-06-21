import { getDb, schema } from '@cairn/db';
import type { ItemType, SearchHit } from '@cairn/shared';

export interface SearchOptions {
  query: string;
  types?: ItemType[];
  limit?: number;
}

/**
 * Relevance-ranked substring search across every entity. Scores exact/prefix/
 * substring title hits above body hits and rewards multi-token overlap, then
 * sorts by score. Semantic (embedding) search layers on top of this in the
 * engine; this remains the always-available, zero-dependency baseline.
 */
export function searchItems(opts: SearchOptions): SearchHit[] {
  const db = getDb();
  const q = opts.query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const types = opts.types ?? ['task', 'project', 'idea', 'note', 'reminder'];
  const limit = opts.limit ?? 30;

  const score = (title: string, body: string | null): number => {
    const t = title.toLowerCase();
    const b = (body ?? '').toLowerCase();
    let s = 0;
    if (t === q) s += 100;
    else if (t.startsWith(q)) s += 70;
    else if (t.includes(q)) s += 50;
    if (b.includes(q)) s += 20;
    const inTitle = tokens.filter((tok) => t.includes(tok)).length;
    const inBody = tokens.filter((tok) => b.includes(tok)).length;
    s += (inTitle / tokens.length) * 25;
    s += (inBody / tokens.length) * 8;
    return s;
  };

  const scored: { hit: SearchHit; score: number }[] = [];
  const add = (hit: SearchHit, body: string | null) => {
    const s = score(hit.title, body);
    if (s > 0) scored.push({ hit, score: s });
  };

  if (types.includes('task'))
    for (const t of db.select().from(schema.tasks).all())
      add({ type: 'task', id: t.id, title: t.title, subtitle: t.description, projectId: t.projectId }, t.description);

  if (types.includes('project'))
    for (const p of db.select().from(schema.projects).all())
      add(
        { type: 'project', id: p.id, title: p.name, subtitle: p.description, projectId: p.id },
        `${p.description ?? ''} ${p.objective ?? ''}`,
      );

  if (types.includes('idea'))
    for (const i of db.select().from(schema.ideas).all())
      add({ type: 'idea', id: i.id, title: i.title, subtitle: i.description, projectId: i.projectId }, i.description);

  if (types.includes('note'))
    for (const n of db.select().from(schema.notes).all())
      add(
        { type: 'note', id: n.id, title: n.title, subtitle: n.body.slice(0, 120), projectId: n.projectId },
        n.body,
      );

  if (types.includes('reminder'))
    for (const r of db.select().from(schema.reminders).all())
      add({ type: 'reminder', id: r.id, title: r.title, subtitle: r.description, projectId: r.projectId }, r.description);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.hit);
}
