# Learning Plan Markdown Format Guide

This guide outlines the standard format and structure for creating `.md` learning plan files that can be opened and parsed by **Productive Overload**.

---

## 📋 Full Template (`sample_learning_plan.md`)

Copy and paste the template below into any `.md` file to create a multi-entity learning plan with **Phases**, **Monthly Milestones**, **Weekly Objectives**, **Everyday Tasks**, and **Daily Habits**:

```markdown
---
title: System Architecture & Distributed Systems
description: Multi-phase roadmap to master Rust, Tauri, SQLite, and local AI orchestration
tags:
  - systems
  - rust
  - tauri
  - ai
---

# System Architecture & Distributed Systems

## Phase 1: Core Fundamentals

## Month 1: Rust & Systems Engineering
- [ ] Complete 30 LeetCode algorithms in Rust

## Week 1: Toolchain & Ownership
- [ ] Build a working CLI calculator using Rust clap and anyhow

## Daily Day 1: Habits
- [x] Drink 1L Water
- [ ] 30m Code Review

## Day 1: Rust Toolchain & Borrowing
- [x] Install Rust toolchain via rustup and configure VS Code rust-analyzer
- [x] Master Ownership, Borrowing, and Lifetime rules

## Phase 2: Desktop Shell & Production Polish

## Day 2: Tauri v2 & SQLite
- [ ] Scaffold Tauri v2 desktop application with React and Vite
- [ ] Initialize SQLite schema for progress snapshot tracking
```

---

## 🔑 Key Syntax Rules

| Element | Format / Syntax | Description |
| --- | --- | --- |
| **Phases** | `## Phase 1` or `## Phase 1: Title` | When Phase N has only `## Daily` tasks left and Phase N+1 exists, Phase N gets cleaned up so you advance seamlessly. **Last Phase is guaranteed never to be removed**. |
| **Monthly Milestones** | `## Month 1` or `## Month 1: Title` | Tracked separately in the **Monthly Milestones** section |
| **Weekly Objectives** | `## Week 1` or `## Week 1: Title` | Tracked separately in the **Weekly Objectives** section |
| **Everyday Tasks** | `## Day 1` or `## Day 1: Title` | Tracked separately in the **Everyday Tasks** section |
| **Daily Habits** | `## Daily Day 1:` or `## Daily` | Special recurring section: tasks fill up without line deletion and auto-renew to Day N+1 |

---

## 💡 How Productive Overload Tracks Your Plan

1. **Independent Trackers**: Everyday tasks (`## Day 1`), Weekly goals (`## Week 1`), and Monthly milestones (`## Month 1`) are parsed as distinct entities. You can unlock/re-lock Days, Weeks, and Months independently!
2. **Phase Auto-Advancement**: When all one-off tasks in a Phase are completed, non-last Phases are automatically removed from the `.md` file on disk so you smoothly advance to the next Phase.
3. **Last Phase Guarantee**: The final Phase in your file is protected and will never be removed, even if all tasks are complete.
