import {
  generateObject,
  generateText,
  jsonSchema,
  JSONValue,
  LanguageModel,
  smoothStream,
  streamObject,
  streamText,
} from "ai";
import { JSONSchema7 } from "json-schema";
import { cloneDeep, merge } from "lodash-es";

import {
  createProvider,
  getStructuredOutputMode,
  jsonSchemaToZod,
  shouldUseToolFallback,
  shouldUseNonStreamingForTools,
  streamWithToolFallback,
  generateWithToolFallback,
  isJsonSchemaNotSupportedError,
  isRecoverableWithToolMode,
  cacheModelForToolFallback,
  providerSupportsToolCalling,
} from "@/app/services/ai-model-factory";

import { fetchAgent } from "@/entities/agent/api/query-factory";
import {
  fetchApiConnections,
  isDefaultModelAvailable,
  isModelAvailableInProvider,
} from "@/entities/api/api-connection-queries";
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
import { useModelStore, DefaultModelSelection } from "@/shared/stores/model-store";
import { useWllamaStore } from "@/shared/stores/wllama-store";
import { Condition, isUnaryOperator } from "@/features/flow/types/condition-types";
import { traverseFlowCached } from "@/features/flow/utils/flow-traversal";
import { ModelTier } from "@/entities/agent/domain";
import { ApiSource } from "@/entities/api/domain";
import { ApiConnection } from "@/entities/api/domain/api-connection";
import { ScenarioCard } from "@/entities/card/domain";
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
import { parseAiSdkErrorMessage, parsePartialJson, parseStructuredOutputError, sanitizeFileName } from "@/shared/lib";
import { Datetime } from "@/shared/lib/datetime";
import { logger } from "@/shared/lib/logger";
import { TemplateRenderer } from "@/shared/lib/template-renderer";
import { getTokenizer } from "@/shared/lib/tokenizer/tokenizer";
import { translate } from "@/shared/lib/translate-utils";

// Model mapping configuration for automatic fallback
// When using AstrskAi, format must be "openai-compatible:modelId"
// The modelId is what gets sent to the Cloud LLM backend
const MODEL_TIER_MAPPING = {
  [ModelTier.Light]: "openai-compatible:deepseek/deepseek-chat",
  [ModelTier.Heavy]: "openai-compatible:deepseek/deepseek-chat",
} as const;

// Display names for the fallback models
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai-compatible:deepseek/deepseek-chat": "DeepSeek V3.2",
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

// Helper function to get global default model from user settings
// Falls back from Heavy → Light if Heavy model's provider is disconnected
// Returns null if modelTier is undefined (agent has specific model configured)
const getGlobalDefaultModel = (
  modelTier?: ModelTier,
): DefaultModelSelection | null => {
  // If no modelTier specified, agent has a specific model configured
  // Return null so PRIORITY 2 (agent's saved model) is used instead
  if (modelTier === undefined) {
    return null;
  }

  const modelStore = useModelStore.getState();

  if (modelTier === ModelTier.Heavy) {
    const heavyModel = modelStore.defaultStrongModel;

    // Check if heavy model is available
    if (isDefaultModelAvailable(heavyModel)) {
      return heavyModel;
    }

    // Fallback to lite model if heavy model's provider is disconnected
    logger.info(
      `[ModelFallback] Heavy model "${heavyModel?.modelName}" not available. ` +
      `Falling back to Lite model.`,
    );

    const liteModel = modelStore.defaultLiteModel;
    if (isDefaultModelAvailable(liteModel)) {
      return liteModel;
    }

    // Neither available
    return null;
  }

  // For Light tier, return lite model if available
  if (modelTier === ModelTier.Light) {
    const liteModel = modelStore.defaultLiteModel;
    if (isDefaultModelAvailable(liteModel)) {
      return liteModel;
    }
  }

  return null;
};

/**
 * Remove character name prefix from LLM response if present.
 * Matches patterns like "Character Name:" or "Character Name :" at the start of the text.
 * Only removes prefixes that look like character names (2-30 characters before colon).
 *
 * Examples:
 * - "Jane Doe: Hello there" → "Hello there"
 * - "Jane Doe : Hello" → "Hello"
 * - "Jane: Hi" → "Hi"
 * - "Hello there" → "Hello there" (no change)
 * - "A: Quick note" → "A: Quick note" (too short, likely not a name)
 *
 * @param content - The text content to clean
 * @returns The content with character name prefix removed if present
 */
const removeCharacterNamePrefix = (content: string): string => {
  // Match character name at start followed by colon
  // Pattern: Start of string → 2-30 non-colon characters → Optional space → Colon → Optional space
  // Min 2 chars: Avoids matching single letters like "A:" (likely not a character name)
  // Max 30 chars: Typical character name length limit
  const characterNamePattern = /^[^:\n]{2,30}\s*:\s*/;

  const match = content.match(characterNamePattern);
  if (match) {
    const prefix = match[0];
    const nameWithoutColon = prefix.replace(/\s*:\s*$/, '').trim();

    // Additional validation: Check if it looks like a name
    // Names typically contain letters and possibly spaces, hyphens, apostrophes, periods
    // Reject if it's mostly numbers or special characters
    const namePattern = /^[A-Za-z][\w\s\-'.]{1,28}[A-Za-z.]?$/;

    if (namePattern.test(nameWithoutColon)) {
      // Remove the matched prefix and trim any leading whitespace
      return content.slice(prefix.length).trimStart();
    }
  }

  return content;
};

// Helper function to get fallback model based on tier (for AstrskAi backend)
const getFallbackModel = (modelTier?: ModelTier): string | null => {
  if (!modelTier) {
    // Default to light tier if not specified
    return MODEL_TIER_MAPPING[ModelTier.Light];
  }
  return MODEL_TIER_MAPPING[modelTier] || null;
};

// Helper to get lite model fallback connection and model ID
const getLiteModelFallback = async (): Promise<{
  apiConnection: ApiConnection;
  modelId: string;
  modelName: string;
} | null> => {
  const modelStore = useModelStore.getState();
  const liteModel = modelStore.defaultLiteModel;

  if (!liteModel) {
    return null;
  }

  const apiConnections = await fetchApiConnections();
  const connection = apiConnections.find(
    (c) => c.id.toString() === liteModel.apiConnectionId
  );

  if (!connection) {
    return null;
  }

  return {
    apiConnection: connection,
    modelId: liteModel.modelId,
    modelName: liteModel.modelName,
  };
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
    // Set {{history_count}} - total number of turns in the session
    // This is efficient as it uses turnIds.length directly without loading all turns
    history_count: session.turnIds.length,
  };

  // Get scenario card (previously called plot card)
  let plotCard: ScenarioCard | null = null;
  if (session.plotCard && session.plotCard.enabled) {
    plotCard = await fetchScenarioCardOptional(session.plotCard.id);
  }

  // Set `{{session.scenario}}`
  if (plotCard && plotCard.props.description) {
    context.session.scenario = plotCard.props.description;
  }

  // Set `{{history}}` and prepare dataStore for regeneration
  // Only load the last MAX_HISTORY_FOR_RENDERING turns for efficiency
  const MAX_HISTORY_FOR_RENDERING = 20;
  if (includeHistory) {
    const history: HistoryItem[] = [];
    let dataStoreForRegeneration: DataStoreSavedField[] = [];

    // Determine which turns to load
    let turnIdsToLoad = session.turnIds;

    // If regenerating, only load turns up to (but not including) the regenerate message
    if (regenerateMessageId) {
      const regenerateIndex = session.turnIds.findIndex((id) =>
        id.equals(regenerateMessageId)
      );
      if (regenerateIndex > 0) {
        // Take turns before regenerateMessageId, limited to last MAX_HISTORY_FOR_RENDERING
        const turnsBeforeRegenerate = session.turnIds.slice(0, regenerateIndex);
        turnIdsToLoad = turnsBeforeRegenerate.slice(-MAX_HISTORY_FOR_RENDERING);
      } else {
        turnIdsToLoad = [];
      }
    } else {
      // Normal case: only load the last MAX_HISTORY_FOR_RENDERING turns
      turnIdsToLoad = session.turnIds.slice(-MAX_HISTORY_FOR_RENDERING);
    }

    const lastMessageId = turnIdsToLoad.length > 0
      ? turnIdsToLoad[turnIdsToLoad.length - 1]
      : null;

    for (const messageId of turnIdsToLoad) {
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
      if (lastMessageId && lastMessageId.equals(messageId)) {
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

  // Ensure context.user always exists with "Unknown User" fallback
  if (!context.user) {
    context.user = {
      id: "",
      name: "Unknown User",
      description: "",
      example_dialog: "",
      entries: [],
    };
  }

  // If char and user are the same (user character is speaking),
  // reassign context.user to the last non-user character
  if (
    context.char &&
    context.user &&
    context.char.id === context.user.id &&
    session.config.lastNonUserCharacterId
  ) {
    const lastNonUserChar = allCharacters.find(
      (char) => char.id === session.config.lastNonUserCharacterId,
    );
    if (lastNonUserChar) {
      context.user = lastNonUserChar;
    }
    // else: character was deleted, keep original context.user
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

  // Set `{{session.plot_entries}}` and `{{scenario}}`
  // Note: scenario.name is always "Narrator" for consistency in history/prompts
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

      // Set scenario variables for template rendering
      context.scenario = {
        id: plotCard.id.toString(),
        name: "Narrator",
        description: plotCard.props.description || "",
        entries: activatedEntries,
      };
    } catch (error) {
      // Ignore lorebook scan errors
    }
  } else if (plotCard) {
    // Set scenario variables even without lorebook
    context.scenario = {
      id: plotCard.id.toString(),
      name: "Narrator",
      description: plotCard.props.description || "",
      entries: [],
    };
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
  }
  // Note: AI SDK v5 no longer defaults temperature to 0, so no fallback needed

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
  modelId,
}: {
  parameters: Map<string, any>;
  apiSource: ApiSource;
  modelId?: string;
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

  // GLM models require thinking to be disabled for tool calling
  if (modelId && modelId.toLowerCase().includes("glm")) {
    options.thinking = { type: "disabled" } as unknown as JSONValue;
  }

  // Gemini models: Configure thinking via google.thinkingConfig
  // Gemini 3: Always "low" (cannot be disabled), Gemini 2.5: Use thinking_budget parameter (0 = disabled)
  if (apiSource === ApiSource.AstrskAi && modelId?.startsWith("google/gemini-")) {
    const isGemini3 = modelId.toLowerCase().includes("gemini-3");
    const thinkingBudget = parameters.get("thinking_budget");
    const existingGoogleOptions = (options.google as Record<string, unknown>) || {};

    options.google = {
      ...existingGoogleOptions,
      thinkingConfig: isGemini3
        ? { thinkingLevel: "low" }
        : { thinkingBudget: typeof thinkingBudget === "number" ? thinkingBudget : 0 },
    } as unknown as JSONValue;
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

// Use the shared createProvider from ai-model-factory
const makeProvider = createProvider;

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
  const tokenizer = getTokenizer();
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
  let isAstrskAi = false;
  switch (apiConnection.source) {
    // Astrsk Cloud LLM - unified /chat endpoint (OpenAI-compatible)
    case ApiSource.AstrskAi: {
      isAstrskAi = true;
      // Model ID format: "provider:modelId" (e.g., "openai-compatible:deepseek-ai/DeepSeek-V3.1")
      const modelIdSplitted = modelId.split(":");
      parsedModelId = modelIdSplitted.at(1) ?? modelId;
      // Fall through to use makeProvider
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
        modelId,
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
      ) as LanguageModel);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
    modelId: parsedModelId,
  });
  // Get the provider name for providerOptions (handle different model types)
  const modelProvider = typeof model === "object" && "provider" in model && typeof model.provider === "string"
    ? model.provider.split(".").at(0)
    : undefined;

  // Extra headers and body for Astrsk Cloud LLM
  const jwt = useAppStore.getState().jwt;
  const devKey = import.meta.env.VITE_DEV_KEY;
  const cloudLlmUrl = import.meta.env.VITE_CLOUD_LLM_URL;
  const astrskHeaders: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    "x-astrsk-credit-log": JSON.stringify(creditLog),
  };
  // Add x-dev-key header only for localhost (development environment)
  if (devKey && cloudLlmUrl && cloudLlmUrl.includes("localhost")) {
    astrskHeaders["x-dev-key"] = devKey;
  }

  // Check if thinking should be enabled (if thinking_budget or reasoning_effort is set)
  const thinkingBudget = parameters.get("thinking_budget");
  const reasoningEffort = parameters.get("reasoning_effort");
  const enableThinking = (thinkingBudget !== undefined && thinkingBudget !== null && thinkingBudget > 0) ||
    (reasoningEffort !== undefined && reasoningEffort !== null && reasoningEffort !== "");

  // Request to LLM endpoint
  if (streaming) {
    return streamText({
      model: model as LanguageModel,
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
      ...(isAstrskAi && {
        headers: astrskHeaders,
        experimental_extraBody: { thinking: enableThinking },
      }),
    });
  } else {
    const { text } = await generateText({
      model: model as LanguageModel,
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
      ...(isAstrskAi && {
        headers: astrskHeaders,
        experimental_extraBody: { thinking: enableThinking },
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
  let isAstrskAi = false;
  switch (apiConnection.source) {
    // Astrsk Cloud LLM - unified /chat endpoint (OpenAI-compatible)
    case ApiSource.AstrskAi: {
      isAstrskAi = true;
      // Model ID format: "provider:modelId" (e.g., "openai-compatible:deepseek-ai/DeepSeek-V3.1")
      const modelIdSplitted = modelId.split(":");
      parsedModelId = modelIdSplitted.at(1) ?? modelId;
      // Fall through to use makeProvider
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
        modelId,
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
      ) as LanguageModel);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
    modelId: parsedModelId,
  });
  // Get the provider name for providerOptions (handle different model types)
  const modelProvider = typeof model === "object" && "provider" in model && typeof model.provider === "string"
    ? model.provider.split(".").at(0)
    : undefined;

  // Determine structured output mode based on API connection and model name
  const mode = getStructuredOutputMode(apiConnection.source, parsedModelId);
  logger.info(`[StructuredOutput] Determined mode for ${apiConnection.source} / ${parsedModelId}: ${mode}`);

  // Check if we should use generateText with tool fallback (for models like GLM or cached models)
  // GLM models don't support json_schema response_format, but support tool calling
  const useToolFallback = shouldUseToolFallback(apiConnection.source, parsedModelId);

  // Extra headers and body for Astrsk Cloud LLM
  const jwt = useAppStore.getState().jwt;
  const devKey = import.meta.env.VITE_DEV_KEY;
  const cloudLlmUrl = import.meta.env.VITE_CLOUD_LLM_URL;
  const astrskHeaders: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    "x-astrsk-credit-log": JSON.stringify(creditLog),
  };
  // Add x-dev-key header only for localhost (development environment)
  if (devKey && cloudLlmUrl && cloudLlmUrl.includes("localhost")) {
    astrskHeaders["x-dev-key"] = devKey;
  }

  // Helper: Execute tool fallback approach (generateText/streamText with tool calling)
  const executeToolFallback = () => {
    // Convert CoreMessage to simple message format for the fallback
    const simpleMessages = transformedMessages.map((msg) => ({
      role: msg.role as "system" | "user" | "assistant",
      content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    }));

    // Gemini uses non-streaming generateWithToolFallback (Vertex AI streaming incompatible with streamObject)
    const isGoogleProvider = apiConnection.source === ApiSource.AstrskAi &&
      parsedModelId.startsWith("google/gemini-");
    if (isGoogleProvider) {

      const partialObjectStream = (async function* () {
        const result = await generateWithToolFallback({
          model: model as LanguageModel,
          messages: simpleMessages,
          schema: schema.typeDef as JSONSchema7,
          schemaName: schema.name,
          schemaDescription: schema.description,
          abortSignal: combinedAbortSignal,
          isGoogleProvider: true,
          modelId: parsedModelId,
          providerOptions,
          settings,
        });
        yield result;
      })();

      return { partialObjectStream };
    }

    // Other models use streaming version
    logger.info(`[StructuredOutput] Using streamWithToolFallback`);

    const partialObjectStream = streamWithToolFallback({
      model: model as LanguageModel,
      messages: simpleMessages,
      schema: schema.typeDef as JSONSchema7,
      schemaName: schema.name,
      schemaDescription: schema.description,
      abortSignal: combinedAbortSignal,
      isGoogleProvider: false,
      providerOptions,
      settings,
    });

    return { partialObjectStream };
  };

  // For models that don't support json_schema response_format (like GLM or cached models),
  // use generateText with tool calling instead of streamObject/generateObject
  if (useToolFallback) {
    return executeToolFallback();
  }
  // Check if thinking should be enabled (if thinking_budget or reasoning_effort is set)
  const thinkingBudget = parameters.get("thinking_budget");
  const reasoningEffort = parameters.get("reasoning_effort");
  const enableThinking = (thinkingBudget !== undefined && thinkingBudget !== null && thinkingBudget > 0) ||
    (reasoningEffort !== undefined && reasoningEffort !== null && reasoningEffort !== "");

  // Check if provider supports tool calling (for fallback)
  const canUseFallback = providerSupportsToolCalling(apiConnection.source);

  // Helper: Execute streamObject with a specific mode
  const executeStreamObject = (targetMode: "auto" | "json" | "tool") => {
    const schemaForMode = targetMode === "tool"
      ? jsonSchemaToZod(schema.typeDef as JSONSchema7)
      : jsonSchema(schema.typeDef);

    return streamObject({
      model: model as LanguageModel,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      schema: schemaForMode,
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
      mode: targetMode,
      onError: (error) => {
        logger.error(`[StructuredOutput] streamObject error (mode: ${targetMode}):`, error);
        throw error.error;
      },
      ...(isAstrskAi && {
        headers: astrskHeaders,
        experimental_extraBody: { thinking: enableThinking },
      }),
    });
  };

  // Helper: Execute generateObject with a specific mode
  const executeGenerateObject = async (targetMode: "auto" | "json" | "tool") => {
    const schemaForMode = targetMode === "tool"
      ? jsonSchemaToZod(schema.typeDef as JSONSchema7)
      : jsonSchema(schema.typeDef);

    const { object } = await generateObject({
      model: model as LanguageModel,
      messages: transformedMessages,
      abortSignal: combinedAbortSignal,
      schema: schemaForMode,
      schemaName: schema.name,
      schemaDescription: schema.description,
      mode: targetMode,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && modelProvider
        ? {
          providerOptions: {
            [modelProvider]: providerOptions,
          },
        }
        : {}),
      ...(isAstrskAi && {
        headers: astrskHeaders,
        experimental_extraBody: { thinking: enableThinking },
      }),
    });

    // Create a generator to return the final object
    async function* createObjectStream(finalObject: unknown) {
      yield finalObject;
    }

    return { partialObjectStream: createObjectStream(object) };
  };

  // Cascading fallback approach for providers using "json" mode:
  // 1. Try with current mode (json/auto/tool)
  // 2. If json mode fails → try with tool mode
  // 3. If tool mode fails → try generateText with tool calling (and cache if json_schema not supported)
  if (streaming) {
    // Step 1: Try with the determined mode
    try {
      return executeStreamObject(mode);
    } catch (error) {
      logger.warn(`[StructuredOutput] streamObject failed with mode: ${mode}`, error);

      // Step 2: If using json mode and it failed (parsing error or not supported), try tool mode
      if (mode === "json" && canUseFallback && isRecoverableWithToolMode(error)) {
        try {
          logger.info(`[StructuredOutput] Retrying with mode: tool (json failed with recoverable error)`);
          return executeStreamObject("tool");
        } catch (toolError) {
          logger.warn(`[StructuredOutput] streamObject failed with mode: tool`, toolError);

          // Step 3: Try generateText with tool calling as last resort
          // Cache only if json_schema not supported (not for parsing errors)
          if (isJsonSchemaNotSupportedError(toolError)) {
            logger.warn(`[StructuredOutput] Model ${apiConnection.source}:${parsedModelId} doesn't support structured output, caching for tool fallback`);
            cacheModelForToolFallback(apiConnection.source, parsedModelId);
          }
          // Try generateWithToolFallback for any recoverable error
          if (isRecoverableWithToolMode(toolError)) {
            return executeToolFallback();
          }
          throw toolError;
        }
      }

      // For non-json modes, check if we can use tool fallback
      if (isJsonSchemaNotSupportedError(error) && canUseFallback) {
        logger.warn(`[StructuredOutput] Model ${apiConnection.source}:${parsedModelId} doesn't support structured output, caching for tool fallback`);
        cacheModelForToolFallback(apiConnection.source, parsedModelId);
        return executeToolFallback();
      }

      throw error;
    }
  }

  // Non-streaming path with cascading fallback
  // Step 1: Try with the determined mode
  try {
    return await executeGenerateObject(mode);
  } catch (error) {
    logger.warn(`[StructuredOutput] generateObject failed with mode: ${mode}`, error);

    // Step 2: If using json mode and it failed (parsing error or not supported), try tool mode
    if (mode === "json" && canUseFallback && isRecoverableWithToolMode(error)) {
      try {
        logger.info(`[StructuredOutput] Retrying with mode: tool (json failed with recoverable error)`);
        return await executeGenerateObject("tool");
      } catch (toolError) {
        logger.warn(`[StructuredOutput] generateObject failed with mode: tool`, toolError);

        // Step 3: Try generateText with tool calling as last resort
        // Cache only if json_schema not supported (not for parsing errors)
        if (isJsonSchemaNotSupportedError(toolError)) {
          logger.warn(`[StructuredOutput] Model ${apiConnection.source}:${parsedModelId} doesn't support structured output, caching for tool fallback`);
          cacheModelForToolFallback(apiConnection.source, parsedModelId);
        }
        // Try generateWithToolFallback for any recoverable error
        if (isRecoverableWithToolMode(toolError)) {
          return executeToolFallback();
        }
        throw toolError;
      }
    }

    // For non-json modes, check if we can use tool fallback
    if (isJsonSchemaNotSupportedError(error) && canUseFallback) {
      logger.warn(`[StructuredOutput] Model ${apiConnection.source}:${parsedModelId} doesn't support structured output, caching for tool fallback`);
      cacheModelForToolFallback(apiConnection.source, parsedModelId);
      return executeToolFallback();
    }

    throw error;
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

    // Get API connections
    const apiConnections = await fetchApiConnections();
    let apiConnection: ApiConnection | undefined;

    // Initialize with agent's saved model (used as fallback if global default not available)
    let apiSource = agent.props.apiSource;
    let apiModelId = agent.props.modelId;
    let actualModelName = agent.props.modelName; // Track the actual model name being used

    // Log agent's model configuration for debugging
    console.log(`[ModelSelection] Agent "${agent.props.name}" model config:`, {
      useDefaultModel: agent.props.useDefaultModel,
      modelTier: agent.props.modelTier,
      apiSource: agent.props.apiSource,
      modelId: agent.props.modelId,
      modelName: agent.props.modelName,
    });

    // PRIORITY 1: Use global default model only if agent is configured to use defaults
    // (useDefaultModel === true means use tier-based defaults from settings)
    const globalDefault = agent.props.useDefaultModel
      ? getGlobalDefaultModel(agent.props.modelTier)
      : null;

    console.log(`[ModelSelection] useDefaultModel=${agent.props.useDefaultModel}, globalDefault:`, globalDefault);

    if (globalDefault) {
      // Find the API connection for the global default model
      const defaultConnection = apiConnections.find(
        (connection) => connection.id.toString() === globalDefault.apiConnectionId,
      );

      if (defaultConnection) {
        logger.info(
          `[RuntimeModelSelection] Using current default model: ${globalDefault.modelName} ` +
          `(tier: ${agent.props.modelTier || "lite"}, saved in flow: ${agent.props.modelName || "none"})`,
        );

        // Use the global default model
        apiConnection = defaultConnection;
        apiSource = globalDefault.apiSource as ApiSource;
        apiModelId = globalDefault.modelId;
        actualModelName = globalDefault.modelName;
      }
    }

    // PRIORITY 2: Fall back to agent's saved model configuration if global default not available
    if (!apiConnection && agent.props.apiSource && agent.props.modelId) {
      console.log(`[ModelSelection] PRIORITY 2: Using agent's saved model config`);
      apiSource = agent.props.apiSource;
      apiModelId = agent.props.modelId;
      actualModelName = agent.props.modelName;

      // Parse modelId for OpenAI compatible: "{title}|{actualModelId}"
      let connectionTitle: string | undefined;

      if (apiSource === ApiSource.OpenAICompatible && apiModelId.includes("|")) {
        const parts = apiModelId.split("|");
        if (parts.length === 2) {
          connectionTitle = parts[0];
          apiModelId = parts[1]; // Extract actual model ID
        }
      }

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

      // Check if the configured model is actually available in the provider
      if (apiConnection) {
        const modelAvailable = isModelAvailableInProvider(
          apiConnection.id.toString(),
          apiModelId,
        );

        if (!modelAvailable) {
          logger.info(
            `[ModelUnavailable] Saved model "${apiModelId}" not found in provider ${apiSource}.`,
          );
          // Clear the connection so fallback logic kicks in
          apiConnection = undefined;
        } else {
          logger.info(
            `[FallbackToSavedModel] Using model saved in flow: ${actualModelName} ` +
            `(global default not available)`,
          );
        }
      }
    }

    // Fallback: Automatic model mapping for logged-in users (AstrskAi backend)
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

    // If still no connection or no model ID, throw error
    if (!apiConnection) {
      throw new Error(`API connection not found for source: ${apiSource}`);
    }
    if (!apiModelId) {
      throw new Error("No model ID available. Please configure a model for this agent or set a default model in Settings.");
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
    // Use sanitized agent name as the key for variables
    // (DataStore logic references agents by their sanitized name, e.g., {{agent_name.field}})
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
      // Generate structured output with fallback to lite model on failure
      let streamResult;
      let usedModelName = actualModelName;
      try {
        streamResult = await generateStructuredOutput({
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
      } catch (primaryError) {
        // Don't retry if aborted
        if ((primaryError as Error).name === "AbortError") {
          throw primaryError;
        }

        logger.warn("[InferenceFallback] Primary model failed, trying lite model fallback", {
          error: primaryError instanceof Error ? primaryError.message : "Unknown error",
          primaryModel: actualModelName,
        });

        // Try fallback to lite model
        const fallback = await getLiteModelFallback();
        if (fallback && fallback.modelId !== apiModelId) {
          logger.info("[InferenceFallback] Retrying with lite model", {
            fallbackModel: fallback.modelName,
          });

          streamResult = await generateStructuredOutput({
            apiConnection: fallback.apiConnection,
            modelId: fallback.modelId,
            messages: transformedMessages,
            parameters: agent.parameters,
            schema: {
              typeDef: agent.getSchemaTypeDef({
                apiSource: fallback.apiConnection.source,
              }),
              name: agent.props.schemaName,
              description: agent.props.schemaDescription,
            },
            streaming: agent.props.outputStreaming,
            stopSignalByUser: stopSignalByUser,
            creditLog: creditLog,
          });
          usedModelName = fallback.modelName;
          result.modelName = usedModelName;
        } else {
          throw primaryError;
        }
      }

      // Stream structured output
      for await (const partialObject of streamResult.partialObjectStream) {
        merge(result, { output: partialObject });
        yield result;
      }

      // Extract metadata from stream result promises
      try {
        const metadata: any = {};
        const streamResultAny = streamResult as any;

        // Check _object for final structured output (AI SDK v5 internal property)
        // This can recover output when partialObjectStream yields empty objects
        if (streamResultAny._object) {
          try {
            const delayedPromise = streamResultAny._object;
            if (delayedPromise.status?.type === 'resolved') {
              const resolvedValue = delayedPromise.status.value;
              if (resolvedValue && typeof resolvedValue === 'object' && Object.keys(resolvedValue).length > 0) {
                merge(result, { output: resolvedValue });
                yield result;
              }
            } else if (delayedPromise.status?.type === 'rejected') {
              // Capture parse error for display after flow execution
              const error = delayedPromise.status.error;
              const errorMessage = parseStructuredOutputError(error, usedModelName);

              logger.error(`[StructuredOutput] ${errorMessage}`, {
                agent: agent.props.name,
                model: usedModelName,
              });

              // Add error to metadata so it can be displayed
              metadata.structuredOutputError = errorMessage;
            }
          } catch {
            // Silently continue without _object
          }
        }

        // Extract metadata from promise properties (usage, finishReason, etc.)
        const promiseProps = Object.keys(streamResultAny).filter(key => key.endsWith('Promise'));
        for (const prop of promiseProps) {
          try {
            const promiseResult = await Promise.race([
              streamResultAny[prop],
              new Promise((resolve) => setTimeout(() => resolve(null), 2000))
            ]);

            let value = promiseResult;
            if (promiseResult && typeof promiseResult === 'object' && 'status' in promiseResult) {
              const status = (promiseResult as any).status;
              if (status?.type === 'resolved' && 'value' in status) {
                value = status.value;
              }
            }

            const isEmptyObject = value && typeof value === 'object' && Object.keys(value).length === 0;
            if (value !== null && value !== undefined && !isEmptyObject) {
              metadata[prop.replace('Promise', '')] = value;
            }
          } catch {
            // Silently skip unavailable promises
          }
        }

        if (Object.keys(metadata).length > 0) {
          merge(result, { metadata });
          yield result;
        }
      } catch {
        // Don't throw, just continue without metadata
      }
    } else {
      // Generate text output with fallback to lite model on failure
      let streamResult;
      try {
        // Check if we need to force non-streaming for this model
        const forceNonStreaming = shouldUseNonStreamingForTools(apiConnection.source, apiModelId);
        const effectiveStreaming = forceNonStreaming ? false : agent.props.outputStreaming;

        if (forceNonStreaming && agent.props.outputStreaming) {
          logger.info("[SessionPlay] Forcing non-streaming for model", {
            modelId: apiModelId,
            source: apiConnection.source,
            originalStreaming: agent.props.outputStreaming,
          });
        }

        streamResult = await generateTextOutput({
          apiConnection: apiConnection,
          modelId: apiModelId,
          messages: transformedMessages,
          parameters: agent.parameters,
          streaming: effectiveStreaming,
          stopSignalByUser: stopSignalByUser,
          creditLog: creditLog,
        });
      } catch (primaryError) {
        // Don't retry if aborted
        if ((primaryError as Error).name === "AbortError") {
          throw primaryError;
        }

        logger.warn("[InferenceFallback] Primary model failed, trying lite model fallback", {
          error: primaryError instanceof Error ? primaryError.message : "Unknown error",
          primaryModel: actualModelName,
        });

        // Try fallback to lite model
        const fallback = await getLiteModelFallback();
        if (fallback && fallback.modelId !== apiModelId) {
          logger.info("[InferenceFallback] Retrying with lite model", {
            fallbackModel: fallback.modelName,
          });

          streamResult = await generateTextOutput({
            apiConnection: fallback.apiConnection,
            modelId: fallback.modelId,
            messages: transformedMessages,
            parameters: agent.parameters,
            streaming: agent.props.outputStreaming,
            stopSignalByUser: stopSignalByUser,
            creditLog: creditLog,
          });
          result.modelName = fallback.modelName;
        } else {
          throw primaryError;
        }
      }

      // Stream text output
      let response = "";
      for await (const chunk of streamResult.textStream) {
        response += chunk;
        merge(result, { output: { response } });
        yield result;
      }

      // Post-process: Remove character name prefix if present (e.g., "Jane Doe: Hello" → "Hello")
      // This handles cases where LLMs incorrectly prefix responses with character names
      response = removeCharacterNamePrefix(response);
      merge(result, { output: { response } });

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
  triggerType,
}: {
  flowId: UniqueEntityID;
  sessionId: UniqueEntityID;
  characterCardId: UniqueEntityID;
  regenerateMessageId?: UniqueEntityID;
  stopSignalByUser?: AbortSignal;
  triggerType?: string;
}): AsyncGenerator<FlowResult, FlowResult, void> {
  // Flow result
  let content = "";
  const variables: Record<string, any> = {};
  const translations: Map<string, string> = new Map();
  let dataStore: DataStoreSavedField[] = [];

  try {
    // Get flow
    const flow = await fetchFlow(flowId);

    // Find default character start node (no nodeVariant)
    const defaultStartNode = flow.props.nodes.find(
      (node) =>
        node.type === "start" && !(node.data as any)?.nodeVariant
    );

    // Helper to check if a node has outgoing edges (is connected)
    const hasOutgoingEdges = (nodeId: string) =>
      flow.props.edges.some((edge) => edge.source === nodeId);

    // Find start node based on trigger type
    let startNode = triggerType
      ? // If triggerType provided, find start node with matching nodeVariant
        flow.props.nodes.find(
          (node) =>
            node.type === "start" &&
            (node.data as any)?.nodeVariant === triggerType
        )
      : // Otherwise, use default start node
        defaultStartNode;

    // Fallback: If trigger start node doesn't exist or has no connections, use default
    if (triggerType && (!startNode || !hasOutgoingEdges(startNode.id))) {
      startNode = defaultStartNode;
    }

    if (!startNode) {
      const nodeType = triggerType ? `${triggerType} start` : "start";
      throw new Error(`No ${nodeType} node found in flow`);
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

            // Determine if the rendered value needs JavaScript execution
            // Heuristic: If the rendered value contains JS operators, execute as JS
            // Otherwise, use the rendered value directly
            const fullContext = createFullContext(context, {}, dataStore);
            const jsOperatorPattern = /[+\-*/%<>=?:&|!]/;
            const needsJsExecution = jsOperatorPattern.test(renderedValue);

            let executedValue: unknown;
            if (needsJsExecution) {
              // Has operators - execute as JavaScript for math/logic expressions
              executedValue = executeJavaScriptCode(
                renderedValue,
                fullContext,
              );
            } else {
              // Simple value - use rendered template value directly
              executedValue = renderedValue;
            }

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
                // Determine if the rendered value needs JavaScript execution
                // JavaScript execution is needed for:
                // - Math expressions: "100 + -5", "50 * 2"
                // - Comparisons: "a > b ? a : b"
                // - String concatenation with +: '"Hello" + " World"'
                //
                // JavaScript execution is NOT needed for:
                // - Simple values that are just template substitutions
                //
                // Heuristic: If the rendered value contains JS operators, execute as JS
                // Otherwise, use the rendered value directly (avoids "CRITICAL is not defined" errors)
                const jsOperatorPattern = /[+\-*/%<>=?:&|!]/;
                const needsJsExecution = jsOperatorPattern.test(renderedValue);

                let executedValue: unknown;
                if (needsJsExecution) {
                  // Has operators - execute as JavaScript for math/logic expressions
                  executedValue = executeJavaScriptCode(
                    renderedValue,
                    fullContext,
                  );
                } else {
                  // Simple value - use rendered template value directly
                  executedValue = renderedValue;
                }

                // Convert value - returns null if invalid (NaN, undefined, etc.)
                const convertedValue = convertToDataStoreType(
                  String(executedValue),
                  schemaField.type,
                );

                // Skip update if conversion failed (preserves existing value)
                if (convertedValue === null) {
                  logger.debug(
                    `Skipping dataStore update for "${schemaField.name}": invalid value "${executedValue}"`,
                  );
                  continue;
                }

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
    const debugInfo = `value1="${value1}"${condition.operator && !isUnaryOperator(condition.operator)
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
      /\bconstructor\b/,
      /\b__proto__\b/,
      /\bprototype\b/,
      /\bthis\b/,
      /\bProxy\b/,
      /\bReflect\b/,
    ];

    // Check for Unicode escapes and bracket notation (bypass attempts)
    if (/\\u[0-9a-fA-F]{4}/.test(code) || /\[['"`]/.test(code)) {
      logger.warn(`JavaScript code contains suspicious patterns: ${code}`);
      return code;
    }

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
 * @returns The converted value, or null if the value is invalid (NaN, undefined, etc.)
 */
function convertToDataStoreType(
  value: string,
  type: DataStoreFieldType,
): string | number | boolean | null {
  // Check for undefined/null values first
  if (value === "undefined" || value === "null" || value === "") {
    return null;
  }

  switch (type) {
    case "string":
      return String(value);
    case "number": {
      const num = Number(value);
      // Return null for NaN - caller should skip update
      return isNaN(num) ? null : num;
    }
    case "boolean": {
      const lowerValue = value.toLowerCase().trim();
      return (
        lowerValue === "true" || lowerValue === "1" || lowerValue === "yes"
      );
    }
    case "integer": {
      const int = parseInt(value, 10);
      // Return null for NaN - caller should skip update
      return isNaN(int) ? null : int;
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
  removeCharacterNamePrefix,
  renderMessages,
  transformMessagesForModel
};

