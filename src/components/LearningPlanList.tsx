import { useState, useEffect } from "react";
import { parseLearningPlan, ParsedPlan } from "@/utils/mdParser";
import { parseAndPersistPlan } from "@/utils/planSync";
import { useSQLite } from "@/hooks/useSQLite";
import {
  CheckSquare,
  Square,
  FileText,
  Percent,
  RefreshCw,
  Tag,
  BarChart2,
} from "lucide-react";

// Initial sample markdown plan
const SAMPLE_PLAN_MARKDOWN = `---
title: Rust & Tauri Desktop Engineering
description: 4-week intensive roadmap to master Tauri v2 desktop shell and local AI integrations
tags:
  - rust
  - tauri
  - react
  - sqlite
---

# Rust & Tauri Desktop Engineering

## Phase 1: Architecture & Scaffolding
- [x] Scaffold Tauri v2 React Vite TypeScript project
- [x] Configure Tailwind CSS v4 and shadcn/ui theme
- [x] Scope capabilities ACL for filesystem and notifications
- [x] Initialize SQLite schema for progress logs and reviews

## Phase 2: Core Data Engine
- [x] Implement regex-based markdown checklist parser
- [x] Wire parser output to SQLite progress_logs
- [ ] Connect Tauri notification plugin for scheduled reminders
- [ ] Build background interval scheduler hook

## Phase 3: Local LLM Orchestration
- [ ] Implement Ollama bridge targeting qwen2.5-coder:7b
- [ ] Extract structured JSON (procrastination & delayed tasks)
- [ ] Implement DeepSeek-R1 CoT streaming weekly CBT report
`;

export default function LearningPlanList() {
  const { insertProgressLog, isReady } = useSQLite();
  const [rawMarkdown, setRawMarkdown] = useState<string>(SAMPLE_PLAN_MARKDOWN);
  const [plan, setPlan] = useState<ParsedPlan | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Parse and sync whenever rawMarkdown changes
  useEffect(() => {
    const parsed = parseLearningPlan(rawMarkdown, "Learning Plan");
    setPlan(parsed);

    if (isReady) {
      setIsSyncing(true);
      parseAndPersistPlan(rawMarkdown, "Learning Plan", insertProgressLog).finally(
        () => setIsSyncing(false)
      );
    }
  }, [rawMarkdown, isReady, insertProgressLog]);

  const toggleTask = (index: number) => {
    const lines = rawMarkdown.split("\n");
    let taskCount = 0;

    const updatedLines = lines.map((line) => {
      const match = line.match(/^([\s]*[-*]\s+\[)([ xX])(\]\s+.+)$/);
      if (match) {
        if (taskCount === index) {
          const currentStatus = match[2].toLowerCase() === "x";
          const newStatus = currentStatus ? " " : "x";
          taskCount++;
          return `${match[1]}${newStatus}${match[3]}`;
        }
        taskCount++;
      }
      return line;
    });

    setRawMarkdown(updatedLines.join("\n"));
  };

  if (!plan) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Plan Summary */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {plan.name}
              </h2>
              {isSyncing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <RefreshCw className="size-3 animate-spin" /> SQLite synced
                </span>
              )}
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-extrabold text-foreground flex items-center justify-end gap-1">
                <span>{plan.percentage}%</span>
                <Percent className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                {plan.completed} of {plan.total} tasks completed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border/50">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary-light to-accent-app rounded-full transition-all duration-500 ease-out"
              style={{ width: `${plan.percentage}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Tag className="size-3.5 text-muted-foreground" />
            {plan.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium bg-secondary text-secondary-foreground px-2.5 py-0.5 rounded-md border border-border/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <span>Auto-synchronized with SQLite database</span>
          <span className="font-mono text-emerald-400">Snapshot Active</span>
        </div>
      </div>

      {/* Task Checklist Panel */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="size-5 text-accent-app" />
            Checklist Roadmap
          </h3>
          <span className="text-xs text-muted-foreground">
            Click tasks to toggle progress & update SQLite database
          </span>
        </div>

        <div className="divide-y divide-border/40 rounded-lg border border-border/60 overflow-hidden bg-background/50">
          {plan.tasks.map((task, idx) => (
            <button
              key={idx}
              onClick={() => toggleTask(idx)}
              className={`w-full flex items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 ${
                task.done ? "bg-muted/20" : ""
              }`}
            >
              {task.done ? (
                <CheckSquare className="size-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Square className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm ${
                  task.done
                    ? "line-through text-muted-foreground font-normal"
                    : "text-foreground font-medium"
                }`}
              >
                {task.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
