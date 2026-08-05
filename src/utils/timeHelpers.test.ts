import { describe, it, expect } from "vitest";
import {
  parseTimetable,
  getCurrentTimeSlot,
  isTimeMatchingNow,
} from "./timeHelpers";

const sampleTimetableMd = `
# Daily Schedule

| Time | Activity | Category | Status |
| --- | --- | --- | --- |
| 08:30 | Morning Reflection & Review | Mindset | x |
| 09:00 | Deep Work: Rust SQLite IPC | Coding | [ ] |
| 11:30 | Team Sync & Standup | Meeting | |
| 14:00 | Local AI Prompt Tuning | AI | |
`;

describe("timeHelpers", () => {
  it("should parse markdown table into schedule objects correctly", () => {
    const schedule = parseTimetable(sampleTimetableMd);

    expect(schedule).toHaveLength(4);
    expect(schedule[0]).toEqual({
      id: "entry-5-08:30",
      time: "08:30",
      task: "Morning Reflection & Review",
      category: "Mindset",
      done: true,
    });

    expect(schedule[1].time).toBe("09:00");
    expect(schedule[1].task).toBe("Deep Work: Rust SQLite IPC");
    expect(schedule[1].done).toBe(false);
  });

  it("should format current time in HH:mm 24-hour format", () => {
    const fixedDate = new Date("2026-08-05T14:35:00");
    expect(getCurrentTimeSlot(fixedDate)).toBe("14:35");
  });

  it("should match scheduled start times accurately", () => {
    expect(isTimeMatchingNow("09:00", "09:00")).toBe(true);
    expect(isTimeMatchingNow("09:00", "09:01")).toBe(false);
    expect(isTimeMatchingNow("14:00-15:30", "14:00")).toBe(true);
  });
});
