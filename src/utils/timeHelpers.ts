export interface ScheduleEntry {
  id: string;
  time: string; // e.g. "09:00" or "09:00-10:30"
  task: string;
  category?: string;
  done: boolean;
  snoozedUntil?: string; // Optional timestamp if snoozed
}

/**
 * Parses markdown table content (| Time | Task | Category |) into a typed schedule array.
 */
export function parseTimetable(markdownContent: string): ScheduleEntry[] {
  const lines = markdownContent.split("\n");
  const entries: ScheduleEntry[] = [];

  let isTable = false;
  let timeColIndex = -1;
  let taskColIndex = -1;
  let categoryColIndex = -1;
  let doneColIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for markdown table row syntax
    if (line.startsWith("|") && line.endsWith("|")) {
      const columns = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

      // Header row identification
      if (!isTable) {
        columns.forEach((col, idx) => {
          const lower = col.toLowerCase();
          if (lower.includes("time") || lower.includes("slot")) timeColIndex = idx;
          else if (lower.includes("task") || lower.includes("activity")) taskColIndex = idx;
          else if (lower.includes("category") || lower.includes("tag")) categoryColIndex = idx;
          else if (lower.includes("done") || lower.includes("status")) doneColIndex = idx;
        });

        // Default indices if header row didn't explicitly match keywords
        if (timeColIndex === -1 && columns.length >= 1) timeColIndex = 0;
        if (taskColIndex === -1 && columns.length >= 2) taskColIndex = 1;
        if (categoryColIndex === -1 && columns.length >= 3) categoryColIndex = 2;

        isTable = true;
        continue;
      }

      // Skip delimiter row (| --- | --- |)
      if (line.includes("---")) {
        continue;
      }

      // Data row extraction
      if (timeColIndex !== -1 && taskColIndex !== -1 && columns[timeColIndex]) {
        const timeStr = columns[timeColIndex];
        const taskStr = columns[taskColIndex] || "Scheduled Task";
        const categoryStr = categoryColIndex !== -1 ? columns[categoryColIndex] : undefined;

        let isDone = false;
        if (doneColIndex !== -1 && columns[doneColIndex]) {
          const doneVal = columns[doneColIndex].toLowerCase();
          isDone = doneVal === "x" || doneVal === "true" || doneVal === "yes" || doneVal === "done";
        } else if (taskStr.startsWith("[x]") || taskStr.startsWith("- [x]")) {
          isDone = true;
        }

        const cleanedTask = taskStr
          .replace(/^[-*]\s*\[[ xX]\]\s*/, "")
          .replace(/^\[[ xX]\]\s*/, "")
          .trim();

        entries.push({
          id: `entry-${i}-${timeStr}`,
          time: timeStr,
          task: cleanedTask,
          category: categoryStr,
          done: isDone,
        });
      }
    } else {
      // Table ended if blank or non-table line encountered
      if (line === "") {
        isTable = false;
      }
    }
  }

  return entries;
}

/**
 * Returns current local time in 24-hour HH:mm format (e.g., "14:30").
 */
export function getCurrentTimeSlot(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Checks if the current time matches a scheduled time slot (e.g. "09:00" or "09:00-10:00").
 */
export function isTimeMatchingNow(
  scheduledTime: string,
  currentTime = getCurrentTimeSlot()
): boolean {
  const cleanScheduled = scheduledTime.trim();

  // Range format: "09:00-10:30" -> start match on "09:00"
  if (cleanScheduled.includes("-")) {
    const startTime = cleanScheduled.split("-")[0].trim();
    return startTime === currentTime;
  }

  return cleanScheduled === currentTime;
}
