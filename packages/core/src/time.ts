import { endOfDay, startOfDay } from 'date-fns';

/** ISO bounds of "today" in the host's local timezone (compared lexically). */
export const startOfTodayIso = (): string => startOfDay(new Date()).toISOString();
export const endOfTodayIso = (): string => endOfDay(new Date()).toISOString();
export const nowIso = (): string => new Date().toISOString();
