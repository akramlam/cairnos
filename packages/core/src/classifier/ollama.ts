/**
 * Local-AI classifier backend powered by Ollama (e.g. a workstation running
 * qwen3 on a GPU). Host + model are passed in (resolved from settings by the
 * caller); env vars are a fallback for CLI/testing.
 *
 * The model handles type/title/priority/project/tags; the deterministic
 * `detectDate` parser still resolves the actual due date so we never trust the
 * LLM with date math. Any failure falls back to the rule engine.
 */

import type { ExtractedItem, ItemType, Priority } from '@cairn/shared';
import { detectDate } from './dates.js';

const DEFAULT_HOST = process.env.CAIRN_OLLAMA_HOST ?? 'http://localhost:11434';
const DEFAULT_MODEL = process.env.CAIRN_OLLAMA_MODEL ?? 'qwen3:8b';

const SYSTEM = `You convert a messy brain dump into structured productivity items.
Return ONLY JSON of the shape: {"items":[{"type","title","description","priority","when","project","tags"}]}.
- type: one of task | project | idea | note | reminder
- title: concise and imperative. NEVER repeat the type word in the title (e.g. not "X idea", just "X"). Preserve the original capitalization of acronyms, proper nouns, codes, and product names (e.g. API, CSV, KPI, Q3, Slack) - do not lowercase them.
- priority: low | medium | high - infer from urgency/importance (deadlines, "urgent", exams, interviews → high).
- when: a short natural-language time like "tomorrow", "next monday", "in 3 days", or "" if none.
- project: pick the single best match from the provided known projects if the item clearly belongs to one, else "".
- tags: array of short lowercase strings.
Only include items actually implied by the text. Do not invent items.`;

const TYPES: ItemType[] = ['task', 'project', 'idea', 'note', 'reminder'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const STATUS: Record<ItemType, string> = {
  task: 'todo',
  project: 'active',
  idea: 'captured',
  note: '',
  reminder: 'scheduled',
};

export interface OllamaOptions {
  knownProjects?: string[];
  base?: Date;
  timeoutMs?: number;
  host?: string;
  model?: string;
}

interface RawItem {
  type?: string;
  title?: string;
  description?: string;
  priority?: string;
  when?: string;
  project?: string;
  tags?: unknown;
}

function normalize(raw: RawItem, base: Date | undefined, model: string): ExtractedItem | null {
  const title = String(raw.title ?? '').trim();
  if (!title) return null;

  const type = (TYPES as string[]).includes(raw.type ?? '') ? (raw.type as ItemType) : 'task';
  const priority = (PRIORITIES as string[]).includes(raw.priority ?? '')
    ? (raw.priority as Priority)
    : 'medium';
  const when = typeof raw.when === 'string' ? raw.when : '';
  const date = when ? detectDate(when, base) : null;
  const project = raw.project ? String(raw.project).trim() : '';
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).toLowerCase()) : [];

  return {
    id: crypto.randomUUID(),
    type,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: raw.description ? String(raw.description) : null,
    priority,
    dueDate: date?.iso ?? null,
    dueDateLabel: date?.label ?? (when || null),
    projectSuggestion: project || null,
    tags,
    confidence: 0.92,
    status: STATUS[type],
    reasons: [`classified by ${model}`],
  };
}

export async function classifyWithOllama(
  text: string,
  opts: OllamaOptions = {},
): Promise<ExtractedItem[]> {
  const host = (opts.host || DEFAULT_HOST).replace(/\/$/, '');
  const model = opts.model || DEFAULT_MODEL;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    const system =
      SYSTEM +
      (opts.knownProjects?.length ? `\nKnown projects: ${opts.knownProjects.join(', ')}.` : '');

    const res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        think: false,
        options: { temperature: 0.2 },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = (await res.json()) as { message?: { content?: string } };
    const parsed = JSON.parse(data.message?.content ?? '{}') as { items?: RawItem[] };
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return items
      .map((raw) => normalize(raw, opts.base, model))
      .filter((x): x is ExtractedItem => x !== null);
  } finally {
    clearTimeout(timer);
  }
}

/** Quick reachability + model check for the Settings "Test connection" button. */
export async function pingOllama(
  host: string,
): Promise<{ reachable: boolean; models: string[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${host.replace(/\/$/, '')}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { reachable: false, models: [], error: `HTTP ${res.status}` };
    const data = (await res.json()) as { models?: { name: string }[] };
    return { reachable: true, models: (data.models ?? []).map((m) => m.name) };
  } catch (error) {
    return { reachable: false, models: [], error: (error as Error).message };
  }
}
