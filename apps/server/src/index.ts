import { serve } from '@hono/node-server';
import { runMigrations } from '@cairn/db';
import { createApp } from './app.js';
import { startScheduler } from './scheduler.js';

const PORT = Number(process.env.CAIRN_PORT ?? 4319);

// Self-heal the schema on boot so a fresh machine just works.
runMigrations();

const app = createApp();
const stopScheduler = startScheduler(30_000);

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`⚡ CairnOS engine listening on http://localhost:${info.port}`);
});

function shutdown() {
  stopScheduler();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
