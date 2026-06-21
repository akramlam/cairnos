import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Database, UserRound, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useSeedSampleData } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { CaptureScene, RemindScene, StonesScene } from './scenes';

const LAST = 4;
const STEP_COUNT = 5;

export function Onboarding() {
  const qc = useQueryClient();
  const seed = useSeedSampleData();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  // Persist quietly - the transition into the app is the feedback, no toast.
  const complete = useMutation({
    mutationFn: () =>
      api.settings.update({
        onboarded: true,
        ...(name.trim() ? { displayName: name.trim() } : {}),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const busy = seed.isPending || complete.isPending;

  const startFresh = () => complete.mutate();
  const loadSample = () => seed.mutate(undefined, { onSuccess: () => complete.mutate() });

  const steps: { title: string; body: ReactNode; visual: ReactNode }[] = [
    {
      visual: <StonesScene />,
      title: 'Welcome to CairnOS',
      body: (
        <>Turn chaos into action. CairnOS takes a messy brain dump and organizes it into projects,
          tasks, ideas &amp; reminders - all stored locally on your machine.</>
      ),
    },
    {
      visual: (
        <div className="flex h-44 items-center justify-center">
          <div className="glass flex size-16 items-center justify-center rounded-2xl">
            <UserRound className="size-8 text-primary" />
          </div>
        </div>
      ),
      title: 'What should we call you?',
      body: (
        <div className="mt-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setStep(2)}
            placeholder="Your name"
            className="mx-auto max-w-xs text-center"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            We&apos;ll use it to personalize your space. Optional - skip if you like.
          </p>
        </div>
      ),
    },
    {
      visual: <CaptureScene />,
      title: 'Dump it all in',
      body: (
        <>Type everything on your mind. CairnOS sorts it into tasks, projects, ideas, and reminders -
          you just review what it found.</>
      ),
    },
    {
      visual: <RemindScene />,
      title: 'Never drop the ball',
      body: (
        <>Reminders nudge you at the right moment, and your whole day stays one glance away on the
          dashboard.</>
      ),
    },
    {
      visual: (
        <div className="flex h-44 items-center justify-center">
          <StonesScene />
        </div>
      ),
      title: name.trim() ? `You're all set, ${name.trim()}!` : "You're all set!",
      body: (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3">
            <Button variant="brand" className="h-11 gap-2" disabled={busy} onClick={loadSample}>
              <Database className="size-4" /> Explore with sample data
            </Button>
            <Button variant="outline" className="h-11 gap-2" disabled={busy} onClick={startFresh}>
              <Wind className="size-4" /> Start fresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            CairnOS sorts your notes with built-in smart rules - no setup needed. Power users can
            connect a local Ollama model later in Settings.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  if (!current) return null;

  return (
    <div className="relative flex h-screen flex-col items-center justify-center px-6">
      {step < LAST && (
        <button
          onClick={() => setStep(LAST)}
          className="absolute right-6 top-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip intro
        </button>
      )}

      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {current.visual}
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{current.title}</h1>
            <div className="mt-2 text-sm text-muted-foreground">{current.body}</div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20',
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" className="gap-1.5" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < LAST && (
            <Button variant="brand" className="gap-1.5" onClick={() => setStep(step + 1)}>
              {step === 0 ? 'Get started' : 'Next'} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
