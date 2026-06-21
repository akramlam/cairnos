import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  FileText,
  FolderKanban,
  Lightbulb,
  ListChecks,
  MoreHorizontal,
  Sparkles,
  Trash2,
  Archive,
} from 'lucide-react';
import type { Note, Idea, Reminder } from '@cairn/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn } from '@/components/shared/motion';
import {
  ProjectStatusBadge,
  PriorityBadge,
  IdeaStatusBadge,
  ReminderStatusBadge,
} from '@/components/shared/badges';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useProjectDetails, useArchiveProject, useDeleteProject } from '@/lib/queries';
import { formatDue } from '@/lib/format';
import { cn } from '@/lib/utils';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-semibold tracking-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <Card className="card-hover p-4">
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <h4 className="truncate text-sm font-medium">{note.title}</h4>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">
        {note.body}
      </p>
    </Card>
  );
}

function IdeaRow({ idea }: { idea: Idea }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
        <Lightbulb className="size-4 text-violet-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{idea.title}</div>
        {idea.description && (
          <div className="truncate text-xs text-muted-foreground">{idea.description}</div>
        )}
      </div>
      <IdeaStatusBadge status={idea.status} />
    </div>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-foreground/[0.03]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
        <Bell className="size-4 text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{reminder.title}</div>
        <div className="text-xs text-muted-foreground">{formatDue(reminder.remindAt)}</div>
      </div>
      <ReminderStatusBadge status={reminder.status} />
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const details = useProjectDetails(id);
  const archive = useArchiveProject();
  const remove = useDeleteProject();
  const [tab, setTab] = useState('tasks');

  if (details.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!details.data) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="This project may have been deleted or archived."
        action={
          <Button asChild variant="brand" className="gap-1.5">
            <Link to="/projects">
              <ArrowLeft className="size-4" /> Back to projects
            </Link>
          </Button>
        }
      />
    );
  }

  const { project, tasks, notes, ideas, reminders, progress, nextAction } = details.data;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="space-y-6">
      <FadeIn className="space-y-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: project.color }}
              />
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {project.objective && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.objective}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Project actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() =>
                  archive.mutate(project.id, { onSuccess: () => navigate('/projects') })
                }
              >
                <Archive className="size-4" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                destructive
                onSelect={() =>
                  remove.mutate(project.id, { onSuccess: () => navigate('/projects') })
                }
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">{progress}% complete</span>
            <span className="text-muted-foreground">
              {doneTasks} / {tasks.length} tasks
            </span>
          </div>
          <Progress value={progress} />
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Tasks done" value={`${doneTasks}/${tasks.length}`} />
            <Stat label="Notes" value={notes.length} />
            <Stat label="Ideas" value={ideas.length} />
            <Stat label="Reminders" value={reminders.length} />
          </div>
        </Card>
      </FadeIn>

      {nextAction && (
        <FadeIn delay={0.08}>
          <Card className="relative overflow-hidden border-primary/30 p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                  <Sparkles className="size-3.5" /> Next action
                </div>
                <div className="mt-1.5 truncate text-sm font-medium">{nextAction.title}</div>
                {formatDue(nextAction.dueDate) && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDue(nextAction.dueDate)}
                  </div>
                )}
              </div>
              <PriorityBadge priority={nextAction.priority} />
            </div>
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="tasks">Tasks · {tasks.length}</TabsTrigger>
            <TabsTrigger value="notes">Notes · {notes.length}</TabsTrigger>
            <TabsTrigger value="ideas">Ideas · {ideas.length}</TabsTrigger>
            <TabsTrigger value="reminders">Reminders · {reminders.length}</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            {tasks.length > 0 ? (
              <Card className="p-2">
                {tasks.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Tasks added to this project will show up here."
              />
            )}
          </TabsContent>

          <TabsContent value="notes">
            {notes.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No notes yet"
                description="Capture context and references for this project."
              />
            )}
          </TabsContent>

          <TabsContent value="ideas">
            {ideas.length > 0 ? (
              <Card className="p-2">
                {ideas.map((i) => (
                  <IdeaRow key={i.id} idea={i} />
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={Lightbulb}
                title="No ideas yet"
                description="Park sparks and possibilities tied to this project."
              />
            )}
          </TabsContent>

          <TabsContent value="reminders">
            {reminders.length > 0 ? (
              <Card className="p-2">
                {reminders.map((r) => (
                  <ReminderRow key={r.id} reminder={r} />
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={Bell}
                title="No reminders yet"
                description="Schedule nudges so nothing slips through."
              />
            )}
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
