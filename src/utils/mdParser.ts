import matter from "gray-matter";

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  day: number; // Day number (1, 2, 3...)
  sectionTitle?: string;
  rawLine: string;
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
  totalDays: number;
  tasks: TaskItem[];
  daySections: { day: number; title: string; tasks: TaskItem[] }[];
}

/**
 * Parse a markdown learning plan file with Day tracking support.
 *
 * Scans headers like:
 * `## Day 1: Rust Basics` or `### Day 2 - Async Tasks`
 * If no Day headers are found, defaults all tasks to Day 1.
 */
export function parseLearningPlan(
  content: string,
  fallbackName = "Untitled Plan",
  filePath?: string,
  unlockedDay = 1
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
  const daySectionsMap = new Map<number, { day: number; title: string; tasks: TaskItem[] }>();

  let currentDay = 1;
  let currentSectionTitle = "Day 1";
  let maxDayFound = 1;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check for Day headers (e.g. ## Day 1: Setup, ## Day 2 - Async, Phase 1 / Day 3)
    const headerMatch = trimmed.match(/^#{1,4}\s+(?:Phase\s+\d+:?\s*)?(?:Day\s+(\d+)|Module\s+(\d+))?:?\s*(.*)$/i);
    if (headerMatch && (headerMatch[1] || headerMatch[2] || trimmed.toLowerCase().includes("day"))) {
      const parsedDayNum = parseInt(headerMatch[1] || headerMatch[2], 10);
      if (!isNaN(parsedDayNum)) {
        currentDay = parsedDayNum;
      } else {
        // If header says Day without explicit number, increment
        currentDay = maxDayFound + 1;
      }
      maxDayFound = Math.max(maxDayFound, currentDay);
      currentSectionTitle = headerMatch[3]?.trim() || `Day ${currentDay}`;
    }

    // Check for checklist items
    const checklistMatch = line.match(/^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (checklistMatch) {
      const isDone = checklistMatch[1].toLowerCase() === "x";
      const text = checklistMatch[2].trim();
      const taskId = `task-${lineIdx}-${currentDay}-${text.slice(0, 15)}`;

      const taskObj: TaskItem = {
        id: taskId,
        text,
        done: isDone,
        day: currentDay,
        sectionTitle: currentSectionTitle,
        rawLine: line,
      };

      tasks.push(taskObj);

      if (!daySectionsMap.has(currentDay)) {
        daySectionsMap.set(currentDay, {
          day: currentDay,
          title: currentSectionTitle,
          tasks: [],
        });
      }
      daySectionsMap.get(currentDay)!.tasks.push(taskObj);
    }
  });

  const daySections = Array.from(daySectionsMap.values()).sort((a, b) => a.day - b.day);
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
    totalDays: maxDayFound,
    tasks,
    daySections,
  };
}

/**
 * Removes a completed task line from the raw markdown string.
 * This is used when a task is completed so the content line is removed/stripped from disk.
 */
export function removeTaskFromMarkdown(rawContent: string, taskText: string): string {
  const lines = rawContent.split("\n");
  const filteredLines = lines.filter((line) => {
    const isTaskLine = /^[\s]*[-*]\s+\[[ xX]\]/.test(line.trim());
    if (isTaskLine && line.includes(taskText)) {
      return false; // Remove this completed task line
    }
    return true;
  });

  return filteredLines.join("\n");
}
