# Learning Plan Markdown Format Guide

This guide outlines the standard format and structure for creating `.md` learning plan files that can be opened and parsed by **Productive Overload**.

---

## 📋 Full Template (`sample_learning_plan.md`)

Copy and paste the template below into any `.md` file to create a new learning plan:

```markdown
---
title: System Architecture & Distributed Systems
description: 6-week intensive roadmap to master Rust, Tauri, SQLite, and local AI orchestration
tags:
  - systems
  - rust
  - tauri
  - ai
---

# System Architecture & Distributed Systems

## Phase 1: Core Fundamentals & Rust Basics
- [x] Install Rust toolchain via rustup and configure VS Code rust-analyzer
- [x] Master Ownership, Borrowing, and Lifetime rules
- [x] Implement CLI calculator using clap and anyhow
- [ ] Understand Smart Pointers (Rc, Arc, RefCell, Mutex)

## Phase 2: Desktop Shell & Local Database
- [x] Scaffold Tauri v2 desktop application with React and Vite
- [x] Configure Tailwind CSS v4 design system and custom dark theme
- [x] Initialize SQLite schema for progress snapshot tracking
- [ ] Implement background 30-second interval scheduler for reminders

## Phase 3: Local AI & Ollama Integration
- [x] Set up Ollama HTTP bridge targeting localhost:11434
- [ ] Prompt engineer qwen2.5-coder:7b for structured JSON extraction
- [ ] Stream DeepSeek-R1 <think> chain-of-thought tokens for weekly CBT reports
- [ ] Measure idle memory footprint vs Electron baseline

## Phase 4: Production Polish & Security
- [ ] Scope ACL capability permissions in src-tauri/capabilities/default.json
- [ ] Add unit test suite for markdown checklist regex parser
- [ ] Build production distribution installer via npm run tauri build
```

---

## 🔑 Key Syntax Rules

| Element | Format / Syntax | Description |
| --- | --- | --- |
| **YAML Frontmatter** | `---` block at top of file | Metadata extracted for title, description, and category tags |
| **Title** | `title: "Your Plan Name"` | Plan name displayed on the dashboard header (overrides filename) |
| **Description** | `description: "Short summary"` | Subtitle displayed under the plan header |
| **Tags** | `tags:` list | Categorization tags shown as interactive pills (e.g., `#rust`, `#ai`) |
| **Completed Task** | `- [x] Task name` | Counted as **completed** (increases completion percentage) |
| **Incomplete Task** | `- [ ] Task name` | Counted as **pending** |
| **Sections / Modules** | `## Phase 1` or `### Module` | Header formatting used for structural organization |

---

## 💡 How Productive Overload Parses Your File

1. **Microsecond Regex Engine**: `mdParser.ts` uses compiled regex to count `- [x]` vs `- [ ]` checkboxes in sub-milliseconds without LLM overhead.
2. **Interactive Toggling**: Clicking a checkbox inside the app updates the markdown state in memory and persists a progress snapshot into your local SQLite database (`progress_logs`).
3. **Flexible Bullets**: Both `- [ ]` and `* [ ]` bullet formats are fully supported.
