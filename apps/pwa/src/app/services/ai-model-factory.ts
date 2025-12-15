/**
 * AI Model Factory
 *
 * Shared factory for creating AI SDK providers and language models across different providers.
 * Centralizes provider-specific base URLs and configuration.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createMistral } from "@ai-sdk/mistral";
import { createCohere } from "@ai-sdk/cohere";
import {
  createOpenRouter,
  type OpenRouterProviderSettings,
} from "@openrouter/ai-sdk-provider";
import { type LanguageModel, type JSONValue, generateText, streamText, tool, parsePartialJson, isDeepEqualData } from "ai";
import { merge } from "lodash-es";
import { z } from "zod";
import { JSONSchema7 } from "json-schema";

import { ApiSource, OpenrouterProviderSort } from "@/entities/api/domain";
import { getAISDKFetch } from "@/shared/infra/fetch-helper";
import { logger } from "@/shared/lib/logger";

// Provider-specific default base URLs
const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";
const LMSTUDIO_DEFAULT_BASE_URL = "http://localhost:1234";

/**
 * Cache for models that require tool fallback.
 * Key: "apiSource:modelId" (lowercase), Value: timestamp when cached
 *
 * This cache is populated dynamically when streamObject fails with json_schema errors.
 * Models in this cache will automatically use generateText with tool calling.
 *
 * Cache duration: 24 hours (persisted in memory during session)
 */
const TOOL_FALLBACK_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const toolFallbackCache = new Map<string, number>();

/**
 * Generate a cache key from apiSource and modelId.
 */
function getCacheKey(apiSource: ApiSource, modelId: string): string {
  return `${apiSource}:${modelId.toLowerCase()}`;
}

/**
 * Check if a model is cached as requiring tool fallback.
 */
export function isModelCachedForToolFallback(apiSource: ApiSource, modelId: string): boolean {
  const cacheKey = getCacheKey(apiSource, modelId);
  const cachedTimestamp = toolFallbackCache.get(cacheKey);

  if (!cachedTimestamp) {
    return false;
  }

  // Check if cache is still valid
  const now = Date.now();
  if (now - cachedTimestamp > TOOL_FALLBACK_CACHE_DURATION_MS) {
    // Cache expired, remove it
    toolFallbackCache.delete(cacheKey);
    return false;
  }

  return true;
}

/**
 * Add a model to the tool fallback cache.
 * Called when streamObject fails with json_schema not supported error.
 */
export function cacheModelForToolFallback(apiSource: ApiSource, modelId: string): void {
  const cacheKey = getCacheKey(apiSource, modelId);
  toolFallbackCache.set(cacheKey, Date.now());
}

/**
 * Check if an error indicates that json_schema response format is not supported.
 * This is used to determine if we should cache the model for tool fallback.
 */
export function isJsonSchemaNotSupportedError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : JSON.stringify(error);

  const errorMessageLower = errorMessage.toLowerCase();

  // Common error patterns for json_schema not being supported
  const patterns = [
    "json response format schema is only supported with structuredoutputs",
    "responseformat",
    "response_format",
    "json_schema",
    "structured output",
    "structuredoutputs",
    "does not support",
    "not supported",
  ];

  // Check if at least 2 patterns match (to avoid false positives)
  const matchCount = patterns.filter(p => errorMessageLower.includes(p)).length;
  return matchCount >= 2;
}

/**
 * Check if an error indicates JSON parsing failure.
 * This happens when the model returns invalid JSON in json mode.
 * In this case, we can try tool mode which has better structure enforcement.
 */
export function isJsonParsingError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : JSON.stringify(error);

  const errorMessageLower = errorMessage.toLowerCase();

  // Common error patterns for JSON parsing failures
  const patterns = [
    "unexpected token",
    "json parse",
    "json.parse",
    "invalid json",
    "syntaxerror",
    "unexpected end of json",
    "failed to parse",
    "parsing error",
    "expected",  // "Expected ',' or '}'" type errors
  ];

  return patterns.some(p => errorMessageLower.includes(p));
}

/**
 * Check if an error is recoverable by switching to tool mode.
 * This includes both json_schema not supported AND json parsing errors.
 */
export function isRecoverableWithToolMode(error: unknown): boolean {
  return isJsonSchemaNotSupportedError(error) || isJsonParsingError(error);
}

/**
 * Check if a provider supports tool calling.
 * Providers that don't support tool calling cannot use the generateText fallback.
 */
export function providerSupportsToolCalling(apiSource: ApiSource): boolean {
  // Providers that definitely DON'T support tool calling
  const noToolCallingProviders: ApiSource[] = [
    ApiSource.KoboldCPP,
    ApiSource.Wllama,
    ApiSource.AIHorde,
    ApiSource.Dummy,
  ];

  return !noToolCallingProviders.includes(apiSource);
}

/**
 * Clear the tool fallback cache (for testing or manual reset).
 */
export function clearToolFallbackCache(): void {
  toolFallbackCache.clear();
}

/**
 * Options for creating a provider
 */
export interface CreateProviderOptions {
  source: ApiSource;
  apiKey?: string;
  baseUrl?: string;
  isStructuredOutput?: boolean;
  openrouterProviderSort?: OpenrouterProviderSort;
  modelId?: string; // Used to detect Gemini models in AstrskAi
}

/**
 * Create an AI SDK provider based on API source and configuration.
 * This is the full-featured provider factory used by session-play-service.
 */
export function createProvider({
  source,
  apiKey,
  baseUrl,
  isStructuredOutput,
  openrouterProviderSort,
  modelId,
}: CreateProviderOptions) {
  let provider;
  switch (source) {
    case ApiSource.OpenAI:
      provider = createOpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.OpenAICompatible: {
      // Use base URL as-is (no automatic /v1 addition)
      provider = createOpenAICompatible({
        name: "openai-compatible",
        apiKey: apiKey,
        baseURL: baseUrl ?? "",
        fetch: getAISDKFetch(), // Use Electron-aware fetch for CORS-free localhost access
      });
      break;
    }

    case ApiSource.AstrskAi: {
      // Astrsk Cloud LLM - uses environment variable for base URL
      const astrskBaseUrl = import.meta.env.VITE_CLOUD_LLM_URL;
      if (!astrskBaseUrl) {
        throw new Error("VITE_CLOUD_LLM_URL is not configured");
      }

      // Check if this is a Gemini model (google/gemini-*)
      // Parse modelId to extract the actual model name (strip "openai-compatible:" prefix if present)
      const parsedModelId = modelId?.includes(":") ? modelId.split(":")[1] : modelId;
      const isGeminiModel = parsedModelId?.startsWith("google/gemini-");

      logger.info(`[createProvider] AstrskAi model detection`, {
        originalModelId: modelId,
        parsedModelId,
        isGeminiModel,
      });

      // Create custom fetch wrapper to add x-dev-key header (only in development)
      const devKey = import.meta.env.VITE_DEV_KEY;
      const baseFetch = getAISDKFetch();
      const astrskFetch: typeof fetch = async (url, options) => {
        const headers = new Headers(options?.headers);
        // Only add dev key if targeting localhost (development environment)
        if (devKey && astrskBaseUrl.includes("localhost")) {
          headers.set("x-dev-key", devKey);
        }
        return baseFetch(url, { ...options, headers });
      };

      if (isGeminiModel) {
        // For Gemini models: use Google Generative AI provider with custom fetch
        provider = createGoogleGenerativeAI({
          apiKey: "", // No API key needed for AstrskAi proxy
          baseURL: astrskBaseUrl,
          fetch: astrskFetch,
        });
      } else {
        // For other models: use OpenAI Compatible provider
        provider = createOpenAICompatible({
          name: "astrsk-cloud",
          baseURL: astrskBaseUrl,
          fetch: astrskFetch,
        });
      }
      break;
    }

    case ApiSource.Anthropic:
      provider = createAnthropic({
        apiKey: apiKey,
        baseURL: baseUrl,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      break;

    case ApiSource.OpenRouter: {
      const options: OpenRouterProviderSettings = {
        apiKey: apiKey,
        headers: {
          "HTTP-Referer": "https://app.astrsk.ai",
          "X-Title": "astrsk",
        },
      };
      const extraBody: Record<string, unknown> = {};
      if (isStructuredOutput) {
        merge(extraBody, {
          provider: {
            require_parameters: true,
          },
        });
      }
      if (
        openrouterProviderSort &&
        openrouterProviderSort !== OpenrouterProviderSort.Default
      ) {
        merge(extraBody, {
          provider: {
            sort: openrouterProviderSort,
          },
        });
      }
      if (Object.keys(extraBody).length > 0) {
        options.extraBody = extraBody;
      }
      provider = createOpenRouter(options);
      break;
    }

    case ApiSource.GoogleGenerativeAI:
      provider = createGoogleGenerativeAI({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.Ollama: {
      // Use OpenAI-compatible provider instead of ollama-ai-provider
      // This avoids strict schema validation issues (e.g., eval_duration requirement)
      // Ollama supports OpenAI-compatible API: https://github.com/ollama/ollama/blob/main/docs/openai.md
      let ollamaBaseUrl = baseUrl ?? OLLAMA_DEFAULT_BASE_URL;
      // Remove /api suffix if present (Ollama native endpoint)
      ollamaBaseUrl = ollamaBaseUrl.replace(/\/api$/, "");
      // No hardcoded /v1 - let endpoint auto-retry with /v1 if needed
      provider = createOpenAICompatible({
        name: "ollama",
        baseURL: ollamaBaseUrl,
        fetch: getAISDKFetch(), // Use Electron-aware fetch for CORS-free localhost access
      });
      break;
    }

    case ApiSource.LMStudio: {
      const lmStudioBaseUrl = baseUrl ?? LMSTUDIO_DEFAULT_BASE_URL;
      // No hardcoded /v1 - let fetch auto-retry with /v1 if needed
      provider = createOpenAICompatible({
        name: "lmstudio",
        apiKey: apiKey || "", // LM Studio doesn't require API key
        baseURL: lmStudioBaseUrl,
        fetch: getAISDKFetch(), // Use Electron-aware fetch for CORS-free localhost access
      });
      break;
    }

    case ApiSource.DeepSeek:
      provider = createDeepSeek({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.xAI:
      provider = createXai({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.Mistral:
      provider = createMistral({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.Cohere:
      provider = createCohere({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.KoboldCPP: {
      // No hardcoded /v1 - let endpoint auto-retry with /v1 if needed
      provider = createOpenAICompatible({
        name: ApiSource.KoboldCPP,
        baseURL: baseUrl ?? "",
        fetch: getAISDKFetch(),
      });
      break;
    }

    default:
      throw new Error("Invalid API connection source");
  }
  return provider;
}

/**
 * Create an AI SDK language model based on API source and configuration.
 * This is a lightweight factory for simple use cases (scenario builder, data schema builder).
 * For full session playback with streaming and advanced features, use createProvider directly.
 */
/**
 * Parse model ID for AstrskAi provider
 * AstrskAi model IDs are stored with "openai-compatible:" prefix but need to be used without it
 *
 * IMPORTANT: For Gemini models, we need to keep the "google/" prefix because the backend
 * routes to Vertex AI using the full path (google/gemini-3-pro)
 *
 * Examples:
 * - "openai-compatible:deepseek/deepseek-chat" -> "deepseek/deepseek-chat"
 * - "openai-compatible:google/gemini-3-pro" -> "google/gemini-3-pro" (keep google/ prefix)
 */
function parseAstrskAiModelId(modelId: string): string {
  let parsed = modelId;

  // Strip "openai-compatible:" prefix if present
  if (parsed.startsWith("openai-compatible:")) {
    parsed = parsed.substring("openai-compatible:".length);
  }

  // Keep the full path including "google/" prefix for backend routing
  return parsed;
}

export function createLiteModel(
  source: ApiSource,
  modelId: string,
  apiKey: string,
  baseUrl?: string,
): LanguageModel {
  const provider = createProvider({ source, apiKey, baseUrl, modelId });

  // Parse model ID for AstrskAi - strip "openai-compatible:" prefix
  const parsedModelId = source === ApiSource.AstrskAi
    ? parseAstrskAiModelId(modelId)
    : modelId;

  logger.info(`[createLiteModel] Creating model for ${source}`, {
    originalModelId: modelId,
    parsedModelId,
  });

  // Get the model from the provider
  // Different providers have different methods for getting models
  // Using type assertion since provider types vary significantly
  const p = provider as unknown as Record<string, unknown>;

  if ("chat" in p && typeof p.chat === "function") {
    return p.chat(parsedModelId) as LanguageModel;
  }

  if ("languageModel" in p && typeof p.languageModel === "function") {
    return p.languageModel(parsedModelId) as LanguageModel;
  }

  if ("chatModel" in p && typeof p.chatModel === "function") {
    return p.chatModel(parsedModelId) as LanguageModel;
  }

  // For providers that are callable (like Anthropic, Google)
  if (typeof provider === "function") {
    return (provider as (modelId: string) => LanguageModel)(parsedModelId);
  }

  throw new Error(`Unable to create model for source: ${source}`);
}

/**
 * Check if a model should use non-streaming approach for multi-tool calling.
 * This is different from shouldUseToolFallback which is for structured output.
 *
 * Some models work with tool calling but have issues with streaming when using tools:
 * - Gemini models via AstrskAi: Vertex AI streaming incompatibility
 * - GLM models: Better stability with non-streaming
 * - Friendli models (deepseek-ai/*, zai-org/*): Don't support streaming tool calls
 *
 * @param apiSource - The API source
 * @param modelId - The model identifier
 * @returns true if should use generateText instead of streamText for tool calling
 */
export function shouldUseNonStreamingForTools(apiSource: ApiSource, modelId: string): boolean {
  const modelIdLower = modelId.toLowerCase();

  // GLM models work better with non-streaming for tool calling
  if (modelIdLower.includes("glm")) {
    logger.info(`[ToolCalling] GLM model detected (${modelId}) - using non-streaming generateText`);
    return true;
  }

  // AstrskAi provider - check model type
  if (apiSource === ApiSource.AstrskAi) {
    // Gemini models need non-streaming (Vertex AI streaming incompatibility)
    if (modelId.includes("google/gemini")) {
      logger.info(`[ToolCalling] Gemini model detected (${modelId}) - using non-streaming generateText`);
      return true;
    }

    // Friendli models (deepseek-ai/*, zai-org/*) don't support streaming with tools
    const parsedModelId = modelId.includes(":") ? modelId.split(":")[1] : modelId;
    const isFriendliModel = parsedModelId.startsWith("deepseek-ai/") || parsedModelId.startsWith("zai-org/");
    if (isFriendliModel) {
      logger.info(`[ToolCalling] Friendli model detected (${modelId}) - using non-streaming generateText`);
      return true;
    }
  }

  return false;
}

/**
 * Determine the structured output mode based on API connection and model name.
 *
 * Mode selection logic:
 * 1. Default: "auto" - AI SDK automatically selects the best mode
 * 2. "json" mode - For providers that may not support tool calling consistently
 *    (OpenRouter, Ollama, KoboldCPP, OpenAICompatible)
 * 3. "tool" mode - For specific models that work better with tool calling
 *    (e.g., GLM models don't support JSON schema mode)
 *
 * @param apiSource - The API source/provider
 * @param modelId - The model identifier
 * @returns The mode to use for structured output
 */
export function getStructuredOutputMode(
  apiSource: ApiSource,
  modelId: string,
): "auto" | "json" | "tool" {
  // Log input parameters for debugging
  logger.info(`[StructuredOutput] getStructuredOutputMode called with apiSource: ${apiSource}, modelId: ${modelId}`);

  // Check for model-specific exceptions first
  const modelIdLower = modelId.toLowerCase();

  // GLM models don't support JSON schema mode - use tool mode instead
  if (modelIdLower.includes("glm")) {
    logger.info(`[StructuredOutput] GLM model detected (${modelId}) - switching to tool mode`);
    return "tool";
  }

  // For AstrskAi: Different models have different capabilities
  // - Friendli models (deepseek-ai/*, zai-org/*): no tool calling, use json mode
  // - Gemini models (google/gemini-*): use tool mode (will use tool fallback)
  // - BytePlus models (byteplus/*): supports tool calling, use tool mode
  // - GLM Official (glm-4.6): supports tool calling, use tool mode
  if (apiSource === ApiSource.AstrskAi) {
    // Extract the model ID after "openai-compatible:" prefix if present
    const parsedModelId = modelId.includes(":") ? modelId.split(":")[1] : modelId;
    const isFriendliModel = parsedModelId.startsWith("deepseek-ai/") || parsedModelId.startsWith("zai-org/");

    // Only Friendli models use json mode; all others use tool mode
    const mode = isFriendliModel ? "json" : "tool";
    logger.info(`[StructuredOutput] AstrskAi model (${parsedModelId}) - using ${mode} mode`);
    return mode;
  }

  // Provider-based mode selection
  // Use 'json' mode for providers that may not support tool calling consistently
  if (
    apiSource === ApiSource.OpenRouter ||
    apiSource === ApiSource.Ollama ||
    apiSource === ApiSource.KoboldCPP ||
    apiSource === ApiSource.OpenAICompatible
  ) {
    logger.info(`[StructuredOutput] Provider-based mode: json for ${apiSource}`);
    return "json";
  }

  // Default: let AI SDK automatically select the best mode
  logger.info(`[StructuredOutput] Using default auto mode for ${apiSource}`);
  return "auto";
}

/**
 * Check if the model requires generateText with tool fallback instead of streamObject/generateObject.
 * Some models (like GLM) support tool calling but not the json_schema response_format that AI SDK uses.
 *
 * This function checks:
 * 1. Known models that always need fallback (e.g., GLM)
 * 2. Dynamically cached models that failed with json_schema errors
 *
 * @param apiSource - The API source/provider
 * @param modelId - The model identifier
 * @returns true if should use generateText with tool fallback
 */
export function shouldUseToolFallback(apiSource: ApiSource, modelId: string): boolean {
  const modelIdLower = modelId.toLowerCase();

  // GLM models support tool calling but not json_schema response_format
  if (modelIdLower.includes("glm")) {
    logger.info(`[StructuredOutput] GLM model detected (${modelId}) - using generateText with tool fallback`);
    return true;
  }

  // AstrskAi: Different models have different capabilities
  // - Friendli models (deepseek-ai/*, zai-org/*): use "json" mode, no fallback needed
  // - Gemini models (google/gemini-*): use tool fallback (Vertex AI streaming incompatible with streamObject)
  // - Other models: use tool fallback (backend compatibility)
  if (apiSource === ApiSource.AstrskAi) {
    const parsedModelId = modelId.includes(":") ? modelId.split(":")[1] : modelId;
    const isFriendliModel = parsedModelId.startsWith("deepseek-ai/") || parsedModelId.startsWith("zai-org/");

    // Only Friendli models don't need fallback (they use json mode)
    // if (isFriendliModel) {
    //   return false;
    // }

    // All other AstrskAi models (including Gemini) need tool fallback
    return true;
  }

  // Check dynamic cache for models that previously failed with json_schema errors
  if (isModelCachedForToolFallback(apiSource, modelId)) {
    return true;
  }

  return false;
}

/**
 * Convert JSON Schema to Zod schema for streamObject/generateObject with mode: "tool".
 * Handles common schema patterns including descriptions for better LLM guidance.
 *
 * When using mode: "tool", passing a Zod schema (instead of jsonSchema()) ensures
 * field descriptions are properly sent to the model as tool parameter descriptions.
 */
export function jsonSchemaToZod(schema: JSONSchema7): z.ZodTypeAny {
  if (!schema || typeof schema !== "object") {
    return z.unknown();
  }

  let zodType: z.ZodTypeAny;

  switch (schema.type) {
    case "string":
      if (schema.enum) {
        zodType = z.enum(schema.enum as [string, ...string[]]);
      } else {
        zodType = z.string();
      }
      break;
    case "number":
      zodType = z.number();
      break;
    case "integer":
      zodType = z.number().int();
      break;
    case "boolean":
      zodType = z.boolean();
      break;
    case "null":
      zodType = z.null();
      break;
    case "array":
      zodType = z.array(
        schema.items ? jsonSchemaToZod(schema.items as JSONSchema7) : z.unknown()
      );
      break;
    case "object": {
      if (!schema.properties) {
        zodType = z.record(z.unknown());
      } else {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = schema.required || [];
        for (const [key, value] of Object.entries(schema.properties)) {
          const fieldSchema = jsonSchemaToZod(value as JSONSchema7);
          shape[key] = required.includes(key) ? fieldSchema : fieldSchema.optional();
        }
        zodType = z.object(shape);
      }
      break;
    }
    default:
      // Handle union types (e.g., type: ["string", "null"])
      if (Array.isArray(schema.type)) {
        const types = schema.type.map((t) => jsonSchemaToZod({ ...schema, type: t } as JSONSchema7));
        zodType = z.union(types as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]);
      } else {
        zodType = z.unknown();
      }
  }

  // Add description if present (important for LLM guidance in tool mode)
  if (schema.description) {
    zodType = zodType.describe(schema.description);
  }

  return zodType;
}

/**
 * Separates provider-specific options from general options.
 *
 * Provider-specific keys (google, openai, anthropic, mistral, cohere) are nested
 * under `providerOptions` in the AI SDK call, while general options are spread at top level.
 *
 * Example input: { google: { thinkingConfig: {...} }, context: 24000 }
 * Example output:
 *   - providerSpecificOptions: { google: { thinkingConfig: {...} } }
 *   - generalOptions: { context: 24000 }
 *
 * Final AI SDK call structure:
 *   generateText({ ...settings, ...generalOptions, providerOptions: providerSpecificOptions })
 */
function separateProviderOptions(providerOptions?: Record<string, JSONValue>) {
  const providerSpecificKeys = ['google', 'openai', 'anthropic', 'mistral', 'cohere'];
  const providerSpecificOptions: Record<string, JSONValue> = {};
  const generalOptions: Record<string, JSONValue> = {};

  if (providerOptions) {
    for (const [key, value] of Object.entries(providerOptions)) {
      if (providerSpecificKeys.includes(key)) {
        providerSpecificOptions[key] = value;
      } else {
        generalOptions[key] = value;
      }
    }
  }

  return { providerSpecificOptions, generalOptions };
}

/**
 * Options for generateText with tool fallback
 */
export interface GenerateWithToolFallbackOptions {
  model: LanguageModel;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  schema: JSONSchema7;
  schemaName?: string;
  schemaDescription?: string;
  abortSignal?: AbortSignal;
  isGoogleProvider?: boolean; // Flag to indicate Google Generative AI provider
  modelId?: string; // Model ID to determine thinking parameters (Gemini 2.5 vs 3)
  providerOptions?: Record<string, JSONValue>; // Provider-specific options (including thinking config)
  settings?: Record<string, any>; // AI SDK settings (temperature, topK, maxTokens, etc.)
}

/**
 * Generate structured output using generateText with a tool call.
 * This is a fallback for models that support tool calling but not json_schema response_format.
 *
 * Instead of using streamObject/generateObject which sends response_format with json_schema,
 * this approach defines the schema as a tool parameter and extracts the result from the tool call.
 *
 * For Gemini models, thinking is controlled via providerOptions.google.thinkingConfig:
 * - Gemini 2.5: thinkingBudget (0-24576, 0 = disable)
 * - Gemini 3: thinkingLevel ("low" | "medium" | "high")
 *
 * @returns The parsed object matching the schema
 */
export async function generateWithToolFallback<T>({
  model,
  messages,
  schema,
  schemaName = "output",
  schemaDescription = "Generate the structured output",
  abortSignal,
  isGoogleProvider = false,
  modelId,
  providerOptions,
  settings,
}: GenerateWithToolFallbackOptions): Promise<T> {
  // Convert JSON schema to Zod for tool parameter validation
  const zodSchema = jsonSchemaToZod(schema);

  // Create a tool that accepts the schema as its parameter
  // Using inputSchema (AI SDK naming) with an execute that returns the input as-is
  const outputTool = tool({
    description: schemaDescription,
    inputSchema: zodSchema as z.ZodObject<z.ZodRawShape>,
    execute: async (input: Record<string, unknown>) => input,
  });

  // Add instruction to use the tool
  const messagesWithInstruction = [
    ...messages,
    {
      role: "user" as const,
      content: `Please use the "${schemaName}" tool to provide your response in the required structured format.`,
    },
  ];

  // Separate provider-specific options from general options
  const { providerSpecificOptions, generalOptions } = separateProviderOptions(providerOptions);

  const result = await generateText({
    model,
    messages: messagesWithInstruction,
    tools: { [schemaName]: outputTool },
    toolChoice: { type: "tool", toolName: schemaName },
    abortSignal,
    ...(settings || {}),
    ...(generalOptions as any),
    ...(Object.keys(providerSpecificOptions).length > 0 ? { providerOptions: providerSpecificOptions as any } : {}),
  });

  // Extract the result from the tool call
  // toolCalls contains the parsed input from the model's tool call
  const toolCalls = result.toolCalls || [];
  const outputCall = toolCalls.find((call) => call.toolName === schemaName);

  if (!outputCall) {
    throw new Error("Model did not produce structured output via tool call");
  }

  // AI SDK uses 'input' property for tool call parameters (not 'args')
  return (outputCall as unknown as { input: T }).input;
}

/**
 * Stream structured output using streamText with tool calling (AI SDK v5).
 * This uses streamText's tool-input-delta events to stream partial objects.
 *
 * @returns Async generator that yields partial objects as they stream
 */
export async function* streamWithToolFallback<T>({
  model,
  messages,
  schema,
  schemaName = "output",
  schemaDescription = "Generate the structured output",
  abortSignal,
  isGoogleProvider = false,
  providerOptions,
  settings,
}: GenerateWithToolFallbackOptions): AsyncGenerator<T, void, unknown> {
  // Convert JSON schema to Zod for tool parameter validation
  const zodSchema = jsonSchemaToZod(schema);

  // Create a tool that accepts the schema as its parameter
  const outputTool = tool({
    description: schemaDescription,
    inputSchema: zodSchema as z.ZodObject<z.ZodRawShape>,
    execute: async (input: Record<string, unknown>) => input,
  });

  // Add instruction to use the tool
  const messagesWithInstruction = [
    ...messages,
    {
      role: "user" as const,
      content: `Please use the "${schemaName}" tool to provide your response in the required structured format.`,
    },
  ];

  // Separate provider-specific options from general options
  const { providerSpecificOptions, generalOptions } = separateProviderOptions(providerOptions);

  const result = streamText({
    model,
    messages: messagesWithInstruction,
    tools: { [schemaName]: outputTool },
    toolChoice: { type: "tool", toolName: schemaName },
    abortSignal,
    ...(settings || {}),
    ...(generalOptions as any),
    ...(Object.keys(providerSpecificOptions).length > 0 ? { providerOptions: providerSpecificOptions as any } : {}),
  });

  let accumulatedArgs = "";
  let deltaCount = 0;
  let yieldCount = 0;
  let latestObjectJson: any = undefined; // Track raw JSON
  let latestObject: Partial<T> = {}; // Track validated object

  // For Google: Check if we can access raw text deltas from the stream
  let googleArgsAccumulator = "";

  // Stream the tool call parameters as they arrive
  for await (const chunk of result.fullStream) {

    // Handle tool-input-delta (standard OpenAI format)
    if (chunk.type === "tool-input-delta" && chunk.id) {
      deltaCount++;
      accumulatedArgs += chunk.delta;

      // Use AI SDK's parsePartialJson to intelligently parse incomplete JSON
      const { value: currentObjectJson, state: parseState } =
        await parsePartialJson(accumulatedArgs);

      // Only process if we got valid JSON and it's different from before
      if (
        currentObjectJson !== undefined &&
        !isDeepEqualData(latestObjectJson, currentObjectJson)
      ) {
        // Validate the partial result with the schema
        try {
          const validationResult = zodSchema.safeParse(currentObjectJson);

          if (validationResult.success) {
            const partialObject = validationResult.data as T;

            // Check if the validated object is different
            if (!isDeepEqualData(latestObject, partialObject)) {
              latestObjectJson = currentObjectJson;
              latestObject = partialObject;
              yieldCount++;

              yield partialObject;
            }
          }
        } catch (error) {
          logger.debug(`[ToolFallback] Validation error: ${error}`);
        }
      }
    }

    // Final tool call with complete data
    if (chunk.type === "tool-call" && chunk.toolName === schemaName) {

      // AI SDK v5 uses 'input' property for tool call parameters
      const finalObject = (chunk as any).input as T;

      // Only yield final if different from last partial
      if (!isDeepEqualData(finalObject, latestObject)) {
        yieldCount++;
        yield finalObject;
      }
      return;
    }
  }

  throw new Error("Model did not produce structured output via tool call");
}
