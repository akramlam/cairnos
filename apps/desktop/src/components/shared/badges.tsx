import type { Priority } from '@cairn/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Variant = BadgeProps['variant'];

const PRIORITY: Record<Priority, { label: string; variant: Variant; dot: string }> = {
  high: { label: 'High', variant: 'danger', dot: 'bg-rose-400' },
  medium: { label: 'Medium', variant: 'warning', dot: 'bg-amber-400' },
  low: { label: 'Low', variant: 'muted', dot: 'bg-slate-400' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const p = PRIORITY[priority];
  return (
    <Badge variant={p.variant}>
      <span className={cn('size-1.5 rounded-full', p.dot)} />
      {p.label}
    </Badge>
  );
}

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn('size-2 rounded-full', PRIORITY[priority].dot, className)} />;
}

const TASK_STATUS: Record<string, { label: string; variant: Variant }> = {
  todo: { label: 'To do', variant: 'muted' },
  in_progress: { label: 'In progress', variant: 'primary' },
  blocked: { label: 'Blocked', variant: 'danger' },
  done: { label: 'Done', variant: 'success' },
};

const PROJECT_STATUS: Record<string, { label: string; variant: Variant }> = {
  active: { label: 'Active', variant: 'primary' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  archived: { label: 'Archived', variant: 'muted' },
};

const IDEA_STATUS: Record<string, { label: string; variant: Variant }> = {
  captured: { label: 'Captured', variant: 'violet' },
  reviewing: { label: 'Reviewing', variant: 'primary' },
  converted: { label: 'Converted', variant: 'success' },
  archived: { label: 'Archived', variant: 'muted' },
};

const REMINDER_STATUS: Record<string, { label: string; variant: Variant }> = {
  scheduled: { label: 'Scheduled', variant: 'primary' },
  triggered: { label: 'Triggered', variant: 'warning' },
  dismissed: { label: 'Dismissed', variant: 'muted' },
  done: { label: 'Done', variant: 'success' },
};

function StatusBadge({ map, status }: { map: Record<string, { label: string; variant: Variant }>; status: string }) {
  const s = map[status] ?? { label: status, variant: 'muted' as Variant };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const TaskStatusBadge = ({ status }: { status: string }) => <StatusBadge map={TASK_STATUS} status={status} />;
export const ProjectStatusBadge = ({ status }: { status: string }) => <StatusBadge map={PROJECT_STATUS} status={status} />;
export const IdeaStatusBadge = ({ status }: { status: string }) => <StatusBadge map={IDEA_STATUS} status={status} />;
export const ReminderStatusBadge = ({ status }: { status: string }) => <StatusBadge map={REMINDER_STATUS} status={status} />;
