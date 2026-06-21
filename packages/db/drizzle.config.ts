import { defineConfig } from 'drizzle-kit';
import { resolveDbPath } from './src/paths';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: resolveDbPath(),
  },
  strict: true,
  verbose: true,
});
