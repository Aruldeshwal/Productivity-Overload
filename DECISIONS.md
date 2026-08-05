# Architecture Decision Records

> Every meaningful fork-in-the-road decision is logged here the moment it's made, with context, options considered, and consequences. This directly answers "why did you choose X over Y?" in interviews.

---

## ADR-001: Tauri v2 over Electron

**Context:** Needed a desktop shell for a React-based dashboard that runs alongside local Ollama models consuming 5–8GB+ of VRAM/RAM. The shell's own resource footprint directly competes with the LLM runtime.

**Options considered:**
- **Electron** — Mature ecosystem, bundles Chromium + Node.js. ~150–300MB idle RAM, 100MB+ installer. Large community, abundant plugins.
- **Tauri v2** — Uses OS native webview (WebView2 on Windows) + Rust backend. ~30–50MB idle RAM, ~10MB installer. Smaller but growing ecosystem. Plugin-based architecture for SQL, filesystem, notifications.

**Decision:** Tauri v2.

**Consequences:** 80–90% smaller memory footprint leaves headroom for Ollama. Trade-off: smaller community, fewer examples to reference, and Rust compilation adds to initial build times (~3 minutes for first compile). Accepted because we don't need custom Rust code — only official plugins.

---

## ADR-002: Standard Web React inside Tauri over React Native for Desktop

**Context:** Chose the frontend framework for a data-heavy dashboard with charts, markdown rendering, and form inputs on desktop.

**Options considered:**
- **React Native for Desktop (macOS/Windows)** — Native rendering, theoretically better performance. But: sparse ecosystem for desktop targets, fragile charting/markdown libraries, and the core RN advantage (bypassing webview for native mobile gestures) doesn't apply to a desktop dashboard.
- **Standard React (web) in Tauri's webview** — Full web ecosystem (Recharts, shadcn/ui, any CSS framework), Vite HMR for fast iteration, proven at scale for dashboard UIs.

**Decision:** Standard web React inside Tauri's system webview.

**Consequences:** Access to the entire web ecosystem. Vite HMR provides sub-second hot reload during development. Trade-off: web rendering in a webview is slightly less native-feeling than true native widgets, but for a data dashboard this is negligible.

---

## ADR-003: Regex-based checklist parsing over LLM-based parsing

**Context:** Need to count `- [x]` and `- [ ]` checklist items in markdown learning plan files to compute completion percentages. Also need to extract frontmatter metadata (title, description, tags).

**Options considered:**
- **LLM-based parsing** — Send the markdown to Qwen2.5-Coder and ask it to count completed/total items and extract metadata. Flexible, handles edge cases, but: 2–5 second latency per file, non-deterministic (could hallucinate counts), and wasteful for a perfectly structured format.
- **Regex-based parsing** — `gray-matter` for frontmatter (well-tested library), then `/^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/gm` for checklist items. Microsecond execution, 100% deterministic, zero model overhead.

**Decision:** Regex-based parsing with gray-matter. Implemented in `src/utils/mdParser.ts`.

**Consequences:** Parser is fast, deterministic, and testable with simple assertions. Trade-off: won't handle exotic markdown variants (e.g., nested checklists inside blockquotes), but for the learning-plan use case the standard `- [x]` format is sufficient. This is the foundation of the hybrid-engineering pattern — deterministic code for structured tasks, LLM calls reserved for genuinely non-deterministic work (extracting emotional signals from free text).

---

## ADR-004: Two-model specialization — Qwen for strict JSON, DeepSeek-R1 for free-form CBT reasoning

**Context:** Need both structured data extraction (procrastination score, delayed tasks, emotional triggers as JSON) and free-form coaching reports (weekly CBT analysis as markdown).

**Options considered:**
- **Single model for both** — Use one model with different prompts. Simpler, but risks: JSON mode may corrupt chain-of-thought reasoning, or the model may not handle both structured and creative output well.
- **Two specialized models** — Qwen2.5-Coder for strict JSON extraction (its JSON grammar constraint works cleanly), DeepSeek-R1 for free-form markdown CBT reports (its `<think>` reasoning is the value-add, and forcing JSON on it corrupts that output).

**Decision:** Two specialized models: `qwen2.5-coder:7b` for structured JSON extraction, and `deepseek-r1:7b` for free-form markdown weekly CBT reports.

**Consequences:** 
- Qwen2.5-Coder handles rigid JSON grammar (`format: "json"`) cleanly without leaking text or corrupting fields.
- DeepSeek-R1 is kept strictly unconstrained (`format: null`), allowing its `<think>` chain-of-thought tokens to execute naturally without syntax grammar interference.
- Trade-off: Model-swapping latency (~2–4s delay when Ollama switches weights in GPU VRAM), which we handle gracefully with UI loading states and retry logic.

---

## ADR-005: Fully local/offline architecture over cloud LLM APIs

**Context:** The app captures nightly reflections containing genuinely vulnerable personal data — failures, self-doubt, procrastination patterns, emotional triggers. This is the kind of data that requires privacy-by-design.

**Options considered:**
- **Cloud LLM APIs (OpenAI, Anthropic, etc.)** — Higher model quality, no local GPU requirement, faster inference. But: data leaves the device, subject to third-party ToS/data-retention policies, potential training data use, breach exposure. Also requires internet and subscription costs.
- **Fully local with Ollama** — All inference runs on-device via Ollama. Zero network dependency, zero data exfiltration risk, no subscription cost. Trade-off: limited to models that run on consumer hardware (7B–14B parameter range), slower inference than cloud endpoints.

**Decision:** Fully local with Ollama.

**Consequences:** Reflections never leave the device — close to a clinical prerequisite for the honesty CBT-style self-reflection actually needs. Trade-off: lower model capability ceiling (7B vs. cloud 100B+), 5–20 second inference latency per call, and requires users to have sufficient hardware (8GB+ RAM minimum, GPU recommended). Accepted because privacy is non-negotiable for this use case, and 7B models are sufficient for the structured extraction and coaching report tasks.
