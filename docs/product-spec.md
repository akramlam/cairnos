# Product spec

> **CairnOS** - a local-first AI productivity desktop app. **Turn chaos into action.**

---

## Vision

CairnOS turns messy brain dumps into organized, actionable structure. You type (or paste) a stream-of-consciousness list of everything on your mind, and the app extracts discrete **projects, tasks, notes, ideas, and reminders** - each one classified, prioritized, dated, and tagged for you to review before anything is saved.

The product is built around three commitments:

- **Local-first** - your data lives in a single SQLite file on your machine. Nothing leaves the device.
- **Private** - no accounts, no cloud, no telemetry. The AI classification in the MVP is rule-based and runs entirely on your computer.
- **Premium** - a polished, fast, keyboard-driven desktop experience (command palette, instant search, smooth transitions) that feels like a tool you'd pay for.

---

## The signature flow

The defining interaction is the **Brain Dump**: one free-text box, one click, structured output you review and accept.

```
 ┌─────────────────────────────┐      ┌────────────────────┐      ┌─────────────────────┐
 │  Raw brain dump (free text) │ ───► │  Rule-based        │ ───► │  Extracted items    │
 │  "tomorrow finish the…"     │      │  classifier        │      │  (review → save)    │
 └─────────────────────────────┘      └────────────────────┘      └─────────────────────┘
```

### Worked example

**Input**

```
tomorrow finish the launch deck, fix the signup bug, idea for referral rewards,
remind me to email the team, prepare the Monday demo
```

**Output** - five extracted items, each one editable before saving:

| # | Type         | Title                          | Notes                          |
|---|--------------|--------------------------------|--------------------------------|
| 1 | **Task**     | Finish the launch deck         | Due **tomorrow**               |
| 2 | **Task**     | Fix the signup bug             |                                |
| 3 | **Idea**     | Referral rewards               |                                |
| 4 | **Reminder** | Email the team                 |                                |
| 5 | **Task**     | Prepare the Monday demo        |                                |

### What every extracted item carries

Each candidate the classifier produces is a rich, reviewable object:

- **type** - `task` · `idea` · `note` · `reminder` (and, where appropriate, a project suggestion)
- **title** - the cleaned, human-readable summary
- **priority** - `low` · `medium` · `high`
- **due date** *(optional)* - parsed from natural language (e.g. "tomorrow"), plus an optional **label** (e.g. "tomorrow")
- **project suggestion** - an existing or new project this item likely belongs to
- **tags** - extracted keywords for grouping and filtering
- **confidence** - a score from `0` to `1` indicating how sure the classifier is
- **reasons** - human-readable explanations of *why* it was classified this way

Nothing is persisted automatically. The user reviews, edits, accepts, or discards each item - the classifier proposes, the human disposes.

---

## Features

### Brain Dump Inbox
The entry point. Paste or type free text, run the classifier, and review the extracted candidates. Edit any field (type, title, priority, due date, project, tags) before committing the batch to the database.

### Dashboard / Today
The home view. A personalized **greeting**, **stat cards** at a glance, and focused lists: **due today**, **overdue**, **active projects**, and **upcoming reminders**, plus an overall **progress** indicator to show how the day is tracking.

### Projects
Full **CRUD** plus **archive**. Each project carries a **status**, **priority**, and **color**. The **project detail** view aggregates everything attached to it - tasks, notes, ideas, and reminders - with a **progress** bar and a suggested **next action**.

### Tasks
Multiple saved views: **Today**, **Upcoming**, **Overdue**, **Completed**, and **All**. Quickly **complete** or **delete** tasks from any view.

### Ideas
A lightweight capture surface for sparks of inspiration. Any idea can be **converted** into a **task**, **project**, or **note** once it's ready to act on.

### Notes
Simple, durable knowledge capture: a **title** and a **body**.

### Reminders
Time-based nudges with a lifecycle: **scheduled → triggered → dismissed / done**. Each can be **snoozed**, marked **done**, or **dismissed**, and surfaces as a **desktop notification** when triggered.

### Command palette
Invoked with **Ctrl / ⌘ + K**. Run common actions without leaving the keyboard: **new task**, **new project**, **quick capture**, **navigate** between views, and **search**.

### Search
**Substring** matching across **all** entity types (projects, tasks, ideas, notes, reminders) for fast recall.

### Settings
Configure your workspace: **display name**, **theme**, **notifications**, **reminder lead minutes**, **MCP status**, **DB location**, and **JSON export** of your data.

### Local MCP server
A local **Model Context Protocol** stdio server exposing **13 tools**, letting MCP-aware clients read and write the same database the UI uses.

### Landing page
A marketing/intro page available at **`/#/landing`**.

---

## Entities

All entities use **UUID v4** TEXT identifiers and **ISO-8601** string timestamps stored as TEXT.

| Entity       | Key fields                                                                                          | Status enum                                      |
|--------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------|
| **Project**  | id, title, status, priority, color, archived, timestamps                                            | active · archived (status), open/in-progress lifecycle |
| **Task**     | id, title, priority, due date, completed, project (optional), tags, timestamps                      | Today · Upcoming · Overdue · Completed · All (views) |
| **Idea**     | id, title, tags, project (optional), timestamps; convertible to task/project/note                   | -                                                |
| **Note**     | id, title, body, project (optional), timestamps                                                     | -                                                |
| **Reminder** | id, title, scheduled time, project (optional), timestamps                                           | scheduled · triggered · dismissed · done         |
| **Tag**      | id, name (used to group tasks/ideas)                                                                 | -                                                |

> Timestamps and dates are ISO-8601 strings end to end (DB → API → UI) so there is **zero serialization mapping** to maintain.

---

## Non-goals (MVP)

- **No paid APIs.** Classification is rule-based and runs locally.
- **No cloud, no accounts.** Everything is on-device; there is no sync or login.
- **Basic substring search only.** Semantic / vector search is a later milestone.
- **Light theme is experimental.** Dark is the supported default.

---

## Roadmap

| Area                         | Direction                                                                 |
|------------------------------|---------------------------------------------------------------------------|
| **Smarter classifier**       | Pluggable **Ollama** (local) and **Claude** (hosted) classifiers beyond the rule-based MVP |
| **Semantic search**          | Embedding-based search to complement substring matching                   |
| **Desktop packaging**        | **Tauri** native packaging with first-class **native notifications**      |
| **New views**                | **Calendar** and **analytics** views over your projects, tasks, and reminders |
