import { useState, useEffect, ChangeEvent } from "react";
import { parseLearningPlan, ParsedPlan } from "@/utils/mdParser";
import { parseAndPersistPlan } from "@/utils/planSync";
import { useSQLite } from "@/hooks/useSQLite";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  Square,
  FileText,
  Percent,
  RefreshCw,
  Tag,
  BarChart2,
  FolderOpen,
  Upload,
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

## Phase 3: Local AI Integration
- [ ] Implement Ollama bridge targeting qwen2.5-coder:7b
- [ ] Extract structured JSON (procrastination & delayed tasks)
- [ ] Implement DeepSeek-R1 CoT streaming weekly CBT report
`;

export default function LearningPlanList() {
  const { insertProgressLog, isReady } = useSQLite();
  const [rawMarkdown, setRawMarkdown] = useState<string>(SAMPLE_PLAN_MARKDOWN);
  const [plan, setPlan] = useState<ParsedPlan | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [openedFileName, setOpenedFileName] = useState<string | null>(null);

  // Parse and sync whenever rawMarkdown changes
  useEffect(() => {
    try {
      const fallbackName = openedFileName || "Learning Plan";
      const parsed = parseLearningPlan(rawMarkdown, fallbackName);
      setPlan(parsed);

      if (isReady && insertProgressLog) {
        setIsSyncing(true);
        parseAndPersistPlan(rawMarkdown, fallbackName, insertProgressLog)
          .catch((err) => console.warn("Plan sync warning:", err))
          .finally(() => setIsSyncing(false));
      }
    } catch (err) {
      console.error("Error in LearningPlanList useEffect:", err);
    }
  }, [rawMarkdown, isReady, insertProgressLog, openedFileName]);

  // Open file via native Tauri dialog or file picker with fallback
  const handleOpenFileDialog = async () => {
    try {
      // Dynamic import of Tauri dialog to prevent top-level module load failures outside desktop shell
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");

      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Markdown Learning Plans",
            extensions: ["md", "markdown"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const fileContent = await readTextFile(selected);
        const fileName = selected.split(/[\/\\]/).pop() || "Loaded Plan";
        setOpenedFileName(fileName);
        setRawMarkdown(fileContent);
        return;
      }
    } catch (err) {
      console.warn("Tauri native file picker dialog bypassed/fallback:", err);
    }

    // Trigger HTML input fallback if native dialog fails or is canceled
    document.getElementById("hidden-file-input")?.click();
  };

  const handleHTMLFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setOpenedFileName(file.name);
          setRawMarkdown(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleTask = (index: number) => {
    try {
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
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const activePlan = plan || parseLearningPlan(SAMPLE_PLAN_MARKDOWN, "Learning Plan");

  return (
    <div className="space-y-6">
      {/* Hidden File Input Fallback */}
      <input
        id="hidden-file-input"
        type="file"
        accept=".md,.markdown"
        onChange={handleHTMLFileInput}
        className="hidden"
      />

      {/* Header & Plan Summary */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {activePlan.name}
              </h2>
              {isSyncing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <RefreshCw className="size-3 animate-spin" /> SQLite synced
                </span>
              )}
            </div>
            {activePlan.description && (
              <p className="text-sm text-muted-foreground">
                {activePlan.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFileDialog}
              className="gap-2 text-xs font-semibold h-9"
            >
              <FolderOpen className="size-4 text-primary" />
              Open .md File
            </Button>

            <div className="text-right border-l border-border/60 pl-3">
              <div className="text-2xl font-extrabold text-foreground flex items-center justify-end gap-1">
                <span>{activePlan.percentage}%</span>
                <Percent className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                {activePlan.completed} of {activePlan.total} tasks completed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden p-0.5 border border-border/50">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary-light to-accent-app rounded-full transition-all duration-500 ease-out"
              style={{ width: `${activePlan.percentage}%` }}
            />
          </div>
        </div>

        {/* Tags */}
        {activePlan.tags && activePlan.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Tag className="size-3.5 text-muted-foreground" />
            {activePlan.tags.map((tag) => (
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
          <span className="flex items-center gap-1">
            <Upload className="size-3 text-primary" />
            {openedFileName ? `Loaded: ${openedFileName}` : "Viewing sample plan"}
          </span>
          <span className="font-mono text-emerald-400">
            {isReady ? "SQLite Snapshot Active" : "Initializing Database..."}
          </span>
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
          {activePlan.tasks && activePlan.tasks.length > 0 ? (
            activePlan.tasks.map((task, idx) => (
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
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No checklist tasks found in this markdown file. Add lines starting with <code className="font-mono text-primary">- [ ] task</code> to see them here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
