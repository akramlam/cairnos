import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closeDb, isDatabaseEmpty, runMigrations, seedSampleData } from '@cairn/db';

const TEST_DB = join(tmpdir(), `akram-sampledata-test-${process.pid}.db`);
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

describe('isDatabaseEmpty / seedSampleData', () => {
  it('reports a fresh database as empty', () => {
    expect(isDatabaseEmpty()).toBe(true);
  });

  it('seeds the documented sample counts', () => {
    expect(seedSampleData()).toEqual({
      projects: 3,
      tasks: 6,
      ideas: 2,
      notes: 1,
      reminders: 2,
    });
  });

  it('reports a non-empty database after seeding', () => {
    expect(isDatabaseEmpty()).toBe(false);
  });
});
