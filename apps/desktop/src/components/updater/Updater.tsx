import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * On launch (packaged app only), checks GitHub Releases for a newer CairnOS and,
 * if found, offers a one-click install-and-restart. No-ops in the browser/dev.
 */
export function Updater() {
  const ran = useRef(false);

  useEffect(() => {
    if (!isTauri || ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (!update) return;

        toast(`Update available - v${update.version}`, {
          description: 'A newer version of CairnOS is ready to install.',
          duration: Infinity,
          action: {
            label: 'Install & restart',
            onClick: () => {
              const id = toast.loading('Downloading update…');
              void (async () => {
                try {
                  await update.downloadAndInstall();
                  const { relaunch } = await import('@tauri-apps/plugin-process');
                  await relaunch();
                } catch {
                  toast.error('Update failed - please try again later.');
                } finally {
                  toast.dismiss(id);
                }
              })();
            },
          },
        });
      } catch {
        /* updater unavailable (e.g. a dev build) - ignore */
      }
    })();
  }, []);

  return null;
}
