import matter from "gray-matter";

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  itemType: "day" | "week"; // Distinguishes everyday tasks from weekly goals
  number: number; // Day number or Week number (1, 2, 3...)
  day: number; // Backwards compatibility alias
  sectionTitle?: string;
  rawLine: string;
}

export interface SectionBlock {
  type: "day" | "week";
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
}

/**
 * Parse a markdown learning plan file with Day AND Week tracking support.
 *
 * Scans headers like:
 * `## Day 1: Rust Basics` -> Everyday tasks section
 * `## Week 1: Master Concurrency` -> Weekly objective section
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

  let currentType: "day" | "week" = "day";
  let currentNumber = 1;
  let currentSectionTitle = "";

  let maxDayFound = 1;
  let maxWeekFound = 1;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check for Week header (e.g. ## Week 1, ### Week 2: Build App)
    const weekHeaderMatch = trimmed.match(/^#{1,4}\s+Week\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);
    // Check for Day header (e.g. ## Day 1, ### Day 2: Rust Basics, Phase 1 / Module 1)
    const dayHeaderMatch = trimmed.match(/^#{1,4}\s+(?:Phase\s+\d+:?\s*)?(?:Day|Module)\s*(\d+)?:?\s*[-:]?\s*(.*)$/i);

    if (weekHeaderMatch) {
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

      if (currentType === "week") {
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

  // If no explicit week or day sections were found, default daySections block
  if (daySections.length === 0 && weekSections.length === 0 && tasks.length > 0) {
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
