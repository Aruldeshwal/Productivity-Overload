import { OllamaMessage } from "@/hooks/useOllama";

export interface ExtractedReviewData {
  procrastination_severity: number; // Integer scale 1-10
  delayed_tasks: string[];
  emotional_triggers: string[];
}

export const QWEN_MODEL_NAME = "qwen2.5-coder:7b";

/**
 * System and User prompt generator for Qwen2.5-Coder structured extraction.
 */
export function buildQwenExtractionMessages(rawReviewText: string): OllamaMessage[] {
  return [
    {
      role: "system",
      content:
        "You are an AI assistant that extracts structured productivity & behavioral metrics from raw end-of-day reflections. Output ONLY valid JSON matching the requested schema. No markdown formatting, no commentary.",
    },
    {
      role: "user",
      content: `Extract parameters from the following daily review into structured JSON only, no prose:
{
  "procrastination_severity": <integer between 1 and 10, where 1 is minimal and 10 is severe avoidance>,
  "delayed_tasks": [<string array of specific tasks or activities that were postponed or unfinished>],
  "emotional_triggers": [<string array of emotional or cognitive states mentioned or implied, e.g., "perfectionism", "overwhelm", "fear of failure", "fatigue", "distraction">]
}

Review:
"${rawReviewText}"`,
    },
  ];
}

/**
 * Safely parse JSON response from Qwen, enforcing default bounds & fallbacks.
 */
export function parseQwenResponse(jsonString: string): ExtractedReviewData {
  let cleaned = jsonString.trim();
  // Strip markdown codeblock backticks if Qwen wrapped output despite JSON mode
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);

  // Validate and clamp procrastination_severity to 1-10
  let severity = parseInt(parsed.procrastination_severity, 10);
  if (isNaN(severity)) {
    severity = 5; // default fallback
  } else {
    severity = Math.max(1, Math.min(10, severity));
  }

  const delayedTasks = Array.isArray(parsed.delayed_tasks)
    ? parsed.delayed_tasks.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  const emotionalTriggers = Array.isArray(parsed.emotional_triggers)
    ? parsed.emotional_triggers.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  return {
    procrastination_severity: severity,
    delayed_tasks: delayedTasks,
    emotional_triggers: emotionalTriggers,
  };
}
