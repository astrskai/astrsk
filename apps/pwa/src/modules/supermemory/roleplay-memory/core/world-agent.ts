/**
 * Roleplay Memory System - World Agent
 *
 * Analyzes generated messages to detect actual participants and extract
 * character-specific world knowledge for memory distribution.
 *
 * Based on contracts/world-agent.contract.md and research.md
 */

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
import { generateObject } from "ai";
import { merge } from "lodash-es";
import { createOllama } from "ollama-ai-provider";
import { z } from "zod";
import type { WorldAgentInput, WorldAgentOutput } from "../../shared/types";
import { ApiSource } from "@/modules/api/domain";
import { OpenrouterProviderSort } from "@/modules/api/domain/api-connection";
import { logger } from "@/shared/utils/logger";
import { useAppStore } from "@/app/stores/app-store";
import {
  recordWorldAgentPrompt,
  recordWorldAgentOutput,
} from "../debug/debug-helpers";

/**
 * Default World Agent configuration
 * Uses AstrskAi provider with Gemini 2.5 Flash (lightweight, cost-efficient)
 */
const DEFAULT_WORLD_AGENT_MODEL = "openai-compatible:google/gemini-2.5-flash";
const WORLD_AGENT_TIMEOUT_MS = 20000; // 20 seconds (increased to account for API latency and structured output generation)

/**
 * Create AI SDK provider from API connection
 * Copied from session-play-service.ts to avoid circular dependency
 */
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

    case ApiSource.AstrskAi:
      provider = createOpenAI({
        apiKey: apiKey || "DUMMY", // AstrskAi uses JWT from headers
        baseURL: baseUrl,
      });
      break;

    default:
      throw new Error("Invalid API connection source");
  }
  return provider;
};

/**
 * Zod schema for World Agent structured output
 * Note: Uses character NAMES (not IDs) for better LLM understanding
 */
const worldAgentSchema = z.object({
  actualParticipants: z
    .array(z.string())
    .min(1)
    .describe(
      'Character NAMES who participated in this conversation (e.g., ["Yui", "Ren"])',
    ),
  worldContextUpdates: z
    .array(
      z.object({
        characterName: z
          .string()
          .describe('Character name (e.g., "Yui", "Ren")'),
        contextUpdate: z
          .string()
          .describe(
            "Brief 1-2 sentence context update from this character's perspective about what happened",
          ),
      }),
    )
    .describe(
      "Brief context updates for each participant describing what they learned or experienced",
    ),
  delta_time: z
    .number()
    .describe(
      "How much time passed: 0 = no time change, 1 = one time interval passed, 2 = two intervals, etc.",
    ),
});

/**
 * World Agent prompt template with few-shot examples
 * Based on research.md Section 5: World Agent Prompt Engineering
 */
function buildWorldAgentPrompt(input: WorldAgentInput): string {
  const {
    generatedMessage,
    recentMessages,
    dataStore,
    speakerCharacterId,
    speakerName,
    characterIdToName,
  } = input;

  // Format recent messages with character names (if available)
  const recentMessagesText =
    recentMessages.length > 0
      ? recentMessages
          .map((msg) => {
            // Try to extract character name from role or use role as-is
            const speaker =
              msg.role === "user"
                ? "User"
                : msg.role === "assistant"
                  ? speakerName
                  : msg.role;
            return `${speaker}: ${msg.content} (GameTime: ${msg.game_time})`;
          })
          .join("\n")
      : "No recent messages";

  // Format all participants with names and IDs for clarity
  const allParticipantsText =
    characterIdToName && Object.keys(characterIdToName).length > 0 && dataStore.participants
      ? dataStore.participants
          .map((id) => {
            const name = characterIdToName[id] || "Unknown";
            return `${name} (ID: ${id})`;
          })
          .join(", ")
      : (dataStore.participants || []).join(", ");

  // Get world memory context if available
  const worldMemoryContext =
    input.worldMemoryContext || "No recent world events";

  // Get accumulated world context if available
  const worldContextText =
    dataStore.worldContext || "No accumulated world context yet";

  // Format recent game time changes (last 3 messages with their times)
  const recentTimeChanges =
    recentMessages.length > 0
      ? recentMessages
          .map((msg, i) => {
            const timeChange = i > 0 && msg.game_time !== recentMessages[i - 1].game_time
              ? ` (TIME CHANGED: ${recentMessages[i - 1].game_time} → ${msg.game_time})`
              : "";
            return `- Message ${i + 1}: GameTime ${msg.game_time}${timeChange}`;
          })
          .join("\n")
      : "- No recent time changes";

  return `You are the World Agent for a multi-character roleplay session. Your task is to:
1. Analyze the message and determine which characters participated in this conversation
2. Update character-specific world context based on what happened
3. Determine if time has passed (delta_time)

IMPORTANT: Look at recent messages to understand the conversation context. If the previous message was from another character, and the current message is a response, BOTH characters are participants.

## Context
### World Memory (recent events)
${worldMemoryContext}

### Accumulated World Context (evolving character context)
${worldContextText}

### Recent Messages (for conversation context only)
${recentMessagesText}

### Recent Game Time History
${recentTimeChanges}

### Generated Message (⚠️ ANALYZE ONLY THIS MESSAGE FOR TIME PROGRESSION ⚠️)
Speaker: ${speakerName} (ID: ${speakerCharacterId})
Content: ${generatedMessage}

### Session Data
- Current Scene: ${dataStore.currentScene}
- All Participants: ${allParticipantsText}
- Total Participant Count: ${dataStore.participants?.length || 0}
- **Current Game Time: ${dataStore.game_time} ${dataStore.game_time_interval}**

## Task
Determine:
1. actualParticipants: Which characters were ACTUALLY in this conversation? (not just mentioned)
   - **SPECIAL CASE: If Total Participant Count = 2, and the message contains dialogue or direct response, BOTH participants are active in the conversation**
   - If someone is speaking TO another character (direct address, dialogue), both are participants
   - If someone is speaking ABOUT another character (mentioning them), only speaker is participant
   - Use character NAMES (not IDs) - e.g., ["Alice", "Bob"]
   - Speaker is ALWAYS included as minimum
2. worldContextUpdates: Brief context updates for each participant (1-2 sentences)
   - Each participant gets a brief summary of what happened from their perspective
   - Use character NAMES (not IDs) - e.g., "Alice", "Bob"
   - Focus on actions, decisions, and relationship changes
   - These updates will accumulate over the session
3. delta_time: How much time passed?
   - 0 = no time change (most common - use this unless explicitly stated)
   - 1 = one ${dataStore.game_time_interval} passed
   - 2+ = multiple intervals passed
   - Only set if message explicitly mentions time passing (e.g., "the next day", "3 hours later")

## Examples
Example 1 (Two characters talking TO each other):
Message: "Alice and I agreed to search for the sword together!"
Speaker: Bob (ID: bob-id)
All Participants: Alice (ID: alice-id), Bob (ID: bob-id), Charlie (ID: charlie-id)
Output:
{
  "actualParticipants": ["Alice", "Bob"],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You agreed with Bob to search for the Sacred Sword together"},
    {"characterName": "Bob", "contextUpdate": "You agreed with Alice to search for the Sacred Sword"}
  ],
  "delta_time": 0
}

Example 2 (Character speaking alone):
Message: "I'm heading to the tavern alone to think."
Speaker: Charlie (ID: charlie-id)
All Participants: Alice (ID: alice-id), Bob (ID: bob-id), Charlie (ID: charlie-id)
Output:
{
  "actualParticipants": ["Charlie"],
  "worldContextUpdates": [
    {"characterName": "Charlie", "contextUpdate": "You decided to go to the tavern alone to reflect on things"}
  ],
  "delta_time": 0
}

Example 3 (Direct dialogue between two characters):
Message: "Thanks for the compliment! Your observation skills are impressive too."
Speaker: Yui (ID: yui-id)
All Participants: Yui (ID: yui-id), Ren (ID: ren-id)
Output:
{
  "actualParticipants": ["Yui", "Ren"],
  "worldContextUpdates": [
    {"characterName": "Yui", "contextUpdate": "You thanked Ren for the compliment and complimented their observation skills"},
    {"characterName": "Ren", "contextUpdate": "Yui thanked you for your compliment and acknowledged your observation skills"}
  ],
  "delta_time": 0
}

Example 4 (Time progression with multiple characters):
Message: "The next morning, we all met at the Dragon's Lair as planned."
Speaker: Alice (ID: alice-id)
All Participants: Alice (ID: alice-id), Bob (ID: bob-id), Charlie (ID: charlie-id)
Output:
{
  "actualParticipants": ["Alice", "Bob", "Charlie"],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You met everyone at the Dragon's Lair the next morning as planned"},
    {"characterName": "Bob", "contextUpdate": "You met Alice and Charlie at the Dragon's Lair the next morning"},
    {"characterName": "Charlie", "contextUpdate": "You joined Alice and Bob at the Dragon's Lair the next morning"}
  ],
  "delta_time": 1
}

Example 5 (Multiple days passing):
Message: "Three days passed as we traveled through the desert."
Speaker: Bob (ID: bob-id)
All Participants: Alice (ID: alice-id), Bob (ID: bob-id), Charlie (ID: charlie-id)
Output:
{
  "actualParticipants": ["Alice", "Bob", "Charlie"],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You spent three days traveling through the desert with the party"},
    {"characterName": "Bob", "contextUpdate": "You led the party through three days of desert travel"},
    {"characterName": "Charlie", "contextUpdate": "You traveled with the group through the desert for three days"}
  ],
  "delta_time": 3
}

Example 6 (NO time progression despite recent time change):
### Recent Game Time History
- Message 1: GameTime 5 (TIME CHANGED: 4 → 5)
- Message 2: GameTime 5

Message: "That's a good observation! I didn't think of it that way."
Speaker: Alice (ID: alice-id)
All Participants: Alice (ID: alice-id), Bob (ID: bob-id)
Current Game Time: 5 Day
Output:
{
  "actualParticipants": ["Alice", "Bob"],
  "worldContextUpdates": [
    {"characterName": "Alice", "contextUpdate": "You acknowledged Bob's observation and admitted you hadn't considered that perspective"},
    {"characterName": "Bob", "contextUpdate": "Alice appreciated your observation and acknowledged it helped her see things differently"}
  ],
  "delta_time": 0
}
⚠️ IMPORTANT: Even though Recent Game Time History shows time changed from 4→5, THIS message doesn't mention time passing, so delta_time = 0

IMPORTANT:
- Use exact character NAMES from the participants list (not IDs!)
- actualParticipants MUST include at least the speaker name
- worldContextUpdates must have entries for each participant
- delta_time is 0 unless THE CURRENT MESSAGE EXPLICITLY mentions time passing (ignore past time changes in history)
- Recent Game Time History is ONLY for context - do NOT increment time based on history alone`;
}

/**
 * Create fallback output when World Agent fails
 * Contract: Always include speaker, preserve previous context if available, no time change
 */
function createFallbackOutput(
  speakerCharacterId: string,
  speakerName: string,
  previousWorldContext?: string,
): WorldAgentOutput {
  // If we have previous world context, preserve it for this character
  const worldContextUpdates = [];

  if (previousWorldContext) {
    // Extract this character's previous context from accumulated context
    const characterContextMatch = previousWorldContext.match(
      new RegExp(`\\[${speakerName}\\]\\n([\\s\\S]*?)(?=\\n\\n\\[|$)`)
    );

    if (characterContextMatch) {
      // Preserve the previous context as-is (no updates since World Agent failed)
      worldContextUpdates.push({
        characterName: speakerName,
        contextUpdate: characterContextMatch[1].trim(),
      });
    }
  }

  return {
    actualParticipants: [speakerName], // Use speaker name
    worldContextUpdates,
    delta_time: 0,
  };
}

/**
 * Validate World Agent output structure
 */
function validateWorldAgentOutput(
  output: any,
  speakerName: string,
): output is WorldAgentOutput {
  // Check required fields
  if (!output || typeof output !== "object") return false;
  if (!Array.isArray(output.actualParticipants)) return false;
  if (!Array.isArray(output.worldContextUpdates)) return false;
  if (typeof output.delta_time !== "number") return false;

  // actualParticipants must be non-empty
  if (output.actualParticipants.length === 0) return false;

  // actualParticipants must include speaker name (case-insensitive, whitespace-trimmed)
  const normalizedSpeakerName = speakerName.trim().toLowerCase();
  const normalizedParticipants = output.actualParticipants.map((p: string) =>
    p.trim().toLowerCase(),
  );
  if (!normalizedParticipants.includes(normalizedSpeakerName)) return false;

  // delta_time must be non-negative
  if (output.delta_time < 0) return false;

  return true;
}

/**
 * Execute World Agent to analyze message and detect participants
 *
 * Contract: contracts/world-agent.contract.md
 * - MUST return non-empty actualParticipants (minimum: speaker)
 * - MUST provide character-specific world knowledge
 * - MUST fallback gracefully on errors (no throws)
 *
 * @param input - World Agent input with message context
 * @returns World Agent output with participants and knowledge
 */
export async function executeWorldAgent(
  input: WorldAgentInput,
): Promise<WorldAgentOutput> {
  try {
    // Build prompt with few-shot examples
    const prompt = buildWorldAgentPrompt(input);

    // Record debug event - World Agent prompt
    recordWorldAgentPrompt({
      speakerName: input.speakerName,
      generatedMessage: input.generatedMessage,
      prompt,
      recentMessages: input.recentMessages,
      dataStore: input.dataStore,
      worldMemoryContext: input.worldMemoryContext,
      worldMemoryQuery: input.worldMemoryQuery,
    });

    // Always use Convex backend with JWT authentication
    const [providerSource, modelId] = DEFAULT_WORLD_AGENT_MODEL.split(":");
    const astrskBaseUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/serveModel/${providerSource}`;

    const provider = createOpenAI({
      apiKey: "DUMMY", // AstrskAi uses JWT from headers
      baseURL: astrskBaseUrl,
    });

    const model = provider(modelId);

    // Get JWT for AstrskAi authentication
    const jwt = useAppStore.getState().jwt;
    const headers = jwt
      ? {
          Authorization: `Bearer ${jwt}`,
          "x-astrsk-credit-log": JSON.stringify({
            feature: "world-agent",
            sessionId: input.sessionId,
          }),
        }
      : undefined;

    // Execute LLM call with timeout (2 seconds max per contract)
    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      WORLD_AGENT_TIMEOUT_MS,
    );

    try {
      const { object } = await generateObject({
        model,
        schema: worldAgentSchema,
        prompt,
        abortSignal: abortController.signal,
        temperature: 0.7,
        ...(headers && { headers }),
      });

      clearTimeout(timeoutId);

      // Type assertion for the generated object
      const typedObject = object as z.infer<typeof worldAgentSchema>;

      // Validate worldContextUpdates array (name-based)
      const worldContextUpdates = Array.isArray(typedObject.worldContextUpdates)
        ? typedObject.worldContextUpdates.filter(
            (item) => item.characterName && item.contextUpdate,
          )
        : [];

      const output = {
        actualParticipants: typedObject.actualParticipants || [], // Character names
        worldContextUpdates,
        delta_time: typedObject.delta_time || 0,
      };

      // Validate output structure
      const isValid = validateWorldAgentOutput(output, input.speakerName);

      if (!isValid) {
        // Log validation failure details
        logger.warn("[World Agent] Validation failed:", {
          speakerName: input.speakerName,
          actualParticipants: output.actualParticipants,
          worldContextUpdates: output.worldContextUpdates,
          delta_time: output.delta_time,
          rawLLMOutput: typedObject,
        });

        const fallbackOutput = createFallbackOutput(
          input.speakerCharacterId,
          input.speakerName,
          input.dataStore.worldContext,
        );

        // Record debug event - World Agent output (fallback)
        recordWorldAgentOutput({
          actualParticipants: fallbackOutput.actualParticipants,
          worldContextUpdates: fallbackOutput.worldContextUpdates,
          delta_time: fallbackOutput.delta_time,
          rawOutput: {
            fallback: true,
            reason: "validation_failed",
            llmResponse: typedObject,
          },
        });

        return fallbackOutput;
      }

      // Record debug event - World Agent output (success)
      recordWorldAgentOutput({
        actualParticipants: output.actualParticipants,
        worldContextUpdates: output.worldContextUpdates,
        delta_time: output.delta_time,
        rawOutput: typedObject,
      });

      return output;
    } catch (llmError) {
      clearTimeout(timeoutId);

      // Check if timeout
      if (abortController.signal.aborted) {
        logger.warn("[World Agent] LLM timeout (>2s), using fallback");
      }

      const fallbackOutput = createFallbackOutput(input.speakerCharacterId, input.speakerName, input.dataStore.worldContext);

      // Record debug event - World Agent output (timeout fallback)
      recordWorldAgentOutput({
        actualParticipants: fallbackOutput.actualParticipants,
        worldContextUpdates: fallbackOutput.worldContextUpdates,
        delta_time: fallbackOutput.delta_time,
        rawOutput: { fallback: true, reason: "timeout" },
      });

      return fallbackOutput;
    }
  } catch (error) {
    // Catch-all for unexpected errors
    logger.error("[World Agent] Unexpected error:", error);
    const fallbackOutput = createFallbackOutput(input.speakerCharacterId, input.speakerName, input.dataStore.worldContext);

    // Record debug event - World Agent output (error fallback)
    recordWorldAgentOutput({
      actualParticipants: fallbackOutput.actualParticipants,
      worldContextUpdates: fallbackOutput.worldContextUpdates,
      delta_time: fallbackOutput.delta_time,
      rawOutput: { fallback: true, reason: "error", error: String(error) },
    });

    return fallbackOutput;
  }
}
