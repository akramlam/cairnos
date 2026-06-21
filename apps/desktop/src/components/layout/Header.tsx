import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Command as CommandIcon, HelpCircle, Moon, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme } from '@/components/theme/ThemeManager';
import { api } from '@/lib/api';
import { useSettings } from '@/lib/queries';
import { useUiStore } from '@/store/ui';

const TITLES: Record<string, string> = {
  '/': 'Today',
  '/inbox': 'Inbox',
  '/tasks': 'Tasks',
  '/projects': 'Projects',
  '/ideas': 'Ideas',
  '/notes': 'Notes',
  '/reminders': 'Reminders',
  '/settings': 'Settings',
};

export function Header() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? (pathname.startsWith('/projects') ? 'Project' : 'CairnOS');
  const setQuickCaptureOpen = useUiStore((s) => s.setQuickCaptureOpen);
  const toggleCommand = useUiStore((s) => s.toggleCommand);
  const setTourOpen = useUiStore((s) => s.setTourOpen);

  const { data } = useSettings();
  const qc = useQueryClient();
  const isLight = data?.theme === 'light';
  // Silent so flipping the theme doesn't spam a "Settings saved" toast.
  const setTheme = useMutation({
    mutationFn: (theme: 'dark' | 'light') => api.settings.update({ theme }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const toggleTheme = () => {
    const next = isLight ? 'dark' : 'light';
    applyTheme(next); // instant - don't wait for the refetch
    setTheme.mutate(next);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/40 px-6 backdrop-blur-xl">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTourOpen(true)}
          aria-label="Take the tour"
          title="Take the tour"
        >
          <HelpCircle className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-tour="theme"
          aria-label="Toggle light or dark theme"
          title="Toggle light / dark"
        >
          {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleCommand}
          data-tour="command"
          className="gap-2"
        >
          <CommandIcon className="size-3.5" />
          <span className="hidden sm:inline">Command</span>
          <kbd className="rounded border border-border bg-foreground/5 px-1 font-mono text-[10px]">
            Ctrl K
          </kbd>
        </Button>
        <Button
          variant="brand"
          size="sm"
          onClick={() => setQuickCaptureOpen(true)}
          data-tour="capture"
          className="gap-1.5"
        >
          <Sparkles className="size-4" />
          Quick capture
        </Button>
      </div>
    </header>
  );
}
