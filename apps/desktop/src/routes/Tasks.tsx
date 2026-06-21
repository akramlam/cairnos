import { useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskItem } from '@/components/tasks/TaskItem';
import { useProjects, useTasks } from '@/lib/queries';
import { useUiStore } from '@/store/ui';
import type { TaskView } from '@/lib/api';

const VIEWS: { key: TaskView; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];

export function Tasks() {
  const [view, setView] = useState<TaskView>('today');
  const tasks = useTasks(view);
  const projects = useProjects();
  const setNewTask = useUiStore((s) => s.setNewTaskOpen);

  const projectName = (id: string | null) =>
    id ? (projects.data?.find((p) => p.id === id)?.name ?? null) : null;

  return (
    <div>
      <PageHeader title="Tasks" description="Everything you need to do, organized by when.">
        <Button variant="brand" onClick={() => setNewTask(true)} className="gap-1.5">
          <Plus className="size-4" /> New task
        </Button>
      </PageHeader>

      <Tabs value={view} onValueChange={(v) => setView(v as TaskView)}>
        <TabsList>
          {VIEWS.map((v) => (
            <TabsTrigger key={v.key} value={v.key}>
              {v.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="mt-4 p-2">
        {tasks.isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : tasks.data && tasks.data.length > 0 ? (
          tasks.data.map((task) => (
            <TaskItem key={task.id} task={task} projectName={projectName(task.projectId)} />
          ))
        ) : (
          <EmptyState
            icon={ListChecks}
            title={`No ${view === 'all' ? '' : view} tasks`}
            description="Create a task or capture a brain dump to get started."
            action={
              <Button variant="brand" onClick={() => setNewTask(true)} className="gap-1.5">
                <Plus className="size-4" /> New task
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}
