# Architecture

> **CairnOS** - a local-first AI productivity desktop app. _Turn chaos into action._

This document explains how CairnOS is put together: the local-first design and the reasoning behind it, how data flows through the system, what each package is responsible for, the lifecycle of a write request, the reminders subsystem, and where the architecture is headed next.

---

## Local-first design (and why)

CairnOS keeps all state in a single SQLite database (`cairn.db`) on the user's machine. There is no cloud backend in the data path - the app works fully offline, and the user owns their data outright.

The interesting constraint is _who is allowed to touch the file_:

- **A Tauri webview cannot open a native SQLite file directly.** The desktop UI runs in a webview and has no safe, first-class way to read/write a native `.sqlite` file.
- **The MCP server is a separate Node process** that must read and write the **same** database so that Claude Code and the UI stay in sync.

The solution is a small **local engine**: a Node process (`@cairn/server`, built on Hono) that **owns** the SQLite file via `better-sqlite3` + Drizzle. Both consumers talk to the data through it:

- The **UI** reads/writes over **HTTP** (plus **SSE** for live events).
- The **MCP server** reads/writes by importing **`@cairn/core`** directly (in-process Drizzle access).

SQLite runs in **WAL mode**, which permits concurrent processes (the engine and the MCP server) to read/write the same file safely.

There is exactly **one "brain"** - **`@cairn/core`** - that holds every service and the rule-based classifier. Both the engine routes and the MCP tools call into `@cairn/core`, so business logic lives in one place and never forks between the two entry points.

```
                          ┌──────────────────────────────┐
                          │        @cairn/core           │
                          │  (the single "brain":        │
                          │   services + classifier)     │
   HTTP / SSE  ───────────┤                              ├─────────  in-process
   from the UI            │                              │           import
                          └──────────────┬───────────────┘
                                         │
                                    Drizzle ORM
                                         │
                                    cairn.db (SQLite, WAL)
```

---

## Data-flow diagram

Two entry points, one database. The engine and the MCP server both funnel through `@cairn/core`.

```
  ┌─────────────────────────┐
  │   Desktop UI (Tauri)    │
  │  React 18 + Vite +      │
  │  Tailwind v4            │
  └───────────┬─────────────┘
              │  TanStack Query / fetch (HTTP)
              │  + SSE stream  (/api/events)
              ▼
  ┌─────────────────────────┐         ┌──────────────────────────┐
  │      @cairn/server      │         │      Claude Code         │
  │  Hono "local engine"    │         │   (MCP client over       │
  │  REST-ish API + SSE     │         │    stdio)                │
  │  :4319                  │         └───────────┬──────────────┘
  └───────────┬─────────────┘                     │  MCP (stdio, 13 tools)
              │                                    ▼
              │                        ┌──────────────────────────┐
              │                        │    @cairn/mcp-server     │
              │                        │   local MCP stdio server │
              │                        └───────────┬──────────────┘
              │                                    │
              ▼                                    ▼
        ┌──────────────────────────────────────────────┐
        │                @cairn/core                    │
        │       services + rule-based classifier        │
        └──────────────────────┬───────────────────────┘
                               │  Drizzle ORM
                               ▼
                     ┌───────────────────┐
                     │     cairn.db      │
                     │  SQLite (WAL)     │
                     └───────────────────┘
```

- **UI path:** Desktop UI → TanStack Query/`fetch` (+ SSE) → `@cairn/server` → `@cairn/core` → Drizzle → `cairn.db`.
- **MCP path:** Claude Code → `@cairn/mcp-server` → `@cairn/core` → Drizzle → `cairn.db`.

---

## Packages and responsibilities

The repo is a **pnpm workspaces monorepo**. Shared libraries live in `packages/*`; runnable processes live in `apps/*`.

| Package | Location | Type | Responsibility |
| --- | --- | --- | --- |
| `@cairn/shared` | `packages/shared` | Library | Enums, domain types, and **Zod** validators shared across every package. The single source of truth for shapes. |
| `@cairn/db` | `packages/db` | Library | **Drizzle** SQLite schema, migrations, the `better-sqlite3` client, the **DB path resolver**, and the seed script. Owns how the file is opened. |
| `@cairn/core` | `packages/core` | Library | The **brain**: all services + the rule-based classifier. Business logic that both entry points reuse. |
| `@cairn/server` | `apps/server` | App | The **Hono "local engine"** - owns the SQLite DB, exposes a REST-ish API + SSE, runs the reminders scheduler. Port **4319**. |
| `@cairn/desktop` | `apps/desktop` | App | **React 18 + Vite 6 + Tailwind v4** UI, with a **Tauri v2** native shell in `src-tauri`. Talks to the engine over HTTP/SSE. |
| `@cairn/mcp-server` | `apps/mcp-server` | App | Local **MCP stdio** server exposing **13 tools** to Claude Code; reads/writes via `@cairn/core`. |

---

## Request lifecycle: a write

When the user submits a form in the UI, the write travels a fixed, validated path:

```
UI form submit
   │  fetch (TanStack Query mutation)
   ▼
Zod-validated route  ──►  apps/server/src/routes
   │   (request body parsed/validated with @cairn/shared Zod schemas)
   ▼
@cairn/core service   (business logic)
   │
   ▼
Drizzle write          ──►  cairn.db
   │
   ▼
Activity log entry     (the change is recorded)
   │
   ▼
HTTP response
   │
   ▼
TanStack Query invalidates broadly  ──►  UI refetches & re-renders
```

1. The UI submits the form via a TanStack Query **mutation** (`fetch`).
2. The request hits a route in **`apps/server/src/routes`**, where the body is **validated with the Zod schemas from `@cairn/shared`**. Invalid input is rejected here.
3. The route calls a **`@cairn/core` service**, which performs the business logic.
4. The service writes through **Drizzle** to `cairn.db`.
5. The change is recorded in the **activity log**.
6. On success, TanStack Query **invalidates broadly**, so affected queries refetch and the UI updates.

---

## Reminders subsystem

The engine runs a lightweight scheduler that turns time into events; the UI turns those events into user-facing notifications.

```
  apps/server scheduler              SSE: /api/events            UI: ReminderWatcher
  ───────────────────────            ─────────────────           ───────────────────
  every 30s tick                                                 listens for events
        │                                                              │
        ├─ find 'scheduled' reminders that are due                     │
        ├─ mark them 'triggered'                                       │
        └─ broadcast  ─────────►  'reminder.due'  ─────────────────►  on 'reminder.due':
                                                                        • desktop Notification
                                                                        • actionable toast
                                                                          (snooze / done)
```

- **Scheduler (engine):** ticks **every 30s**. On each tick it finds `scheduled` reminders that are now due, marks them **`triggered`**, and **broadcasts a `reminder.due` event over SSE** on **`/api/events`**.
- **`ReminderWatcher` (UI):** subscribes to the SSE stream. On a `reminder.due` event it shows a **desktop `Notification`** plus an **actionable toast** with **snooze** and **done** actions.

---

## The classifier

Brain dumps are turned into structured items by a **modular** classifier hidden behind a single entry point:

```ts
classifyBrainDump(text, { knownProjects, base })
```

Today it is **rule-based** (and lives in `@cairn/core`). Because all callers go through this one function signature, the implementation can be **swapped for Ollama or Claude later** without touching the routes, the MCP tools, or the UI.

---

## Conventions

### Timestamps & IDs

- **Timestamps** are **ISO-8601 strings stored as `TEXT`** everywhere - in the DB, in the API, and in the UI. This means **zero serialization mapping**: the same string flows end to end.
- **IDs** are **UUID v4** stored as `TEXT`.

### DB path resolver

`packages/db/src/paths.ts` resolves where `cairn.db` lives, per platform:

| Platform | Default location |
| --- | --- |
| Windows | `%APPDATA%\Cairn\cairn.db` |
| macOS | `~/Library/Application Support/CairnOS` |
| Linux | `~/.local/share/CairnOS` |

**Overrides:**

| Env var | Effect |
| --- | --- |
| `CAIRN_DB_PATH` | Use this exact **file** path. |
| `CAIRN_DATA_DIR` | Use this **directory** for the DB. |

### Ports

| Process | Port | Override |
| --- | --- | --- |
| Engine (`@cairn/server`) | `4319` | `CAIRN_PORT` |
| Vite UI dev server | `5173` | - |

---

## Future

- **Tauri sidecar** to launch the engine automatically in a packaged build (no separately started Node process).
- **Native notifications** via `tauri-plugin-notification`.
- **Semantic search** across captured items.
- An **optional local LLM backend** behind the existing `classifyBrainDump` seam (e.g. Ollama or Claude).
