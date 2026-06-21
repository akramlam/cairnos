import { getDueReminders, markReminderTriggered } from '@cairn/core';
import { broadcast } from './events.js';

/**
 * The background reminder checker. Every tick it finds reminders whose time has
 * arrived, marks them triggered, and broadcasts them so connected clients can
 * raise a desktop notification.
 */
export function startScheduler(intervalMs = 30_000): () => void {
  const tick = () => {
    try {
      for (const reminder of getDueReminders()) {
        const triggered = markReminderTriggered(reminder.id);
        if (triggered) broadcast('reminder.due', triggered);
      }
    } catch (error) {
      console.error('[scheduler] tick failed:', error);
    }
  };

  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}
