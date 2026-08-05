import { parseLearningPlan, ParsedPlan } from "./mdParser";

/**
 * Parses markdown content of a learning plan and persists the progress snapshot to SQLite.
 *
 * @param content - Raw markdown text of the learning plan
 * @param planNameFallback - Name to use if frontmatter title is missing
 * @param insertProgressLogFn - Function from useSQLite hook to persist progress log
 * @returns The parsed plan structure
 */
export async function parseAndPersistPlan(
  content: string,
  planNameFallback: string,
  insertProgressLogFn: (
    planName: string,
    completedTasks: number,
    totalTasks: number,
    percentage: number
  ) => Promise<void>
): Promise<ParsedPlan> {
  const parsed = parseLearningPlan(content, planNameFallback);

  // Persist snapshot to SQLite progress_logs
  try {
    await insertProgressLogFn(
      parsed.name,
      parsed.completed,
      parsed.total,
      parsed.percentage
    );
  } catch (err) {
    console.error(`Failed to persist progress log for plan "${parsed.name}":`, err);
  }

  return parsed;
}
