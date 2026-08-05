# Changelog

All notable changes to Productive Overload will be documented in this file.

## [0.1.0] — 2026-08-05

### Added
- **Tauri v2 Desktop Shell**: Scaffolding with React, Vite, TypeScript, and scoped capability ACL permissions.
- **SQLite Data Layer (`tauri-plugin-sql`)**: `progress_logs` and `daily_reviews` schema initialization with `review_date` and `timestamp` indexing.
- **Deterministic Markdown Parser (`mdParser.ts`)**: `gray-matter` frontmatter extraction and regex checklist parsing (`- [x]`).
- **Ollama AI Bridge (`useOllama.ts`)**: Connectivity checking, non-streaming & SSE token streaming over HTTP `localhost:11434`.
- **Qwen Structured Extraction (`qwenExtractor.ts`)**: Structured JSON extraction for procrastination severity score (1-10), delayed tasks, and emotional triggers with exponential retry wrappers.
- **DeepSeek-R1 CBT Coaching (`deepseekCBT.ts`)**: Weekly CBT report generation with real-time `<think>` chain-of-thought reasoning token streaming.
- **Timetable & Reminders (`useScheduler.ts`)**: 30-second interval clock with native OS desktop notifications via `@tauri-apps/plugin-notification`.
- **Recharts Analytics Dashboard (`DashboardCharts.tsx`)**: Progress-over-time LineChart and procrastination-severity BarChart.
- **Documentation Suite**: `README.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DIFFICULTIES.md`, `LEARNINGS.md`, and `INTERVIEW_PREP.md`.
