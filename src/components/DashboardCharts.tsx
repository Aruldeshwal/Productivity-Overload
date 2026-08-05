import { useEffect, useState } from "react";
import { useSQLite, ProgressLog, DailyReview } from "@/hooks/useSQLite";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, RefreshCw, Layers, Activity, AlertTriangle } from "lucide-react";

// Mock fallback data for empty initial database state
const MOCK_PROGRESS_DATA: ProgressLog[] = [
  { id: 1, plan_name: "Rust & Tauri", completed_tasks: 1, total_tasks: 10, percentage: 10, timestamp: "2026-08-01 09:00:00" },
  { id: 2, plan_name: "Rust & Tauri", completed_tasks: 3, total_tasks: 10, percentage: 30, timestamp: "2026-08-02 10:30:00" },
  { id: 3, plan_name: "Rust & Tauri", completed_tasks: 4, total_tasks: 10, percentage: 40, timestamp: "2026-08-03 14:00:00" },
  { id: 4, plan_name: "Rust & Tauri", completed_tasks: 6, total_tasks: 10, percentage: 60, timestamp: "2026-08-04 11:15:00" },
  { id: 5, plan_name: "Rust & Tauri", completed_tasks: 8, total_tasks: 10, percentage: 80, timestamp: "2026-08-05 16:00:00" },
];

const MOCK_REVIEW_DATA: DailyReview[] = [
  { id: 1, review_date: "2026-07-30", raw_text: "Felt fatigued.", procrastination_score: 3, delayed_activities: "[]", emotional_triggers: "[]", weekly_cbt_report: null },
  { id: 2, review_date: "2026-07-31", raw_text: "Anxiety about async Rust.", procrastination_score: 7, delayed_activities: '["Tauri IPC"]', emotional_triggers: '["overwhelm"]', weekly_cbt_report: null },
  { id: 3, review_date: "2026-08-01", raw_text: "Good focus.", procrastination_score: 2, delayed_activities: "[]", emotional_triggers: "[]", weekly_cbt_report: null },
  { id: 4, review_date: "2026-08-02", raw_text: "Distracted by social media.", procrastination_score: 8, delayed_activities: '["SQLite query"]', emotional_triggers: '["distraction"]', weekly_cbt_report: null },
  { id: 5, review_date: "2026-08-03", raw_text: "Moderate productivity.", procrastination_score: 5, delayed_activities: "[]", emotional_triggers: '["fatigue"]', weekly_cbt_report: null },
  { id: 6, review_date: "2026-08-04", raw_text: "Great progress on parser.", procrastination_score: 2, delayed_activities: "[]", emotional_triggers: "[]", weekly_cbt_report: null },
  { id: 7, review_date: "2026-08-05", raw_text: "High output day.", procrastination_score: 1, delayed_activities: "[]", emotional_triggers: "[]", weekly_cbt_report: null },
];

export default function DashboardCharts() {
  const { getProgressLogs, getAllReviews, isReady } = useSQLite();
  const [logs, setLogs] = useState<ProgressLog[]>(MOCK_PROGRESS_DATA);
  const [reviews, setReviews] = useState<DailyReview[]>(MOCK_REVIEW_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      const logData = await getProgressLogs(undefined, 30);
      if (logData && logData.length > 0) {
        setLogs([...logData].reverse());
      }

      const reviewData = await getAllReviews(14);
      if (reviewData && reviewData.length > 0) {
        setReviews([...reviewData].reverse());
      }
    } catch (err) {
      console.warn("Failed to fetch SQLite data for charts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isReady]);

  // Format timestamp for progress line chart
  const progressChartData = logs.map((log) => {
    const dateObj = new Date(log.timestamp);
    const dateStr = isNaN(dateObj.getTime())
      ? log.timestamp
      : `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

    return {
      time: dateStr,
      percentage: log.percentage,
      tasks: `${log.completed_tasks}/${log.total_tasks}`,
      plan: log.plan_name,
    };
  });

  // Format data for procrastination bar chart
  const procrastinationChartData = reviews.map((r) => ({
    date: r.review_date.slice(5), // MM-DD
    fullDate: r.review_date,
    score: r.procrastination_score ?? 0,
  }));

  const getBarColor = (score: number) => {
    if (score >= 7) return "#ef4444"; // Red for high severity
    if (score >= 4) return "#f59e0b"; // Amber for moderate
    return "#10b981"; // Green for low severity
  };

  return (
    <div className="space-y-6">
      {/* 1. Learning Completion Trend Line Chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Learning Completion Trend over Time
            </h3>
            <p className="text-xs text-muted-foreground">
              Snapshot history persisted in SQLite <code className="text-primary font-mono">progress_logs</code> table.
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading || !isReady}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50 transition-colors"
          >
            <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Charts
          </button>
        </div>

        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 280)" opacity={0.5} />
              <XAxis dataKey="time" stroke="oklch(0.65 0.02 260)" fontSize={11} tickLine={false} />
              <YAxis stroke="oklch(0.65 0.02 260)" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.025 280)",
                  borderColor: "oklch(0.28 0.03 280)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`${value}% completed`, "Progress"]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="oklch(0.65 0.2 270)"
                strokeWidth={3}
                dot={{ fill: "oklch(0.65 0.2 270)", r: 4 }}
                activeDot={{ r: 6, fill: "#06b6d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5 text-primary" />
            Showing {progressChartData.length} plan snapshots
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            SQLite Table: progress_logs
          </span>
        </div>
      </div>

      {/* 2. Procrastination Severity Score Trend Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="size-5 text-accent-app" />
              Procrastination Severity Score Trend (Qwen Extracted)
            </h3>
            <p className="text-xs text-muted-foreground">
              Daily behavioral score (1-10) extracted by Qwen2.5-Coder and persisted in <code className="text-accent-app font-mono">daily_reviews</code>.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-emerald-500"></span> Low (1-3)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-amber-500"></span> Mod (4-6)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-rose-500"></span> High (7-10)
            </span>
          </div>
        </div>

        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={procrastinationChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 280)" opacity={0.5} />
              <XAxis dataKey="date" stroke="oklch(0.65 0.02 260)" fontSize={11} tickLine={false} />
              <YAxis stroke="oklch(0.65 0.02 260)" fontSize={11} domain={[0, 10]} tickCount={6} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.025 280)",
                  borderColor: "oklch(0.28 0.03 280)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`Severity: ${value}/10`, "Procrastination Score"]}
                labelFormatter={(label, items) => {
                  const fullDate = items && items[0] ? (items[0].payload as any).fullDate : label;
                  return `Date: ${fullDate}`;
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {procrastinationChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          <span className="flex items-center gap-1">
            <AlertTriangle className="size-3.5 text-amber-400" />
            Showing last {procrastinationChartData.length} daily reflections
          </span>
          <span className="text-[11px] font-mono text-cyan-400">
            SQLite Table: daily_reviews
          </span>
        </div>
      </div>
    </div>
  );
}
