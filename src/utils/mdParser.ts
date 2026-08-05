// Markdown parser utility
// Parses frontmatter with gray-matter and extracts checklist completion via regex

export interface ParsedPlan {
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

export function parseLearningPlan(_content: string): ParsedPlan {
  // TODO: Implement markdown parsing
  return { name: "", completed: 0, total: 0, percentage: 0 };
}
