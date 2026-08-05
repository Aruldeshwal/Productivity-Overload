import "./index.css";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent-app bg-clip-text text-transparent">
        Productive Overload
      </h1>
      <p className="text-muted-foreground text-lg">
        Private AI Desktop Productivity App
      </p>
      <div className="flex gap-3">
        <Button>Get Started</Button>
        <Button variant="outline">Learn More</Button>
        <Button variant="secondary">Settings</Button>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Scaffold complete — Tailwind CSS + shadcn/ui configured ✓
      </p>
    </div>
  );
}

export default App;
