import { useState, useEffect, useCallback, useRef } from "react";
import {
  ScheduleEntry,
  getCurrentTimeSlot,
  isTimeMatchingNow,
} from "@/utils/timeHelpers";

export interface UseSchedulerOptions {
  initialSchedule?: ScheduleEntry[];
  onTriggerNotification?: (entry: ScheduleEntry) => void;
  checkIntervalMs?: number; // Default 30,000ms (30 seconds)
}

export function useScheduler({
  initialSchedule = [],
  onTriggerNotification,
  checkIntervalMs = 30000,
}: UseSchedulerOptions = {}) {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeSlot());
  const [activeTask, setActiveTask] = useState<ScheduleEntry | null>(null);
  const [nextTask, setNextTask] = useState<ScheduleEntry | null>(null);

  // Set of already notified task IDs for the current time slot
  const notifiedMap = useRef<Record<string, string>>({});

  const checkSchedule = useCallback(() => {
    const nowStr = getCurrentTimeSlot();
    setCurrentTime(nowStr);

    let currentActive: ScheduleEntry | null = null;
    let upcomingNext: ScheduleEntry | null = null;

    schedule.forEach((entry) => {
      if (entry.done) return;

      // Check if time matches now
      if (isTimeMatchingNow(entry.time, nowStr)) {
        currentActive = entry;

        // Fire notification if not yet notified for this specific minute
        const notificationKey = `${entry.id}-${nowStr}`;
        if (!notifiedMap.current[notificationKey]) {
          notifiedMap.current[notificationKey] = nowStr;
          if (onTriggerNotification) {
            onTriggerNotification(entry);
          }
        }
      } else if (!upcomingNext && entry.time > nowStr) {
        upcomingNext = entry;
      }
    });

    setActiveTask(currentActive);
    setNextTask(upcomingNext);
  }, [schedule, onTriggerNotification]);

  // 30-second interval clock loop
  useEffect(() => {
    checkSchedule(); // Immediate initial check

    const intervalId = setInterval(() => {
      checkSchedule();
    }, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, [checkSchedule, checkIntervalMs]);

  const toggleTaskDone = useCallback((entryId: string) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, done: !item.done } : item
      )
    );
  }, []);

  const snoozeTask = useCallback((entryId: string, snoozeMinutes = 15) => {
    const futureDate = new Date(Date.now() + snoozeMinutes * 60000);
    const newTime = getCurrentTimeSlot(futureDate);

    setSchedule((prev) =>
      prev.map((item) =>
        item.id === entryId
          ? { ...item, time: newTime, snoozedUntil: newTime }
          : item
      )
    );
  }, []);

  return {
    schedule,
    setSchedule,
    currentTime,
    activeTask,
    nextTask,
    toggleTaskDone,
    snoozeTask,
    checkScheduleNow: checkSchedule,
  };
}
