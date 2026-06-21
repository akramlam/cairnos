import { motion } from 'framer-motion';
import { Bell, Lightbulb, ListTodo } from 'lucide-react';

/** Three stones settling into a cairn - the brand metaphor, gently floating. */
export function StonesScene() {
  const stones = [
    { w: 56, h: 22 },
    { w: 88, h: 26 },
    { w: 120, h: 30 },
  ];
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-2">
      {stones.map((s, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: s.w, height: s.h, background: 'var(--gradient-brand)' }}
          initial={{ y: -26, opacity: 0, scale: 0.9 }}
          animate={{ y: [0, -3, 0], opacity: 1, scale: 1 }}
          transition={{
            opacity: { delay: i * 0.15, duration: 0.4 },
            scale: { delay: i * 0.15, type: 'spring', stiffness: 220, damping: 16 },
            y: { delay: 0.7 + i * 0.2, duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
    </div>
  );
}

const CHIPS = [
  { icon: ListTodo, label: 'Task' },
  { icon: Lightbulb, label: 'Idea' },
  { icon: Bell, label: 'Reminder' },
];

/** A messy brain dump fanning out into sorted item chips. */
export function CaptureScene() {
  return (
    <div className="flex h-44 flex-col items-center justify-center gap-5">
      <motion.div
        className="max-w-[18rem] rounded-xl border border-border bg-foreground/[0.05] px-4 py-2.5 text-center text-xs text-muted-foreground"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        “tomorrow finish report, idea for an app, remind me to call the bank…”
      </motion.div>
      <div className="flex gap-2.5">
        {CHIPS.map((c, i) => (
          <motion.div
            key={c.label}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium shadow-sm"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.18, type: 'spring', stiffness: 240, damping: 16 }}
          >
            <c.icon className="size-3.5 text-primary" />
            {c.label}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** A ringing bell with an expanding pulse - reminders. */
export function RemindScene() {
  return (
    <div className="flex h-44 items-center justify-center">
      <div className="relative">
        <motion.div
          className="absolute inset-0 -z-10 rounded-3xl"
          style={{ background: 'var(--gradient-brand)' }}
          initial={{ scale: 0.8, opacity: 0.35 }}
          animate={{ scale: [0.8, 1.9], opacity: [0.35, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.div
          className="flex size-20 items-center justify-center rounded-3xl text-white shadow-lg"
          style={{ background: 'var(--gradient-brand)' }}
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.3, ease: 'easeInOut' }}
        >
          <Bell className="size-9" />
        </motion.div>
      </div>
    </div>
  );
}
