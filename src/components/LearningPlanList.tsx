import { useState } from "react";
import { useFolderPlans } from "@/hooks/useFolderPlans";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  RefreshCw,
  FileText,
  Tag,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  AlertCircle,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function LearningPlanList() {
  const {
    folderPath,
    plans,
    isLoading,
    error,
    selectFolder,
    scanFolder,
    markTaskCompletedAndRemoveFromDisk,
    unlockNextDay,
    lockDay,
  } = useFolderPlans();

  // State map to track collapsed state per section: key `${filePath}-day-${dayNum}` -> boolean
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (key: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Folder Control Banner */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Learning Plans Folder Engine
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {folderPath
              ? `Folder: ${folderPath}`
              : "Select a folder containing your .md learning plans to parse all plans simultaneously."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {folderPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scanFolder()}
              disabled={isLoading}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Re-scan Folder
            </Button>
          )}

          <Button
            onClick={selectFolder}
            disabled={isLoading}
            className="gap-2 font-semibold text-xs h-9"
          >
            <FolderOpen className="size-4" />
            {folderPath ? "Change Folder" : "Select Learning Plans Folder"}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-lg">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-Plan Display Grid */}
      {plans.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Displaying <strong className="text-foreground">{plans.length}</strong> active markdown learning plans simultaneously
            </span>
            <span className="font-mono text-emerald-400">Day 1 Auto-Filter Enabled</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {plans.map(({ filePath, fileName, parsedPlan, unlockedDay }) => {
              // Visible day sections (filter to unlocked days)
              const visibleSections = parsedPlan.daySections.filter(
                (s) => s.day <= unlockedDay
              );
              const totalDays = parsedPlan.totalDays || 1;
              const hasMoreDaysToUnlock = unlockedDay < totalDays;

              return (
                <div
                  key={filePath}
                  className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6"
                >
                  {/* Plan Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">
                          {parsedPlan.name}
                        </h3>
                        <span className="text-[11px] font-mono bg-secondary text-secondary-foreground border border-border/60 px-2 py-0.5 rounded">
                          {fileName}
                        </span>
                      </div>
                      {parsedPlan.description && (
                        <p className="text-xs text-muted-foreground">
                          {parsedPlan.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Day Unlock Status Indicator */}
                      <div className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-lg text-xs">
                        <Calendar className="size-3.5 text-accent-app" />
                        <span className="font-semibold text-foreground">
                          Unlocked: Day {unlockedDay} of {totalDays}
                        </span>
                        {hasMoreDaysToUnlock && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unlockNextDay(filePath)}
                            className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary-light"
                          >
                            <Unlock className="size-3" /> Unlock Day {unlockedDay + 1}
                          </Button>
                        )}
                        {unlockedDay > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => lockDay(filePath, unlockedDay - 1)}
                            className="h-6 text-[11px] px-2 gap-1 text-amber-400 hover:text-amber-300"
                            title="Re-lock the last unlocked day"
                          >
                            <Lock className="size-3" /> Re-lock Day {unlockedDay}
                          </Button>
                        )}
                      </div>

                      {/* Percentage Badge */}
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-foreground flex items-center justify-end gap-1">
                          <span>{parsedPlan.percentage}%</span>
                          <Percent className="size-3.5 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {parsedPlan.completed} / {parsedPlan.total} completed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {parsedPlan.tags && parsedPlan.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="size-3 text-muted-foreground" />
                      {parsedPlan.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded border border-border/40"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Day Sections & Tasks Checklist */}
                  <div className="space-y-4">
                    {visibleSections.length > 0 ? (
                      visibleSections.map((section) => {
                        const collapseKey = `${filePath}-day-${section.day}`;
                        const isCollapsed = Boolean(collapsedMap[collapseKey]);

                        // Clean title rendering: Day 1: or Day 1: Subtitle (no duplicated Day 1: Day 1)
                        const cleanHeaderTitle = `Day ${section.day}:${
                          section.title ? ` ${section.title}` : ""
                        }`;

                        return (
                          <div
                            key={section.day}
                            className="border border-border/60 rounded-xl overflow-hidden bg-background/40 transition-all"
                          >
                            {/* Collapsible Header Bar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border/40 select-none">
                              <button
                                onClick={() => toggleSectionCollapse(collapseKey)}
                                className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-light transition-colors text-left"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="size-4 text-muted-foreground" />
                                ) : (
                                  <ChevronUp className="size-4 text-muted-foreground" />
                                )}
                                <span>{cleanHeaderTitle}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {section.tasks.length} tasks
                                </span>
                                {section.day === unlockedDay && unlockedDay > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => lockDay(filePath, section.day - 1)}
                                    className="h-6 text-[10px] px-2 gap-1 text-amber-400 hover:bg-amber-500/10"
                                    title="Re-lock this day"
                                  >
                                    <Lock className="size-3" /> Re-lock
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Task List Body */}
                            {!isCollapsed && (
                              <div className="p-4 divide-y divide-border/30">
                                {section.tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="size-2 rounded-full bg-primary/60 shrink-0"></span>
                                      <span className="font-medium text-foreground">
                                        {task.text}
                                      </span>
                                    </div>

                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        markTaskCompletedAndRemoveFromDisk(
                                          filePath,
                                          task.text
                                        )
                                      }
                                      className="h-7 text-[11px] px-2.5 gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                    >
                                      <CheckCircle2 className="size-3" />
                                      <Trash2 className="size-3" />
                                      Complete & Remove from File
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground bg-secondary/20 rounded-lg">
                        No active tasks found for Day {unlockedDay}.
                      </div>
                    )}

                    {/* Locked Days Banner */}
                    {hasMoreDaysToUnlock && (
                      <div className="flex items-center justify-between p-3 bg-secondary/30 border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Lock className="size-4 text-amber-400" />
                          <span>
                            Days {unlockedDay + 1} to {totalDays} are locked for new plan files.
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unlockNextDay(filePath)}
                          className="h-7 text-xs gap-1.5"
                        >
                          <Unlock className="size-3 text-primary" />
                          Unlock Day {unlockedDay + 1}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12 px-4 border border-dashed border-border/60 rounded-xl bg-secondary/10 space-y-3">
            <FolderOpen className="size-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              {folderPath ? "No Markdown Files Found in Folder" : "No Folder Selected"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Select your learning plans directory. All <code className="font-mono text-primary">.md</code> files will be parsed simultaneously, filtering new files to Day 1 initially.
            </p>
            <Button onClick={selectFolder} className="gap-2 font-semibold text-xs mt-2">
              <FolderOpen className="size-4" />
              Choose Learning Plans Folder
            </Button>
          </div>
        )
      )}
    </div>
  );
}
