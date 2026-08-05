import { describe, it, expect } from "vitest";
import { parseDeepSeekResponse, buildDeepSeekCBTMessages } from "./deepseekCBT";

describe("deepseekCBT", () => {
  it("should construct CBT prompt messages correctly", () => {
    const messages = buildDeepSeekCBTMessages("### Date: 2026-08-05\n- Raw Reflection: Distracted");
    expect(messages).toHaveLength(2);
    expect(messages[1].content).toContain("NO CLICHES");
    expect(messages[1].content).toContain("2026-08-05");
  });

  it("should parse <think> reasoning tokens from final markdown report", () => {
    const rawR1Output = `<think>
Analyzing student reflections...
Found perfectionism distortion.
</think>

# Weekly CBT Coaching Report

## 1. Identified Patterns
High procrastination on complex Rust lifetimes...`;

    const { reasoning, report } = parseDeepSeekResponse(rawR1Output);
    expect(reasoning).toContain("Found perfectionism distortion.");
    expect(report).toContain("# Weekly CBT Coaching Report");
    expect(report).not.toContain("<think>");
  });

  it("should handle responses without <think> tags gracefully", () => {
    const plainMarkdown = "# Weekly Report\nNo CoT block present.";
    const { reasoning, report } = parseDeepSeekResponse(plainMarkdown);
    expect(reasoning).toBe("");
    expect(report).toBe(plainMarkdown);
  });
});
