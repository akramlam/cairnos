import { MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { Task } from '@cairn/shared';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityDot } from '@/components/shared/badges';
import { useCompleteTask, useDeleteTask, useReopenTask } from '@/lib/queries';
import { formatDue, isOverdue } from '@/lib/format';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';

export function TaskItem({
  task,
  projectName,
}: {
  task: Task;
  projectName?: string | null;
}) {
  const complete = useCompleteTask();
  const reopen = useReopenTask();
  const remove = useDeleteTask();
  const setEditingTask = useUiStore((s) => s.setEditingTask);
  const done = task.status === 'done';
  const due = formatDue(task.dueDate);
  const overdue = isOverdue(task.dueDate) && !done;

  // Toggle: clicking a done task reopens it, clicking an open task completes it.
  const toggle = () => (done ? reopen.mutate(task.id) : complete.mutate(task.id));

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]">
      <Checkbox
        checked={done}
        onCheckedChange={toggle}
        aria-label={done ? 'Reopen task' : 'Complete task'}
      />
      <div className="min-w-0 flex-1">
        <button
          onClick={() => setEditingTask(task)}
          className={cn(
            'block w-full truncate text-left text-sm transition-colors hover:text-primary',
            done && 'text-muted-foreground line-through',
          )}
        >
          {task.title}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {due && <span className={cn(overdue && 'text-rose-300')}>{due}</span>}
          {projectName && (
            <>
              {due && <span className="opacity-40">·</span>}
              <span>{projectName}</span>
            </>
          )}
          {task.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-muted-foreground/70">
              #{t}
            </span>
          ))}
        </div>
      </div>
      <PriorityDot priority={task.priority} className="shrink-0" />
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground focus:outline-none group-hover:opacity-100">
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditingTask(task)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          {done ? (
            <DropdownMenuItem onSelect={() => reopen.mutate(task.id)}>
              <RotateCcw className="size-4" /> Mark as not done
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => complete.mutate(task.id)}>
              Mark complete
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => remove.mutate(task.id)}>
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
