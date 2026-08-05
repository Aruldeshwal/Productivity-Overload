// Time helper utilities
// Parses markdown timetable tables and provides scheduling utilities

export interface ScheduleEntry {
  time: string;
  task: string;
  done: boolean;
}

export function parseTimetable(_content: string): ScheduleEntry[] {
  // TODO: Implement timetable parsing
  return [];
}

export function getCurrentTimeSlot(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}
