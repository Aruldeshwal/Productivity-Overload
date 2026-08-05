import { useState, useEffect, useCallback, useRef } from "react";

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

// Support both IPv4 127.0.0.1 and localhost for Windows compatibility
const OLLAMA_ENDPOINTS = [
  "http://127.0.0.1:11434",
  "http://localhost:11434",
];

export function useOllama() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const activeEndpointRef = useRef<string>(OLLAMA_ENDPOINTS[0]);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    setError(null);

    for (const baseUrl of OLLAMA_ENDPOINTS) {
      try {
        // Send a simple GET request without custom headers to avoid triggering CORS OPTIONS preflight 403 checks
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          const modelNames = (data.models || []).map((m: OllamaModelInfo) => m.name);
          setAvailableModels(modelNames);
          setIsConnected(true);
          setIsChecking(false);
          activeEndpointRef.current = baseUrl;
          return true;
        }
      } catch (err) {
        // Try next fallback endpoint
      }
    }

    setIsConnected(false);
    setError("Cannot connect to Ollama. Set environment variable OLLAMA_ORIGINS=* and run ollama serve.");
    setIsChecking(false);
    return false;
  }, []);

  // Check health on mount and poll every 5 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  /**
   * Send a chat request to Ollama using active working endpoint.
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

      const baseUrl = activeEndpointRef.current;
      const response = await fetch(`${baseUrl}/api/chat`, {
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
