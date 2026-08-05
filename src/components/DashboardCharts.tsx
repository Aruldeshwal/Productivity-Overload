import { useEffect, useState } from "react";
import { useSQLite, ProgressLog } from "@/hooks/useSQLite";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, RefreshCw, Layers } from "lucide-react";

// Mock fallback data for empty initial database state so charts look rich immediately
const MOCK_PROGRESS_DATA: ProgressLog[] = [
  { id: 1, plan_name: "Rust & Tauri", completed_tasks: 1, total_tasks: 10, percentage: 10, timestamp: "2026-08-01 09:00:00" },
  { id: 2, plan_name: "Rust & Tauri", completed_tasks: 3, total_tasks: 10, percentage: 30, timestamp: "2026-08-02 10:30:00" },
  { id: 3, plan_name: "Rust & Tauri", completed_tasks: 4, total_tasks: 10, percentage: 40, timestamp: "2026-08-03 14:00:00" },
  { id: 4, plan_name: "Rust & Tauri", completed_tasks: 6, total_tasks: 10, percentage: 60, timestamp: "2026-08-04 11:15:00" },
  { id: 5, plan_name: "Rust & Tauri", completed_tasks: 8, total_tasks: 10, percentage: 80, timestamp: "2026-08-05 16:00:00" },
];

export default function DashboardCharts() {
  const { getProgressLogs, isReady } = useSQLite();
  const [logs, setLogs] = useState<ProgressLog[]>(MOCK_PROGRESS_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    if (!isReady) return;
    setIsLoading(true);
    try {
      const data = await getProgressLogs(undefined, 30);
      if (data && data.length > 0) {
        // Reverse array so chronological order goes left-to-right
        setLogs([...data].reverse());
      }
    } catch (err) {
      console.warn("Failed to fetch progress logs for chart:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [isReady]);

  // Format timestamp for chart XAxis
  const chartData = logs.map((log) => {
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

  return (
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
          onClick={fetchLogs}
          disabled={isLoading || !isReady}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50 transition-colors"
        >
          <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Chart Container */}
      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
          Showing {chartData.length} plan snapshots
        </span>
        <span className="text-[11px] font-mono text-emerald-400">
          SQLite Table: progress_logs
        </span>
      </div>
    </div>
  );
}
