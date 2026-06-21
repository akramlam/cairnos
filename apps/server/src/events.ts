/** Tiny in-process pub/sub used to push reminder events to SSE subscribers. */

export type AppEvent = { event: string; data: unknown };
type Listener = (event: AppEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function broadcast(event: string, data: unknown): void {
  for (const fn of listeners) {
    try {
      fn({ event, data });
    } catch {
      /* a slow/broken subscriber must not break the broadcast */
    }
  }
}
