import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeDb, runMigrations, seedSampleData } from '@cairn/db';
import { getSettings, updateSettings } from './settings.js';

const TEST_DB = join(tmpdir(), `akram-settings-test-${process.pid}.db`);
const cleanup = () => {
  for (const s of ['', '-wal', '-shm']) rmSync(TEST_DB + s, { force: true });
};

beforeAll(() => {
  process.env.CAIRN_DB_PATH = TEST_DB;
  cleanup();
  runMigrations();
});
afterAll(() => {
  closeDb();
  cleanup();
});

// Ordered: each step builds on the previous DB state.
describe('settings.onboarded', () => {
  it('infers false on a fresh, empty database', () => {
    expect(getSettings().onboarded).toBe(false);
  });

  it('infers true once the database has content (existing-install upgrade path)', () => {
    seedSampleData();
    expect(getSettings().onboarded).toBe(true);
  });

  it('lets an explicit flag override the inference', () => {
    updateSettings({ onboarded: false });
    expect(getSettings().onboarded).toBe(false);
    updateSettings({ onboarded: true });
    expect(getSettings().onboarded).toBe(true);
  });
});
