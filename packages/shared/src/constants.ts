/**
 * CairnOS - shared enums, brand tokens, and design constants.
 *
 * These const tuples are the single source of truth for every status/priority
 * value in the system. The DB schema, Zod validators, classifier, and UI all
 * derive their types from here so a new status can never drift out of sync.
 */

export const ITEM_TYPES = ['task', 'project', 'idea', 'note', 'reminder'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PROJECT_STATUSES = ['active', 'paused', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const IDEA_STATUSES = ['captured', 'reviewing', 'converted', 'archived'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const REMINDER_STATUSES = ['scheduled', 'triggered', 'dismissed', 'done'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/** Brand palette - derived directly from the CairnOS design references. */
export const BRAND = {
  electricBlue: '#3B82F6',
  violet: '#8B5CF6',
  indigo: '#6366F1',
  background: '#0F1117',
  muted: '#A1A1AA',
  white: '#F9FAFB',
} as const;

/** Selectable project accent colors (used for the colored dot / glow). */
export const PROJECT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Slate', value: '#64748B' },
] as const;

export const DEFAULT_PROJECT_COLOR = PROJECT_COLORS[0].value;

/** Activity log action kinds - kept as a tuple for a typed audit trail. */
export const ACTIVITY_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'completed',
  'archived',
  'reminded',
  'classified',
  'converted',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const APP_NAME = 'CairnOS';
export const APP_TAGLINE = 'Turn chaos into action.';
