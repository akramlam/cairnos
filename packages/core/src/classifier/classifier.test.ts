import { describe, expect, it } from 'vitest';
import { classifyBrainDump, detectDate, splitSegments } from './index.js';
import { detectPriority, detectType } from './rules.js';

// Fixed reference time so date assertions are deterministic.
const BASE = new Date('2026-06-20T08:00:00');

describe('splitSegments', () => {
  it('splits on commas, newlines, and semicolons', () => {
    expect(splitSegments('call mom, buy milk; walk dog\nread book')).toEqual([
      'call mom',
      'buy milk',
      'walk dog',
      'read book',
    ]);
  });

  it('drops sub-2-character noise fragments', () => {
    expect(splitSegments('a, bb')).toEqual(['bb']);
  });

  it('does not split thousands separators', () => {
    expect(splitSegments('save 1,000 dollars')).toEqual(['save 1,000 dollars']);
  });

  it('splits a comma directly after a digit when followed by a space', () => {
    expect(splitSegments('fix bug 42, idea for X')).toEqual(['fix bug 42', 'idea for X']);
  });
});

describe('detectDate', () => {
  it('detects tomorrow', () => {
    const d = detectDate('finish report tomorrow', BASE);
    expect(d?.label).toBe('tomorrow');
    expect(d?.iso.startsWith('2026-06-21')).toBe(true);
  });

  it('detects "in 3 days"', () => {
    const d = detectDate('ship in 3 days', BASE);
    expect(d?.iso.startsWith('2026-06-23')).toBe(true);
  });

  it('returns null when no date is present', () => {
    expect(detectDate('just a plain task', BASE)).toBeNull();
  });
});

describe('detectType', () => {
  it('classifies reminders and strips the trigger phrase', () => {
    const r = detectType('remind me to email the team');
    expect(r.type).toBe('reminder');
    expect(r.cleanedTitle).toBe('Email the team');
  });

  it('classifies ideas with "idea for"', () => {
    const r = detectType('idea for referral rewards');
    expect(r.type).toBe('idea');
    expect(r.cleanedTitle).toBe('Referral rewards');
  });

  it('defaults to a task and recognizes an action verb', () => {
    const r = detectType('finish the slides');
    expect(r.type).toBe('task');
    expect(r.confidence).toBeGreaterThanOrEqual(0.8);
  });
});

describe('detectPriority', () => {
  it('flags urgency keywords as high', () => {
    expect(detectPriority('urgent: call the bank').priority).toBe('high');
  });
  it('flags low-priority keywords', () => {
    expect(detectPriority('someday learn the guitar').priority).toBe('low');
  });
});

describe('classifyBrainDump - the spec example', () => {
  const items = classifyBrainDump(
    'tomorrow finish the launch deck, fix the signup bug, idea for referral rewards, remind me to email the team, prepare the Monday demo',
    { base: BASE, knownProjects: ['Website Redesign', 'Career'] },
  );

  it('produces exactly five items', () => {
    expect(items).toHaveLength(5);
  });

  it('classifies each item to the expected type and title', () => {
    expect(items.map((i) => i.type)).toEqual(['task', 'task', 'idea', 'reminder', 'task']);
    expect(items.map((i) => i.title)).toEqual([
      'Finish the launch deck',
      'Fix the signup bug',
      'Referral rewards',
      'Email the team',
      'Prepare the Monday demo',
    ]);
  });

  it('attaches "tomorrow" to the first task', () => {
    expect(items[0]!.dueDateLabel).toBe('tomorrow');
    expect(items[0]!.dueDate).not.toBeNull();
  });

  it('gives every item a confidence between 0 and 1', () => {
    for (const item of items) {
      expect(item.confidence).toBeGreaterThan(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    }
  });
});
