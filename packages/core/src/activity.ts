import { desc } from 'drizzle-orm';
import { getDb, schema } from '@cairn/db';
import type { ActivityLog } from '@cairn/shared';

export function listActivity(limit = 20): ActivityLog[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.activityLogs)
    .orderBy(desc(schema.activityLogs.createdAt))
    .all()
    .slice(0, limit);
  return rows as ActivityLog[];
}
