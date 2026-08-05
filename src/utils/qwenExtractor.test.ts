import { describe, it, expect } from "vitest";
import { parseQwenResponse, buildQwenExtractionMessages } from "./qwenExtractor";

describe("qwenExtractor", () => {
  it("should construct prompt messages correctly", () => {
    const messages = buildQwenExtractionMessages("Felt overwhelmed by Rust lifetimes.");
    expect(messages).toHaveLength(2);
    expect(messages[1].content).toContain("Felt overwhelmed by Rust lifetimes.");
  });

  it("should parse valid JSON response from Qwen", () => {
    const validJson = JSON.stringify({
      procrastination_severity: 7,
      delayed_tasks: ["Read chapter 4", "Build SQLite IPC"],
      emotional_triggers: ["perfectionism", "overwhelm"],
    });

    const result = parseQwenResponse(validJson);
    expect(result.procrastination_severity).toBe(7);
    expect(result.delayed_tasks).toEqual(["Read chapter 4", "Build SQLite IPC"]);
    expect(result.emotional_triggers).toEqual(["perfectionism", "overwhelm"]);
  });

  it("should clean markdown backticks from JSON string if present", () => {
    const backticked = "```json\n{\n  \"procrastination_severity\": 4,\n  \"delayed_tasks\": [\"Task A\"],\n  \"emotional_triggers\": [\"fatigue\"]\n}\n```";

    const result = parseQwenResponse(backticked);
    expect(result.procrastination_severity).toBe(4);
    expect(result.delayed_tasks).toEqual(["Task A"]);
  });

  it("should clamp out-of-bounds procrastination severity to 1-10", () => {
    const outOfBoundsHigh = JSON.stringify({
      procrastination_severity: 15,
      delayed_tasks: [],
      emotional_triggers: [],
    });
    expect(parseQwenResponse(outOfBoundsHigh).procrastination_severity).toBe(10);

    const outOfBoundsLow = JSON.stringify({
      procrastination_severity: -3,
      delayed_tasks: [],
      emotional_triggers: [],
    });
    expect(parseQwenResponse(outOfBoundsLow).procrastination_severity).toBe(1);
  });
});
