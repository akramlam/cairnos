import type {
  ActivityLog,
  ExtractedItem,
  Idea,
  Note,
  Project,
  Reminder,
  SearchHit,
  Task,
  TodaySnapshot,
} from '@cairn/shared';
import { API_URL } from './config';

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`Request failed (${status})`);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const body = (data: unknown) => JSON.stringify(data);

export interface ProjectDetails {
  project: Project;
  tasks: Task[];
  notes: Note[];
  ideas: Idea[];
  reminders: Reminder[];
  progress: number;
  nextAction: Task | null;
}

export interface AppSettings {
  displayName: string;
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  reminderLeadMinutes: number;
  classifier: 'rules' | 'ollama';
  ollamaHost: string;
  ollamaModel: string;
  onboarded: boolean;
  accent: string;
}

export interface AiStatus {
  reachable: boolean;
  models: string[];
  error?: string;
}

export interface SeedResult {
  seeded: boolean;
  reason?: string;
  summary?: { projects: number; tasks: number; ideas: number; notes: number; reminders: number };
}

export type TaskView = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
export type ReminderView = 'upcoming' | 'overdue' | 'all' | 'active';

export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  today: () => request<TodaySnapshot>('/dashboard/today'),

  projects: {
    list: (archived = false) => request<Project[]>(`/projects${archived ? '?archived=true' : ''}`),
    get: (id: string) => request<Project>(`/projects/${id}`),
    details: (id: string) => request<ProjectDetails>(`/projects/${id}/details`),
    create: (data: Record<string, unknown>) =>
      request<Project>('/projects', { method: 'POST', body: body(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Project>(`/projects/${id}`, { method: 'PATCH', body: body(data) }),
    archive: (id: string) => request<Project>(`/projects/${id}/archive`, { method: 'POST' }),
    remove: (id: string) => request<{ deleted: boolean }>(`/projects/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (view: TaskView = 'all', projectId?: string) => {
      const params = new URLSearchParams({ view });
      if (projectId) params.set('projectId', projectId);
      return request<Task[]>(`/tasks?${params.toString()}`);
    },
    create: (data: Record<string, unknown>) =>
      request<Task>('/tasks', { method: 'POST', body: body(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: body(data) }),
    complete: (id: string) => request<Task>(`/tasks/${id}/complete`, { method: 'POST' }),
    remove: (id: string) => request<{ deleted: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  ideas: {
    list: (status?: string) => request<Idea[]>(`/ideas${status ? `?status=${status}` : ''}`),
    create: (data: Record<string, unknown>) =>
      request<Idea>('/ideas', { method: 'POST', body: body(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Idea>(`/ideas/${id}`, { method: 'PATCH', body: body(data) }),
    convert: (id: string, target: 'task' | 'project' | 'note') =>
      request<{ type: string; id: string }>(`/ideas/${id}/convert`, {
        method: 'POST',
        body: body({ target }),
      }),
    remove: (id: string) => request<{ deleted: boolean }>(`/ideas/${id}`, { method: 'DELETE' }),
  },

  notes: {
    list: (projectId?: string) => request<Note[]>(`/notes${projectId ? `?projectId=${projectId}` : ''}`),
    create: (data: Record<string, unknown>) =>
      request<Note>('/notes', { method: 'POST', body: body(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Note>(`/notes/${id}`, { method: 'PATCH', body: body(data) }),
    remove: (id: string) => request<{ deleted: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
  },

  reminders: {
    list: (view: ReminderView = 'all') => request<Reminder[]>(`/reminders?view=${view}`),
    create: (data: Record<string, unknown>) =>
      request<Reminder>('/reminders', { method: 'POST', body: body(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<Reminder>(`/reminders/${id}`, { method: 'PATCH', body: body(data) }),
    snooze: (id: string, minutes = 10) =>
      request<Reminder>(`/reminders/${id}/snooze?minutes=${minutes}`, { method: 'POST' }),
    done: (id: string) => request<Reminder>(`/reminders/${id}/done`, { method: 'POST' }),
    dismiss: (id: string) => request<Reminder>(`/reminders/${id}/dismiss`, { method: 'POST' }),
  },

  braindump: {
    classify: (text: string) =>
      request<{ items: ExtractedItem[] }>('/braindump/classify', {
        method: 'POST',
        body: body({ text }),
      }),
    save: (items: ExtractedItem[], sourceText?: string) =>
      request<{ brainDumpId: string; created: { type: string; id: string; title: string }[] }>(
        '/braindump/save',
        { method: 'POST', body: body({ items, sourceText }) },
      ),
  },

  search: (query: string, types?: string[]) => {
    const params = new URLSearchParams({ q: query });
    if (types?.length) params.set('types', types.join(','));
    return request<SearchHit[]>(`/search?${params.toString()}`);
  },

  settings: {
    get: () => request<AppSettings>('/settings'),
    update: (data: Partial<AppSettings>) =>
      request<AppSettings>('/settings', { method: 'PATCH', body: body(data) }),
  },

  aiStatus: (host?: string) =>
    request<AiStatus>(`/ai/status${host ? `?host=${encodeURIComponent(host)}` : ''}`),

  seed: () => request<SeedResult>('/seed', { method: 'POST' }),

  activity: (limit = 20) => request<ActivityLog[]>(`/activity?limit=${limit}`),

  exportData: () => request<Record<string, unknown>>('/export'),
};

export const eventsUrl = `${API_URL}/events`;
