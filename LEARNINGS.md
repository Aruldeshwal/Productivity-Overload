# Learnings

> Running list of skills and concepts gained, updated at natural checkpoints (end of Day 1, Day 2, Day 3). This reflects real learning, not just a copy of concepts — things that genuinely surprised me, clicked late, or required deeper understanding than expected.

---

## Day 1 — Setup, Schema, Markdown Parsing

_Checkpoint: Step 10_

### Concepts to validate understanding of:
- [ ] Tauri's IPC command/event model and its ACL-based capabilities security boundary
- [ ] The hybrid-engineering pattern: deterministic code (regex) for anything that can be, non-deterministic LLM calls only where genuinely needed
- [ ] How `tauri-plugin-sql` wraps SQLite operations behind an IPC bridge so React code calls JS APIs that internally invoke Rust

### What I actually learned:
- shadcn/ui requires `@/` path aliases configured in both `tsconfig.json` (for TypeScript) and `vite.config.ts` (for the bundler) — these are separate resolution systems that both need to agree
- Tauri v2's `capabilities/default.json` is the compiled security boundary — permissions listed here are checked at the Rust layer, not in JavaScript

---

## Day 2 — Ollama Bridge & Reflective Workflows

_Checkpoint: Step 19_

### Concepts to validate understanding of:
- [ ] Ollama's model-swapping behavior under limited VRAM and why that's an expected latency, not a bug
- [ ] Why model specialization (structured vs. reasoning) beats using one "best" model for everything
- [ ] SSE streaming and state-machine parsing for splitting `<think>` reasoning from the final answer
- [ ] The clinical link between procrastination and emotional regulation, and how that shaped the CBT prompt

### What I actually learned:
_To be filled at Step 19._

---

## Day 3 — Notifications, Scheduler, Dashboard

_Checkpoint: Step 29_

### Concepts to validate understanding of:
- [ ] How native desktop notifications work through Tauri's plugin system vs. web Notification API
- [ ] Throttling streamed state updates to prevent UI jank during long model responses
- [ ] Recharts data flow and responsive chart configuration

### What I actually learned:
_To be filled at Step 29._

---

## Gaps to fill next:
- _To be identified during the build._
