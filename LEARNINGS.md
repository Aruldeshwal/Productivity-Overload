# Learnings

> Running list of skills and concepts gained, updated at natural checkpoints (end of Day 1, Day 2, Day 3). This reflects real learning, not just a copy of concepts — things that genuinely surprised me, clicked late, or required deeper understanding than expected.

---

## Day 1 — Setup, Schema, Markdown Parsing

_Checkpoint: Step 10 (Completed Day 1 milestone)_

### Concepts to validate understanding of:
- [x] Tauri's IPC command/event model and its ACL-based capabilities security boundary
- [x] The hybrid-engineering pattern: deterministic code (regex) for anything that can be, non-deterministic LLM calls only where genuinely needed
- [x] How `tauri-plugin-sql` wraps SQLite operations behind an IPC bridge so React code calls JS APIs that internally invoke Rust

### What I actually learned:
- **Path Aliases configuration:** shadcn/ui requires `@/` path aliases configured in both `tsconfig.json` (for TypeScript static type checking) and `vite.config.ts` (for Vite module bundling).
- **ACL Security Boundary:** Tauri v2 permissions in `capabilities/default.json` are compiled directly into Rust security scopes (`fs:allow-read-text-file`, `sql:default`, etc.).
- **Hybrid Engineering Split:** Checklist completion and plan statistics execution via compiled regex runs in sub-milliseconds and avoids non-deterministic LLM latency or hallucinated counts.
- **SQLite Persistence:** `tauri-plugin-sql` allows executing prepared SQL statements with parameter binding directly from custom React hooks while managing singletons and connection pools.

---

## Day 2 — Ollama Bridge & Reflective Workflows

_Checkpoint: Step 19 (Completed Day 2 milestone)_

### Concepts to validate understanding of:
- [x] Ollama's model-swapping behavior under limited VRAM and why that's an expected latency, not a bug
- [x] Why model specialization (structured vs. reasoning) beats using one "best" model for everything
- [x] SSE streaming and state-machine parsing for splitting `<think>` reasoning from the final answer
- [x] The clinical link between procrastination and emotional regulation, and how that shaped the CBT prompt

### What I actually learned:
- **Model-Swapping VRAM Dynamics:** Ollama dynamically unloads weights when switching between `qwen2.5-coder:7b` and `deepseek-r1:7b`. This introduces a 1–3s latency spike on the first request, which requires client-side retry wrappers and exponential backoff.
- **Two-Model Specialization:** Rigid JSON grammar constraints (`format: "json"`) work cleanly with Qwen for extracting metrics, but corrupt DeepSeek-R1's `<think>` chain-of-thought tokens. Leaving R1 unconstrained yields superior CBT reasoning.
- **SSE Token Streaming & State Machine:** Parsing `<think>...</think>` tokens in real-time as chunks arrive via ReadableStream allows rendering DeepSeek's internal reasoning in a collapsible UI panel while streaming the final CBT report cleanly.
- **CBT Prompting vs. Generic AI Fluff:** Effective CBT coaching requires explicit constraints (banning clichés like "try Pomodoro", requiring 3 specific cognitive reframing exercises based on user logs) to produce clinically useful output.

---

## Day 3 — Notifications, Scheduler, Dashboard

_Checkpoint: Step 29 (Completed Day 3 milestone)_

### Concepts to validate understanding of:
- [x] How native desktop notifications work through Tauri's plugin system vs. web Notification API
- [x] Throttling streamed state updates to prevent UI jank during long model responses
- [x] Recharts data flow and responsive chart configuration

### What I actually learned:
- **Tauri Native Notification ACL:** `@tauri-apps/plugin-notification` executes native OS notifications directly via Windows WinRT / macOS notification daemons, requiring explicit ACL capability permissions (`notification:allow-notify`) in `capabilities/default.json`.
- **Interval Scheduler Deduplication:** A 30-second interval clock loop combined with a minute-keyed deduplication map (`${entry.id}-${nowStr}`) guarantees that scheduled task reminders trigger native notifications exactly once per time slot without duplicate spamming.
- **Recharts Chart Customization:** Recharts `ResponsiveContainer`, `LineChart`, and `BarChart` require clean color mapping and dataset reversing (`[...data].reverse()`) so chronological trends render correctly from left to right.

---

## Gaps to fill next:
- Integrate `nomic-embed-text` local embedding model for vector RAG over past reflections across multiple weeks.
- Add SQLCipher database encryption at rest to protect sensitive daily reflections.
