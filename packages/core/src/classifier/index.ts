/**
 * The CairnOS rule-based classifier.
 *
 * Splits a messy brain dump into segments and turns each into a structured,
 * reviewable ExtractedItem (type, title, priority, due date, project, tags,
 * confidence, and the reasons it decided that way).
 *
 * This whole module sits behind a single `classifyBrainDump` signature so it
 * can later be swapped for a local Ollama model or the Claude API without
 * touching any caller.
 */

import type { ExtractedItem } from '@cairn/shared';
import { detectDate } from './dates.js';
import { detectPriority, detectProject, detectTags, detectType } from './rules.js';
import { classifyWithOllama } from './ollama.js';

export interface ClassifyOptions {
  /** Existing project names, so the engine can suggest the right one. */
  knownProjects?: string[];
  /** Override "now" (used by tests for deterministic dates). */
  base?: Date;
  /** Which backend smartClassify should use. Defaults to the rule engine. */
  backend?: 'rules' | 'ollama';
  ollamaHost?: string;
  ollamaModel?: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Break a brain dump into individual item segments. Splits on newlines,
 * semicolons, bullet markers, and commas - but never inside a number
 * (so "1,000" stays whole).
 */
export function splitSegments(text: string): string[] {
  // Split on newlines, semicolons, bullet glyphs, and commas - but treat a
  // comma as a thousands separator (no split) only when a digit follows it,
  // e.g. "1,000". "C49, idea" still splits because a space follows the comma.
  return text
    .split(/\r?\n|;|·|•|‣|,(?!\d)/g)
    .map((s) => s.replace(/^[\s\-*•‣]+/, '').trim())
    .filter((s) => s.length >= 2);
}

function classifySegment(segment: string, known: string[], base: Date): ExtractedItem {
  const reasons: string[] = [];

  // 1) Date - detect and strip the trigger phrase from the working text.
  const date = detectDate(segment, base);
  let working = segment;
  if (date) {
    working = working.replace(date.matched, ' ').replace(/\s+/g, ' ').trim();
    reasons.push(`due ${date.label}`);
  }

  // 2) Type + cleaned title.
  const typeDet = detectType(working);
  reasons.push(...typeDet.reasons);

  // 3) Priority - scan the original segment for urgency cues.
  const pri = detectPriority(segment);
  reasons.push(...pri.reasons);

  // 4) Tags (#hashtags).
  const tags = detectTags(segment);

  // 5) Project suggestion.
  const project = detectProject(working, known);
  if (project) reasons.push(`project "${project}"`);

  return {
    id: crypto.randomUUID(),
    type: typeDet.type,
    title: typeDet.cleanedTitle || segment,
    description: null,
    priority: pri.priority,
    dueDate: date?.iso ?? null,
    dueDateLabel: date?.label ?? null,
    projectSuggestion: project,
    tags,
    confidence: round2(date ? Math.min(0.97, typeDet.confidence + 0.05) : typeDet.confidence),
    status: typeDet.status,
    reasons,
  };
}

export function classifyBrainDump(text: string, opts: ClassifyOptions = {}): ExtractedItem[] {
  const base = opts.base ?? new Date();
  const known = opts.knownProjects ?? [];
  return splitSegments(text).map((segment) => classifySegment(segment, known, base));
}

/**
 * Classify using the configured backend. When CAIRN_CLASSIFIER=ollama, tries the
 * local model and falls back to the deterministic rule engine on any failure.
 */
export async function smartClassify(
  text: string,
  opts: ClassifyOptions = {},
): Promise<ExtractedItem[]> {
  if (opts.backend === 'ollama') {
    try {
      const items = await classifyWithOllama(text, {
        knownProjects: opts.knownProjects,
        base: opts.base,
        host: opts.ollamaHost,
        model: opts.ollamaModel,
      });
      if (items.length > 0) return items;
    } catch (error) {
      console.error('[classifier] Ollama failed, falling back to rules:', (error as Error).message);
    }
  }
  return classifyBrainDump(text, opts);
}

export { detectDate } from './dates.js';
export { detectPriority, detectProject, detectTags, detectType } from './rules.js';
export { classifyWithOllama, pingOllama } from './ollama.js';
