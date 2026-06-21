import { Hono } from 'hono';
import {
  archiveProject,
  createProject,
  deleteProject,
  getProject,
  getProjectDetails,
  listProjects,
  updateProject,
} from '@cairn/core';
import { createProjectSchema, updateProjectSchema } from '@cairn/shared';
import { notFound, parseBody } from '../http.js';

export const projectsRoute = new Hono();

projectsRoute.get('/', (c) =>
  c.json(listProjects({ includeArchived: c.req.query('archived') === 'true' })),
);

projectsRoute.get('/:id', (c) => {
  const project = getProject(c.req.param('id'));
  return project ? c.json(project) : notFound(c);
});

projectsRoute.get('/:id/details', (c) => {
  const details = getProjectDetails(c.req.param('id'));
  return details ? c.json(details) : notFound(c);
});

projectsRoute.post('/', async (c) => {
  const p = await parseBody(c, createProjectSchema);
  if (!p.ok) return p.res;
  return c.json(createProject(p.data), 201);
});

projectsRoute.patch('/:id', async (c) => {
  const p = await parseBody(c, updateProjectSchema);
  if (!p.ok) return p.res;
  const updated = updateProject(c.req.param('id'), p.data);
  return updated ? c.json(updated) : notFound(c);
});

projectsRoute.post('/:id/archive', (c) => {
  const archived = archiveProject(c.req.param('id'));
  return archived ? c.json(archived) : notFound(c);
});

projectsRoute.delete('/:id', (c) => c.json({ deleted: deleteProject(c.req.param('id')) }));
