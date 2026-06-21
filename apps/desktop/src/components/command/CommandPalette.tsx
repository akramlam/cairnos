import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import {
  Bell,
  FileText,
  FolderKanban,
  FolderPlus,
  Home,
  Inbox,
  Lightbulb,
  ListChecks,
  Plus,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { ItemType, SearchHit } from '@cairn/shared';
import { api } from '@/lib/api';
import { useUiStore } from '@/store/ui';

const TYPE_ICON: Record<ItemType, LucideIcon> = {
  task: ListChecks,
  project: FolderKanban,
  idea: Lightbulb,
  note: FileText,
  reminder: Bell,
};

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/ideas', label: 'Ideas', icon: Lightbulb },
  { to: '/notes', label: 'Notes', icon: FileText },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function PaletteItem({
  icon: Icon,
  label,
  sub,
  value,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  sub?: string;
  value: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors aria-selected:bg-foreground/[0.07] aria-selected:text-foreground data-[selected=true]:bg-foreground/[0.07] data-[selected=true]:text-foreground"
    >
      <Icon className="size-4" />
      <span className="truncate text-foreground">{label}</span>
      {sub && <span className="ml-auto text-xs capitalize text-muted-foreground">{sub}</span>}
    </Command.Item>
  );
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const toggle = useUiStore((s) => s.toggleCommand);
  const setNewTask = useUiStore((s) => s.setNewTaskOpen);
  const setNewProject = useUiStore((s) => s.setNewProjectOpen);
  const setQuick = useUiStore((s) => s.setQuickCaptureOpen);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      api
        .search(query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(id);
  }, [query]);

  function run(action: () => void) {
    setOpen(false);
    setTimeout(action, 10);
  }

  const routeFor = (hit: SearchHit) =>
    hit.type === 'project'
      ? `/projects/${hit.id}`
      : hit.type === 'task'
        ? '/tasks'
        : hit.type === 'idea'
          ? '/ideas'
          : hit.type === 'note'
            ? '/notes'
            : '/reminders';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-overlay" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[16%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl glass-strong shadow-2xl data-[state=open]:animate-content"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-2.5 border-b border-border px-4">
              <Search className="size-4 text-muted-foreground" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search or run a command…"
                className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>
            <Command.List className="max-h-[340px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {!query && (
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
                >
                  <PaletteItem icon={Sparkles} label="Quick capture" value="quick capture brain dump" onSelect={() => run(() => setQuick(true))} />
                  <PaletteItem icon={Plus} label="New task" value="new task create" onSelect={() => run(() => setNewTask(true))} />
                  <PaletteItem icon={FolderPlus} label="New project" value="new project create" onSelect={() => run(() => setNewProject(true))} />
                </Command.Group>
              )}

              {!query && (
                <Command.Group
                  heading="Go to"
                  className="mt-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
                >
                  {NAV.map((n) => (
                    <PaletteItem
                      key={n.to}
                      icon={n.icon}
                      label={n.label}
                      value={`go ${n.label}`}
                      onSelect={() => run(() => navigate(n.to))}
                    />
                  ))}
                </Command.Group>
              )}

              {query && results.length > 0 && (
                <Command.Group
                  heading="Results"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
                >
                  {results.map((hit) => (
                    <PaletteItem
                      key={`${hit.type}-${hit.id}`}
                      icon={TYPE_ICON[hit.type]}
                      label={hit.title}
                      sub={hit.type}
                      value={`${hit.title} ${hit.id}`}
                      onSelect={() => run(() => navigate(routeFor(hit)))}
                    />
                  ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
