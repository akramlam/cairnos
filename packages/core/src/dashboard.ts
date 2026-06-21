import { getDb, schema } from '@cairn/db';
import type { TodaySnapshot } from '@cairn/shared';
import { listActiveProjects } from './projects.js';
import { countCompletedToday, getOverdueTasks, getTodayTasks } from './tasks.js';
import { getUpcomingReminders } from './reminders.js';
import { getSettings } from './settings.js';

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getTodaySnapshot(): TodaySnapshot {
  const db = getDb();
  const settings = getSettings();

  const tasksDueToday = getTodayTasks();
  const overdueTasks = getOverdueTasks();
  const upcomingReminders = getUpcomingReminders(5);
  const activeProjects = listActiveProjects();

  const ideasCount = db.select().from(schema.ideas).all().filter((i) => i.status !== 'archived').length;
  const inboxCount = db.select().from(schema.brainDumps).all().length;

  const completedToday = countCompletedToday();
  const openTodayPlusDone = tasksDueToday.length + completedToday;
  const completionRate =
    openTodayPlusDone === 0 ? 0 : Math.round((completedToday / openTodayPlusDone) * 100);

  return {
    greeting: greetingForHour(new Date().getHours()),
    displayName: settings.displayName,
    tasksDueToday,
    overdueTasks,
    upcomingReminders,
    activeProjects,
    inboxCount,
    stats: {
      tasksToday: tasksDueToday.length,
      completedToday,
      activeProjects: activeProjects.length,
      ideas: ideasCount,
      completionRate,
    },
  };
}
