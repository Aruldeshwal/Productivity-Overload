import { useState, useEffect, useCallback } from "react";
import { parseLearningPlan, ParsedPlan, removeTaskFromMarkdown } from "@/utils/mdParser";
import { parseAndPersistPlan } from "@/utils/planSync";
import { useSQLite } from "@/hooks/useSQLite";

export interface PlanFileState {
  filePath: string;
  fileName: string;
  rawContent: string;
  parsedPlan: ParsedPlan;
  unlockedDay: number;
  unlockedWeek: number;
}

interface UnlockStateMap {
  [filePath: string]: { unlockedDay: number; unlockedWeek: number };
}

const FOLDER_PATH_STORAGE_KEY = "productive_overload_plans_folder";
const PLAN_UNLOCK_STORAGE_KEY = "productive_overload_plan_unlock_states";

export function useFolderPlans() {
  const [folderPath, setFolderPath] = useState<string | null>(() => {
    return localStorage.getItem(FOLDER_PATH_STORAGE_KEY) || null;
  });
  const [plans, setPlans] = useState<PlanFileState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { insertProgressLog, isReady: dbReady } = useSQLite();

  // Helper to load unlock state map from localStorage
  const getUnlockMap = (): UnlockStateMap => {
    try {
      const stored = localStorage.getItem(PLAN_UNLOCK_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveUnlockState = (filePath: string, day: number, week: number) => {
    const map = getUnlockMap();
    map[filePath] = { unlockedDay: day, unlockedWeek: week };
    localStorage.setItem(PLAN_UNLOCK_STORAGE_KEY, JSON.stringify(map));
  };

  // Scan folder and parse all .md files simultaneously
  const scanFolder = useCallback(
    async (targetFolderPath?: string) => {
      const path = targetFolderPath || folderPath;
      if (!path) return;

      setIsLoading(true);
      setError(null);

      try {
        const { readDir, readTextFile } = await import("@tauri-apps/plugin-fs");
        const entries = await readDir(path);

        const mdEntries = entries.filter(
          (e) => e.name && (e.name.endsWith(".md") || e.name.endsWith(".markdown"))
        );

        const unlockMap = getUnlockMap();
        const loadedPlans: PlanFileState[] = [];

        for (const entry of mdEntries) {
          const fileFullPath = `${path}/${entry.name}`;
          try {
            const rawContent = await readTextFile(fileFullPath);

            const fileState = unlockMap[fileFullPath] || { unlockedDay: 1, unlockedWeek: 1 };
            const { unlockedDay, unlockedWeek } = fileState;

            if (!(fileFullPath in unlockMap)) {
              saveUnlockState(fileFullPath, 1, 1);
            }

            const parsed = parseLearningPlan(
              rawContent,
              entry.name.replace(/\.md$/i, ""),
              fileFullPath,
              unlockedDay,
              unlockedWeek
            );

            loadedPlans.push({
              filePath: fileFullPath,
              fileName: entry.name,
              rawContent,
              parsedPlan: parsed,
              unlockedDay,
              unlockedWeek,
            });

            if (dbReady && insertProgressLog) {
              parseAndPersistPlan(rawContent, parsed.name, insertProgressLog).catch(
                () => {}
              );
            }
          } catch (fileErr) {
            console.warn(`Failed to read file ${fileFullPath}:`, fileErr);
          }
        }

        setPlans(loadedPlans);
      } catch (err) {
        console.error("Folder scan failed:", err);
        setError("Could not scan directory. Ensure folder path is accessible.");
      } finally {
        setIsLoading(false);
      }
    },
    [folderPath, dbReady, insertProgressLog]
  );

  // Select folder via native Tauri dialog picker
  const selectFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        setFolderPath(selected);
        localStorage.setItem(FOLDER_PATH_STORAGE_KEY, selected);
        await scanFolder(selected);
      }
    } catch (err) {
      console.error("Native folder dialog error:", err);
      setError("Failed to open folder picker.");
    }
  };

  // Mark task completed & remove/strip it from the actual markdown file on disk!
  const markTaskCompletedAndRemoveFromDisk = async (
    filePath: string,
    taskText: string
  ) => {
    const targetPlanState = plans.find((p) => p.filePath === filePath);
    if (!targetPlanState) return;

    try {
      const updatedMarkdown = removeTaskFromMarkdown(
        targetPlanState.rawContent,
        taskText
      );

      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      await writeTextFile(filePath, updatedMarkdown);

      const reParsed = parseLearningPlan(
        updatedMarkdown,
        targetPlanState.fileName.replace(/\.md$/i, ""),
        filePath,
        targetPlanState.unlockedDay,
        targetPlanState.unlockedWeek
      );

      setPlans((prev) =>
        prev.map((p) =>
          p.filePath === filePath
            ? {
                ...p,
                rawContent: updatedMarkdown,
                parsedPlan: reParsed,
              }
            : p
        )
      );

      if (dbReady && insertProgressLog) {
        await insertProgressLog(
          reParsed.name,
          reParsed.completed,
          reParsed.total,
          reParsed.percentage
        );
      }
    } catch (err) {
      console.error(`Failed to update markdown file on disk (${filePath}):`, err);
    }
  };

  // Day unlock / relock controls
  const unlockNextDay = (filePath: string) => {
    const target = plans.find((p) => p.filePath === filePath);
    if (!target) return;

    const nextDay = target.unlockedDay + 1;
    saveUnlockState(filePath, nextDay, target.unlockedWeek);

    const reParsed = parseLearningPlan(
      target.rawContent,
      target.fileName.replace(/\.md$/i, ""),
      filePath,
      nextDay,
      target.unlockedWeek
    );

    setPlans((prev) =>
      prev.map((p) =>
        p.filePath === filePath
          ? { ...p, unlockedDay: nextDay, parsedPlan: reParsed }
          : p
      )
    );
  };

  const lockDay = (filePath: string, targetDay: number) => {
    const target = plans.find((p) => p.filePath === filePath);
    if (!target) return;

    const newUnlockedDay = Math.max(1, targetDay);
    saveUnlockState(filePath, newUnlockedDay, target.unlockedWeek);

    const reParsed = parseLearningPlan(
      target.rawContent,
      target.fileName.replace(/\.md$/i, ""),
      filePath,
      newUnlockedDay,
      target.unlockedWeek
    );

    setPlans((prev) =>
      prev.map((p) =>
        p.filePath === filePath
          ? { ...p, unlockedDay: newUnlockedDay, parsedPlan: reParsed }
          : p
      )
    );
  };

  // Week unlock / relock controls
  const unlockNextWeek = (filePath: string) => {
    const target = plans.find((p) => p.filePath === filePath);
    if (!target) return;

    const nextWeek = target.unlockedWeek + 1;
    saveUnlockState(filePath, target.unlockedDay, nextWeek);

    const reParsed = parseLearningPlan(
      target.rawContent,
      target.fileName.replace(/\.md$/i, ""),
      filePath,
      target.unlockedDay,
      nextWeek
    );

    setPlans((prev) =>
      prev.map((p) =>
        p.filePath === filePath
          ? { ...p, unlockedWeek: nextWeek, parsedPlan: reParsed }
          : p
      )
    );
  };

  const lockWeek = (filePath: string, targetWeek: number) => {
    const target = plans.find((p) => p.filePath === filePath);
    if (!target) return;

    const newUnlockedWeek = Math.max(1, targetWeek);
    saveUnlockState(filePath, target.unlockedDay, newUnlockedWeek);

    const reParsed = parseLearningPlan(
      target.rawContent,
      target.fileName.replace(/\.md$/i, ""),
      filePath,
      target.unlockedDay,
      newUnlockedWeek
    );

    setPlans((prev) =>
      prev.map((p) =>
        p.filePath === filePath
          ? { ...p, unlockedWeek: newUnlockedWeek, parsedPlan: reParsed }
          : p
      )
    );
  };

  useEffect(() => {
    if (folderPath) {
      scanFolder();
    }
  }, [folderPath, scanFolder]);

  return {
    folderPath,
    plans,
    isLoading,
    error,
    selectFolder,
    scanFolder,
    markTaskCompletedAndRemoveFromDisk,
    unlockNextDay,
    lockDay,
    unlockNextWeek,
    lockWeek,
  };
}
