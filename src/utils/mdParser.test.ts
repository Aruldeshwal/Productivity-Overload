import { describe, it, expect } from "vitest";
import { parseLearningPlan, removeTaskFromMarkdown } from "./mdParser";

const sampleMarkdown = `---
title: Rust & Tauri Mastery Plan
description: 4-week roadmap to build high-performance desktop apps with Tauri v2 and Rust
tags:
  - rust
  - tauri
  - desktop
---

# Rust & Tauri Mastery Plan

## Module 1: Fundamentals
- [x] Install Rust toolchain and cargo
- [x] Learn Ownership & Borrowing rules
- [x] Build CLI calculator app
- [ ] Understand Lifetimes and Smart Pointers

## Module 2: Tauri v2 Architecture
- [x] Set up Tauri v2 React Vite boilerplate
- [x] Configure ACL security capabilities
- [ ] Connect SQLite plugin via IPC bridge
- [ ] Implement native OS notifications

## Module 3: Local AI Integration
- [ ] Set up Ollama HTTP bridge
- [ ] Prompt engineer Qwen2.5-Coder for structured JSON
- [ ] Implement DeepSeek-R1 CoT streaming parser
`;

describe("mdParser", () => {
  it("should extract frontmatter metadata correctly", () => {
    const result = parseLearningPlan(sampleMarkdown);

    expect(result.name).toBe("Rust & Tauri Mastery Plan");
    expect(result.description).toBe(
      "4-week roadmap to build high-performance desktop apps with Tauri v2 and Rust"
    );
    expect(result.tags).toEqual(["rust", "tauri", "desktop"]);
  });

  it("should accurately count completed and total checklist items", () => {
    const result = parseLearningPlan(sampleMarkdown);

    expect(result.total).toBe(11);
    expect(result.completed).toBe(5);
    expect(result.percentage).toBe(45);
  });

  it("should parse individual task items with correct done status", () => {
    const result = parseLearningPlan(sampleMarkdown);

    expect(result.tasks[0]).toEqual(
      expect.objectContaining({
        text: "Install Rust toolchain and cargo",
        done: true,
      })
    );
    expect(result.tasks[3]).toEqual(
      expect.objectContaining({
        text: "Understand Lifetimes and Smart Pointers",
        done: false,
      })
    );
  });

  it("should remove completed task line from raw markdown string", () => {
    const original = `- [x] Task 1\n- [ ] Task 2`;
    const updated = removeTaskFromMarkdown(original, "Task 1");

    expect(updated).not.toContain("Task 1");
    expect(updated).toContain("Task 2");
  });

  it("should handle markdown with no frontmatter gracefully", () => {
    const plainMd = `- [x] Task 1\n- [ ] Task 2`;
    const result = parseLearningPlan(plainMd, "Default Plan");

    expect(result.name).toBe("Default Plan");
    expect(result.completed).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it("should handle empty markdown files without division by zero", () => {
    const result = parseLearningPlan("");

    expect(result.completed).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
  });
});
