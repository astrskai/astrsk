export const ApiSource = {
  AstrskAi: "astrsk-ai",
  OpenAI: "openai",
  Anthropic: "anthropic",
  OpenRouter: "openrouter",
  OpenAICompatible: "openai-compatible",
  Wllama: "wllama",
  GoogleGenerativeAI: "google-generative-ai",
  KoboldCPP: "koboldcpp",
  AIHorde: "aihorde",
  Ollama: "ollama",
  Dummy: "dummy",
  DeepSeek: "deepseek",
  xAI: "xai",
  Mistral: "mistral",
  Cohere: "cohere",
} as const;

export type ApiSource = (typeof ApiSource)[keyof typeof ApiSource];
