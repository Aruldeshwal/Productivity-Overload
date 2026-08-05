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

- [x] **Ollama model-swap latency** — 2–4s delay when alternating between Qwen and DeepSeek-R1 under limited VRAM (Handled via retry wrapper in Step 15)
- [ ] **UI thread jitter** — Streamed tokens updating React state on every character instead of being throttled
- [ ] **DeepSeek-R1 JSON corruption** — R1's `<think>` reasoning tokens leaking into JSON payload when forced into strict JSON mode
- [ ] **Localhost CORS exposure** — `localhost:11434` reachable by any local script or malicious webpage with no CORS restriction
- [x] **SQLite index performance** — `progress_logs`/`daily_reviews` needing an index on `review_date` as log history grows (Added in Step 6)

---

## [Step 2] shadcn/ui init failed on missing import aliases

**What happened:** Running `npx shadcn@latest init` failed with "Could not find valid path aliases or package imports for init. Configure path aliases in tsconfig.json or imports in package.json."

**Why it happened:** The Tauri scaffold's default `tsconfig.json` doesn't include `baseUrl` or `paths` — shadcn/ui requires a `@/` path alias to resolve component imports like `@/lib/utils`.

**How I fixed it:** Added `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` to `tsconfig.json`, and a matching `resolve.alias` entry in `vite.config.ts` so Vite resolves the same path at build time.

**What I'd do differently:** Check the shadcn prerequisites (path alias requirement) before running init, rather than discovering it from the error message. The shadcn docs do mention this but it's easy to miss when scaffolding a non-Next.js project.

---

## [Step 15] Malformed JSON & model-swap latency handling in Qwen extraction

**What happened:** Intermittent JSON parse errors (`SyntaxError: Unexpected token...`) occurred when Qwen emitted markdown codeblock wrappers or when model weight loading into GPU VRAM timed out initial HTTP requests.

**Why it happened:** Ollama unloads inactive model weights from GPU memory when alternating between models under VRAM constraints, creating a 1–3s model-swap delay. Additionally, LLMs occasionally output prose or markdown block quotes (` ```json `) even when JSON mode is specified.

**How I fixed it:** 
1. Created `extractWithRetry` in `src/utils/qwenExtractor.ts` with exponential backoff (1s delay between attempts) and lower temperature on retries (0.1).
2. Implemented a regex fallback match (`/\{[\s\S]*\}/`) to extract JSON object boundaries if surrounding markdown backticks or prose preamble are returned.

**What I learned:** Never rely solely on an LLM's `format: "json"` guarantee in production; client-side parsing must always sanitize markdown blocks and provide retry logic for model loading latency.
