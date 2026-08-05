# Interview Prep & Technical Defense Guide

> Synthesized technical Q&A reference for **Productive Overload** — a private, local-first AI desktop productivity app built with Tauri v2, React, SQLite, and Ollama.
> Use this cheat sheet to defend architectural decisions, explain technical tradeoffs, and recount real engineering stories in interviews.

---

## 1. 30-Second Elevator Pitch

> "Productive Overload is a local-first, privacy-focused AI desktop productivity app built with Tauri v2, React, and SQLite. It parses markdown learning plans using microsecond deterministic regex, tracks daily task progress, and runs two local Ollama LLMs on-device: `qwen2.5-coder:7b` for structured JSON extraction of procrastination drivers, and `deepseek-r1:7b` for weekly CBT-style psychological coaching reports with real-time `<think>` token streaming. Everything runs 100% offline, keeping sensitive daily reflections completely private while maintaining a ~42MB idle RAM footprint."

---

## 2. Key Numbers & Metrics to Remember

| Metric | Measured Value | Significance |
| text | --- | --- |
| **Idle RAM Usage** | **~42 MB** | 80-90% less RAM than Electron (~200MB+), preserving system RAM for Ollama VRAM |
| **Installer Size** | **~9.8 MB** | Lightweight distribution via Windows WebView2 native webview |
| **Database Tables** | **2 normalized tables** | `progress_logs` & `daily_reviews` (both indexed on timestamps) |
| **Regex Parser Speed** | **< 1 ms** | Deterministic checkbox matching (`parseLearningPlan`) vs 2-5s LLM calls |
| **LLM Inference Latency** | **1-3s (Qwen) / 15-30s (DeepSeek-R1)** | Handled via SSE token streaming and exponential retry wrappers |
| **Scheduler Check Loop** | **30 seconds** | Background clock interval checking 24-hour schedule times for OS notifications |

---

## 3. Technical Question & Answer Bank (7 Domains)

### Domain 1: System Architecture & Stack Selection
- **Q: Why choose Tauri v2 over Electron?**
  - *Answer:* Electron bundles Chromium and Node.js (~150-300MB idle RAM). Local 7B parameter LLMs already require 5-8GB VRAM/RAM. Tauri v2 uses the native OS webview (WebView2 on Windows) and a Rust backend, reducing idle memory to ~42MB and leaving maximum system resources for Ollama model inference. Refer to [ADR-001 in DECISIONS.md](file:///C:/Users/aruld/OneDrive/Desktop/ProductiveOverload/DECISIONS.md#adr-001-tauri-v2-over-electron).
  - *Fresher trap to avoid:* Don't just say "Tauri is written in Rust so it's faster." Focus on the VRAM/RAM resource contention between the desktop shell and the local LLM runtime.

- **Q: Why standard React web instead of React Native for Desktop?**
  - *Answer:* Desktop React Native targets have sparse ecosystems for charting, markdown parsing, and filesystem APIs. Standard React in Tauri's webview provides access to the full web ecosystem (Recharts, shadcn/ui, Tailwind CSS v4) with Vite sub-second HMR. Refer to [ADR-002 in DECISIONS.md](file:///C:/Users/aruld/OneDrive/Desktop/ProductiveOverload/DECISIONS.md#adr-002-standard-web-react-inside-tauri-over-react-native-for-desktop).

### Domain 2: Data Persistence & Markdown Parsing
- **Q: Why use regex for checklist parsing instead of an LLM call?**
  - *Answer:* Deterministic vs non-deterministic engineering split. Counting completed checkboxes (`- [x]`) using regex (`/^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/gm`) executes in micro-seconds and guarantees 100% accuracy. Using a 7B model would take 2-5 seconds and risk hallucination. Refer to `src/utils/mdParser.ts` and [ADR-003 in DECISIONS.md](file:///C:/Users/aruld/OneDrive/Desktop/ProductiveOverload/DECISIONS.md#adr-003-regex-based-checklist-parsing-over-llm-based-parsing).

- **Q: Why split data into two SQLite tables (`progress_logs` & `daily_reviews`)?**
  - *Answer:* Normalization separates high-frequency, lightweight numerical progress snapshots (`progress_logs`, indexed on `timestamp`) from heavy text reflections and JSON arrays (`daily_reviews`, indexed on `review_date`). Refer to `src/hooks/useSQLite.ts`.

### Domain 3: Local LLM Orchestration & Ollama
- **Q: Why use two separate local models (`qwen2.5-coder:7b` & `deepseek-r1:7b`) instead of one?**
  - *Answer:* Qwen is optimized for strict JSON schema output (`format: "json"`). DeepSeek-R1 relies on chain-of-thought `<think>` reasoning; forcing strict JSON grammar on R1 corrupts or truncates CoT reasoning. Hence: Qwen for structured extraction, DeepSeek-R1 for free-form CBT coaching. Refer to [ADR-004 in DECISIONS.md](file:///C:/Users/aruld/OneDrive/Desktop/ProductiveOverload/DECISIONS.md#adr-004-two-model-specialization--qwen-for-strict-json-deepseek-r1-for-free-form-cbt-reasoning).

- **Q: How do you handle model-swapping latency in Ollama?**
  - *Answer:* When switching models under limited VRAM, Ollama unloads inactive weights, causing a 1-3s initial delay. I built `extractWithRetry` in `src/utils/qwenExtractor.ts` with exponential backoff (1s retry delay) and regex JSON boundary fallbacks (`/\{[\s\S]*\}/`).

### Domain 4: CBT Framework & Prompt Engineering
- **Q: How does the CBT prompt avoid generic "AI fluff"?**
  - *Answer:* The prompt explicitly instructs DeepSeek-R1 to identify specific cognitive distortions (e.g., perfectionism, all-or-nothing thinking), bans cliché advice (such as "try Pomodoro" or "just start"), and mandates exactly 3 actionable cognitive reframing exercises based on the user's specific reflections this week. Refer to `src/utils/deepseekCBT.ts`.

### Domain 5: Desktop Sandboxing & Security
- **Q: How is security enforced in Tauri v2?**
  - *Answer:* Security is enforced at the compiled Rust layer via ACL permission capability scopes in `src-tauri/capabilities/default.json` (`fs:allow-read-text-file`, `sql:default`, `notification:allow-notify`). Injected malicious JavaScript cannot access arbitrary files or paths outside declared scopes.

### Domain 6: Latency, Performance & Scaling
- **Q: How do you prevent UI jank during a 20+ second DeepSeek-R1 generation?**
  - *Answer:* By using SSE token streaming via `ReadableStream` reader (`stream: true`) in `useOllama.ts` and dynamic CoT state parsing in `WeeklyCBTReport.tsx`. The UI streams tokens progressively into a collapsible `<think>` panel, giving immediate visual feedback.

### Domain 7: Behavioral & Defense Scenarios
- **Q: Why build a local-first offline app instead of calling OpenAI APIs?**
  - *Answer:* Nightly reflections contain sensitive personal data (failures, self-doubt, anxiety). Sending this to third-party cloud LLMs risks human review and breach exposure. Local inference guarantees reflections never leave the device. Refer to [ADR-005 in DECISIONS.md](file:///C:/Users/aruld/OneDrive/Desktop/ProductiveOverload/DECISIONS.md#adr-005-fully-localoffline-architecture-over-cloud-llm-apis).

---

## 4. Real STAR-Format Technical Stories (From `DIFFICULTIES.md`)

### Story 1: Handling Malformed LLM JSON & Model-Swap Delays
- **Situation:** When extracting structured review data, Qwen occasionally output surrounding markdown backticks (` ```json `), or requests timed out while Ollama swapped model weights into GPU memory.
- **Task:** Ensure 100% reliable JSON extraction without crashing the UI or losing user reflections.
- **Action:** Implemented `extractWithRetry` in `src/utils/qwenExtractor.ts` featuring automatic 1s backoff retries, lowered temperature on retry (0.1), and regex JSON object boundary extraction (`/\{[\s\S]*\}/`).
- **Result:** Zero extraction crashes during reflection submissions, with automatic fallback handling.

### Story 2: Configuring Path Aliases in Dual Resolution Systems
- **Situation:** Initializing shadcn/ui failed with "Could not find valid path aliases for init."
- **Task:** Configure `@/` path alias resolution cleanly across the Tauri/Vite stack.
- **Action:** Updated `tsconfig.json` (`"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`) for TypeScript type checking and added matching `resolve.alias` in `vite.config.ts` for Vite bundling.
- **Result:** Clean component resolution across development, type checks, and production builds.
