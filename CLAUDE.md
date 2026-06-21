# CairnOS - working notes for Claude

**CairnOS** is a local-first AI productivity desktop app ("Turn chaos into action."). It is a pnpm-workspace monorepo where a small Node "local engine" (Hono) owns a SQLite database and exposes a REST-ish HTTP API plus SSE. A React + Vite + Tauri desktop UI talks to that engine over HTTP, and a separate local MCP stdio server shares the **same** database through the shared core package. Everything runs on the user's machine - no cloud dependency.

## Architecture

- **The local engine owns the SQLite file.** A Tauri webview can't open a native SQLite file directly, so the Node engine (`apps/server`) holds the connection via `better-sqlite3` + Drizzle. The UI reads/writes only through the engine's HTTP API.
- **`@cairn/core` is the shared brain.** Services and the rule-based classifier live in core and are consumed by *both* the engine (HTTP handlers) and the MCP server (tool implementations) - one set of business logic, two front doors.
- **The UI is a thin client.** The React app is mostly a TanStack Query client over the engine's API; server state lives in the engine, UI-only state lives in Zustand.
- **Timestamps and IDs are plain TEXT.** Timestamps are ISO-8601 strings and IDs are UUID v4 strings, stored as TEXT in the DB, sent as-is over the API, and rendered as-is in the UI - zero serialization mapping anywhere.
- **WAL mode enables multi-process access.** The engine and the MCP server are separate OS processes hitting the same `cairn.db`; SQLite WAL mode lets them read/write concurrently.

```
                  ┌──────────────┐        HTTP / SSE        ┌─────────────────┐
                  │  Desktop UI  │ ───────────────────────▶ │  Local engine   │
                  │ (TanStack Q) │   localhost:4319/api     │ (Hono, apps/    │
                  └──────────────┘                          │  server)        │
                                                            │  owns cairn.db  │
  ┌──────────────┐   @cairn/core (services + classifier)    │  better-sqlite3 │
  │  MCP server  │ ───────────────────────────────────────▶ │  + Drizzle (WAL)│
  │ (stdio, 13   │            same SQLite file               └─────────────────┘
  │  tools)      │
  └──────────────┘
```

## Where things live

| Package / App | Path | Responsibility |
| --- | --- | --- |
| `@cairn/shared` | `packages/shared` | Enums, domain types, Zod validators, the const tuples in `src/constants.ts` (single source of truth for status/priority). |
| `@cairn/db` | `packages/db` | Drizzle SQLite schema, migrations, `better-sqlite3` client, DB path resolver (`src/paths.ts`), seed. |
| `@cairn/core` | `packages/core` | Services + the rule-based classifier - the shared business logic used by the engine and MCP. |
| `@cairn/server` | `apps/server` | Hono local engine: owns the DB, exposes the REST-ish API + SSE on port `4319`. |
| `@cairn/desktop` | `apps/desktop` | React 18 + Vite 6 + Tailwind v4 UI; Tauri v2 native shell in `src-tauri`. |
| `@cairn/mcp-server` | `apps/mcp-server` | Local MCP stdio server exposing 13 tools over the same DB (via `@cairn/core`). |

**Frontend stack:** React 18, Vite 6, Tailwind CSS v4, shadcn-style components, TanStack Query (server state), Zustand (UI state), Zod, date-fns, Framer Motion, lucide-react, cmdk (command palette ⌘/Ctrl+K), sonner (toasts), HashRouter.

## Conventions

- **TypeScript strict, `noUncheckedIndexedAccess` on.** Array indexing and regex `.match()` results are `T | undefined` - guard them (`const x = arr[0]; if (!x) ...`) instead of asserting.
- **Validate external input at the edge with Zod from `@cairn/shared`.** Every HTTP body, query param, and MCP tool argument is parsed with a shared Zod validator before it reaches a service.
- **Internal packages are consumed as TS source - no build step.** When importing across relative paths, use **`.js` specifiers** (e.g. `import { x } from "./foo.js"`) so the TS/ESM resolver and bundler agree.
- **Timestamps are ISO strings.** Generate with `new Date().toISOString()`; never store epoch numbers or `Date` objects in the DB or API.
- **Add new status/priority values to the const tuples in `packages/shared/src/constants.ts`.** That file is the single source of truth - types, Zod enums, and the DB derive from it.

### CSS rule (important)

Never write universal-selector resets that touch `margin` / `padding` / `border` (e.g. `*, *::before, *::after { margin: 0; padding: 0 }`). Tailwind v4 utilities live inside `@layer`, and **unlayered** styles beat layered ones regardless of specificity - a single `* { padding: 0 }` silently kills every `px-*`, `py-*`, `gap-*`, `mx-auto`, etc. site-wide. Tailwind v4 preflight already handles the necessary resets; leave it alone. For borders, use the `border border-border` utilities rather than a global border reset.

## How to run

```bash
pnpm install        # better-sqlite3 native build is pre-approved (see Gotchas)
pnpm db:migrate     # apply Drizzle migrations
pnpm db:seed        # optional: seed sample data
pnpm dev            # engine + web together
```

- App: <http://localhost:5173>
- Landing page: <http://localhost:5173/#/landing> (HashRouter)
- Engine API base: <http://localhost:4319/api>

Other commands: `pnpm server:dev`, `pnpm web:dev`, `pnpm mcp:dev`, `pnpm desktop:dev` / `pnpm desktop:build` (need Rust toolchain), `pnpm db:generate`.

**DB path** (resolver in `packages/db/src/paths.ts`): defaults to `%APPDATA%\Cairn\cairn.db` on Windows, `~/Library/Application Support/CairnOS` on macOS, `~/.local/share/CairnOS` on Linux. Override with `CAIRN_DB_PATH` (a file) or `CAIRN_DATA_DIR` (a directory). Engine port overridable via `CAIRN_PORT`.

## How to verify

```bash
pnpm typecheck                  # strict TS across the workspace
pnpm --filter @cairn/core test  # core service + classifier tests
pnpm build                      # full workspace build
```

## How the MCP server connects

- An `.mcp.json` at the repo root declares the local MCP stdio server.
- Start it for development with `pnpm mcp:dev`.
- It exposes **13 tools** and operates on the **same** `cairn.db` as the engine, routing all logic through `@cairn/core`. WAL mode keeps engine + MCP writes safe across processes.

## Gotchas

- **`better-sqlite3` needs `pnpm.onlyBuiltDependencies` approval** to run its native build script - this is already configured in the workspace, so `pnpm install` builds it without prompting.
- **The engine and the MCP server self-migrate on boot** - they apply pending Drizzle migrations on startup, so you usually don't need a manual `pnpm db:migrate` before running them (it's still safe to run).
- **The UI only talks to the engine at `http://localhost:4319/api`** - it never opens SQLite itself. If the UI shows no data, check that the engine is running and reachable on `4319`.
