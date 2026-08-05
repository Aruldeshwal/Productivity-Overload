import { useState, useEffect, useCallback, useRef } from "react";
import Database from "@tauri-apps/plugin-sql";

// Database singleton to avoid multiple connections
let dbInstance: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = Database.load("sqlite:database.db").then(async (db) => {
    // Create tables on first connection
    await db.execute(`
      CREATE TABLE IF NOT EXISTS progress_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_name TEXT NOT NULL,
        completed_tasks INTEGER NOT NULL,
        total_tasks INTEGER NOT NULL,
        percentage REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS daily_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        review_date TEXT UNIQUE,
        raw_text TEXT NOT NULL,
        procrastination_score INTEGER,
        delayed_activities TEXT,
        emotional_triggers TEXT,
        weekly_cbt_report TEXT
      )
    `);

    // Index on review_date for efficient weekly aggregation queries
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_daily_reviews_date ON daily_reviews(review_date)
    `);

    // Index on timestamp for efficient progress chart queries
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_progress_logs_timestamp ON progress_logs(timestamp)
    `);

    dbInstance = db;
    return db;
  });

  return dbInitPromise;
}

// Type definitions for database records
export interface ProgressLog {
  id: number;
  plan_name: string;
  completed_tasks: number;
  total_tasks: number;
  percentage: number;
  timestamp: string;
}

export interface DailyReview {
  id: number;
  review_date: string;
  raw_text: string;
  procrastination_score: number | null;
  delayed_activities: string | null;
  emotional_triggers: string | null;
  weekly_cbt_report: string | null;
}

export function useSQLite() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    getDb()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("SQLite init failed:", err);
        setError(String(err));
      });
  }, []);

  // Insert a progress log entry
  const insertProgressLog = useCallback(
    async (
      planName: string,
      completedTasks: number,
      totalTasks: number,
      percentage: number
    ) => {
      const db = await getDb();
      await db.execute(
        "INSERT INTO progress_logs (plan_name, completed_tasks, total_tasks, percentage) VALUES ($1, $2, $3, $4)",
        [planName, completedTasks, totalTasks, percentage]
      );
    },
    []
  );

  // Get all progress logs, optionally filtered by plan name
  const getProgressLogs = useCallback(
    async (planName?: string, limit = 100): Promise<ProgressLog[]> => {
      const db = await getDb();
      if (planName) {
        return db.select(
          "SELECT * FROM progress_logs WHERE plan_name = $1 ORDER BY timestamp DESC LIMIT $2",
          [planName, limit]
        );
      }
      return db.select(
        "SELECT * FROM progress_logs ORDER BY timestamp DESC LIMIT $1",
        [limit]
      );
    },
    []
  );

  // Insert or update a daily review
  const upsertDailyReview = useCallback(
    async (
      reviewDate: string,
      rawText: string,
      procrastinationScore?: number,
      delayedActivities?: string[],
      emotionalTriggers?: string[]
    ) => {
      const db = await getDb();
      await db.execute(
        `INSERT INTO daily_reviews (review_date, raw_text, procrastination_score, delayed_activities, emotional_triggers)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT(review_date) DO UPDATE SET
           raw_text = excluded.raw_text,
           procrastination_score = excluded.procrastination_score,
           delayed_activities = excluded.delayed_activities,
           emotional_triggers = excluded.emotional_triggers`,
        [
          reviewDate,
          rawText,
          procrastinationScore ?? null,
          delayedActivities ? JSON.stringify(delayedActivities) : null,
          emotionalTriggers ? JSON.stringify(emotionalTriggers) : null,
        ]
      );
    },
    []
  );

  // Get daily reviews for the last N days
  const getRecentReviews = useCallback(
    async (days = 7): Promise<DailyReview[]> => {
      const db = await getDb();
      return db.select(
        `SELECT * FROM daily_reviews
         WHERE review_date >= date('now', $1)
         ORDER BY review_date DESC`,
        [`-${days} days`]
      );
    },
    []
  );

  // Update the weekly CBT report for a specific review
  const updateWeeklyCbtReport = useCallback(
    async (reviewDate: string, report: string) => {
      const db = await getDb();
      await db.execute(
        "UPDATE daily_reviews SET weekly_cbt_report = $1 WHERE review_date = $2",
        [report, reviewDate]
      );
    },
    []
  );

  // Get all daily reviews (for charts)
  const getAllReviews = useCallback(
    async (limit = 30): Promise<DailyReview[]> => {
      const db = await getDb();
      return db.select(
        "SELECT * FROM daily_reviews ORDER BY review_date DESC LIMIT $1",
        [limit]
      );
    },
    []
  );

  return {
    isReady,
    error,
    insertProgressLog,
    getProgressLogs,
    upsertDailyReview,
    getRecentReviews,
    updateWeeklyCbtReport,
    getAllReviews,
  };
}
