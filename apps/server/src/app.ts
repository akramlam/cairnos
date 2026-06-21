import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { subscribe, type AppEvent } from './events.js';
import { braindumpRoute } from './routes/braindump.js';
import { ideasRoute } from './routes/ideas.js';
import { notesRoute } from './routes/notes.js';
import { projectsRoute } from './routes/projects.js';
import { remindersRoute } from './routes/reminders.js';
import { systemRoute } from './routes/system.js';
import { tasksRoute } from './routes/tasks.js';

export function createApp(): Hono {
  const app = new Hono();

  // The engine only ever serves localhost clients (the desktop UI), so a
  // permissive CORS policy is appropriate and keeps dev frictionless.
  app.use('/api/*', cors());

  app.get('/', (c) => c.json({ name: 'CairnOS Engine', status: 'ok' }));

  app.route('/api/projects', projectsRoute);
  app.route('/api/tasks', tasksRoute);
  app.route('/api/ideas', ideasRoute);
  app.route('/api/notes', notesRoute);
  app.route('/api/reminders', remindersRoute);
  app.route('/api/braindump', braindumpRoute);
  app.route('/api', systemRoute);

  // Server-Sent Events: pushes reminder.due events to connected clients.
  app.get('/api/events', (c) =>
    streamSSE(c, async (stream) => {
      const queue: AppEvent[] = [];
      const unsubscribe = subscribe((e) => queue.push(e));
      stream.onAbort(() => unsubscribe());
      try {
        await stream.writeSSE({ event: 'ready', data: '1' });
        // Drain queued events, then keep-alive ping. Loop ends when the client
        // disconnects (onAbort) and the stream write throws.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          while (queue.length > 0) {
            const message = queue.shift()!;
            await stream.writeSSE({ event: message.event, data: JSON.stringify(message.data) });
          }
          await stream.writeSSE({ event: 'ping', data: '1' });
          await stream.sleep(3000);
        }
      } finally {
        unsubscribe();
      }
    }),
  );

  app.onError((err, c) => {
    console.error('[engine] unhandled error:', err);
    return c.json({ error: 'InternalError', message: String(err?.message ?? err) }, 500);
  });

  return app;
}
