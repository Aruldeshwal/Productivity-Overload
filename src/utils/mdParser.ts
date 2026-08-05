import matter from "gray-matter";

/**
 * Represents a parsed learning plan with metadata and completion stats.
 */
export interface ParsedPlan {
  /** Plan name from frontmatter title, or filename fallback */
  name: string;
  /** Description from frontmatter, if present */
  description?: string;
  /** Tags/categories from frontmatter */
  tags?: string[];
  /** Number of completed checklist items (- [x]) */
  completed: number;
  /** Total number of checklist items (- [x] + - [ ]) */
  total: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Individual task items with their completion status */
  tasks: TaskItem[];
}

export interface TaskItem {
  /** The task text (without the checkbox marker) */
  text: string;
  /** Whether this task is completed */
  done: boolean;
}

/**
 * Parse a markdown learning plan file.
 *
 * Extracts:
 * 1. Frontmatter metadata (title, description, tags) via gray-matter
 * 2. Checklist completion via regex: `- [x]` (completed) and `- [ ]` (incomplete)
 *
 * This is a deterministic, regex-based parser — NOT an LLM call.
 * A compiled regex runs in microseconds and is 100% deterministic;
 * routing a simple checkbox count through a 7B model would cost seconds
 * and could hallucinate or misparse.
 *
 * @param content - Raw markdown string
 * @param fallbackName - Fallback name if frontmatter has no title
 * @returns ParsedPlan with metadata and completion statistics
 */
export function parseLearningPlan(
  content: string,
  fallbackName = "Untitled Plan"
): ParsedPlan {
  // Parse frontmatter
  const { data: frontmatter, content: body } = matter(content);

  const name =
    (frontmatter.title as string) ||
    (frontmatter.name as string) ||
    fallbackName;
  const description = frontmatter.description as string | undefined;
  const tags = frontmatter.tags as string[] | undefined;

  // Extract all checklist items using regex
  // Matches: - [x], - [X], * [x], * [X] (completed)
  //          - [ ], * [ ] (incomplete)
  const tasks: TaskItem[] = [];

  // Match checklist lines: optional whitespace, then - or *, then [x] or [ ]
  const checklistRegex = /^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = checklistRegex.exec(body)) !== null) {
    const isDone = match[1].toLowerCase() === "x";
    const text = match[2].trim();
    tasks.push({ text, done: isDone });
  }

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    name,
    description,
    tags,
    completed,
    total,
    percentage,
    tasks,
  };
}

/**
 * Parse multiple markdown files into parsed plans.
 * Useful when loading a directory of learning plan files.
 */
export function parseLearningPlans(
  files: Array<{ name: string; content: string }>
): ParsedPlan[] {
  return files.map((file) => {
    // Use filename (without .md extension) as fallback name
    const fallbackName = file.name.replace(/\.md$/i, "");
    return parseLearningPlan(file.content, fallbackName);
  });
}
