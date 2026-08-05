import { useState } from "react";
import "./index.css";
import LearningPlanList from "@/components/LearningPlanList";
import DayReviewForm from "@/components/DayReviewForm";
import WeeklyCBTReport from "@/components/WeeklyCBTReport";
import { useOllama } from "@/hooks/useOllama";
import {
  Brain,
  LayoutDashboard,
  PenTool,
  Sparkles,
  Server,
  AlertTriangle,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"plans" | "review" | "cbt">("plans");
  const { isConnected, isChecking } = useOllama();

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Brain className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent-app bg-clip-text text-transparent">
              Productive Overload
            </h1>
            <p className="text-xs text-muted-foreground">
              Private Local-First AI Desktop Productivity
            </p>
          </div>
        </div>

        {/* Server & Status Badges */}
        <div className="flex items-center gap-3">
          {isChecking ? (
            <span className="text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-border">
              <Server className="size-3 animate-spin" /> Checking Ollama...
            </span>
          ) : isConnected ? (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Ollama & SQLite Active
            </span>
          ) : (
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <AlertTriangle className="size-3" />
              Ollama Offline (localhost:11434)
            </span>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-border/60 bg-secondary/20 px-6 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "plans"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <LayoutDashboard className="size-4" />
            Learning Plans
          </button>

          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "review"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <PenTool className="size-4" />
            Daily Reflection (Qwen)
          </button>

          <button
            onClick={() => setActiveTab("cbt")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "cbt"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Sparkles className="size-4 text-amber-400" />
            Weekly CBT Report (DeepSeek-R1)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {activeTab === "plans" && <LearningPlanList />}
        {activeTab === "review" && (
          <DayReviewForm onSubmitSuccess={() => setActiveTab("cbt")} />
        )}
        {activeTab === "cbt" && <WeeklyCBTReport />}
      </main>
    </div>
  );
}
