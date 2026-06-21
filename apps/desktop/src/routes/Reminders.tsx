import { useState } from 'react';
import { Bell, BellPlus, Check, Clock, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn } from '@/components/shared/motion';
import { ReminderStatusBadge } from '@/components/shared/badges';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useReminders,
  useCreateReminder,
  useSnoozeReminder,
  useReminderDone,
  useDismissReminder,
} from '@/lib/queries';
import { formatDue, isOverdue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ReminderView } from '@/lib/api';
import type { Reminder } from '@cairn/shared';

const VIEWS: { key: ReminderView; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'all', label: 'All' },
];

type Form = { title: string; remindAt: string; description: string };
const EMPTY_FORM: Form = { title: '', remindAt: '', description: '' };

export function Reminders() {
  const [view, setView] = useState<ReminderView>('upcoming');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);

  const reminders = useReminders(view);
  const createReminder = useCreateReminder();
  const snooze = useSnoozeReminder();
  const done = useReminderDone();
  const dismiss = useDismissReminder();

  const canSubmit = form.title.trim().length > 0 && form.remindAt.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    createReminder.mutate(
      {
        title: form.title.trim(),
        remindAt: new Date(form.remindAt).toISOString(),
        description: form.description.trim() || null,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(EMPTY_FORM);
        },
      },
    );
  };

  return (
    <div>
      <PageHeader title="Reminders" description="Never lose track of time-sensitive things.">
        <Button variant="brand" onClick={() => setOpen(true)} className="gap-1.5">
          <BellPlus className="size-4" /> New reminder
        </Button>
      </PageHeader>

      <Tabs value={view} onValueChange={(v) => setView(v as ReminderView)}>
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTrigger key={v.key} value={v.key}>
              {v.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <FadeIn>
        <Card className="mt-4 p-2">
          {reminders.isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : reminders.data && reminders.data.length > 0 ? (
            reminders.data.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                onSnooze={() => snooze.mutate({ id: reminder.id, minutes: 10 })}
                onDone={() => done.mutate(reminder.id)}
                onDismiss={() => dismiss.mutate(reminder.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={Bell}
              title={`No ${view === 'all' ? '' : view} reminders`.replace(/\s+/g, ' ').trim()}
              description="Set a reminder so CairnOS can nudge you at exactly the right moment."
              action={
                <Button variant="brand" onClick={() => setOpen(true)} className="gap-1.5">
                  <BellPlus className="size-4" /> New reminder
                </Button>
              }
            />
          )}
        </Card>
      </FadeIn>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New reminder</DialogTitle>
            <DialogDescription>
              We'll surface this right when it matters - schedule it below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label="Title">
              <Input
                autoFocus
                placeholder="Follow up with the design team"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>

            <Field label="Remind at">
              <DateTimePicker
                value={form.remindAt}
                onChange={(v) => setForm((f) => ({ ...f, remindAt: v }))}
                placeholder="Pick a date & time"
              />
            </Field>

            <Field label="Description" hint="Optional - add any context you'll want later.">
              <Textarea
                rows={3}
                placeholder="What's this about?"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              onClick={submit}
              disabled={!canSubmit || createReminder.isPending}
              className="gap-1.5"
            >
              <BellPlus className="size-4" /> Set reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReminderRow({
  reminder,
  onSnooze,
  onDone,
  onDismiss,
}: {
  reminder: Reminder;
  onSnooze: () => void;
  onDone: () => void;
  onDismiss: () => void;
}) {
  const overdue = isOverdue(reminder.remindAt);

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-foreground/[0.03]">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          overdue ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400',
        )}
      >
        <Bell className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{reminder.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-xs',
              overdue ? 'text-rose-400' : 'text-muted-foreground',
            )}
          >
            {formatDue(reminder.remindAt)}
          </span>
          <ReminderStatusBadge status={reminder.status} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onSnooze} className="gap-1.5">
          <Clock className="size-3.5" /> Snooze
        </Button>
        <Button variant="subtle" size="sm" onClick={onDone} className="gap-1.5">
          <Check className="size-3.5" /> Done
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="More actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem destructive onSelect={onDismiss}>
              Dismiss
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
