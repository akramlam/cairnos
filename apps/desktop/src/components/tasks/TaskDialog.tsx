import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { PRIORITIES, TASK_STATUSES } from '@cairn/shared';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field } from '@/components/shared/Field';
import { useCreateTask, useProjects, useUpdateTask } from '@/lib/queries';
import { useUiStore } from '@/store/ui';

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', projectId: '', tags: '' };

const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

export function TaskDialog() {
  const newTaskOpen = useUiStore((s) => s.newTaskOpen);
  const setNewTaskOpen = useUiStore((s) => s.setNewTaskOpen);
  const editingTask = useUiStore((s) => s.editingTask);
  const setEditingTask = useUiStore((s) => s.setEditingTask);

  const projects = useProjects();
  const create = useCreateTask();
  const update = useUpdateTask();
  const [form, setForm] = useState(EMPTY);

  const isEdit = !!editingTask;
  const open = newTaskOpen || isEdit;

  const close = () => {
    setNewTaskOpen(false);
    setEditingTask(null);
  };

  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description ?? '',
        status: editingTask.status,
        priority: editingTask.priority,
        dueDate: toLocalInput(editingTask.dueDate),
        projectId: editingTask.projectId ?? '',
        tags: editingTask.tags.join(', '),
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editingTask]);

  function submit() {
    if (!form.title.trim()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      projectId: form.projectId || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (isEdit && editingTask) {
      update.mutate({ id: editingTask.id, data }, { onSuccess: close });
    } else {
      create.mutate(data, { onSuccess: close });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Title">
            <Input
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional details…"
              className="min-h-[70px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Due date">
              <DateTimePicker
                value={form.dueDate}
                onChange={(v) => setForm({ ...form, dueDate: v })}
                placeholder="No due date"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Project">
              <Select
                value={form.projectId || 'none'}
                onValueChange={(v) => setForm({ ...form, projectId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Tags" hint="Comma-separated">
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="design, urgent"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="brand" onClick={submit} disabled={!form.title.trim() || pending}>
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
