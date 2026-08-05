# Difficulties Log

> This file is an interview-prep bank. Every time something non-trivial goes wrong — a permission error, a model output that won't parse, a race condition, a design choice that had to be reversed — it gets logged here **as it happens**, with the actual error message and root cause, not a vague summary written after the fact.
>
> Format:
> ```
> ## [Step N] Short title of the problem
> **What happened:** 1–2 sentences, concrete, include the actual error if there was one.
> **Why it happened:** Root cause, not just the symptom.
> **How I fixed it:** What you actually changed.
> **What I'd do differently / what I learned:** Optional but valuable for interview framing.
> ```

---

## Watch-List (Pre-Identified Failure Modes)

These are specific failure modes identified during pre-build research. Test for them explicitly; only log an entry above for ones actually encountered.

- [ ] **Ollama model-swap latency** — 2–4s delay when alternating between Qwen and DeepSeek-R1 under limited VRAM
- [ ] **UI thread jitter** — Streamed tokens updating React state on every character instead of being throttled
- [ ] **DeepSeek-R1 JSON corruption** — R1's `<think>` reasoning tokens leaking into JSON payload when forced into strict JSON mode
- [ ] **Localhost CORS exposure** — `localhost:11434` reachable by any local script or malicious webpage with no CORS restriction
- [ ] **SQLite index performance** — `progress_logs`/`daily_reviews` needing an index on `review_date` as log history grows

---

## [Step 2] shadcn/ui init failed on missing import aliases

**What happened:** Running `npx shadcn@latest init` failed with "Could not find valid path aliases or package imports for init. Configure path aliases in tsconfig.json or imports in package.json."

**Why it happened:** The Tauri scaffold's default `tsconfig.json` doesn't include `baseUrl` or `paths` — shadcn/ui requires a `@/` path alias to resolve component imports like `@/lib/utils`.

**How I fixed it:** Added `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` to `tsconfig.json`, and a matching `resolve.alias` entry in `vite.config.ts` so Vite resolves the same path at build time.

**What I'd do differently:** Check the shadcn prerequisites (path alias requirement) before running init, rather than discovering it from the error message. The shadcn docs do mention this but it's easy to miss when scaffolding a non-Next.js project.
