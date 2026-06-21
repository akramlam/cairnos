import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, eventsUrl } from '@/lib/api';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Raise an OS notification. Inside the packaged app we use the Tauri
 * notification plugin - the Web Notifications API is blocked in Tauri's WebView,
 * whereas the plugin maps to a real Windows toast that also lands in the
 * notification center. In a plain browser we fall back to the Web API.
 */
async function nativeNotify(title: string, body: string): Promise<void> {
  if (isTauri) {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } = await import(
        '@tauri-apps/plugin-notification'
      );
      let granted = await isPermissionGranted();
      if (!granted) granted = (await requestPermission()) === 'granted';
      if (granted) {
        sendNotification({ title, body });
        return;
      }
    } catch {
      /* fall through to the web path */
    }
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

/**
 * Listens to the engine's SSE stream for reminders whose time has arrived and
 * raises a desktop notification + an actionable in-app toast (Snooze / Done).
 */
export function ReminderWatcher() {
  const qc = useQueryClient();

  useEffect(() => {
    // Ask for permission up-front.
    if (isTauri) {
      import('@tauri-apps/plugin-notification')
        .then(async ({ isPermissionGranted, requestPermission }) => {
          if (!(await isPermissionGranted())) await requestPermission();
        })
        .catch(() => undefined);
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    const source = new EventSource(eventsUrl);

    source.addEventListener('reminder.due', (event) => {
      try {
        const reminder = JSON.parse((event as MessageEvent).data) as { id: string; title: string };
        qc.invalidateQueries();
        void nativeNotify('CairnOS · Reminder', reminder.title);

        toast(reminder.title, {
          description: 'Reminder due now',
          duration: 12_000,
          action: {
            label: 'Done',
            onClick: () => api.reminders.done(reminder.id).then(() => qc.invalidateQueries()),
          },
          cancel: {
            label: 'Snooze 10m',
            onClick: () => api.reminders.snooze(reminder.id, 10).then(() => qc.invalidateQueries()),
          },
        });
      } catch {
        /* ignore malformed events */
      }
    });

    return () => source.close();
  }, [qc]);

  return null;
}
