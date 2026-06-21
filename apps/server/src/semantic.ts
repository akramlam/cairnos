/**
 * Optional local semantic search via transformers.js embeddings.
 *
 * Enabled with CAIRN_SEARCH=semantic. The dependency is loaded lazily through a
 * variable import specifier so the default install stays lean and typecheck/
 * build never require it - install it opt-in:
 *
 *   pnpm --filter @cairn/server add @huggingface/transformers
 *
 * Model defaults to Xenova/all-MiniLM-L6-v2 (override via CAIRN_EMBED_MODEL).
 * Item embeddings are cached by content key; the engine falls back to the
 * ranked substring search in @cairn/core on any failure.
 */

import { getDb, schema } from '@cairn/db';
import type { ItemType, SearchHit } from '@cairn/shared';

type EmbedFn = (text: string) => Promise<Float32Array>;

let embedFn: EmbedFn | null = null;
let loading: Promise<EmbedFn> | null = null;

async function getEmbedder(): Promise<EmbedFn> {
  if (embedFn) return embedFn;
  if (!loading) {
    loading = (async () => {
      const spec = '@huggingface/transformers';
      const mod = (await import(spec)) as {
        pipeline: (task: string, model: string) => Promise<(t: string, o: unknown) => Promise<{ data: Float32Array }>>;
      };
      const model = process.env.CAIRN_EMBED_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
      const pipe = await mod.pipeline('feature-extraction', model);
      embedFn = async (text: string) => (await pipe(text, { pooling: 'mean', normalize: true })).data;
      return embedFn;
    })();
  }
  return loading;
}

function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) dot += (a[i] ?? 0) * (b[i] ?? 0);
  return dot; // both vectors are L2-normalized
}

interface Doc extends SearchHit {
  text: string;
  key: string;
}

const cache = new Map<string, { key: string; vec: Float32Array }>();

function corpus(types: ItemType[]): Doc[] {
  const db = getDb();
  const docs: Doc[] = [];
  const push = (hit: SearchHit, text: string) =>
    docs.push({ ...hit, text, key: `${hit.type}:${hit.id}:${text.length}:${hit.title}` });

  if (types.includes('task'))
    for (const t of db.select().from(schema.tasks).all())
      push({ type: 'task', id: t.id, title: t.title, subtitle: t.description, projectId: t.projectId }, `${t.title}. ${t.description ?? ''}`);
  if (types.includes('project'))
    for (const p of db.select().from(schema.projects).all())
      push({ type: 'project', id: p.id, title: p.name, subtitle: p.description, projectId: p.id }, `${p.name}. ${p.description ?? ''} ${p.objective ?? ''}`);
  if (types.includes('idea'))
    for (const i of db.select().from(schema.ideas).all())
      push({ type: 'idea', id: i.id, title: i.title, subtitle: i.description, projectId: i.projectId }, `${i.title}. ${i.description ?? ''}`);
  if (types.includes('note'))
    for (const n of db.select().from(schema.notes).all())
      push({ type: 'note', id: n.id, title: n.title, subtitle: n.body.slice(0, 120), projectId: n.projectId }, `${n.title}. ${n.body}`);
  if (types.includes('reminder'))
    for (const r of db.select().from(schema.reminders).all())
      push({ type: 'reminder', id: r.id, title: r.title, subtitle: r.description, projectId: r.projectId }, `${r.title}. ${r.description ?? ''}`);

  return docs;
}

export async function semanticSearch(query: string, types: ItemType[], limit = 20): Promise<SearchHit[]> {
  const embed = await getEmbedder();
  const qv = await embed(query);
  const docs = corpus(types);
  const scored: { hit: SearchHit; score: number }[] = [];

  for (const doc of docs) {
    let entry = cache.get(doc.id);
    if (!entry || entry.key !== doc.key) {
      entry = { key: doc.key, vec: await embed(doc.text) };
      cache.set(doc.id, entry);
    }
    const { text: _t, key: _k, ...hit } = doc;
    scored.push({ hit, score: cosine(qv, entry.vec) });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.hit);
}

export const isSemanticEnabled = () => (process.env.CAIRN_SEARCH ?? '') === 'semantic';
