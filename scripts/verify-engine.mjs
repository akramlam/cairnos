// Spawn an engine artifact (node engine.cjs OR the packaged .exe), wait for it
// to serve /api/health, hit a real query, then tear down. Usage:
//   node scripts/verify-engine.mjs <command> [args...]
import { spawn } from 'node:child_process';

const [, , cmd, ...args] = process.argv;
const PORT = 4321;
const child = spawn(cmd, args, {
  cwd: 'D:/Akram_OS/apps/desktop/src-tauri/sidecar',
  env: { ...process.env, CAIRN_PORT: String(PORT) },
  stdio: 'inherit',
});

let ok = false;
for (let i = 0; i < 80; i++) {
  try {
    const r = await fetch(`http://localhost:${PORT}/api/health`);
    if (r.ok) {
      console.log('HEALTH', JSON.stringify(await r.json()));
      ok = true;
      break;
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

if (ok) {
  try {
    const projects = await (await fetch(`http://localhost:${PORT}/api/projects`)).json();
    console.log('PROJECTS', Array.isArray(projects) ? projects.length : 'n/a');
    const cls = await (
      await fetch(`http://localhost:${PORT}/api/braindump/classify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'finish report tomorrow' }),
      })
    ).json();
    console.log('CLASSIFY', cls.items?.[0]?.title, cls.items?.[0]?.dueDateLabel);
  } catch (e) {
    console.log('query error', String(e));
  }
}

child.kill();
console.log(ok ? 'ENGINE_OK' : 'ENGINE_FAIL');
process.exit(ok ? 0 : 1);
