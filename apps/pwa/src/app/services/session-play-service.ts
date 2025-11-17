import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createXai } from "@ai-sdk/xai";
import {
  createOpenRouter,
  OpenRouterProviderSettings,
} from "@openrouter/ai-sdk-provider";
import {
  generateObject,
  generateText,
  jsonSchema,
  JSONValue,
  LanguageModelV1,
  smoothStream,
  streamObject,
  streamText,
} from "ai";
import { JSONSchema7 } from "json-schema";
import { cloneDeep, merge } from "lodash-es";
import { createOllama } from "ollama-ai-provider";

import { fetchAgent } from "@/entities/agent/api/query-factory";
import { fetchApiConnections } from "@/entities/api/api-connection-queries";
import {
  fetchCharacterCard,
  fetchCharacterCardOptional,
  fetchScenarioCardOptional,
} from "@/entities/card/api/query-factory";
import { fetchDataStoreNode } from "@/entities/data-store-node/api/query-factory";
import { fetchFlow } from "@/entities/flow/api/query-factory";
import { fetchIfNode } from "@/entities/if-node/api/query-factory";
import { fetchSession } from "@/entities/session/api";
import { fetchTurn, fetchTurnOptional } from "@/entities/turn/api/turn-queries";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { useAppStore } from "@/shared/stores/app-store";
import { useWllamaStore } from "@/shared/stores/wllama-store";
import { Condition, isUnaryOperator } from "@/features/flow/types/condition-types";
import { traverseFlowCached } from "@/features/flow/utils/flow-traversal";
import { ModelTier } from "@/entities/agent/domain";
import { ApiSource } from "@/entities/api/domain";
import {
  ApiConnection,
  OpenrouterProviderSort,
} from "@/entities/api/domain/api-connection";
import { PlotCard, ScenarioCard } from "@/entities/card/domain";
import { CharacterCard } from "@/entities/card/domain/character-card";
import { DataStoreFieldType } from "@/entities/flow/domain/flow";
import { IfNode } from "@/entities/if-node/domain";
import { Session } from "@/entities/session/domain/session";
import { DataStoreSavedField, Option } from "@/entities/turn/domain/option";
import { Turn as MessageEntity } from "@/entities/turn/domain/turn";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import {
  Character,
  HistoryItem,
  Message,
  Renderable,
  RenderContext,
} from "@/shared/prompt/domain/renderable";
import { parameterList } from "@/shared/task/domain/parameter";
import { parseAiSdkErrorMessage, parsePartialJson, sanitizeFileName } from "@/shared/lib";
import { Datetime } from "@/shared/lib/datetime";
import { logger } from "@/shared/lib/logger";
import { TemplateRenderer } from "@/shared/lib/template-renderer";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import { translate } from "@/shared/lib/translate-utils";
import { getAISDKFetch } from "@/shared/infra/fetch-helper";

// Model mapping configuration for automatic fallback
// When using AstrskAi, format must be "ApiSource:modelId"
// where ApiSource is a valid value from ApiSource enum that makeProvider can handle
const MODEL_TIER_MAPPING = {
  [ModelTier.Light]: "openai-compatible:google/gemini-2.5-flash",
  [ModelTier.Heavy]: "openai-compatible:deepseek/deepseek-chat-v3.1",
} as const;

// Display names for the fallback models
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai-compatible:google/gemini-2.5-flash": "Gemini 2.5 Flash",
  "openai-compatible:deepseek/deepseek-chat-v3.1": "DeepSeek v3.1",
};

// Helper function to check if user is logged in
const isUserLoggedIn = (): boolean => {
  const jwt = useAppStore.getState().jwt;
  return !!jwt;
};

// TODO: Add subscription check for automatic model mapping
const isUserSubscribed = (): boolean => {
  // For now, we just check if user is logged in
  // Later, this should check actual subscription status
  return isUserLoggedIn();
};

// Helper function to get fallback model based on tier
const getFallbackModel = (modelTier?: ModelTier): string | null => {
  if (!modelTier) {
    // Default to light tier if not specified
    return MODEL_TIER_MAPPING[ModelTier.Light];
  }
  return MODEL_TIER_MAPPING[modelTier] || null;
};

const makeContext = async ({
  session,
  characterCardId,
  regenerateMessageId,
  includeHistory = true,
}: {
  session: Session;
  characterCardId?: UniqueEntityID;
  regenerateMessageId?: UniqueEntityID;
  includeHistory?: boolean;
}): Promise<Result<RenderContext>> => {
  // Set `{{session.duration}}`
  const now = Datetime();
  const sessionDuration = Datetime.duration(now.diff(session.createdAt));

  // Make context
  const context: RenderContext = {
    cast: {
      all: [],
      inactive: [],
    },
    session: {
      char_entries: [],
      plot_entries: [],
      entries: [],
      duration: sessionDuration,
    },
    history: [],
  };

  // Get plot card (can be PlotCard or ScenarioCard)
  let plotCard: PlotCard | ScenarioCard | null = null;
  if (session.plotCard && session.plotCard.enabled) {
    plotCard = await fetchScenarioCardOptional(session.plotCard.id);
  }

  // Set `{{session.scenario}}`
  if (plotCard && plotCard.props.description) {
    context.session.scenario = plotCard.props.description;
  }

  // Set `{{history}}` and prepare dataStore for regeneration
  if (includeHistory) {
    const history: HistoryItem[] = [];
    const lastMessageId = session.turnIds[session.turnIds.length - 1];
    let dataStoreForRegeneration: DataStoreSavedField[] = [];

    for (const messageId of session.turnIds) {
      if (regenerateMessageId && messageId.equals(regenerateMessageId)) {
        break;
      }
      let message;
      try {
        message = await fetchTurn(messageId);
      } catch (error) {
        logger.error(
          `Failed to get message by id ${messageId.toString()}: ${error}`,
        );
        continue;
      }

      // Store dataStore from the last processed turn for regeneration
      if (message.dataStore && message.dataStore.length > 0) {
        dataStoreForRegeneration = cloneDeep(message.dataStore);
      }

      const content =
        session.translation && session.translation.promptLanguage !== "none"
          ? message.translations.get(session.translation.promptLanguage)
          : message.content;

      // Set `{{session.idle_duration}}`
      if (lastMessageId.equals(messageId)) {
        const idleDuration = Datetime.duration(now.diff(message.createdAt));
        context.session.idle_duration = idleDuration;
      }

      if (!content) {
        continue;
      }
      history.push({
        char_id: message.characterCardId?.toString(),
        char_name: message.characterName,
        content: content,
        variables: message.variables,
      });
    }
    context.history = history;

    // Set dataStore for regeneration context
    if (regenerateMessageId && dataStoreForRegeneration.length > 0) {
      context.dataStore = dataStoreForRegeneration;
    }
  }

  // Make entries list
  const entries: string[] = [];
  const all_char_entries: string[] = [];

  // Set `{{char}}`, `{{user}}`, `{{cast.all}}`
  const allCharacters: Character[] = [];
  const historyContent =
    context.history?.map((item) => item.content).reverse() ?? [];
  for (const allCharCardItem of session.characterCards) {
    // Skip if disabled
    if (!allCharCardItem.enabled) {
      continue;
    }

    // Get character card
    let characterCard: CharacterCard;
    try {
      characterCard = await fetchCharacterCard(allCharCardItem.id);
    } catch (error) {
      console.warn(
        `Character card not found: ${allCharCardItem.id.toString()}`,
      );
      continue;
    }

    // Scan lorebook
    let activatedEntries: string[] = [];
    if (characterCard.props.lorebook) {
      try {
        activatedEntries = characterCard.props.lorebook
          .scanHistory(historyContent)
          .throwOnFailure()
          .getValue()
          .map((entry) => entry.content);
        entries.push(...activatedEntries);
        all_char_entries.push(...activatedEntries);
      } catch (error) {
        // Ignore lorebook scan errors
        console.log("Lorebook scan error:", error);
      }
    }

    // Make character variable
    const character = {
      id: characterCard.id.toString(),
      name: characterCard.props.name ?? characterCard.props.title,
      description: characterCard.props.description,
      example_dialog: characterCard.props.exampleDialogue,
      entries: activatedEntries,
    } as Character;

    // Add to list
    allCharacters.push(character);

    // Set {{user}} and {{char}}
    if (characterCard.id.equals(characterCardId)) {
      context.char = character;
    }
    if (characterCard.id.equals(session.userCharacterCardId)) {
      context.user = character;
    }
  }

  // Set `{{cast.all}}`
  context.cast.all = allCharacters;

  // Set `{{cast.active}}` and `{{cast.inactive}}`
  if (characterCardId) {
    const activeCharacter = allCharacters.find(
      (char) => char.id === characterCardId.toString(),
    );
    if (activeCharacter) {
      context.cast.active = activeCharacter;
      context.cast.inactive = allCharacters.filter(
        (char) => char.id !== activeCharacter.id,
      );
    }
  }

  // Render variables in characters
  for (let i = 0; i <= 1; i++) {
    for (const char of allCharacters) {
      try {
        char.name = TemplateRenderer.render(char.name || "", context);
        char.description = TemplateRenderer.render(
          char.description || "",
          context,
        );
        char.example_dialog = TemplateRenderer.render(
          char.example_dialog || "",
          context,
        );
      } catch (error) {
        logger.error(
          `Failed to render variables of character ${char.name}`,
          error,
        );
      }
    }
  }

  // Set `{{session.plot_entries}}`
  if (plotCard && plotCard.props.lorebook) {
    // Scan lorebook
    try {
      const activatedEntries = plotCard.props.lorebook
        .scanHistory(historyContent)
        .throwOnFailure()
        .getValue()
        .map((entry) => TemplateRenderer.render(entry.content || "", context));
      entries.push(...activatedEntries);
      context.session.plot_entries = activatedEntries;
    } catch (error) {
      // Ignore lorebook scan errors
    }
  }

  // Set `{{session.entries}}`, `{{session.char_entries}}`
  context.session.entries = entries.map((entry) =>
    TemplateRenderer.render(entry || "", context),
  );
  context.session.char_entries = all_char_entries.map((entry) =>
    TemplateRenderer.render(entry || "", context),
  );

  return Result.ok(context);
};

const parametersInModelSettings = ["safety_settings"];

const makeModelSettings = ({
  parameters,
  apiSource,
}: {
  parameters: Map<string, any>;
  apiSource: ApiSource;
}) => {
  const settings: Record<string, any> = {};
  for (const tuple of parameters) {
    const [paramId, paramValueRaw] = tuple;

    // Check param in model settings
    if (!parametersInModelSettings.includes(paramId)) {
      continue;
    }

    // Set param value
    const parameter = parameterList.find((p) => p.id === paramId);
    if (!parameter) {
      continue;
    }
    const paramValue = parameter?.parsingFunction
      ? parameter.parsingFunction(paramValueRaw, apiSource)
      : paramValueRaw;
    if (parameter.nameByApiSource.size === 0) {
      settings[paramId] = paramValue;
    } else {
      const nameByApiSource = parameter.nameByApiSource.get(apiSource);
      if (!nameByApiSource) {
        continue;
      }
      settings[nameByApiSource] = paramValue;
    }
  }
  return settings;
};

const parametersInSettings = [
  "max_tokens",
  "temperature",
  "top_p",
  "top_k",
  "presence_pen",
  "freq_pen",
  "stop_sequence",
  "seed",
];

const makeSettings = ({ parameters }: { parameters: Map<string, any> }) => {
  const settings: Record<string, any> = {};

  if (parameters.has("max_tokens")) {
    settings["maxTokens"] = Number(parameters.get("max_tokens"));
  }

  if (parameters.has("temperature")) {
    settings["temperature"] = Number(parameters.get("temperature"));
  } else {
    // Prevent AI SDK set temperature to 0
    // TODO: delete this code after upgrade to AI SDK v5
    // https://ai-sdk.dev/docs/ai-sdk-core/settings#temperature
    settings["temperature"] = 1;
  }

  if (parameters.has("top_p")) {
    settings["topP"] = Number(parameters.get("top_p"));
  }

  if (parameters.has("top_k")) {
    settings["topK"] = Number(parameters.get("top_k"));
  }

  if (parameters.has("presence_pen")) {
    settings["presencePenalty"] = Number(parameters.get("presence_pen"));
  }

  if (parameters.has("freq_pen")) {
    settings["frequencyPenalty"] = Number(parameters.get("freq_pen"));
  }

  if (parameters.has("stop_sequence")) {
    settings["stopSequences"] = String(parameters.get("stop_sequence"))
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  if (parameters.has("seed")) {
    settings["seed"] = Number.parseInt(parameters.get("seed"));
  }

  return settings;
};

const makeProviderOptions = ({
  parameters,
  apiSource,
}: {
  parameters: Map<string, any>;
  apiSource: ApiSource;
}): Record<string, JSONValue> => {
  const options: Record<string, JSONValue> = {};
  for (const tuple of parameters) {
    const [paramId, paramValueRaw] = tuple;

    // Check param by ai sdk
    if (
      parametersInSettings.includes(paramId) ||
      parametersInModelSettings.includes(paramId)
    ) {
      continue;
    }

    // Set param value
    const parameter = parameterList.find((p) => p.id === paramId);
    if (!parameter) {
      continue;
    }
    const paramValue = parameter?.parsingFunction
      ? parameter.parsingFunction(paramValueRaw, apiSource)
      : paramValueRaw;
    if (parameter.nameByApiSource.size === 0) {
      options[paramId] = paramValue;
    } else {
      const nameByApiSource = parameter.nameByApiSource.get(apiSource);
      if (!nameByApiSource) {
        continue;
      }
      options[nameByApiSource] = paramValue;
    }
  }
  return options;
};

const makeLMStudioRequestParams = ({
  parameters,
}: {
  parameters: Map<string, any>;
}): Record<string, any> => {
  const requestParams: Record<string, any> = {};

  for (const [paramId, paramValueRaw] of parameters) {
    const parameter = parameterList.find((p) => p.id === paramId);
    if (!parameter) {
      continue;
    }

    const paramValue = parameter.parsingFunction
      ? parameter.parsingFunction(paramValueRaw, ApiSource.LMStudio)
      : paramValueRaw;

    const lmStudioParamName = parameter.nameByApiSource.get(ApiSource.LMStudio);

    if (lmStudioParamName) {
      requestParams[lmStudioParamName] = paramValue;
    } else if (parameter.nameByApiSource.size === 0) {
      requestParams[paramId] = paramValue;
    }
  }

  return requestParams;
};

const transformMessagesForModel = (
  messages: Message[],
  modelId?: string,
): Message[] => {
  // No transformation needed if no modelId
  if (!modelId) {
    return messages;
  }

  // Transform for Gemini or Claude models
  if (modelId.includes("gemini") || modelId.includes("claude")) {
    let nonSystemMessageFound = false;

    // First, check if we need to add a filler user message
    // Find the first non-system message
    const firstNonSystemIndex = messages.findIndex(
      (msg) => msg.role !== "system",
    );

    // Check if we need a filler user message:
    // 1. When there are only system messages (firstNonSystemIndex === -1) AND messages array is not empty
    // 2. When the first non-system message is an assistant message
    const needsFillerUser =
      (firstNonSystemIndex === -1 && messages.length > 0) || // Only system messages exist (but not empty)
      (firstNonSystemIndex !== -1 &&
        messages[firstNonSystemIndex].role === "assistant");

    const transformedMessages: Message[] = messages.map((message) => {
      // Once we find a non-system message, mark it
      if (message.role !== "system") {
        nonSystemMessageFound = true;
        return message;
      }

      // Keep system messages at the beginning (before any non-system message)
      if (message.role === "system" && !nonSystemMessageFound) {
        return message;
      }

      // Convert system messages that come after non-system messages to user
      return { ...message, role: "user" as Message["role"] };
    });

    // If we need to add a filler user message
    if (needsFillerUser) {
      const fillerUserMessage: Message = {
        role: "user",
        content:
          "Respond based on the information and instructions provided above.",
      };

      if (firstNonSystemIndex === -1) {
        // Only system messages exist, add filler user message at the end
        transformedMessages.push(fillerUserMessage);
      } else {
        // Insert before the first non-system message (which is an assistant message)
        const firstNonSystemIndexInTransformed = transformedMessages.findIndex(
          (msg) => msg.role !== "system",
        );
        if (firstNonSystemIndexInTransformed !== -1) {
          transformedMessages.splice(
            firstNonSystemIndexInTransformed,
            0,
            fillerUserMessage,
          );
        }
      }
    }

    return transformedMessages;
  }

  return messages;
};

const validateMessages = (messages: Message[], apiSource: ApiSource) => {
  if (apiSource === ApiSource.GoogleGenerativeAI) {
    const hasUserMessage = messages.some((message) => message.role === "user");
    if (!hasUserMessage) {
      throw new Error(
        "Google Generative AI requires at least one user message",
      );
    }
  }
};

const makeProvider = ({
  source,
  apiKey,
  baseUrl,
  isStructuredOutput,
  openrouterProviderSort,
}: {
  source: ApiSource;
  apiKey?: string;
  baseUrl?: string;
  isStructuredOutput?: boolean;
  openrouterProviderSort?: OpenrouterProviderSort;
}) => {
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
        baseURL: baseUrl,
        headers: {
          "HTTP-Referer": "https://astrsk.ai",
          "X-Title": "astrsk",
        },
      };
      const extraBody = {};
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
      options.extraBody = extraBody;
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
      let ollamaBaseUrl = baseUrl ?? "http://localhost:11434";
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
      let lmStudioBaseUrl = baseUrl ?? "http://localhost:1234";
      // No hardcoded /v1 - let fetch auto-retry with /v1 if needed
      provider = createOpenAICompatible({
        name: "lmstudio",
        apiKey: apiKey || "",  // LM Studio doesn't require API key
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
};

const generateNonAiSdkMessage = async ({
  apiConnection,
  modelId,
  messages,
  parameters,
  abortSignal,
}: {
  apiConnection: ApiConnection;
  modelId: string;
  messages: Message[];
  parameters?: Map<string, any>;
  abortSignal?: AbortSignal;
}) => {
  switch (apiConnection.source) {
    case ApiSource.Wllama:
      return generateMessageWllama({
        modelId,
        messages,
        abortSignal,
      });

    case ApiSource.AIHorde:
      return generateMessageAIHorde({
        modelId,
        messages,
        parameters,
        abortSignal,
        apiConnection,
      });

    default:
      throw new Error("Invalid API connection source");
  }
};

async function* streamTextDummy({
  abortSignal,
}: {
  abortSignal?: AbortSignal;
}) {
  const chunks = [
    "Oh no!\n",
    "This is a Dummy Model for onboarding,\n",
    "Please go to the Model tab\n",
    "to connect a new model provider\n",
    "and select a model to proceed.",
  ];

  for (const chunk of chunks) {
    if (abortSignal?.aborted) {
      return;
    }
    yield chunk;
    await sleep(100);
  }
}

const generateDummyMessage = async ({
  abortSignal,
}: {
  abortSignal?: AbortSignal;
}) => {
  const textStream = streamTextDummy({
    abortSignal,
  });

  return { textStream };
};

const textDecoder = new TextDecoder();

async function* streamTextWllama({
  modelId,
  messages,
  abortSignal,
}: {
  modelId: string;
  messages: Message[];
  abortSignal?: AbortSignal;
}) {
  let results: string[] = [];
  let done = false;
  let resolve: (value?: string) => void;
  let reject: (value?: string) => void;
  let promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // Load model
  const { wllama, loadedModelUrl: loadedModel } = useWllamaStore.getState();
  if (loadedModel !== modelId) {
    if (loadedModel) {
      await wllama.exit();
    }
    await wllama.loadModelFromUrl(modelId);
    useWllamaStore.setState({ loadedModelUrl: modelId });
  }

  // Create completion
  const chatTemplate = wllama.getChatTemplate();
  const prompt = await TemplateRenderer.render(chatTemplate || "", {
    messages,
    add_generation_prompt: true,
  });
  const text = wllama.createCompletion(prompt, {
    // TODO: fix cache error
    // useCache: true,
    onNewToken(token: any, piece: any, currentText: any, optionals: any) {
      if (abortSignal?.aborted) {
        optionals.abortSignal();
      }
      results.push(textDecoder.decode(piece));
      resolve();
      promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
    },
  });

  text.catch((error: any) => {
    console.error(error);
    done = true;
    reject();
  });

  text.finally(() => {
    done = true;
    resolve();
  });

  while (!done) {
    await promise;
    yield* results;
    results = [];
  }
}

const generateMessageWllama = async ({
  modelId,
  messages,
  abortSignal,
}: {
  modelId: string;
  messages: Message[];
  abortSignal?: AbortSignal;
}) => {
  // Create completion
  const textStream = streamTextWllama({
    modelId,
    messages,
    abortSignal,
  });

  return { textStream };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* streamTextAIHorde({
  modelId,
  messages,
  parameters,
  abortSignal,
  apiConnection,
}: {
  modelId: string;
  messages: Message[];
  parameters?: Map<string, any>;
  abortSignal?: AbortSignal;
  apiConnection: ApiConnection;
}) {
  // Convert messages to prompt
  const prompt = messages.map((msg) => msg.content).join("\n");
  const body: Record<string, any> = {
    prompt: prompt,
  };

  // Convert parameters
  const params: Record<string, any> = {};
  parameters?.forEach((value, key) => {
    const param = parameterList.find((p) => p.id === key);
    const parsedValue = param?.parsingFunction
      ? param.parsingFunction(value)
      : value;
    if (param) {
      if (param.nameByApiSource.size === 0) {
        params[key] = parsedValue;
      } else if (param.nameByApiSource.has(ApiSource.KoboldCPP)) {
        const koboldName = param.nameByApiSource.get(ApiSource.KoboldCPP);
        if (koboldName) {
          params[koboldName] = parsedValue;
        }
      }
    }
  });
  body["params"] = params;

  // Set model id
  body["models"] = [modelId];

  try {
    // Request generate text async
    const responseGenerate = await fetch(
      "https://aihorde.net/api/v2/generate/text/async",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiConnection.apiKey!,
        },
        body: JSON.stringify(body),
      },
    );
    if (!responseGenerate.ok) {
      throw new Error(`HTTP error! status: ${responseGenerate.status}`);
    }

    // Get request id
    const generateResponseBody = await responseGenerate.json();
    const requestId = generateResponseBody.id;

    // Poll for results
    while (true) {
      abortSignal?.throwIfAborted();

      const responseResult = await fetch(
        `https://aihorde.net/api/v2/generate/text/status/${requestId}`,
      );
      if (responseResult.ok) {
        const resultResponseBody = await responseResult.json();
        if (
          resultResponseBody.done &&
          resultResponseBody.generations.length > 0 &&
          resultResponseBody.generations[0].text
        ) {
          yield resultResponseBody.generations[0].text;
          break;
        }
        let delay = 10000; // 10 seconds
        if (resultResponseBody.processing) {
          delay = 5000; // 5 seconds
        }
        await sleep(delay);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return;
      }
      throw error;
    }
  }
}

const generateMessageAIHorde = async ({
  modelId,
  messages,
  parameters,
  abortSignal,
  apiConnection,
}: {
  modelId: string;
  messages: Message[];
  parameters?: Map<string, any>;
  abortSignal?: AbortSignal;
  apiConnection: ApiConnection;
}) => {
  const textStream = streamTextAIHorde({
    modelId,
    messages,
    parameters,
    abortSignal,
    apiConnection,
  });

  return { textStream };
};

async function* streamObjectLMStudio({
  modelId,
  messages,
  parameters,
  schema,
  abortSignal,
  apiConnection,
  streaming,
}: {
  modelId: string;
  messages: Message[];
  parameters: Map<string, any>;
  schema: { typeDef: JSONSchema7; name?: string; description?: string };
  abortSignal?: AbortSignal;
  apiConnection: ApiConnection;
  streaming: boolean;
}) {
  const baseUrl = apiConnection.baseUrl || "http://localhost:1234";
  const endpoint = baseUrl.endsWith("/v1")
    ? `${baseUrl}/chat/completions`
    : `${baseUrl}/v1/chat/completions`;

  const requestParams = makeLMStudioRequestParams({ parameters });

  const jsonSchemaFormat = {
    type: "json_schema",
    json_schema: {
      name: schema.name || "response",
      description: schema.description || "Response schema",
      schema: schema.typeDef,
      strict: false,
    }
  };

  const requestBody = {
    model: modelId,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    response_format: jsonSchemaFormat,
    stream: streaming,
    ...requestParams,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiConnection.apiKey && { Authorization: `Bearer ${apiConnection.apiKey}` }),
    },
    body: JSON.stringify(requestBody),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[LM Studio] API error:", errorText);
    throw new Error(`LM Studio API error: ${response.status} ${errorText}`);
  }

  if (streaming) {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body reader");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedContent = "";
    let lastYieldedContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || line.trim() === "data: [DONE]") continue;

          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              const chunk = JSON.parse(jsonStr);
              const delta = chunk.choices?.[0]?.delta?.content;

              if (delta) {
                accumulatedContent += delta;

                // Try to parse the partial JSON
                const partialObject = parsePartialJson(accumulatedContent);

                if (partialObject && accumulatedContent !== lastYieldedContent) {
                  yield partialObject;
                  lastYieldedContent = accumulatedContent;
                }
              }
            } catch (parseError) {
              console.warn("[LM Studio] Failed to parse SSE line:", line);
            }
          }
        }
      }

      // Final object - make sure we yield the complete final object
      if (accumulatedContent) {
        try {
          const finalObject = JSON.parse(accumulatedContent);

          // Only yield if different from last yielded
          if (accumulatedContent !== lastYieldedContent) {
            yield finalObject;
          }
        } catch (error) {
          console.error("[LM Studio] Invalid final JSON:", accumulatedContent);
          throw new Error(`Invalid JSON from LM Studio: ${accumulatedContent}`);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LM Studio response");
    }

    const object = JSON.parse(content);
    yield object;
  }
}

const createMessage = async ({
  sessionId,
  characterCardId,
  defaultCharacterName,
  messageContent,
  variables = {},
  messageId,
}: {
  sessionId: UniqueEntityID;
  characterCardId?: UniqueEntityID;
  defaultCharacterName?: string;
  messageContent: string;
  variables?: Record<string, any>;
  messageId?: UniqueEntityID;
}): Promise<Result<MessageEntity>> => {
  // Get session to access last turn's dataStore
  const session = await fetchSession(sessionId);

  // Get last turn's dataStore if exists
  let dataStore: DataStoreSavedField[] = [];
  if (session.turnIds.length > 0) {
    const lastTurnId = session.turnIds[session.turnIds.length - 1];
    try {
      const lastTurn = await fetchTurnOptional(lastTurnId);
      if (lastTurn) {
        // Clone the dataStore to avoid mutations
        dataStore = cloneDeep(lastTurn.dataStore);
      }
    } catch (error) {
      logger.warn(`Failed to get last turn's dataStore: ${error}`);
    }
  }

  // Get character name
  let characterName: string | null = defaultCharacterName || null;
  if (characterCardId) {
    const characterCard = await fetchCharacterCardOptional(characterCardId);
    if (characterCard) {
      characterName = characterCard.props.name || characterCard.props.title;
    }
  }

  // Create message
  const option = Option.create({
    content: messageContent,
    tokenSize: 0, // TODO: calculate token size
    variables: variables,
    dataStore: dataStore,
  }).getValue();
  return MessageEntity.create(
    {
      sessionId: sessionId,
      characterCardId: characterCardId,
      characterName: characterName || undefined,
      options: [option],
    },
    messageId,
  );
};

/**
 * @deprecated use mutation `useAddMessage()`
 */
const addMessage = async ({
  sessionId,
  characterCardId,
  defaultCharacterName,
  messageContent,
  variables = {},
  isUser = false,
  messageId,
}: {
  sessionId: UniqueEntityID;
  characterCardId?: UniqueEntityID;
  defaultCharacterName?: string;
  messageContent: string;
  variables?: Record<string, any>;
  isUser?: boolean;
  messageId?: UniqueEntityID;
}): Promise<Result<MessageEntity>> => {
  // Get session
  const session = await fetchSession(sessionId);

  // Create message
  const message = (
    await createMessage({
      sessionId: sessionId,
      characterCardId: characterCardId,
      defaultCharacterName: defaultCharacterName,
      messageContent: messageContent,
      variables: variables,
      messageId: messageId,
    })
  )
    .throwOnFailure()
    .getValue();

  // Add message
  const sessionAndMessage = (
    await SessionService.addMessage.execute({
      sessionId: sessionId,
      message: message,
    })
  )
    .throwOnFailure()
    .getValue();

  // Translate message
  if (messageContent.trim() !== "" && session.translation) {
    (
      await TurnService.translateTurn.execute({
        turnId: sessionAndMessage.message.id,
        config: session.translation,
      })
    ).throwOnFailure();
  }

  return Result.ok(sessionAndMessage.message);
};

async function renderMessages({
  renderable,
  context,
  parameters,
}: {
  renderable: Renderable;
  context: any;
  parameters: Map<string, any>;
}): Promise<Message[]> {
  // Render system prompt
  const { history: fullHistory, ...contextWithoutHistory } = context;
  const systemPrompt = (await renderable.renderMessages(contextWithoutHistory))
    .throwOnFailure()
    .getValue();

  // Get token budget
  const contextTokenSize = (parameters.get("context") as number) || Infinity;
  const responseTokenSize = (parameters.get("max_tokens") as number) || 0;
  const tokenBudget = contextTokenSize - responseTokenSize - 200; // padding 200 tokens

  // Check system prompt is too long
  const tokenizer = await getTokenizer();
  const systemPromptTokenSize = tokenizer.encode(
    systemPrompt.map((message) => message.content).join("\n"),
  ).length;
  if (systemPromptTokenSize > tokenBudget) {
    throw new Error("System prompt is too long");
  }

  // Render messages with history
  let messages = cloneDeep(systemPrompt);
  let historySize = 1;
  while (historySize <= fullHistory.length) {
    // Slice history by latest
    const slicedHistory = fullHistory.slice(-historySize);

    // Render messages with sliced history
    const newMessages = (
      await renderable.renderMessages({
        ...contextWithoutHistory,
        history: slicedHistory,
      })
    )
      .throwOnFailure()
      .getValue();

    // Check token size
    const newMessagesTokenSize = tokenizer.encode(
      newMessages.map((message) => message.content).join("\n"),
    ).length;
    if (newMessagesTokenSize > tokenBudget) {
      break;
    }

    // Save messages
    messages = newMessages;

    // Increment history size
    historySize += 1;
  }

  // Filter empty messages
  return messages.filter((message) => message.content.trim() !== "");
}

async function generateTextOutput({
  apiConnection,
  modelId,
  messages,
  parameters,
  stopSignalByUser,
  streaming,
  creditLog,
}: {
  apiConnection: ApiConnection;
  modelId: string;
  messages: Message[];
  parameters: Map<string, any>;
  stopSignalByUser?: AbortSignal;
  streaming?: boolean;
  creditLog?: object;
}) {
  // Transform messages for specific models
  const transformedMessages = transformMessagesForModel(messages, modelId);

  // Timeout and abort signals
  const abortSignals: AbortSignal[] = [];
  if (stopSignalByUser) {
    abortSignals.push(stopSignalByUser);
  }
  if (apiConnection.source === ApiSource.AIHorde) {
    abortSignals.push(new AbortController().signal); // Dummy signal
  } else {
    abortSignals.push(AbortSignal.timeout(120000)); // Timeout 120 seconds
  }
  const combinedAbortSignal = AbortSignal.any(abortSignals);

  // Request by API source
  let provider;
  let parsedModelId = modelId;
  switch (apiConnection.source) {
    // Route by model provider
    case ApiSource.AstrskAi: {
      const modelIdSplitted = modelId.split(":");
      const astrskSource = modelIdSplitted.at(0) as ApiSource;
      parsedModelId = modelIdSplitted.at(1) ?? modelId;
      const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${astrskSource}`;
      provider = makeProvider({
        source: modelIdSplitted.at(0) as ApiSource,
        apiKey: "DUMMY",
        baseUrl: astrskBaseUrl,
      });
      break;
    }

    // Request by AI SDK
    case ApiSource.OpenAI:
    case ApiSource.OpenAICompatible:
    case ApiSource.Anthropic:
    case ApiSource.OpenRouter:
    case ApiSource.GoogleGenerativeAI:
    case ApiSource.Ollama:
    case ApiSource.LMStudio:
    case ApiSource.DeepSeek:
    case ApiSource.xAI:
    case ApiSource.Mistral:
    case ApiSource.Cohere:
    case ApiSource.KoboldCPP:
      provider = makeProvider({
        source: apiConnection.source,
        apiKey: apiConnection.apiKey,
        baseUrl: apiConnection.baseUrl,
        openrouterProviderSort: apiConnection.openrouterProviderSort,
      });
      break;

    // Request by non-AI SDK
    case ApiSource.Wllama:
    case ApiSource.AIHorde:
      return generateNonAiSdkMessage({
        apiConnection,
        modelId,
        messages,
        parameters,
        abortSignal: stopSignalByUser,
      });

    case ApiSource.Dummy:
      return generateDummyMessage({
        abortSignal: stopSignalByUser,
      });

    default:
      throw new Error("Invalid API connection source");
  }

  // Make model settings
  const modelSettings = makeModelSettings({
    parameters: parameters,
    apiSource: apiConnection.source,
  });

  // Make model
  const model =
    "chat" in provider
      ? provider.chat(parsedModelId, modelSettings)
      : (provider.languageModel(
          parsedModelId,
          modelSettings,
        ) as LanguageModelV1);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
  });
  const modelProvider = model.provider.split(".").at(0);

  // Extra headers for astrsk
  const jwt = useAppStore.getState().jwt;
  const headers = {
    Authorization: `Bearer ${jwt}`,
    "x-astrsk-credit-log": JSON.stringify(creditLog),
  };

  // Request to LLM endpoint
  if (streaming) {
    return streamText({
      model,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && modelProvider
        ? {
            providerOptions: {
              [modelProvider]: providerOptions,
            },
          }
        : {}),
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
      onError: (error) => {
        throw error.error;
      },
      ...(apiConnection.source === ApiSource.AstrskAi && {
        headers: headers,
      }),
    });
  } else {
    const { text } = await generateText({
      model,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && modelProvider
        ? {
            providerOptions: {
              [modelProvider]: providerOptions,
            },
          }
        : {}),
      ...(apiConnection.source === ApiSource.AstrskAi && {
        headers: headers,
      }),
    });

    // Create a generator to return the final text
    async function* createTextStream(finalText: string) {
      yield finalText;
    }

    return { textStream: createTextStream(text) };
  }
}

async function generateStructuredOutput({
  apiConnection,
  modelId,
  messages,
  parameters,
  stopSignalByUser,
  schema,
  streaming,
  creditLog,
}: {
  apiConnection: ApiConnection;
  modelId: string;
  messages: Message[];
  parameters: Map<string, any>;
  stopSignalByUser?: AbortSignal;
  schema: {
    typeDef: JSONSchema7;
    name?: string;
    description?: string;
  };
  streaming?: boolean;
  creditLog?: object;
}) {
  // Transform messages for specific models
  const transformedMessages = transformMessagesForModel(messages, modelId);
  // Validate messages
  validateMessages(transformedMessages, apiConnection.source);

  // Timeout and abort signals
  const abortSignals = [AbortSignal.timeout(120000)];
  if (stopSignalByUser) {
    abortSignals.push(stopSignalByUser);
  }
  const combinedAbortSignal = AbortSignal.any(abortSignals);

  // Request by API source
  let provider;
  let parsedModelId = modelId;
  switch (apiConnection.source) {
    // Route by model provider
    case ApiSource.AstrskAi: {
      const modelIdSplitted = modelId.split(":");
      const astrskSource = modelIdSplitted.at(0) as ApiSource;
      parsedModelId = modelIdSplitted.at(1) ?? modelId;
      const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${astrskSource}`;
      provider = makeProvider({
        source: modelIdSplitted.at(0) as ApiSource,
        apiKey: "DUMMY",
        baseUrl: astrskBaseUrl,
        isStructuredOutput: true,
      });
      break;
    }

    // Request by AI SDK
    case ApiSource.OpenAI:
    case ApiSource.OpenAICompatible:
    case ApiSource.Anthropic:
    case ApiSource.OpenRouter:
    case ApiSource.GoogleGenerativeAI:
    case ApiSource.Ollama:
    case ApiSource.DeepSeek:
    case ApiSource.xAI:
    case ApiSource.Mistral:
    case ApiSource.Cohere:
    case ApiSource.KoboldCPP:
      provider = makeProvider({
        source: apiConnection.source,
        apiKey: apiConnection.apiKey,
        baseUrl: apiConnection.baseUrl,
        openrouterProviderSort: apiConnection.openrouterProviderSort,
        isStructuredOutput: true,
      });
      break;

    // LM Studio - Custom implementation for json_schema support
    case ApiSource.LMStudio:
      return {
        partialObjectStream: streamObjectLMStudio({
          modelId: parsedModelId,
          messages: transformedMessages,
          parameters,
          schema,
          abortSignal: combinedAbortSignal,
          apiConnection,
          streaming: streaming ?? false,
        })
      };

    // TODO: implement structured data for non-AI SDK
    // Request by non-AI SDK
    case ApiSource.Wllama:
    case ApiSource.AIHorde:
      throw new Error("Invalid API connection source for structured output");

    default:
      throw new Error("Unknown API connection source");
  }

  // Make model settings
  const modelSettings = makeModelSettings({
    parameters: parameters,
    apiSource: apiConnection.source,
  });

  // Make model
  const model =
    "chat" in provider
      ? provider.chat(parsedModelId, modelSettings)
      : (provider.languageModel(
          parsedModelId,
          modelSettings,
        ) as LanguageModelV1);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
  });
  const modelProvider = model.provider.split(".").at(0);

  let mode = model.defaultObjectGenerationMode;
  if (apiConnection.source === ApiSource.OpenRouter ||
      apiConnection.source === ApiSource.Ollama ||
      apiConnection.source === ApiSource.KoboldCPP ||
      apiConnection.source === ApiSource.OpenAICompatible
  ) {
    mode = "json";
  }
  // Note: Ollama removed - createOllama supports proper schema mode for structured output

  // Extra headers for astrsk
  const jwt = useAppStore.getState().jwt;
  const headers = {
    Authorization: `Bearer ${jwt}`,
    "x-astrsk-credit-log": JSON.stringify(creditLog),
  };

  // Request to LLM endpoint
  if (streaming) {
    return streamObject({
      model,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      schema: jsonSchema(schema.typeDef),
      schemaName: schema.name,
      schemaDescription: schema.description,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && modelProvider
        ? {
            providerOptions: {
              [modelProvider]: providerOptions,
            },
          }
        : {}),
      mode,
      onError: (error) => {
        throw error.error;
      },
      ...(apiConnection.source === ApiSource.AstrskAi && {
        headers: headers,
      }),
    });
  } else {
    const { object } = await generateObject({
      model,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      schema: jsonSchema(schema.typeDef),
      schemaName: schema.name,
      schemaDescription: schema.description,
      mode,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && modelProvider
        ? {
            providerOptions: {
              [modelProvider]: providerOptions,
            },
          }
        : {}),
      ...(apiConnection.source === ApiSource.AstrskAi && {
        headers: headers,
      }),
    });

    // Create a generator to return the final object
    async function* createObjectStream(finalObject: any) {
      yield finalObject;
    }

    return { partialObjectStream: createObjectStream(object) };
  }
}

type AgentNodeResult = {
  agentKey?: string;
  agentName?: string;
  modelName?: string;
  output?: object;
};

async function* executeAgentNode({
  agentId,
  fullContext,
  stopSignalByUser,
  creditLog,
}: {
  agentId: UniqueEntityID;
  fullContext: any;
  stopSignalByUser?: AbortSignal;
  creditLog?: object;
}): AsyncGenerator<AgentNodeResult, AgentNodeResult, void> {
  try {
    // Get agent
    const agent = await fetchAgent(agentId);

    // Get API connection
    let apiSource = agent.props.apiSource;
    let apiModelId = agent.props.modelId;
    let actualModelName = agent.props.modelName; // Track the actual model name being used

    if (!apiSource || !apiModelId) {
      throw new Error("Agent does not have API source or model ID");
    }

    // Parse modelId for OpenAI compatible: "{title}|{actualModelId}"
    let connectionTitle: string | undefined;

    if (apiSource === ApiSource.OpenAICompatible && apiModelId.includes("|")) {
      const parts = apiModelId.split("|");
      if (parts.length === 2) {
        connectionTitle = parts[0];
        apiModelId = parts[1]; // Extract actual model ID
      }
    }

    const apiConnections = await fetchApiConnections();

    let apiConnection: ApiConnection | undefined;

    // For OpenAI compatible with title, find by source + title
    if (apiSource === ApiSource.OpenAICompatible && connectionTitle) {
      apiConnection = apiConnections.find(
        (connection) =>
          connection.source === apiSource &&
          connection.title === connectionTitle
      );
    }

    // Fallback: find by source only (for non-OpenAI compatible or if title lookup failed)
    if (!apiConnection) {
      apiConnection = apiConnections.find(
        (connection) => connection.source === apiSource,
      );
    }

    // Automatic model mapping for logged-in users
    if (!apiConnection && isUserLoggedIn()) {
      // Check if we should use automatic mapping (user is subscribed)
      // TODO: Replace with actual subscription check when available
      if (isUserSubscribed()) {
        // Try to use AstrskAi connection with fallback model
        const astrskConnection = apiConnections.find(
          (connection) => connection.source === ApiSource.AstrskAi,
        );

        if (astrskConnection) {
          // Get fallback model based on agent's model tier
          const fallbackModel = getFallbackModel(agent.props.modelTier);

          if (fallbackModel) {
            logger.info(
              `[AutoModelMapping] No API connection found for ${apiSource}. ` +
                `Automatically mapping to AstrskAi with model: ${fallbackModel} ` +
                `(original: ${apiModelId}, tier: ${agent.props.modelTier || "not specified"})`,
            );

            // Update to use AstrskAi connection and fallback model
            apiConnection = astrskConnection;
            apiSource = ApiSource.AstrskAi;
            apiModelId = fallbackModel;

            // Get the display name for the fallback model
            actualModelName =
              MODEL_DISPLAY_NAMES[fallbackModel] || fallbackModel;
          }
        }
      }
    }

    // If still no connection, throw error
    if (!apiConnection) {
      throw new Error(`API connection not found for source: ${apiSource}`);
    }

    // Render messages
    const messages = await renderMessages({
      renderable: agent,
      context: fullContext,
      parameters: agent.parameters,
    });
    const transformedMessages = transformMessagesForModel(messages, apiModelId);
    validateMessages(transformedMessages, apiConnection.source);

    // Generate agent output
    const agentKey = sanitizeFileName(agent.props.name);
    const result = {
      agentKey: agentKey,
      agentName: agent.props.name,
      modelName: actualModelName, // Use the actual model name (may be different if auto-mapped)
      output: {},
    };
    yield result;
    const isStructuredOutput = agent.props.enabledStructuredOutput;
    if (isStructuredOutput) {
      // Generate structured output
      const streamResult = await generateStructuredOutput({
        apiConnection: apiConnection,
        modelId: apiModelId,
        messages: transformedMessages,
        parameters: agent.parameters,
        schema: {
          typeDef: agent.getSchemaTypeDef({
            apiSource: apiConnection.source,
          }),
          name: agent.props.schemaName,
          description: agent.props.schemaDescription,
        },
        streaming: agent.props.outputStreaming,
        stopSignalByUser: stopSignalByUser,
        creditLog: creditLog,
      });

      // Stream structured output
      for await (const partialObject of streamResult.partialObjectStream) {
        merge(result, { output: partialObject });
        yield result;
      }

      try {
        const metadata: any = {};

        // Automatically extract all promise properties from streamResult
        const streamResultAny = streamResult as any;

        // Get all property names that end with "Promise"
        const promiseProps = Object.keys(streamResultAny).filter(key => key.endsWith('Promise'));

        // Await all promises and extract their values
        for (const prop of promiseProps) {
          const propName = prop.replace('Promise', ''); // Remove "Promise" suffix for cleaner naming

          try {
            // Add timeout for all promises (some may not resolve for certain providers)
            const promiseResult = await Promise.race([
              streamResultAny[prop],
              new Promise((resolve) => setTimeout(() => resolve(null), 2000))
            ]);

            // Extract value from DelayedPromise - the actual value is in status.value
            let value = promiseResult;
            if (promiseResult && typeof promiseResult === 'object' && 'status' in promiseResult) {
              // It's a DelayedPromise with status.value
              const status = (promiseResult as any).status;
              if (status && status.type === 'resolved' && 'value' in status) {
                value = status.value;
              }
            }

            // Check if value is meaningful (not null, not undefined, not empty object)
            const isEmptyObject = value && typeof value === 'object' && Object.keys(value).length === 0;

            if (value !== null && value !== undefined && !isEmptyObject) {
              metadata[propName] = value;
            }
          } catch (err) {
            // Silently skip unavailable promises
          }
        }

        if (Object.keys(metadata).length > 0) {
          merge(result, { metadata });
          // Yield the result with metadata
          yield result;
        }
      } catch (error) {
        // Don't throw, just continue without metadata
      }
    } else {
      // Generate text output
      const streamResult = await generateTextOutput({
        apiConnection: apiConnection,
        modelId: apiModelId,
        messages: transformedMessages,
        parameters: agent.parameters,
        streaming: agent.props.outputStreaming,
        stopSignalByUser: stopSignalByUser,
        creditLog: creditLog,
      });

      // Stream text output
      let response = "";
      for await (const chunk of streamResult.textStream) {
        response += chunk;
        merge(result, { output: { response } });
        yield result;
      }

      try {
        const metadata: any = {};

        // Automatically extract all promise properties from streamResult
        const streamResultAny = streamResult as any;

        // Get all property names that end with "Promise"
        const promiseProps = Object.keys(streamResultAny).filter(key => key.endsWith('Promise'));

        // Await all promises and extract their values
        for (const prop of promiseProps) {
          const propName = prop.replace('Promise', ''); // Remove "Promise" suffix for cleaner naming

          try {

            // Add timeout for all promises (some may not resolve for certain providers)
            const promiseResult = await Promise.race([
              streamResultAny[prop],
              new Promise((resolve) => setTimeout(() => resolve(null), 2000))
            ]);

            // Extract value from DelayedPromise - the actual value is in status.value
            let value = promiseResult;
            if (promiseResult && typeof promiseResult === 'object' && 'status' in promiseResult) {
              // It's a DelayedPromise with status.value
              const status = (promiseResult as any).status;
              if (status && status.type === 'resolved' && 'value' in status) {
                value = status.value;
              }
            }
            // Check if value is meaningful (not null, not undefined, not empty object)
            const isEmptyObject = value && typeof value === 'object' && Object.keys(value).length === 0;

              if (value !== null && value !== undefined && !isEmptyObject) {
                metadata[propName] = value;
              }
            } catch (err) {
              // Silently skip unavailable promises
            }
          }

        if (Object.keys(metadata).length > 0) {
          merge(result, { metadata });
          // Yield the result with metadata
          yield result;
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching metadata:", error);
        // Don't throw, just continue without metadata
      }
    }

    // Return agent result
    logger.debug("[Agent]", result);
    return result;
  } catch (error) {
    const parsedError = parseAiSdkErrorMessage(error);
    if (parsedError) {
      throw error;
    } else {
      throw new Error(`Agent node execution error: ${error}`);
    }
  }
}

type FlowResult = {
  agentName?: string;
  modelName?: string;
  content: string;
  variables: Record<string, any>;
  translations?: Map<string, string>;
  dataStore?: DataStoreSavedField[];
  metadata?: Record<string, any>;
};

async function* executeFlow({
  flowId,
  sessionId,
  characterCardId,
  regenerateMessageId,
  stopSignalByUser,
}: {
  flowId: UniqueEntityID;
  sessionId: UniqueEntityID;
  characterCardId: UniqueEntityID;
  regenerateMessageId?: UniqueEntityID;
  stopSignalByUser?: AbortSignal;
}): AsyncGenerator<FlowResult, FlowResult, void> {
  // Flow result
  let content = "";
  const variables: Record<string, any> = {};
  const translations: Map<string, string> = new Map();
  let dataStore: DataStoreSavedField[] = [];

  try {
    // Get flow
    const flow = await fetchFlow(flowId);

    // Find start node
    const startNode = flow.props.nodes.find((node) => node.type === "start");
    if (!startNode) {
      throw new Error("No start node found in flow");
    }

    // Validate flow structure using traverseFlow
    const traversalResult = traverseFlowCached(flow);
    if (!traversalResult.hasValidFlow) {
      throw new Error("Invalid flow structure detected");
    }

    // Build adjacency list from edges for navigation
    const adjacencyList = new Map<string, string[]>();
    flow.props.nodes.forEach((node) => {
      adjacencyList.set(node.id, []);
    });
    flow.props.edges.forEach((edge) => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // Get session
    const session = await fetchSession(sessionId);

    // Make context
    const context = (
      await makeContext({
        session,
        characterCardId,
        regenerateMessageId,
      })
    )
      .throwOnFailure()
      .getValue();

    // Get dataStore as starting point - prioritize context dataStore for regeneration
    if (context.dataStore && context.dataStore.length > 0) {
      // Use dataStore from context (regeneration scenario)
      dataStore = cloneDeep(context.dataStore);
      logger.info(
        `Using dataStore from context for regeneration (${context.dataStore.length} fields)`,
      );
    } else if (session.turnIds.length > 0) {
      // Use last turn's dataStore as fallback
      const lastTurnId = session.turnIds[session.turnIds.length - 1];
      try {
        const lastTurn = await fetchTurnOptional(lastTurnId);
        if (lastTurn) {
          dataStore = cloneDeep(lastTurn.dataStore);
        }
      } catch (error) {
        logger.warn(`Failed to get last turn's dataStore: ${error}`);
      }
    }

    // Initialize or update dataStore from schema
    if (flow.props.dataStoreSchema) {
      // Create a map of existing fields for quick lookup
      const existingFieldsMap = new Map(
        dataStore.map((field) => [field.id, field]),
      );

      // Process each schema field
      for (const schemaField of flow.props.dataStoreSchema.fields) {
        // Check if field already exists
        const existingField = existingFieldsMap.get(schemaField.id);

        if (!existingField) {
          // Initialize new field
          try {
            // Render initial value with current context
            const renderedValue = TemplateRenderer.render(
              schemaField.initialValue,
              createFullContext(context, {}, dataStore),
            );

            // Execute rendered value as JavaScript code
            const fullContext = createFullContext(context, {}, dataStore);
            const executedValue = executeJavaScriptCode(
              renderedValue,
              fullContext,
            );

            // Convert to appropriate type and create DataStoreSavedField
            const convertedValue = convertToDataStoreType(
              String(executedValue),
              schemaField.type,
            );

            dataStore.push({
              id: schemaField.id,
              name: schemaField.name,
              type: schemaField.type,
              value: String(convertedValue),
            });
          } catch (error) {
            logger.error(
              `Failed to initialize dataStore field "${schemaField.name}": ${error}`,
            );
            // Set default value based on type
            const defaultValue =
              schemaField.type === "number" || schemaField.type === "integer"
                ? "0"
                : schemaField.type === "boolean"
                  ? "false"
                  : "";

            dataStore.push({
              id: schemaField.id,
              name: schemaField.name,
              type: schemaField.type,
              value: defaultValue,
            });
          }
        }
      }

      // DataStore initialization complete (will be saved after successful flow execution)
    }

    // Execute flow step-by-step, starting from start node
    let currentNode = startNode;
    while (currentNode && currentNode.type !== "end") {
      if (currentNode.type === "agent") {
        // Execute agent node
        const executeAgentNodeResult = executeAgentNode({
          agentId: new UniqueEntityID(currentNode.id),
          fullContext: createFullContext(context, variables, dataStore),
          stopSignalByUser: stopSignalByUser,
          creditLog: {
            session_id: sessionId.toString(),
            flow_id: flowId.toString(),
          },
        });

        for await (const result of executeAgentNodeResult) {
          // Accumulate agent output
          merge(variables, {
            [result.agentKey ?? ""]: result.output,
          });

          // Render content
          content = TemplateRenderer.render(
            flow.props.responseTemplate,
            createFullContext(context, variables, dataStore),
          );

          // Yield response
          yield {
            agentName: result.agentName,
            modelName: result.modelName,
            content: content,
            variables: variables,
            dataStore: dataStore,
            metadata: (result as any).metadata,
          };
        }

        // Move to next node
        currentNode = getNextNode(currentNode, adjacencyList, flow.props.nodes);
      } else if (currentNode.type === "dataStore") {
        // Get datastore node
        const dataStoreNode = await fetchDataStoreNode(currentNode.id);

        // Execute datastore node
        const dataStoreFields = dataStoreNode?.dataStoreFields || [];

        // Process each field sequentially
        for (const field of dataStoreFields) {
          // Execute field logic if present
          if (field.logic) {
            try {
              const fullContext = createFullContext(
                context,
                variables,
                dataStore,
              );
              const renderedValue = TemplateRenderer.render(
                field.logic,
                fullContext,
              );

              // Find schema field to get type
              const schemaField = flow.props.dataStoreSchema?.fields.find(
                (f) => f.id === field.schemaFieldId,
              );

              if (schemaField) {
                // Execute rendered value as JavaScript code
                const executedValue = executeJavaScriptCode(
                  renderedValue,
                  fullContext,
                );

                // Convert value
                const convertedValue = convertToDataStoreType(
                  String(executedValue),
                  schemaField.type,
                );

                // Find and update existing field or add new one
                const existingFieldIndex = dataStore.findIndex(
                  (f) => f.id === schemaField.id,
                );

                if (existingFieldIndex >= 0) {
                  // Update existing field
                  dataStore[existingFieldIndex] = {
                    id: schemaField.id,
                    name: schemaField.name,
                    type: schemaField.type,
                    value: String(convertedValue),
                  };
                } else {
                  // Add new field
                  dataStore.push({
                    id: schemaField.id,
                    name: schemaField.name,
                    type: schemaField.type,
                    value: String(convertedValue),
                  });
                }
              } else {
                logger.warn(
                  `Schema field not found for dataStore field with ID: ${field.schemaFieldId}`,
                );
              }
            } catch (error) {
              logger.error(
                `Failed to execute dataStore field logic for field ID "${field.schemaFieldId}": ${error}`,
              );
            }
          }
        }

        // Move to next node
        currentNode = getNextNode(currentNode, adjacencyList, flow.props.nodes);
      } else if (currentNode.type === "if") {
        // Get if node
        const ifNode = await fetchIfNode(currentNode.id);

        // Handle if node - evaluate condition and choose branch
        currentNode = await handleIfNode(
          ifNode,
          variables,
          context,
          dataStore,
          adjacencyList,
          flow.props.nodes,
        );
      } else {
        // For start node or other types, just move to next
        currentNode = getNextNode(currentNode, adjacencyList, flow.props.nodes);
      }

      // Prevent infinite loops
      if (!currentNode) {
        break;
      }
    }

    // Render final content
    content = TemplateRenderer.render(
      flow.props.responseTemplate,
      createFullContext(context, variables, dataStore),
    );
    yield {
      content: content,
      variables: variables,
      dataStore: dataStore,
    };

    // Translate variables
    const langs: string[] = [];
    if (session.translation && session.translation.promptLanguage !== "none") {
      langs.push(session.translation.promptLanguage);
    }
    if (session.translation && session.translation.displayLanguage !== "none") {
      langs.push(session.translation.displayLanguage);
    }
    if (langs.length > 0) {
      // Start translate
      yield {
        agentName: "Translating...",
        content: content,
        variables: variables,
        translations: translations,
        dataStore: dataStore,
      };

      // Translate by language
      for (const lang of langs) {
        const translatedVariables = await translate(variables, lang);
        const translatedContent = TemplateRenderer.render(
          flow.props.responseTemplate,
          createFullContext(context, translatedVariables, dataStore),
        );
        translations.set(lang, translatedContent);
      }

      // Done translate
      yield {
        agentName: "Translating...",
        content: content,
        variables: variables,
        translations: translations,
        dataStore: dataStore,
      };
    }

    // Flow execution completed successfully - dataStore will be saved with the new turn
  } catch (error) {
    const parsedError = parseAiSdkErrorMessage(error);
    if (parsedError) {
      throw error;
    } else {
      throw new Error(`Flow execution error: ${error}`);
    }
  }

  // Return flow result
  const result: FlowResult = {
    content: content,
    variables: variables,
    translations: translations,
    dataStore: dataStore,
  };
  logger.debug("[Flow]", result);
  return result;
}

/**
 * Get the next node to execute from current node
 * For regular nodes, returns the first connected node
 * @param currentNode - Current node
 * @param adjacencyList - Adjacency list for navigation
 * @param allNodes - All nodes in the flow
 * @returns Next node to execute or null if no valid next node
 */
function getNextNode(
  currentNode: any,
  adjacencyList: Map<string, string[]>,
  allNodes: any[],
): any | null {
  const neighbors = adjacencyList.get(currentNode.id) || [];

  if (neighbors.length === 0) {
    return null;
  }

  // For regular nodes, take the first neighbor
  const nextNodeId = neighbors[0];
  return allNodes.find((node) => node.id === nextNodeId) || null;
}

/**
 * Handle if node - evaluate condition and return next node
 * @param ifNode - The if node to process
 * @param variables - Current variables context
 * @param context - Current execution context
 * @param adjacencyList - Adjacency list for navigation
 * @param allNodes - All nodes in the flow
 * @returns Next node based on condition evaluation
 */
async function handleIfNode(
  ifNode: IfNode,
  variables: Record<string, any>,
  context: any,
  dataStore: DataStoreSavedField[],
  adjacencyList: Map<string, string[]>,
  allNodes: any[],
): Promise<any | null> {
  // Check neighbors
  const neighbors = adjacencyList.get(ifNode.id.toString()) || [];
  if (neighbors.length !== 2) {
    throw new Error(
      `If node ${ifNode.id} must have exactly 2 outgoing connections`,
    );
  }

  // Evaluate condition with full context including dataStore
  const condition = await evaluateIfCondition(
    ifNode,
    variables,
    context,
    dataStore,
  );

  // Choose branch based on condition
  // Convention: first edge = true branch, second edge = false branch
  const targetNodeId = condition ? neighbors[0] : neighbors[1];

  return allNodes.find((node) => node.id === targetNodeId) || null;
}

/**
 * Evaluate a single condition
 * @param condition - The condition to evaluate
 * @param variables - Current variables
 * @param context - Current context
 * @param dataStore - DataStore field values
 * @returns Boolean result of the condition
 */
async function evaluateSingleCondition(
  condition: Condition,
  variables: Record<string, any>,
  context: any,
  dataStore: DataStoreSavedField[],
): Promise<boolean> {
  let value1: string = "";
  let value2: string = "";
  try {
    // Check for null dataType or operator
    if (!condition.dataType || !condition.operator) {
      console.warn(`Condition ${condition.id} has null dataType or operator`);
      return false;
    }

    // Render templates in condition values
    const fullContext = createFullContext(context, variables, dataStore);
    value1 = TemplateRenderer.render(condition.value1, fullContext);

    // Convert value1 based on data type
    const convertedValue1 = convertValueToType(value1, condition.dataType);

    // For unary operators, value2 is not needed
    let convertedValue2: any = null;
    if (!isUnaryOperator(condition.operator)) {
      value2 = TemplateRenderer.render(condition.value2, fullContext);
      convertedValue2 = convertValueToType(value2, condition.dataType);
    }

    // Evaluate condition based on operator
    return evaluateConditionOperator(
      condition.operator,
      convertedValue1,
      convertedValue2,
    );
  } catch (error) {
    const debugInfo = `value1="${value1}"${
      condition.operator && !isUnaryOperator(condition.operator)
        ? ` value2="${value2}"`
        : ""
    } dataType="${condition.dataType}"`;
    console.warn(
      `Failed to evaluate condition ${condition.id} (${condition.operator}): ${debugInfo} - ${error}`,
    );
    return false;
  }
}

/**
 * Convert string value to specified type
 */
function convertValueToType(
  value: string,
  dataType: Condition["dataType"],
): any {
  if (value == null) {
    return value;
  }

  if (dataType == null) {
    return value;
  }

  switch (dataType) {
    case "string":
      return String(value);
    case "number": {
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    }
    case "integer": {
      const intValue = parseInt(value, 10);
      return isNaN(intValue) ? null : intValue;
    }
    case "boolean":
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes")
          return true;
        if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no")
          return false;
      }
      return null;
    default:
      return value;
  }
}

/**
 * Check if a value is considered empty
 */
function isValueEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  );
}

/**
 * Evaluate condition operator
 */
function evaluateConditionOperator(
  operator: Condition["operator"],
  value1: any,
  value2: any,
): boolean {
  if (operator == null) {
    return false;
  }

  // Handle exists/not_exists operators
  if (operator.endsWith("_exists")) {
    const isNotExists = operator.endsWith("_not_exists");
    return isNotExists
      ? value1 === null || value1 === undefined
      : value1 !== null && value1 !== undefined;
  }

  // Handle empty/not_empty operators
  if (operator.endsWith("_is_empty")) {
    return isValueEmpty(value1);
  }

  if (operator.endsWith("_is_not_empty")) {
    return !isValueEmpty(value1);
  }

  // Handle string operators
  if (operator.startsWith("string_")) {
    const str1 = String(value1 || "");
    const str2 = String(value2 || "");

    switch (operator) {
      case "string_equals":
        return str1 === str2;
      case "string_not_equals":
        return str1 !== str2;
      case "string_contains":
        return str1.includes(str2);
      case "string_not_contains":
        return !str1.includes(str2);
      case "string_starts_with":
        return str1.startsWith(str2);
      case "string_not_starts_with":
        return !str1.startsWith(str2);
      case "string_ends_with":
        return str1.endsWith(str2);
      case "string_not_ends_with":
        return !str1.endsWith(str2);
      case "string_matches_regex":
        try {
          const regex = new RegExp(str2);
          return regex.test(str1);
        } catch (error) {
          console.warn(`Invalid regex pattern "${str2}": ${error}`);
          return false;
        }
      case "string_not_matches_regex":
        try {
          const regex = new RegExp(str2);
          return !regex.test(str1);
        } catch (error) {
          console.warn(`Invalid regex pattern "${str2}": ${error}`);
          return true;
        }
    }
  }

  // Handle number operators
  if (operator.startsWith("number_")) {
    const num1 = Number(value1);
    const num2 = Number(value2);

    if (isNaN(num1) || (value2 !== null && isNaN(num2))) return false;

    switch (operator) {
      case "number_equals":
        return num1 === num2;
      case "number_not_equals":
        return num1 !== num2;
      case "number_greater_than":
        return num1 > num2;
      case "number_less_than":
        return num1 < num2;
      case "number_greater_than_or_equals":
        return num1 >= num2;
      case "number_less_than_or_equals":
        return num1 <= num2;
    }
  }

  // Handle integer operators
  if (operator.startsWith("integer_")) {
    const int1 = parseInt(String(value1), 10);
    const int2 = parseInt(String(value2), 10);

    if (isNaN(int1) || (value2 !== null && isNaN(int2))) return false;

    switch (operator) {
      case "integer_equals":
        return int1 === int2;
      case "integer_not_equals":
        return int1 !== int2;
      case "integer_greater_than":
        return int1 > int2;
      case "integer_less_than":
        return int1 < int2;
      case "integer_greater_than_or_equals":
        return int1 >= int2;
      case "integer_less_than_or_equals":
        return int1 <= int2;
    }
  }

  // Handle boolean operators
  if (operator.startsWith("boolean_")) {
    switch (operator) {
      case "boolean_is_true":
        return value1 === true;
      case "boolean_is_false":
        return value1 === false;
      case "boolean_equals":
        return Boolean(value1) === Boolean(value2);
      case "boolean_not_equals":
        return Boolean(value1) !== Boolean(value2);
    }
  }

  return false;
}

/**
 * Evaluate condition for if node
 * @param ifNode - The if node containing condition data
 * @param variables - Current variables
 * @param context - Current context
 * @returns Boolean result of condition evaluation
 */
async function evaluateIfCondition(
  ifNode: IfNode,
  variables: Record<string, any>,
  context: any,
  dataStore: DataStoreSavedField[],
): Promise<boolean> {
  // No conditions means default to true
  if (!ifNode.conditions || ifNode.conditions.length === 0) {
    return true;
  }

  // Evaluate conditions
  try {
    const conditionResults = await Promise.all(
      ifNode.conditions.map((condition) =>
        evaluateSingleCondition(condition, variables, context, dataStore),
      ),
    );

    // Apply logic operator
    return ifNode.logicOperator === "AND"
      ? conditionResults.every((result) => result)
      : conditionResults.some((result) => result);
  } catch (error) {
    console.warn(`Failed to evaluate if condition: ${error}`);
    return false;
  }
}

/**
 * Create full context by merging base context, variables, and dataStore
 * DataStore fields are spread at top level for direct access via {{fieldName}}
 * @param context - Base render context
 * @param variables - Variables from agent execution
 * @param dataStore - DataStore field values as array
 * @returns Merged context object
 */
function createFullContext(
  context: RenderContext,
  variables: Record<string, any> = {},
  dataStore: DataStoreSavedField[] = [],
): any {
  // Convert DataStoreSavedField[] to object for template access
  const dataStoreObject = Object.fromEntries(
    dataStore.map((field) => [field.name, field.value]),
  );

  return {
    ...context,
    ...variables,
    ...dataStoreObject,
  };
}

/**
 * Execute JavaScript code safely within the provided context
 * @param code - The JavaScript code to execute
 * @param context - The context object to make available in the code
 * @returns The result of the executed code
 */
function executeJavaScriptCode(
  code: string,
  context: Record<string, unknown>,
): unknown {
  try {
    // Basic security check - reject code with potentially dangerous keywords
    const dangerousPatterns = [
      /\beval\b/,
      /\bFunction\b/,
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\bimport\b/,
      /\brequire\b/,
      /\bprocess\b/,
      /\bglobal\b/,
      /\bwindow\b/,
      /\bdocument\b/,
    ];

    if (dangerousPatterns.some((pattern) => pattern.test(code))) {
      logger.warn(
        `JavaScript code contains potentially dangerous patterns: ${code}`,
      );
      return code; // Return original code without execution
    }

    // Create a list of context keys and values
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);

    // Create a safe function that has access to the context
    // Use Function constructor instead of eval for better security
    const func = new Function(...contextKeys, `"use strict"; return (${code})`);

    // Execute the function with context values
    return func(...contextValues);
  } catch (error) {
    logger.error(`Failed to execute JavaScript code: ${error}`);
    // Return the original code if execution fails
    return code;
  }
}

/**
 * Convert a string value to the specified DataStore field type
 * @param value - The string value to convert
 * @param type - The target DataStore field type
 * @returns The converted value
 */
function convertToDataStoreType(
  value: string,
  type: DataStoreFieldType,
): string | number | boolean {
  switch (type) {
    case "string":
      return String(value);
    case "number": {
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    }
    case "boolean": {
      const lowerValue = value.toLowerCase().trim();
      return (
        lowerValue === "true" || lowerValue === "1" || lowerValue === "yes"
      );
    }
    case "integer": {
      const int = parseInt(value, 10);
      return isNaN(int) ? 0 : int;
    }
    default:
      return value;
  }
}

export {
  addMessage,
  createMessage,
  evaluateConditionOperator,
  executeFlow,
  makeContext,
  renderMessages,
  transformMessagesForModel
};

