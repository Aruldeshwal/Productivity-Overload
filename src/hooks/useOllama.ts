import { useState, useEffect, useCallback } from "react";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatOptions {
  model: string;
  messages: OllamaMessage[];
  format?: "json" | object;
  stream?: boolean;
  temperature?: number;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
}

const OLLAMA_BASE_URL = "http://localhost:11434";

export function useOllama() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Ollama server returned status ${response.status}`);
      }

      const data = await response.json();
      const modelNames = (data.models || []).map((m: OllamaModelInfo) => m.name);
      setAvailableModels(modelNames);
      setIsConnected(true);
      setIsChecking(false);
      return true;
    } catch (err) {
      console.warn("Ollama connectivity check failed:", err);
      setIsConnected(false);
      setError(
        err instanceof Error
          ? err.message
          : "Cannot connect to Ollama at localhost:11434"
      );
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  /**
   * Send a chat request to Ollama.
   * If stream is false, returns the complete response string.
   * If stream is true and onChunk is provided, streams tokens as they arrive.
   */
  const chat = useCallback(
    async (
      options: OllamaChatOptions,
      onChunk?: (chunk: string) => void
    ): Promise<string> => {
      const { model, messages, format, stream = false, temperature = 0.7 } = options;

      const body: Record<string, unknown> = {
        model,
        messages,
        stream,
        options: {
          temperature,
        },
      };

      if (format) {
        body.format = format;
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errText}`);
      }

      if (!stream || !response.body) {
        const data = await response.json();
        return data.message?.content || "";
      }

      // Streaming implementation using ReadableStream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep incomplete trailing line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const token = parsed.message?.content || "";
            if (token) {
              fullContent += token;
              if (onChunk) {
                onChunk(token);
              }
            }
          } catch (e) {
            console.warn("Failed to parse JSON stream chunk:", trimmed, e);
          }
        }
      }

      // Process any remaining line in buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const token = parsed.message?.content || "";
          if (token) {
            fullContent += token;
            if (onChunk) {
              onChunk(token);
            }
          }
        } catch (e) {
          // ignore trailing partial line
        }
      }

      return fullContent;
    },
    []
  );

  const hasModel = useCallback(
    (modelName: string): boolean => {
      return availableModels.some(
        (m) => m === modelName || m.startsWith(`${modelName}:`) || m.includes(modelName)
      );
    },
    [availableModels]
  );

  return {
    isConnected,
    isChecking,
    availableModels,
    error,
    checkHealth,
    chat,
    hasModel,
  };
}
