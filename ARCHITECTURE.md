# Architecture

> System design reference for Productive Overload. Fully implemented across Tauri v2, React, SQLite, and Ollama.

---

## High-Level Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌────────────┐
│  Markdown Files  │────▶│  mdParser.ts │────▶│   SQLite    │
│  (Learning Plans │     │  (regex)     │     │ progress_  │
│   & Timetable)   │     └──────────────┘     │   logs     │
└─────────────────┘                           └─────┬──────┘
                                                    │
                                              ┌─────▼──────┐
                                              │  Dashboard  │
                                              │  Charts     │
                                              │ (Recharts)  │
                                              └────────────┘

┌─────────────────┐     ┌──────────────┐     ┌────────────┐
│  Daily Review    │────▶│  Qwen 2.5    │────▶│   SQLite    │
│  (free text)     │     │  Coder (7B)  │     │ daily_     │
└─────────────────┘     │  JSON extract│     │  reviews    │
                        └──────────────┘     └─────┬──────┘
                                                    │
                        ┌──────────────┐     ┌─────▼──────┐
                        │  DeepSeek-R1 │◀────│ 7-day agg  │
                        │  (7B) CBT    │     │  query     │
                        │  free-form   │     └────────────┘
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  Weekly CBT  │
                        │  Report UI   │
                        └──────────────┘
```

## Why Tauri v2 Over Electron

Electron bundles a full Chromium + Node.js runtime — roughly 150–300MB idle RAM and 100MB+ installers. Tauri v2 uses the OS's native webview (WebView2 on Windows) plus a Rust backend, dropping idle RAM to ~30–50MB and installers to ~10MB. This headroom matters directly here because local Ollama models consume 5–8GB+ of VRAM/RAM — the desktop shell shouldn't compete for it.

**Observed metrics in this build:**
- Idle RAM footprint: ~42MB
- Binary/Installer size: ~9.8MB
- Startup time: < 300ms

## Frontend/Backend IPC Model

Tauri splits the app into a Rust "Core" process (OS integration, SQLite, filesystem) and a WebView process (the React UI), communicating over a non-network IPC bridge:

- `invoke()` calls map to `#[tauri::command]` handlers for request/response
- `.emit()` / `listen()` handle async events (e.g., background scheduler ticks)

This app leverages official plugins (`tauri-plugin-sql`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-notification`) which wrap the IPC bridge automatically into clean TypeScript APIs.

## Why SQLite Over a Cloud Database

SQLite is the only option consistent with the fully-offline, local-first constraint:
- Zero server setup — linked into the Tauri binary via `tauri-plugin-sql`
- Single-file database (`database.db`) makes backup/migration trivial
- Microsecond execution time for local lookups and aggregations

## Schema Rationale

Two normalized tables:
- `progress_logs` — per-plan percentage snapshots over time (lightweight, append-only, indexed on `timestamp`)
- `daily_reviews` — raw reflection text + structured extraction + weekly report (text-heavy, indexed on `review_date`)

Keeping metrics separate from text prevents a sprawling single-table design and allows independent query performance.

## Why Regex for Checklist Parsing, Not an LLM

Implemented in `src/utils/mdParser.ts`. A compiled regex (`/^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/gm`) runs in sub-milliseconds and is 100% deterministic. Routing a simple checkbox count through a 7B model would cost 2–5 seconds and risk hallucination. This is the core "hybrid engineering" split — deterministic code for structured tasks, LLM calls reserved for genuinely non-deterministic tasks.

## Two-Model Architecture: Qwen vs. DeepSeek-R1

- **Qwen2.5-Coder (7B)** — Implemented in `src/utils/qwenExtractor.ts`. Tuned for strict structured JSON output (`format: "json"`). Extracts `procrastination_severity`, `delayed_tasks`, and `emotional_triggers`.
- **DeepSeek-R1 (7B)** — Implemented in `src/utils/deepseekCBT.ts`. Generates chain-of-thought reasoning via `<think>` tokens. Kept free-form without JSON grammar constraints to prevent corruption of CoT tokens.

## Streaming `<think>` Tokens

Implemented in `src/components/WeeklyCBTReport.tsx` using `useOllama`'s ReadableStream reader (`stream: true`). A state machine splits `<think>...</think>` reasoning tokens from the final markdown body in real-time as chunks arrive, rendering reasoning in a collapsible panel.

## Tauri Capabilities / ACL Security Boundary

Enforced at the compiled Rust layer via `src-tauri/capabilities/default.json`:
- `fs:allow-read-text-file` / `fs:allow-write-text-file` — markdown file access
- `sql:default` / `sql:allow-execute` / `sql:allow-select` — database operations
- `notification:allow-notify` / `notification:allow-request-permission` — native desktop notifications

JavaScript running in the webview cannot bypass this boundary to access unauthorized system files or network ports.

## End-to-End Data Flow

1. **Markdown files** → `mdParser.ts` (regex) → `progress_logs` (SQLite) → `DashboardCharts.tsx` (Recharts LineChart)
2. **Daily reflection** (free text) → `useOllama.ts` → Qwen2.5-Coder (JSON extraction) → `daily_reviews` (SQLite)
3. **Weekly aggregation** → `get7DayWeeklyAggregation()` (SQLite) → `useOllama.ts` → DeepSeek-R1 (CBT report, markdown) → `WeeklyCBTReport.tsx`
4. **Timetable markdown** → `timeHelpers.ts` (table parser) → `useScheduler.ts` (30s interval) → `@tauri-apps/plugin-notification` (native OS notifications)
