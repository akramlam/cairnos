/**
 * CairnOS - local MCP server.
 *
 * Exposes the same @cairn/core services (over the same local SQLite database)
 * as the desktop app, so Claude Code can read and modify the user's projects,
 * tasks, ideas, notes, and reminders through tools.
 *
 * Transport: stdio. IMPORTANT: never write to stdout except MCP protocol
 * messages - all logging goes to stderr.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { runMigrations } from '@cairn/db';
import {
  completeTask,
  createProject,
  createReminder,
  createTask,
  findProjectByNameOrId,
  getOverdueTasks,
  getProjectDetails,
  getTodayTasks,
  listActiveProjects,
  previewBrainDump,
  searchItems,
  updateProject,
  updateTask,
} from '@cairn/core';

const zIso = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid ISO-8601 date string' });
const zPriority = z.enum(['low', 'medium', 'high']);

function ok(summary: string, data?: unknown) {
  const text = data !== undefined ? `${summary}\n\n${JSON.stringify(data, null, 2)}` : summary;
  return { content: [{ type: 'text' as const, text }] };
}
function fail(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

/** Resolve a project reference (id or name) to a project id, or null. */
function resolveProjectId(ref?: string): string | null {
  if (!ref) return null;
  return findProjectByNameOrId(ref)?.id ?? null;
}

// Apply migrations so a fresh database just works.
runMigrations();

const server = new McpServer({
  name: 'cairn',
  version: '0.1.0',
});

/* -------------------------------------------------------------- write tools */

server.registerTool(
  'create_task',
  {
    title: 'Create task',
    description:
      'Create a new task. Optionally attach it to a project (by name or id), set a priority and an ISO-8601 due date.',
    inputSchema: {
      title: z.string().min(1).max(200),
      description: z.string().max(4000).optional(),
      priority: zPriority.default('medium'),
      dueDate: zIso.optional(),
      project: z.string().optional().describe('Existing project name or id'),
      tags: z.array(z.string()).optional(),
    },
  },
  async ({ title, description, priority, dueDate, project, tags }) => {
    const task = createTask({
      title,
      description: description ?? null,
      status: 'todo',
      priority,
      dueDate: dueDate ?? null,
      projectId: resolveProjectId(project),
      tags,
    });
    return ok(`Created task "${task.title}".`, task);
  },
);

server.registerTool(
  'update_task',
  {
    title: 'Update task',
    description: 'Update fields of an existing task by id. Only provided fields are changed.',
    inputSchema: {
      id: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(4000).optional(),
      status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
      priority: zPriority.optional(),
      dueDate: zIso.nullable().optional(),
      project: z.string().optional(),
    },
  },
  async ({ id, project, ...rest }) => {
    const task = updateTask(id, {
      ...rest,
      ...(project !== undefined ? { projectId: resolveProjectId(project) } : {}),
    });
    return task ? ok(`Updated task "${task.title}".`, task) : fail(`No task with id ${id}.`);
  },
);

server.registerTool(
  'mark_task_done',
  {
    title: 'Mark task done',
    description: 'Mark a task as completed by id.',
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    const task = completeTask(id);
    return task ? ok(`Completed task "${task.title}".`, task) : fail(`No task with id ${id}.`);
  },
);

server.registerTool(
  'create_project',
  {
    title: 'Create project',
    description: 'Create a new project with an optional objective, description, priority, and color.',
    inputSchema: {
      name: z.string().min(1).max(120),
      description: z.string().max(2000).optional(),
      objective: z.string().max(2000).optional(),
      priority: zPriority.default('medium'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    },
  },
  async ({ name, description, objective, priority, color }) => {
    const project = createProject({
      name,
      description: description ?? null,
      objective: objective ?? null,
      priority,
      status: 'active',
      color,
    });
    return ok(`Created project "${project.name}".`, project);
  },
);

server.registerTool(
  'update_project',
  {
    title: 'Update project',
    description: 'Update fields of an existing project by id.',
    inputSchema: {
      id: z.string(),
      name: z.string().min(1).max(120).optional(),
      description: z.string().max(2000).optional(),
      objective: z.string().max(2000).optional(),
      status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
      priority: zPriority.optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    },
  },
  async ({ id, ...rest }) => {
    const project = updateProject(id, rest);
    return project ? ok(`Updated project "${project.name}".`, project) : fail(`No project with id ${id}.`);
  },
);

server.registerTool(
  'create_reminder',
  {
    title: 'Create reminder',
    description: 'Create a reminder that fires at the given ISO-8601 time.',
    inputSchema: {
      title: z.string().min(1).max(200),
      remindAt: zIso,
      description: z.string().max(2000).optional(),
      project: z.string().optional(),
    },
  },
  async ({ title, remindAt, description, project }) => {
    const reminder = createReminder({
      title,
      remindAt,
      description: description ?? null,
      status: 'scheduled',
      projectId: resolveProjectId(project),
    });
    return ok(`Created reminder "${reminder.title}".`, reminder);
  },
);

/* --------------------------------------------------------------- read tools */

server.registerTool(
  'get_today_tasks',
  { title: "Get today's tasks", description: 'List open tasks due today.', inputSchema: {} },
  async () => ok('Tasks due today:', getTodayTasks()),
);

server.registerTool(
  'get_overdue_tasks',
  { title: 'Get overdue tasks', description: 'List open tasks whose due date has passed.', inputSchema: {} },
  async () => ok('Overdue tasks:', getOverdueTasks()),
);

server.registerTool(
  'get_active_projects',
  { title: 'Get active projects', description: 'List all active projects.', inputSchema: {} },
  async () => ok('Active projects:', listActiveProjects()),
);

server.registerTool(
  'search_items',
  {
    title: 'Search items',
    description: 'Full-text search across tasks, projects, ideas, notes, and reminders.',
    inputSchema: {
      query: z.string().min(1).max(200),
      types: z.array(z.enum(['task', 'project', 'idea', 'note', 'reminder'])).optional(),
    },
  },
  async ({ query, types }) => ok(`Results for "${query}":`, searchItems({ query, types })),
);

server.registerTool(
  'classify_brain_dump',
  {
    title: 'Classify brain dump',
    description:
      'Run the CairnOS rule-based classifier on messy text and return structured, reviewable items (tasks, ideas, reminders, notes, projects) without saving them.',
    inputSchema: { text: z.string().min(1).max(10000) },
  },
  async ({ text }) => {
    const items = previewBrainDump(text);
    return ok(`Extracted ${items.length} item(s):`, items);
  },
);

server.registerTool(
  'summarize_project',
  {
    title: 'Summarize project',
    description: 'Return a concise text summary of a project (by id or name): progress, next action, and counts.',
    inputSchema: { project: z.string().describe('Project name or id') },
  },
  async ({ project }) => {
    const ref = findProjectByNameOrId(project);
    if (!ref) return fail(`No project matching "${project}".`);
    const d = getProjectDetails(ref.id)!;
    const done = d.tasks.filter((t) => t.status === 'done').length;
    const summary = [
      `Project: ${d.project.name} - ${d.project.status}, ${d.project.priority} priority`,
      `Objective: ${d.project.objective ?? '-'}`,
      `Progress: ${d.progress}% (${done}/${d.tasks.length} tasks done)`,
      `Next action: ${d.nextAction?.title ?? '-'}`,
      `Notes: ${d.notes.length} · Ideas: ${d.ideas.length} · Reminders: ${d.reminders.length}`,
    ].join('\n');
    return ok(summary);
  },
);

server.registerTool(
  'get_project_context',
  {
    title: 'Get project context',
    description:
      'Return the full structured context of a project (by id or name): the project plus all its tasks, notes, ideas, reminders, progress, and next action.',
    inputSchema: { project: z.string().describe('Project name or id') },
  },
  async ({ project }) => {
    const ref = findProjectByNameOrId(project);
    if (!ref) return fail(`No project matching "${project}".`);
    return ok(`Context for "${ref.name}":`, getProjectDetails(ref.id));
  },
);

/* --------------------------------------------------------------------- boot */

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('✓ CairnOS MCP server ready (stdio).');
