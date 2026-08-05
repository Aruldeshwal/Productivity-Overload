import matter from "gray-matter";

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  itemType: "day" | "week" | "daily_recurring"; // Distinguishes everyday, weekly, and recurring daily tasks
  number: number; // Day number or Week number (1, 2, 3...)
  day: number; // Backwards compatibility alias
  sectionTitle?: string;
  rawLine: string;
}

export interface SectionBlock {
  type: "day" | "week" | "daily_recurring";
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
  totalDays: number;
  totalWeeks: number;
  tasks: TaskItem[];
  daySections: SectionBlock[];
  weekSections: SectionBlock[];
  dailyRecurringSections: SectionBlock[];
}

/**
 * Parse a markdown learning plan file with Day, Week, and Daily Recurring tracking support.
 *
 * Scans headers like:
 * `## Day 1: Rust Basics` -> Everyday tasks section (lines get stripped on completion)
 * `## Week 1: Master Concurrency` -> Weekly objective section (lines get stripped on completion)
 * `## Daily Day 1: Core Habits` -> Special case recurring daily section (tasks get renewed & header advances to Day 2)
 */
export function parseLearningPlan(
  content: string,
  fallbackName = "Untitled Plan",
  filePath?: string,
  unlockedDay = 1,
  unlockedWeek = 1
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
  const dailyRecurringMap = new Map<number, SectionBlock>();

  let currentType: "day" | "week" | "daily_recurring" = "day";
  let currentNumber = 1;
  let currentSectionTitle = "";

  let maxDayFound = 1;
  let maxWeekFound = 1;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // 1. Check for Special Case: ## Daily Day N: or ## Daily
    const dailyRecurringMatch = trimmed.match(/^#{1,4}\s+Daily(?:\s+Day)?\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // 2. Check for Week header (e.g. ## Week 1, ### Week 2: Build App)
    const weekHeaderMatch = trimmed.match(/^#{1,4}\s+Week\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // 3. Check for Day header (e.g. ## Day 1, ### Day 2: Rust Basics, Phase 1 / Module 1)
    const dayHeaderMatch = trimmed.match(/^#{1,4}\s+(?:Phase\s+\d+:?\s*)?(?:Day|Module)\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);

    if (dailyRecurringMatch) {
      currentType = "daily_recurring";
      const parsedNum = parseInt(dailyRecurringMatch[1], 10);
      currentNumber = !isNaN(parsedNum) ? parsedNum : 1;

      let extra = (dailyRecurringMatch[2] || "").trim();
      extra = extra.replace(/^Day\s+\d+:?\s*/i, "").replace(/^[-:]\s*/, "").trim();
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
  const dailyRecurringSections = Array.from(dailyRecurringMap.values()).sort((a, b) => a.number - b.number);

  if (daySections.length === 0 && weekSections.length === 0 && dailyRecurringSections.length === 0 && tasks.length > 0) {
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
    totalDays: maxDayFound,
    totalWeeks: maxWeekFound,
    tasks,
    daySections,
    weekSections,
    dailyRecurringSections,
  };
}

/**
 * Removes a completed task line from the raw markdown string.
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

  return filteredLines.join("\n");
}

/**
 * Renews Special Case Daily Recurring Tasks in the markdown file.
 *
 * 1. Finds `## Daily Day N:` header.
 * 2. Increments `N` to `N + 1` (e.g. `## Daily Day 1:` -> `## Daily Day 2:`).
 * 3. Resets all `- [x]` checklist items under that section back to `- [ ]`.
 */
export function renewDailyTasksInMarkdown(rawContent: string): string {
  const lines = rawContent.split("\n");
  let inDailySection = false;

  const updatedLines = lines.map((line) => {
    const trimmed = line.trim();

    // Match Daily Day header e.g. ## Daily Day 1: or ## Daily Day 2
    const dailyMatch = trimmed.match(/^(#{1,4}\s+Daily(?:\s+Day)?)\s*(\d+)?(:?.*)$/i);
    if (dailyMatch) {
      inDailySection = true;
      const currentNum = parseInt(dailyMatch[2], 10) || 1;
      const nextNum = currentNum + 1;
      const rest = dailyMatch[3] || "";

      // Standardize header output to "## Daily Day N:" format
      const hasColon = rest.startsWith(":");
      const extraTitle = hasColon ? rest.substring(1).trim() : rest.trim();

      return `## Daily Day ${nextNum}:${extraTitle ? ` ${extraTitle}` : ""}`;
    }

    if (trimmed.startsWith("#") && !dailyMatch) {
      inDailySection = false;
    }

    if (inDailySection) {
      // Uncheck completed tasks: - [x] -> - [ ]
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
