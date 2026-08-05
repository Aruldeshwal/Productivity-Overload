# Learning Plan Markdown Format Guide

This guide outlines the standard format and structure for creating `.md` learning plan files that can be opened and parsed by **Productive Overload**.

---

## 📋 Full Template (`sample_learning_plan.md`)

Copy and paste the template below into any `.md` file to create a new learning plan with both **Weekly Objectives** and **Everyday Tasks**:

```markdown
---
title: System Architecture & Distributed Systems
description: 4-week intensive roadmap to master Rust, Tauri, SQLite, and local AI orchestration
tags:
  - systems
  - rust
  - tauri
  - ai
---

# System Architecture & Distributed Systems

## Week 1: Core Fundamentals & Rust Basics
- [ ] Build a working CLI calculator using Rust clap and anyhow
- [ ] Complete 15 LeetCode algorithms in Rust

## Day 1: Rust Toolchain & Ownership
- [x] Install Rust toolchain via rustup and configure VS Code rust-analyzer
- [x] Master Ownership, Borrowing, and Lifetime rules
- [ ] Understand Smart Pointers (Rc, Arc, RefCell, Mutex)

## Day 2: Tauri v2 Desktop Shell
- [x] Scaffold Tauri v2 desktop application with React and Vite
- [x] Configure Tailwind CSS v4 design system and custom dark theme
- [ ] Initialize SQLite schema for progress snapshot tracking

## Week 2: Local AI & Ollama Integration
- [ ] Benchmark qwen2.5-coder:7b vs deepseek-r1:7b VRAM usage
- [ ] Build end-of-day reflection review form

## Day 3: Ollama HTTP Client
- [ ] Set up Ollama HTTP bridge targeting localhost:11434
- [ ] Stream DeepSeek-R1 <think> chain-of-thought tokens for weekly CBT reports
```

---

## 🔑 Key Syntax Rules

| Element | Format / Syntax | Description |
| --- | --- | --- |
| **Weekly Objectives** | `## Week 1` or `## Week 1: High Level Goal` | Tracked separately in the **Weekly Objectives** section |
| **Everyday Tasks** | `## Day 1` or `## Day 1: Specific Tasks` | Tracked separately in the **Everyday Tasks** section |
| **YAML Frontmatter** | `---` block at top of file | Metadata extracted for title, description, and category tags |
| **Title** | `title: "Your Plan Name"` | Plan name displayed on the dashboard header (overrides filename) |
| **Description** | `description: "Short summary"` | Subtitle displayed under the plan header |
| **Tags** | `tags:` list | Categorization tags shown as interactive pills (e.g., `#rust`, `#ai`) |
| **Completed Task** | `- [x] Task name` | Counted as **completed** (increases completion percentage) |
| **Incomplete Task** | `- [ ] Task name` | Counted as **pending** |

---

## 💡 How Productive Overload Tracks Your Plan

1. **Independent Trackers**: Everyday tasks (`## Day 1`) and Weekly goals (`## Week 1`) are parsed as distinct entities. You can unlock/re-lock Days and Weeks independently!
2. **View Filtering**: Use the **All Entities / Daily / Weekly** toggle switches on top of the Learning Plans panel to isolate daily tasks or weekly goals.
3. **Disk Removal on Completion**: Clicking **Complete & Remove** strips that task line directly from your physical `.md` file on disk while logging a progress snapshot to your local SQLite database (`progress_logs`).
