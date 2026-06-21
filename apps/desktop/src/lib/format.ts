import {
  format,
  formatDistanceToNowStrict,
  isPast,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from 'date-fns';

export function parse(date: string | null | undefined): Date | null {
  if (!date) return null;
  const d = parseISO(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Friendly relative label for a due/remind date, e.g. "Today · 09:00". */
export function formatDue(date: string | null | undefined): string | null {
  const d = parse(date);
  if (!d) return null;
  const time = format(d, 'HH:mm');
  if (isToday(d)) return `Today · ${time}`;
  if (isTomorrow(d)) return `Tomorrow · ${time}`;
  if (isYesterday(d)) return `Yesterday · ${time}`;
  return isThisYear(d) ? format(d, "MMM d · HH:mm") : format(d, 'MMM d, yyyy');
}

export function formatDay(date: string | null | undefined): string | null {
  const d = parse(date);
  if (!d) return null;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return isThisYear(d) ? format(d, 'MMM d') : format(d, 'MMM d, yyyy');
}

export function fromNow(date: string | null | undefined): string | null {
  const d = parse(date);
  if (!d) return null;
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function isOverdue(date: string | null | undefined): boolean {
  const d = parse(date);
  return d ? isPast(d) && !isToday(d) : false;
}

export function timeUntil(date: string | null | undefined): string | null {
  const d = parse(date);
  if (!d) return null;
  return isPast(d) ? 'now' : `in ${formatDistanceToNowStrict(d)}`;
}
