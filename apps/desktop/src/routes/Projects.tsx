import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, FolderKanban, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectStatusBadge, PriorityBadge } from '@/components/shared/badges';
import { Stagger, StaggerItem } from '@/components/shared/motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/lib/queries';
import { useUiStore } from '@/store/ui';
import { fromNow } from '@/lib/format';
import type { Project } from '@cairn/shared';

function ProjectCard({ project }: { project: Project }) {
  const summary = project.description ?? project.objective;
  const updated = fromNow(project.updatedAt);

  return (
    <Link to={`/projects/${project.id}`} className="block focus:outline-none">
      <Card className="card-hover flex h-full flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: project.color }}
          />
          <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
          <ProjectStatusBadge status={project.status} />
        </div>

        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
          {summary || 'No description yet.'}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={project.priority} />
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="muted">
              #{tag}
            </Badge>
          ))}
          {updated && (
            <span className="ml-auto pl-2 text-xs text-muted-foreground">{updated}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function Projects() {
  const [showArchived, setShowArchived] = useState(false);
  const setNewProjectOpen = useUiStore((s) => s.setNewProjectOpen);
  const projects = useProjects(showArchived);

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Group your work into focused, trackable projects."
      >
        <Button
          variant="subtle"
          onClick={() => setShowArchived((v) => !v)}
          className="gap-1.5"
        >
          <Archive className="size-4" />
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
        <Button
          variant="brand"
          onClick={() => setNewProjectOpen(true)}
          className="gap-1.5"
        >
          <Plus className="size-4" /> New project
        </Button>
      </PageHeader>

      {projects.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : projects.data && projects.data.length > 0 ? (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((project) => (
            <StaggerItem key={project.id}>
              <ProjectCard project={project} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to organize tasks, notes, and ideas in one focused place."
          action={
            <Button
              variant="brand"
              onClick={() => setNewProjectOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" /> New project
            </Button>
          }
        />
      )}
    </div>
  );
}
