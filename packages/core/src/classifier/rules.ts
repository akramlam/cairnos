/**
 * Rule-based heuristics for the classifier: item type, priority, tags, and
 * project suggestion. Each is a pure function so the engine stays testable and
 * an AI backend can override any single step.
 */

import type { ItemType, Priority } from '@cairn/shared';

export interface TypeDetection {
  type: ItemType;
  status: string;
  cleanedTitle: string;
  reasons: string[];
  confidence: number;
}

// Order matters: more specific phrases first (e.g. "idea for" before "idea").
const TRIGGERS: Record<Exclude<ItemType, 'task'>, RegExp[]> = {
  reminder: [
    /^remind me to\s+/i,
    /^remind me\s+/i,
    /^reminder[:\-]?\s*/i,
    /^don'?t forget to\s+/i,
    /^don'?t forget\s+/i,
  ],
  idea: [
    /^idea for\s+/i,
    /^ideas? for\s+/i,
    /^idea[:\-]?\s*/i,
    /^what if\s+/i,
    /^concept[:\-]?\s*/i,
    /^brainstorm[:\-]?\s*/i,
  ],
  note: [/^note[:\-]?\s*/i, /^remember that\s+/i, /^fyi[:\-]?\s*/i],
  project: [/^project[:\-]?\s*/i, /^new project[:\-]?\s*/i],
};

const ACTION_VERBS = [
  'finish', 'fix', 'prepare', 'email', 'send', 'call', 'write', 'review', 'submit',
  'complete', 'buy', 'schedule', 'book', 'update', 'create', 'draft', 'study', 'read',
  'build', 'design', 'plan', 'research', 'organize', 'clean', 'pay', 'renew', 'check',
  'reply', 'ask', 'meet', 'add', 'remove', 'deploy', 'test', 'refactor', 'debug',
];

function clean(s: string): string {
  const out = s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^to\s+/i, '')
    .replace(/[\s,.;:!]+$/, '')
    .trim();
  if (!out) return s.trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function detectType(raw: string): TypeDetection {
  const text = raw.trim();

  for (const re of TRIGGERS.reminder) {
    if (re.test(text))
      return { type: 'reminder', status: 'scheduled', cleanedTitle: clean(text.replace(re, '')), reasons: ['matched a reminder phrase'], confidence: 0.9 };
  }
  for (const re of TRIGGERS.idea) {
    if (re.test(text))
      return { type: 'idea', status: 'captured', cleanedTitle: clean(text.replace(re, '')), reasons: ['matched an idea phrase'], confidence: 0.88 };
  }
  for (const re of TRIGGERS.note) {
    if (re.test(text))
      return { type: 'note', status: '', cleanedTitle: clean(text.replace(re, '')), reasons: ['matched a note phrase'], confidence: 0.85 };
  }
  for (const re of TRIGGERS.project) {
    if (re.test(text))
      return { type: 'project', status: 'active', cleanedTitle: clean(text.replace(re, '')), reasons: ['matched a project phrase'], confidence: 0.85 };
  }

  // Weaker, keyword-anywhere signals.
  if (/\bremind(er)?\b/i.test(text))
    return { type: 'reminder', status: 'scheduled', cleanedTitle: clean(text), reasons: ['mentions "remind"'], confidence: 0.7 };
  if (/\bidea\b/i.test(text))
    return { type: 'idea', status: 'captured', cleanedTitle: clean(text), reasons: ['mentions "idea"'], confidence: 0.68 };
  if (/\bproject\b/i.test(text))
    return { type: 'project', status: 'active', cleanedTitle: clean(text), reasons: ['mentions "project"'], confidence: 0.66 };

  const verb = ACTION_VERBS.find((v) => new RegExp(`^${v}\\b`, 'i').test(text));
  return {
    type: 'task',
    status: 'todo',
    cleanedTitle: clean(text),
    reasons: verb ? [`leads with action verb "${verb}"`] : ['defaulted to task'],
    confidence: verb ? 0.8 : 0.6,
  };
}

export function detectPriority(text: string): { priority: Priority; reasons: string[] } {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|critical|important|high priority|right now|immediately|deadline)\b/.test(lower) || /!{2,}/.test(text))
    return { priority: 'high', reasons: ['urgency keyword'] };
  if (/\b(someday|eventually|whenever|low priority|nice to have|maybe later|no rush)\b/.test(lower))
    return { priority: 'low', reasons: ['low-priority keyword'] };
  return { priority: 'medium', reasons: [] };
}

export function detectTags(text: string): string[] {
  const tags = [...text.matchAll(/#([a-z0-9_\-]+)/gi)].map((m) => (m[1] ?? '').toLowerCase());
  return Array.from(new Set(tags));
}

export function detectProject(text: string, knownProjects: string[] = []): string | null {
  const lower = text.toLowerCase();
  for (const name of knownProjects) {
    if (name && lower.includes(name.toLowerCase())) return name;
  }
  const explicit = text.match(/\bproject[:\s]+([a-z0-9 ]{2,40})/i)?.[1];
  if (explicit) return explicit.trim().replace(/[.,;]$/, '');
  return null;
}
