import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/lib/queries';
import { useUiStore } from '@/store/ui';

const SEEN_KEY = 'cairn-tour-seen';
const PAD = 8;
const CARD_W = 320;

type Placement = 'bottom' | 'top' | 'right';
interface Step {
  sel: string;
  title: string;
  body: string;
  placement: Placement;
}

const STEPS: Step[] = [
  {
    sel: '[data-tour="capture"]',
    title: 'Capture anything',
    body: "Click here to dump whatever's on your mind. CairnOS sorts it into tasks, ideas, notes and reminders for you to review - nothing gets saved until you approve it.",
    placement: 'bottom',
  },
  {
    sel: '[data-tour="command"]',
    title: 'Jump anywhere fast',
    body: 'Press Ctrl + K from anywhere to search and navigate the whole app in a single keystroke.',
    placement: 'bottom',
  },
  {
    sel: '[data-tour="nav"]',
    title: 'Your workspace',
    body: 'Today, Tasks, Projects, Ideas, Notes and Reminders all live here. Start with Today for your day at a glance.',
    placement: 'right',
  },
  {
    sel: '[data-tour="theme"]',
    title: 'Make it yours',
    body: 'Flip light / dark right here - and pick an accent color under Settings → Appearance.',
    placement: 'bottom',
  },
];

function clampLeft(left: number): number {
  const max = window.innerWidth - CARD_W - 16;
  return Math.min(Math.max(16, left), Math.max(16, max));
}

export function ProductTour() {
  const location = useLocation();
  const { data } = useSettings();
  const open = useUiStore((s) => s.tourOpen);
  const setOpen = useUiStore((s) => s.setTourOpen);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const armed = useRef(false);

  // Auto-start once for onboarded users who haven't seen the tour.
  useEffect(() => {
    if (armed.current || !data?.onboarded || location.pathname === '/landing') return;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (seen) return;
    armed.current = true;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [data?.onboarded, location.pathname, setOpen]);

  const finish = useCallback(() => {
    setOpen(false);
    setStep(0);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
  }, [setOpen]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Track the current target's position.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const cur = STEPS[step];
      if (!cur) return;
      const el = document.querySelector(cur.sel);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const id = window.setInterval(update, 400);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.clearInterval(id);
    };
  }, [open, step]);

  if (!open) return null;
  const cur = STEPS[step];
  if (!cur) return null;
  const last = step === STEPS.length - 1;

  const box = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  let cardStyle: CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  if (box) {
    if (cur.placement === 'right') {
      cardStyle = { top: Math.max(16, box.top), left: box.left + box.width + 14 };
    } else if (cur.placement === 'top') {
      cardStyle = { top: box.top - 14, left: clampLeft(box.left + box.width / 2 - CARD_W / 2), transform: 'translateY(-100%)' };
    } else {
      cardStyle = { top: box.top + box.height + 14, left: clampLeft(box.left + box.width / 2 - CARD_W / 2) };
    }
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {box ? (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={false}
          animate={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          style={{ boxShadow: '0 0 0 9999px rgba(8,9,13,0.62)' }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'rgba(8,9,13,0.62)' }} />
      )}

      {/* Block interaction with the app behind the tour. */}
      <div className="absolute inset-0" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ position: 'absolute', width: CARD_W, ...cardStyle }}
          className="glass-strong rounded-xl border border-border p-4 shadow-2xl"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Tip {step + 1} / {STEPS.length}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold">{cur.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{cur.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={finish}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="size-3.5" /> Back
                </Button>
              )}
              <Button
                variant="brand"
                size="sm"
                className="gap-1"
                onClick={() => (last ? finish() : setStep(step + 1))}
              >
                {last ? 'Done' : 'Next'}
                {!last && <ArrowRight className="size-3.5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
