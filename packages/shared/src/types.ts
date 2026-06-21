/**
 * CairnOS - domain entity types.
 *
 * Timestamps are ISO-8601 strings everywhere (DB stores TEXT, the API returns
 * the same strings, the client parses with date-fns only when needed). This
 * keeps DB ↔ API ↔ UI perfectly aligned with zero serialization mapping.
 */

import type {
  IdeaStatus,
  ItemType,
  Priority,
  ProjectStatus,
  ReminderStatus,
  TaskStatus,
  ActivityAction,
} from './constants.js';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  objective: string | null;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  createdAt: string;
  updatedAt: string;
  /** Resolved tag names (from item_tags). */
  tags: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  tags: string[];
}

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Note {
  id: string;
  title: string;
  body: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remindAt: string;
  status: ReminderStatus;
  projectId: string | null;
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface BrainDump {
  id: string;
  text: string;
  createdAt: string;
  itemCount: number;
}

export interface ClassificationResult {
  id: string;
  brainDumpId: string;
  payload: ExtractedItem[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: ItemType | 'brain_dump';
  entityId: string;
  summary: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

/**
 * A single reviewable item produced by the classifier from a brain dump.
 * `id` is a client-side temp id until the user saves it.
 */
export interface ExtractedItem {
  id: string;
  type: ItemType;
  title: string;
  description: string | null;
  priority: Priority;
  /** ISO date if a due/remind time was detected, else null. */
  dueDate: string | null;
  /** Human label that triggered the date, e.g. "tomorrow". */
  dueDateLabel: string | null;
  /** Suggested project name (may match an existing project or be new). */
  projectSuggestion: string | null;
  tags: string[];
  /** 0..1 - how confident the rule engine is in this classification. */
  confidence: number;
  /** Type-specific default status (e.g. "todo", "captured", "scheduled"). */
  status: string;
  /** Human-readable reasons the engine chose this type (explainability). */
  reasons: string[];
}

/** Aggregated payload for the dashboard / Today view. */
export interface TodaySnapshot {
  greeting: string;
  displayName: string;
  tasksDueToday: Task[];
  overdueTasks: Task[];
  upcomingReminders: Reminder[];
  activeProjects: Project[];
  inboxCount: number;
  stats: {
    tasksToday: number;
    completedToday: number;
    activeProjects: number;
    ideas: number;
    completionRate: number;
  };
}

/** A unified search hit across all entity types. */
export interface SearchHit {
  type: ItemType;
  id: string;
  title: string;
  subtitle: string | null;
  projectId: string | null;
}
