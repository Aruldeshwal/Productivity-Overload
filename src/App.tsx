import { useState } from "react";
import "./index.css";
import LearningPlanList from "@/components/LearningPlanList";
import DayReviewForm from "@/components/DayReviewForm";
import WeeklyCBTReport from "@/components/WeeklyCBTReport";
import TimetableReminders from "@/components/TimetableReminders";
import DashboardCharts from "@/components/DashboardCharts";
import { useOllama } from "@/hooks/useOllama";
import { useSQLite } from "@/hooks/useSQLite";
import {
  Brain,
  LayoutDashboard,
  PenTool,
  Sparkles,
  Server,
  AlertTriangle,
  Clock,
  TrendingUp,
  Database,
  ShieldCheck,
} from "lucide-react";

type NavTab = "dashboard" | "plans" | "timetable" | "review" | "cbt";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const { isConnected, isChecking } = useOllama();
  const { isReady: isDbReady } = useSQLite();

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border shrink-0 flex flex-col justify-between p-4 space-y-6">
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/30">
              <Brain className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary-light to-accent-app bg-clip-text text-transparent">
                Productive Overload
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">
                Local-First AI Productivity
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "dashboard"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <TrendingUp className="size-4" />
              Progress & Charts
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "plans"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <LayoutDashboard className="size-4" />
              Learning Plans
            </button>

            <button
              onClick={() => setActiveTab("timetable")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "timetable"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Clock className="size-4" />
              Timetable & Reminders
            </button>

            <button
              onClick={() => setActiveTab("review")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "review"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <PenTool className="size-4" />
              Daily Reflection (Qwen)
            </button>

            <button
              onClick={() => setActiveTab("cbt")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "cbt"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Sparkles className="size-4 text-amber-400" />
              Weekly CBT Report (DeepSeek)
            </button>
          </nav>
        </div>

        {/* System Status Indicators in Sidebar Footer */}
        <div className="space-y-2 pt-4 border-t border-border/50 text-xs">
          <div className="flex items-center justify-between px-2 py-1 bg-secondary/30 rounded border border-border/40">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="size-3 text-emerald-400" /> SQLite DB
            </span>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold">
              {isDbReady ? "Ready" : "Init..."}
            </span>
          </div>

          <div className="flex items-center justify-between px-2 py-1 bg-secondary/30 rounded border border-border/40">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Server className="size-3 text-primary" /> Ollama API
            </span>
            <span className="font-mono text-[10px] font-semibold">
              {isChecking ? (
                <span className="text-muted-foreground">Checking</span>
              ) : isConnected ? (
                <span className="text-emerald-400">Connected</span>
              ) : (
                <span className="text-amber-400">Offline</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 px-2 pt-1">
            <ShieldCheck className="size-3 text-primary" />
            <span>100% Offline & Private</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="border-b border-border bg-card/40 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground capitalize">
              {activeTab === "dashboard" && "Dashboard & Analytics"}
              {activeTab === "plans" && "Markdown Learning Plans"}
              {activeTab === "timetable" && "Schedule Timetable & Reminders"}
              {activeTab === "review" && "Nightly Reflection & Qwen AI Extraction"}
              {activeTab === "cbt" && "DeepSeek-R1 Weekly CBT Coaching"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Local-first desktop environment powered by Tauri v2, React, SQLite, and Ollama.
            </p>
          </div>

          {!isConnected && !isChecking && (
            <div className="hidden sm:flex items-center gap-2 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Ollama offline. Run <code className="font-mono font-bold">ollama serve</code></span>
            </div>
          )}
        </header>

        {/* Dynamic Viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto space-y-6 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <DashboardCharts />
            </div>
          )}

          {activeTab === "plans" && <LearningPlanList />}

          {activeTab === "timetable" && <TimetableReminders />}

          {activeTab === "review" && (
            <DayReviewForm onSubmitSuccess={() => setActiveTab("cbt")} />
          )}

          {activeTab === "cbt" && <WeeklyCBTReport />}
        </main>
      </div>
    </div>
  );
}
