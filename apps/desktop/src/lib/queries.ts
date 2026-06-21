import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ExtractedItem } from '@cairn/shared';
import { api, type AppSettings, type ReminderView, type TaskView } from './api';

export const qk = {
  today: ['today'] as const,
  projects: (archived?: boolean) => ['projects', { archived: !!archived }] as const,
  projectDetails: (id: string) => ['project', id, 'details'] as const,
  tasks: (view: TaskView, projectId?: string) => ['tasks', view, projectId ?? null] as const,
  ideas: (status?: string) => ['ideas', status ?? 'all'] as const,
  notes: (projectId?: string) => ['notes', projectId ?? 'all'] as const,
  reminders: (view: ReminderView) => ['reminders', view] as const,
  settings: ['settings'] as const,
  activity: ['activity'] as const,
  search: (q: string) => ['search', q] as const,
};

/* ----------------------------------------------------------------- queries */

export const useToday = () => useQuery({ queryKey: qk.today, queryFn: api.today });

export const useProjects = (archived = false) =>
  useQuery({ queryKey: qk.projects(archived), queryFn: () => api.projects.list(archived) });

export const useProjectDetails = (id: string | undefined) =>
  useQuery({
    queryKey: qk.projectDetails(id ?? ''),
    queryFn: () => api.projects.details(id!),
    enabled: !!id,
  });

export const useTasks = (view: TaskView = 'all', projectId?: string) =>
  useQuery({ queryKey: qk.tasks(view, projectId), queryFn: () => api.tasks.list(view, projectId) });

export const useIdeas = (status?: string) =>
  useQuery({ queryKey: qk.ideas(status), queryFn: () => api.ideas.list(status) });

export const useNotes = (projectId?: string) =>
  useQuery({ queryKey: qk.notes(projectId), queryFn: () => api.notes.list(projectId) });

export const useReminders = (view: ReminderView = 'all') =>
  useQuery({ queryKey: qk.reminders(view), queryFn: () => api.reminders.list(view) });

export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: api.settings.get });

export const useActivity = () => useQuery({ queryKey: qk.activity, queryFn: () => api.activity(20) });

export const useSearch = (q: string) =>
  useQuery({ queryKey: qk.search(q), queryFn: () => api.search(q), enabled: q.trim().length > 0 });

/* --------------------------------------------------------------- mutations */

function useWriter<TArgs, TData>(fn: (args: TArgs) => Promise<TData>, successMsg?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // Broad invalidation keeps dashboard counts and every list view in sync.
      qc.invalidateQueries();
      if (successMsg) toast.success(successMsg);
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });
}

type WithId<T> = { id: string; data: T };
type Data = Record<string, unknown>;

export const useCreateTask = () => useWriter((d: Data) => api.tasks.create(d), 'Task created');
export const useUpdateTask = () => useWriter((v: WithId<Data>) => api.tasks.update(v.id, v.data));
export const useCompleteTask = () => useWriter((id: string) => api.tasks.complete(id), 'Task completed');
export const useReopenTask = () =>
  useWriter((id: string) => api.tasks.update(id, { status: 'todo' }), 'Task reopened');
export const useDeleteTask = () => useWriter((id: string) => api.tasks.remove(id), 'Task deleted');

export const useCreateProject = () => useWriter((d: Data) => api.projects.create(d), 'Project created');
export const useUpdateProject = () => useWriter((v: WithId<Data>) => api.projects.update(v.id, v.data));
export const useArchiveProject = () => useWriter((id: string) => api.projects.archive(id), 'Project archived');
export const useDeleteProject = () => useWriter((id: string) => api.projects.remove(id), 'Project deleted');

export const useCreateIdea = () => useWriter((d: Data) => api.ideas.create(d), 'Idea captured');
export const useUpdateIdea = () => useWriter((v: WithId<Data>) => api.ideas.update(v.id, v.data));
export const useConvertIdea = () =>
  useWriter((v: { id: string; target: 'task' | 'project' | 'note' }) => api.ideas.convert(v.id, v.target), 'Idea converted');
export const useDeleteIdea = () => useWriter((id: string) => api.ideas.remove(id), 'Idea deleted');

export const useCreateNote = () => useWriter((d: Data) => api.notes.create(d), 'Note saved');
export const useUpdateNote = () => useWriter((v: WithId<Data>) => api.notes.update(v.id, v.data));
export const useDeleteNote = () => useWriter((id: string) => api.notes.remove(id), 'Note deleted');

export const useCreateReminder = () => useWriter((d: Data) => api.reminders.create(d), 'Reminder set');
export const useSnoozeReminder = () =>
  useWriter((v: { id: string; minutes?: number }) => api.reminders.snooze(v.id, v.minutes), 'Snoozed');
export const useReminderDone = () => useWriter((id: string) => api.reminders.done(id), 'Reminder done');
export const useDismissReminder = () => useWriter((id: string) => api.reminders.dismiss(id));

export const useUpdateSettings = () =>
  useWriter((d: Partial<AppSettings>) => api.settings.update(d), 'Settings saved');

export const useSeedSampleData = () => useWriter((_: void) => api.seed(), 'Sample data loaded');

export const useSaveBrainDump = () =>
  useWriter((v: { items: ExtractedItem[]; sourceText?: string }) => api.braindump.save(v.items, v.sourceText));
