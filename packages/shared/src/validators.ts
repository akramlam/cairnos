/**
 * CairnOS - Zod validators.
 *
 * Every write that enters the system (UI form, API request, MCP tool call)
 * is validated against these schemas. They are the contract; the DB and core
 * services trust their output.
 */

import { z } from 'zod';
import {
  IDEA_STATUSES,
  ITEM_TYPES,
  PRIORITIES,
  PROJECT_STATUSES,
  REMINDER_STATUSES,
  TASK_STATUSES,
} from './constants.js';

/** ISO-8601 string that `Date.parse` accepts. Empty/undefined become null upstream. */
export const zIsoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid ISO date string' });

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v === undefined || v === '' ? null : v));

export const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(24)
  .default([])
  .transform((tags) => Array.from(new Set(tags.map((t) => t.toLowerCase()))));

/* ------------------------------------------------------------------ Projects */

export const createProjectSchema = z.object({
  name: trimmed(120),
  description: optionalText(2000),
  objective: optionalText(2000),
  status: z.enum(PROJECT_STATUSES).default('active'),
  priority: z.enum(PRIORITIES).default('medium'),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Expected a #RRGGBB hex color').optional(),
  tags: tagsSchema.optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/* --------------------------------------------------------------------- Tasks */

export const createTaskSchema = z.object({
  title: trimmed(200),
  description: optionalText(4000),
  status: z.enum(TASK_STATUSES).default('todo'),
  priority: z.enum(PRIORITIES).default('medium'),
  dueDate: zIsoDate.optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  tags: tagsSchema.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

/* --------------------------------------------------------------------- Ideas */

export const createIdeaSchema = z.object({
  title: trimmed(200),
  description: optionalText(4000),
  status: z.enum(IDEA_STATUSES).default('captured'),
  projectId: z.string().uuid().optional().nullable(),
  tags: tagsSchema.optional(),
});
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;

export const updateIdeaSchema = createIdeaSchema.partial();
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;

/* --------------------------------------------------------------------- Notes */

export const createNoteSchema = z.object({
  title: trimmed(200),
  body: z.string().max(20000).default(''),
  projectId: z.string().uuid().optional().nullable(),
  tags: tagsSchema.optional(),
});
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial();
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

/* ----------------------------------------------------------------- Reminders */

export const createReminderSchema = z.object({
  title: trimmed(200),
  description: optionalText(2000),
  remindAt: zIsoDate,
  status: z.enum(REMINDER_STATUSES).default('scheduled'),
  projectId: z.string().uuid().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
});
export type CreateReminderInput = z.infer<typeof createReminderSchema>;

export const updateReminderSchema = createReminderSchema.partial();
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;

/* ------------------------------------------------------------- Brain dump / AI */

export const brainDumpSchema = z.object({
  text: z.string().trim().min(1, 'Write something to capture').max(10000),
});
export type BrainDumpInput = z.infer<typeof brainDumpSchema>;

export const extractedItemSchema = z.object({
  id: z.string(),
  type: z.enum(ITEM_TYPES),
  title: trimmed(200),
  description: z.string().nullable().default(null),
  priority: z.enum(PRIORITIES).default('medium'),
  dueDate: zIsoDate.nullable().default(null),
  dueDateLabel: z.string().nullable().default(null),
  projectSuggestion: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  status: z.string().default('todo'),
  reasons: z.array(z.string()).default([]),
});
export type ExtractedItemInput = z.infer<typeof extractedItemSchema>;

/** Save the user-reviewed items from a brain dump. */
export const saveExtractedSchema = z.object({
  brainDumpId: z.string().optional(),
  sourceText: z.string().optional(),
  items: z.array(extractedItemSchema).min(1),
});
export type SaveExtractedInput = z.infer<typeof saveExtractedSchema>;

/* ------------------------------------------------------------------ Settings */

export const settingsSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  notificationsEnabled: z.boolean().optional(),
  reminderLeadMinutes: z.number().int().min(0).max(1440).optional(),
  /** Brain-dump classifier backend: offline rules or a local Ollama model. */
  classifier: z.enum(['rules', 'ollama']).optional(),
  ollamaHost: z.string().trim().max(200).optional(),
  ollamaModel: z.string().trim().max(100).optional(),
  /** Whether the user has completed first-run onboarding. */
  onboarded: z.boolean().optional(),
  /** Accent ("principal color") preset key, e.g. "cairn", "emerald". */
  accent: z.string().trim().max(40).optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

/* -------------------------------------------------------------------- Search */

export const searchSchema = z.object({
  query: z.string().trim().min(1).max(200),
  types: z.array(z.enum(ITEM_TYPES)).optional(),
  limit: z.number().int().min(1).max(100).default(30),
});
export type SearchInput = z.infer<typeof searchSchema>;

/* ------------------------------------------------------- Idea conversion (→) */

export const convertIdeaSchema = z.object({
  target: z.enum(['task', 'project', 'note']),
});
export type ConvertIdeaInput = z.infer<typeof convertIdeaSchema>;
