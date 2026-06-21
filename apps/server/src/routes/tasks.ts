import { Hono } from 'hono';
import {
  completeTask,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
  type TaskView,
} from '@cairn/core';
import { createTaskSchema, updateTaskSchema } from '@cairn/shared';
import { notFound, parseBody } from '../http.js';

export const tasksRoute = new Hono();

const TASK_VIEWS: TaskView[] = ['today', 'upcoming', 'overdue', 'completed', 'all'];

tasksRoute.get('/', (c) => {
  const viewParam = c.req.query('view');
  const view = TASK_VIEWS.includes(viewParam as TaskView) ? (viewParam as TaskView) : 'all';
  const projectId = c.req.query('projectId');
  return c.json(listTasks({ view, projectId: projectId ?? undefined }));
});

tasksRoute.get('/:id', (c) => {
  const task = getTask(c.req.param('id'));
  return task ? c.json(task) : notFound(c);
});

tasksRoute.post('/', async (c) => {
  const p = await parseBody(c, createTaskSchema);
  if (!p.ok) return p.res;
  return c.json(createTask(p.data), 201);
});

tasksRoute.patch('/:id', async (c) => {
  const p = await parseBody(c, updateTaskSchema);
  if (!p.ok) return p.res;
  const updated = updateTask(c.req.param('id'), p.data);
  return updated ? c.json(updated) : notFound(c);
});

tasksRoute.post('/:id/complete', (c) => {
  const done = completeTask(c.req.param('id'));
  return done ? c.json(done) : notFound(c);
});

tasksRoute.delete('/:id', (c) => c.json({ deleted: deleteTask(c.req.param('id')) }));
