import "./index.css";
import LearningPlanList from "@/components/LearningPlanList";
import { Brain, LayoutDashboard } from "lucide-react";

function App() {
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
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SQLite Active
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="size-6 text-primary" />
              Learning Plans & Progress
            </h2>
            <p className="text-sm text-muted-foreground">
              Interactive markdown parser with live progress calculations and automatic SQLite snapshots.
            </p>
          </div>
        </div>

        <LearningPlanList />
      </main>
    </div>
  );
}

export default App;
