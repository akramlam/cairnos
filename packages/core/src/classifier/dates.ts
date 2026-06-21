/**
 * Natural-language date detection for the rule-based classifier.
 *
 * Returns the resolved ISO datetime, a human label, and the exact substring
 * that triggered it (so the caller can strip it from the item title). Modular
 * by design - an AI backend can replace this with the same return shape.
 */

import { addDays, addHours, addWeeks, nextDay, setHours, setMinutes, setSeconds, startOfDay, type Day } from 'date-fns';

export interface DetectedDate {
  iso: string;
  label: string;
  matched: string;
}

const WEEKDAYS: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_HOUR = 9;

/** Apply a time-of-day phrase (e.g. "at 3pm", "tonight") onto a base date. */
function applyTime(date: Date, lower: string): Date {
  // Explicit clock time: "at 3pm", "at 15:30", "9am"
  const clock = lower.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (clock && (clock[3] || /\bat\b/.test(clock[0]))) {
    let hour = Number(clock[1]);
    const minute = clock[2] ? Number(clock[2]) : 0;
    const mer = clock[3];
    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
    if (hour <= 23) return setSeconds(setMinutes(setHours(date, hour), minute), 0);
  }
  if (/\b(tonight|evening|this evening)\b/.test(lower)) return setHours(startOfDay(date), 20);
  if (/\b(noon|midday)\b/.test(lower)) return setHours(startOfDay(date), 12);
  if (/\bmidnight\b/.test(lower)) return setHours(startOfDay(date), 0);
  if (/\bmorning\b/.test(lower)) return setHours(startOfDay(date), 9);
  if (/\bafternoon\b/.test(lower)) return setHours(startOfDay(date), 14);
  return setSeconds(setMinutes(setHours(date, DEFAULT_HOUR), 0), 0);
}

export function detectDate(text: string, base = new Date()): DetectedDate | null {
  const lower = text.toLowerCase();
  const make = (date: Date, label: string, matched: string): DetectedDate => ({
    iso: applyTime(date, lower).toISOString(),
    label,
    matched,
  });

  // "in 3 days" / "in 2 weeks" / "in 5 hours"
  const relative = lower.match(/\bin\s+(\d{1,3})\s+(hour|hours|day|days|week|weeks)\b/);
  if (relative) {
    const n = Number(relative[1]);
    const unit = relative[2] ?? '';
    const matched = relative[0]!;
    if (unit.startsWith('hour')) {
      return { iso: addHours(base, n).toISOString(), label: `in ${n}h`, matched };
    }
    const date = unit.startsWith('week') ? addWeeks(startOfDay(base), n) : addDays(startOfDay(base), n);
    return make(date, `in ${n} ${unit}`, matched);
  }

  // "next monday" .. "next sunday" / "next week"
  const nextWeekday = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (nextWeekday) {
    const name = nextWeekday[1]!;
    return make(nextDay(base, WEEKDAYS[name]!), `next ${name}`, nextWeekday[0]!);
  }
  if (/\bnext week\b/.test(lower)) {
    return make(addWeeks(startOfDay(base), 1), 'next week', 'next week');
  }

  // "this weekend"
  const weekend = lower.match(/\b(this\s+)?weekend\b/);
  if (weekend) {
    return make(nextDay(base, 6), 'this weekend', weekend[0]!);
  }

  // "tomorrow" / "tonight" / "today"
  if (/\btomorrow\b/.test(lower)) return make(addDays(startOfDay(base), 1), 'tomorrow', 'tomorrow');
  if (/\btonight\b/.test(lower)) return make(startOfDay(base), 'tonight', 'tonight');
  if (/\btoday\b/.test(lower)) return make(startOfDay(base), 'today', 'today');

  // bare weekday: "monday" -> next occurrence
  const bareWeekday = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (bareWeekday) {
    const name = bareWeekday[1]!;
    return make(nextDay(base, WEEKDAYS[name]!), name, bareWeekday[0]!);
  }

  return null;
}
