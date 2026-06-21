/**
 * Cross-platform resolver for where Cairn keeps its local SQLite database.
 *
 * Both the desktop engine (apps/server) and the MCP server import this so they
 * always open the *same* file - that shared file is what makes Claude Code and
 * the app see the same projects/tasks/reminders.
 *
 * Override with CAIRN_DB_PATH (full file path) or CAIRN_DATA_DIR (directory).
 */

import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function platformBase(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
  } else if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support');
  }
  return process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
}

/** Pre-rename data location ("AkramOS"), migrated to "Cairn" on first run. */
function legacyDataDir(): string {
  return join(platformBase(), 'AkramOS');
}

export function resolveDataDir(): string {
  if (process.env.CAIRN_DATA_DIR) return process.env.CAIRN_DATA_DIR;
  return join(platformBase(), 'Cairn');
}

export function ensureDataDir(): string {
  const dir = resolveDataDir();
  if (!existsSync(dir)) {
    // One-time migration from the pre-rebrand "AkramOS" folder so existing
    // installs keep their data after the Cairn rename. Best-effort: if the move
    // fails (e.g. the old file is locked), fall back to a fresh folder.
    const legacy = legacyDataDir();
    if (!process.env.CAIRN_DATA_DIR && legacy !== dir && existsSync(legacy)) {
      try {
        renameSync(legacy, dir);
      } catch {
        mkdirSync(dir, { recursive: true });
      }
    } else {
      mkdirSync(dir, { recursive: true });
    }
  }
  return dir;
}

export function resolveDbPath(): string {
  if (process.env.CAIRN_DB_PATH) return process.env.CAIRN_DB_PATH;
  const dir = ensureDataDir();
  const dbPath = join(dir, 'cairn.db');
  // The pre-rebrand database file was akram.db; rename it (and its WAL sidecars)
  // in place so the migrated data is found under the new name.
  if (!existsSync(dbPath)) {
    const legacyDb = join(dir, 'akram.db');
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        if (existsSync(legacyDb + suffix)) renameSync(legacyDb + suffix, dbPath + suffix);
      } catch {
        /* best-effort; a fresh cairn.db will be created if this fails */
      }
    }
  }
  return dbPath;
}
