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
 * Parse a markdown learning plan file safely.
 *
 * Extracts:
 * 1. Frontmatter metadata (title, description, tags) via gray-matter with safe fallback
 * 2. Checklist completion via regex: `- [x]` (completed) and `- [ ]` (incomplete)
 *
 * Fully crash-proof: handles malformed input or browser environment without throwing.
 */
export function parseLearningPlan(
  content: string,
  fallbackName = "Untitled Plan"
): ParsedPlan {
  let name = fallbackName;
  let description: string | undefined = undefined;
  let tags: string[] | undefined = undefined;
  let body = content || "";

  // Try parsing frontmatter safely
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
    console.warn("gray-matter parse warning, falling back to body:", err);
    // Simple regex fallback for frontmatter title
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      name = titleMatch[1].replace(/['"]/g, "").trim();
    }
  }

  // Extract all checklist items using regex
  const tasks: TaskItem[] = [];

  try {
    const checklistRegex = /^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = checklistRegex.exec(body)) !== null) {
      const isDone = match[1].toLowerCase() === "x";
      const text = match[2].trim();
      tasks.push({ text, done: isDone });
    }
  } catch (err) {
    console.error("Regex checklist extraction failed:", err);
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

export function parseLearningPlans(
  files: Array<{ name: string; content: string }>
): ParsedPlan[] {
  return files.map((file) => {
    const fallbackName = file.name.replace(/\.md$/i, "");
    return parseLearningPlan(file.content, fallbackName);
  });
}
