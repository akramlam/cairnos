import { Hono } from 'hono';
import {
  createReminder,
  dismissReminder,
  getReminder,
  listReminders,
  markReminderDone,
  snoozeReminder,
  updateReminder,
  type ReminderView,
} from '@cairn/core';
import { createReminderSchema, updateReminderSchema } from '@cairn/shared';
import { notFound, parseBody } from '../http.js';

export const remindersRoute = new Hono();

const VIEWS: ReminderView[] = ['upcoming', 'overdue', 'all', 'active'];

remindersRoute.get('/', (c) => {
  const v = c.req.query('view');
  const view = VIEWS.includes(v as ReminderView) ? (v as ReminderView) : 'all';
  return c.json(listReminders({ view }));
});

remindersRoute.get('/:id', (c) => {
  const r = getReminder(c.req.param('id'));
  return r ? c.json(r) : notFound(c);
});

remindersRoute.post('/', async (c) => {
  const p = await parseBody(c, createReminderSchema);
  if (!p.ok) return p.res;
  return c.json(createReminder(p.data), 201);
});

remindersRoute.patch('/:id', async (c) => {
  const p = await parseBody(c, updateReminderSchema);
  if (!p.ok) return p.res;
  const updated = updateReminder(c.req.param('id'), p.data);
  return updated ? c.json(updated) : notFound(c);
});

remindersRoute.post('/:id/snooze', (c) => {
  const minutes = Number(c.req.query('minutes') ?? '10');
  const r = snoozeReminder(c.req.param('id'), Number.isFinite(minutes) ? minutes : 10);
  return r ? c.json(r) : notFound(c);
});

remindersRoute.post('/:id/done', (c) => {
  const r = markReminderDone(c.req.param('id'));
  return r ? c.json(r) : notFound(c);
});

remindersRoute.post('/:id/dismiss', (c) => {
  const r = dismissReminder(c.req.param('id'));
  return r ? c.json(r) : notFound(c);
});
