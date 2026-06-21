import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  FileText,
  FolderKanban,
  Home,
  Inbox,
  Lightbulb,
  ListChecks,
  Search,
  Settings,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CairnLogo } from '@/components/brand/Logo';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useReminders, useToday } from '@/lib/queries';
import { useUiStore } from '@/store/ui';
import { cn } from '@/lib/utils';

const NAV = [
  {
    section: 'Workspace',
    items: [
      { to: '/', label: 'Today', icon: Home, end: true },
      { to: '/inbox', label: 'Inbox', icon: Inbox },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/ideas', label: 'Ideas', icon: Lightbulb },
      { to: '/notes', label: 'Notes', icon: FileText },
      { to: '/reminders', label: 'Reminders', icon: Bell },
    ],
  },
  {
    section: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
] as const;

function EngineStatus() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 15_000,
    retry: false,
  });
  const online = !isError && data?.ok;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        {online && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn(
            'relative inline-flex size-2 rounded-full',
            online ? 'bg-emerald-400' : 'bg-rose-400',
          )}
        />
      </span>
      {online ? 'Engine online · Local' : 'Engine offline'}
    </div>
  );
}

export function Sidebar() {
  const toggleCommand = useUiStore((s) => s.toggleCommand);
  const today = useToday();
  const overdueReminders = useReminders('overdue');

  const counts: Record<string, number | undefined> = {
    '/inbox': today.data?.inboxCount || undefined,
    '/tasks': today.data?.stats.tasksToday || undefined,
    '/reminders': overdueReminders.data?.length || undefined,
  };

  return (
    <aside className="glass relative z-20 flex h-screen w-[264px] shrink-0 flex-col border-r border-border">
      <div className="px-5 pb-4 pt-6">
        <CairnLogo />
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={toggleCommand}
          className="group flex w-full items-center gap-2 rounded-lg border border-border bg-foreground/[0.03] px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Search className="size-4" />
          <span>Search…</span>
          <kbd className="ml-auto rounded border border-border bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
      </div>

      <nav data-tour="nav" className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const count = counts[item.to];
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : false}
                    className="block"
                  >
                    {({ isActive }) => (
                      <span
                        className={cn(
                          'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="nav-active"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                            className="absolute inset-0 rounded-lg border border-border bg-foreground/[0.06]"
                          />
                        )}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full brand-gradient" />
                        )}
                        <item.icon className="relative size-[18px] shrink-0" />
                        <span className="relative">{item.label}</span>
                        {count ? (
                          <Badge variant="muted" className="relative ml-auto px-1.5 py-0 text-[10px]">
                            {count}
                          </Badge>
                        ) : null}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex size-9 items-center justify-center rounded-full brand-gradient text-sm font-semibold text-white">
            {(today.data?.displayName ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{today.data?.displayName ?? 'Akram'}</div>
            <EngineStatus />
          </div>
        </div>
      </div>
    </aside>
  );
}
