import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import { CommandPalette } from '@/components/command/CommandPalette';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { ReminderWatcher } from '@/components/reminders/ReminderWatcher';
import { ThemeManager } from '@/components/theme/ThemeManager';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';
import { ProductTour } from '@/components/tour/ProductTour';
import { Updater } from '@/components/updater/Updater';

// Code-split every screen into its own chunk.
const named = <K extends string>(p: Promise<Record<K, React.ComponentType>>, key: K) =>
  p.then((m) => ({ default: m[key] }));

const Dashboard = lazy(() => named(import('@/routes/Dashboard'), 'Dashboard'));
const Inbox = lazy(() => named(import('@/routes/Inbox'), 'Inbox'));
const Tasks = lazy(() => named(import('@/routes/Tasks'), 'Tasks'));
const Projects = lazy(() => named(import('@/routes/Projects'), 'Projects'));
const ProjectDetail = lazy(() => named(import('@/routes/ProjectDetail'), 'ProjectDetail'));
const Ideas = lazy(() => named(import('@/routes/Ideas'), 'Ideas'));
const Notes = lazy(() => named(import('@/routes/Notes'), 'Notes'));
const Reminders = lazy(() => named(import('@/routes/Reminders'), 'Reminders'));
const Settings = lazy(() => named(import('@/routes/Settings'), 'Settings'));
const Landing = lazy(() => named(import('@/routes/Landing'), 'Landing'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function RouteFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <HashRouter>
          <OnboardingGate>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/landing" element={<Landing />} />
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inbox" element={<Inbox />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="ideas" element={<Ideas />} />
                  <Route path="notes" element={<Notes />} />
                  <Route path="reminders" element={<Reminders />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </OnboardingGate>

          {/* Global, always-mounted overlays */}
          <ThemeManager />
          <CommandPalette />
          <QuickCapture />
          <TaskDialog />
          <ProjectDialog />
          <ReminderWatcher />
          <ProductTour />
          <Updater />
        </HashRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
