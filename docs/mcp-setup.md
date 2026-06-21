# MCP Setup - connecting Claude Code to CairnOS

CairnOS ships a local [Model Context Protocol](https://modelcontextprotocol.io) server
(`apps/mcp-server`) that talks to the **same local SQLite database** as the desktop app.
That shared file is what lets Claude Code read and modify your projects, tasks, and
reminders - and have those changes show up live in the app.

```
Claude Code ──stdio──▶ @cairn/mcp-server ──▶ @cairn/core ──▶ cairn.db ◀── @cairn/server ◀── Desktop UI
```

## Run it standalone

```bash
pnpm mcp:dev
```

You should see `✓ CairnOS MCP server ready (stdio).` on **stderr**. The server speaks
JSON-RPC over stdio, so it will appear to "hang" - that's expected; it's waiting for a client.

## Connect to Claude Code (user scope - every session)

Register it once at **user scope** so it loads in every Claude Code session, from any folder:

```bash
claude mcp add cairn --scope user -- pnpm -C D:/Akram_OS --filter @cairn/mcp-server start
claude mcp list            # → cairn ✔ Connected
```

(If `pnpm` isn't on PATH in the spawning environment, use the Node form instead:
`-- node --import tsx D:\Akram_OS\apps\mcp-server\src\index.ts`.)

### Or project scope (to share the repo)

Prefer collaborators who clone the repo to get it automatically? Add it at **project** scope
instead, which writes a committed `.mcp.json` at the repo root:

```bash
claude mcp add cairn --scope project -- pnpm --filter @cairn/mcp-server start
```

> Don't define it at **both** user and project scope - Claude Code will warn about a scope
> conflict. Pick one.

Either way, ask Claude things like:

- "What are my overdue tasks?"
- "Create a task to review the launch deck tomorrow at 9am in the Website Redesign project."
- "Summarize the Website Redesign project."
- "Classify this brain dump: tomorrow finish the slides, idea for a referral program, remind me to call the bank."

## Connect to Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config) and add an absolute
path so it works outside the repo. On Windows:

```json
{
  "mcpServers": {
    "cairn": {
      "command": "pnpm",
      "args": ["-C", "D:\\Akram_OS", "--filter", "@cairn/mcp-server", "start"]
    }
  }
}
```

If `pnpm` is not on the GUI app's PATH, use Node + tsx directly:

```json
{
  "mcpServers": {
    "cairn": {
      "command": "node",
      "args": ["--import", "tsx", "D:\\Akram_OS\\apps\\mcp-server\\src\\index.ts"]
    }
  }
}
```

## Tools

| Tool | Kind | Description |
| --- | --- | --- |
| `create_task` | write | Create a task (optional project by name/id, priority, ISO due date). |
| `update_task` | write | Patch any field of a task by id. |
| `mark_task_done` | write | Complete a task by id. |
| `create_project` | write | Create a project. |
| `update_project` | write | Patch a project by id. |
| `create_reminder` | write | Create a reminder at an ISO time. |
| `get_today_tasks` | read | Open tasks due today. |
| `get_overdue_tasks` | read | Open tasks past their due date. |
| `get_active_projects` | read | All active projects. |
| `search_items` | read | Full-text search across all item types. |
| `classify_brain_dump` | read | Run the rule-based classifier (no save). |
| `summarize_project` | read | Concise text summary of a project. |
| `get_project_context` | read | Full structured context of a project. |

Every tool input is validated with strict Zod schemas before it touches the database.

## Pointing at a custom database

Both the engine and the MCP server resolve the DB with the same logic
(`packages/db/src/paths.ts`). Override it for both so they stay in sync:

- `CAIRN_DB_PATH` - full path to the `.db` file, or
- `CAIRN_DATA_DIR` - directory that will hold `cairn.db`.

```json
{
  "mcpServers": {
    "cairn": {
      "command": "pnpm",
      "args": ["-C", "D:\\Akram_OS", "--filter", "@cairn/mcp-server", "start"],
      "env": { "CAIRN_DB_PATH": "D:\\Akram_OS\\.akram\\cairn.db" }
    }
  }
}
```

## Troubleshooting

- **Nothing happens / no tools** - confirm `pnpm install` succeeded and `pnpm mcp:dev`
  prints the ready line. The server logs only to stderr; never to stdout.
- **Changes don't appear in the app** - the app must be running (`pnpm dev`) and pointed at
  the same DB. By default both use `%APPDATA%\Cairn\cairn.db` (Windows).
- **First run is empty** - run `pnpm db:migrate` (the server also self-migrates on boot) and
  optionally `pnpm db:seed`.
