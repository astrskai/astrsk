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
import { Datetime } from "@/shared/utils/datetime";
import { logger } from "@/shared/utils/logger";
import { TemplateRenderer } from "@/shared/utils/template-renderer";
import { getTokenizer } from "@/shared/utils/tokenizer/tokenizer";

import { AgentService } from "@/app/services/agent-service";
import { ApiService } from "@/app/services/api-service";
import { CardService } from "@/app/services/card-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { FlowService } from "@/app/services/flow-service";
import { IfNodeService } from "@/app/services/if-node-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { useAppStore } from "@/app/stores/app-store";
import { useWllamaStore } from "@/app/stores/wllama-store";
import { Condition, isUnaryOperator } from "@/flow-multi/types/condition-types";
import { traverseFlowCached } from "@/flow-multi/utils/flow-traversal";
import { ApiSource } from "@/modules/api/domain";
import {
  recallCharacterMemories,
  formatMemoriesForPrompt as formatRoleplayMemoriesForPrompt,
  hasRoleplayMemoryTag,
  injectMemoriesIntoPrompt,
  distributeMemories,
  executeWorldAgent,
} from "@/modules/supermemory/roleplay-memory";
import {
  ApiConnection,
  OpenrouterProviderSort,
} from "@/modules/api/domain/api-connection";
import { PlotCard } from "@/modules/card/domain";
import { CharacterCard } from "@/modules/card/domain/character-card";
import { DataStoreFieldType } from "@/modules/flow/domain/flow";
import { IfNode } from "@/modules/if-node/domain";
import { Session } from "@/modules/session/domain/session";
import { DataStoreSavedField, Option } from "@/modules/turn/domain/option";
import { Turn as MessageEntity } from "@/modules/turn/domain/turn";
import { parseAiSdkErrorMessage, sanitizeFileName } from "@/shared/utils";
import { translate } from "@/shared/utils/translate-utils";
import { ModelTier } from "@/modules/agent/domain";

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

  // Get plot card
  let plotCard: PlotCard | null = null;
  if (session.plotCard && session.plotCard.enabled) {
    // Check if CardService is initialized
    if (!CardService.getCard) {
      console.warn("CardService not initialized yet, skipping plot card");
    } else {
      plotCard = (await CardService.getCard.execute(session.plotCard.id))
        .throwOnFailure()
        .getValue() as PlotCard;
    }
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
        message = (await TurnService.getTurn.execute(messageId))
          .throwOnFailure()
          .getValue();
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
    // Check if CardService is initialized
    if (!CardService.getCard) {
      console.warn("CardService not initialized yet, skipping character card");
      continue;
    }
    const characterCard = (
      await CardService.getCard.execute(allCharCardItem.id)
    )
      .throwOnFailure()
      .getValue() as CharacterCard;

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
      let oaiCompBaseUrl = baseUrl ?? "";
      if (!oaiCompBaseUrl.endsWith("/v1")) {
        oaiCompBaseUrl += "/v1";
      }
      provider = createOpenAI({
        apiKey: apiKey,
        baseURL: oaiCompBaseUrl,
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

    case ApiSource.Ollama:
      provider = createOllama({
        baseURL: baseUrl,
      });
      break;

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
      let koboldBaseUrl = baseUrl ?? "";
      if (!koboldBaseUrl.endsWith("/v1")) {
        koboldBaseUrl += "/v1";
      }
      provider = createOpenAICompatible({
        name: ApiSource.KoboldCPP,
        baseURL: koboldBaseUrl,
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
  const session = (await SessionService.getSession.execute(sessionId))
    .throwOnFailure()
    .getValue();

  // Get last turn's dataStore if exists
  let dataStore: DataStoreSavedField[] = [];
  if (session.turnIds.length > 0) {
    const lastTurnId = session.turnIds[session.turnIds.length - 1];
    try {
      const lastTurn = (await TurnService.getTurn.execute(lastTurnId))
        .throwOnFailure()
        .getValue();
      // Clone the dataStore to avoid mutations
      dataStore = cloneDeep(lastTurn.dataStore);
    } catch (error) {
      logger.warn(`Failed to get last turn's dataStore: ${error}`);
    }
  }

  // Get character name
  let characterName: string | null = defaultCharacterName || null;
  if (characterCardId) {
    // Check if CardService is initialized
    if (!CardService.getCard) {
      console.warn(
        "CardService not initialized yet, using default character name",
      );
    } else {
      const characterCard = (await CardService.getCard.execute(characterCardId))
        .throwOnFailure()
        .getValue() as CharacterCard;
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
  const session = (await SessionService.getSession.execute(sessionId))
    .throwOnFailure()
    .getValue();

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

const addOptionToMessage = async ({
  messageId,
  option,
  isUser = false,
}: {
  messageId: UniqueEntityID;
  option: Option;
  isUser?: boolean;
}) => {
  // Get message
  let message;
  try {
    message = (await TurnService.getTurn.execute(messageId))
      .throwOnFailure()
      .getValue();
  } catch (error) {
    return;
  }

  // Get session
  const session = (await SessionService.getSession.execute(message.sessionId))
    .throwOnFailure()
    .getValue();

  // Add option
  message.addOption(option);

  // Update message
  try {
    (await TurnService.updateTurn.execute(message)).throwOnFailure();
  } catch (error) {
    return;
  }

  // Translate message
  if (option.content.trim() !== "" && session.translation) {
    try {
      (
        await TurnService.translateTurn.execute({
          turnId: message.id,
          config: session.translation,
        })
      ).throwOnFailure();
    } catch (error) {
      return;
    }
  }
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
  if (apiConnection.source === ApiSource.OpenRouter) {
    mode = "json";
  }

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
  suggestedUpdates?: { gameTime?: number; participants?: string[] } | null;
};

async function* executeAgentNode({
  agentId,
  fullContext,
  stopSignalByUser,
  creditLog,
  sessionId,
  dataStore,
}: {
  agentId: UniqueEntityID;
  fullContext: any;
  stopSignalByUser?: AbortSignal;
  creditLog?: object;
  sessionId?: UniqueEntityID;
  dataStore?: DataStoreSavedField[];
}): AsyncGenerator<AgentNodeResult, AgentNodeResult, void> {
  try {
    // Get agent
    const agent = (await AgentService.getAgent.execute(agentId))
      .throwOnFailure()
      .getValue();

    // Get API connection
    let apiSource = agent.props.apiSource;
    let apiModelId = agent.props.modelId;
    let actualModelName = agent.props.modelName; // Track the actual model name being used

    if (!apiSource || !apiModelId) {
      throw new Error("Agent does not have API source or model ID");
    }

    let apiConnection = (await ApiService.listApiConnection.execute({}))
      .throwOnFailure()
      .getValue()
      .find((connection) => connection.source === apiSource);

    // Automatic model mapping for logged-in users
    if (!apiConnection && isUserLoggedIn()) {
      // Check if we should use automatic mapping (user is subscribed)
      // TODO: Replace with actual subscription check when available
      if (isUserSubscribed()) {
        // Try to use AstrskAi connection with fallback model
        const astrskConnection = (
          await ApiService.listApiConnection.execute({})
        )
          .throwOnFailure()
          .getValue()
          .find((connection) => connection.source === ApiSource.AstrskAi);

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

    // Check if agent has history messages and retrieve memories from Supermemory
    let injectedMemories = "";
    const hasHistoryMessages = agent.props.promptMessages?.some(
      (msg: any) => msg.type === "history",
    );

    // Simple-memory removed - use roleplay-memory system instead
    // if (hasHistoryMessages) {
    //   try {
    //     const sessionIdStr = sessionId?.toString() || "unknown";
    //     const memories = await retrieveSessionMemories(
    //       sessionIdStr,
    //       undefined,
    //       3, // Retrieve top 3 memories
    //     );
    //     injectedMemories = formatMemoriesForPrompt(memories);
    //   } catch (error) {
    //     logger.error("[Supermemory] Failed to retrieve memories:", error);
    //   }
    // }

    // Render messages
    const messages = await renderMessages({
      renderable: agent,
      context: fullContext,
      parameters: agent.parameters,
    });

    // Inject memories into the first system message if we have any
    if (injectedMemories && messages.length > 0) {
      const firstSystemMessage = messages.find((msg) => msg.role === "system");
      if (firstSystemMessage) {
        firstSystemMessage.content =
          injectedMemories + "\n\n" + firstSystemMessage.content;
      } else if (messages[0]) {
        // If no system message, prepend to the first message
        messages[0].content = injectedMemories + "\n\n" + messages[0].content;
        console.log(
          `💉 [Supermemory] Injected memories into first message (role: ${messages[0].role})`,
        );
      }
    }

    // Roleplay Memory: Inject character memories if tag is present (START node)
    await injectRoleplayMemories(messages, fullContext, sessionId, agent);

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
      const { partialObjectStream } = await generateStructuredOutput({
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
      for await (const partialObject of partialObjectStream) {
        merge(result, { output: partialObject });
        yield result;
      }
    } else {
      // Generate text output
      const { textStream } = await generateTextOutput({
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
      for await (const chunk of textStream) {
        response += chunk;
        merge(result, { output: { response } });
        yield result;
      }
    }

    // Store conversation to Supermemory if agent has history messages
    if (hasHistoryMessages && result.output) {
      try {
        // Extract conversation from messages and response
        const conversationTurns = [];

        // Add the last user message
        const userMessage = messages.find((msg) => msg.role === "user");
        if (userMessage) {
          conversationTurns.push({
            role: "user",
            content: userMessage.content,
          });
        }

        // Add the assistant response
        const responseContent =
          typeof result.output === "object" && "response" in result.output
            ? (result.output as any).response
            : JSON.stringify(result.output);

        if (responseContent) {
          conversationTurns.push({
            role: "assistant",
            content: responseContent,
          });
        }

        // Simple-memory removed - use roleplay-memory system instead
        // if (conversationTurns.length >= 2) {
        //   const sessionIdStr = sessionId?.toString() || "unknown";
        //   await storeConversationMemory(
        //     sessionIdStr,
        //     conversationTurns,
        //     agentId.toString(),
        //   );
        // }
      } catch (error) {
        logger.error("[Supermemory] Failed to store conversation:", error);
        // Don't throw - graceful degradation
      }

      // Roleplay Memory: Execute World Agent and distribute memories (END node)
      // Run asynchronously in background (don't block message creation)
      console.log("[Roleplay Memory Debug] Agent for World Agent:", {
        id: agent.id.toString(),
        name: agent.props.name,
        apiSource: agent.props.apiSource,
        modelId: agent.props.modelId,
      });
      executeWorldAgentAndDistributeMemories(
        result,
        fullContext,
        sessionId,
        agent,
        dataStore || [], // Pass dataStore to update worldContext field
      ).catch((error) => {
        console.error(
          "❌ [Roleplay Memory] Background execution failed:",
          error,
        );
      });

      // Return agent result immediately (World Agent runs in background)
      logger.debug("[Agent]", result);
      return result;
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
    const flow = (await FlowService.getFlow.execute(flowId))
      .throwOnFailure()
      .getValue();

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
    const session = (await SessionService.getSession.execute(sessionId))
      .throwOnFailure()
      .getValue();

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
        const lastTurn = (await TurnService.getTurn.execute(lastTurnId))
          .throwOnFailure()
          .getValue();
        dataStore = cloneDeep(lastTurn.dataStore);
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
          sessionId: sessionId,
          dataStore: dataStore, // Pass dataStore for World Agent background task
        });

        for await (const result of executeAgentNodeResult) {
          // Accumulate agent output
          merge(variables, {
            [result.agentKey ?? ""]: result.output,
          });

          // Apply automatic data store updates from World Agent (if any)
          if (result.suggestedUpdates) {
            applyRoleplayMemoryDataStoreUpdates(
              dataStore,
              result.suggestedUpdates,
            );
          }

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
          };
        }

        // Move to next node
        currentNode = getNextNode(currentNode, adjacencyList, flow.props.nodes);
      } else if (currentNode.type === "dataStore") {
        // Get datastore node
        const dataStoreNode = (
          await DataStoreNodeService.getDataStoreNode.execute({
            flowId: flowId.toString(),
            nodeId: currentNode.id,
          })
        )
          .throwOnFailure()
          .getValue();

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
        const ifNode = (
          await IfNodeService.getIfNode.execute({
            flowId: flowId.toString(),
            nodeId: currentNode.id,
          })
        )
          .throwOnFailure()
          .getValue();
        if (!ifNode) {
          throw new Error(`No node: ${currentNode.id}`);
        }

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

/**
 * Roleplay Memory Integration - Helper Functions
 * These functions can be easily removed or disabled if needed
 */

/**
 * Initialize roleplay memory containers when scenario is selected
 * Call this after scenario is added to session
 */
async function initializeRoleplayMemoryForSession(
  sessionId: string,
  characterCards: any[], // Domain Card objects (CharacterCard or PlotCard)
  scenarioDescription: string,
): Promise<void> {
  try {
    const { initializeRoleplayMemory } = await import(
      "@/modules/supermemory/roleplay-memory"
    );

    // Import CharacterCard type
    const { CharacterCard } = await import("@/modules/card/domain");

    // Filter to only CharacterCard instances (excludes PlotCard and nulls)
    const onlyCharacterCards = characterCards.filter(
      (card) => card && card instanceof CharacterCard,
    );

    if (onlyCharacterCards.length === 0) {
      logger.warn(
        "[Roleplay Memory] No character cards found for initialization",
      );
      return;
    }

    await initializeRoleplayMemory({
      sessionId,
      participants: onlyCharacterCards.map((card) => card.id.toString()),
      characters: onlyCharacterCards.map((card) => ({
        characterId: card.id.toString(),
        characterName: card.props.name || "Unknown",
        characterCard: card.props.description || "",
        lorebook: [], // Lorebook can be added later if available
      })),
      scenario: {
        messages: [
          {
            content: scenarioDescription,
            role: "system",
          },
        ],
      },
    });

    logger.info(
      `[Roleplay Memory] Initialized memory containers for ${onlyCharacterCards.length} characters`,
    );
  } catch (error) {
    logger.error("[Roleplay Memory] Failed to initialize:", error);
    // Don't throw - graceful degradation
  }
}

/**
 * Track world state updates in roleplay memory
 * Call this when significant world state changes occur (location, time, quest updates)
 */
async function trackWorldStateUpdate(
  sessionId: string,
  description: string,
  gameTime: number,
  gameTimeInterval: string = "Day",
  speaker: string = "system",
  participants: string[] = [],
): Promise<void> {
  try {
    const { storeWorldStateUpdate, createWorldContainer } = await import(
      "@/modules/supermemory/roleplay-memory"
    );
    const worldContainer = createWorldContainer(sessionId);

    await storeWorldStateUpdate(worldContainer, description, {
      speaker,
      participants,
      type: "world_state_update",
      gameTime,
      gameTimeInterval,
    });

    logger.info(`[Roleplay Memory] Tracked world state update: ${description}`);
  } catch (error) {
    logger.error(
      "[Roleplay Memory] Failed to track world state update:",
      error,
    );
    // Don't throw - graceful degradation
  }
}

/**
 * Inject roleplay memories into agent prompt (START node)
 * Finds message with ONLY ###ROLEPLAY_MEMORY### tag and replaces entire message with memories
 */
async function injectRoleplayMemories(
  messages: any[],
  fullContext: any,
  sessionId: UniqueEntityID | undefined,
  agent: any,
): Promise<void> {
  if (messages.length === 0) return;

  // Loop through all messages to find the one with ONLY the tag
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const trimmedContent = message.content?.trim();

    // Check if message contains ONLY the tag (exact match after trimming)
    if (trimmedContent === "###ROLEPLAY_MEMORY###") {
      try {
        console.log(
          `🎭 [Roleplay Memory] Found ###ROLEPLAY_MEMORY### tag in message ${i} (role: ${message.role})`,
        );

        // Extract gameTime and gameTimeInterval from dataStore (using snake_case field names)
        const gameTime = fullContext.game_time || fullContext.game_day || 0;
        const gameTimeInterval = fullContext.game_time_interval || "Day";
        const characterId = fullContext.char?.id || agent.id.toString();
        const characterName = fullContext.char?.name || agent.props.name;
        const sessionIdStr = sessionId?.toString() || "unknown";

        // Get recent messages for context (last 2 turns)
        const recentMessages =
          fullContext.history?.slice(-2).map((msg: any) => ({
            role: msg.role || "user",
            content: msg.content || "",
            gameTime: msg.gameTime || gameTime,
          })) || [];

        // Recall character memories with current world context
        const roleplayMemories = await recallCharacterMemories({
          sessionId: sessionIdStr,
          characterId,
          characterName,
          currentGameTime: gameTime,
          currentGameTimeInterval: gameTimeInterval,
          recentMessages,
          limit: 5,
          worldContext: fullContext.world_context, // Pass accumulated world context (snake_case field name)
        });

        // Inject formatted memories (already formatted by recallCharacterMemories)
        message.content = roleplayMemories;

        console.log(`\n📖 [MEMORY RECALL] ${characterName}`);
        console.log(`Content injected:\n${roleplayMemories}\n`);

        // Only replace the first occurrence, then break
        break;
      } catch (error) {
        console.error("❌ [Roleplay Memory] Failed to inject memories:", error);
        logger.error("[Roleplay Memory] Failed to inject memories:", error);
        // Replace with error message (graceful degradation)
        message.content = "(Memory system unavailable)";
        break;
      }
    }
  }
}

/**
 * Apply automatic data store updates from World Agent
 * Updates game_time and participants fields in the data store array
 */
function applyRoleplayMemoryDataStoreUpdates(
  dataStore: DataStoreSavedField[],
  suggestedUpdates: { gameTime?: number; participants?: string[] },
): void {
  // Update game_time field
  if (suggestedUpdates.gameTime !== undefined) {
    const gameTimeIndex = dataStore.findIndex((f) => f.name === "game_time");
    if (gameTimeIndex >= 0) {
      dataStore[gameTimeIndex].value = String(suggestedUpdates.gameTime);
      console.log(
        `⏰ [Roleplay Memory] Auto-updated game_time: ${dataStore[gameTimeIndex].value}`,
      );
    } else {
      console.warn("[Roleplay Memory] game_time field not found in data store");
    }
  }

  // Update participants field
  if (suggestedUpdates.participants) {
    const participantsIndex = dataStore.findIndex(
      (f) => f.name === "participants",
    );
    if (participantsIndex >= 0) {
      dataStore[participantsIndex].value = JSON.stringify(
        suggestedUpdates.participants,
      );
      console.log(
        `👥 [Roleplay Memory] Auto-updated participants: ${suggestedUpdates.participants.join(", ")}`,
      );
    } else {
      console.warn(
        "[Roleplay Memory] participants field not found in data store",
      );
    }
  }
}

/**
 * Execute World Agent and distribute memories (END node)
 * Analyzes generated message to detect participants and distribute memories
 * Updates dataStore with accumulated worldContext
 * Returns suggested data store updates (gameTime, participants)
 */
async function executeWorldAgentAndDistributeMemories(
  result: any,
  fullContext: any,
  sessionId: UniqueEntityID | undefined,
  agent: any,
  dataStore: DataStoreSavedField[],
): Promise<{ gameTime?: number; participants?: string[] } | null> {
  try {
    const responseContent =
      typeof result.output === "object" && "response" in result.output
        ? (result.output as any).response
        : JSON.stringify(result.output);

    if (!responseContent || !sessionId) return null;

    console.log(`🌍 [Roleplay Memory] Executing World Agent for END node`);

    // Extract data store fields (using snake_case field names)
    const gameTime = fullContext.game_time || fullContext.game_day || 0;
    const gameTimeInterval = fullContext.game_time_interval || "Day";
    const characterId = fullContext.char?.id || agent.id.toString();
    const characterName = fullContext.char?.name || agent.props.name;
    const sessionIdStr = sessionId.toString();

    // Get recent messages for World Agent context (last 2 turns)
    const recentMessagesForWorldAgent =
      fullContext.history?.slice(-2).map((msg: any) => ({
        role: msg.role || "user",
        content: msg.content || "",
        gameTime: msg.gameTime || gameTime,
      })) || [];

    // Get ALL participant IDs from session (AI characters + user character)
    const session = (await SessionService.getSession.execute(sessionId))
      .throwOnFailure()
      .getValue();

    const allParticipantIds: string[] = [];
    const characterIdToName: Record<string, string> = {};

    // Add AI character IDs and names
    for (const id of session.aiCharacterCardIds) {
      const idStr = id.toString();
      allParticipantIds.push(idStr);

      // Get character name
      try {
        const card = (await CardService.getCard.execute(id))
          .throwOnFailure()
          .getValue() as CharacterCard;
        characterIdToName[idStr] =
          card.props.name || card.props.title || "Unknown";
      } catch {
        characterIdToName[idStr] = "Unknown";
      }
    }

    // Add user character ID and name if exists
    if (session.userCharacterCardId) {
      const userIdStr = session.userCharacterCardId.toString();
      allParticipantIds.push(userIdStr);

      try {
        const card = (
          await CardService.getCard.execute(session.userCharacterCardId)
        )
          .throwOnFailure()
          .getValue() as CharacterCard;
        characterIdToName[userIdStr] =
          card.props.name || card.props.title || "User";
      } catch {
        characterIdToName[userIdStr] = "User";
      }
    }

    // Build data store for World Agent
    const dataStoreForWorldAgent = {
      sessionId: sessionIdStr,
      currentScene:
        fullContext.currentScene || fullContext.location || "Unknown",
      participants: allParticipantIds,
      gameTime,
      gameTimeInterval,
      worldContext: fullContext.world_context || "", // Pass accumulated world context (snake_case)
    };

    // Execute World Agent to detect participants
    // Pass agent's API source and model ID for model reuse
    const worldAgentOutput = await executeWorldAgent({
      sessionId: sessionIdStr,
      speakerCharacterId: characterId,
      speakerName: characterName,
      generatedMessage: responseContent,
      recentMessages: recentMessagesForWorldAgent,
      dataStore: dataStoreForWorldAgent,
      characterIdToName: characterIdToName,
      worldMemoryContext: fullContext.worldMemoryContext,
      apiSource: agent.props.apiSource,
      modelId: agent.props.modelId,
    });

    // Accumulate world context from World Agent output
    let updatedWorldContext = fullContext.world_context || "";

    if (
      worldAgentOutput.worldContextUpdates &&
      worldAgentOutput.worldContextUpdates.length > 0
    ) {
      const { mergeWorldContext } = await import(
        "@/modules/supermemory/roleplay-memory"
      );

      updatedWorldContext = mergeWorldContext(
        fullContext.world_context || "",
        worldAgentOutput.worldContextUpdates,
      );

      // Update dataStore with new world_context (snake_case)
      const existingContextIndex = dataStore.findIndex(
        (f) => f.name === "world_context",
      );

      if (existingContextIndex >= 0) {
        // Update existing world_context field
        dataStore[existingContextIndex] = {
          ...dataStore[existingContextIndex],
          value: updatedWorldContext,
        };
      } else {
        // Add new world_context field
        dataStore.push({
          id: "world_context", // Use snake_case name as ID for system fields
          name: "world_context",
          type: "string",
          value: updatedWorldContext,
        });
      }
    }

    // Distribute memories to participants
    await distributeMemories({
      sessionId: sessionIdStr,
      speakerCharacterId: characterId,
      speakerName: characterName,
      message: responseContent,
      gameTime,
      gameTimeInterval,
      dataStore: dataStoreForWorldAgent,
      worldMemoryContext: fullContext.worldMemoryContext,
      worldAgentOutput, // Pass the World Agent output we already got
    });

    logger.info(
      `[Roleplay Memory] Distributed memories to ${worldAgentOutput.actualParticipants.length} participants`,
    );

    // Calculate new gameTime if deltaTime > 0
    const newGameTime =
      worldAgentOutput.deltaTime > 0
        ? gameTime + worldAgentOutput.deltaTime
        : undefined;

    // Return suggested updates
    const updates = {
      ...(newGameTime !== undefined && { gameTime: newGameTime }),
      participants: worldAgentOutput.actualParticipants,
      ...(updatedWorldContext && { worldContext: updatedWorldContext }),
    };

    return updates;
  } catch (error) {
    console.error("❌ [Roleplay Memory] Failed to execute World Agent:", error);
    logger.error("[Roleplay Memory] Failed to execute World Agent:", error);
    // Don't throw - graceful degradation (memory distribution is enhancement, not requirement)
    return null;
  }
}

export {
  addMessage,
  addOptionToMessage,
  createMessage,
  evaluateConditionOperator,
  executeFlow,
  makeContext,
  renderMessages,
  transformMessagesForModel,
  initializeRoleplayMemoryForSession,
};
