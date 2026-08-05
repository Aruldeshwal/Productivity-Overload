import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { parseTimetable } from "@/utils/timeHelpers";
import { useScheduler } from "@/hooks/useScheduler";
import { notifyUser } from "@/utils/notificationHelpers";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Bell,
  CheckCircle,
  Circle,
  AlarmClock,
  BellRing,
  CalendarDays,
  Tag,
  ArrowRight,
  FolderOpen,
  Edit3,
  Check,
} from "lucide-react";

const INITIAL_TIMETABLE_STORAGE_KEY = "productive_overload_timetable_markdown";

const DEFAULT_TIMETABLE_MARKDOWN = `
# Today's Timetable Schedule

| Time | Activity / Task | Category | Status |
| --- | --- | --- | --- |
| 08:30 | Morning Reflection & Daily Goal Setting | Mindset | x |
| 09:30 | Deep Work: Tauri v2 Plugin Architecture | Dev | [ ] |
| 11:30 | SQLite Database Query Optimization & Indexing | Database | [ ] |
| 14:00 | Local AI Orchestration (Qwen & DeepSeek) | AI | [ ] |
| 16:30 | Recharts Progress Dashboard Integration | Frontend | [ ] |
| 19:00 | Nightly CBT Self-Reflection & Log Entry | Wellness | [ ] |
`;

export default function TimetableReminders() {
  const [markdown, setMarkdown] = useState<string>(() => {
    return (
      localStorage.getItem(INITIAL_TIMETABLE_STORAGE_KEY) ||
      DEFAULT_TIMETABLE_MARKDOWN
    );
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [openedFileName, setOpenedFileName] = useState<string | null>(null);

  const initialParsed = useMemo(() => parseTimetable(markdown), [markdown]);

  const {
    schedule,
    setSchedule,
    currentTime,
    activeTask,
    nextTask,
    toggleTaskDone,
    snoozeTask,
  } = useScheduler({
    initialSchedule: initialParsed,
  });

  // Re-sync schedule and persist when markdown changes
  useEffect(() => {
    const updated = parseTimetable(markdown);
    setSchedule(updated);
    localStorage.setItem(INITIAL_TIMETABLE_STORAGE_KEY, markdown);
  }, [markdown, setSchedule]);

  const handleOpenTimetableFile = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");

      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Markdown Timetable",
            extensions: ["md", "markdown", "txt"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const fileContent = await readTextFile(selected);
        const fileName = selected.split(/[\/\\]/).pop() || "Timetable File";
        setOpenedFileName(fileName);
        setMarkdown(fileContent);
        return;
      }
    } catch (err) {
      console.warn("Native file picker fallback:", err);
    }

    document.getElementById("hidden-timetable-input")?.click();
  };

  const handleHTMLFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setOpenedFileName(file.name);
          setMarkdown(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTestNotification = async () => {
    await notifyUser(
      "Productive Overload Reminder",
      "Native desktop notifications are active! Next task scheduled at " +
        (nextTask ? nextTask.time : currentTime)
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <input
        id="hidden-timetable-input"
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleHTMLFileInput}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Timetable & Native Reminders
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            30-second interval background clock triggering OS desktop notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenTimetableFile}
            className="gap-1.5 text-xs h-9"
          >
            <FolderOpen className="size-3.5 text-primary" />
            {openedFileName ? openedFileName : "Open .md Timetable"}
          </Button>

          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5 text-xs h-9"
          >
            {isEditing ? <Check className="size-3.5" /> : <Edit3 className="size-3.5" />}
            {isEditing ? "Save & Apply Schedule" : "Edit Raw Table"}
          </Button>

          <div className="text-right border-l border-border/60 pl-3">
            <span className="text-[10px] text-muted-foreground">Current Time</span>
            <div className="text-sm font-mono font-bold text-primary flex items-center gap-1">
              <Clock className="size-3.5 text-accent-app" />
              {currentTime}
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTestNotification}
            className="gap-1.5 text-xs h-9"
          >
            <BellRing className="size-3.5 text-amber-400" />
            Test OS Notification
          </Button>
        </div>
      </div>

      {/* Raw Markdown Editor Area */}
      {isEditing && (
        <div className="bg-background border border-primary/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Edit3 className="size-3.5" />
              Markdown Table Schedule Format (| Time | Activity | Category |)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Edits save automatically to local storage
            </span>
          </div>

          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={8}
            className="w-full font-mono text-xs p-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="| 09:00 | Deep Work Task | Category |"
          />
        </div>
      )}

      {/* Active & Next Task Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Task Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Bell className="size-3.5 animate-bounce text-amber-400" />
              Currently Active Time Slot
            </span>
            <span className="text-xs font-mono font-semibold text-primary">
              {currentTime}
            </span>
          </div>

          {activeTask ? (
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-foreground">
                {activeTask.task}
              </h4>
              {activeTask.category && (
                <span className="inline-block text-[11px] font-medium bg-primary/20 text-primary-foreground px-2 py-0.5 rounded">
                  {activeTask.category}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No active task scheduled for current time ({currentTime}).
            </p>
          )}
        </div>

        {/* Next Task Banner */}
        <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="size-3.5 text-accent-app" />
              Next Scheduled Task
            </span>
            {nextTask && (
              <span className="text-xs font-mono font-semibold text-accent-app">
                {nextTask.time}
              </span>
            )}
          </div>

          {nextTask ? (
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-foreground">
                {nextTask.task}
              </h4>
              {nextTask.category && (
                <span className="inline-block text-[11px] font-medium bg-secondary text-secondary-foreground border border-border/60 px-2 py-0.5 rounded">
                  {nextTask.category}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No upcoming tasks remaining today.
            </p>
          )}
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            Today's Schedule Items ({schedule.length})
          </h3>
        </div>

        <div className="divide-y divide-border/40 rounded-xl border border-border/60 overflow-hidden bg-background/40">
          {schedule.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                item.done ? "bg-muted/20 opacity-70" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskDone(item.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.done ? (
                    <CheckCircle className="size-5 text-emerald-400" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                </button>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {item.time}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        item.done
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.task}
                    </span>
                  </div>

                  {item.category && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5">
                      <Tag className="size-3" />
                      <span>{item.category}</span>
                      {item.snoozedUntil && (
                        <span className="text-amber-400 font-mono ml-2">
                          (Snoozed until {item.snoozedUntil})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => snoozeTask(item.id, 15)}
                  disabled={item.done}
                  className="text-xs h-7 gap-1"
                >
                  <AlarmClock className="size-3 text-amber-400" />
                  Snooze +15m
                </Button>

                <Button
                  variant={item.done ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => toggleTaskDone(item.id)}
                  className="text-xs h-7"
                >
                  {item.done ? "Reopen" : "Mark Done"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
