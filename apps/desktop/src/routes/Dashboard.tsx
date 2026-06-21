import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FolderKanban,
  Lightbulb,
  ListChecks,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Reminder } from '@cairn/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn, Stagger, StaggerItem } from '@/components/shared/motion';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useToday } from '@/lib/queries';
import { formatDue } from '@/lib/format';
import { useUiStore } from '@/store/ui';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tint: string;
}) {
  return (
    <Card className="card-hover relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: tint }} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-[1.6rem] font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      <div className="p-2">{children}</div>
    </Card>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-foreground/[0.03]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <Bell className="size-4 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{reminder.title}</div>
        <div className="text-xs text-muted-foreground">{formatDue(reminder.remindAt)}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading } = useToday();
  const setQuick = useUiStore((s) => s.setQuickCaptureOpen);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-7">
      <FadeIn className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-tight">
            {data.greeting}, <span className="text-gradient">{data.displayName}</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d')} · Turn chaos into action.
          </p>
        </div>
        <Button variant="brand" onClick={() => setQuick(true)} className="gap-2">
          <Sparkles className="size-4" />
          Quick capture
        </Button>
      </FadeIn>

      <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StaggerItem>
          <StatCard icon={ListChecks} label="Tasks today" value={stats.tasksToday} tint="#3b82f6" hint={`${data.overdueTasks.length} overdue`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={TrendingUp} label="Completion" value={`${stats.completionRate}%`} tint="#8b5cf6" hint={`${stats.completedToday} done today`} />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={FolderKanban} label="Active projects" value={stats.activeProjects} tint="#6366f1" hint="In progress" />
        </StaggerItem>
        <StaggerItem>
          <StatCard icon={Lightbulb} label="Ideas" value={stats.ideas} tint="#06b6d4" hint="Captured" />
        </StaggerItem>
      </Stagger>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <FadeIn delay={0.05} className="space-y-5 lg:col-span-2">
          <SectionCard
            title="Due today"
            action={
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Link to="/tasks">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            }
          >
            {data.tasksDueToday.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 size-6 text-emerald-400/80" />
                Nothing due today. You're on top of it.
              </div>
            ) : (
              data.tasksDueToday.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </SectionCard>

          {data.overdueTasks.length > 0 && (
            <SectionCard title={`Overdue · ${data.overdueTasks.length}`}>
              {data.overdueTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </SectionCard>
          )}

          <SectionCard
            title="Active projects"
            action={
              <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <Link to="/projects">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            }
          >
            {data.activeProjects.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">No active projects.</div>
            ) : (
              <div className="grid gap-2 p-1 sm:grid-cols-2">
                {data.activeProjects.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="glass card-hover block rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="truncate text-sm font-medium">{p.name}</span>
                    </div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {p.objective ?? p.description ?? 'No objective set'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </FadeIn>

        <FadeIn delay={0.1} className="space-y-5">
          <Card className="relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="flex size-9 items-center justify-center rounded-lg brand-gradient">
                <Sparkles className="size-5 text-white" />
              </div>
              <h3 className="mt-3 font-semibold">Capture the chaos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Brain-dump everything. CairnOS sorts it into tasks, ideas, and reminders.
              </p>
              <Button variant="brand" onClick={() => setQuick(true)} className="mt-4 w-full gap-2">
                <Sparkles className="size-4" /> Quick capture
              </Button>
            </div>
          </Card>

          <SectionCard
            title="Upcoming reminders"
            action={
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link to="/reminders">All</Link>
              </Button>
            }
          >
            {data.upcomingReminders.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No upcoming reminders.
              </div>
            ) : (
              data.upcomingReminders.map((r) => <ReminderRow key={r.id} reminder={r} />)
            )}
          </SectionCard>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Today's progress</span>
              <span className="text-muted-foreground">{stats.completionRate}%</span>
            </div>
            <Progress value={stats.completionRate} />
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.completedToday} completed · {stats.tasksToday} remaining
            </p>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
