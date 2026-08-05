// Background scheduler hook - checks timetable against current time
// Fires native notifications via @tauri-apps/plugin-notification

export function useScheduler() {
  // TODO: Implement 30-second interval scheduler
  return {
    isRunning: false,
    nextTask: null as string | null,
  };
}
