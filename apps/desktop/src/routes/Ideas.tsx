import { useState, type KeyboardEvent } from 'react';
import {
  FolderKanban,
  Lightbulb,
  ListChecks,
  MoreHorizontal,
  Plus,
  StickyNote,
  Trash2,
} from 'lucide-react';
import type { Idea } from '@cairn/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { IdeaStatusBadge } from '@/components/shared/badges';
import { Stagger, StaggerItem } from '@/components/shared/motion';
import { useCreateIdea, useConvertIdea, useDeleteIdea, useIdeas } from '@/lib/queries';
import { fromNow } from '@/lib/format';

type Filter = 'all' | 'captured' | 'reviewing' | 'converted';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'captured', label: 'Captured' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'converted', label: 'Converted' },
];

function IdeaCard({ idea }: { idea: Idea }) {
  const convert = useConvertIdea();
  const remove = useDeleteIdea();

  return (
    <Card className="card-hover group flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 font-medium leading-snug">{idea.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground focus:outline-none group-hover:opacity-100">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => convert.mutate({ id: idea.id, target: 'task' })}>
              <ListChecks className="size-4" /> Convert to task
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => convert.mutate({ id: idea.id, target: 'project' })}>
              <FolderKanban className="size-4" /> Convert to project
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => convert.mutate({ id: idea.id, target: 'note' })}>
              <StickyNote className="size-4" /> Convert to note
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => remove.mutate(idea.id)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {idea.description && (
        <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{idea.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-muted-foreground">
        <IdeaStatusBadge status={idea.status} />
        {idea.tags.slice(0, 3).map((t) => (
          <span key={t} className="text-muted-foreground/70">
            #{t}
          </span>
        ))}
        <span className="ml-auto whitespace-nowrap">{fromNow(idea.createdAt)}</span>
      </div>
    </Card>
  );
}

export function Ideas() {
  const [filter, setFilter] = useState<Filter>('all');
  const [title, setTitle] = useState('');
  const ideas = useIdeas(filter === 'all' ? undefined : filter);
  const createIdea = useCreateIdea();

  const capture = () => {
    const value = title.trim();
    if (!value) return;
    createIdea.mutate(
      { title: value },
      {
        // New ideas are "captured" - make sure the active filter shows it.
        onSuccess: () => {
          if (filter !== 'all' && filter !== 'captured') setFilter('all');
        },
      },
    );
    setTitle('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      capture();
    }
  };

  return (
    <div>
      <PageHeader title="Ideas" description="Capture sparks before they fade." />

      <Card className="mb-5 flex items-center gap-2 p-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg brand-gradient">
          <Lightbulb className="size-4 text-white" />
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Capture a new idea…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button
          variant="brand"
          onClick={capture}
          disabled={!title.trim() || createIdea.isPending}
          className="shrink-0 gap-1.5"
        >
          <Plus className="size-4" /> Capture
        </Button>
      </Card>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.key} value={f.key}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {ideas.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : ideas.data && ideas.data.length > 0 ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.data.map((idea) => (
              <StaggerItem key={idea.id}>
                <IdeaCard idea={idea} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            icon={Lightbulb}
            title={filter === 'all' ? 'No ideas yet' : `No ${filter} ideas`}
            description="Type above to capture your first spark before it fades."
          />
        )}
      </div>
    </div>
  );
}
