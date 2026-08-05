// Ollama API client hook - interfaces with localhost:11434/api/chat
// Supports both qwen2.5-coder:7b (JSON extraction) and deepseek-r1:7b (CBT reports)

export function useOllama() {
  // TODO: Implement Ollama API client
  return {
    isConnected: false,
    sendMessage: async (_model: string, _prompt: string) => "",
  };
}
