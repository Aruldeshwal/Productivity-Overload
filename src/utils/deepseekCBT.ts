import { OllamaMessage } from "@/hooks/useOllama";

export const DEEPSEEK_MODEL_NAME = "deepseek-r1:7b";

/**
 * Builds prompt messages for DeepSeek-R1 weekly CBT coaching report generation.
 * Note: Free-form markdown output ONLY. Do NOT constrain DeepSeek-R1 to JSON grammar mode,
 * as JSON grammar constraints interfere with its <think> chain-of-thought tokens.
 */
export function buildDeepSeekCBTMessages(formattedLogSummary: string): OllamaMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert Clinical Psychologist specialized in Cognitive Behavioral Therapy (CBT) for academic and workspace procrastination. Output your analysis in clean, structured Markdown.`,
    },
    {
      role: "user",
      content: `Analyze the last 7 days of raw student logs and progress patterns:

${formattedLogSummary}

Perform your analysis strictly under these constraints:
1. IDENTIFY PATTERNS: Connect days of high procrastination with specific precursors (e.g., day of the week, task complexity, emotional state).
2. FLAG COGNITIVE DISTORTIONS: Name the specific distortion present in the logs (e.g., Perfectionism, Overgeneralization, All-or-Nothing thinking).
3. NO CLICHES: Never tell the user to "just start," "break tasks into small steps," or "try Pomodoro." These are generic and unhelpful.
4. ACTIONABLE EXERCISES: Provide exactly 3 highly specific CBT cognitive reframing exercises based on the user's specific text this week.
5. FORMATTING: Output strictly in clean Markdown.`,
    },
  ];
}

/**
 * Splits DeepSeek-R1 output into CoT reasoning (<think>...</think>) and final markdown answer.
 */
export interface ParsedDeepSeekResponse {
  reasoning: string;
  report: string;
}

export function parseDeepSeekResponse(rawOutput: string): ParsedDeepSeekResponse {
  const thinkMatch = rawOutput.match(/<think>([\s\S]*?)<\/think>/);

  let reasoning = "";
  let report = rawOutput;

  if (thinkMatch) {
    reasoning = thinkMatch[1].trim();
    report = rawOutput.replace(/<think>[\s\S]*?<\/think>/, "").trim();
  }

  return { reasoning, report };
}
