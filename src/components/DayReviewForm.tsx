import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, PenTool, Send, AlertCircle } from "lucide-react";

export interface DayReviewFormProps {
  onSubmit?: (reviewDate: string, rawText: string) => void;
  isSubmitting?: boolean;
}

export default function DayReviewForm({
  onSubmit,
  isSubmitting = false,
}: DayReviewFormProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [reviewDate, setReviewDate] = useState<string>(todayStr);
  const [rawText, setRawText] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setValidationError("Please enter your end-of-day reflection before submitting.");
      return;
    }

    setValidationError(null);
    if (onSubmit) {
      onSubmit(reviewDate, rawText.trim());
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PenTool className="size-5 text-primary" />
            End-of-Day Reflection
          </h2>
          <p className="text-sm text-muted-foreground">
            Record your honest daily progress, procrastination roadblocks, and emotional state.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="review-date"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
          >
            <Calendar className="size-3.5 text-primary" />
            Review Date
          </label>
          <input
            id="review-date"
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Raw Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="raw-reflection"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nightly Reflection Log
            </label>
            <span className="text-xs text-muted-foreground">
              {rawText.length} characters
            </span>
          </div>

          <textarea
            id="raw-reflection"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="How did today go? What tasks were delayed and why? Did perfectionism, anxiety, or distraction trigger procrastination?"
            rows={6}
            className="w-full bg-secondary/50 text-foreground placeholder:text-muted-foreground/60 border border-border rounded-lg p-4 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground italic">
            Reflections remain 100% private and stored locally in SQLite.
          </p>

          <Button
            type="submit"
            disabled={isSubmitting || !rawText.trim()}
            className="gap-2 font-medium"
          >
            <Send className="size-4" />
            {isSubmitting ? "Processing..." : "Submit Reflection"}
          </Button>
        </div>
      </form>
    </div>
  );
}
