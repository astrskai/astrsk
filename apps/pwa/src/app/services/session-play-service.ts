import { createAnthropic } from "@ai-sdk/anthropic";
import { createCohere } from "@ai-sdk/cohere";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
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
import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { TurnService } from "@/app/services/turn-service";
import { useWllamaStore } from "@/app/stores/wllama-store";
import { OutputFormat } from "@/modules/agent/domain";
import { ApiSource } from "@/modules/api/domain";
import {
  ApiConnection,
  OpenrouterProviderSort,
} from "@/modules/api/domain/api-connection";
import { PlotCard } from "@/modules/card/domain";
import { CharacterCard } from "@/modules/card/domain/character-card";
import { Session } from "@/modules/session/domain/session";
import { Option } from "@/modules/turn/domain/option";
import { Turn as MessageEntity } from "@/modules/turn/domain/turn";
import { parseAiSdkErrorMessage, sanitizeFileName } from "@/shared/utils";
import { translate } from "@/shared/utils/translate-utils";
import * as amplitude from "@amplitude/analytics-browser";

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

  // Set `{{history}}`
  if (includeHistory) {
    const history: HistoryItem[] = [];
    const lastMessageId = session.turnIds[session.turnIds.length - 1];
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
        char.name = TemplateRenderer.render(
          char.name || "",
          context,
        );
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
        .map((entry) => TemplateRenderer.render(
          entry.content || "",
          context,
        ));
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
      ? parameter.parsingFunction(paramValueRaw)
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
];

const makeSettings = ({ parameters }: { parameters: Map<string, any> }) => {
  const settings: Record<string, any> = {};

  if (parameters.has("max_tokens")) {
    settings["maxTokens"] = Number(parameters.get("max_tokens"));
  }

  if (parameters.has("temperature")) {
    settings["temperature"] = Number(parameters.get("temperature"));
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
      ? parameter.parsingFunction(paramValueRaw)
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
  apiConnection,
  isStructuredOutput,
}: {
  apiConnection: ApiConnection;
  isStructuredOutput?: boolean;
}) => {
  let provider;
  switch (apiConnection.source) {
    case ApiSource.AstrskAi:
      provider = createOpenAI({
        apiKey: apiConnection.apiKey,
        baseURL: apiConnection.baseUrl,
      });
      break;

    case ApiSource.OpenAI:
      provider = createOpenAI({
        apiKey: apiConnection.apiKey,
      });
      break;

    case ApiSource.OpenAICompatible:
      let baseUrl = apiConnection.baseUrl ?? "";
      if (!baseUrl.endsWith("/v1")) {
        baseUrl += "/v1";
      }
      provider = createOpenAI({
        apiKey: apiConnection.apiKey,
        baseURL: baseUrl,
      });
      break;

    case ApiSource.Anthropic:
      provider = createAnthropic({
        apiKey: apiConnection.apiKey,
        headers: {
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      break;

    case ApiSource.OpenRouter:
      const options: OpenRouterProviderSettings = {
        apiKey: apiConnection.apiKey,
        headers: {
          "HTTP-Referer": "https://astrsk.ai",
          "X-Title": "astrsk.ai",
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
        apiConnection.openrouterProviderSort &&
        apiConnection.openrouterProviderSort !== OpenrouterProviderSort.Default
      ) {
        merge(extraBody, {
          provider: {
            sort: apiConnection.openrouterProviderSort,
          },
        });
      }
      options.extraBody = extraBody;
      provider = createOpenRouter(options);
      break;

    case ApiSource.GoogleGenerativeAI:
      provider = createGoogleGenerativeAI({
        apiKey: apiConnection.apiKey,
      });
      break;

    case ApiSource.Ollama:
      provider = createOllama({
        baseURL: apiConnection.baseUrl,
      });
      break;

    case ApiSource.DeepSeek:
      provider = createDeepSeek({
        apiKey: apiConnection.apiKey,
      });
      break;

    case ApiSource.xAI:
      provider = createXai({
        apiKey: apiConnection.apiKey,
      });
      break;

    case ApiSource.Mistral:
      provider = createMistral({
        apiKey: apiConnection.apiKey,
      });
      break;

    case ApiSource.Cohere:
      provider = createCohere({
        apiKey: apiConnection.apiKey,
      });

      break;

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

    case ApiSource.KoboldCPP:
      return generateMessageKobold({
        modelId,
        messages,
        parameters,
        abortSignal,
        apiConnection,
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

async function* streamTextKobold({
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

  parameters?.forEach((value, key) => {
    const param = parameterList.find((p) => p.id === key);
    const parsedValue = param?.parsingFunction
      ? param.parsingFunction(value)
      : value;
    if (param) {
      if (param.nameByApiSource.size === 0) {
        body[key] = parsedValue;
      } else if (param.nameByApiSource.has(ApiSource.KoboldCPP)) {
        const koboldName = param.nameByApiSource.get(ApiSource.KoboldCPP);
        if (koboldName) {
          body[koboldName] = parsedValue;
        }
      }
    }
  });

  try {
    // Make streaming request to KoboldCPP API
    const response = await fetch(
      `${apiConnection.baseUrl}/api/extra/generate/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: abortSignal,
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is null");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              yield data.token;
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
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

const generateMessageKobold = async ({
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
  // Create text stream
  const textStream = streamTextKobold({
    modelId,
    messages,
    parameters,
    abortSignal,
    apiConnection,
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

  // Track event
  amplitude.track("add_turn", {
    session_id: sessionAndMessage.session.id.toString(),
    turn_count: sessionAndMessage.session.turnIds.length,
  });

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
}: {
  apiConnection: ApiConnection;
  modelId: string;
  messages: Message[];
  parameters: Map<string, any>;
  stopSignalByUser?: AbortSignal;
  streaming?: boolean;
}) {
  // Timeout and abort signals
  const abortSignals: AbortSignal[] = [];
  if (stopSignalByUser) {
    abortSignals.push(stopSignalByUser);
  }
  if (apiConnection.source === ApiSource.AIHorde) {
    abortSignals.push(new AbortController().signal); // Dummy signal
  } else {
    abortSignals.push(AbortSignal.timeout(60000)); // Timeout 60 seconds
  }
  const combinedAbortSignal = AbortSignal.any(abortSignals);

  // Request by API source
  let provider;
  switch (apiConnection.source) {
    // Request by AI SDK
    case ApiSource.AstrskAi:
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
      provider = makeProvider({
        apiConnection,
      });
      break;

    // Request by non-AI SDK
    case ApiSource.Wllama:
    case ApiSource.KoboldCPP:
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
      ? provider.chat(modelId, modelSettings)
      : (provider.languageModel(modelId, modelSettings) as LanguageModelV1);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
  });

  // Request to LLM endpoint
  if (streaming) {
    return streamText({
      model,
      messages,
      abortSignal: combinedAbortSignal,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && {
        providerOptions: {
          [model.provider]: providerOptions,
        },
      }),
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
      onError: (error) => {
        throw error.error;
      },
    });
  } else {
    const { text } = await generateText({
      model,
      messages,
      abortSignal: combinedAbortSignal,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && {
        providerOptions: {
          [model.provider]: providerOptions,
        },
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
}) {
  // Validate messages
  validateMessages(messages, apiConnection.source);

  // Timeout and abort signals
  const abortSignals = [AbortSignal.timeout(60000)];
  if (stopSignalByUser) {
    abortSignals.push(stopSignalByUser);
  }
  const combinedAbortSignal = AbortSignal.any(abortSignals);

  // Request by API source
  let provider;
  switch (apiConnection.source) {
    // Request by AI SDK
    case ApiSource.AstrskAi:
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
      provider = makeProvider({
        apiConnection,
        isStructuredOutput: true,
      });
      break;

    // TODO: implement structured data for non-AI SDK
    // Request by non-AI SDK
    case ApiSource.Wllama:
    case ApiSource.KoboldCPP:
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
      ? provider.chat(modelId, modelSettings)
      : (provider.languageModel(modelId, modelSettings) as LanguageModelV1);

  // Make settings
  const settings = makeSettings({
    parameters: parameters,
  });

  // Make provider options
  const providerOptions = makeProviderOptions({
    parameters: parameters,
    apiSource: apiConnection.source,
  });

  let mode = model.defaultObjectGenerationMode;
  if (apiConnection.source === ApiSource.OpenRouter) {
    mode = "json";
  }

  // Request to LLM endpoint
  if (streaming) {
    return streamObject({
      model,
      messages,
      abortSignal: combinedAbortSignal,
      schema: jsonSchema(schema.typeDef),
      schemaName: schema.name,
      schemaDescription: schema.description,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && {
        providerOptions: {
          [model.provider]: providerOptions,
        },
      }),
      mode,
      onError: (error) => {
        throw error.error;
      },
    });
  } else {
    const { object } = await generateObject({
      model,
      messages,
      abortSignal: combinedAbortSignal,
      schema: jsonSchema(schema.typeDef),
      schemaName: schema.name,
      schemaDescription: schema.description,
      ...settings,
      ...(Object.keys(providerOptions).length > 0 && {
        providerOptions: {
          [model.provider]: providerOptions,
        },
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
  contextWithVariables,
  stopSignalByUser,
}: {
  agentId: UniqueEntityID;
  contextWithVariables: any;
  stopSignalByUser?: AbortSignal;
}): AsyncGenerator<AgentNodeResult, AgentNodeResult, void> {
  try {
    // Get agent
    const agent = (await AgentService.getAgent.execute(agentId))
      .throwOnFailure()
      .getValue();

    // Get API connection
    const apiSource = agent.props.apiSource;
    const apiModelId = agent.props.modelId;
    if (!apiSource || !apiModelId) {
      throw new Error("Agent does not have API source or model ID");
    }
    const apiConnection = (await ApiService.listApiConnection.execute({}))
      .throwOnFailure()
      .getValue()
      .find((connection) => connection.source === apiSource);
    if (!apiConnection) {
      throw new Error(`API connection not found for source: ${apiSource}`);
    }

    // Render messages
    const messages = await renderMessages({
      renderable: agent,
      context: contextWithVariables,
      parameters: agent.parameters,
    });
    validateMessages(messages, apiConnection.source);

    // Generate agent output
    const agentKey = sanitizeFileName(agent.props.name);
    const result = {
      agentKey: agentKey,
      agentName: agent.props.name,
      modelName: agent.props.modelName,
      output: {},
    };
    yield result;
    const isStructuredOutput =
      agent.props.outputFormat === OutputFormat.StructuredOutput;
    if (isStructuredOutput) {
      // Generate structured output
      const { partialObjectStream } = await generateStructuredOutput({
        apiConnection: apiConnection,
        modelId: apiModelId,
        messages: messages,
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
        messages: messages,
        parameters: agent.parameters,
        streaming: agent.props.outputStreaming,
        stopSignalByUser: stopSignalByUser,
      });

      // Stream text output
      let response = "";
      for await (const chunk of textStream) {
        response += chunk;
        merge(result, { output: { response } });
        yield result;
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

    // Build adjacency list from edges
    const adjacencyList = new Map<string, string[]>();
    flow.props.nodes.forEach((node) => {
      adjacencyList.set(node.id, []);
    });
    flow.props.edges.forEach((edge) => {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    });

    // Find execution order using DFS
    const visited = new Set<string>();
    const executionOrder: string[] = [];
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      const node = flow.props.nodes.find((n) => n.id === nodeId);
      if (node) {
        if (node.type === "agent") {
          executionOrder.push(nodeId);
        }
        // Continue to next nodes
        const neighbors = adjacencyList.get(nodeId) || [];
        neighbors.forEach((neighbor) => dfs(neighbor));
      }
    };
    dfs(startNode.id);
    if (executionOrder.length === 0) {
      throw new Error("No agent nodes found in flow execution path");
    }

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

    // Execute each node, until end node
    for (const nodeId of executionOrder) {
      const node = flow.props.nodes.find((n) => n.id === nodeId);
      // Check agent node
      if (!node || node.type !== "agent") {
        continue;
      }

      // Execute agent
      const executeAgentNodeResult = executeAgentNode({
        agentId: new UniqueEntityID(node.id),
        contextWithVariables: {
          ...context,
          ...variables,
        },
        stopSignalByUser: stopSignalByUser,
      });
      for await (const result of executeAgentNodeResult) {
        // Accumulate agent output
        merge(variables, {
          [result.agentKey ?? ""]: result.output,
        });

        // Render content
        content = TemplateRenderer.render(flow.props.responseTemplate, {
          ...context,
          ...variables,
        });

        // Yield response
        yield {
          agentName: result.agentName,
          modelName: result.modelName,
          content: content,
          variables: variables,
        };
      }
    }

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
      };

      // Translate by language
      for (const lang of langs) {
        const translatedVariables = await translate(variables, lang);
        const translatedContent = TemplateRenderer.render(
          flow.props.responseTemplate,
          {
            ...context,
            ...translatedVariables,
          },
        );
        translations.set(lang, translatedContent);
      }

      // Done translate
      yield {
        agentName: "Translating...",
        content: content,
        variables: variables,
        translations: translations,
      };
    }
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
  };
  logger.debug("[Flow]", result);
  return result;
}

export {
  addMessage,
  addOptionToMessage,
  createMessage,
  executeFlow,
  makeContext,
  renderMessages,
};
