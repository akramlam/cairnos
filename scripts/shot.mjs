import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright-core';

const root = 'D:/Akram_OS';
const dist = join(root, 'apps/desktop/dist');
const shotsDir = join(root, 'docs/screenshots');
const ENGINE_PORT = 4319;
const WEB_PORT = 5180;

await mkdir(shotsDir, { recursive: true });

// 1) Engine (real seeded DB)
const engine = spawn(process.execPath, ['--import', 'tsx', join(root, 'apps/server/src/index.ts')], {
  cwd: root,
  env: { ...process.env, CAIRN_PORT: String(ENGINE_PORT) },
  stdio: 'inherit',
});

async function waitHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://localhost:${ENGINE_PORT}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('engine not ready');
}

// 2) Static server for the built SPA
const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = join(dist, p);
    try {
      const s = await stat(file);
      if (s.isDirectory()) file = join(dist, 'index.html');
    } catch {
      file = join(dist, 'index.html');
    }
    const data = await readFile(file);
    res.setHeader('content-type', MIME[extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch {
    res.statusCode = 500;
    res.end('err');
  }
});
server.listen(WEB_PORT);

await waitHealth();

// 3) Headless Edge
let browser;
for (const channel of ['msedge', 'chrome']) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    break;
  } catch {}
}
if (!browser) throw new Error('No system Chromium (Edge/Chrome) found');

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const shots = [
  ['/#/landing', 'landing.png', 1400],
  ['/', 'dashboard.png', 1600],
  ['/#/inbox', 'inbox.png', 900],
  ['/#/projects', 'projects.png', 700],
  ['/#/tasks', 'tasks.png', 700],
  ['/#/reminders', 'reminders.png', 700],
  ['/#/settings', 'settings.png', 700],
];

for (const [path, name, wait] of shots) {
  await page.goto(`http://localhost:${WEB_PORT}${path}`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: join(shotsDir, name) });
  console.log('shot:', name);
}

// Light-mode capture: flip the saved theme, reload fresh, then restore.
await fetch(`http://localhost:${ENGINE_PORT}/api/settings`, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ theme: 'light' }),
});
await page.goto(`http://localhost:${WEB_PORT}/`, { waitUntil: 'load', timeout: 15000 });
await page.waitForTimeout(1400);
await page.screenshot({ path: join(shotsDir, 'dashboard-light.png') });
console.log('shot: dashboard-light.png');
await fetch(`http://localhost:${ENGINE_PORT}/api/settings`, {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ theme: 'dark' }),
});

console.log('CONSOLE_ERRORS', errors.length);
for (const e of errors.slice(0, 12)) console.log('  -', e);

await browser.close();
server.close();
engine.kill();
process.exit(0);
