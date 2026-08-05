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
  Target,
  RotateCw,
  CheckSquare,
  Square,
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
    toggleDailyTask,
    renewDailyRecurringTasks,
    unlockNextDay,
    lockDay,
    unlockNextWeek,
    lockWeek,
  } = useFolderPlans();

  // State map to track collapsed state per section: key `${filePath}-${type}-${num}` -> boolean
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  // View mode tab state: "both" | "daily" | "weekly" | "recurring"
  const [activeTab, setActiveTab] = useState<"both" | "daily" | "weekly" | "recurring">("both");

  const toggleSectionCollapse = (key: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Folder Control & View Filter Banner */}
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Entity View Filter Switch */}
          <div className="bg-secondary p-1 rounded-lg border border-border flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab("both")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeTab === "both"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Entities
            </button>
            <button
              onClick={() => setActiveTab("recurring")}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                activeTab === "recurring"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <RotateCw className="size-3" /> Daily Habits
            </button>
            <button
              onClick={() => setActiveTab("daily")}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                activeTab === "daily"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="size-3" /> Daily Tasks
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                activeTab === "weekly"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Target className="size-3" /> Weekly
            </button>
          </div>

          {folderPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => scanFolder()}
              disabled={isLoading}
              className="gap-1.5 text-xs h-9"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Re-scan
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
              Displaying <strong className="text-foreground">{plans.length}</strong> active markdown plans simultaneously
            </span>
            <span className="font-mono text-emerald-400">Daily Recurring Habits Enabled</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {plans.map(({ filePath, fileName, parsedPlan, unlockedDay, unlockedWeek }) => {
              const visibleDaySections = parsedPlan.daySections.filter(
                (s) => s.number <= unlockedDay
              );
              const visibleWeekSections = parsedPlan.weekSections.filter(
                (s) => s.number <= unlockedWeek
              );

              const totalDays = parsedPlan.totalDays || 1;
              const totalWeeks = parsedPlan.totalWeeks || 1;

              const hasMoreDays = unlockedDay < totalDays;
              const hasMoreWeeks = unlockedWeek < totalWeeks;

              const showDaily = activeTab === "both" || activeTab === "daily";
              const showWeekly = activeTab === "both" || activeTab === "weekly";
              const showRecurring = activeTab === "both" || activeTab === "recurring";

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

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Day Tracker Badge */}
                      <div className="flex items-center gap-1.5 bg-secondary/50 border border-border px-2.5 py-1 rounded-lg text-xs">
                        <Calendar className="size-3.5 text-primary" />
                        <span className="font-semibold text-foreground">
                          Day {unlockedDay}/{totalDays}
                        </span>
                        {hasMoreDays && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unlockNextDay(filePath)}
                            className="h-5 text-[10px] px-1.5 gap-0.5 text-primary"
                          >
                            <Unlock className="size-2.5" /> +1
                          </Button>
                        )}
                        {unlockedDay > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => lockDay(filePath, unlockedDay - 1)}
                            className="h-5 text-[10px] px-1.5 text-amber-400"
                            title="Re-lock day"
                          >
                            <Lock className="size-2.5" />
                          </Button>
                        )}
                      </div>

                      {/* Week Tracker Badge */}
                      {parsedPlan.weekSections.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-secondary/50 border border-border px-2.5 py-1 rounded-lg text-xs">
                          <Target className="size-3.5 text-accent-app" />
                          <span className="font-semibold text-foreground">
                            Week {unlockedWeek}/{totalWeeks}
                          </span>
                          {hasMoreWeeks && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unlockNextWeek(filePath)}
                              className="h-5 text-[10px] px-1.5 gap-0.5 text-accent-app"
                            >
                              <Unlock className="size-2.5" /> +1
                            </Button>
                          )}
                          {unlockedWeek > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => lockWeek(filePath, unlockedWeek - 1)}
                              className="h-5 text-[10px] px-1.5 text-amber-400"
                              title="Re-lock week"
                            >
                              <Lock className="size-2.5" />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Overall Progress Percentage */}
                      <div className="text-right border-l border-border/60 pl-3">
                        <div className="text-xl font-extrabold text-foreground flex items-center justify-end gap-0.5">
                          <span>{parsedPlan.percentage}%</span>
                          <Percent className="size-3.5 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {parsedPlan.completed}/{parsedPlan.total} done
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

                  {/* Sections Display Grid */}
                  <div className="space-y-6">
                    {/* 🔄 SPECIAL CASE: DAILY RECURRING HABITS (## Daily Day N:) */}
                    {showRecurring && parsedPlan.dailyRecurringSections.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                            <RotateCw className="size-4 text-emerald-400" />
                            Daily Recurring Habits & Trackers
                          </h4>
                          <span className="text-[11px] text-emerald-400/80 font-mono">
                            Auto-renews to Day N+1 without line deletion
                          </span>
                        </div>

                        {parsedPlan.dailyRecurringSections.map((section) => {
                          const collapseKey = `${filePath}-recurring-${section.number}`;
                          const isCollapsed = Boolean(collapsedMap[collapseKey]);
                          const headerTitle = `Daily Day ${section.number}:${
                            section.title ? ` ${section.title}` : ""
                          }`;

                          const allCompleted =
                            section.tasks.length > 0 &&
                            section.tasks.every((t) => t.done);

                          return (
                            <div
                              key={`recurring-${section.number}`}
                              className="border border-emerald-500/40 rounded-xl overflow-hidden bg-emerald-950/20 transition-all shadow-sm"
                            >
                              <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 select-none">
                                <button
                                  onClick={() => toggleSectionCollapse(collapseKey)}
                                  className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:opacity-80 transition-opacity text-left"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="size-4 text-emerald-400/60" />
                                  ) : (
                                    <ChevronUp className="size-4 text-emerald-400/60" />
                                  )}
                                  <span>{headerTitle}</span>
                                </button>

                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-emerald-300/70 font-mono">
                                    {section.tasks.filter((t) => t.done).length}/
                                    {section.tasks.length} filled
                                  </span>

                                  <Button
                                    size="sm"
                                    onClick={() => renewDailyRecurringTasks(filePath)}
                                    className={`h-7 text-[11px] px-3 gap-1.5 font-bold transition-all ${
                                      allCompleted
                                        ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 animate-pulse shadow-md"
                                        : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                                    }`}
                                    title="Advances header to ## Daily Day N+1: and resets checkboxes for tomorrow"
                                  >
                                    <RotateCw className="size-3" />
                                    Renew for Day {section.number + 1}
                                  </Button>
                                </div>
                              </div>

                              {!isCollapsed && (
                                <div className="p-4 divide-y divide-emerald-500/15">
                                  {section.tasks.map((task) => (
                                    <button
                                      key={task.id}
                                      onClick={() => toggleDailyTask(filePath, task.text)}
                                      className="w-full py-2.5 flex items-center justify-between gap-3 text-xs text-left hover:bg-emerald-500/5 px-2 rounded-lg transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        {task.done ? (
                                          <CheckSquare className="size-4 text-emerald-400 shrink-0" />
                                        ) : (
                                          <Square className="size-4 text-emerald-500/40 shrink-0" />
                                        )}
                                        <span
                                          className={`font-medium ${
                                            task.done
                                              ? "line-through text-emerald-200/50"
                                              : "text-emerald-100"
                                          }`}
                                        >
                                          {task.text}
                                        </span>
                                      </div>

                                      <span className="text-[10px] text-emerald-400/60 font-mono">
                                        {task.done ? "Filled for Day " + section.number : "Click to check"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* WEEKLY OBJECTIVES SECTION */}
                    {showWeekly && parsedPlan.weekSections.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <h4 className="text-sm font-bold text-accent-app flex items-center gap-1.5">
                            <Target className="size-4 text-accent-app" />
                            Weekly Objectives
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {visibleWeekSections.length} of {totalWeeks} weeks active
                          </span>
                        </div>

                        {visibleWeekSections.map((section) => {
                          const collapseKey = `${filePath}-week-${section.number}`;
                          const isCollapsed = Boolean(collapsedMap[collapseKey]);
                          const headerTitle = `Week ${section.number}:${
                            section.title ? ` ${section.title}` : ""
                          }`;

                          return (
                            <div
                              key={`week-${section.number}`}
                              className="border border-accent-app/30 rounded-xl overflow-hidden bg-accent-app/5 transition-all"
                            >
                              <div className="flex items-center justify-between px-4 py-2.5 bg-accent-app/10 border-b border-accent-app/20 select-none">
                                <button
                                  onClick={() => toggleSectionCollapse(collapseKey)}
                                  className="flex items-center gap-2 text-xs font-bold text-accent-app hover:opacity-80 transition-opacity text-left"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronUp className="size-4 text-muted-foreground" />
                                  )}
                                  <span>{headerTitle}</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    {section.tasks.length} goals
                                  </span>
                                  {section.number === unlockedWeek && unlockedWeek > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => lockWeek(filePath, section.number - 1)}
                                      className="h-6 text-[10px] px-2 gap-1 text-amber-400 hover:bg-amber-500/10"
                                      title="Re-lock week"
                                    >
                                      <Lock className="size-3" /> Re-lock
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {!isCollapsed && (
                                <div className="p-4 divide-y divide-border/30">
                                  {section.tasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span className="size-2 rounded-full bg-accent-app shrink-0"></span>
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
                                        Complete & Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {hasMoreWeeks && (
                          <div className="flex items-center justify-between p-3 bg-accent-app/5 border border-dashed border-accent-app/30 rounded-xl text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Lock className="size-4 text-amber-400" />
                              <span>Weeks {unlockedWeek + 1} to {totalWeeks} locked</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unlockNextWeek(filePath)}
                              className="h-7 text-xs gap-1.5"
                            >
                              <Unlock className="size-3 text-accent-app" />
                              Unlock Week {unlockedWeek + 1}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EVERYDAY TASKS SECTION */}
                    {showDaily && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <h4 className="text-sm font-bold text-primary flex items-center gap-1.5">
                            <Calendar className="size-4 text-primary" />
                            Everyday Tasks
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {visibleDaySections.length} of {totalDays} days active
                          </span>
                        </div>

                        {visibleDaySections.map((section) => {
                          const collapseKey = `${filePath}-day-${section.number}`;
                          const isCollapsed = Boolean(collapsedMap[collapseKey]);
                          const headerTitle = `Day ${section.number}:${
                            section.title ? ` ${section.title}` : ""
                          }`;

                          return (
                            <div
                              key={`day-${section.number}`}
                              className="border border-border/60 rounded-xl overflow-hidden bg-background/40 transition-all"
                            >
                              <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30 border-b border-border/40 select-none">
                                <button
                                  onClick={() => toggleSectionCollapse(collapseKey)}
                                  className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-light transition-colors text-left"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronUp className="size-4 text-muted-foreground" />
                                  )}
                                  <span>{headerTitle}</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    {section.tasks.length} tasks
                                  </span>
                                  {section.number === unlockedDay && unlockedDay > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => lockDay(filePath, section.number - 1)}
                                      className="h-6 text-[10px] px-2 gap-1 text-amber-400 hover:bg-amber-500/10"
                                      title="Re-lock day"
                                    >
                                      <Lock className="size-3" /> Re-lock
                                    </Button>
                                  )}
                                </div>
                              </div>

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
                                        Complete & Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {hasMoreDays && (
                          <div className="flex items-center justify-between p-3 bg-secondary/30 border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Lock className="size-4 text-amber-400" />
                              <span>Days {unlockedDay + 1} to {totalDays} locked</span>
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
              Select your learning plans directory. Supports <code className="font-mono text-emerald-400">## Daily Day 1:</code> recurring habits, <code className="font-mono text-primary">## Day 1</code> tasks, and <code className="font-mono text-accent-app">## Week 1</code> objectives.
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
