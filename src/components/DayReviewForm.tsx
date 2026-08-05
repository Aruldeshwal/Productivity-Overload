import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useOllama } from "@/hooks/useOllama";
import {
  buildQwenExtractionMessages,
  parseQwenResponse,
  ExtractedReviewData,
  QWEN_MODEL_NAME,
} from "@/utils/qwenExtractor";
import {
  Calendar,
  PenTool,
  Send,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  Loader2,
} from "lucide-react";

export interface DayReviewFormProps {
  onSubmit?: (
    reviewDate: string,
    rawText: string,
    extractedData?: ExtractedReviewData
  ) => void;
  isSubmitting?: boolean;
}

export default function DayReviewForm({
  onSubmit,
  isSubmitting: externalSubmitting = false,
}: DayReviewFormProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [reviewDate, setReviewDate] = useState<string>(todayStr);
  const [rawText, setRawText] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // AI Extraction state
  const { chat, isConnected, availableModels } = useOllama();
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedReviewData | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleExtractWithQwen = async () => {
    if (!rawText.trim()) {
      setValidationError("Please enter a reflection before running AI extraction.");
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);
    setValidationError(null);

    try {
      // Check if qwen model exists in availableModels, or use first available model as fallback
      const targetModel =
        availableModels.find(
          (m) => m === QWEN_MODEL_NAME || m.includes("qwen") || m.includes("coder")
        ) || QWEN_MODEL_NAME;

      const messages = buildQwenExtractionMessages(rawText);
      const jsonResponse = await chat({
        model: targetModel,
        messages,
        format: "json",
        temperature: 0.2, // Low temperature for deterministic JSON extraction
      });

      const data = parseQwenResponse(jsonResponse);
      setExtractedData(data);
    } catch (err) {
      console.error("Qwen extraction error:", err);
      setExtractionError(
        err instanceof Error ? err.message : "Failed to extract structured data via Qwen."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setValidationError("Please enter your end-of-day reflection before submitting.");
      return;
    }

    setValidationError(null);

    let dataToSubmit = extractedData;
    // If not extracted yet and Ollama is connected, attempt quick extraction before submission
    if (!dataToSubmit && isConnected) {
      try {
        const targetModel =
          availableModels.find(
            (m) => m === QWEN_MODEL_NAME || m.includes("qwen") || m.includes("coder")
          ) || QWEN_MODEL_NAME;

        const messages = buildQwenExtractionMessages(rawText);
        const jsonResponse = await chat({
          model: targetModel,
          messages,
          format: "json",
          temperature: 0.2,
        });
        dataToSubmit = parseQwenResponse(jsonResponse);
        setExtractedData(dataToSubmit);
      } catch (err) {
        console.warn("Auto-extraction on submit failed:", err);
      }
    }

    if (onSubmit) {
      onSubmit(reviewDate, rawText.trim(), dataToSubmit || undefined);
    }
  };

  const isProcessing = isExtracting || externalSubmitting;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PenTool className="size-5 text-primary" />
            End-of-Day Reflection
          </h2>
          <p className="text-sm text-muted-foreground">
            Record your daily progress and extract structured behavioral signal using Qwen2.5-Coder.
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

        {/* Reflection Textarea */}
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
            rows={5}
            className="w-full bg-secondary/50 text-foreground placeholder:text-muted-foreground/60 border border-border rounded-lg p-4 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* AI Action & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-primary" />
            <span className="text-xs font-medium text-foreground">
              Structured Extraction ({QWEN_MODEL_NAME})
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExtractWithQwen}
            disabled={isProcessing || !rawText.trim() || !isConnected}
            className="gap-1.5 text-xs h-8"
          >
            {isExtracting ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                Extracting via Qwen...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 text-amber-400" />
                Analyze with Qwen
              </>
            )}
          </Button>
        </div>

        {/* Extracted JSON Preview Card */}
        {extractedData && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3 animate-in fade-in-50 duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Structured AI Signal Extracted
              </span>
              <span className="text-xs bg-primary/20 text-primary-foreground px-2 py-0.5 rounded font-mono font-semibold">
                Severity: {extractedData.procrastination_severity}/10
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Delayed Tasks:</span>
                {extractedData.delayed_tasks.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-foreground">
                    {extractedData.delayed_tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground italic">None flagged</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground">Emotional Triggers:</span>
                {extractedData.emotional_triggers.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {extractedData.emotional_triggers.map((trigger, i) => (
                      <span
                        key={i}
                        className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">None flagged</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {validationError && (
          <div className="flex items-center gap-2 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {extractionError && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
            <AlertCircle className="size-4 shrink-0" />
            <span>AI Extraction Warning: {extractionError}</span>
          </div>
        )}

        {/* Form Submit */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground italic">
            100% local Ollama inference. No cloud calls.
          </p>

          <Button
            type="submit"
            disabled={isProcessing || !rawText.trim()}
            className="gap-2 font-medium"
          >
            <Send className="size-4" />
            {externalSubmitting ? "Saving..." : "Save Reflection"}
          </Button>
        </div>
      </form>
    </div>
  );
}
