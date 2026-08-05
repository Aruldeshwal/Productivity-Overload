import matter from "gray-matter";

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  itemType: "day" | "week" | "month" | "daily_recurring"; // Everyday, weekly, monthly, and recurring daily tasks
  number: number; // Day, Week, or Month number (1, 2, 3...)
  day: number; // Backwards compatibility alias
  sectionTitle?: string;
  rawLine: string;
}

export interface SectionBlock {
  type: "day" | "week" | "month" | "daily_recurring";
  number: number;
  title: string;
  tasks: TaskItem[];
}

export interface ParsedPlan {
  name: string;
  description?: string;
  tags?: string[];
  filePath?: string;
  completed: number;
  total: number;
  percentage: number;
  currentUnlockedDay: number;
  currentUnlockedWeek: number;
  currentUnlockedMonth: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  tasks: TaskItem[];
  daySections: SectionBlock[];
  weekSections: SectionBlock[];
  monthSections: SectionBlock[];
  dailyRecurringSections: SectionBlock[];
}

/**
 * Parse a markdown learning plan file with Day, Week, Month, and Daily Recurring tracking support.
 *
 * Scans headers like:
 * `## Day 1: Rust Basics` -> Everyday tasks section
 * `## Week 1: Master Concurrency` -> Weekly objective section
 * `## Month 1: System Architecture` -> Monthly objective section
 * `## Daily Day 1: Core Habits` -> Special case recurring daily section (tasks get renewed & header advances to Day 2)
 */
export function parseLearningPlan(
  content: string,
  fallbackName = "Untitled Plan",
  filePath?: string,
  unlockedDay = 1,
  unlockedWeek = 1,
  unlockedMonth = 1
): ParsedPlan {
  let name = fallbackName;
  let description: string | undefined = undefined;
  let tags: string[] | undefined = undefined;
  let body = content || "";

  try {
    if (content && typeof content === "string") {
      const parsedMatter = matter(content);
      const frontmatter = parsedMatter.data || {};
      body = parsedMatter.content || content;

      if (frontmatter.title && typeof frontmatter.title === "string") {
        name = frontmatter.title;
      } else if (frontmatter.name && typeof frontmatter.name === "string") {
        name = frontmatter.name;
      }

      if (frontmatter.description && typeof frontmatter.description === "string") {
        description = frontmatter.description;
      }

      if (Array.isArray(frontmatter.tags)) {
        tags = frontmatter.tags.map(String);
      }
    }
  } catch (err) {
    console.warn("gray-matter parse warning:", err);
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      name = titleMatch[1].replace(/['"]/g, "").trim();
    }
  }

  const lines = body.split("\n");
  const tasks: TaskItem[] = [];

  const daySectionsMap = new Map<number, SectionBlock>();
  const weekSectionsMap = new Map<number, SectionBlock>();
  const monthSectionsMap = new Map<number, SectionBlock>();
  const dailyRecurringMap = new Map<number, SectionBlock>();

  let currentType: "day" | "week" | "month" | "daily_recurring" = "day";
  let currentNumber = 1;
  let currentSectionTitle = "";

  let maxDayFound = 1;
  let maxWeekFound = 1;
  let maxMonthFound = 1;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // 1. Check for Special Case: ## Daily Day N: or ## Daily
    const dailyRecurringMatch = trimmed.match(/^#{1,4}\s+Daily(?:\s+Day)?\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // 2. Check for Month header (e.g. ## Month 1, ### Month 2: Architecture)
    const monthHeaderMatch = trimmed.match(/^#{1,4}\s+Month\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // 3. Check for Week header (e.g. ## Week 1, ### Week 2: Build App)
    const weekHeaderMatch = trimmed.match(/^#{1,4}\s+Week\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // 4. Check for Day header (e.g. ## Day 1, ### Day 2: Rust Basics, Phase 1 / Module 1)
    const dayHeaderMatch = trimmed.match(/^#{1,4}\s+(?:Phase\s+\d+:?\s*)?(?:Day|Module)\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);

    if (dailyRecurringMatch) {
      currentType = "daily_recurring";
      const parsedNum = parseInt(dailyRecurringMatch[1], 10);
      currentNumber = !isNaN(parsedNum) ? parsedNum : 1;

      let extra = (dailyRecurringMatch[2] || "").trim();
      extra = extra.replace(/^Day\s+\d+:?\s*/i, "").replace(/^[-:]\s*/, "").trim();
      currentSectionTitle = extra;
    } else if (monthHeaderMatch) {
      currentType = "month";
      const parsedNum = parseInt(monthHeaderMatch[1], 10);
      currentNumber = !isNaN(parsedNum) ? parsedNum : maxMonthFound + 1;
      maxMonthFound = Math.max(maxMonthFound, currentNumber);

      let extra = (monthHeaderMatch[2] || "").trim();
      extra = extra.replace(/^Month\s+\d+:?\s*/i, "").replace(/^[-:]\s*/, "").trim();
      currentSectionTitle = extra;
    } else if (weekHeaderMatch) {
      currentType = "week";
      const parsedNum = parseInt(weekHeaderMatch[1], 10);
      currentNumber = !isNaN(parsedNum) ? parsedNum : maxWeekFound + 1;
      maxWeekFound = Math.max(maxWeekFound, currentNumber);

      let extra = (weekHeaderMatch[2] || "").trim();
      extra = extra.replace(/^Week\s+\d+:?\s*/i, "").replace(/^[-:]\s*/, "").trim();
      currentSectionTitle = extra;
    } else if (dayHeaderMatch) {
      currentType = "day";
      const parsedNum = parseInt(dayHeaderMatch[1], 10);
      currentNumber = !isNaN(parsedNum) ? parsedNum : maxDayFound + 1;
      maxDayFound = Math.max(maxDayFound, currentNumber);

      let extra = (dayHeaderMatch[2] || "").trim();
      extra = extra.replace(/^Day\s+\d+:?\s*/i, "").replace(/^[-:]\s*/, "").trim();
      currentSectionTitle = extra;
    }

    // Check for checklist items
    const checklistMatch = line.match(/^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checklistMatch) {
      const isDone = checklistMatch[1].toLowerCase() === "x";
      const text = checklistMatch[2].trim();
      const taskId = `task-${lineIdx}-${currentType}-${currentNumber}-${text.slice(0, 15)}`;

      const taskObj: TaskItem = {
        id: taskId,
        text,
        done: isDone,
        itemType: currentType,
        number: currentNumber,
        day: currentType === "day" ? currentNumber : 1,
        sectionTitle: currentSectionTitle,
        rawLine: line,
      };

      tasks.push(taskObj);

      if (currentType === "daily_recurring") {
        if (!dailyRecurringMap.has(currentNumber)) {
          dailyRecurringMap.set(currentNumber, {
            type: "daily_recurring",
            number: currentNumber,
            title: currentSectionTitle,
            tasks: [],
          });
        }
        dailyRecurringMap.get(currentNumber)!.tasks.push(taskObj);
      } else if (currentType === "month") {
        if (!monthSectionsMap.has(currentNumber)) {
          monthSectionsMap.set(currentNumber, {
            type: "month",
            number: currentNumber,
            title: currentSectionTitle,
            tasks: [],
          });
        }
        monthSectionsMap.get(currentNumber)!.tasks.push(taskObj);
      } else if (currentType === "week") {
        if (!weekSectionsMap.has(currentNumber)) {
          weekSectionsMap.set(currentNumber, {
            type: "week",
            number: currentNumber,
            title: currentSectionTitle,
            tasks: [],
          });
        }
        weekSectionsMap.get(currentNumber)!.tasks.push(taskObj);
      } else {
        if (!daySectionsMap.has(currentNumber)) {
          daySectionsMap.set(currentNumber, {
            type: "day",
            number: currentNumber,
            title: currentSectionTitle,
            tasks: [],
          });
        }
        daySectionsMap.get(currentNumber)!.tasks.push(taskObj);
      }
    }
  });

  const daySections = Array.from(daySectionsMap.values()).sort((a, b) => a.number - b.number);
  const weekSections = Array.from(weekSectionsMap.values()).sort((a, b) => a.number - b.number);
  const monthSections = Array.from(monthSectionsMap.values()).sort((a, b) => a.number - b.number);
  const dailyRecurringSections = Array.from(dailyRecurringMap.values()).sort((a, b) => a.number - b.number);

  if (daySections.length === 0 && weekSections.length === 0 && monthSections.length === 0 && dailyRecurringSections.length === 0 && tasks.length > 0) {
    daySections.push({
      type: "day",
      number: 1,
      title: "",
      tasks: [...tasks],
    });
  }

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    name,
    description,
    tags,
    filePath,
    completed,
    total,
    percentage,
    currentUnlockedDay: unlockedDay,
    currentUnlockedWeek: unlockedWeek,
    currentUnlockedMonth: unlockedMonth,
    totalDays: maxDayFound,
    totalWeeks: maxWeekFound,
    totalMonths: maxMonthFound,
    tasks,
    daySections,
    weekSections,
    monthSections,
    dailyRecurringSections,
  };
}

/**
 * Removes a completed task line from the raw markdown string.
 * Also checks if a Phase has only Daily tasks left, and if so, removes that non-last Phase entirely!
 */
export function removeTaskFromMarkdown(rawContent: string, taskText: string): string {
  const lines = rawContent.split("\n");
  const filteredLines = lines.filter((line) => {
    const isTaskLine = /^[\s]*[-*]\s+\[[ xX]\]/.test(line.trim());
    if (isTaskLine && line.includes(taskText)) {
      return false;
    }
    return true;
  });

  const intermediate = filteredLines.join("\n");
  return checkAndCleanCompletedPhasesInMarkdown(intermediate);
}

/**
 * Checks Phase headers (`## Phase 1`, `## Phase 2`, etc.).
 *
 * Special Rule:
 * If Phase N only has `## Daily` tasks left (no non-daily tasks remaining)
 * AND there is a subsequent Phase N+1 after it (i.e. it is NOT the last phase),
 * then remove Phase N entirely from the markdown file!
 *
 * LAST PHASE GUARANTEE: If it is the last phase, it MUST NOT be removed even if all tasks are done.
 */
export function checkAndCleanCompletedPhasesInMarkdown(rawContent: string): string {
  const lines = rawContent.split("\n");

  // Find all Phase header line indices
  interface PhaseSpan {
    index: number; // phase index (0-based)
    phaseHeaderLineIndex: number;
    headerLineText: string;
    endLineIndex: number;
    nonDailyTaskCount: number;
  }

  const phaseHeaderIndices: number[] = [];
  lines.forEach((line, idx) => {
    if (/^#{1,4}\s+Phase\s+\d+/i.test(line.trim())) {
      phaseHeaderIndices.push(idx);
    }
  });

  // If 0 or 1 Phase found, no preceding Phase cleanup is needed
  if (phaseHeaderIndices.length <= 1) {
    return rawContent;
  }

  const phaseSpans: PhaseSpan[] = [];
  const totalPhases = phaseHeaderIndices.length;

  phaseHeaderIndices.forEach((startLineIdx, pIdx) => {
    const endLineIdx = pIdx < totalPhases - 1 ? phaseHeaderIndices[pIdx + 1] : lines.length;
    const phaseLines = lines.slice(startLineIdx, endLineIdx);

    let nonDailyTaskCount = 0;
    let currentBlockType: "daily" | "other" = "other";

    phaseLines.forEach((pLine) => {
      const trimmed = pLine.trim();

      if (/^#{1,4}\s+Daily/i.test(trimmed)) {
        currentBlockType = "daily";
      } else if (/^#{1,4}\s+(Day|Week|Month|Module)/i.test(trimmed)) {
        currentBlockType = "other";
      }

      const isTaskLine = /^[\s]*[-*]\s+\[[ xX]\]/.test(trimmed);
      if (isTaskLine && currentBlockType !== "daily") {
        nonDailyTaskCount++;
      }
    });

    phaseSpans.push({
      index: pIdx,
      phaseHeaderLineIndex: startLineIdx,
      headerLineText: lines[startLineIdx],
      endLineIndex: endLineIdx,
      nonDailyTaskCount,
    });
  });

  // Determine lines to delete: Any phase span BEFORE the last phase (pIdx < totalPhases - 1) that has nonDailyTaskCount === 0
  const linesToDelete = new Set<number>();

  phaseSpans.forEach((span) => {
    const isLastPhase = span.index === totalPhases - 1;

    // Remove phase if NOT the last phase AND has 0 non-daily tasks left
    if (!isLastPhase && span.nonDailyTaskCount === 0) {
      for (let i = span.phaseHeaderLineIndex; i < span.endLineIndex; i++) {
        linesToDelete.add(i);
      }
    }
  });

  if (linesToDelete.size === 0) {
    return rawContent;
  }

  const resultLines = lines.filter((_, idx) => !linesToDelete.has(idx));
  return resultLines.join("\n");
}

/**
 * Renews Special Case Daily Recurring Tasks in the markdown file.
 */
export function renewDailyTasksInMarkdown(rawContent: string): string {
  const lines = rawContent.split("\n");
  let inDailySection = false;

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();

    const dailyMatch = trimmed.match(/^(#{1,4}\s+Daily(?:\s+Day)?)\s*(\d+)?(:?.*)$/i);
    if (dailyMatch) {
      inDailySection = true;
      const currentNum = parseInt(dailyMatch[2], 10) || 1;
      const nextNum = currentNum + 1;
      const rest = dailyMatch[3] || "";

      const hasColon = rest.startsWith(":");
      const extraTitle = hasColon ? rest.substring(1).trim() : rest.trim();

      return `## Daily Day ${nextNum}:${extraTitle ? ` ${extraTitle}` : ""}`;
    }

    if (trimmed.startsWith("#") && !dailyMatch) {
      inDailySection = false;
    }

    if (inDailySection) {
      return line.replace(/^([\s]*[-*]\s+\[)[xX](\]\s+.+)$/, "$1 $2");
    }

    return line;
  });

  return updatedLines.join("\n");
}

/**
 * Toggles a daily recurring task checkbox state in memory without removing the line.
 */
export function toggleTaskInMarkdown(rawContent: string, taskText: string): string {
  const lines = rawContent.split("\n");
  const updatedLines = lines.map((line) => {
    const checklistMatch = line.match(/^([\s]*[-*]\s+\[)([ xX])(\]\s+.+)$/);
    if (checklistMatch && line.includes(taskText)) {
      const currentDone = checklistMatch[2].toLowerCase() === "x";
      const newDoneChar = currentDone ? " " : "x";
      return `${checklistMatch[1]}${newDoneChar}${checklistMatch[3]}`;
    }
    return line;
  });

  return updatedLines.join("\n");
}
