# Architecture

> System design reference for Productive Overload. Skeleton created at Step 5; sections filled in as the real design solidifies through the build.

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

<!-- TODO: Fill in with real build observations after Step 1 -->

Electron bundles a full Chromium + Node.js runtime — roughly 150–300MB idle RAM and 100MB+ installers. Tauri v2 uses the OS's native webview (WebView2 on Windows) plus a Rust backend, dropping idle RAM to ~30–50MB and installers to ~10MB. This headroom matters directly here because local Ollama models consume 5–8GB+ of VRAM/RAM — the desktop shell shouldn't compete for it.

**Real numbers from this build:** _To be measured and added._

## Frontend/Backend IPC Model

Tauri splits the app into a Rust "Core" process (OS integration, SQLite, filesystem) and a WebView process (the React UI), communicating over a non-network IPC bridge:

- `invoke()` calls map to `#[tauri::command]` handlers for request/response
- `.emit()` / `listen()` handle async events (e.g., background scheduler ticks)

This app needs almost none of this written by hand because `tauri-plugin-sql` and `@tauri-apps/plugin-fs` already wrap the IPC bridge — we call their JavaScript APIs directly and they handle the Rust-side plumbing.

## Why SQLite Over a Cloud Database

<!-- TODO: Elaborate with real schema after Step 6 -->

SQLite is the only option consistent with the fully-offline, local-first constraint. Beyond that:
- Zero server setup — it's an embedded library linked into the Tauri binary
- Single-file database makes backup/migration trivial
- More than sufficient for the write volume (a few rows per day)

## Schema Rationale

Two normalized tables:
- `progress_logs` — per-plan percentage snapshots over time (lightweight, append-only)
- `daily_reviews` — raw reflection text + structured extraction + weekly report (heavier, text-heavy)

Keeping metrics separate from text prevents a sprawling single-table design and allows independent query optimization.

## Why Regex for Checklist Parsing, Not an LLM

<!-- TODO: Fill in after Step 7 with real parser code reference -->

A compiled regex (`content.match(/- \[x\]/g)`) runs in microseconds and is 100% deterministic. Routing a simple checkbox count through a 7B model costs several seconds and can hallucinate. This is the core "hybrid engineering" decision — deterministic code wherever possible, LLM calls reserved for genuinely non-deterministic tasks.

## Two-Model Architecture: Qwen vs. DeepSeek-R1

<!-- TODO: Fill in after Step 17 with real observations -->

- **Qwen2.5-Coder (7B)** — Tuned for strict structured output. Ollama's JSON-grammar-constrained mode works cleanly with it.
- **DeepSeek-R1 (7B)** — Chain-of-thought reasoning via `<think>` tokens. Forcing strict JSON grammar on R1 breaks or skips its reasoning. Hence: Qwen for structured extraction, DeepSeek-R1 only for free-form markdown output.

## Streaming `<think>` Tokens

<!-- TODO: Fill in after Step 18–19 with implementation details -->

Using SSE streaming (`stream: true`) with a small state machine (`isThinking` flag toggled on `<think>`/`</think>` tokens) lets the UI render DeepSeek's reasoning in a collapsible panel in real time.

## Tauri Capabilities / ACL Security Boundary

Security is enforced at the compiled Rust layer via an ACL defined in `src-tauri/capabilities/default.json`. The current permissions scope:
- `fs:allow-read-text-file` / `fs:allow-write-text-file` — markdown file access
- `sql:default` / `sql:allow-execute` / `sql:allow-select` — database operations
- `notification:allow-notify` / `notification:allow-request-permission` — native notifications

Even injected malicious JavaScript can't read arbitrary paths — every FS command goes through the IPC bridge, which checks the compiled scope.

**Accepted exposure:** Ollama's `localhost:11434` has no auth by default. All local scripts/webpages can potentially hit it. See `DECISIONS.md` for whether this is mitigated or deferred.

## UI Responsiveness During Model Calls

<!-- TODO: Fill in after Step 19 with real latency measurements -->

`async`/`await` frees the event loop during the network call, but synchronously processing a large streamed response can jank the UI. Fix: throttle streamed state updates (batch every ~10–15 tokens) rather than re-rendering on every character.

## End-to-End Data Flow

1. **Markdown files** → `mdParser.ts` (regex) → `progress_logs` (SQLite) → `DashboardCharts.tsx` (Recharts)
2. **Daily reflection** (free text) → `useOllama.ts` → Qwen2.5-Coder (JSON extraction) → `daily_reviews` (SQLite)
3. **Weekly aggregation** → 7-day query from `daily_reviews` → `useOllama.ts` → DeepSeek-R1 (CBT report, markdown) → `WeeklyCBTReport.tsx`
4. **Timetable markdown** → `timeHelpers.ts` (regex table parser) → `useScheduler.ts` (30s interval) → `@tauri-apps/plugin-notification` (native notifications)
