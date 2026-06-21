// Build a self-contained engine sidecar that the Tauri app ships + spawns.
// Produces apps/desktop/src-tauri/sidecar/ with:
//   engine.cjs              - esbuild bundle of @cairn/server
//   node.exe                - Node runtime matching this machine's version
//   node_modules/better-sqlite3 - native addon (ABI matches node.exe)
//   migrations/             - Drizzle migration SQL
import esbuild from 'esbuild';
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root = the parent of scripts/. Derived (not hardcoded) so this works in
// CI checkouts and on any machine, not just the original local path.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SIDE = join(ROOT, 'apps/desktop/src-tauri/sidecar');
const CACHE = join(ROOT, 'scripts/.cache');

// Internal packages import each other with ".js" specifiers that point at ".ts".
const tsResolve = {
  name: 'ts-resolve',
  setup(build) {
    build.onResolve({ filter: /\.js$/ }, (args) => {
      if (!args.importer || !args.path.startsWith('.')) return;
      const tsPath = resolve(dirname(args.importer), args.path.replace(/\.js$/, '.ts'));
      return existsSync(tsPath) ? { path: tsPath } : undefined;
    });
  },
};

rmSync(SIDE, { recursive: true, force: true });
mkdirSync(SIDE, { recursive: true });

// 1) Bundle the engine to CJS (better-sqlite3 + optional transformers external).
await esbuild.build({
  entryPoints: [join(ROOT, 'apps/server/src/index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  outfile: join(SIDE, 'engine.cjs'),
  external: ['better-sqlite3', '@huggingface/transformers'],
  plugins: [tsResolve],
  logLevel: 'error',
});
console.log('✓ engine.cjs bundled');

// 2) Install a flat node_modules for better-sqlite3 (+ bindings, file-uri-to-path)
// at the exact version pnpm resolved, with a prebuilt .node for this Node ABI.
const pnpmDir = join(ROOT, 'node_modules/.pnpm');
const bsqEntry = readdirSync(pnpmDir).find((d) => d.startsWith('better-sqlite3@'));
if (!bsqEntry) throw new Error('better-sqlite3 not found');
const bsqVersion = bsqEntry.slice('better-sqlite3@'.length).split('_')[0];
writeFileSync(
  join(SIDE, 'package.json'),
  JSON.stringify(
    { name: 'cairn-engine', private: true, dependencies: { 'better-sqlite3': bsqVersion } },
    null,
    2,
  ),
);
execSync('npm install --omit=dev --no-audit --no-fund --loglevel=error', {
  cwd: SIDE,
  stdio: 'inherit',
});
console.log('✓ better-sqlite3 installed (flat)');

// 3) Ship the Drizzle migrations.
cpSync(join(ROOT, 'packages/db/migrations'), join(SIDE, 'migrations'), { recursive: true });
console.log('✓ migrations staged');

// 4) Stage node.exe matching THIS machine's version (so the native ABI lines up).
const version = process.version; // e.g. v24.14.1
const cached = join(CACHE, `node-${version}-win-x64.exe`);
mkdirSync(CACHE, { recursive: true });
if (!existsSync(cached)) {
  const url = `https://nodejs.org/dist/${version}/win-x64/node.exe`;
  console.log(`  downloading ${url} …`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download node.exe: HTTP ${res.status}`);
  writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
}
cpSync(cached, join(SIDE, 'node.exe'));
console.log(`✓ node.exe staged (${version})`);

console.log('\nSidecar ready →', SIDE);
