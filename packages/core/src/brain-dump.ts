import { addHours } from 'date-fns';
import { getDb, schema } from '@cairn/db';
import type { ExtractedItem, ItemType, SaveExtractedInput } from '@cairn/shared';
import { classifyBrainDump, smartClassify } from './classifier/index.js';
import { logActivity } from './internal.js';
import { getSettings } from './settings.js';
import { createTask } from './tasks.js';
import { createIdea } from './ideas.js';
import { createNote } from './notes.js';
import { createReminder } from './reminders.js';
import { createProject, findProjectByNameOrId, listProjects } from './projects.js';

/** Classify text (rule engine) using existing project names as suggestions. */
export function previewBrainDump(text: string): ExtractedItem[] {
  const known = listProjects({ includeArchived: false }).map((p) => p.name);
  return classifyBrainDump(text, { knownProjects: known });
}

/** Classify using the backend configured in Settings (Ollama or rules). */
export async function smartPreview(text: string): Promise<ExtractedItem[]> {
  const known = listProjects({ includeArchived: false }).map((p) => p.name);
  const settings = getSettings();
  return smartClassify(text, {
    knownProjects: known,
    backend: settings.classifier,
    ollamaHost: settings.ollamaHost,
    ollamaModel: settings.ollamaModel,
  });
}

export interface SaveResult {
  brainDumpId: string;
  created: { type: ItemType; id: string; title: string }[];
}

/** Resolve a project suggestion to an id, creating the project if it's new. */
function resolveProjectId(suggestion: string | null): string | null {
  if (!suggestion) return null;
  const existing = findProjectByNameOrId(suggestion);
  if (existing) return existing.id;
  return createProject({
    name: suggestion,
    description: null,
    objective: null,
    status: 'active',
    priority: 'medium',
  }).id;
}

/** Persist the user-reviewed items as real entities + record the brain dump. */
export function saveExtracted(input: SaveExtractedInput): SaveResult {
  const db = getDb();
  const created: SaveResult['created'] = [];

  for (const item of input.items) {
    const projectId = item.type === 'project' ? null : resolveProjectId(item.projectSuggestion);

    switch (item.type) {
      case 'task': {
        const t = createTask({
          title: item.title,
          description: item.description,
          status: 'todo',
          priority: item.priority,
          dueDate: item.dueDate,
          projectId,
          tags: item.tags,
        });
        created.push({ type: 'task', id: t.id, title: t.title });
        break;
      }
      case 'idea': {
        const i = createIdea({
          title: item.title,
          description: item.description,
          status: 'captured',
          projectId,
          tags: item.tags,
        });
        created.push({ type: 'idea', id: i.id, title: i.title });
        break;
      }
      case 'note': {
        const n = createNote({
          title: item.title,
          body: item.description ?? '',
          projectId,
          tags: item.tags,
        });
        created.push({ type: 'note', id: n.id, title: n.title });
        break;
      }
      case 'reminder': {
        const r = createReminder({
          title: item.title,
          description: item.description,
          remindAt: item.dueDate ?? addHours(new Date(), 1).toISOString(),
          status: 'scheduled',
          projectId,
        });
        created.push({ type: 'reminder', id: r.id, title: r.title });
        break;
      }
      case 'project': {
        const p = createProject({
          name: item.title,
          description: item.description,
          objective: null,
          status: 'active',
          priority: item.priority,
          tags: item.tags,
        });
        created.push({ type: 'project', id: p.id, title: p.name });
        break;
      }
    }
  }

  const bd = db
    .insert(schema.brainDumps)
    .values({ text: input.sourceText ?? '', itemCount: input.items.length })
    .returning()
    .get();
  db.insert(schema.classificationResults)
    .values({ brainDumpId: bd.id, payload: JSON.stringify(input.items) })
    .run();
  logActivity('classified', 'brain_dump', bd.id, `Saved ${created.length} items from a brain dump`);

  return { brainDumpId: bd.id, created };
}
